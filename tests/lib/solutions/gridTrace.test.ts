import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runGridTrace,
  computeGridAnswer,
  buildSteppedGridDiagram,
  buildSteppedGridFromMetadata,
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

test('an unknown DP family tag yields no candidate', () => {
  const metadata = { test_cases: [{ args: ['AGCAT', 'GAC'], expected: 2 }] }
  // 'knapsack' / generic 'dynamic-programming' have no canonical tabulation here.
  assert.equal(buildSteppedGridFromMetadata(metadata, ['knapsack', 'dynamic-programming']), null)
})

test('a missing expected oracle on an extractable case disqualifies the trace', () => {
  const metadata = { test_cases: [{ args: ['AGCAT', 'GAC'] }] } // no expected
  assert.equal(buildSteppedGridFromMetadata(metadata, ['lcs']), null)
})
