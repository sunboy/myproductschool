#!/usr/bin/env npx tsx
/**
 * Casebook Loop — raw session -> cc_expert_sessions draft converter.
 *
 * TEST FIXTURE ONLY, NOT REAL CASE CONTENT: scripts/casebook/fixtures/sample-raw-session.jsonl
 * is a synthetic transcript authored to exercise this script offline. It is not a real
 * Claude Code analytics session and must never be treated as authored case content.
 *
 * Converts a RAW Claude Code analytics session transcript (JSONL, one event per line)
 * into the `cc_expert_sessions` row shape (see supabase/migrations/20260826100000_casebook_content.sql):
 *
 *   { id, case_id, duration_s, transcript, moves, decision_points, is_published }
 *
 * This script is OFFLINE and FILE-ONLY:
 *   - Never touches Supabase / the live DB (no MCP calls, no supabase-js client).
 *   - Never calls any LLM API (no ANTHROPIC_API_KEY usage, no @anthropic-ai/sdk import).
 *   - Writes exactly one JSON file to --out. Nothing else.
 *
 * Decision points are SCAFFOLDED, not authored: this script identifies candidate
 * decision moments (heuristically, from tool/query boundaries and assistant turns
 * that follow a query result) and emits skeletons with all 4 required option tiers
 * present but marked `needsAuthoring: true` and stub text. A human or a Claude Code
 * sub-agent (never an API call) must fill these in before the case can be marked
 * `is_published`. The output's top-level `needsAuthoring` count and each decision
 * point's `needsAuthoring` flag make this state machine-detectable so
 * validate-case.ts can refuse to pass a half-authored case.
 *
 * Usage:
 *   npx tsx scripts/casebook/annotate-session.ts <case-id> --in <raw-transcript-path> --out <json-path> [--stats] [--session-id <id>]
 *
 * Example:
 *   npx tsx scripts/casebook/annotate-session.ts tuesday-dip \
 *     --in scripts/casebook/fixtures/sample-raw-session.jsonl \
 *     --out /tmp/tuesday-dip-expert-v1.draft.json \
 *     --stats
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  caseId: string
  inPath: string
  outPath: string
  stats: boolean
  sessionId: string
}

function parseArgs(argv: string[]): CliArgs {
  const positional = argv.filter((a) => !a.startsWith('--'))
  const caseId = positional[0]
  if (!caseId) {
    throw new UsageError('Missing required <case-id> positional argument.')
  }

  function flagValue(name: string): string | null {
    const i = argv.indexOf(name)
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null
  }

  const inPath = flagValue('--in')
  const outPath = flagValue('--out')
  if (!inPath) throw new UsageError('Missing required --in <raw-transcript-path>.')
  if (!outPath) throw new UsageError('Missing required --out <json-path>.')

  const stats = argv.includes('--stats')
  const sessionId = flagValue('--session-id') ?? `${caseId}-expert-v1`

  return { caseId, inPath, outPath, stats, sessionId }
}

class UsageError extends Error {}

// ---------------------------------------------------------------------------
// ANSI stripping — established repo pattern (ANSI-stripped tail regex,
// see project_cc_refresh_reconnect_and_detection memory / cc-sandbox terminal output).
// Strip before any parsing so escape codes never leak into transcript text,
// SQL extraction, or the diff comparisons the validator runs downstream.
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\x1b\[[0-9;]*[a-zA-Z]/g

function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '')
}

// ---------------------------------------------------------------------------
// Raw transcript types (input shape — one JSON object per line)
// ---------------------------------------------------------------------------

type RawRole = 'user' | 'assistant' | 'tool'

interface RawEvent {
  ts: number // seconds from session start
  role: RawRole
  text: string
}

function isRawRole(v: unknown): v is RawRole {
  return v === 'user' || v === 'assistant' || v === 'tool'
}

function parseRawLine(line: string, lineNo: number): RawEvent {
  // This is OUR OWN fixture/CLI-input JSON, not model-generated output, so a
  // direct JSON.parse is correct here per repo convention — the extract-json
  // helper is reserved for parsing LLM completions.
  let obj: unknown
  try {
    obj = JSON.parse(line)
  } catch (err) {
    throw new Error(`Line ${lineNo}: invalid JSON — ${(err as Error).message}`)
  }
  if (typeof obj !== 'object' || obj === null) {
    throw new Error(`Line ${lineNo}: expected a JSON object`)
  }
  const rec = obj as Record<string, unknown>
  if (typeof rec.ts !== 'number') {
    throw new Error(`Line ${lineNo}: missing/invalid numeric "ts"`)
  }
  if (!isRawRole(rec.role)) {
    throw new Error(`Line ${lineNo}: "role" must be one of user|assistant|tool`)
  }
  if (typeof rec.text !== 'string') {
    throw new Error(`Line ${lineNo}: missing/invalid string "text"`)
  }
  return { ts: rec.ts, role: rec.role, text: stripAnsi(rec.text) }
}

function loadRawTranscript(path: string): RawEvent[] {
  const raw = readFileSync(path, 'utf-8')
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const events = lines.map((line, i) => parseRawLine(line, i + 1))
  // Sort defensively by ts — annotation logic below assumes chronological order.
  events.sort((a, b) => a.ts - b.ts)
  return events
}

// ---------------------------------------------------------------------------
// Output types — mirrors cc_expert_sessions JSONB columns exactly.
// ---------------------------------------------------------------------------

interface TranscriptEntry {
  t: number
  role: RawRole
  text: string
  annotation?: { title: string; body: string }
}

interface MoveEntry {
  id: string
  t: number
  label: string
  description: string
}

/** Quality tiers reused verbatim from the autopsy system. NEVER an is_correct boolean. */
type OptionQuality = 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'

