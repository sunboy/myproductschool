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

export type GridPattern =
  | 'lcs'
  | 'edit_distance'
  | 'knapsack'
  | 'coin_change_min'
  | 'unique_paths'
  | 'min_path_sum'

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

/** The neighbor cells the LCS / edit-distance recurrence reads for cell (i, j). */
function stringRecurrenceInputs(pattern: GridPattern, i: number, j: number, a: string, b: string): Array<{ r: number; c: number }> {
  if (i === 0 || j === 0) return []
  if (a[i - 1] === b[j - 1]) return [{ r: i - 1, c: j - 1 }]
  if (pattern === 'lcs') return [{ r: i - 1, c: j }, { r: i, c: j - 1 }]
  // edit distance reads all three neighbors on a mismatch
  return [{ r: i - 1, c: j - 1 }, { r: i - 1, c: j }, { r: i, c: j - 1 }]
}

/**
 * How a family renders a cell value and which cells the recurrence read to fill
 * cell (r, c). Passing this in keeps buildStepsGeneric family-agnostic: the LCS,
 * edit-distance, knapsack, coin-change, unique-paths, and min-path-sum tables all
 * fill row by row, they only differ in the cell display token, the recurrence
 * geometry, and the base-case caption.
 */
interface TableShape {
  /** Render a numeric cell value into its short display token (<= 8 chars). */
  format: (value: number) => string
  /** The neighbor cells (r, c) read its value from, for the highlight emphasis. */
  inputs: (r: number, c: number) => Array<{ r: number; c: number }>
  /** Whether row 0 / column 0 are a separate boundary layer (true) or real data. */
  hasBoundaryLayer: boolean
  /** The base-case caption shown on the first step. */
  baseNote: string
  /** The per-row caption builder for data rows. */
  rowNote: (r: number) => string
}

/**
 * Turn a filled numeric table into a step list, family-agnostically. The first
 * step shows the full boundary layer (row 0 + column 0), then each later step
 * fills exactly one DATA row. One row per step always stays within the cap: the
 * display extent holds rows at MAX_ROWS (8), so there are at most 7 data rows,
 * which plus the base step lands at most at 8 steps (MAX_STEPS), so no row
 * batching is needed. A family WITHOUT a separate boundary layer (a grid whose
 * row 0 / column 0 carry real data, like unique-paths or min-path-sum) still
 * seeds the first step with row 0 + column 0 so the recurrence rows have visible
 * inputs to read from; those cells just happen to be data, not zeros.
 */
function buildStepsGeneric(
  table: number[][],
  rows: number,
  cols: number,
  shape: TableShape,
): GridTraceStep[] | null {
  const dataRows = rows - 1 // rows 1..m carry real recurrence work
  if (dataRows < 1) return null

  // Boundary fill: the whole of row 0 and column 0 (the DP seed conditions).
  const baseFill: GridCell[] = []
  for (let c = 0; c < cols; c++) baseFill.push({ r: 0, c, value: shape.format(table[0][c]) })
  for (let r = 1; r < rows; r++) baseFill.push({ r, c: 0, value: shape.format(table[r][0]) })

  const steps: GridTraceStep[] = []
  const fillSoFar: GridCell[] = [...baseFill]

  // Step 1 establishes the boundary layer visually before any recurrence runs.
  steps.push({ fill: [...fillSoFar], note: shape.baseNote })

  // One data row per step: fill the row, then snapshot the active cell + inputs.
  for (let r = 1; r < rows; r++) {
    let lastActive: { r: number; c: number } | undefined
    let lastInputs: Array<{ r: number; c: number }> | undefined
    for (let c = 1; c < cols; c++) {
      fillSoFar.push({ r, c, value: shape.format(table[r][c]) })
      lastActive = { r, c }
      lastInputs = shape.inputs(r, c)
    }
    steps.push({
      fill: [...fillSoFar],
      active: lastActive,
      highlight: lastInputs && lastInputs.length > 0 ? lastInputs : undefined,
      note: shape.rowNote(r),
    })
  }

  if (steps.length < MIN_STEPS) return null
  if (steps.length > MAX_STEPS) return null
  return steps
}

/** The LCS / edit-distance table shape (the original two-string families). */
function stringShape(pattern: GridPattern, a: string, b: string): TableShape {
  return {
    format: (v) => String(v),
    inputs: (r, c) => stringRecurrenceInputs(pattern, r, c, a, b),
    hasBoundaryLayer: true,
    baseNote: pattern === 'lcs'
      ? 'Base case: an empty prefix shares no subsequence, so row 0 and column 0 are 0.'
      : 'Base case: turning an empty string into a prefix of length k costs k, so row 0 and column 0 count up.',
    rowNote: (r) => `Fill row ${r}: each cell extends or carries the best from its neighbors.`,
  }
}

