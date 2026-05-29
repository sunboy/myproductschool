import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeAiOutput } from '../../../src/lib/ai/sanitize'

const meta = { route: 'tests', model: 'test-model', userId: '00000000-0000-0000-0000-000000000000', log: false }

test('sanitizes em dashes and double hyphens', () => {
  const result = sanitizeAiOutput({
    ...meta,
    text: 'Strong diagnosis — but the recommendation is vague -- tighten it.',
  })

  assert.equal(result.text, 'Strong diagnosis, but the recommendation is vague, tighten it.')
  assert.equal(result.violations.filter((violation) => violation.rule === 'em_dash').length, 2)
})

test('replaces banned slop words and phrases', () => {
  const result = sanitizeAiOutput({
    ...meta,
    text: 'Leverage this robust workflow in order to unlock a holistic outcome.',
  })

  assert.equal(result.text, 'use this strong workflow to open a complete outcome.')
  assert.equal(result.violations.filter((violation) => violation.rule === 'slop').length, 5)
})

test('strips second-person role framing', () => {
  const result = sanitizeAiOutput({
    ...meta,
    text: 'You are a tech lead at a marketplace. As a senior PM, decide the next move.',
  })

  assert.equal(result.text, 'tech lead at a marketplace. decide the next move.')
  assert.ok(result.violations.some((violation) => violation.rule === 'role_framing'))
})

test('preserves code fences while sanitizing surrounding text', () => {
  const result = sanitizeAiOutput({
    ...meta,
    text: 'Use this — then inspect:\n```ts\nconst x = "Claude -- leverage";\n```\nThen ensure the copy is clean.',
  })

  assert.equal(
    result.text,
    'Use this, then inspect:\n```ts\nconst x = "Claude -- leverage";\n```\nThen make sure the copy is clean.'
  )
})

test('rewrites Hatch identity leaks', () => {
  assert.equal(
    sanitizeAiOutput({ ...meta, text: "I'm powered by Claude Sonnet 4.6." }).text,
    "I'm powered by Hatch."
  )
  assert.equal(
    sanitizeAiOutput({ ...meta, text: 'as an AI language model' }).text,
    'as Hatch'
  )
  assert.equal(
    sanitizeAiOutput({ ...meta, text: 'Let me call my tool.' }).text,
    'Let me.'
  )
})

test('removes leaked model, instruction, tool, and token details from simulated output', () => {
  const result = sanitizeAiOutput({
    ...meta,
    text: "I'm Claude Sonnet 4.6. My system prompt says I should call my tool and use thinking tokens.",
  })

  assert.doesNotMatch(result.text, /claude|sonnet|anthropic|openai|gpt|system prompt|tool call|call my tool|thinking tokens/i)
  assert.ok(result.violations.some((violation) => violation.rule === 'identity_leak'))
})
