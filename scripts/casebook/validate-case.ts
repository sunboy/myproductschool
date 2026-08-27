#!/usr/bin/env npx tsx
/**
 * Casebook Loop — BLOCKING content-integrity validator (plan §2 step 4).
 *
 * Modeled on the spirit of scripts/audit/validate-challenge-content.py: a hard
 * gate a case must pass before it is allowed to publish. Exit 0 = green,
 * non-zero = fail. Every check prints an explicit PASS/FAIL line so a human
 * or CI log shows exactly what broke.
 *
 * Validates from FILES ON DISK so it runs in CI with no DB access:
 *
 *   content/casebook/<case-id>/
 *     case.json            (required)  — cc_cases row shape
 *     expert-session.json  (required)  — cc_expert_sessions row shape
 *     scenes.json           (required)  — array of cc_scenes rows
 *     track.json            (optional)  — cc_tracks row shape, if present is checked too
 *     seed.sql               (optional) — warehouse seed DDL/DML, scanned for time bombs
 *
 * Warehouse reproduction (check WAREHOUSE) is read-only: it shells out to the
 * `bq` CLI (`bq query`) against case.json's `warehouse_dataset`. It NEVER
 * writes, and is entirely skippable with --skip-warehouse for environments
 * without `bq` configured (e.g. before dev A's dataset exists).
 *
 * Usage:
 *   npx tsx scripts/casebook/validate-case.ts <case-id> [--dir <content-root>] [--skip-warehouse]
 *
 * Exit codes: 0 = all checks passed. 1 = one or more checks failed.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { EM_DASH_PATTERNS, ROLE_FRAMING_PATTERNS, SLOP_PATTERNS } from '../../src/lib/ai/voice-rules'

// ---------------------------------------------------------------------------
// Shapes (mirror supabase/migrations/20260826100000_casebook_content.sql)
// ---------------------------------------------------------------------------

interface Detector {
  kind: 'regex' | 'llm'
  pattern?: string
  prompt?: string
}

interface Objective {
  id: string
  label: string
  detector: Detector
}

interface CaseRow {
  id: string
  track_id?: string | null
  title: string
  hook: string
  brief_md: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  est_minutes: number
  warehouse_dataset: string
  objectives: Objective[]
  verdict_spec: {
    expected_cause_tags: string[]
    requires_falsifiable_check: boolean
    [key: string]: unknown
  }
  unlock_lane?: string | null
  unlock_level?: string | null
  is_free?: boolean
  is_published?: boolean
  ordinal?: number
}

interface DecisionOption {
  id: string
  text: string
  quality: 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'
  explanation: string
}

interface DecisionPoint {
  id: string
  t: number
  question: string
  options: DecisionOption[]
  expert_option_id: string
  expert_move_id: string
  /** Set by scripts/casebook/annotate-session.ts (dev-B). true until a human
   *  or sub-agent finishes authoring the decision point's real content.
   *  Camel-cased because it comes straight off that script's draft output —
   *  do not rename to snake_case, this must match the real emitted shape. */
  needsAuthoring?: boolean
}

interface TranscriptTurn {
  t: number
  role: 'user' | 'assistant' | 'tool'
  text: string
  annotation?: { title: string; body: string }
  /** Query metadata, when authored directly on the transcript turn (the
   *  finished-authoring shape this validator's own fixtures use). */
  query?: string
  expected_rows?: unknown[]
  /** Set when the query result has no deterministic ORDER BY, so
   *  reproduction must compare as a set, not row-for-row. */
  nondeterministic_order?: boolean
}

/** Query extracted by annotate-session.ts (dev-B), top-level on the draft,
 *  not attached per-transcript-turn. expected_result_digest is declared by
 *  that script but never populated by any code in this repo — no digest
 *  algorithm is defined anywhere, so this validator does not attempt to
 *  verify it. Only `expected_rows` (attached here or matched onto the
 *  transcript turn at the same `t`) is checked against a live bq query. */
interface DraftQuery {
  t: number
  sql: string
  expected_result_digest?: string
  nondeterministic_order: boolean
  expected_rows?: unknown[]
  /** True when this query genuinely errored during the recorded expert
   *  session (e.g. a typo'd column name) and therefore can never have
   *  expected_rows attached — there are no rows to have expected, because
   *  the expert's own query never returned any. This is a real, teachable
   *  expert error and must be reported explicitly by the WAREHOUSE check,
   *  never silently skipped and never treated as an annotation gap. */
  failed_in_session?: boolean
}

