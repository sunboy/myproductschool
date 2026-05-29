import { test } from 'node:test'
import assert from 'node:assert/strict'
import { moderateUserContent } from '../../../src/lib/ai/moderation'

function withEnv(
  updates: Record<string, string | undefined>,
  fn: () => Promise<void>
) {
  const mutableEnv = process.env as Record<string, string | undefined>
  const previous = Object.fromEntries(
    Object.keys(updates).map(key => [key, mutableEnv[key]])
  )

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) delete mutableEnv[key]
    else mutableEnv[key] = value
  }

  return fn().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete mutableEnv[key]
      else mutableEnv[key] = value
    }
  })
}

test('flags the deterministic discussion moderation e2e fixture without an API key', async () => {
  await withEnv({
    OPENAI_API_KEY: undefined,
    NODE_ENV: 'production',
    DISCUSSION_MODERATION_E2E_FALLBACK: 'true',
  }, async () => {
    const result = await moderateUserContent('This includes BAD_WORD_TEST.')

    assert.equal(result.status, 'flagged')
    assert.deepEqual(result.categories, ['e2e_test_fixture'])
  })
})

test('fails closed in production when moderation API key is missing by default', async () => {
  await withEnv({
    OPENAI_API_KEY: undefined,
    NODE_ENV: 'production',
    DISCUSSION_MODERATION_E2E_FALLBACK: undefined,
  }, async () => {
    const result = await moderateUserContent('A normal discussion reply.')

    assert.equal(result.status, 'unavailable')
    assert.equal(result.reason, 'missing_api_key')
  })
})

test('allows explicit local e2e fallback when moderation API key is missing', async () => {
  await withEnv({
    OPENAI_API_KEY: undefined,
    NODE_ENV: 'production',
    DISCUSSION_MODERATION_E2E_FALLBACK: 'true',
  }, async () => {
    const result = await moderateUserContent('A normal discussion reply.')

    assert.equal(result.status, 'skipped')
    assert.equal(result.reason, 'missing_api_key')
  })
})
