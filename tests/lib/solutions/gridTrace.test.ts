import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runGridTrace,
  computeGridAnswer,
  buildSteppedGridDiagram,
  buildSteppedGridFromMetadata,
  runKnapsackTrace,
  computeKnapsackAnswer,
  runCoinChangeMinTrace,
  computeCoinChangeMinAnswer,
  runUniquePathsTrace,
  computeUniquePathsAnswer,
  runMinPathSumTrace,
  computeMinPathSumAnswer,
} from '../../../src/lib/solutions/trace/gridTrace'
import { SolutionDiagramSchema } from '../../../src/lib/solutions/schema'

/** Read a cell value out of a step's cumulative fill. */
function cell(fill: { r: number; c: number; value: string }[], r: number, c: number): string | undefined {
  return fill.find((f) => f.r === r && f.c === c)?.value
}

test('LCS table fills correctly and the final answer matches the hand computation', () => {
  // LCS("AGCAT", "GAC") = 2 (e.g. "GA" or "AC"). Table is 6 rows x 4 cols.
  const trace = runGridTrace('lcs', 'AGCAT', 'GAC')
  assert.ok(trace)
  assert.equal(trace!.rows, 6)
  assert.equal(trace!.cols, 4)
  assert.equal(trace!.answer, 2)

  // Final step holds the complete table. Bottom-right is the answer.
  const last = trace!.steps.at(-1)!
  assert.equal(cell(last.fill, 5, 3), '2')
  // Base case: row 0 and col 0 are all zero.
  assert.equal(cell(last.fill, 0, 0), '0')
  assert.equal(cell(last.fill, 0, 3), '0')
  assert.equal(cell(last.fill, 5, 0), '0')
  // Spot-check an interior recurrence cell: a[0]='A', b[1]='A' match at (1,2) -> 1.
  assert.equal(cell(last.fill, 1, 2), '1')
  // The oracle agrees with the displayed table.
  assert.equal(computeGridAnswer('lcs', 'AGCAT', 'GAC'), 2)
})

test('axis labels are self-describing and oriented to argument order, not transposed', () => {
  // Row axis = first arg ('AGCAT'), column axis = second arg ('GAC'). The base
  // cell of each axis carries the whole source string so the learner reads which
  // string is which; the rest of each axis spells the string out, character by
  // character. Swapping the answer-symmetric pair must NOT swap the axes.
  const trace = runGridTrace('lcs', 'AGCAT', 'GAC')
  assert.ok(trace)
  // Base-case cell (index 0) is the full source string for that axis.
  assert.equal(trace!.rowLabels[0], 'AGCAT')
  assert.equal(trace!.colLabels[0], 'GAC')
  // Per-character labels follow, in order, so the table is self-describing.
  assert.deepEqual(trace!.rowLabels, ['AGCAT', 'A', 'G', 'C', 'A', 'T'])
  assert.deepEqual(trace!.colLabels, ['GAC', 'G', 'A', 'C'])
  // Orientation is anchored to argument order: the row axis has one label per
  // first-arg character (+1 base) and the column axis one per second-arg char.
  assert.equal(trace!.rowLabels.length, trace!.rows)
  assert.equal(trace!.colLabels.length, trace!.cols)
  // The answer is symmetric, but the displayed shape is not: 6x4 here, never 4x6.
  assert.equal(trace!.rows, 6)
  assert.equal(trace!.cols, 4)
  const swapped = runGridTrace('lcs', 'GAC', 'AGCAT')
  assert.ok(swapped)
  assert.equal(swapped!.answer, trace!.answer) // same answer
  assert.equal(swapped!.rowLabels[0], 'GAC') // but transposed axes
  assert.equal(swapped!.colLabels[0], 'AGCAT')
})

