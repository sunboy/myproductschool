/**
 * Deterministic trace harness for the `grid` stepped-diagram base.
 *
 * The "wrong animation" risk is closed the same way the array harness closes it:
 * a dynamic-programming table is never authored by the model. We run a CANONICAL
 * tabulation of a named DP family (longest common subsequence, edit distance)
 * against the challenge's REAL inputs, fill the table in canonical row-major
 * order, and emit the cell values as step deltas. The trace is a program output,
 * not a creative artifact.
 *
 * To stay honest about correctness we also return the table's final answer (the
 * bottom-right cell) so the caller can cross-check it against the challenge's own
 * expected output on the same input. If they disagree, the canonical family is
 * not what this challenge wants, and the challenge is NOT stepped eligible. We
 * never show a trace for a problem the traced family does not genuinely solve.
 *
 * The diagram ships with readable per-step prose derived from the verified
 * tabulation. The generation route MAY overlay model-authored prose
 * (title/explanation/decision/pills) keyed by step index, but the model can
 * never add, remove, or reorder steps or touch a delta; the overlay is fail-soft
 * and the harness prose stands when it does not apply. See graft.ts and
 * buildSteppedGridDiagram().
 */

import type { InteractiveStepDiagram } from '@/lib/solutions/schema'

export type GridPattern = 'lcs' | 'edit_distance'

/** A filled cell in the DP table. */
export interface GridCell {
  r: number
  c: number
  value: string
}

/** One recorded step: the cells filled up to and including this batch. */
export interface GridTraceStep {
  /** All cells filled so far (cumulative), in row-major order. */
  fill: GridCell[]
  /** The last cell computed in this batch (the visible "active" cell). */
  active?: { r: number; c: number }
  /** The recurrence-input cells for the active cell (neighbors it read). */
  highlight?: Array<{ r: number; c: number }>
  /** Machine note describing what this batch did; the model rewrites it. */
  note: string
}

export interface GridTraceResult {
  pattern: GridPattern
  rows: number
  cols: number
  rowLabels: string[]
  colLabels: string[]
  steps: GridTraceStep[]
  /** Final answer the canonical tabulation produced (bottom-right cell). */
  answer: number
}

const MAX_ROWS = 8
const MAX_COLS = 12
const MIN_STEPS = 3
const MAX_STEPS = 8

/**
 * Build the row/column axis labels for the table. Index 0 is the empty-prefix
 * base case, then one label per input character. The base-case cell carries the
 * whole source string (capped at the schema's 24-char label limit) so the learner
 * can read which string belongs to this axis without having to guess from the
 * spelled-out characters. Source strings here are short (the display extent caps
 * rows at 7 and cols at 11 characters), so the full string always fits.
 */
function buildLabels(s: string): string[] {
  return [s.slice(0, 24), ...s.split('').map((ch) => ch.slice(0, 2))]
}

/**
 * LCS tabulation. Table is (m+1) x (n+1); cell[i][j] = length of the longest
 * common subsequence of a[0..i) and b[0..j). Returns the full table or null when
 * the inputs do not fit a clean walkthrough.
 */
function tabulateLcs(a: string, b: string): { table: number[][]; rows: number; cols: number } | null {
  const m = a.length
  const n = b.length
  if (m + 1 > MAX_ROWS || n + 1 > MAX_COLS) return null
  if (m < 1 || n < 1) return null
  const table: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1] + 1
      else table[i][j] = Math.max(table[i - 1][j], table[i][j - 1])
    }
  }
  return { table, rows: m + 1, cols: n + 1 }
}

/**
 * Edit-distance (Levenshtein) tabulation. cell[i][j] = min edits to turn a[0..i)
 * into b[0..j). Row 0 and column 0 are the deletion/insertion base cases.
 */
function tabulateEditDistance(a: string, b: string): { table: number[][]; rows: number; cols: number } | null {
  const m = a.length
  const n = b.length
  if (m + 1 > MAX_ROWS || n + 1 > MAX_COLS) return null
  if (m < 1 || n < 1) return null
  const table: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) table[i][0] = i
  for (let j = 0; j <= n; j++) table[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) table[i][j] = table[i - 1][j - 1]
      else table[i][j] = 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1])
    }
  }
  return { table, rows: m + 1, cols: n + 1 }
}

/** The neighbor cells the recurrence reads when computing cell (i, j). */
function recurrenceInputs(pattern: GridPattern, i: number, j: number, a: string, b: string): Array<{ r: number; c: number }> {
  if (i === 0 || j === 0) return []
  if (a[i - 1] === b[j - 1]) return [{ r: i - 1, c: j - 1 }]
  if (pattern === 'lcs') return [{ r: i - 1, c: j }, { r: i, c: j - 1 }]
  // edit distance reads all three neighbors on a mismatch
  return [{ r: i - 1, c: j - 1 }, { r: i - 1, c: j }, { r: i, c: j - 1 }]
}