/**
 * Run the canonical DP tabulation for a family on two string inputs. Returns null
 * when the inputs are unusable (too large for the table extent, empty, or the
 * batched walkthrough would fall outside the [3, 8] step range).
 */
export function runGridTrace(pattern: GridPattern, a: string, b: string): GridTraceResult | null {
  if (pattern !== 'lcs' && pattern !== 'edit_distance') return null
  const tab = pattern === 'lcs' ? tabulateLcs(a, b) : tabulateEditDistance(a, b)
  if (!tab) return null
  const { table, rows, cols } = tab

  const steps = buildStepsGeneric(table, rows, cols, stringShape(pattern, a, b))
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
  if (pattern !== 'lcs' && pattern !== 'edit_distance') return null
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

// ── Numeric 2-D DP families (knapsack, coin-change, unique-paths, min-path-sum) ──
//
// These join LCS/edit-distance as canonical tabulations. Each fills its table in
// row-major order and emits one delta per data row through buildStepsGeneric, the
// same machine-generated path. The display token, the recurrence geometry, and the
// base caption are the only family-specific pieces. Each family ships a TRUE-answer
// oracle uncapped by the display extent so the cross-check stays independent of how
// big the displayed table is. Inputs that overflow the table extent (rows > 8,
// cols > 12) are rejected (the run returns null) rather than truncated into a wrong
// trace; the oracle still computes the true answer on the full input.

const INF = Number.POSITIVE_INFINITY

/** Knapsack inputs the challenge passes: per-item weights, values, and a capacity. */
export interface KnapsackInput {
  weights: number[]
  values: number[]
  capacity: number
}

/**
 * 0/1 knapsack tabulation. Rows are items (0..n), columns are remaining capacity
 * (0..W). cell[i][w] = best value achievable using the first i items within
 * capacity w. Row 0 (no items) and column 0 (no capacity) are 0. The recurrence
 * either skips item i (read directly above) or takes it (read the cell one row up
 * and weight[i] columns left, plus its value). Returns the full table, or null when
 * the displayed table would overflow the extent. The capacity axis adds one column
 * for the w=0 base case, so a capacity of 11 is the largest that fits 12 columns.
 */
function tabulateKnapsack(input: KnapsackInput): { table: number[][]; rows: number; cols: number } | null {
  const { weights, values, capacity } = input
  const n = weights.length
  if (n < 1 || n !== values.length) return null
  if (!Number.isInteger(capacity) || capacity < 1) return null
  if (weights.some((w) => !Number.isInteger(w) || w < 0)) return null
  if (n + 1 > MAX_ROWS || capacity + 1 > MAX_COLS) return null
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(capacity + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let w = 1; w <= capacity; w++) {
      const skip = table[i - 1][w]
      const take = weights[i - 1] <= w ? values[i - 1] + table[i - 1][w - weights[i - 1]] : -Infinity
      table[i][w] = Math.max(skip, take)
    }
  }
  return { table, rows: n + 1, cols: capacity + 1 }
}

/** Knapsack recurrence inputs for cell (i, w): the skip cell and (when takeable) the take cell. */
function knapsackInputs(weights: number[], i: number, w: number): Array<{ r: number; c: number }> {
  if (i === 0 || w === 0) return []
  const inputs: Array<{ r: number; c: number }> = [{ r: i - 1, c: w }]
  if (weights[i - 1] <= w) inputs.push({ r: i - 1, c: w - weights[i - 1] })
  return inputs
}

/**
 * Coin-change MINIMUM coins. A 2-D layering of the classic 1-D unbounded DP: rows
 * are the prefix of coins considered (0..k), columns are the target amount (0..A).
 * cell[i][a] = fewest coins drawn from the first i coin types that sum to a, or
 * unreachable. Row 0 (no coins) is 0 at amount 0 and unreachable elsewhere; column
 * 0 (amount 0) is always 0. The recurrence either ignores coin i (read directly
 * above) or uses one more copy of it (read the SAME row, coin[i-1] columns left,
 * plus one). Unreachable cells display a dash. Returns the table, or null on
 * overflow. The amount axis adds one column for a=0, so amount 11 fills 12 columns.
 */
function tabulateCoinChangeMin(coins: number[], amount: number): { table: number[][]; rows: number; cols: number } | null {
  const k = coins.length
  if (k < 1) return null
  if (!Number.isInteger(amount) || amount < 1) return null
  if (coins.some((c) => !Number.isInteger(c) || c < 1)) return null
  if (k + 1 > MAX_ROWS || amount + 1 > MAX_COLS) return null
  const table: number[][] = Array.from({ length: k + 1 }, () => new Array<number>(amount + 1).fill(INF))
  for (let i = 0; i <= k; i++) table[i][0] = 0
  for (let i = 1; i <= k; i++) {
    for (let a = 1; a <= amount; a++) {
      const ignore = table[i - 1][a]
      const use = coins[i - 1] <= a ? table[i][a - coins[i - 1]] + 1 : INF
      table[i][a] = Math.min(ignore, use)
    }
  }
  return { table, rows: k + 1, cols: amount + 1 }
}