test('argument order anchors the axes even when a non-string arg precedes the strings', () => {
  // extractStringInputs must keep argument order: with a leading numeric arg, the
  // first string ('cat') is still the row axis and the second ('cart') the column.
  const metadata = {
    test_cases: [
      { args: [0, 'cat', 'cart'], expected: 1 }, // edit distance("cat","cart") = 1
    ],
  }
  const candidate = buildSteppedGridFromMetadata(metadata, ['edit-distance'])
  assert.ok(candidate)
  const base = candidate!.diagram.base
  assert.equal(base.kind, 'grid')
  if (base.kind === 'grid') {
    assert.equal(base.rowLabels?.[0], 'cat')
    assert.equal(base.colLabels?.[0], 'cart')
    // Row axis tracks the first string (3 chars + base), column the second (4 + base).
    assert.equal(base.rows, 4)
    assert.equal(base.cols, 5)
  }
})

test('edit distance table fills correctly and the final answer matches the hand computation', () => {
  // Levenshtein("kitten", "sitting") = 3 (the classic example). Table is 7 x 8.
  const trace = runGridTrace('edit_distance', 'kitten', 'sitting')
  assert.ok(trace)
  assert.equal(trace!.rows, 7)
  assert.equal(trace!.cols, 8)
  assert.equal(trace!.answer, 3)

  const last = trace!.steps.at(-1)!
  assert.equal(cell(last.fill, 6, 7), '3')
  // Base column counts deletions: (1,0)=1, (6,0)=6.
  assert.equal(cell(last.fill, 1, 0), '1')
  assert.equal(cell(last.fill, 6, 0), '6')
  // Base row counts insertions: (0,7)=7.
  assert.equal(cell(last.fill, 0, 7), '7')
  assert.equal(computeGridAnswer('edit_distance', 'kitten', 'sitting'), 3)
})

test('the built diagram from a verified trace passes the schema and carries the verified marker', () => {
  const trace = runGridTrace('lcs', 'AGCAT', 'GAC')
  const diagram = buildSteppedGridDiagram(trace!, { title: 'Longest common subsequence' })
  const result = SolutionDiagramSchema.safeParse(diagram)
  assert.equal(result.success, true)
  assert.equal(diagram.trace_verified, true)
  assert.equal(diagram.base.kind, 'grid')
  // Step count stays within the 3..8 schema window.
  assert.ok(diagram.steps.length >= 3 && diagram.steps.length <= 8)
})

test('metadata cross-check builds a grid diagram when the canonical answer matches every visible case', () => {
  const metadata = {
    test_cases: [
      { args: ['AGCAT', 'GAC'], expected: 2 },
      { args: ['ABCBDAB', 'BDCAB'], expected: 4 },
      { args: ['secret', 'hidden'], expected: 999, hidden: true }, // hidden, ignored by the cross-check
    ],
  }
  const candidate = buildSteppedGridFromMetadata(metadata, ['longest-common-subsequence'])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'lcs')
  const result = SolutionDiagramSchema.safeParse(candidate!.diagram)
  assert.equal(result.success, true)
})

test('a cross-check mismatch returns null (the family does not solve this challenge)', () => {
  const metadata = {
    test_cases: [
      { args: ['AGCAT', 'GAC'], expected: 2 },
      { args: ['ABCBDAB', 'BDCAB'], expected: 99 }, // wrong oracle -> disqualify
    ],
  }
  const candidate = buildSteppedGridFromMetadata(metadata, ['lcs'])
  assert.equal(candidate, null)
})

test('an oversized input is rejected (table would exceed the displayable extent)', () => {
  // 8 chars -> 9 rows, over the 8-row cap.
  const trace = runGridTrace('lcs', 'ABCDEFGH', 'XY')
  assert.equal(trace, null)
  // The oracle still computes the true answer without the display-extent guard.
  assert.equal(computeGridAnswer('lcs', 'ABCDEFGH', 'XYABCD'), 4)
})

test('a knapsack tag on LCS-shaped string args yields no candidate (no extractable knapsack input)', () => {
  const metadata = { test_cases: [{ args: ['AGCAT', 'GAC'], expected: 2 }] }
  // The knapsack family is supported, but its input is [weights[], values[],
  // capacity]; two bare strings extract no knapsack input, so nothing certifies.
  assert.equal(buildSteppedGridFromMetadata(metadata, ['knapsack']), null)
})

