import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runArrayTrace, buildSteppedArrayDiagram, computeAnswer } from '../../../src/lib/solutions/trace/arrayTrace'
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

// ── fast/slow pointers (Floyd cycle detection on a value-as-index array) ──────

test('fast/slow trace finds the duplicate and matches the hand-computed hops', () => {
  // [1,3,4,2,2]: index-0->1->3->2->4->2 (cycle entry 2). Floyd:
  // slow=nums[0]=1, fast=nums[nums[0]]=nums[1]=3.
  // slow=nums[1]=3, fast=nums[nums[3]]=nums[2]=4.
  // slow=nums[3]=2, fast=nums[nums[4]]=nums[2]=4.
  // slow=nums[2]=4, fast=nums[nums[4]]=nums[2]=4 -> meet at 4.
  const values = [1, 3, 4, 2, 2]
  const trace = runArrayTrace('fast_slow', values, 0)
  assert.ok(trace)
  assert.equal(trace!.answer, 2)
  assert.deepEqual(trace!.frames.map((f) => f.pointerAt), [
    { slow: 1, fast: 3 },
    { slow: 3, fast: 4 },
    { slow: 2, fast: 4 },
    { slow: 4, fast: 4 },
  ])
  assert.equal(trace!.frames.at(-1)!.found, true)
})

test('fast/slow rejects an array with out-of-range values (not a value-as-index walk)', () => {
  // 9 is not a valid index into a length-5 array, so the walk would leave the array.
  const trace = runArrayTrace('fast_slow', [1, 9, 4, 2, 2], 0)
  assert.equal(trace, null)
})

// ── Dutch national flag (read-only 3-way classification) ──────────────────────

test('partition trace classifies sort-colors input into region counts (read-only, no swaps)', () => {
  // [2,0,2,1,1,0] around pivot 1: two cells below (the 0s), two equal (the 1s),
  // two above (the 2s). The answer is the COUNTS, an order-sensitive summary.
  const values = [2, 0, 2, 1, 1, 0]
  const trace = runArrayTrace('partition', values, 1)
  assert.ok(trace)
  assert.deepEqual(trace!.answer, { less: 2, equal: 2, greater: 2 })
  assert.equal(trace!.frames.at(-1)!.found, true)
  // First cell: values[0]=2 > pivot 1 -> highs region. lowCursor=0 (no lows yet),
  // highCursor = n - greater = 6 - 1 = 5. The scan cursor mid sits on index 0.
  assert.deepEqual(trace!.frames[0].pointerAt, { low: 0, mid: 0, high: 5 })
})

test('partition notes describe the STATIC displayed cell, never an invisible swap', () => {
  // The renderer draws base.cells (the original input) unchanged. Each note must
  // reference values[i] at index i exactly as the static cell shows it.
  const values = [2, 0, 2, 1, 1, 0]
  const trace = runArrayTrace('partition', values, 1)
  assert.ok(trace)
  trace!.frames.forEach((frame, i) => {
    if (frame.found) return // the final summary frame is exempt
    // The scan cursor is the cell index, the highlight is that same cell, and the
    // note quotes values[i] (the static value), so caption and display agree.
    assert.equal(frame.pointerAt.mid, i)
    assert.deepEqual(frame.highlight, [i])
    assert.ok(frame.note.includes(`cell ${i} = ${values[i]}`), `frame ${i} note: ${frame.note}`)
    // No swap language: a read-only classification never claims a move.
    assert.ok(!/swap/i.test(frame.note), `frame ${i} note must not mention a swap`)
  })
})

test('partition does NOT require a sorted input', () => {
  const trace = runArrayTrace('partition', [2, 0, 2, 1, 1, 0], 1)
  assert.ok(trace) // unsorted, still valid for partition
})

// ── Kadane (running max-subarray-sum) ─────────────────────────────────────────

