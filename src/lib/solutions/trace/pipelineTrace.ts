/**
 * Deterministic trace harness for the `pipeline` stepped-diagram base (SQL CTE
 * chains). The SQL analogue of arrayTrace.ts.
 *
 * The "wrong intermediate table" risk is closed here: a SQL pipeline walkthrough
 * is never authored by the model. We parse the reference query's top-level WITH
 * chain into named stages, then EXECUTE the real reference (loaded against the
 * challenge's real setup_script) once per stage, rewriting each stage to
 * `<full WITH chain> SELECT * FROM <cte>` so the rows shown are what that stage
 * actually materializes. The final stage runs the unmodified reference SELECT.
 * Each emitted table is a program output, not a creative artifact.
 *
 * To stay honest about correctness the harness returns the final stage's rows so
 * the caller (buildSteppedPipelineFromMetadata) can cross-check them against the
 * challenge's own expected output on the same setup. If they disagree, the
 * reference does not actually produce the certified answer here and the challenge
 * is NOT stepped eligible (it keeps a static diagram).
 *
 * The diagram ships with readable per-step prose derived from the verified
 * stages. The generation route MAY overlay model-authored prose
 * (title/explanation/decision/pills) keyed by step index, but the model can
 * never add, remove, or reorder steps or touch a delta; the overlay is fail-soft
 * and the harness prose stands when it does not apply. See graft.ts and
 * buildSteppedPipelineDiagram().
 */

import initSqlJs from 'sql.js'
import * as fs from 'fs'
import * as path from 'path'
import type { InteractiveStepDiagram } from '@/lib/solutions/schema'

// Schema bounds for the pipeline base: stages 2..6, table <=5 cols x <=5 rows,
// cell strings <=24 chars, stage labels <=40 chars. We cap to those here so the
// emitted diagram always validates; runtime never depends on schema re-checks.
const MIN_STAGES = 2
const MAX_STAGES = 6
const MAX_TABLE_ROWS = 5
const MAX_TABLE_COLS = 5
const MAX_CELL_CHARS = 24
const MAX_STAGE_LABEL = 40

/** One named CTE plus the SQL needed to materialize it. */
interface ParsedCte {
  /** The CTE name as written, e.g. `totals`. */
  name: string
  /** `<full WITH chain> SELECT * FROM <name>` — materializes this stage. */
  query: string
}

/** A captured intermediate (or final) result table, already capped + stringified. */
interface StageTable {
  columns: string[]
  rows: string[][]
}

/**
 * The FULL (un-capped) final result set, kept separate from the <=5-row display
 * table. Certification runs against this so a query that returns a wrong row past
 * the 5-row display cap can never be certified on the capped subset.
 */
interface FinalResultSet {
  /** All result columns, in order, un-truncated. */
  columns: string[]
  /** Every result row, stringified the same way the display cells are, un-capped. */
  rows: string[][]
}

export interface PipelineTraceResult {
  /** Ordered stage labels: each CTE name in chain order, then a final label. */
  stages: string[]
  /** One delta per stage; activeStage indexes into `stages`. */
  deltas: Array<{ activeStage: number; table?: StageTable }>
  /** The final stage's rows (post-cap, stringified) — DISPLAY only, never used to certify. */
  finalRows: StageTable
  /** The full un-capped final result set — the ONLY thing certification compares against. */
  fullFinal: FinalResultSet
}

// ---------------------------------------------------------------------------
// CTE chain parser
// ---------------------------------------------------------------------------

/**
 * Strip leading SQL comments / whitespace so we can sniff the leading WITH and
 * the RECURSIVE keyword without false negatives. Does not mutate the query used
 * for execution; only used for prefix detection + the body scanner below.
 */
function leadingTokens(sql: string): string {
  return sql.replace(/^\s+/, '')
}

/**
 * Walk the reference SQL and split the top-level WITH chain into [ctes, tail],
 * where `tail` is the outer SELECT (the final stage). Returns null when there is
 * no leading WITH, the chain is RECURSIVE, or the structure cannot be parsed.
 *
 * The scanner is paren/string-literal aware: commas and the `)` that closes a
 * CTE body are only recognized at depth 0, so subqueries, nested parens, and
 * string literals inside a CTE body never confuse the split.
 */