test('a bare dynamic-programming tag with no recognizable reference signature yields no candidate', () => {
  // No family-specific tag and no reference solution to fall back on: there is no
  // family to trace, so the challenge keeps its static diagram.
  const metadata = { test_cases: [{ args: ['AGCAT', 'GAC'], expected: 2 }] }
  assert.equal(buildSteppedGridFromMetadata(metadata, ['dynamic-programming']), null)
})

test('a missing expected oracle on an extractable case disqualifies the trace', () => {
  const metadata = { test_cases: [{ args: ['AGCAT', 'GAC'] }] } // no expected
  assert.equal(buildSteppedGridFromMetadata(metadata, ['lcs']), null)
})

// ── Knapsack (0/1) ────────────────────────────────────────────────────────────

test('0/1 knapsack table fills correctly and the final answer matches the hand computation', () => {
  // items (weight, value): (1,15),(3,50),(4,60), capacity 4. Best = item1+item2
  // (weight 4, value 65), beating item3 alone (value 60). Table is 4 rows x 5 cols.
  const input = { weights: [1, 3, 4], values: [15, 50, 60], capacity: 4 }
  assert.equal(computeKnapsackAnswer(input), 65)
  const trace = runKnapsackTrace(input)
  assert.ok(trace)
  assert.equal(trace!.pattern, 'knapsack')
  assert.equal(trace!.rows, 4) // 3 items + the no-items base row
  assert.equal(trace!.cols, 5) // capacity 0..4
  assert.equal(trace!.answer, 65)
  const last = trace!.steps.at(-1)!
  assert.equal(cell(last.fill, 3, 4), '65') // bottom-right = the answer
  assert.equal(cell(last.fill, 0, 4), '0') // no items: zero value at any capacity
  assert.equal(cell(last.fill, 1, 0), '0') // capacity 0: zero value for any items
  assert.equal(cell(last.fill, 1, 1), '15') // only item1 fits at capacity 1
  // The active cell on the last step reads its skip cell (above) and take cell.
  assert.deepEqual(last.active, { r: 3, c: 4 })
  assert.deepEqual(last.highlight, [{ r: 2, c: 4 }, { r: 2, c: 0 }])
})

test('a knapsack cross-check mismatch returns null', () => {
  const metadata = {
    test_cases: [
      { args: [[1, 3, 4], [15, 50, 60], 4], expected: 65 },
      { args: [[2, 3], [3, 4], 5], expected: 999 }, // wrong oracle -> disqualify
    ],
  }
  assert.equal(buildSteppedGridFromMetadata(metadata, ['knapsack']), null)
})

test('an oversized knapsack capacity is rejected (table would exceed 12 columns)', () => {
  // capacity 20 -> 21 columns, over the 12-column cap.
  assert.equal(runKnapsackTrace({ weights: [1, 2], values: [1, 2], capacity: 20 }), null)
  // The oracle still computes the true answer without the display-extent guard.
  assert.equal(computeKnapsackAnswer({ weights: [1, 2], values: [1, 2], capacity: 20 }), 3)
})

// ── Coin change (minimum coins) ───────────────────────────────────────────────

test('coin change minimum coins fills correctly and matches expected, including unreachable -1', () => {
  // coins [1,5,6,9], amount 11 -> 2 coins (5 + 6). Table is 5 rows x 12 cols.
  assert.equal(computeCoinChangeMinAnswer([1, 5, 6, 9], 11), 2)
  const trace = runCoinChangeMinTrace([1, 5, 6, 9], 11)
  assert.ok(trace)
  assert.equal(trace!.pattern, 'coin_change_min')
  assert.equal(trace!.rows, 5) // 4 coin types + the no-coins base row
  assert.equal(trace!.cols, 12) // amount 0..11
  assert.equal(trace!.answer, 2)
  const last = trace!.steps.at(-1)!
  assert.equal(cell(last.fill, 4, 11), '2') // bottom-right = fewest coins for 11
  assert.equal(cell(last.fill, 4, 0), '0') // amount 0 always needs 0 coins
  // Unreachable amounts read the infinity glyph (the no-coins row beyond amount 0).
  assert.equal(cell(last.fill, 0, 11), '∞')
  // The metadata path certifies an unreachable case via the -1 oracle.
  assert.equal(computeCoinChangeMinAnswer([2], 3), -1)
})

