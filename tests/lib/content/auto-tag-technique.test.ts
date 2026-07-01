import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectTechniqueTags } from '../../../src/lib/content/auto-tag-technique'
import { buildSteppedTraceFromMetadata } from '../../../src/lib/solutions/trace'
import { buildSteppedGridFromMetadata } from '../../../src/lib/solutions/trace/gridTrace'
import { buildSteppedSequenceFromMetadata } from '../../../src/lib/solutions/trace/sequenceTrace'

// A real binary-search reference + a certifying visible test case (the canonical run
// returns index 7 on this input, which matches `expected`).
const BINARY_SEARCH_META = {
  reference_solution:
    'def solution(nums, target):\n    lo, hi = 0, len(nums)-1\n    while lo <= hi:\n        mid = lo + (hi-lo)//2\n        if nums[mid] == target: return mid\n        if nums[mid] < target: lo = mid+1\n        else: hi = mid-1\n    return -1',
  test_cases: [{ id: 't1', args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 7 }],
}

// A real LCS reference over two strings; the canonical tabulation of "abcde"/"ace"
// yields 3, matching `expected`.
const LCS_META = {
  reference_solution:
    'def solution(a, b):\n    m, n = len(a), len(b)\n    dp = [[0]*(n+1) for _ in range(m+1)]\n    for i in range(1, m+1):\n        for j in range(1, n+1):\n            if a[i-1] == b[j-1]:\n                dp[i][j] = dp[i-1][j-1] + 1\n            else:\n                dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n    return dp[m][n]',
  test_cases: [{ id: 't1', args: ['abcde', 'ace'], expected: 3 }],
}

// A real edit-distance reference; Levenshtein("horse","ros") = 3, matching `expected`.
const EDIT_DISTANCE_META = {
  reference_solution:
    'def solution(a, b):\n    m, n = len(a), len(b)\n    dp = [[0]*(n+1) for _ in range(m+1)]\n    for i in range(m+1): dp[i][0] = i\n    for j in range(n+1): dp[0][j] = j\n    for i in range(1, m+1):\n        for j in range(1, n+1):\n            if a[i-1] == b[j-1]:\n                dp[i][j] = dp[i-1][j-1]\n            else:\n                dp[i][j] = 1 + min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])\n    return dp[m][n]',
  test_cases: [{ id: 't1', args: ['horse', 'ros'], expected: 3 }],
}

// A real coin-change (minimum coins) reference: an infinity-seeded dp with a +1 min
// recurrence over coins. This IS reference-detectable, so it exercises the untagged
// DP-family path (unlike LCS/edit-distance, which the verified detector recognizes
// only via an explicit family tag). fewest coins for amount 11 from {1,2,5} is 3.
const COIN_CHANGE_META = {
  reference_solution:
    'def solution(coins, amount):\n    dp = [float("inf")] * (amount + 1)\n    dp[0] = 0\n    for coin in coins:\n        for a in range(coin, amount + 1):\n            dp[a] = min(dp[a], dp[a - coin] + 1)\n    return dp[amount] if dp[amount] != float("inf") else -1',
  test_cases: [{ id: 't1', args: [[1, 2, 5], 11], expected: 3 }],
}

// A plain string reverse: no pattern any tracer recognizes.
const STRING_REVERSE_META = {
  reference_solution: 'def solution(s):\n    return s[::-1]',
  test_cases: [{ id: 't1', args: ['abc'], expected: 'cba' }],
}

test('binary-search reference with NO tags -> emits binary-search and the tag routes to a verified trace', () => {
  const added = detectTechniqueTags('algorithm', BINARY_SEARCH_META, [])
  assert.deepEqual(added, ['binary-search'])
  // The added tag genuinely makes the walkthrough eligible.
  const candidate = buildSteppedTraceFromMetadata(BINARY_SEARCH_META, added)
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'binary_search')
  assert.equal(candidate!.diagram.trace_verified, true)
})

test('a reference-detectable DP family (coin-change) with NO tags -> emits the family tag plus the dynamic-programming umbrella', () => {
  const added = detectTechniqueTags('algorithm', COIN_CHANGE_META, [])
  assert.ok(added.includes('coin-change'))
  assert.ok(added.includes('dynamic-programming'))
  // Merging the additions certifies a verified grid walkthrough.
  const candidate = buildSteppedGridFromMetadata(COIN_CHANGE_META, added)
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'coin_change_min')
})

