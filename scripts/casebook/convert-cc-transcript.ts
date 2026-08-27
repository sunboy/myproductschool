#!/usr/bin/env npx tsx
/**
 * Casebook Loop — native Claude Code transcript -> flat annotate-session.ts input converter.
 *
 * WHY THIS EXISTS
 * ----------------
 * scripts/casebook/annotate-session.ts consumes a FLAT transcript format, one JSON
 * object per line, shaped exactly as:
 *
 *   { "ts": <seconds from session start, integer>, "role": "user"|"assistant"|"tool", "text": "..." }
 *
 * (see scripts/casebook/fixtures/sample-raw-session.jsonl for the canonical example).
 *
 * But the actual artifact the sandbox captures for a Claude Code session is the
 * NATIVE Claude Code transcript format written under ~/.claude/projects/<project>/<sessionId>.jsonl.
 * That format is much richer and much noisier: every line is a JSON object with a
 * `type` field (`user`, `assistant`, `system`, `summary`, `attachment`, `mode`,
 * `permission-mode`, `last-prompt`, `agent-setting`, `bridge-session`, `ai-title`,
 * `agent-name`, `queue-operation`, `file-history-snapshot`, `file-history-delta`,
 * `atis-latch`, `frame-link`, ...) — most of which carry zero conversational content.
 * `user`/`assistant` entries themselves nest Anthropic Messages-API content blocks
 * (`text`, `tool_use`, `tool_result`, and occasionally `thinking`) rather than a
 * flat string.
 *
 * This script bridges the two formats. annotate-session.ts is deliberately NOT
 * modified — its input contract is reviewed and fixture-tested. This script adapts
 * the real, messy Claude Code artifact down to the flat shape it already expects.
 *
 * REAL-FILE FINDINGS THIS SCRIPT IS BUILT AGAINST (verified against transcripts
 * under ~/.claude/projects/ (per-project dirs, one .jsonl per session) on this
 * machine — not guessed from a spec):
 *
 *   - `type: "user"` with `message.content` as a plain STRING           -> role "user"
 *   - `type: "user"` with `message.content` as an ARRAY of blocks where a block
 *     has `type: "tool_result"`                                        -> role "tool"
 *     (tool_result.content is itself either a string, or an array of
 *     `{ type: "text", text }` blocks — both are handled)
 *   - `type: "assistant"` with `message.content` array containing
 *     `{ type: "text", text }` blocks                                  -> role "assistant"
 *   - `type: "assistant"` with `message.content` array containing
 *     `{ type: "tool_use", name, input }` blocks                       -> role "tool"
 *     (rendered as the tool name + a readable rendering of its input;
 *     `Bash` tool_use commonly carries a SQL string inside `input.command`,
 *     which we preserve byte-for-byte, unmodified)
 *   - `type: "assistant"` `{ type: "thinking" }` blocks                 -> SKIPPED
 *     (internal reasoning, never meant to be user-visible narrative)
 *   - `type: "system"`, `"summary"`, `"attachment"`, `"mode"`,
 *     `"permission-mode"`, `"last-prompt"`, `"agent-setting"`,
 *     `"bridge-session"`, `"ai-title"`, `"agent-name"`, `"queue-operation"`,
 *     `"file-history-snapshot"`, `"file-history-delta"`, `"atis-latch"`,
 *     `"frame-link"`, and any other non-`user`/`assistant` type            -> SKIPPED
 *     (harness bookkeeping / UI state, never conversational content — a
 *     `system` entry with `subtype: "compact_boundary"` etc. carries no
 *     turn-level narrative a case reader should see)
 *   - `isSidechain: true` entries                                       -> SKIPPED
 *     (forked/sub-agent messages that run in parallel to the main thread;
 *     including them would interleave a different conversation into the
 *     narrative timeline)
 *   - Rows with no `sessionId` at all (many of the metadata types above
 *     never carry one) are excluded from session-id disambiguation and are
 *     skipped regardless of which --session-id was requested.
 *
 * SESSION-ID DISAMBIGUATION
 * --------------------------
 * A single transcript file (or directory) can contain MULTIPLE Claude Code
 * sessions — either because a reconnect minted a new sessionId mid-file, or
 * because multiple session files were concatenated upstream. This mirrors the
 * disambiguation rule in docs/notes/casebook-phase0-tasks.md:
 *
 *   --session-id <id>   Filter to exactly this sessionId. Any line belonging
 *                        to a different sessionId is skipped.
 *   (omitted)            If the file contains exactly ONE distinct sessionId
 *                        (across lines that carry one at all), use it. If it
 *                        contains MORE THAN ONE, FAIL LOUDLY listing every
 *                        distinct id found — never silently mix sessions.
 *
 * TIMESTAMPS
 * ----------
 * Native events carry `timestamp` as an ISO-8601 string (e.g.
 * "2026-08-23T05:17:25.276Z"), confirmed across every sampled transcript. `ts`
 * in the flat output is computed as an INTEGER number of seconds elapsed since
 * the first INCLUDED event's timestamp (i.e. the first event is always ts=0).
 * If an included event is missing a usable timestamp (should not happen in
 * practice, but the harness format is not contractually guaranteed), this
 * script falls back to a monotonically increasing 1-second-per-event counter
 * for that event onward and prints a warning — never crashes and never
 * fabricates a real-looking timestamp.
 *
 * SQL PRESERVATION (CRITICAL)
 * ----------------------------
 * A downstream validator scans the transcript for time-bomb SQL patterns
 * (CURRENT_DATE, CURRENT_TIMESTAMP, NOW(), date('now')) and Phase-1 requires
 * expert-transcript queries to reproduce byte-for-byte against the seed
 * warehouse. Tool-use inputs are rendered as human-readable text for the
 * `tool` role, but ANY string field that looks like it carries a SQL/shell
 * query (`command`, `query`, `sql`, or the fallback whole-input dump) is
 * emitted VERBATIM — no truncation, no whitespace collapsing, no re-escaping,
 * no reformatting. Only non-SQL-bearing, very large JSON blobs unrelated to
 * queries (e.g. giant file-read tool_use inputs) are eligible for truncation,
 * and this script does not truncate any Bash/SQL-shaped input regardless of
 * size.
 *
 * THIS SCRIPT IS OFFLINE AND FILE-ONLY
 * --------------------------------------
 *   - No network calls of any kind.
 *   - No Supabase / BigQuery client usage.
 *   - No LLM/Anthropic API calls (this is structured JSON parsing, not model
 *     output interpretation — a plain JSON.parse per line is correct here,
 *     per repo convention; the repo's extract-json helper is reserved for
 *     parsing LLM completions).
 *   - Reads exactly one input file, writes exactly one output file.
 *
 * USAGE
 * -----
 *   npx tsx scripts/casebook/convert-cc-transcript.ts \
 *     --in <native-claude-code-transcript.jsonl> \
 *     --out <flat-transcript.jsonl> \
 *     [--session-id <id>] \
 *     [--stats]
 *
 * The --out file can then be fed directly into annotate-session.ts:
 *
 *   npx tsx scripts/casebook/annotate-session.ts <case-id> \
 *     --in <flat-transcript.jsonl> --out <draft.json> --stats
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  inPath: string
  outPath: string
  sessionId: string | null
  stats: boolean
}

class UsageError extends Error {}

function parseArgs(argv: string[]): CliArgs {
  function flagValue(name: string): string | null {
    const i = argv.indexOf(name)
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null
  }

  const inPath = flagValue('--in')
  const outPath = flagValue('--out')
  if (!inPath) throw new UsageError('Missing required --in <native-transcript-path>.')
  if (!outPath) throw new UsageError('Missing required --out <flat-jsonl-path>.')

  const sessionId = flagValue('--session-id')
  const stats = argv.includes('--stats')

  return { inPath, outPath, sessionId, stats }
}

// ---------------------------------------------------------------------------
// ANSI stripping — own copy, mirrors the pattern in annotate-session.ts.
// Native tool output (e.g. terminal-echoed command output) can carry color
// codes; strip them before they leak into transcript text or SQL extraction
// happening downstream in annotate-session.ts.
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\x1b\[[0-9;]*[a-zA-Z]/g

function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '')
}

// ---------------------------------------------------------------------------
// Native transcript types (input shape — one JSON object per line, as written
// by the Claude Code CLI under ~/.claude/projects/<project>/<sessionId>.jsonl)
// ---------------------------------------------------------------------------

interface NativeContentBlockText {
  type: 'text'
  text: string
}

interface NativeContentBlockToolUse {
  type: 'tool_use'
  id?: string
  name: string
  input?: Record<string, unknown>
}

interface NativeContentBlockToolResult {
  type: 'tool_result'
  tool_use_id?: string
  content?: string | Array<{ type: string; text?: string }>
  is_error?: boolean
}

interface NativeContentBlockThinking {
  type: 'thinking'
  thinking?: string
}

type NativeContentBlock =
  | NativeContentBlockText
  | NativeContentBlockToolUse
  | NativeContentBlockToolResult
  | NativeContentBlockThinking
  | { type: string; [k: string]: unknown }

interface NativeMessage {
  role?: string
  content?: string | NativeContentBlock[]
}

interface NativeEvent {
  type?: string
  message?: NativeMessage
  sessionId?: string
  timestamp?: string
  isSidechain?: boolean
  [k: string]: unknown
}

// ---------------------------------------------------------------------------
// Flat output types — MUST match annotate-session.ts's RawEvent contract
// exactly. Do not add fields; annotate-session.ts's parser only reads
// ts/role/text and would silently ignore (not reject) extras, but the fixture
// format has exactly these three keys, so we match it precisely.
// ---------------------------------------------------------------------------

type FlatRole = 'user' | 'assistant' | 'tool'

interface FlatEvent {
  ts: number
  role: FlatRole
  text: string
}

// ---------------------------------------------------------------------------
// Loading + line parsing
// ---------------------------------------------------------------------------

function loadNativeLines(path: string): NativeEvent[] {
  const raw = readFileSync(path, 'utf-8')
  const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  const events: NativeEvent[] = []
  lines.forEach((line, i) => {
    let obj: unknown
    try {
      obj = JSON.parse(line)
    } catch (err) {
      throw new Error(`Line ${i + 1}: invalid JSON — ${(err as Error).message}`)
    }
    if (typeof obj !== 'object' || obj === null) {
      throw new Error(`Line ${i + 1}: expected a JSON object`)
    }
    events.push(obj as NativeEvent)
  })
  return events
}

// ---------------------------------------------------------------------------
// Session-id disambiguation
// ---------------------------------------------------------------------------

function resolveSessionId(events: NativeEvent[], requested: string | null): string {
  if (requested) return requested

  const distinctIds = new Set<string>()
  for (const e of events) {
    if (typeof e.sessionId === 'string' && e.sessionId.length > 0) {
      distinctIds.add(e.sessionId)
    }
  }

  if (distinctIds.size === 0) {
    throw new Error(
      'No sessionId found on any line of the input file. Pass --session-id explicitly, or verify this is a genuine Claude Code transcript.'
    )
  }
  if (distinctIds.size > 1) {
    const list = [...distinctIds].sort().join(', ')
    throw new Error(
      `Input contains ${distinctIds.size} distinct sessionIds: ${list}. ` +
        'Refusing to silently mix sessions — pass --session-id <id> to pick exactly one.'
    )
  }
  return [...distinctIds][0]
}

// ---------------------------------------------------------------------------
// SQL-shaped field detection — governs which tool_use input fields are
// rendered VERBATIM (never truncated / reformatted) vs. which may be
// summarized. See "SQL PRESERVATION (CRITICAL)" in the header comment.
// ---------------------------------------------------------------------------

const SQL_BEARING_INPUT_KEYS = ['command', 'query', 'sql']

function looksLikeSqlOrShell(text: string): boolean {
  return /\b(SELECT|WITH|INSERT|UPDATE|DELETE|CREATE\s+TABLE)\b/i.test(text) || /^\s*\$/.test(text)
}

/**
 * Renders a tool_use block as readable text for the flat "tool" role.
 * Any field whose key is SQL-bearing (command/query/sql), OR whose string
 * value looks like SQL/shell text, is emitted verbatim and in full — never
 * truncated, never whitespace-collapsed, never re-escaped. This is the
 * mechanism that guarantees SQL survives byte-for-byte from the native
 * transcript into the flat transcript that annotate-session.ts scans for
 * queries.
 */