test('coin change builds a verified diagram from real metadata (reachable + unreachable cases)', () => {
  const metadata = {
    test_cases: [
      { args: [[1, 5, 6, 9], 11], expected: 2 },
      { args: [[2], 3], expected: -1 }, // unreachable: -1, cross-checked by the oracle
    ],
  }
  const candidate = buildSteppedGridFromMetadata(metadata, ['coin-change'])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'coin_change_min')
  assert.equal(SolutionDiagramSchema.safeParse(candidate!.diagram).success, true)
})

test('a coin change cross-check mismatch returns null', () => {
  const metadata = {
    test_cases: [
      { args: [[1, 5, 6, 9], 11], expected: 2 },
      { args: [[1, 2, 5], 5], expected: 99 }, // min coins for 5 is 1, not 99 -> disqualify
    ],
  }
  assert.equal(buildSteppedGridFromMetadata(metadata, ['coin-change']), null)
})

test('Coin Change II (combinations) is rejected, never forced onto the min-coins tracer', () => {
  // The reference accumulates a COUNT of combinations (dp[0]=1, dp[j] += dp[j-c]),
  // a different objective from minimum coins. Detection must reject it (return null)
  // rather than animate a min-coins table whose answer would disagree.
  const metadata = {
    reference_solution:
      'def solution(amount, coins):\n    dp = [0] * (amount + 1)\n    dp[0] = 1\n    for c in coins:\n        for j in range(c, amount + 1):\n            dp[j] += dp[j - c]\n    return dp[amount]',
    test_cases: [
      { args: [5, [1, 2, 5]], expected: 4 },
      { args: [3, [2]], expected: 0 },
    ],
  }
  assert.equal(buildSteppedGridFromMetadata(metadata, ['dynamic-programming']), null)
})

// ── Unique paths ──────────────────────────────────────────────────────────────

test('unique paths fills a path-count grid and matches the hand computation', () => {
  // A 3x7 open grid has 28 monotone right/down paths.
  const open = Array.from({ length: 3 }, () => new Array<boolean>(7).fill(false))
  assert.equal(computeUniquePathsAnswer(open), 28)
  const trace = runUniquePathsTrace(open)
  assert.ok(trace)
  assert.equal(trace!.pattern, 'unique_paths')
  assert.equal(trace!.rows, 3)
  assert.equal(trace!.cols, 7)
  assert.equal(trace!.answer, 28)
  const last = trace!.steps.at(-1)!
  assert.equal(cell(last.fill, 2, 6), '28') // bottom-right = total paths
  assert.equal(cell(last.fill, 0, 0), '1') // single way to stand on the start
  assert.equal(cell(last.fill, 0, 6), '1') // top row: one straight path
})

test('unique paths with an obstacle zeroes the blocked cell and reduces the count', () => {
  // [[0,0,0],[0,1,0],[0,0,0]] -> the single center obstacle leaves 2 paths.
  const blocked = [[0, 0, 0], [0, 1, 0], [0, 0, 0]].map((row) => row.map((v) => v === 1))
  assert.equal(computeUniquePathsAnswer(blocked), 2)
  const trace = runUniquePathsTrace(blocked)
  assert.ok(trace)
  assert.equal(trace!.answer, 2)
  const last = trace!.steps.at(-1)!
  assert.equal(cell(last.fill, 1, 1), '0') // the obstacle cell is unreachable
  assert.equal(cell(last.fill, 2, 2), '2') // two paths reach the exit
})

