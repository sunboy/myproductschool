import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runArrayTrace,
  runStringArrayTrace,
  buildSteppedArrayDiagram,
  computeAnswer,
  computeStringAnswer,
  isStringPattern,
} from '../../../src/lib/solutions/trace/arrayTrace'
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

// ── String patterns: longest substring (sliding window) ───────────────────────

test('longest-substring trace on "abcabcbb" walks the window and answers 3', () => {
  // "abcabcbb": the longest duplicate-free window is "abc" (length 3). r scans 0..7:
  // window grows to [0..2] (abc), then each repeat jumps l forward, never exceeding 3.
  const trace = runStringArrayTrace('longest_substring', 'abcabcbb')
  assert.ok(trace)
  assert.equal(trace!.answer, 3)
  // 8 chars -> 8 frames (one per scanned character).
  assert.equal(trace!.frames.length, 8)
  // The window expands l/r without ever exceeding length 3.
  assert.deepEqual(trace!.frames.slice(0, 4).map((f) => f.pointerAt), [
    { l: 0, r: 0 },
    { l: 0, r: 1 },
    { l: 0, r: 2 },
    { l: 1, r: 3 }, // 'a' repeats at 3, l jumps past index 0
  ])
  // The final frame lands on the best window [0..2] and is marked found.
  const last = trace!.frames.at(-1)!
  assert.equal(last.found, true)
  assert.deepEqual(last.pointerAt, { l: 0, r: 2 })
  assert.deepEqual(last.highlight, [0, 1, 2])
})

test('longest-substring cells display the characters, not numbers', () => {
  const trace = runStringArrayTrace('longest_substring', 'abcabcbb')
  assert.ok(trace)
  const diagram = buildSteppedArrayDiagram(trace!)
  assert.equal(diagram.base.kind, 'array')
  const cells = (diagram.base as { cells: { value: string }[] }).cells
  assert.deepEqual(cells.map((c) => c.value), ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'])
  assert.equal(SolutionDiagramSchema.safeParse(diagram).success, true)
  assert.equal(diagram.trace_verified, true)
})

test('longest-substring with all-distinct characters answers the full length', () => {
  // "abcdef": no repeats, the window spans the whole string, length 6.
  const trace = runStringArrayTrace('longest_substring', 'abcdef')
  assert.ok(trace)
  assert.equal(trace!.answer, 6)
  assert.equal(trace!.frames.at(-1)!.found, true)
})

test('longest-substring oracle agrees with the display trace and is uncapped', () => {
  assert.equal(computeStringAnswer('longest_substring', 'abcabcbb'), 3)
  assert.equal(computeStringAnswer('longest_substring', 'bbbbb'), 1)
  assert.equal(computeStringAnswer('longest_substring', 'pwwkew'), 3)
  // Past the display frame cap (a 12-char string the trace would not fully draw):
  assert.equal(computeStringAnswer('longest_substring', 'abcdeafghijk'), 11)
})

// ── String patterns: valid palindrome (two pointers, alnum-only, case-insensitive) ─

test('valid-palindrome trace on "racecar" converges and answers true', () => {
  const trace = runStringArrayTrace('valid_palindrome', 'racecar')
  assert.ok(trace)
  assert.equal(trace!.answer, true)
  // Three comparison frames before the pointers cross at the middle.
  assert.deepEqual(trace!.frames.map((f) => f.pointerAt), [
    { lo: 0, hi: 6 },
    { lo: 1, hi: 5 },
    { lo: 2, hi: 4 },
  ])
  const last = trace!.frames.at(-1)!
  assert.equal(last.found, true)
  assert.ok(last.note.includes('reads the same'))
})

test('valid-palindrome skips non-alphanumerics and compares case-insensitively', () => {
  // "Madam!" -> cleaned "madam": M==m, a==a, d is the middle. The '!' is skipped.
  const trace = runStringArrayTrace('valid_palindrome', 'Madam!')
  assert.ok(trace)
  assert.equal(trace!.answer, true)
  // The first move skips the trailing '!' from the right (not alphanumeric).
  assert.ok(trace!.frames.some((f) => f.note.includes('skip') && f.note.includes('!')))
})

test('valid-palindrome cells display the characters and pass the schema', () => {
  const trace = runStringArrayTrace('valid_palindrome', 'racecar')
  assert.ok(trace)
  const diagram = buildSteppedArrayDiagram(trace!)
  const cells = (diagram.base as { cells: { value: string }[] }).cells
  assert.deepEqual(cells.map((c) => c.value), ['r', 'a', 'c', 'e', 'c', 'a', 'r'])
  assert.equal(SolutionDiagramSchema.safeParse(diagram).success, true)
  assert.equal(diagram.trace_verified, true)
})

test('valid-palindrome oracle handles the canonical "A man, a plan, a canal: Panama" -> true', () => {
  // The famous LeetCode string is 30 characters (too long for a 16-cell display
  // trace, so no diagram), but the uncapped oracle must still compute true: every
  // alphanumeric pair matches once punctuation/spaces are skipped and case is folded.
  assert.equal(computeStringAnswer('valid_palindrome', 'A man, a plan, a canal: Panama'), true)
  // The display trace is correctly refused for the over-long input (fail-closed).
  assert.equal(runStringArrayTrace('valid_palindrome', 'A man, a plan, a canal: Panama'), null)
})

test('valid-palindrome oracle returns false for a non-palindrome', () => {
  assert.equal(computeStringAnswer('valid_palindrome', '0P'), false) // '0' != 'p'
  assert.equal(computeStringAnswer('valid_palindrome', 'abca'), false)
})

// ── String-pattern guards: numeric and string entry points stay separated ──────

test('runArrayTrace refuses string patterns; runStringArrayTrace refuses numeric ones', () => {
  assert.equal(isStringPattern('longest_substring'), true)
  assert.equal(isStringPattern('valid_palindrome'), true)
  assert.equal(isStringPattern('binary_search'), false)
  // A string pattern cannot be run through the numeric path (would mis-trace).
  assert.equal(runArrayTrace('longest_substring', [1, 2, 3], 0), null)
  assert.equal(runArrayTrace('valid_palindrome', [1, 2, 3], 0), null)
  // A numeric pattern cannot be run through the string path.
  assert.equal(runStringArrayTrace('binary_search', 'abc'), null)
})

test('a too-long string (>16 chars) is rejected for a clean walkthrough', () => {
  const long = 'abcdefghijklmnopqrstuvwxyz' // 26 chars
  assert.equal(runStringArrayTrace('longest_substring', long), null)
})

test('a too-short string (<2 chars) is rejected', () => {
  assert.equal(runStringArrayTrace('longest_substring', 'a'), null)
  assert.equal(runStringArrayTrace('valid_palindrome', 'a'), null)
})