function renderToolUse(block: NativeContentBlockToolUse): string {
  const name = block.name ?? 'unknown_tool'
  const input = block.input ?? {}
  const keys = Object.keys(input)

  if (keys.length === 0) {
    return `[tool_use] ${name}`
  }

  const lines: string[] = [`[tool_use] ${name}`]
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string') {
      const isSqlBearingKey = SQL_BEARING_INPUT_KEYS.includes(key)
      if (isSqlBearingKey || looksLikeSqlOrShell(value)) {
        // Verbatim — no stripAnsi, no trimming, no truncation. Preserve exactly.
        lines.push(`${key}:`)
        lines.push(value)
      } else {
        lines.push(`${key}: ${stripAnsi(value)}`)
      }
    } else {
      // Non-string values (objects, arrays, numbers, booleans) — safe to
      // JSON-stringify in full; these are never SQL text.
      lines.push(`${key}: ${JSON.stringify(value)}`)
    }
  }
  return lines.join('\n')
}

/**
 * Renders a tool_result block's content as plain text for the flat "tool"
 * role. tool_result.content is either a bare string or an array of
 * `{ type: "text", text }` blocks (confirmed on real transcripts — e.g. Read
 * tool results and async-agent-launch acknowledgements both use the array
 * form). Any other block type inside the array (e.g. images) is skipped;
 * their raw content is not renderable as transcript text.
 */