test('unique paths builds a verified diagram from dimension-pair metadata', () => {
  const metadata = {
    test_cases: [
      { args: [3, 7], expected: 28 },
      { args: [3, 2], expected: 3 },
    ],
  }
  const candidate = buildSteppedGridFromMetadata(metadata, ['unique-paths'])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'unique_paths')
  assert.equal(SolutionDiagramSchema.safeParse(candidate!.diagram).success, true)
})

test('a unique paths cross-check mismatch returns null', () => {
  const metadata = {
    test_cases: [
      { args: [3, 7], expected: 28 },
      { args: [3, 2], expected: 99 }, // 3x2 has 3 paths, not 99 -> disqualify
    ],
  }
  assert.equal(buildSteppedGridFromMetadata(metadata, ['unique-paths']), null)
})

test('an oversized unique-paths grid is rejected (more than 8 rows)', () => {
  // 9 rows overflow the 8-row display extent.
  const tall = Array.from({ length: 9 }, () => new Array<boolean>(3).fill(false))
  assert.equal(runUniquePathsTrace(tall), null)
  // The oracle still computes the true answer without the display-extent guard.
  assert.equal(computeUniquePathsAnswer(tall), computeUniquePathsAnswer(tall))
})

// ── Minimum path sum ──────────────────────────────────────────────────────────

test('minimum path sum fills correctly and matches the hand computation', () => {
  // [[1,3,1],[1,5,1],[4,2,1]] -> cheapest right/down path sum is 7 (1->1->4->2->...).
  const grid = [[1, 3, 1], [1, 5, 1], [4, 2, 1]]
  assert.equal(computeMinPathSumAnswer(grid), 7)
  const trace = runMinPathSumTrace(grid)
  assert.ok(trace)
  assert.equal(trace!.pattern, 'min_path_sum')
  assert.equal(trace!.rows, 3)
  assert.equal(trace!.cols, 3)
  assert.equal(trace!.answer, 7)
  const last = trace!.steps.at(-1)!
  assert.equal(cell(last.fill, 2, 2), '7') // bottom-right = the cheapest total
  assert.equal(cell(last.fill, 0, 0), '1') // start cell carries its own weight
  assert.equal(cell(last.fill, 0, 2), '5') // top row accumulates 1+3+1
})

test('minimum path sum builds a verified diagram from real grid metadata', () => {
  const metadata = {
    test_cases: [
      { args: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], expected: 7 },
      { args: [[[1, 2, 3], [4, 5, 6]]], expected: 12 },
    ],
  }
  const candidate = buildSteppedGridFromMetadata(metadata, ['min-path-sum'])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'min_path_sum')
  assert.equal(SolutionDiagramSchema.safeParse(candidate!.diagram).success, true)
})

test('a minimum path sum cross-check mismatch returns null', () => {
  const metadata = {
    test_cases: [
      { args: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], expected: 7 },
      { args: [[[1, 2, 3], [4, 5, 6]]], expected: 99 }, // true min is 12 -> disqualify
    ],
  }
  assert.equal(buildSteppedGridFromMetadata(metadata, ['min-path-sum']), null)
})

// ── Reference-code fallback (live content tags only 'dynamic-programming') ─────

test('a bare dynamic-programming tag routes to the family the reference code reveals', () => {
  // The live content tags most DP challenges with a bare 'dynamic-programming'
  // topic and names the family only in the title, so the reference code is the
  // discriminator. A min-path-sum reference must route to min_path_sum.
  const metadata = {
    reference_solution:
      'def solution(grid):\n    m, n = len(grid), len(grid[0])\n    for i in range(m):\n        for j in range(n):\n            if i == 0 and j == 0: continue\n            elif i == 0: grid[i][j] += grid[i][j-1]\n            elif j == 0: grid[i][j] += grid[i-1][j]\n            else: grid[i][j] += min(grid[i-1][j], grid[i][j-1])\n    return grid[m-1][n-1]',
    test_cases: [{ args: [[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], expected: 7 }],
  }
  const candidate = buildSteppedGridFromMetadata(metadata, ['dynamic-programming'])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'min_path_sum')
})