test('an LCS challenge already tagged with its family -> emits only the umbrella (family already present)', () => {
  // LCS / edit-distance are recognized by the verified detector ONLY via an explicit
  // family tag (they have no reference-code signature), so a family tag must be present
  // for detection. The tagger then adds the umbrella 'dynamic-programming' topic.
  const added = detectTechniqueTags('algorithm', LCS_META, ['longest-common-subsequence'])
  assert.deepEqual(added, ['dynamic-programming'])
  const candidate = buildSteppedGridFromMetadata(LCS_META, ['longest-common-subsequence', ...added])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'lcs')
})

test('CONSERVATIVE: untagged LCS/edit-distance emit nothing (the verified detector cannot recognize them without a tag)', () => {
  // Never guess. LCS and edit-distance carry no reference-code signature, so an untagged
  // challenge is not eligible and no tag is emitted (adding one would not make a
  // walkthrough build).
  assert.deepEqual(detectTechniqueTags('algorithm', LCS_META, []), [])
  assert.deepEqual(detectTechniqueTags('algorithm', EDIT_DISTANCE_META, []), [])
})

test('a non-pattern (string reverse) emits nothing', () => {
  const added = detectTechniqueTags('algorithm', STRING_REVERSE_META, [])
  assert.deepEqual(added, [])
})

test('already-tagged binary-search -> no duplicate tag added', () => {
  const added = detectTechniqueTags('algorithm', BINARY_SEARCH_META, ['binary-search'])
  assert.deepEqual(added, [])
})

test('already-tagged LCS -> no duplicate family or umbrella (umbrella already present)', () => {
  const added = detectTechniqueTags('algorithm', LCS_META, [
    'longest-common-subsequence',
    'dynamic-programming',
  ])
  assert.deepEqual(added, [])
})

test('case-insensitive dedup: an upper/mixed-case existing tag blocks the duplicate', () => {
  const added = detectTechniqueTags('algorithm', BINARY_SEARCH_META, ['Binary-Search'])
  assert.deepEqual(added, [])
})

test('SQL challenges tag nothing (pipeline eligibility is structural)', () => {
  const added = detectTechniqueTags('sql', BINARY_SEARCH_META, [])
  assert.deepEqual(added, [])
})

test('unknown challenge types tag nothing', () => {
  const added = detectTechniqueTags('flow', BINARY_SEARCH_META, [])
  assert.deepEqual(added, [])
})

test('a tagged but cross-check-FAILING challenge emits nothing (never a wrong walkthrough)', () => {
  // Reference is binary search, but the expected output is a wrong index (3 instead of 7).
  // detectPattern still recognizes the shape, but the builder's cross-check rejects it,
  // so no tag is emitted.
  const failing = {
    reference_solution: BINARY_SEARCH_META.reference_solution,
    test_cases: [{ id: 't1', args: [[2, 4, 7, 9, 11, 13, 18, 21, 29], 21], expected: 3 }],
  }
  const added = detectTechniqueTags('algorithm', failing, [])
  assert.deepEqual(added, [])
})

test('reference given as {python} object is read for the fallback', () => {
  const objRef = {
    reference_solution: { python: BINARY_SEARCH_META.reference_solution },
    test_cases: BINARY_SEARCH_META.test_cases,
  }
  const added = detectTechniqueTags('algorithm', objRef, [])
  assert.deepEqual(added, ['binary-search'])
})

test('coding type is treated like algorithm', () => {
  const added = detectTechniqueTags('coding', BINARY_SEARCH_META, [])
  assert.deepEqual(added, ['binary-search'])
})

test('a linked-list reversal tagged with linked-list -> emits the canonical reverse-linked-list tag', () => {
  // Sequence detection is tag-based (no reference fallback), so seed a family tag.
  const LINKED_LIST_META = {
    reference_solution:
      'def solution(head):\n    prev = None\n    while head:\n        nxt = head.next\n        head.next = prev\n        prev = head\n        head = nxt\n    return prev',
    test_cases: [{ id: 't1', args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] }],
  }
  const added = detectTechniqueTags('algorithm', LINKED_LIST_META, ['linked-list'])
  assert.deepEqual(added, ['reverse-linked-list'])
  const candidate = buildSteppedSequenceFromMetadata(LINKED_LIST_META, [...['linked-list'], ...added])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'reverse_linked_list')
})