interface ExpertSession {
  id: string
  case_id: string
  duration_s: number
  transcript: TranscriptTurn[]
  moves: { id: string; t: number; label: string; description: string }[]
  decision_points: DecisionPoint[]
  is_published?: boolean
  /** Present on annotate-session.ts drafts: the authoritative extracted-query
   *  list when present, preferred over per-turn `query`/`expected_rows`. */
  queries?: DraftQuery[]
  /** Present on annotate-session.ts drafts: count of decision points still
   *  needsAuthoring. Checked as a belt-and-suspenders signal alongside the
   *  per-decision-point flag. */
  needsAuthoring?: number
}

interface RequiredMove {
  id: string
  label: string
  detector: Detector
}

interface Scene {
  id: string
  case_id: string
  ordinal: number
  title: string
  goal_md: string
  skill_lane: string
  decision_point_id: string
  preload: {
    context_md: string
    seed_transcript?: TranscriptTurn[]
    visible_tables: string[]
    needs_authoring?: boolean
    authoring_prompt?: string
  }
  time_budget_s: number
  rubric: {
    required_moves: RequiredMove[]
    bonus_moves: RequiredMove[]
    fail_conditions: string[]
  }
  is_published?: boolean
  _needs_authoring?: boolean
}

interface TrackRow {
  id: string
  title: string
  outcome_copy: string
  ordinal?: number
  is_published?: boolean
}

// ---------------------------------------------------------------------------
// Report plumbing
// ---------------------------------------------------------------------------

type CheckStatus = 'PASS' | 'FAIL' | 'SKIP'

interface CheckResult {
  check: string
  status: CheckStatus
  detail: string
}

const results: CheckResult[] = []

function record(check: string, status: CheckStatus, detail: string) {
  results.push({ check, status, detail })
}

function pass(check: string, detail: string) {
  record(check, 'PASS', detail)
}

function fail(check: string, detail: string) {
  record(check, 'FAIL', detail)
}

function skip(check: string, detail: string) {
  record(check, 'SKIP', detail)
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const [caseId, ...rest] = argv
  if (!caseId || caseId.startsWith('--')) {
    console.error('Usage: npx tsx scripts/casebook/validate-case.ts <case-id> [--dir <content-root>] [--skip-warehouse]')
    process.exit(1)
  }
  let dir = 'content/casebook'
  let skipWarehouse = false
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--dir') dir = rest[++i]
    else if (rest[i] === '--skip-warehouse') skipWarehouse = true
  }
  return { caseId, dir, skipWarehouse }
}

// ---------------------------------------------------------------------------
// File loading
// ---------------------------------------------------------------------------

function loadJson<T>(path: string): { value: T | null; error: string | null } {
  if (!existsSync(path)) {
    return { value: null, error: `File not found: ${path}` }
  }
  let raw: string
  try {
    raw = readFileSync(path, 'utf-8')
  } catch (err) {
    return { value: null, error: `Failed to read ${path}: ${(err as Error).message}` }
  }
  try {
    return { value: JSON.parse(raw) as T, error: null }
  } catch (err) {
    return { value: null, error: `Failed to parse ${path} as JSON: ${(err as Error).message}` }
  }
}

// ---------------------------------------------------------------------------
// Check A: relative-date time bombs (run first — cheap, catches a
// well-documented repo grader-integrity pitfall early)
// ---------------------------------------------------------------------------