/**
 * Turn a filled table into a step list. The first step shows the full base row
 * (row 0) and base column, then each later step fills exactly one DATA row
 * (rows 1..m). One row per step is always within the cap: the display extent
 * holds rows at MAX_ROWS (8), so there are at most 7 data rows, which plus the
 * base step lands at most at 8 steps (MAX_STEPS), so no row batching is needed.
 */
function buildSteps(
  pattern: GridPattern,
  table: number[][],
  rows: number,
  cols: number,
  a: string,
  b: string,
): GridTraceStep[] | null {
  const dataRows = rows - 1 // rows 1..m carry real recurrence work
  if (dataRows < 1) return null

  // Base cells: the whole of row 0 and column 0 (the DP boundary conditions).
  const baseFill: GridCell[] = []
  for (let c = 0; c < cols; c++) baseFill.push({ r: 0, c, value: String(table[0][c]) })
  for (let r = 1; r < rows; r++) baseFill.push({ r, c: 0, value: String(table[r][0]) })

  const steps: GridTraceStep[] = []
  const fillSoFar: GridCell[] = [...baseFill]

  // Step 1 establishes the base case visually before any recurrence runs.
  steps.push({
    fill: [...fillSoFar],
    note: pattern === 'lcs'
      ? 'Base case: an empty prefix shares no subsequence, so row 0 and column 0 are 0.'
      : 'Base case: turning an empty string into a prefix of length k costs k, so row 0 and column 0 count up.',
  })

  // One data row per step: fill the row, then snapshot the active cell + inputs.
  for (let r = 1; r < rows; r++) {
    let lastActive: { r: number; c: number } | undefined
    let lastInputs: Array<{ r: number; c: number }> | undefined
    for (let c = 1; c < cols; c++) {
      fillSoFar.push({ r, c, value: String(table[r][c]) })
      lastActive = { r, c }
      lastInputs = recurrenceInputs(pattern, r, c, a, b)
    }
    steps.push({
      fill: [...fillSoFar],
      active: lastActive,
      highlight: lastInputs && lastInputs.length > 0 ? lastInputs : undefined,
      note: `Fill row ${r}: each cell extends or carries the best from its neighbors.`,
    })
  }

  if (steps.length < MIN_STEPS) return null
  if (steps.length > MAX_STEPS) return null
  return steps
}

/**
 * Run the canonical DP tabulation for a family on two string inputs. Returns null
 * when the inputs are unusable (too large for the table extent, empty, or the
 * batched walkthrough would fall outside the [3, 8] step range).
 */
export function runGridTrace(pattern: GridPattern, a: string, b: string): GridTraceResult | null {
  const tab = pattern === 'lcs' ? tabulateLcs(a, b) : tabulateEditDistance(a, b)
  if (!tab) return null
  const { table, rows, cols } = tab

  const steps = buildSteps(pattern, table, rows, cols, a, b)
  if (!steps) return null

  return {
    pattern,
    rows,
    cols,
    rowLabels: buildLabels(a),
    colLabels: buildLabels(b),
    steps,
    answer: table[rows - 1][cols - 1],
  }
}

/**
 * Compute the canonical family's TRUE answer on an input, uncapped by the display
 * step/extent limits. Used by the cross-check so a display trace can never weaken
 * the correctness oracle. Returns null on unusable input.
 */
export function computeGridAnswer(pattern: GridPattern, a: string, b: string): number | null {
  if (a.length < 1 || b.length < 1) return null
  const tab = pattern === 'lcs' ? tabulateLcs(a, b) : tabulateEditDistance(a, b)
  if (!tab) {
    // The display-extent guard rejected it; recompute the answer without that
    // guard so the oracle is independent of how big the table is.
    return uncappedAnswer(pattern, a, b)
  }
  return tab.table[tab.rows - 1][tab.cols - 1]
}

/** Answer-only tabulation with no row/col extent limit (oracle, not displayed). */
function uncappedAnswer(pattern: GridPattern, a: string, b: string): number {
  const m = a.length
  const n = b.length
  const table: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  if (pattern === 'edit_distance') {
    for (let i = 0; i <= m; i++) table[i][0] = i
    for (let j = 0; j <= n; j++) table[0][j] = j
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = pattern === 'lcs' ? table[i - 1][j - 1] + 1 : table[i - 1][j - 1]
      } else {
        table[i][j] = pattern === 'lcs'
          ? Math.max(table[i - 1][j], table[i][j - 1])
          : 1 + Math.min(table[i - 1][j - 1], table[i - 1][j], table[i][j - 1])
      }
    }
  }
  return table[m][n]
}

/**
 * Assemble a schema-valid InteractiveStepDiagram from a verified grid trace. The
 * per-step prose here is a readable deterministic default (a meaningful title
 * plus the full-sentence note describing the recurrence). The generation route
 * MAY replace title/explanation/decision/pills with model-authored prose keyed
 * to the same step indices (see graft.ts), leaving the deltas (the thing that
 * could be wrong) untouched. When no model prose lands, these defaults stand.
 */
