import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractJson, truncateForLog } from '../../../src/lib/anthropic/extract-json'

test('parses clean JSON object', () => {
  assert.deepEqual(extractJson('{"nudge":"hello"}'), { nudge: 'hello' })
})

test('parses JSON wrapped in ```json fences', () => {
  const raw = '```json\n{"nudge":"hi"}\n```'
  assert.deepEqual(extractJson(raw), { nudge: 'hi' })
})

test('parses JSON wrapped in bare ``` fences', () => {
  const raw = '```\n{"nudge":"hi"}\n```'
  assert.deepEqual(extractJson(raw), { nudge: 'hi' })
})

test('extracts object when prose precedes it', () => {
  const raw = 'Here is my response:\n{"nudge":"look at the join table"}'
  assert.deepEqual(extractJson(raw), { nudge: 'look at the join table' })
})

test('extracts object when prose follows it (the position-20 crash case)', () => {
  const raw = '{"nudge":"add a PK"}\n\nLet me know if you want more detail.'
  assert.deepEqual(extractJson(raw), { nudge: 'add a PK' })
})

test('extracts object with prose on both sides', () => {
  const raw = 'Sure!\n{"nudge":"name the tradeoff"}\nHope that helps.'
  assert.deepEqual(extractJson(raw), { nudge: 'name the tradeoff' })
})

test('returns null when no JSON is present', () => {
  assert.equal(extractJson('I have nothing useful to add right now.'), null)
})

test('returns null for empty / nullish input', () => {
  assert.equal(extractJson(''), null)
  assert.equal(extractJson(null), null)
  assert.equal(extractJson(undefined), null)
})

test('does not get skewed by braces inside string values', () => {
  const raw = 'prose {"nudge":"use a set like {1,2,3} here"} trailing }'
  assert.deepEqual(extractJson(raw), { nudge: 'use a set like {1,2,3} here' })
})

test('handles trailing prose that itself contains a closing brace', () => {
  // The greedy /\{[\s\S]*\}/ regex would swallow the trailing `}` and fail.
  const raw = '{"nudge":"ok"}\n\nas shown in the diagram}.'
  assert.deepEqual(extractJson(raw), { nudge: 'ok' })
})

test('extracts the first of multiple objects', () => {
  const raw = '{"nudge":"first"} some noise {"nudge":"second"}'
  assert.deepEqual(extractJson(raw), { nudge: 'first' })
})

test('skips a non-JSON brace pair in the preamble and finds the real object', () => {
  const raw = 'Here is {the result}: {"nudge":"the payload"}'
  assert.deepEqual(extractJson(raw), { nudge: 'the payload' })
})

test('skips multiple non-JSON spans before a valid object', () => {
  const raw = 'note {todo} then {n/a} and finally {"nudge":"real"} thanks'
  assert.deepEqual(extractJson(raw), { nudge: 'real' })
})

test('skips a non-JSON array span before the real object', () => {
  const raw = 'options [a, b, c] were considered; {"nudge":"pick b"}'
  assert.deepEqual(extractJson(raw), { nudge: 'pick b' })
})

test('gives up after the attempt cap of non-JSON spans', () => {
  // 6 non-JSON brace pairs precede the real object; the cap is 5, so it is
  // not reached. Documents the bound rather than promising unlimited scanning.
  const raw = '{a}{b}{c}{d}{e}{f}{"nudge":"too late"}'
  assert.equal(extractJson(raw), null)
})

test('finds a valid object within the attempt cap', () => {
  // 4 non-JSON spans then the real one — within the 5-attempt cap.
  const raw = '{a}{b}{c}{d}{"nudge":"just in time"}'
  assert.deepEqual(extractJson(raw), { nudge: 'just in time' })
})

test('handles escaped quotes inside string values', () => {
  const raw = '{"nudge":"they said \\"ship it\\" too early"}'
  assert.deepEqual(extractJson(raw), { nudge: 'they said "ship it" too early' })
})

test('extracts a JSON array', () => {
  const raw = 'here you go:\n["a","b","c"]'
  assert.deepEqual(extractJson(raw), ['a', 'b', 'c'])
})

test('returns null for an unbalanced object', () => {
  assert.equal(extractJson('{"nudge":"missing close"'), null)
})

test('truncateForLog caps long output and annotates length', () => {
  const long = 'x'.repeat(400)
  const out = truncateForLog(long, 300)
  assert.ok(out.startsWith('x'.repeat(300)))
  assert.ok(out.includes('+100 chars'))
})

test('truncateForLog returns short output unchanged', () => {
  assert.equal(truncateForLog('short', 300), 'short')
  assert.equal(truncateForLog(null), '')
})