function parseCteChain(referenceSql: string): { ctes: Array<{ name: string; body: string }>; tail: string } | null {
  const trimmed = leadingTokens(referenceSql)
  // Must begin with WITH (case-insensitive), as a whole word.
  if (!/^with\b/i.test(trimmed)) return null
  // Recursive CTEs walk their own output; a single materialization per stage
  // would misrepresent them, so they are out of scope.
  if (/^with\s+recursive\b/i.test(trimmed)) return null

  // Position the cursor just past `WITH`.
  const afterWith = trimmed.slice(trimmed.match(/^with\s+/i)![0].length)

  const ctes: Array<{ name: string; body: string }> = []
  let i = 0
  const s = afterWith

  // Each CTE is: name [ (cols) ] AS ( body ) [, more]
  while (i < s.length) {
    // 1) CTE name (an identifier, optionally quoted).
    while (i < s.length && /\s/.test(s[i])) i++
    const nameMatch = /^("?[A-Za-z_][\w$]*"?)/.exec(s.slice(i))
    if (!nameMatch) return null
    let name = nameMatch[1]
    i += nameMatch[0].length
    name = name.replace(/^"|"$/g, '')

    // 2) Optional explicit column list: skip a balanced ( ... ) that is NOT the AS body.
    while (i < s.length && /\s/.test(s[i])) i++
    if (s[i] === '(') {
      const end = matchParen(s, i)
      if (end < 0) return null
      i = end + 1
    }

    // 3) The AS keyword.
    while (i < s.length && /\s/.test(s[i])) i++
    const asMatch = /^as\b/i.exec(s.slice(i))
    if (!asMatch) return null
    i += asMatch[0].length

    // 4) The body: a balanced ( ... ).
    while (i < s.length && /\s/.test(s[i])) i++
    if (s[i] !== '(') return null
    const bodyEnd = matchParen(s, i)
    if (bodyEnd < 0) return null
    const body = s.slice(i + 1, bodyEnd).trim()
    ctes.push({ name, body })
    i = bodyEnd + 1

    // 5) Either a comma (another CTE) or the tail SELECT.
    while (i < s.length && /\s/.test(s[i])) i++
    if (s[i] === ',') {
      i++
      continue
    }
    break
  }

  const tail = s.slice(i).trim()
  if (!tail) return null
  if (ctes.length === 0) return null
  // Duplicate CTE names would make `SELECT * FROM <name>` ambiguous to label.
  const names = new Set(ctes.map((c) => c.name))
  if (names.size !== ctes.length) return null
  return { ctes, tail }
}

/**
 * Given an index pointing at an opening paren, return the index of the matching
 * close paren, honoring nested parens and single-quoted string literals (with
 * SQL '' escaping). Returns -1 if unbalanced.
 */
function matchParen(s: string, open: number): number {
  let depth = 0
  let i = open
  let inStr = false
  while (i < s.length) {
    const c = s[i]
    if (inStr) {
      if (c === "'") {
        // '' is an escaped quote, stay in the string.
        if (s[i + 1] === "'") { i += 2; continue }
        inStr = false
      }
      i++
      continue
    }
    if (c === "'") { inStr = true; i++; continue }
    if (c === '(') depth++
    else if (c === ')') {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  return -1
}

/**
 * Tokenize a SQL fragment into bare identifiers (lowercased), ignoring anything
 * inside single-quoted string literals so a CTE name that only appears as text
 * (e.g. `'used'`) is not mistaken for a reference. Used to test whether one CTE
 * body / the tail references a given CTE by name.
 */
function identifiersIn(sql: string): Set<string> {
  // Drop single-quoted string literals (with '' escaping) so literal text never
  // registers as an identifier reference.
  const noStrings = sql.replace(/'(?:''|[^'])*'/g, ' ')
  const ids = new Set<string>()
  const re = /[A-Za-z_][\w$]*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(noStrings)) !== null) ids.add(m[0].toLowerCase())
  return ids
}

/**
 * Prune CTEs that the tail SELECT never reaches. Walk references transitively
 * starting from the tail: a CTE is "live" only if the tail (or another live CTE's
 * body) names it. Dead CTEs are dropped before stages are built, so a declared
 * but unused CTE never shows as a stage. Live CTEs are returned in their original
 * declaration order (so dependencies still resolve in the rebuilt WITH chain).
 */
