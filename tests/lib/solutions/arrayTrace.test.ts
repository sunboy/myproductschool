import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runArrayTrace, buildSteppedArrayDiagram } from '../../../src/lib/solutions/trace/arrayTrace'
import { SolutionDiagramSchema } from '../../../src/lib/solutions/schema'

test('binary search trace matches the hand-computed lo/mid/hi sequence', () => {
  // The exact prototype input: find 21 in this sorted array.
  const values = [2, 4, 7, 9, 11, 13, 18, 21, 29]
  const trace = runArrayTrace('binary_search', values, 21)
  assert.ok(trace)
  assert.equal(trace!.answer, 7)
  // Step 1: lo0 mid4 hi8 (11 < 21 -> lo=5). Step 2: lo5 mid6 hi8 (18 < 21 -> lo=7).
  // Step 3: lo7 mid7 hi8 (21 == 21 -> found).
  assert.deepEqual(trace!.frames.map((f) => f.pointerAt), [
    { lo: 0, mid: 4, hi: 8 },
    { lo: 5, mid: 6, hi: 8 },
    { lo: 7, mid: 7, hi: 8 },
  ])
  assert.equal(trace!.frames[2].found, true)
  // discarded grows as the live range shrinks
  assert.deepEqual(trace!.frames[2].discarded, [0, 1, 2, 3, 4, 5, 6])
})

test('binary search returns -1 and the diagram is rejected when target is absent (too few frames or no find)', () => {
  // A miss still produces frames; the answer is -1. The point: answer reflects reality.
  const trace = runArrayTrace('binary_search', [1, 3, 5, 7, 9, 11, 13, 15], 8)
  assert.ok(trace)
  assert.equal(trace!.answer, -1)
})

test('two pointers trace converges on the target pair', () => {
  const values = [1, 3, 4, 6, 8, 11]
  const trace = runArrayTrace('two_pointers', values, 10)
  assert.ok(trace)
  // 1+11=12>10 -> hi--; 1+8=9<10 -> lo++; 3+8=11>10 -> hi--; 3+6=9<10 -> lo++; 4+6=10 found
  assert.deepEqual(trace!.answer, [2, 3])
  assert.equal(trace!.frames.at(-1)!.found, true)
})

test('a trace with fewer than 3 frames is rejected (schema floor)', () => {
  // Tiny array: binary search finds immediately or in 1-2 frames -> not enough for a walkthrough.
  const trace = runArrayTrace('binary_search', [5, 10], 10)
  assert.equal(trace, null)
})

test('an oversized array is rejected', () => {
  const big = Array.from({ length: 20 }, (_, i) => i * 2)
  const trace = runArrayTrace('binary_search', big, 8)
  assert.equal(trace, null)
})

test('built diagram from a verified trace passes the schema', () => {
  const trace = runArrayTrace('binary_search', [2, 4, 7, 9, 11, 13, 18, 21, 29], 21)
  const diagram = buildSteppedArrayDiagram(trace!, { title: 'Binary search' })
  const result = SolutionDiagramSchema.safeParse(diagram)
  assert.equal(result.success, true)
  // it carries the verified marker, so it survives the verified-base gate
  assert.equal(diagram.trace_verified, true)
})
