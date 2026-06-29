import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSteppedTraceFromMetadata } from '../../../src/lib/solutions/trace'
import { graftSteppedTrace } from '../../../src/lib/solutions/trace/graft'
import { SolutionDiagramSchema, type SolutionContentV1 } from '../../../src/lib/solutions/schema'

const BINARY_SEARCH_META = {
  reference_solution: 'def solution(nums, target):\n    lo, hi = 0, len(nums)-1\n    while lo <= hi:\n        mid = lo + (hi-lo)//2\n        if nums[mid] == target: return mid\n        if nums[mid] < target: lo = mid+1\n        else: hi = mid-1\n    return -1',
  test_cases: [
    { id: 't1', args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 7 },
  ],
}

test('binary-search challenge with a matching tag is stepped eligible', () => {
  const candidate = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, ['binary-search'])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'binary_search')
  assert.equal(candidate!.diagram.trace_verified, true)
  assert.equal(SolutionDiagramSchema.safeParse(candidate!.diagram).success, true)
})

test('pattern is inferred from reference code when tags are absent', () => {
  const candidate = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, [])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'binary_search')
})

test('no recognizable pattern -> not eligible', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: 'def solution(s):\n    return s[::-1]', test_cases: [{ args: ['abc'], expected: 'cba' }] },
    ['string-manipulation'],
  )
  assert.equal(candidate, null)
})

test('cross-check rejects a pattern whose answer disagrees with the expected output', () => {
  // Tagged binary-search, but the expected output is a wrong index. The canonical
  // run returns 7; expected says 3, so we must NOT ship a misleading walkthrough.
  const candidate = buildSteppedTraceFromMetadata(
    { ...BINARY_SEARCH_META, test_cases: [{ args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 3 }] },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

test('a too-small array yields no eligible trace', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: BINARY_SEARCH_META.reference_solution, test_cases: [{ args: [[5, 10], 10], expected: 1 }] },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

// ── Codex review hardening (cross-check + sortedness + completeness) ──────────

test('an extractable case missing `expected` disqualifies the pattern', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: BINARY_SEARCH_META.reference_solution, test_cases: [{ args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21] /* no expected */ }] },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

test('one agreeing case does not certify when another extractable case disagrees', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: BINARY_SEARCH_META.reference_solution,
      test_cases: [
        { args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 7 }, // agrees
        { args: [[1, 3, 5, 7, 9, 11, 13, 15], 9], expected: 99 },       // wrong oracle -> disqualify
      ],
    },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

test('an unsorted array is rejected for binary search', () => {
  const candidate = buildSteppedTraceFromMetadata(
    { reference_solution: BINARY_SEARCH_META.reference_solution, test_cases: [{ args: [[9, 2, 7, 4, 21, 13, 18, 11, 29], 21], expected: 4 }] },
    ['binary-search'],
  )
  assert.equal(candidate, null)
})

test('all-cases-agree certifies and produces a verified diagram', () => {
  const candidate = buildSteppedTraceFromMetadata(
    {
      reference_solution: BINARY_SEARCH_META.reference_solution,
      test_cases: [
        { args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 7 },
        { args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 2], expected: 0 },
      ],
    },
    ['binary-search'],
  )
  assert.ok(candidate)
  assert.equal(candidate!.diagram.trace_verified, true)
})

test('graft strips a model-authored stepped diagram even if it self-claims trace_verified', () => {
  // A malicious/hallucinated model diagram with a fake verified marker and WRONG deltas.
  const fakeStepped = {
    kind: 'stepped' as const,
    trace_verified: true,
    base: { kind: 'array' as const, cells: [{ value: '1' }, { value: '2' }, { value: '3' }], pointers: ['lo', 'mid', 'hi'] },
    steps: [
      { title: 'x', explanation: 'wrong', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 1, hi: 2 } } },
      { title: 'y', explanation: 'wrong', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 } } },
      { title: 'z', explanation: 'wrong', delta: { base: 'array' as const, pointerAt: { lo: 0, mid: 0, hi: 0 }, found: true } },
    ],
  }
  const content: SolutionContentV1 = {
    version: 1,
    challenge_type: 'algorithm',
    overview_md: 'tests the sorted-array invariant.',
    approaches: [
      { id: 'brute', title: 'Brute', tagline: 'scan', body_md: 'scan', code: { language: 'python', source: 'x=1' }, complexity: { time: 'O(n)', space: 'O(1)' } },
      { id: 'optimal', title: 'Binary search', tagline: 'halve', body_md: 'halve', code: { language: 'python', source: 'y=2' }, complexity: { time: 'O(log n)', space: 'O(1)' }, diagram: fakeStepped },
    ],
    ai_collaboration: { body_md: 'pair', prompts: [{ title: 't', prompt: 'p', why: 'w' }], pitfalls: ['x'] },
  }

  // No metadata -> not eligible to attach a real trace, but the model's stepped
  // diagram MUST still be stripped (it could be wrong and self-claims verified).
  const { content: out, grafted } = graftSteppedTrace(content, null, [])
  assert.equal(grafted, false)
  assert.equal(out.approaches.every((a) => a.diagram?.kind !== 'stepped'), true)

  // With real metadata, the model's stepped diagram is replaced by the verified one.
  const { content: out2, grafted: grafted2 } = graftSteppedTrace(content, BINARY_SEARCH_META, ['binary-search'])
  assert.equal(grafted2, true)
  const stepped = out2.approaches.filter((a) => a.diagram?.kind === 'stepped')
  assert.equal(stepped.length, 1)
  // the surviving stepped diagram is the harness one (9 cells from the real test case), not the fake 3-cell one
  const diagram = stepped[0].diagram as typeof fakeStepped
  assert.equal(diagram.base.cells.length, 9)
})