function pruneUnreachableCtes(parsed: { ctes: Array<{ name: string; body: string }>; tail: string }): {
  ctes: Array<{ name: string; body: string }>
  tail: string
} {
  const byName = new Map(parsed.ctes.map((c) => [c.name.toLowerCase(), c]))
  const live = new Set<string>()
  const queue: string[] = []

  // Seed from identifiers the tail references that are actual CTE names.
  for (const id of identifiersIn(parsed.tail)) {
    if (byName.has(id) && !live.has(id)) { live.add(id); queue.push(id) }
  }
  // Transitively pull in CTEs referenced by already-live CTE bodies.
  while (queue.length > 0) {
    const cteName = queue.shift()!
    const cte = byName.get(cteName)
    if (!cte) continue
    for (const id of identifiersIn(cte.body)) {
      if (byName.has(id) && !live.has(id)) { live.add(id); queue.push(id) }
    }
  }

  return {
    ctes: parsed.ctes.filter((c) => live.has(c.name.toLowerCase())),
    tail: parsed.tail,
  }
}

/**
 * True when the tail SELECT has a top-level ORDER BY (paren- and string-aware, so
 * an ORDER BY inside a subquery or window does not count). Used to decide whether
 * the displayed 5 rows are already deterministic or need a display-only ordering.
 */
function tailHasTopLevelOrderBy(tail: string): boolean {
  let depth = 0
  let inStr = false
  const lower = tail.toLowerCase()
  for (let i = 0; i < tail.length; i++) {
    const c = tail[i]
    if (inStr) {
      if (c === "'") {
        if (tail[i + 1] === "'") { i++; continue }
        inStr = false
      }
      continue
    }
    if (c === "'") { inStr = true; continue }
    if (c === '(') { depth++; continue }
    if (c === ')') { depth--; continue }
    if (depth === 0 && (c === 'o' || c === 'O')) {
      // Match `order` followed by whitespace then `by` as a word boundary at depth 0.
      if (/^order\s+by\b/.test(lower.slice(i)) && (i === 0 || /\s|\)/.test(tail[i - 1]))) {
        return true
      }
    }
  }
  return false
}

/**
 * Pick a deterministic, representative <=5-row display slice from the FULL final
 * result set. When the query already has a top-level ORDER BY the engine's order
 * is authoritative, so the first 5 (already capped by execCapped) are used as-is.
 * Otherwise the displayed 5 are non-deterministic across engine runs, so we sort
 * the full rows by every column and take the first 5. This affects DISPLAY only;
 * certification always runs on the full set, never on this slice.
 */
function deterministicDisplaySlice(full: FinalResultSet): StageTable {
  const cols = full.columns.slice(0, MAX_TABLE_COLS)
  const sorted = [...full.rows].sort((a, b) => {
    for (let c = 0; c < cols.length; c++) {
      const cmp = a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0
      if (cmp !== 0) return cmp
    }
    return 0
  })
  return {
    columns: cols.map((c) => c.slice(0, MAX_CELL_CHARS)),
    rows: sorted.slice(0, MAX_TABLE_ROWS).map((row) => row.slice(0, MAX_TABLE_COLS)),
  }
}

/**
 * Build the `SELECT * FROM <cte>` materialization query for each CTE: keep the
 * full WITH chain (so dependencies resolve) and replace the tail with a select
 * of the target CTE. The last CTE in chain order uses the same full chain.
 */
function buildStageQueries(parsed: { ctes: Array<{ name: string; body: string }>; tail: string }): ParsedCte[] {
  const chain = `WITH ${parsed.ctes.map((c) => `${c.name} AS (${c.body})`).join(', ')}`
  return parsed.ctes.map((c) => ({
    name: c.name,
    query: `${chain} SELECT * FROM ${c.name}`,
  }))
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

let sqlJsPromise: ReturnType<typeof initSqlJs> | null = null

/** Init sql.js once per process, loading the WASM binary from node_modules. */
function getSqlJs(): ReturnType<typeof initSqlJs> {
  if (!sqlJsPromise) {
    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    if (fs.existsSync(wasmPath)) {
      const wasmBinary = fs.readFileSync(wasmPath)
      sqlJsPromise = initSqlJs({ wasmBinary })
    } else {
      sqlJsPromise = initSqlJs()
    }
  }
  return sqlJsPromise
}

/** Coerce a sql.js cell to a capped display string (mirrors the schema's <=24). */
function cell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  let str: string
  if (value instanceof Uint8Array) str = '<blob>'
  else str = String(value)
  if (str.length > MAX_CELL_CHARS) str = str.slice(0, MAX_CELL_CHARS - 1) + '…'
  return str
}