interface DecisionOption {
  id: string
  text: string
  quality: OptionQuality
  explanation: string
}

interface DecisionPoint {
  id: string
  t: number
  question: string
  options: DecisionOption[]
  expert_option_id: string
  expert_move_id: string
  /** Machine-detectable authoring gate. true until a human/sub-agent fills in real content. */
  needsAuthoring: boolean
}

interface ExtractedQuery {
  t: number
  sql: string
  expected_result_digest?: string
  /** True when the query lacks a deterministic ORDER BY; validator must compare as a SET. */
  nondeterministic_order: boolean
}

interface ExpertSessionDraft {
  id: string
  case_id: string
  duration_s: number
  transcript: TranscriptEntry[]
  moves: MoveEntry[]
  decision_points: DecisionPoint[]
  is_published: boolean
  // Non-DB-column extras carried in the draft file for the validator/annotation pass.
  queries: ExtractedQuery[]
  needsAuthoring: number
  annotationHandoff: string
}

// ---------------------------------------------------------------------------
// SQL / BQ query extraction
// ---------------------------------------------------------------------------

/**
 * Extracts SQL/BQ statements from a (ANSI-already-stripped) tool-turn text blob.
 * Handles two tool-turn shapes:
 *   1. The `$ bq query` CLI-echo prefix (legacy fixture form) followed by bare SQL.
 *   2. The real Claude Code MCP tool-call form:
 *        [tool_use] mcp__bigquery__bq_query
 *        sql:
 *
 *        SELECT ...
 *      i.e. a `[tool_use] <toolname>` line, then a `sql:`/`query:` label line
 *      (optionally followed by a blank line) before the actual statement.
 * Splits on statement-terminating semicolons; each statement is trimmed and
 * re-checked for a leading SELECT/WITH/INSERT/UPDATE/DELETE keyword (allowing
 * a leading `--` line-comment, which real analyst queries sometimes open
 * with) before being kept. The matched SQL substring itself is never
 * rewritten — only the non-SQL preamble lines are stripped off the front.
 */
function extractQueriesFromText(text: string): string[] {
  // Drop a leading shell-echo line like "$ bq query" so it doesn't get glued
  // onto the SQL as leading noise. (Legacy fixture form.)
  let body = text.replace(/^\$\s*(?:bq|psql|sqlite3)\b[^\n]*\n/i, '')

  // Drop a leading MCP tool-call preamble: a `[tool_use] <toolname>` line,
  // then a `sql:`/`query:` label line, then an optional blank line — this is
  // what real Claude Code transcripts emit for BigQuery/SQL tool calls.
  body = body.replace(/^\[tool_use\][^\n]*\n(?:sql|query)\s*:[^\n]*\n\n?/i, '')

  // A candidate may legitimately open with a `--` line comment (seen in real
  // analyst queries); skip past it only for the purpose of the keyword test,
  // never for the text we keep.
  const SQL_KEYWORD = /^(?:--[^\n]*\n\s*)*(SELECT|WITH|INSERT|UPDATE|DELETE)\b/i
  const candidates = body
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && SQL_KEYWORD.test(s))

  return candidates.map((sql) => `${sql};`)
}

const ORDER_BY_PATTERN = /\border\s+by\b/i

