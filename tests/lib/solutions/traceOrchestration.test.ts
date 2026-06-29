import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSteppedTraceFromMetadata } from '../../../src/lib/solutions/trace'
import { SolutionDiagramSchema } from '../../../src/lib/solutions/schema'

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