/** Coin-change recurrence inputs for cell (i, a): the ignore cell and (when usable) the use cell. */
function coinChangeInputs(coins: number[], i: number, a: number): Array<{ r: number; c: number }> {
  if (i === 0 || a === 0) return []
  const inputs: Array<{ r: number; c: number }> = [{ r: i - 1, c: a }]
  if (coins[i - 1] <= a) inputs.push({ r: i, c: a - coins[i - 1] })
  return inputs
}

/** Render a coin-change cell: the infinity glyph for an unreachable amount, else the count. */
function coinChangeFormat(v: number): string {
  return v === INF ? '∞' : String(v)
}

/**
 * Unique-paths tabulation over an m x n grid. cell[r][c] = number of distinct
 * paths from the top-left to (r, c) moving only right or down. The top row and
 * left column are 1 (a single straight path) until an obstacle, after which they
 * are 0. An obstacle cell is always 0. The recurrence sums the cell above and the
 * cell to the left. An all-open grid (no obstacles) is the classic Unique Paths;
 * a 0/1 obstacle grid is Unique Paths II (1 = blocked). Returns the table, or null
 * on overflow / a blocked start.
 */
function tabulateUniquePaths(blocked: boolean[][]): { table: number[][]; rows: number; cols: number } | null {
  const m = blocked.length
  if (m < 1) return null
  const n = blocked[0].length
  if (n < 1 || blocked.some((row) => row.length !== n)) return null
  if (m > MAX_ROWS || n > MAX_COLS) return null
  if (blocked[0][0] || blocked[m - 1][n - 1]) return null // blocked endpoints: no path to trace
  const table: number[][] = Array.from({ length: m }, () => new Array<number>(n).fill(0))
  table[0][0] = 1
  for (let c = 1; c < n; c++) table[0][c] = blocked[0][c] ? 0 : table[0][c - 1]
  for (let r = 1; r < m; r++) table[r][0] = blocked[r][0] ? 0 : table[r - 1][0]
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      table[r][c] = blocked[r][c] ? 0 : table[r - 1][c] + table[r][c - 1]
    }
  }
  return { table, rows: m, cols: n }
}

/**
 * Minimum-path-sum tabulation over an m x n weight grid. cell[r][c] = the smallest
 * sum of weights along any right/down path from the top-left to (r, c). The top
 * row and left column accumulate the only path available to them; every interior
 * cell adds its own weight to the cheaper of the cell above and the cell to the
 * left. Returns the table, or null on overflow.
 */
function tabulateMinPathSum(grid: number[][]): { table: number[][]; rows: number; cols: number } | null {
  const m = grid.length
  if (m < 1) return null
  const n = grid[0].length
  if (n < 1 || grid.some((row) => row.length !== n)) return null
  if (grid.some((row) => row.some((v) => typeof v !== 'number' || !Number.isFinite(v)))) return null
  if (m > MAX_ROWS || n > MAX_COLS) return null
  const table: number[][] = Array.from({ length: m }, () => new Array<number>(n).fill(0))
  table[0][0] = grid[0][0]
  for (let c = 1; c < n; c++) table[0][c] = table[0][c - 1] + grid[0][c]
  for (let r = 1; r < m; r++) table[r][0] = table[r - 1][0] + grid[r][0]
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      table[r][c] = grid[r][c] + Math.min(table[r - 1][c], table[r][c - 1])
    }
  }
  return { table, rows: m, cols: n }
}

/** Up + left recurrence inputs for a grid cell (unique-paths and min-path-sum). */
function gridUpLeftInputs(r: number, c: number): Array<{ r: number; c: number }> {
  if (r === 0 || c === 0) return []
  return [{ r: r - 1, c }, { r, c: c - 1 }]
}

/**
 * Run a knapsack walkthrough trace. Builds the row-by-row step list through the
 * shared generic builder; returns null when the input overflows the table extent
 * or the step count falls outside [3, 8].
 */