/** Run one query against an already-setup db and cap the result to 5x5. */
function execCapped(db: InstanceType<Awaited<ReturnType<typeof initSqlJs>>['Database']>, query: string): StageTable | null {
  const results = db.exec(query)
  if (!results || results.length === 0) {
    // No result set (e.g. the query produced zero rows AND zero declared cols).
    return { columns: [], rows: [] }
  }
  const first = results[0]
  const columns = first.columns.slice(0, MAX_TABLE_COLS).map((c) => String(c).slice(0, MAX_CELL_CHARS))
  const rows = first.values.slice(0, MAX_TABLE_ROWS).map((row) =>
    row.slice(0, MAX_TABLE_COLS).map((v) => cell(v)),
  )
  return { columns, rows }
}

/**
 * Run one query and return the FULL result set — every column, every row, no cap.
 * Cells are stringified with the same `cell()` coercion the display uses so a
 * later set comparison matches the display representation. This is what
 * certification runs against; `execCapped` is only for the displayed table.
 */
function execFull(db: InstanceType<Awaited<ReturnType<typeof initSqlJs>>['Database']>, query: string): FinalResultSet {
  const results = db.exec(query)
  if (!results || results.length === 0) {
    return { columns: [], rows: [] }
  }
  const first = results[0]
  const columns = first.columns.map((c) => String(c))
  const rows = first.values.map((row) => row.map((v) => cell(v)))
  return { columns, rows }
}

/**
 * Execute the reference SQL stage-by-stage against the setup-loaded db and emit
 * one delta per stage (each CTE, then the final outer SELECT). Returns null when
 * the query is not a usable CTE chain or any stage misbehaves.
 *
 * Reject (return null) when: no CTEs, recursive CTE, the chain yields fewer than
 * 2 or more than 6 stages, any stage throws, or the final result is empty.
 *
 * Async because sql.js init is async; the array harness is sync because it has
 * no engine to boot.
 */
export async function runPipelineTrace(
  referenceSql: string,
  setupSql: string,
  // schemaSql is accepted for parity with the array harness signature and future
  // dialects that separate DDL from seed data; sqlite setups carry both in
  // setup_script, so it is applied after setupSql when present.
  schemaSql?: string,
): Promise<PipelineTraceResult | null> {
  if (!referenceSql || !setupSql) return null

  const rawParsed = parseCteChain(referenceSql)
  if (!rawParsed) return null

  // Drop CTEs the tail never reaches (transitively) so a declared-but-unused CTE
  // never shows as a stage. Re-check the stage floor AFTER pruning: if pruning
  // drops us below MIN_STAGES (e.g. only a dead CTE existed), there is no real
  // multi-stage pipeline to walk, so bail.
  const parsed = pruneUnreachableCtes(rawParsed)

  // stageCount = one per (live) CTE + one final outer SELECT.
  const stageCount = parsed.ctes.length + 1
  if (stageCount < MIN_STAGES || stageCount > MAX_STAGES) return null

  // Pick a final-stage label that cannot collide with a CTE name. 'result' is the
  // default; if a CTE is literally named that, fall back to the first free option.
  const cteNamesLower = new Set(parsed.ctes.map((c) => c.name.toLowerCase()))
  const finalLabel = (['result', 'output', 'final', 'final_result'].find(
    (cand) => !cteNamesLower.has(cand.toLowerCase()),
  ) ?? 'final_output').slice(0, MAX_STAGE_LABEL)

  const stageQueries = buildStageQueries(parsed)

  const SQL = await getSqlJs()
  const db = new SQL.Database()
  try {
    if (schemaSql) db.run(schemaSql)
    db.run(setupSql)

    const stages: string[] = []
    const deltas: Array<{ activeStage: number; table?: StageTable }> = []

    // One delta per CTE stage.
    stageQueries.forEach((stage, idx) => {
      const table = execCapped(db, stage.query)
      if (table === null) throw new Error(`stage "${stage.name}" produced no result`)
      stages.push(stage.name.slice(0, MAX_STAGE_LABEL))
      deltas.push({ activeStage: idx, table: table.columns.length > 0 ? table : undefined })
    })

    // Final stage. The FULL result set (un-capped) is what certification compares
    // against; the displayed table is at most 5 rows and is DISPLAY only.
    const finalIdx = stageQueries.length
    const fullFinal = execFull(db, referenceSql)
    if (fullFinal.rows.length === 0) {
      // An empty final result cannot anchor a walkthrough (nothing certified).
      return null
    }
    // When the full result exceeds the display cap AND there is no top-level
    // ORDER BY, the engine's first 5 are non-deterministic. Show a deterministic,
    // representative slice instead (sorted by all columns) so the displayed table
    // never changes run-to-run. Certification is unaffected (it uses fullFinal).
    const finalTable =
      fullFinal.rows.length > MAX_TABLE_ROWS && !tailHasTopLevelOrderBy(parsed.tail)
        ? deterministicDisplaySlice(fullFinal)
        : execCapped(db, referenceSql)
    if (finalTable === null || finalTable.rows.length === 0) {
      return null
    }
    stages.push(finalLabel)
    deltas.push({ activeStage: finalIdx, table: finalTable })

    if (stages.length < MIN_STAGES || stages.length > MAX_STAGES) return null

    return { stages, deltas, finalRows: finalTable, fullFinal }
  } catch {
    // Any execution error (bad rewrite, dialect quirk) disqualifies the trace.
    return null
  } finally {
    db.close()
  }
}

