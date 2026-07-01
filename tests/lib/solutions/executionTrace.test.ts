import { test } from 'node:test'
import assert from 'node:assert/strict'
import { answersAgree } from '../../../src/lib/solutions/trace/executionTrace'

// The cross-check is the false-certification defense: a wrong answer must NEVER
// agree with the stored oracle, or the walkthrough would animate a wrong result as
// truth. The only coercion allowed is a stored-oracle STRING vs a number/boolean.

// ── legitimate agreement (stored oracle serialized as text) ────────────────────

test('a number answer agrees with its canonical numeric-string oracle', () => {
  assert.equal(answersAgree(3, '3'), true)
  assert.equal(answersAgree(3, ' 3 '), true) // trimmed
  assert.equal(answersAgree(-2, '-2'), true)
  assert.equal(answersAgree(1.5, '1.5'), true)
})

test('a boolean answer agrees with its exact string oracle', () => {
  assert.equal(answersAgree(true, 'true'), true)
  assert.equal(answersAgree(false, 'false'), true)
})

test('arrays and nested objects agree element-wise / key-wise', () => {
  assert.equal(answersAgree([0, 1], ['0', '1']), true)
  assert.equal(answersAgree([[1, 2], [3, 4]], [['1', '2'], ['3', '4']]), true)
  assert.equal(answersAgree({ a: 1, b: 2 }, { a: '1', b: '2' }), true)
})

// ── the defended false-match holes (must all be REJECTED) ──────────────────────

test('scientific-notation / leading-zero strings never collapse to a number', () => {
  assert.equal(answersAgree(1000, '1e3'), false)
  assert.equal(answersAgree(1, '0001'), false)
})

test('string<->number/boolean coercion is symmetric on VALUE, but rejects mismatched values', () => {
  // A string oracle can appear on either side; when the VALUES match it agrees
  // (oracles are frequently serialized as text). This is intentional and safe.
  assert.equal(answersAgree('false', false), true)
  assert.equal(answersAgree(false, 'false'), true)
  // But a differing value must fail, and a numeric string never bridges to the
  // WRONG number.
  assert.equal(answersAgree('true', false), false)
  assert.equal(answersAgree('3', 4), false)
  assert.equal(answersAgree('3', '4'), false)
})

test('array order matters (a permutation is a wrong answer)', () => {
  assert.equal(answersAgree([1, 2], [2, 1]), false)
  assert.equal(answersAgree([1, 2, 3], ['1', '2']), false) // length mismatch
})

test('empty containers only agree with empty containers of the same kind', () => {
  assert.equal(answersAgree([], []), true)
  assert.equal(answersAgree({}, {}), true)
  assert.equal(answersAgree([], {}), false) // array vs object never agree
  assert.equal(answersAgree([], 0), false)
})

test('two strings compare exactly, with no numeric bridge between them', () => {
  assert.equal(answersAgree('3', '3.0'), false) // distinct string encodings
  assert.equal(answersAgree('true', 'True'), false) // case-sensitive strings
})

test('null and undefined do not coincidentally agree with falsy scalars', () => {
  assert.equal(answersAgree(null, 0), false)
  assert.equal(answersAgree(null, ''), false)
  assert.equal(answersAgree(null, null), true)
})