export function runKnapsackTrace(input: KnapsackInput): GridTraceResult | null {
  const tab = tabulateKnapsack(input)
  if (!tab) return null
  const { table, rows, cols } = tab
  const steps = buildStepsGeneric(table, rows, cols, {
    format: (v) => String(v),
    inputs: (r, c) => knapsackInputs(input.weights, r, c),
    hasBoundaryLayer: true,
    baseNote: 'Base case: with no items chosen, or no capacity to spend, the best value is 0.',
    rowNote: (r) => `Consider item ${r}: each cell keeps the better of skipping it or taking it within that capacity.`,
  })
  if (!steps) return null
  return {
    pattern: 'knapsack',
    rows,
    cols,
    rowLabels: ['0 items', ...input.weights.map((w, i) => `i${i + 1} w${w}`.slice(0, 24))],
    colLabels: Array.from({ length: cols }, (_, w) => String(w)),
    steps,
    answer: table[rows - 1][cols - 1],
  }
}

/** Run a coin-change (minimum coins) walkthrough trace, or null on overflow / bad step count. */
export function runCoinChangeMinTrace(coins: number[], amount: number): GridTraceResult | null {
  const tab = tabulateCoinChangeMin(coins, amount)
  if (!tab) return null
  const { table, rows, cols } = tab
  const steps = buildStepsGeneric(table, rows, cols, {
    format: coinChangeFormat,
    inputs: (r, c) => coinChangeInputs(coins, r, c),
    hasBoundaryLayer: true,
    baseNote: 'Base case: amount 0 needs 0 coins; with no coin types, every larger amount is unreachable.',
    rowNote: (r) => `Add coin ${coins[r - 1]}: each amount keeps the fewest coins between ignoring this coin and using one more of it.`,
  })
  if (!steps) return null
  // The bottom-right cell is unreachable iff no combination sums to the amount.
  const raw = table[rows - 1][cols - 1]
  return {
    pattern: 'coin_change_min',
    rows,
    cols,
    rowLabels: ['no coins', ...coins.map((c) => `coin ${c}`.slice(0, 24))],
    colLabels: Array.from({ length: cols }, (_, a) => String(a)),
    steps,
    answer: raw === INF ? -1 : raw,
  }
}

/** Run a unique-paths walkthrough trace over an obstacle grid (false = open), or null on overflow. */
export function runUniquePathsTrace(blocked: boolean[][]): GridTraceResult | null {
  const tab = tabulateUniquePaths(blocked)
  if (!tab) return null
  const { table, rows, cols } = tab
  const steps = buildStepsGeneric(table, rows, cols, {
    format: (v) => String(v),
    inputs: gridUpLeftInputs,
    hasBoundaryLayer: false,
    baseNote: 'Base case: the top row and left column each have a single straight path, so they are 1 until a blocked cell cuts them off.',
    rowNote: (r) => `Fill row ${r}: each open cell sums the paths arriving from above and from the left.`,
  })
  if (!steps) return null
  return {
    pattern: 'unique_paths',
    rows,
    cols,
    rowLabels: Array.from({ length: rows }, (_, r) => `r${r}`),
    colLabels: Array.from({ length: cols }, (_, c) => `c${c}`),
    steps,
    answer: table[rows - 1][cols - 1],
  }
}

/** Run a minimum-path-sum walkthrough trace over a weight grid, or null on overflow. */
export function runMinPathSumTrace(grid: number[][]): GridTraceResult | null {
  const tab = tabulateMinPathSum(grid)
  if (!tab) return null
  const { table, rows, cols } = tab
  const steps = buildStepsGeneric(table, rows, cols, {
    format: (v) => String(v),
    inputs: gridUpLeftInputs,
    hasBoundaryLayer: false,
    baseNote: 'Base case: the top row and left column have only one way in, so each accumulates the running sum of the weights along that single path.',
    rowNote: (r) => `Fill row ${r}: each cell adds its own weight to the cheaper of the cell above and the cell to its left.`,
  })
  if (!steps) return null
  return {
    pattern: 'min_path_sum',
    rows,
    cols,
    rowLabels: Array.from({ length: rows }, (_, r) => `r${r}`),
    colLabels: Array.from({ length: cols }, (_, c) => `c${c}`),
    steps,
    answer: table[rows - 1][cols - 1],
  }
}

// ── Uncapped oracles for the numeric families (cross-check, never displayed) ───

/** True fewest-coins answer (or -1) for amount, uncapped by the display extent. */
export function computeCoinChangeMinAnswer(coins: number[], amount: number): number | null {
  if (coins.length < 1) return null
  if (!Number.isInteger(amount) || amount < 0) return null
  if (coins.some((c) => !Number.isInteger(c) || c < 1)) return null
  const dp = new Array<number>(amount + 1).fill(INF)
  dp[0] = 0
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1
    }
  }
  return dp[amount] === INF ? -1 : dp[amount]
}

