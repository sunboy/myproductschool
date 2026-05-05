/**
 * Unit tests for src/lib/coding/compare.ts
 *
 * Run with:
 *   npx tsx --test tests/unit/coding-compare.test.ts
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareOutputs } from '../../src/lib/coding/compare'

// ---------------------------------------------------------------------------
// exact (default)
// ---------------------------------------------------------------------------

test('exact: identical arrays → true', () => {
  assert.equal(compareOutputs([1, 2, 3], [1, 2, 3], 'exact'), true)
})

test('exact: same → true', () => {
  assert.equal(compareOutputs([0, 1], [0, 1], 'exact'), true)
})

test('exact: different → false', () => {
  assert.equal(compareOutputs([0, 1], [1, 0], 'exact'), false)
})

test('exact: different values → false', () => {
  assert.equal(compareOutputs(42, 43, 'exact'), false)
})

test('exact: default mode behaves as exact', () => {
  assert.equal(compareOutputs([1, 2], [2, 1]), false)
})

// ---------------------------------------------------------------------------
// set
// ---------------------------------------------------------------------------

test('set: [1,2,3] vs [3,1,2] → true', () => {
  assert.equal(compareOutputs([1, 2, 3], [3, 1, 2], 'set'), true)
})

test('set: [1,2] vs [1,2,3] → false (different lengths)', () => {
  assert.equal(compareOutputs([1, 2], [1, 2, 3], 'set'), false)
})

test('set: same elements in different order → true', () => {
  assert.equal(compareOutputs(['b', 'a', 'c'], ['a', 'b', 'c'], 'set'), true)
})

test('set: different elements → false', () => {
  assert.equal(compareOutputs([1, 2, 4], [1, 2, 3], 'set'), false)
})

test('set: non-array actual falls back to exact → false if different', () => {
  // actual is not an array — defensive fallback to exact
  assert.equal(compareOutputs('foo', [1, 2, 3], 'set'), false)
})

test('set: non-array actual that equals expected exactly → true', () => {
  assert.equal(compareOutputs('foo', 'foo', 'set'), true)
})

// ---------------------------------------------------------------------------
// sorted
// ---------------------------------------------------------------------------

test('sorted: [3,1,2] vs [1,2,3] → true', () => {
  assert.equal(compareOutputs([3, 1, 2], [1, 2, 3], 'sorted'), true)
})

test('sorted: already sorted → true', () => {
  assert.equal(compareOutputs([1, 2, 3], [1, 2, 3], 'sorted'), true)
})

test('sorted: different values → false', () => {
  assert.equal(compareOutputs([3, 1, 4], [1, 2, 3], 'sorted'), false)
})

test('sorted: different lengths → false', () => {
  assert.equal(compareOutputs([1, 2], [1, 2, 3], 'sorted'), false)
})

// ---------------------------------------------------------------------------
// sorted_each
// ---------------------------------------------------------------------------

test('sorted_each: [[1,2,3],[4,5,6]] vs [[3,1,2],[6,4,5]] → true', () => {
  assert.equal(
    compareOutputs([[1, 2, 3], [4, 5, 6]], [[3, 1, 2], [6, 4, 5]], 'sorted_each'),
    true
  )
})

test('sorted_each: outer order does not matter → true', () => {
  // 3Sum style: [[1,2,3],[-1,0,1]] vs [[-1,0,1],[1,2,3]]
  assert.equal(
    compareOutputs([[1, 2, 3], [-1, 0, 1]], [[-1, 0, 1], [1, 2, 3]], 'sorted_each'),
    true
  )
})

test('sorted_each: different elements → false', () => {
  assert.equal(
    compareOutputs([[1, 2, 3], [4, 5, 6]], [[1, 2, 3], [4, 5, 7]], 'sorted_each'),
    false
  )
})

test('sorted_each: different lengths outer → false', () => {
  assert.equal(
    compareOutputs([[1, 2]], [[1, 2], [3, 4]], 'sorted_each'),
    false
  )
})

test('sorted_each: Group Anagrams style — any group order, any inner order → true', () => {
  // ["eat","tea","ate"] and ["bat"] and ["tan","nat"]
  // actual groups in different order + inner items shuffled
  const actual = [['ate', 'eat', 'tea'], ['nat', 'tan'], ['bat']]
  const expected = [['bat'], ['nat', 'tan'], ['eat', 'tea', 'ate']]
  assert.equal(compareOutputs(actual, expected, 'sorted_each'), true)
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test('edge: actual is null, expected is null → true', () => {
  assert.equal(compareOutputs(null, null, 'exact'), true)
})

test('edge: actual is null, expected is not null → false', () => {
  assert.equal(compareOutputs(null, [1, 2, 3], 'exact'), false)
})

test('edge: actual is null with set mode → false (not both null)', () => {
  assert.equal(compareOutputs(null, [1, 2, 3], 'set'), false)
})

test('edge: actual is null, expected is null, set mode → true', () => {
  assert.equal(compareOutputs(null, null, 'set'), true)
})

test('edge: actual is undefined, expected is undefined → true', () => {
  assert.equal(compareOutputs(undefined, undefined, 'exact'), true)
})

test('edge: actual is undefined, expected is 0 → false', () => {
  assert.equal(compareOutputs(undefined, 0, 'exact'), false)
})

test('edge: empty arrays → true for all modes', () => {
  assert.equal(compareOutputs([], [], 'exact'), true)
  assert.equal(compareOutputs([], [], 'set'), true)
  assert.equal(compareOutputs([], [], 'sorted'), true)
  assert.equal(compareOutputs([], [], 'sorted_each'), true)
})