export function buildSteppedGridDiagram(
  trace: GridTraceResult,
  opts: { title?: string } = {},
): InteractiveStepDiagram {
  const steps = trace.steps.map((step, i) => ({
    title: i === 0 ? 'Fill the base case' : 'Fill the next row',
    explanation: step.note,
    decision: step.active ? `cell (${step.active.r}, ${step.active.c}) = ${cellValue(trace, step.active)}` : undefined,
    pills: step.active
      ? [{ label: 'answer so far', value: cellValue(trace, step.active), tone: 'active' as const }]
      : undefined,
    delta: {
      base: 'grid' as const,
      fill: step.fill,
      active: step.active,
      highlight: step.highlight,
    },
  }))

  return {
    kind: 'stepped',
    title: opts.title,
    base: {
      kind: 'grid',
      rows: trace.rows,
      cols: trace.cols,
      rowLabels: trace.rowLabels,
      colLabels: trace.colLabels,
    },
    trace_verified: true,
    autoplay: false,
    steps,
  }
}

/** Read a cell's recorded value out of a step's cumulative fill. */
function cellValue(trace: GridTraceResult, at: { r: number; c: number }): string {
  for (let i = trace.steps.length - 1; i >= 0; i--) {
    const hit = trace.steps[i].fill.find((f) => f.r === at.r && f.c === at.c)
    if (hit) return hit.value
  }
  return ''
}

// ── Metadata-driven entry point ───────────────────────────────────────────────

interface VisibleTestCase {
  args?: unknown[]
  input?: unknown
  expected?: unknown
  hidden?: boolean
  is_hidden?: boolean
}

const GRID_PATTERN_TAGS: Record<string, GridPattern> = {
  'lcs': 'lcs',
  'longest-common-subsequence': 'lcs',
  'longest common subsequence': 'lcs',
  'edit-distance': 'edit_distance',
  'edit_distance': 'edit_distance',
  'edit distance': 'edit_distance',
  'levenshtein': 'edit_distance',
  'levenshtein-distance': 'edit_distance',
}

/**
 * Infer the DP family from tags. A generic 'dynamic-programming' or 'knapsack'
 * tag alone is not enough: we only emit a verified trace for a family we have a
 * canonical tabulation for, so we require a family-specific tag (or one alongside
 * a 'dynamic-programming' tag).
 */
function detectGridPattern(tags: string[]): GridPattern | null {
  for (const tag of tags) {
    const hit = GRID_PATTERN_TAGS[tag.toLowerCase().trim()]
    if (hit) return hit
  }
  return null
}

/**
 * Pull the two string inputs from a visible test case for the DP family, keeping
 * their ARGUMENT ORDER. `a` is the first string argument the challenge passes and
 * `b` is the second. Orientation is anchored to that order so the table's row axis
 * is always the first argument and the column axis is always the second, matching
 * how the challenge frames the call. The answer is symmetric for LCS and edit
 * distance, but the displayed axes are not, so we never transpose them.
 */
function extractStringInputs(tc: VisibleTestCase): { a: string; b: string } | null {
  const args = Array.isArray(tc.args) ? tc.args : (Array.isArray(tc.input) ? (tc.input as unknown[]) : null)
  if (!args || args.length < 2) return null
  const strings: string[] = []
  for (const x of args) {
    if (typeof x === 'string') strings.push(x)
    if (strings.length === 2) break
  }
  if (strings.length < 2) return null
  return { a: strings[0], b: strings[1] }
}

function answersAgree(canonical: number, expected: unknown): boolean {
  return Number(canonical) === Number(expected)
}

export interface SteppedGridCandidate {
  diagram: InteractiveStepDiagram
  pattern: GridPattern
}

/**
 * Build a verified stepped-grid diagram for a DP algorithm challenge, or null if
 * it is not eligible. Pure (no DB): callers pass the metadata + tags they have.
 *
 * Eligibility mirrors the array harness: recognize a supported DP family, run its
 * canonical tabulation on a real visible test case, and cross-check the table's
 * answer against EVERY extractable case's `expected`. Any disagreement, missing
 * oracle, or unusable input means no stepped diagram.
 */
export function buildSteppedGridFromMetadata(
  metadata: Record<string, unknown>,
  tags: string[],
): SteppedGridCandidate | null {
  const pattern = detectGridPattern(tags)
  if (!pattern) return null

  const testCases = Array.isArray(metadata.test_cases) ? (metadata.test_cases as VisibleTestCase[]) : []
  const visible = testCases.filter((tc) => !tc.hidden && !tc.is_hidden)

  let diagramTrace: GridTraceResult | null = null
  let certifiedCount = 0

  for (const tc of visible) {
    const input = extractStringInputs(tc)
    if (!input) continue // case shape we cannot map to this family; ignore it
    if (tc.expected === undefined) return null // an extractable case with no oracle: cannot certify

    const answer = computeGridAnswer(pattern, input.a, input.b)
    if (answer === null || !answersAgree(answer, tc.expected)) return null
    certifiedCount++

    if (!diagramTrace) {
      const trace = runGridTrace(pattern, input.a, input.b)
      if (trace) diagramTrace = trace
    }
  }

  if (certifiedCount === 0 || !diagramTrace) return null
  return { diagram: buildSteppedGridDiagram(diagramTrace), pattern }
}