/** True max-value answer for a 0/1 knapsack, uncapped by the display extent. */
export function computeKnapsackAnswer(input: KnapsackInput): number | null {
  const { weights, values, capacity } = input
  const n = weights.length
  if (n < 1 || n !== values.length) return null
  if (!Number.isInteger(capacity) || capacity < 0) return null
  if (weights.some((w) => !Number.isInteger(w) || w < 0)) return null
  const dp = new Array<number>(capacity + 1).fill(0)
  for (let i = 0; i < n; i++) {
    for (let w = capacity; w >= weights[i]; w--) {
      const take = values[i] + dp[w - weights[i]]
      if (take > dp[w]) dp[w] = take
    }
  }
  return dp[capacity]
}

/** True path count for unique-paths, uncapped by the display extent. */
export function computeUniquePathsAnswer(blocked: boolean[][]): number | null {
  const m = blocked.length
  if (m < 1) return null
  const n = blocked[0].length
  if (n < 1 || blocked.some((row) => row.length !== n)) return null
  if (blocked[0][0] || blocked[m - 1][n - 1]) return 0
  const dp: number[][] = Array.from({ length: m }, () => new Array<number>(n).fill(0))
  dp[0][0] = 1
  for (let c = 1; c < n; c++) dp[0][c] = blocked[0][c] ? 0 : dp[0][c - 1]
  for (let r = 1; r < m; r++) dp[r][0] = blocked[r][0] ? 0 : dp[r - 1][0]
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) dp[r][c] = blocked[r][c] ? 0 : dp[r - 1][c] + dp[r][c - 1]
  }
  return dp[m - 1][n - 1]
}

/** True minimum path sum, uncapped by the display extent. */
export function computeMinPathSumAnswer(grid: number[][]): number | null {
  const m = grid.length
  if (m < 1) return null
  const n = grid[0].length
  if (n < 1 || grid.some((row) => row.length !== n)) return null
  if (grid.some((row) => row.some((v) => typeof v !== 'number' || !Number.isFinite(v)))) return null
  const dp: number[][] = Array.from({ length: m }, () => new Array<number>(n).fill(0))
  dp[0][0] = grid[0][0]
  for (let c = 1; c < n; c++) dp[0][c] = dp[0][c - 1] + grid[0][c]
  for (let r = 1; r < m; r++) dp[r][0] = dp[r - 1][0] + grid[r][0]
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) dp[r][c] = grid[r][c] + Math.min(dp[r - 1][c], dp[r][c - 1])
  }
  return dp[m - 1][n - 1]
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
  'knapsack': 'knapsack',
  '0-1-knapsack': 'knapsack',
  '0/1-knapsack': 'knapsack',
  'coin-change': 'coin_change_min',
  'coin_change': 'coin_change_min',
  'coin change': 'coin_change_min',
  'unique-paths': 'unique_paths',
  'unique_paths': 'unique_paths',
  'unique paths': 'unique_paths',
  'min-path-sum': 'min_path_sum',
  'min_path_sum': 'min_path_sum',
  'minimum-path-sum': 'min_path_sum',
  'minimum path sum': 'min_path_sum',
}

/** A bare topic tag that says "this is DP" without naming the family. */
const GENERIC_DP_TAGS = new Set([
  'dynamic-programming',
  'dynamic_programming',
  'dynamic programming',
  'dp',
])

/**
 * Infer a specific DP family from the reference solution's shape. The live content
 * tags most DP challenges with a bare 'dynamic-programming' topic and encodes the
 * family in the title (which is not in metadata), so the reference code is the
 * reliable family discriminator. Each signature is intentionally strict so an
 * unrelated DP reference is not mislabeled; the answer cross-check downstream still
 * rejects a misroute, but a strict gate avoids running a doomed trace.
 *
 * Coin Change comes in two distinct objectives that share a tag/name root:
 *   - MINIMUM coins ('def solution(coins, amount)', dp seeded to infinity, dp[a] =
 *     min(..., dp[a-c]+1)) — the family this harness traces.
 *   - number of COMBINATIONS ('def solution(amount, coins)', dp[0]=1, dp[j]+=
 *     dp[j-c]) — a different recurrence we do NOT trace, so it is rejected, never
 *     forced onto the min-coins tracer.
 */