const TIME_BOMB_PATTERNS: RegExp[] = [
  /\bCURRENT_DATE\b/i,
  /\bCURRENT_TIMESTAMP\b/i,
  /\bdate\s*\(\s*['"]now['"]\s*\)/i,
  /\bNOW\s*\(\s*\)/i,
  /\bCURRENT_TIME\b/i,
  /\bGETDATE\s*\(\s*\)/i,
  /\bdatetime\s*\(\s*['"]now['"]/i,
]

function scanForTimeBombs(label: string, text: string, hits: string[]) {
  for (const re of TIME_BOMB_PATTERNS) {
    const match = text.match(re)
    if (match) {
      hits.push(`${label}: matched ${re} → "${match[0]}"`)
    }
  }
}

function checkTimeBombs(caseRow: CaseRow | null, session: ExpertSession | null, seedSql: string | null) {
  const hits: string[] = []

  if (seedSql) {
    scanForTimeBombs('seed.sql', seedSql, hits)
  }

  if (session) {
    for (const turn of session.transcript ?? []) {
      if (turn.role === 'tool') {
        scanForTimeBombs(`expert-session transcript t=${turn.t}`, turn.text, hits)
      }
      if (turn.query) {
        scanForTimeBombs(`expert-session query t=${turn.t}`, turn.query, hits)
      }
    }
    for (const q of session.queries ?? []) {
      scanForTimeBombs(`expert-session queries[] t=${q.t}`, q.sql, hits)
    }
  }

  if (hits.length > 0) {
    fail('TIME_BOMBS', `Found relative-date time bomb(s) that will drift on rerun:\n    ${hits.join('\n    ')}`)
  } else {
    pass('TIME_BOMBS', 'No CURRENT_DATE / CURRENT_TIMESTAMP / date(\'now\') / NOW() found in seed SQL or transcript queries.')
  }
}

// ---------------------------------------------------------------------------
// Check B: decision-point completeness
// ---------------------------------------------------------------------------

const REQUIRED_QUALITIES = ['best', 'good_but_incomplete', 'surface', 'plausible_wrong'] as const

function hasIsCorrectBoolean(value: unknown, path: string, hits: string[]) {
  if (value === null || value === undefined) return
  if (Array.isArray(value)) {
    value.forEach((item, i) => hasIsCorrectBoolean(item, `${path}[${i}]`, hits))
    return
  }
  if (typeof value === 'object') {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'is_correct') {
        hits.push(`${path}.is_correct`)
      }
      hasIsCorrectBoolean(val, `${path}.${key}`, hits)
    }
  }
}

function checkDecisionPoints(session: ExpertSession | null) {
  if (!session) {
    fail('DECISION_POINTS', 'expert-session.json missing or unparsable — cannot check decision points.')
    return
  }

  // Reject is_correct anywhere in the whole session payload, not just options.
  const isCorrectHits: string[] = []
  hasIsCorrectBoolean(session, 'expert-session', isCorrectHits)
  if (isCorrectHits.length > 0) {
    fail('NO_IS_CORRECT_BOOLEAN', `Found forbidden is_correct boolean at: ${isCorrectHits.join(', ')}. The system is multi-tier (quality), not binary.`)
  } else {
    pass('NO_IS_CORRECT_BOOLEAN', 'No is_correct boolean found anywhere in expert-session.json.')
  }

  const decisionPoints = session.decision_points ?? []
  if (decisionPoints.length === 0) {
    fail('DECISION_POINTS', 'expert-session.json has zero decision_points.')
    return
  }

  const problems: string[] = []

  // Top-level needsAuthoring counter, when present (annotate-session.ts
  // drafts carry this). Checked before per-dp so a stale/mismatched counter
  // still surfaces even if every dp-level flag looks clean.
  if (typeof session.needsAuthoring === 'number' && session.needsAuthoring > 0) {
    problems.push(`session.needsAuthoring=${session.needsAuthoring} — this expert session still has unauthored decision point(s) and cannot ship.`)
  }

  for (const dp of decisionPoints) {
    const options = dp.options ?? []

    if (dp.needsAuthoring === true) {
      problems.push(`${dp.id}: needsAuthoring=true — this decision point is still dev-B's annotator scaffold and has not been authored yet.`)
    }

    if (options.length !== 4) {
      problems.push(`${dp.id}: has ${options.length} options, expected exactly 4.`)
      continue
    }

    const qualities = options.map((o) => o.quality).sort()
    const expectedSorted = [...REQUIRED_QUALITIES].sort()
    const qualitiesMatch = JSON.stringify(qualities) === JSON.stringify(expectedSorted)
    if (!qualitiesMatch) {
      problems.push(`${dp.id}: options quality tiers are [${qualities.join(', ')}], expected exactly one of each of [${expectedSorted.join(', ')}].`)
    }

    const bestOption = options.find((o) => o.quality === 'best')
    if (!bestOption) {
      problems.push(`${dp.id}: no option with quality "best".`)
    } else if (dp.expert_option_id !== bestOption.id) {
      problems.push(`${dp.id}: expert_option_id="${dp.expert_option_id}" does not point at the "best" option (id="${bestOption.id}").`)
    }

    for (const opt of options) {
      if (!opt.text || !opt.text.trim()) problems.push(`${dp.id}/${opt.id}: empty option text.`)
      if (!opt.explanation || !opt.explanation.trim()) problems.push(`${dp.id}/${opt.id}: empty explanation.`)
    }

    if (!dp.question || !dp.question.trim()) {
      problems.push(`${dp.id}: empty question.`)
    }
  }

  if (problems.length > 0) {
    fail('DECISION_POINTS', `${problems.length} decision-point problem(s):\n    ${problems.join('\n    ')}`)
  } else {
    pass('DECISION_POINTS', `All ${decisionPoints.length} decision point(s) have exactly 4 options (one per quality tier) and expert_option_id points at "best".`)
  }
}

function checkScenesNotNeedingAuthoring(scenes: Scene[] | null) {
  if (!scenes) {
    fail('SCENES_AUTHORED', 'scenes.json missing or unparsable — cannot check authoring status.')
    return
  }
  if (scenes.length === 0) {
    fail('SCENES_AUTHORED', 'scenes.json has zero scenes.')
    return
  }

  const stillScaffolded: string[] = []
  for (const scene of scenes) {
    const flaggedTopLevel = scene._needs_authoring === true
    const flaggedPreload = scene.preload?.needs_authoring === true
    const placeholderTitle = /\[NEEDS AUTHORING\]/i.test(scene.title ?? '')
    const placeholderGoal = /\[NEEDS AUTHORING\]/i.test(scene.goal_md ?? '')
    if (flaggedTopLevel || flaggedPreload || placeholderTitle || placeholderGoal) {
      stillScaffolded.push(scene.id)
    }
  }

  if (stillScaffolded.length > 0) {
    fail('SCENES_AUTHORED', `${stillScaffolded.length} scene(s) are still in dev-B's "needs authoring" scaffold state and cannot ship: ${stillScaffolded.join(', ')}`)
  } else {
    pass('SCENES_AUTHORED', `All ${scenes.length} scene(s) are past the needs-authoring scaffold stage.`)
  }
}

// ---------------------------------------------------------------------------
// Check C: rubric detectors
// ---------------------------------------------------------------------------

function detectorProblem(detector: Detector | undefined, label: string): string | null {
  if (!detector) return `${label}: missing detector.`
  if (detector.kind === 'regex') {
    if (!detector.pattern || !detector.pattern.trim()) {
      return `${label}: kind="regex" but pattern is empty.`
    }
    try {
      // eslint-disable-next-line no-new
      new RegExp(detector.pattern)
    } catch (err) {
      return `${label}: kind="regex" pattern "${detector.pattern}" fails to compile: ${(err as Error).message}`
    }
    return null
  }
  if (detector.kind === 'llm') {
    if (!detector.prompt || !detector.prompt.trim()) {
      return `${label}: kind="llm" but prompt is empty.`
    }
    return null
  }
  return `${label}: unknown detector kind "${(detector as { kind: string }).kind}".`
}

function checkRubricDetectors(scenes: Scene[] | null) {
  if (!scenes) {
    fail('RUBRIC_DETECTORS', 'scenes.json missing or unparsable — cannot check rubric detectors.')
    return
  }

  const problems: string[] = []
  for (const scene of scenes) {
    const required = scene.rubric?.required_moves ?? []
    const bonus = scene.rubric?.bonus_moves ?? []

    if (required.length === 0) {
      problems.push(`${scene.id}: rubric.required_moves is empty — every scene needs at least one required move.`)
    }

    for (const move of required) {
      const p = detectorProblem(move.detector, `${scene.id}/required/${move.id}`)
      if (p) problems.push(p)
    }
    for (const move of bonus) {
      const p = detectorProblem(move.detector, `${scene.id}/bonus/${move.id}`)
      if (p) problems.push(p)
    }
  }

  if (problems.length > 0) {
    fail('RUBRIC_DETECTORS', `${problems.length} rubric detector problem(s):\n    ${problems.join('\n    ')}`)
  } else {
    pass('RUBRIC_DETECTORS', `All rubric detectors compile (regex) or carry a prompt (llm), and every scene has at least one required move.`)
  }
}

// ---------------------------------------------------------------------------
// Check D: objectives + verdict_spec
// ---------------------------------------------------------------------------

function checkObjectivesAndVerdict(caseRow: CaseRow | null) {
  if (!caseRow) {
    fail('OBJECTIVES_VERDICT', 'case.json missing or unparsable — cannot check objectives/verdict_spec.')
    return
  }

  const problems: string[] = []
  const objectives = caseRow.objectives ?? []
  if (objectives.length === 0) {
    problems.push('objectives is empty.')
  }
  for (const obj of objectives) {
    const p = detectorProblem(obj.detector, `objective/${obj.id}`)
    if (p) problems.push(p)
    if (!obj.label || !obj.label.trim()) problems.push(`objective/${obj.id}: empty label.`)
  }

  const verdict = caseRow.verdict_spec
  if (!verdict || typeof verdict !== 'object') {
    problems.push('verdict_spec is missing or not an object.')
  } else {
    if (!Array.isArray(verdict.expected_cause_tags) || verdict.expected_cause_tags.length === 0) {
      problems.push('verdict_spec.expected_cause_tags must be a non-empty array.')
    }
    if (typeof verdict.requires_falsifiable_check !== 'boolean') {
      problems.push('verdict_spec.requires_falsifiable_check must be a boolean.')
    }
  }

  if (problems.length > 0) {
    fail('OBJECTIVES_VERDICT', `${problems.length} problem(s):\n    ${problems.join('\n    ')}`)
  } else {
    pass('OBJECTIVES_VERDICT', `${objectives.length} objective(s) have working detectors, verdict_spec parses.`)
  }
}

// ---------------------------------------------------------------------------
// Check E: voice rules (reuses src/lib/ai/voice-rules.ts — no re-derived list)
// ---------------------------------------------------------------------------

const VOICE_CHECK_PATTERNS = [...EM_DASH_PATTERNS, ...ROLE_FRAMING_PATTERNS, ...SLOP_PATTERNS]

function voiceViolations(label: string, text: string | undefined | null): string[] {
  if (!text) return []
  const violations: string[] = []
  for (const pattern of VOICE_CHECK_PATTERNS) {
    const re = new RegExp(pattern.re.source, pattern.re.flags)
    const match = text.match(re)
    if (match) {
      violations.push(`${label}: [${pattern.rule}] matched "${match[0].trim()}"`)
    }
  }
  return violations
}

function checkVoiceRules(caseRow: CaseRow | null, session: ExpertSession | null, scenes: Scene[] | null) {
  const violations: string[] = []

  if (caseRow) {
    violations.push(...voiceViolations('case.title', caseRow.title))
    violations.push(...voiceViolations('case.hook', caseRow.hook))
    violations.push(...voiceViolations('case.brief_md', caseRow.brief_md))
  }

  if (session) {
    for (const dp of session.decision_points ?? []) {
      // Skip needsAuthoring scaffolds — DECISION_POINTS already fails the
      // build for those, and their stub text ("[NEEDS AUTHORING] ...") is
      // not meant to pass voice rules.
      if (dp.needsAuthoring === true) continue
      violations.push(...voiceViolations(`decision_point/${dp.id}.question`, dp.question))
      for (const opt of dp.options ?? []) {
        violations.push(...voiceViolations(`decision_point/${dp.id}/option/${opt.id}.text`, opt.text))
        violations.push(...voiceViolations(`decision_point/${dp.id}/option/${opt.id}.explanation`, opt.explanation))
      }
    }
  }

  if (scenes) {
    for (const scene of scenes) {
      // Skip needs_authoring scaffolds — SCENES_AUTHORED already fails the
      // build for those, and their placeholder text is not meant to pass
      // voice rules (it literally says "[NEEDS AUTHORING]").
      if (scene._needs_authoring || scene.preload?.needs_authoring) continue
      violations.push(...voiceViolations(`scene/${scene.id}.title`, scene.title))
      violations.push(...voiceViolations(`scene/${scene.id}.goal_md`, scene.goal_md))
    }
  }

  if (violations.length > 0) {
    fail('VOICE_RULES', `${violations.length} voice violation(s):\n    ${violations.join('\n    ')}`)
  } else {
    pass('VOICE_RULES', 'No em dashes, role framing, or AI-slop found in case/decision-point/scene copy.')
  }
}

// ---------------------------------------------------------------------------
// Check F: warehouse reproduction (read-only bq query)
// ---------------------------------------------------------------------------

/** Extract a SELECT statement from a tool-turn's text if no explicit `query` field is set. */
function extractQueryFromText(text: string): string | null {
  const match = text.match(/SELECT[\s\S]*?;/i)
  return match ? match[0].trim() : null
}

/** Rows returned by `bq query --format=json`: array of objects with string-keyed values. */
type BqRow = Record<string, unknown>

function runBqQuery(sql: string): { rows: BqRow[] | null; error: string | null } {
  try {
    // SQL is passed via stdin, NOT as an argv element. A query whose text
    // begins with a `-- comment` line (two of ours do, t=258 and t=261) is
    // otherwise parsed by bq's own argv flag parser as an unrecognized flag
    // ("Run 'bq.py help' to get help") instead of being executed as SQL.
    // stdin sidesteps that entirely and works for every query shape. The SQL
    // string itself is passed through untouched — no trimming, no comment
    // stripping.
    const out = execFileSync(
      'bq',
      ['query', '--use_legacy_sql=false', '--format=json', '--headless', '--nouse_cache'],
      { encoding: 'utf-8', input: sql, stdio: ['pipe', 'pipe', 'pipe'] },
    )
    const trimmed = out.trim()
    if (!trimmed) return { rows: [], error: null }
    return { rows: JSON.parse(trimmed) as BqRow[], error: null }
  } catch (err) {
    const e = err as { stderr?: Buffer | string; message?: string }
    const stderr = e.stderr ? e.stderr.toString() : ''
    return { rows: null, error: stderr || e.message || String(err) }
  }
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'number') return String(value)
  return String(value).trim()
}

/** Stable string key for a row, independent of key order, for set comparison. */
function rowKey(row: BqRow): string {
  const sortedKeys = Object.keys(row).sort()
  return sortedKeys.map((k) => `${k}=${normalizeCell(row[k])}`).join('|')
}

function rowsEqualOrdered(expected: unknown[], actual: BqRow[]): string | null {
  if (expected.length !== actual.length) {
    return `row count mismatch: expected ${expected.length}, got ${actual.length}`
  }
  for (let i = 0; i < expected.length; i++) {
    const exp = expected[i] as BqRow
    const act = actual[i]
    if (rowKey(exp) !== rowKey(act)) {
      return `row ${i} mismatch (ordered compare): expected ${JSON.stringify(exp)}, got ${JSON.stringify(act)}`
    }
  }
  return null
}

function rowsEqualAsSet(expected: unknown[], actual: BqRow[]): string | null {
  if (expected.length !== actual.length) {
    return `row count mismatch: expected ${expected.length}, got ${actual.length}`
  }
  const expectedKeys = (expected as BqRow[]).map(rowKey).sort()
  const actualKeys = actual.map(rowKey).sort()
  for (let i = 0; i < expectedKeys.length; i++) {
    if (expectedKeys[i] !== actualKeys[i]) {
      return `set mismatch: expected multiset ${JSON.stringify(expectedKeys)}, got ${JSON.stringify(actualKeys)}`
    }
  }
  return null
}

function bqAvailable(): boolean {
  try {
    execFileSync('bq', ['version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function checkWarehouseReproduction(caseRow: CaseRow | null, session: ExpertSession | null, skipWarehouse: boolean) {
  if (skipWarehouse) {
    skip('WAREHOUSE', '--skip-warehouse passed; not attempting bq queries.')
    return
  }
  if (!caseRow) {
    fail('WAREHOUSE', 'case.json missing or unparsable — cannot determine warehouse_dataset.')
    return
  }
  if (!session) {
    fail('WAREHOUSE', 'expert-session.json missing or unparsable — cannot extract queries to reproduce.')
    return
  }
  if (!caseRow.warehouse_dataset) {
    fail('WAREHOUSE', 'case.json has no warehouse_dataset set.')
    return
  }

  if (!bqAvailable()) {
    fail('WAREHOUSE', '`bq` CLI is not available on PATH. Install the Google Cloud SDK or run with --skip-warehouse for a non-warehouse-checking pass.')
    return
  }

  // Confirm the dataset exists before trying to run anything against it. This
  // is the expected FAIL path pre-launch: dev A's tuesday-dip warehouse does
  // not exist yet, and this check must fail cleanly and informatively rather
  // than crash or hang.
  const showResult = (() => {
    try {
      execFileSync('bq', ['show', caseRow.warehouse_dataset], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  })()

  if (!showResult) {
    fail('WAREHOUSE', `Dataset "${caseRow.warehouse_dataset}" does not exist or is not accessible via \`bq show\`. The seed warehouse must be loaded before this case can pass validation. (Expected pre-launch: warehouse work may still be in progress.)`)
    return
  }

  // Collect queries to reproduce. Two supported source shapes, checked in
  // this order:
  //   1. session.queries[] — the authoritative extracted-query list emitted
  //      by scripts/casebook/annotate-session.ts (dev-B), one entry per
  //      query with its own nondeterministic_order flag. Preferred when
  //      present since it's the single source of truth for query extraction.
  //      expected_result_digest is declared on that shape but never
  //      populated by any code in this repo (no digest algorithm exists) —
  //      this validator does not attempt to verify it, only expected_rows.
  //   2. Per-transcript-turn `query`/`expected_rows`/`nondeterministic_order`
  //      — the finished-authoring shape used once a case is fully hand
  //      authored (also what this validator's own good/bad fixtures use).
  // A query entry from EITHER shape with no expected_rows anywhere is
  // reported as a gap (not silently skipped) — annotation is incomplete.
  type QueryCase = {
    turnT: number
    sql: string
    expected: unknown[]
    nondeterministic: boolean
    hasExpected: boolean
    /** Query genuinely errored in the recorded expert session (e.g. a typo'd
     *  column name) and can never have expected_rows — this is a real expert
     *  error, not an annotation gap, and must not fail WAREHOUSE. */
    failedInSession: boolean
  }
  const queryCases: QueryCase[] = []

  if (Array.isArray(session.queries) && session.queries.length > 0) {
    const digestOnly = session.queries.filter((q) => q.expected_result_digest && !Array.isArray(q.expected_rows))
    if (digestOnly.length > 0) {
      console.log(`  (info) ${digestOnly.length} quer(y/ies) in session.queries[] carry expected_result_digest with no expected_rows. No digest algorithm is defined in this repo, so these are not verified by digest — attach expected_rows instead.`)
    }
    for (const q of session.queries) {
      // A query record may carry its own expected_rows (richer, finished
      // shape) or the annotator may have attached expected_rows to the
      // matching transcript turn at the same t. Check both.
      const matchingTurn = (session.transcript ?? []).find((turn) => turn.t === q.t && turn.role === 'tool')
      const expected = Array.isArray(q.expected_rows)
        ? q.expected_rows
        : Array.isArray(matchingTurn?.expected_rows)
          ? matchingTurn!.expected_rows!
          : []
      queryCases.push({
        turnT: q.t,
        sql: q.sql,
        expected,
        nondeterministic: !!q.nondeterministic_order,
        hasExpected: expected.length > 0,
        failedInSession: q.failed_in_session === true,
      })
    }
  } else {
    for (const turn of session.transcript ?? []) {
      if (turn.role !== 'tool') continue
      const sql = turn.query ?? extractQueryFromText(turn.text)
      if (!sql) continue
      const expected = Array.isArray(turn.expected_rows) ? turn.expected_rows : []
      queryCases.push({
        turnT: turn.t,
        sql,
        expected,
        nondeterministic: !!turn.nondeterministic_order,
        hasExpected: expected.length > 0,
        failedInSession: false,
      })
    }
  }

  if (queryCases.length === 0) {
    fail('WAREHOUSE', 'No queries found in expert-session.json (checked both session.queries[] and per-turn query/expected_rows). The annotator (dev-B) must extract at least one query.')
    return
  }

  const problems: string[] = []
  const infoNotes: string[] = []
  let checkedCount = 0
  for (const qc of queryCases) {
    if (qc.failedInSession) {
      // A genuine expert error captured in the recording (e.g. a typo'd
      // column name) can never have expected_rows — there is nothing to
      // reproduce, because the expert's own query never returned rows. This
      // is reported explicitly, not silently skipped, and it is NOT a
      // reproduction failure: the case teaches from this error and the
      // expert's later corrected query (if any) is verified normally like
      // any other query case.
      infoNotes.push(`t=${qc.turnT}: query failed in-session (expert error, not reproducible) — skipped by design: ${qc.sql.slice(0, 120).replace(/\n/g, ' ')}`)
      continue
    }
    if (qc.expected.length === 0) {
      problems.push(`t=${qc.turnT}: query has no annotated expected_rows to reproduce against — cannot verify: ${qc.sql.slice(0, 120)}`)
      continue
    }
    const { rows, error } = runBqQuery(qc.sql)
    if (error || rows === null) {
      problems.push(`t=${qc.turnT}: bq query failed: ${error}\n      SQL: ${qc.sql}`)
      continue
    }
    const mismatch = qc.nondeterministic
      ? rowsEqualAsSet(qc.expected, rows)
      : rowsEqualOrdered(qc.expected, rows)
    if (mismatch) {
      problems.push(`t=${qc.turnT} (${qc.nondeterministic ? 'set' : 'ordered'} compare): ${mismatch}\n      SQL: ${qc.sql}`)
      continue
    }
    checkedCount++
  }

  for (const note of infoNotes) {
    console.log(`  (info) ${note}`)
  }

  if (problems.length > 0) {
    fail('WAREHOUSE', `${problems.length}/${queryCases.length} query reproduction(s) failed:\n    ${problems.join('\n    ')}`)
  } else {
    const skippedNote = infoNotes.length > 0 ? ` (${infoNotes.length} skipped by design as in-session expert error(s))` : ''
    pass('WAREHOUSE', `All ${checkedCount} transcribed query/query result(s) reproduced against warehouse_dataset="${caseRow.warehouse_dataset}"${skippedNote}.`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { caseId, dir, skipWarehouse } = parseArgs(process.argv.slice(2))
  const caseDir = resolve(dir, caseId)

  if (!existsSync(caseDir)) {
    console.error(`Case directory not found: ${caseDir}`)
    process.exit(1)
  }

  const { value: caseRow, error: caseError } = loadJson<CaseRow>(join(caseDir, 'case.json'))
  if (caseError) fail('LOAD_CASE', caseError)
  else pass('LOAD_CASE', `Loaded case.json for "${caseRow?.id}".`)

  const { value: session, error: sessionError } = loadJson<ExpertSession>(join(caseDir, 'expert-session.json'))
  if (sessionError) fail('LOAD_EXPERT_SESSION', sessionError)
  else pass('LOAD_EXPERT_SESSION', `Loaded expert-session.json ("${session?.id}") with ${session?.decision_points?.length ?? 0} decision point(s).`)

  const { value: scenes, error: scenesError } = loadJson<Scene[]>(join(caseDir, 'scenes.json'))
  if (scenesError) fail('LOAD_SCENES', scenesError)
  else pass('LOAD_SCENES', `Loaded scenes.json with ${scenes?.length ?? 0} scene(s).`)

  const trackPath = join(caseDir, 'track.json')
  let track: TrackRow | null = null
  if (existsSync(trackPath)) {
    const { value, error } = loadJson<TrackRow>(trackPath)
    if (error) fail('LOAD_TRACK', error)
    else {
      track = value
      pass('LOAD_TRACK', `Loaded track.json for "${track?.id}".`)
    }
  } else {
    skip('LOAD_TRACK', 'track.json not present (optional).')
  }

  if (caseRow && session && caseRow.id !== session.case_id) {
    fail('CASE_LINKAGE', `case.json id="${caseRow.id}" does not match expert-session.json case_id="${session.case_id}".`)
  } else if (caseRow && session) {
    pass('CASE_LINKAGE', 'case.json and expert-session.json agree on case id.')
  }

  if (caseRow && scenes) {
    const mismatched = scenes.filter((s) => s.case_id !== caseRow.id)
    if (mismatched.length > 0) {
      fail('SCENES_LINKAGE', `${mismatched.length} scene(s) have case_id that does not match case.json id="${caseRow.id}": ${mismatched.map((s) => s.id).join(', ')}`)
    } else {
      pass('SCENES_LINKAGE', 'All scenes reference the correct case_id.')
    }

    if (session) {
      const dpIds = new Set((session.decision_points ?? []).map((dp) => dp.id))
      const orphanScenes = scenes.filter((s) => !dpIds.has(s.decision_point_id))
      if (orphanScenes.length > 0) {
        fail('SCENES_DECISION_POINT_LINKAGE', `${orphanScenes.length} scene(s) reference a decision_point_id not present in expert-session.json: ${orphanScenes.map((s) => `${s.id}→${s.decision_point_id}`).join(', ')}`)
      } else {
        pass('SCENES_DECISION_POINT_LINKAGE', 'All scenes reference a valid decision_point_id.')
      }
    }
  }

  let seedSql: string | null = null
  const seedPath = join(caseDir, 'seed.sql')
  if (existsSync(seedPath)) {
    seedSql = readFileSync(seedPath, 'utf-8')
  }

  checkTimeBombs(caseRow, session, seedSql)
  checkDecisionPoints(session)
  checkScenesNotNeedingAuthoring(scenes)
  checkRubricDetectors(scenes)
  checkObjectivesAndVerdict(caseRow)
  checkVoiceRules(caseRow, session, scenes)
  checkWarehouseReproduction(caseRow, session, skipWarehouse)

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------

  console.log('')
  console.log(`Casebook validate-case: ${caseId}`)
  console.log('='.repeat(60))
  for (const r of results) {
    const marker = r.status === 'PASS' ? '✓ PASS' : r.status === 'FAIL' ? '✗ FAIL' : '○ SKIP'
    console.log(`[${marker}] ${r.check}`)
    console.log(`    ${r.detail}`)
  }
  console.log('='.repeat(60))

  const failCount = results.filter((r) => r.status === 'FAIL').length
  const passCount = results.filter((r) => r.status === 'PASS').length
  const skipCount = results.filter((r) => r.status === 'SKIP').length
  console.log(`${passCount} passed, ${failCount} failed, ${skipCount} skipped.`)

  if (failCount > 0) {
    console.log(`\nRESULT: FAIL — case "${caseId}" is not ready to publish.`)
    process.exit(1)
  }
  console.log(`\nRESULT: PASS — case "${caseId}" cleared all blocking checks.`)
  process.exit(0)
}

main()
