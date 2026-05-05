import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BANNED_SLOP,
  EM_DASH_PATTERNS,
  IDENTITY_LEAK_PATTERNS,
  ROLE_FRAMING_PATTERNS,
  SLOP_PATTERNS,
} from '../../../src/lib/ai/voice-rules'

function matchesAny(patterns: Array<{ re: RegExp }>, text: string) {
  return patterns.some(({ re }) => {
    re.lastIndex = 0
    return re.test(text)
  })
}

test('BANNED_SLOP includes launch voice banned words and phrases', () => {
  assert.ok(BANNED_SLOP.includes('delve'))
  assert.ok(BANNED_SLOP.includes('leverage'))
  assert.ok(BANNED_SLOP.includes('in order to'))
  assert.ok(BANNED_SLOP.includes("it's worth noting"))
})

test('SLOP_PATTERNS match banned words and phrases case-insensitively', () => {
  assert.equal(matchesAny(SLOP_PATTERNS, 'We can leverage this in order to grow.'), true)
  assert.equal(matchesAny(SLOP_PATTERNS, "It's worth noting that this is robust."), true)
})

test('EM_DASH_PATTERNS match em dash and double hyphen', () => {
  assert.equal(matchesAny(EM_DASH_PATTERNS, 'Strong answer — but too broad.'), true)
  assert.equal(matchesAny(EM_DASH_PATTERNS, 'Strong answer -- but too broad.'), true)
})

test('ROLE_FRAMING_PATTERNS catch second-person role framing', () => {
  assert.equal(matchesAny(ROLE_FRAMING_PATTERNS, 'You are a tech lead at Stripe.'), true)
  assert.equal(matchesAny(ROLE_FRAMING_PATTERNS, 'As a senior PM, decide what to do.'), true)
  assert.equal(matchesAny(ROLE_FRAMING_PATTERNS, 'Imagine you inherited this problem.'), true)
})

test('IDENTITY_LEAK_PATTERNS catch model and implementation leaks', () => {
  assert.equal(matchesAny(IDENTITY_LEAK_PATTERNS, "I'm powered by Claude Sonnet 4.6."), true)
  assert.equal(matchesAny(IDENTITY_LEAK_PATTERNS, 'As an AI language model, I cannot answer.'), true)
  assert.equal(matchesAny(IDENTITY_LEAK_PATTERNS, 'Let me call my tool.'), true)
  assert.equal(matchesAny(IDENTITY_LEAK_PATTERNS, 'This used thinking tokens.'), true)
})