function detectGridPatternFromReference(src: string): GridPattern | null {
  const s = src.toLowerCase()
  // Coin Change II (combinations) signature FIRST so it is excluded before the
  // min-coins check: it accumulates counts (dp[j] += dp[j - c]) from a dp[0] = 1 seed.
  const isCombos = /dp\s*\[\s*\w+\s*\]\s*\+=\s*dp\s*\[\s*\w+\s*-\s*\w+\s*\]/.test(s) && /dp\s*\[\s*0\s*\]\s*=\s*1/.test(s)
  if (isCombos) return null // a real DP family, but not one this harness traces

  // Coin Change MINIMUM: an infinity-seeded dp with a +1 min recurrence.
  const seedsInfinity = /float\(\s*['"]inf['"]\s*\)/.test(s) || /\binf\b/.test(s)
  const minPlusOne = /min\s*\([^)]*\+\s*1/.test(s) || /\bdp\s*\[\s*\w+\s*-\s*\w+\s*\]\s*\+\s*1/.test(s)
  if (seedsInfinity && minPlusOne && /\bcoin/.test(s)) return 'coin_change_min'

  // Knapsack: a max over (skip vs take with the item's value added).
  if (/\bknapsack\b/.test(s)) return 'knapsack'
  const takeSkipMax = /max\s*\([^)]*\b(dp|table)\b[^)]*,[^)]*\b(value|val|v)\b/.test(s) && /\bweight\b/.test(s)
  if (takeSkipMax) return 'knapsack'

  // Minimum Path Sum FIRST: each grid/dp cell adds a weight to the MIN of two
  // neighbors. Checked before unique-paths because both touch a 2-D table, but only
  // min-path-sum carries a `min(` over the neighbors (unique-paths is a pure sum).
  const minOfNeighbors = /min\s*\(\s*(grid|dp|cost)\b/.test(s) || /\+=\s*min\s*\(/.test(s) || /\+\s*min\s*\(\s*(grid|dp)\s*\[/.test(s)
  if (/\bgrid\b/.test(s) && minOfNeighbors) return 'min_path_sum'

  // Unique Paths: a count recurrence that ADDS two neighbors with NO min/max. Two
  // canonical shapes: the rolling 1-D form (dp seeded to all 1s, dp[j] += dp[j-1])
  // and the 2-D form (dp[i][j] = dp[i-1][j] + dp[i][j-1]). An obstacle variant zeroes
  // blocked cells. Require the additive shape AND the absence of min/max so a
  // min-path-sum or knapsack reference is never mislabeled as a path count.
  const noMinMax = !/\bmin\s*\(/.test(s) && !/\bmax\s*\(/.test(s)
  const rolling1d = /\bdp\s*=\s*\[\s*1\s*\]\s*\*/.test(s) && /\+=\s*dp\s*\[\s*\w+\s*-\s*1\s*\]/.test(s)
  const grid2d = /dp\s*\[[^\]]+\]\s*\[[^\]]+\]\s*=\s*dp\s*\[[^\]]*-\s*1[^\]]*\]\s*\[[^\]]+\]\s*\+\s*dp\s*\[[^\]]+\]\s*\[[^\]]*-\s*1[^\]]*\]/.test(s)
  if (noMinMax && (rolling1d || grid2d)) return 'unique_paths'
  if (/obstacle/.test(s) && noMinMax && /\+=\s*dp/.test(s)) return 'unique_paths'

  return null
}

/**
 * Infer the DP family from tags, then a reference-code fallback. A family-specific
 * tag wins outright. A bare 'dynamic-programming' tag (no family) routes to the
 * reference-code discriminator, since the live content names the family only in the
 * title. With neither a family tag nor a recognizable reference signature, there is
 * no family to trace, so we return null and the challenge keeps its static diagram.
 */
function detectGridPattern(tags: string[], referenceSource: string): GridPattern | null {
  for (const tag of tags) {
    const norm = tag.toLowerCase().trim()
    const hit = GRID_PATTERN_TAGS[norm]
    if (hit) return hit
  }
  // No family-specific tag. Fall back to the reference code: a bare
  // 'dynamic-programming' tag (the common live case) names no family, and an
  // untagged grid problem names none either, so a clear reference signature is the
  // only honest way to pick a family. GENERIC_DP_TAGS documents the tags that ride
  // this fallback rather than failing outright; a recognizable signature qualifies
  // even when no DP tag is present.
  void GENERIC_DP_TAGS
  return detectGridPatternFromReference(referenceSource)
}

/** Read the reference solution source (string or {python|py}) for the fallback. */
function extractRef(reference: unknown): string {
  if (typeof reference === 'string') return reference
  if (reference && typeof reference === 'object') {
    const r = reference as Record<string, unknown>
    if (typeof r.python === 'string') return r.python
    if (typeof r.py === 'string') return r.py
  }
  return ''
}

/** Positional args out of a visible test case (args, or input-as-args). */
function readArgs(tc: VisibleTestCase): unknown[] | null {
  if (Array.isArray(tc.args)) return tc.args
  if (Array.isArray(tc.input)) return tc.input as unknown[]
  return null
}