function renderToolResult(block: NativeContentBlockToolResult): string | null {
  const raw = block.content
  if (typeof raw === 'string') {
    return raw
  }
  if (Array.isArray(raw)) {
    const parts = raw
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
    if (parts.length === 0) return null
    return parts.join('\n')
  }
  return null
}

// ---------------------------------------------------------------------------
// Per-line -> zero-or-more FlatEvent-shaped intermediate records.
// Timestamps are attached here as raw ISO strings (or null); converted to
// relative integer seconds in a second pass once we know the first included
// event's timestamp.
// ---------------------------------------------------------------------------

interface IntermediateEvent {
  role: FlatRole
  text: string
  timestampIso: string | null
}

function extractFromEvent(event: NativeEvent): IntermediateEvent[] {
  const type = event.type
  if (type !== 'user' && type !== 'assistant') {
    // Skip all harness/metadata event types: system, summary, attachment,
    // mode, permission-mode, last-prompt, agent-setting, bridge-session,
    // ai-title, agent-name, queue-operation, file-history-snapshot,
    // file-history-delta, atis-latch, frame-link, and anything else. None of
    // these carry conversational content a case reader should see.
    return []
  }

  if (event.isSidechain === true) {
    // Forked/sub-agent messages running in parallel to the main investigation
    // thread. Including them would interleave an unrelated conversation into
    // the linear narrative annotate-session.ts expects.
    return []
  }

  const timestampIso = typeof event.timestamp === 'string' ? event.timestamp : null
  const content = event.message?.content

  const out: IntermediateEvent[] = []

  if (typeof content === 'string') {
    const text = stripAnsi(content)
    if (text.trim().length > 0) {
      out.push({ role: type === 'user' ? 'user' : 'assistant', text, timestampIso })
    }
    return out
  }

  if (!Array.isArray(content)) {
    // No content at all (should not happen for user/assistant, but be
    // defensive rather than throw on an unexpected shape).
    return []
  }

  for (const block of content) {
    if (!block || typeof block !== 'object') continue
    const blockType = (block as { type?: string }).type

    if (blockType === 'text') {
      const text = (block as NativeContentBlockText).text
      if (typeof text === 'string' && stripAnsi(text).trim().length > 0) {
        out.push({ role: type === 'user' ? 'user' : 'assistant', text: stripAnsi(text), timestampIso })
      }
      continue
    }

    if (blockType === 'tool_use') {
      out.push({ role: 'tool', text: renderToolUse(block as NativeContentBlockToolUse), timestampIso })
      continue
    }

    if (blockType === 'tool_result') {
      const rendered = renderToolResult(block as NativeContentBlockToolResult)
      if (rendered !== null && rendered.trim().length > 0) {
        // tool_result content commonly comes from file reads / command output
        // that may carry ANSI; strip it, but ONLY here (never on the SQL path
        // inside renderToolUse, which is for tool_use inputs, not results).
        out.push({ role: 'tool', text: stripAnsi(rendered), timestampIso })
      }
      continue
    }

    if (blockType === 'thinking') {
      // Internal reasoning — never user-visible narrative. Skip.
      continue
    }

    // Unknown block type (future-proofing): skip rather than guess.
  }

  return out
}