// ---------------------------------------------------------------------------
// Diagram assembly
// ---------------------------------------------------------------------------

/**
 * Assemble a schema-valid InteractiveStepDiagram from a verified pipeline trace.
 * Mirrors buildSteppedArrayDiagram: the per-step prose here is a readable
 * deterministic default (meaningful titles, full-sentence explanations that name
 * the real stage and its row count). The generation route MAY replace
 * title/explanation/decision/pills with model-authored prose keyed to the same
 * step indices (see graft.ts), leaving the deltas (the thing that could be
 * wrong) untouched. When no model prose lands, these defaults stand.
 */
export function buildSteppedPipelineDiagram(
  trace: PipelineTraceResult,
  opts: { title?: string } = {},
): InteractiveStepDiagram {
  const lastIdx = trace.stages.length - 1
  const steps = trace.deltas.map((d, i) => {
    const isFinal = d.activeStage === lastIdx
    const stageName = trace.stages[d.activeStage]
    const rowCount = d.table?.rows.length ?? 0
    const rowWord = rowCount === 1 ? 'row' : 'rows'
    const title = isFinal ? 'Assemble the final result' : `Build the ${stageName} stage`
    const explanation = isFinal
      ? `The outer query reads from the stages above and produces the answer, ${rowCount} ${rowWord} here.`
      : `This stage runs against the real data and materializes ${rowCount} ${rowWord}. Later stages read from it instead of rescanning the base tables.`
    const pills = [
      { label: 'stage', value: stageName.slice(0, 24), tone: isFinal ? ('good' as const) : ('active' as const) },
      ...(d.table ? [{ label: 'rows', value: String(d.table.rows.length), tone: 'neutral' as const }] : []),
    ]
    return {
      title,
      explanation,
      decision: isFinal ? 'Assemble the final result.' : `Compute ${stageName}.`,
      pills,
      delta: {
        base: 'pipeline' as const,
        activeStage: d.activeStage,
        table: d.table,
      },
    }
  })

  return {
    kind: 'stepped',
    title: opts.title,
    base: {
      kind: 'pipeline',
      stages: trace.stages,
    },
    trace_verified: true,
    autoplay: false,
    steps,
  }
}

// ---------------------------------------------------------------------------
// Metadata orchestration + cross-check
// ---------------------------------------------------------------------------

interface SqlVisibleTestCase {
  id?: string
  label?: string
  hidden?: boolean
  is_hidden?: boolean
  match_mode?: string
  expected_rows?: Array<Record<string, unknown>>
}

export interface SteppedPipelineCandidate {
  diagram: InteractiveStepDiagram
}

/** Pull `sql_schema.setup_script` from metadata, the confirmed canonical field. */
function extractSetup(metadata: Record<string, unknown>): string | null {
  const sqlSchema = metadata.sql_schema as Record<string, unknown> | undefined
  if (sqlSchema && typeof sqlSchema.setup_script === 'string') return sqlSchema.setup_script
  return null
}

/** Pull `reference_solution.sql` (object form) from metadata. */
function extractReferenceSql(metadata: Record<string, unknown>): string | null {
  const ref = metadata.reference_solution
  if (ref && typeof ref === 'object' && typeof (ref as Record<string, unknown>).sql === 'string') {
    return (ref as Record<string, unknown>).sql as string
  }
  if (typeof ref === 'string') return ref
  return null
}