/** A 2-D array of finite numbers (a weight grid for min-path-sum). */
function asNumberGrid(x: unknown): number[][] | null {
  if (!Array.isArray(x) || x.length === 0) return null
  const grid: number[][] = []
  for (const row of x) {
    if (!Array.isArray(row) || row.length === 0) return null
    const nums: number[] = []
    for (const v of row) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return null
      nums.push(v)
    }
    grid.push(nums)
  }
  return grid
}

/** A 2-D 0/1 obstacle grid -> a boolean blocked-cell grid (1 / truthy = blocked). */
function asObstacleGrid(x: unknown): boolean[][] | null {
  if (!Array.isArray(x) || x.length === 0) return null
  const grid: boolean[][] = []
  for (const row of x) {
    if (!Array.isArray(row) || row.length === 0) return null
    const cells: boolean[] = []
    for (const v of row) {
      if (v === 0 || v === false) cells.push(false)
      else if (v === 1 || v === true) cells.push(true)
      else return null // not a clean 0/1 obstacle grid
    }
    grid.push(cells)
  }
  return grid
}

/**
 * Pull the two string inputs from a visible test case for the LCS / edit-distance
 * family, keeping their ARGUMENT ORDER. `a` is the first string argument the
 * challenge passes and `b` is the second. Orientation is anchored to that order so
 * the row axis is always the first argument and the column axis the second, matching
 * how the challenge frames the call. The answer is symmetric for LCS and edit
 * distance, but the displayed axes are not, so we never transpose them.
 */
function extractStringInputs(tc: VisibleTestCase): { a: string; b: string } | null {
  const args = readArgs(tc)
  if (!args || args.length < 2) return null
  const strings: string[] = []
  for (const x of args) {
    if (typeof x === 'string') strings.push(x)
    if (strings.length === 2) break
  }
  if (strings.length < 2) return null
  return { a: strings[0], b: strings[1] }
}

/** Coin-change inputs: the first numeric array is the coins, the first scalar the amount. */
function extractCoinChangeInput(tc: VisibleTestCase): { coins: number[]; amount: number } | null {
  const args = readArgs(tc)
  if (!args) return null
  const coins = args.find((a) => Array.isArray(a) && (a as unknown[]).every((v) => typeof v === 'number')) as number[] | undefined
  const amount = args.find((a) => typeof a === 'number') as number | undefined
  if (!coins || typeof amount !== 'number') return null
  return { coins, amount }
}

/**
 * Knapsack inputs: two numeric arrays (weights then values, in argument order) and
 * a scalar capacity. A subset-sum-style call (one array + a target, no second array)
 * is NOT a knapsack call here and yields null, so it never runs the knapsack tracer.
 */
function extractKnapsackInput(tc: VisibleTestCase): KnapsackInput | null {
  const args = readArgs(tc)
  if (!args) return null
  const arrays = args.filter((a) => Array.isArray(a) && (a as unknown[]).every((v) => typeof v === 'number')) as number[][]
  const capacity = args.find((a) => typeof a === 'number') as number | undefined
  if (arrays.length < 2 || typeof capacity !== 'number') return null
  return { weights: arrays[0], values: arrays[1], capacity }
}

/**
 * Unique-paths inputs: either two integer dimensions (m, n) -> an all-open grid, or
 * a single 0/1 obstacle grid -> the blocked-cell map. Returns the blocked-cell grid
 * either way so the tracer has one shape to fill.
 */
function extractUniquePathsInput(tc: VisibleTestCase): boolean[][] | null {
  const args = readArgs(tc)
  if (!args) return null
  // Obstacle-grid form: a single 2-D 0/1 matrix argument.
  const gridArg = args.find((a) => Array.isArray(a) && Array.isArray((a as unknown[])[0]))
  if (gridArg) return asObstacleGrid(gridArg)
  // Dimension form: two positive integers (m rows, n cols), all cells open.
  const ints = args.filter((a) => typeof a === 'number' && Number.isInteger(a) && (a as number) >= 1) as number[]
  if (ints.length >= 2) {
    const [m, n] = ints
    if (m > MAX_ROWS || n > MAX_COLS) return Array.from({ length: m }, () => new Array<boolean>(n).fill(false)) // overflow handled by the tracer
    return Array.from({ length: m }, () => new Array<boolean>(n).fill(false))
  }
  return null
}

/** Minimum-path-sum input: a single 2-D numeric weight grid argument. */
function extractMinPathSumInput(tc: VisibleTestCase): number[][] | null {
  const args = readArgs(tc)
  if (!args) return null
  const gridArg = args.find((a) => Array.isArray(a) && Array.isArray((a as unknown[])[0]))
  if (!gridArg) return null
  return asNumberGrid(gridArg)
}

function numbersAgree(canonical: number | null, expected: unknown): boolean {
  if (canonical === null) return false
  return Number(canonical) === Number(expected)
}