// ---------------------------------------------------------------------------
// Timestamp normalization: ISO string -> integer seconds relative to the
// first included event. Falls back to a monotonic 1s-per-event counter if a
// timestamp is missing or unparseable, continuing from the last known good
// relative second.
// ---------------------------------------------------------------------------

function toFlatEvents(intermediate: IntermediateEvent[]): { events: FlatEvent[]; usedFallbackCount: number } {
  let usedFallbackCount = 0
  if (intermediate.length === 0) {
    return { events: [], usedFallbackCount }
  }

  // Find the first usable timestamp to anchor t=0.
  let anchorMs: number | null = null
  for (const e of intermediate) {
    if (e.timestampIso) {
      const parsed = Date.parse(e.timestampIso)
      if (!Number.isNaN(parsed)) {
        anchorMs = parsed
        break
      }
    }
  }

  const events: FlatEvent[] = []
  let lastRelativeS = 0
  let haveEmittedFirst = false

  for (const e of intermediate) {
    let relativeS: number

    const parsed = e.timestampIso ? Date.parse(e.timestampIso) : NaN
    if (anchorMs !== null && !Number.isNaN(parsed)) {
      relativeS = Math.max(0, Math.round((parsed - anchorMs) / 1000))
      lastRelativeS = relativeS
    } else {
      // Fallback: monotonically increasing counter, 1 second after the last
      // known-good (or previously-fallback) relative second.
      usedFallbackCount += 1
      relativeS = haveEmittedFirst ? lastRelativeS + 1 : 0
      lastRelativeS = relativeS
    }

    haveEmittedFirst = true
    events.push({ ts: relativeS, role: e.role, text: e.text })
  }

  return { events, usedFallbackCount }
}