/**
 * Certify the harness's FULL (un-capped) final result set against a visible test
 * case's expected_rows. This must be true SET EQUALITY, not a subset check: the
 * harness's full result and expected must contain exactly the same rows.
 *
 * The earlier subset-on-display-cap check was unsound — a query returning the
 * right 5 rows PLUS a wrong 6th past the 5-row display cap was certified. Here we
 * compare the FULL result (every row, never the <=5 display slice):
 *   1. row counts must be equal (after multiset normalization), and
 *   2. every actual row is in expected AND every expected row is in actual.
 *
 * Rows are order-insensitive and column-order-insensitive; values are stringified
 * with the same `cell()` coercion so representation matches both sides. Returns
 * false on any mismatch in either direction or any count difference.
 *
 * Comparison restricts to the columns the harness actually returns: an
 * expected_rows entry may carry extra keys the SELECT does not project, but every
 * projected column must match. A missing projected key on an expected row reads as
 * 'NULL' and so will not match a non-null actual cell.
 */
function finalRowsAgree(fullFinal: FinalResultSet, expectedRows: Array<Record<string, unknown>>): boolean {
  if (fullFinal.rows.length === 0) return false
  if (fullFinal.rows.length !== expectedRows.length) return false

  const cols = fullFinal.columns

  // Multiset keys (duplicate rows counted) for both sides, keyed on projected cols.
  const actualCounts = new Map<string, number>()
  for (const row of fullFinal.rows) {
    const obj: Record<string, string> = {}
    cols.forEach((col, c) => { obj[col] = row[c] })
    const k = canonicalRowKey(obj)
    actualCounts.set(k, (actualCounts.get(k) ?? 0) + 1)
  }

  const expectedCounts = new Map<string, number>()
  for (const er of expectedRows) {
    const obj: Record<string, string> = {}
    for (const col of cols) obj[col] = cell(er[col])
    const k = canonicalRowKey(obj)
    expectedCounts.set(k, (expectedCounts.get(k) ?? 0) + 1)
  }

  // Same number of distinct rows AND identical per-row multiplicity in both
  // directions. Equal total counts plus a one-directional containment with equal
  // distinct-key counts forces exact set/multiset equality.
  if (actualCounts.size !== expectedCounts.size) return false
  for (const [k, n] of actualCounts) {
    if (expectedCounts.get(k) !== n) return false
  }
  return true
}

/** Stable string key for a row object: sort by column name, stringify values. */
function canonicalRowKey(obj: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(obj).sort().reduce((acc, k) => { acc[k] = obj[k]; return acc }, {} as Record<string, string>),
  )
}

/**
 * Build a verified stepped-pipeline diagram for a SQL challenge, or null if it is
 * not eligible. The SQL analogue of buildSteppedTraceFromMetadata.
 *
 * Eligibility is self-enforcing: a stepped diagram only appears when we can
 * (a) parse a 2-6 stage CTE chain from the reference, (b) execute every stage
 * against the real setup, and (c) cross-check the final stage rows against the
 * challenge's own visible expected_rows. Any failure means no stepped diagram.
 *
 * `tags` is accepted for signature parity with the array harness (and future
 * tag-gated SQL patterns); SQL eligibility is structural, so it is unused today.
 */
export async function buildSteppedPipelineFromMetadata(
  metadata: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tags: string[] = [],
): Promise<SteppedPipelineCandidate | null> {
  const setupSql = extractSetup(metadata)
  const referenceSql = extractReferenceSql(metadata)
  if (!setupSql || !referenceSql) return null

  const trace = await runPipelineTrace(referenceSql, setupSql)
  if (!trace) return null

  const testCases = Array.isArray(metadata.test_cases) ? (metadata.test_cases as SqlVisibleTestCase[]) : []
  const visible = testCases.filter((tc) => !tc.hidden && !tc.is_hidden)

  // The final stage must be certified by EVERY visible case that carries
  // expected_rows. One coincidental match is not enough; a visible case with no
  // expected_rows cannot certify, and a disagreement disqualifies. At least one
  // visible case must certify, or there is no oracle to trust.
  let certifiedCount = 0
  for (const tc of visible) {
    if (!Array.isArray(tc.expected_rows)) continue
    // Certify on the FULL un-capped result set, never the <=5-row display table.
    if (!finalRowsAgree(trace.fullFinal, tc.expected_rows)) return null
    certifiedCount++
  }
  if (certifiedCount === 0) return null

  return { diagram: buildSteppedPipelineDiagram(trace) }
}