export interface SteppedGridCandidate {
  diagram: InteractiveStepDiagram
  pattern: GridPattern
}

/**
 * A family's certify-and-build contract: pull this family's input from a test case,
 * compute its TRUE answer (uncapped oracle) for the cross-check, and build a display
 * trace. One generic loop below drives every family through this seam so the cross-
 * check rule is identical: every extractable visible case must carry `expected` and
 * its oracle answer must agree, and the first case that yields a clean trace supplies
 * the diagram.
 */
interface GridFamilyRunner<I> {
  extract: (tc: VisibleTestCase) => I | null
  oracle: (input: I) => number | null
  trace: (input: I) => GridTraceResult | null
  agree: (canonical: number | null, expected: unknown) => boolean
}

const FAMILY_RUNNERS: { [K in GridPattern]: GridFamilyRunner<unknown> } = {
  lcs: {
    extract: (tc) => extractStringInputs(tc),
    oracle: (i) => computeGridAnswer('lcs', (i as { a: string; b: string }).a, (i as { a: string; b: string }).b),
    trace: (i) => runGridTrace('lcs', (i as { a: string; b: string }).a, (i as { a: string; b: string }).b),
    agree: numbersAgree,
  },
  edit_distance: {
    extract: (tc) => extractStringInputs(tc),
    oracle: (i) => computeGridAnswer('edit_distance', (i as { a: string; b: string }).a, (i as { a: string; b: string }).b),
    trace: (i) => runGridTrace('edit_distance', (i as { a: string; b: string }).a, (i as { a: string; b: string }).b),
    agree: numbersAgree,
  },
  knapsack: {
    extract: (tc) => extractKnapsackInput(tc),
    oracle: (i) => computeKnapsackAnswer(i as KnapsackInput),
    trace: (i) => runKnapsackTrace(i as KnapsackInput),
    agree: numbersAgree,
  },
  coin_change_min: {
    extract: (tc) => extractCoinChangeInput(tc),
    oracle: (i) => computeCoinChangeMinAnswer((i as { coins: number[]; amount: number }).coins, (i as { coins: number[]; amount: number }).amount),
    trace: (i) => runCoinChangeMinTrace((i as { coins: number[]; amount: number }).coins, (i as { coins: number[]; amount: number }).amount),
    agree: numbersAgree,
  },
  unique_paths: {
    extract: (tc) => extractUniquePathsInput(tc),
    oracle: (i) => computeUniquePathsAnswer(i as boolean[][]),
    trace: (i) => runUniquePathsTrace(i as boolean[][]),
    agree: numbersAgree,
  },
  min_path_sum: {
    extract: (tc) => extractMinPathSumInput(tc),
    oracle: (i) => computeMinPathSumAnswer(i as number[][]),
    trace: (i) => runMinPathSumTrace(i as number[][]),
    agree: numbersAgree,
  },
}

/**
 * Build a verified stepped-grid diagram for a DP algorithm challenge, or null if
 * it is not eligible. Pure (no DB): callers pass the metadata + tags they have.
 *
 * Eligibility mirrors the array harness: recognize a supported DP family (tag or
 * reference-code fallback), run its canonical tabulation on a real visible test
 * case, and cross-check the table's answer against EVERY extractable case's
 * `expected`. Any disagreement, missing oracle, or unusable input means no stepped
 * diagram. The displayed trace is capped to the table extent; an input that would
 * overflow yields no trace (never a truncated, wrong one), but the uncapped oracle
 * still cross-checks the true answer.
 */
export function buildSteppedGridFromMetadata(
  metadata: Record<string, unknown>,
  tags: string[],
): SteppedGridCandidate | null {
  const reference = extractRef(metadata.reference_solution)
  const pattern = detectGridPattern(tags, reference)
  if (!pattern) return null

  const runner = FAMILY_RUNNERS[pattern]
  const testCases = Array.isArray(metadata.test_cases) ? (metadata.test_cases as VisibleTestCase[]) : []
  const visible = testCases.filter((tc) => !tc.hidden && !tc.is_hidden)

  let diagramTrace: GridTraceResult | null = null
  let certifiedCount = 0

  for (const tc of visible) {
    const input = runner.extract(tc)
    if (input === null) continue // case shape we cannot map to this family; ignore it
    if (tc.expected === undefined) return null // an extractable case with no oracle: cannot certify

    const answer = runner.oracle(input)
    if (!runner.agree(answer, tc.expected)) return null
    certifiedCount++

    if (!diagramTrace) {
      const trace = runner.trace(input)
      if (trace) diagramTrace = trace
    }
  }

  if (certifiedCount === 0 || !diagramTrace) return null
  return { diagram: buildSteppedGridDiagram(diagramTrace), pattern }
}