function toExtractedQuery(sql: string, t: number): ExtractedQuery {
  return {
    t,
    sql,
    nondeterministic_order: !ORDER_BY_PATTERN.test(sql),
  }
}

// ---------------------------------------------------------------------------
// Move + decision-point scaffolding heuristics
// ---------------------------------------------------------------------------

/**
 * A "move" candidate is any assistant turn — each assistant turn represents a
 * reasoning/action step in the investigation. We label each move generically;
 * a human annotation pass should overwrite `label`/`description` with real
 * move names (e.g. "Isolate by payment provider").
 */
function buildMoves(events: RawEvent[]): MoveEntry[] {
  let n = 0
  return events
    .filter((e) => e.role === 'assistant')
    .map((e) => {
      n += 1
      return {
        id: `move-${n}`,
        t: e.ts,
        label: `Move ${n} (needs authoring)`,
        description: summarize(e.text),
      }
    })
}

function summarize(text: string, maxLen = 140): string {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  return collapsed.length > maxLen ? `${collapsed.slice(0, maxLen - 1)}…` : collapsed
}

const STUB_OPTION_TEXT: Record<OptionQuality, string> = {
  best: '[NEEDS AUTHORING] Best option — should reference a source-specific data point.',
  good_but_incomplete: '[NEEDS AUTHORING] Good but incomplete option.',
  surface: '[NEEDS AUTHORING] Surface-level option.',
  plausible_wrong: '[NEEDS AUTHORING] Plausible but wrong option.',
}

function stubOptions(decisionId: string): DecisionOption[] {
  const tiers: OptionQuality[] = ['best', 'good_but_incomplete', 'surface', 'plausible_wrong']
  return tiers.map((quality, i) => ({
    id: `${decisionId}-opt-${String.fromCharCode(97 + i)}`, // a, b, c, d
    text: STUB_OPTION_TEXT[quality],
    quality,
    explanation: '[NEEDS AUTHORING] Explanation revealed after submission.',
  }))
}

/**
 * Candidate decision moments: an assistant turn that immediately follows a
 * tool-turn (i.e. the assistant is reacting to a query result — a natural
 * "what would you conclude / do next" pause point). We evenly sample down to
 * 4-6 points across the session per the plan's target, preferring later
 * moments (more informed decisions) when there are more candidates than slots.
 */
function buildDecisionPoints(events: RawEvent[], moves: MoveEntry[]): DecisionPoint[] {
  const candidates: RawEvent[] = []
  for (let i = 1; i < events.length; i++) {
    if (events[i].role === 'assistant' && events[i - 1].role === 'tool') {
      candidates.push(events[i])
    }
  }

  const TARGET_MIN = 4
  const TARGET_MAX = 6
  let selected = candidates
  if (candidates.length > TARGET_MAX) {
    // Evenly sample TARGET_MAX candidates across the full list.
    const step = (candidates.length - 1) / (TARGET_MAX - 1)
    const picked = new Set<number>()
    for (let k = 0; k < TARGET_MAX; k++) {
      picked.add(Math.round(k * step))
    }
    selected = candidates.filter((_, idx) => picked.has(idx))
  }

  return selected.map((e, i) => {
    const id = `dp-${i + 1}`
    const options = stubOptions(id)
    const bestOption = options.find((o) => o.quality === 'best')!
    const nearestMove = moves.find((m) => m.t === e.ts) ?? moves[0]
    return {
      id,
      t: e.ts,
      question: `[NEEDS AUTHORING] What should the investigator conclude/do at t=${e.ts}s?`,
      options,
      expert_option_id: bestOption.id,
      expert_move_id: nearestMove ? nearestMove.id : 'move-1',
      needsAuthoring: true,
    }
  })
}

// Guard: if candidate count is below target minimum, we still emit what we
// found rather than fabricating moments out of thin air — the plan explicitly
// says the script scaffolds from the transcript, it does not invent from
// nothing. The `needsAuthoring` count / annotationHandoff string will flag
// the shortfall to the human/sub-agent pass.
function decisionPointCountWarning(count: number): string | null {
  const TARGET_MIN = 4
  const TARGET_MAX = 6
  if (count < TARGET_MIN) {
    return `Only ${count} decision-point candidate(s) found (target ${TARGET_MIN}-${TARGET_MAX}). The annotation pass may need to split an existing candidate or the source transcript may be too short.`
  }
  return null
}

// ---------------------------------------------------------------------------
// Transcript assembly
// ---------------------------------------------------------------------------

function buildTranscript(events: RawEvent[]): TranscriptEntry[] {
  return events.map((e) => ({ t: e.ts, role: e.role, text: e.text }))
}