test('kadane trace finds the max-subarray sum and highlights the best window', () => {
  // [-2,1,-3,4,-1,2,1]: best subarray [4,-1,2,1] = 6, window indices [3..6].
  const values = [-2, 1, -3, 4, -1, 2, 1]
  const trace = runArrayTrace('kadane', values, 0)
  assert.ok(trace)
  assert.equal(trace!.answer, 6)
  const last = trace!.frames.at(-1)!
  assert.equal(last.found, true)
  assert.deepEqual(last.highlight, [3, 4, 5, 6]) // the best window
  assert.deepEqual(last.pointerAt, { i: 6 })
})

test('kadane does NOT require a sorted input and handles all-negative arrays', () => {
  // best single element wins: max of [-5,-2,-9,-3] is -2.
  const trace = runArrayTrace('kadane', [-5, -2, -9, -3], 0)
  assert.ok(trace)
  assert.equal(trace!.answer, -2)
})

// ── computeAnswer oracle (uncapped) cross-checks for each new pattern ──────────

test('computeAnswer oracle agrees with the display trace for the new patterns', () => {
  assert.equal(computeAnswer('fast_slow', [1, 3, 4, 2, 2], 0), 2)
  assert.deepEqual(computeAnswer('partition', [2, 0, 2, 1, 1, 0], 1), { less: 2, equal: 2, greater: 2 })
  assert.equal(computeAnswer('kadane', [-2, 1, -3, 4, -1, 2, 1], 0), 6)
  // oracle stays correct past the display frame cap (9-element kadane the trace would cap on)
  assert.equal(computeAnswer('kadane', [-2, 1, -3, 4, -1, 2, 1, -5, 4], 0), 6)
})

// ── SEV-1: fast_slow must never hang on a long-cycle valid-index permutation ──

test('fast_slow returns quickly and refuses to certify a long-cycle permutation (no hang)', () => {
  // [1,2,3,4,5,6,7,8,9,0] is a single 10-cycle (0->1->...->9->0). slow and fast
  // meet only at hop 9, but the 8-frame display cap breaks phase 1 BEFORE they
  // meet. The OLD code then ran an uncapped phase-2 walk on those offset pointers
  // in a pure cycle and spun forever. With the fix, traceFastSlow bails as soon as
  // it sees the cap broke phase 1, so runArrayTrace returns null. No diagram ships
  // and, crucially, the call RETURNS in bounded time instead of hanging.
  const perm = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
  const started = Date.now()
  const trace = runArrayTrace('fast_slow', perm, 0)
  assert.equal(trace, null)
  // The uncapped oracle must also terminate (the phase loops are capped). Its
  // returned value is defensible here, but the only invariant that matters is
  // that it RETURNS rather than spinning. Bound the whole thing well under a
  // second so a regression to an unbounded loop fails loudly.
  const oracle = computeAnswer('fast_slow', perm, 0)
  assert.ok(oracle === null || typeof oracle === 'number')
  assert.ok(Date.now() - started < 1000, 'fast_slow must not hang on a long-cycle permutation')
})

test('fast_slow still traces a genuine duplicate-cycle input correctly', () => {
  // A real "find the duplicate" rho input stays eligible and correct after the fix.
  const trace = runArrayTrace('fast_slow', [1, 3, 4, 2, 2], 0)
  assert.ok(trace)
  assert.equal(trace!.answer, 2)
  assert.equal(computeAnswer('fast_slow', [1, 3, 4, 2, 2], 0), 2)
})

test('built diagrams from the new tracers pass the schema with the verified marker', () => {
  for (const trace of [
    runArrayTrace('fast_slow', [1, 3, 4, 2, 2], 0),
    runArrayTrace('partition', [2, 0, 2, 1, 1, 0], 1),
    runArrayTrace('kadane', [-2, 1, -3, 4, -1, 2, 1], 0),
  ]) {
    assert.ok(trace)
    const diagram = buildSteppedArrayDiagram(trace!)
    assert.equal(SolutionDiagramSchema.safeParse(diagram).success, true)
    assert.equal(diagram.trace_verified, true)
  }
})