// ---------------------------------------------------------------------------
// Stats reporting (--stats flag)
// ---------------------------------------------------------------------------

function printStats(
  totalLines: number,
  skippedLines: number,
  events: FlatEvent[],
  usedFallbackCount: number,
  sessionId: string
) {
  const byRole: Record<FlatRole, number> = { user: 0, assistant: 0, tool: 0 }
  for (const e of events) byRole[e.role] += 1

  console.log('--- convert-cc-transcript stats ---')
  console.log(`sessionId used:        ${sessionId}`)
  console.log(`input lines total:     ${totalLines}`)
  console.log(`lines skipped:         ${skippedLines}`)
  console.log(`flat events emitted:   ${events.length}`)
  console.log(`  user:                ${byRole.user}`)
  console.log(`  assistant:           ${byRole.assistant}`)
  console.log(`  tool:                ${byRole.tool}`)
  console.log(`duration_s:            ${events.length > 0 ? events[events.length - 1].ts : 0}`)
  console.log(`fallback timestamps:   ${usedFallbackCount}`)
  console.log('------------------------------------')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2))
  const inPath = resolve(args.inPath)
  const outPath = resolve(args.outPath)

  const nativeEvents = loadNativeLines(inPath)
  if (nativeEvents.length === 0) {
    throw new Error(`No lines parsed from ${inPath} — is the file empty or malformed?`)
  }

  const sessionId = resolveSessionId(nativeEvents, args.sessionId)

  let skippedLines = 0
  const intermediate: IntermediateEvent[] = []

  for (const event of nativeEvents) {
    if (event.sessionId !== sessionId) {
      skippedLines += 1
      continue
    }
    const extracted = extractFromEvent(event)
    if (extracted.length === 0) {
      skippedLines += 1
    }
    intermediate.push(...extracted)
  }

  if (intermediate.length === 0) {
    throw new Error(
      `No conversational (user/assistant text, tool_use, or tool_result) content found for sessionId ${sessionId}. ` +
        'Every line was either a different session or a non-conversational event type.'
    )
  }

  const { events, usedFallbackCount } = toFlatEvents(intermediate)

  const outLines = events.map((e) => JSON.stringify(e)).join('\n')
  writeFileSync(outPath, `${outLines}\n`, 'utf-8')

  if (args.stats) {
    printStats(nativeEvents.length, skippedLines, events, usedFallbackCount, sessionId)
  }

  if (usedFallbackCount > 0) {
    console.warn(
      `WARNING: ${usedFallbackCount} event(s) lacked a usable timestamp and used a fallback monotonic counter instead of real elapsed time.`
    )
  }

  console.log(`Wrote ${events.length} flat event(s) to ${outPath}`)
  console.log('(FILE ONLY — no network calls, no database writes, no LLM API calls were made.)')
}

try {
  main()
} catch (err) {
  if (err instanceof UsageError) {
    console.error(`Usage error: ${err.message}`)
    console.error('')
    console.error(
      'Usage: npx tsx scripts/casebook/convert-cc-transcript.ts --in <native.jsonl> --out <flat.jsonl> [--session-id <id>] [--stats]'
    )
    process.exit(1)
  }
  console.error(`Failed: ${(err as Error).message}`)
  process.exit(1)
}