// ---------------------------------------------------------------------------
// Stats reporting (--stats flag)
// ---------------------------------------------------------------------------

function printStats(events: RawEvent[], queries: ExtractedQuery[], decisionPoints: DecisionPoint[]) {
  const byRole: Record<RawRole, number> = { user: 0, assistant: 0, tool: 0 }
  for (const e of events) byRole[e.role] += 1

  const duration = events.length > 0 ? events[events.length - 1].ts : 0
  const nondeterministicCount = queries.filter((q) => q.nondeterministic_order).length

  console.log('--- annotate-session stats ---')
  console.log(`entries total:        ${events.length}`)
  console.log(`  user:                ${byRole.user}`)
  console.log(`  assistant:           ${byRole.assistant}`)
  console.log(`  tool:                ${byRole.tool}`)
  console.log(`duration_s:            ${duration}`)
  console.log(`queries detected:      ${queries.length}`)
  console.log(`  nondeterministic:    ${nondeterministicCount}`)
  console.log(`decision points:       ${decisionPoints.length}`)
  const warning = decisionPointCountWarning(decisionPoints.length)
  if (warning) console.log(`  WARNING: ${warning}`)
  console.log('-------------------------------')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2))
  const inPath = resolve(args.inPath)
  const outPath = resolve(args.outPath)

  const events = loadRawTranscript(inPath)
  if (events.length === 0) {
    throw new Error(`No events parsed from ${inPath} — is the file empty or malformed?`)
  }

  const transcript = buildTranscript(events)
  const moves = buildMoves(events)
  const decisionPoints = buildDecisionPoints(events, moves)

  const queries: ExtractedQuery[] = []
  for (const e of events) {
    if (e.role !== 'tool') continue
    for (const sql of extractQueriesFromText(e.text)) {
      queries.push(toExtractedQuery(sql, e.ts))
    }
  }

  // Derive duration from the raw input events, which carry `ts` (RawEvent has no
  // `.t` field — that name only exists on the OUTPUT shapes: TranscriptEntry,
  // MoveEntry, DecisionPoint, ExtractedQuery). Handles the empty-input edge case
  // as 0, though main() already guards against empty input above with a throw.
  const durationS = events.length > 0 ? events[events.length - 1].ts : 0

  const needsAuthoringCount = decisionPoints.filter((dp) => dp.needsAuthoring).length

  const annotationHandoff = [
    `Casebook Loop annotation handoff for case "${args.caseId}".`,
    '',
    `This draft was generated by scripts/casebook/annotate-session.ts and contains`,
    `${needsAuthoringCount} decision point(s) marked needsAuthoring: true. Each has 4`,
    'stubbed options (one per quality tier: best, good_but_incomplete, surface,',
    'plausible_wrong) that need real question text, option text, and explanations.',
    '',
    'Fill these in via a Claude Code sub-agent (no Anthropic API calls — this repo',
    'bills the API key by token and bulk content work must use Claude Code',
    'sub-agents instead, per CLAUDE.md). Do NOT introduce an is_correct boolean.',
    'The option whose quality is "best" must stay referenced by expert_option_id.',
    'Every decision point must keep a valid expert_move_id from the moves array.',
    '',
    'Once every decision point has needsAuthoring: false, the validator',
    '(validate-case.ts) can proceed to check the extracted `queries` against the',
    'seed warehouse and confirm 4-6 fully authored decision points before this',
    'session can be marked is_published.',
  ].join('\n')

  const draft: ExpertSessionDraft = {
    id: args.sessionId,
    case_id: args.caseId,
    duration_s: durationS,
    transcript,
    moves,
    decision_points: decisionPoints,
    is_published: false,
    queries,
    needsAuthoring: needsAuthoringCount,
    annotationHandoff,
  }

  writeFileSync(outPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf-8')

  if (args.stats) {
    printStats(events, queries, decisionPoints)
  }

  console.log(`Wrote draft cc_expert_sessions row to ${outPath}`)
  console.log(`(FILE ONLY — no database write occurred, no LLM API call was made.)`)
}

try {
  main()
} catch (err) {
  if (err instanceof UsageError) {
    console.error(`Usage error: ${err.message}`)
    console.error('')
    console.error(
      'Usage: npx tsx scripts/casebook/annotate-session.ts <case-id> --in <raw-transcript-path> --out <json-path> [--stats] [--session-id <id>]'
    )
    process.exit(1)
  }
  console.error(`Failed: ${(err as Error).message}`)
  process.exit(1)
}
