import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { verifyTurnstileToken } from '../../../src/lib/security/turnstile'

const originalSecret = process.env.TURNSTILE_SECRET_KEY
const originalNodeEnv = process.env.NODE_ENV
const originalFetch = globalThis.fetch
const mutableEnv = process.env as Record<string, string | undefined>

afterEach(() => {
  if (originalSecret === undefined) {
    delete mutableEnv.TURNSTILE_SECRET_KEY
  } else {
    mutableEnv.TURNSTILE_SECRET_KEY = originalSecret
  }
  if (originalNodeEnv === undefined) {
    delete mutableEnv.NODE_ENV
  } else {
    mutableEnv.NODE_ENV = originalNodeEnv
  }
  globalThis.fetch = originalFetch
})

test('skips Turnstile in development when no secret is configured', async () => {
  delete mutableEnv.TURNSTILE_SECRET_KEY
  mutableEnv.NODE_ENV = 'development'

  const result = await verifyTurnstileToken({ token: '' })

  assert.equal(result.ok, true)
  assert.equal(result.skipped, true)
})

test('fails closed in production when no secret is configured', async () => {
  delete mutableEnv.TURNSTILE_SECRET_KEY
  mutableEnv.NODE_ENV = 'production'

  const result = await verifyTurnstileToken({ token: 'token' })

  assert.equal(result.ok, false)
  assert.equal(result.error, 'turnstile_not_configured')
})

test('requires a token when Turnstile is configured', async () => {
  mutableEnv.TURNSTILE_SECRET_KEY = 'secret'
  mutableEnv.NODE_ENV = 'development'
  let fetchCalled = false
  globalThis.fetch = (async () => {
    fetchCalled = true
    return new Response(JSON.stringify({ success: true }))
  }) as typeof fetch

  const result = await verifyTurnstileToken({ token: '' })

  assert.equal(result.ok, false)
  assert.equal(result.error, 'turnstile_missing_token')
  assert.equal(fetchCalled, false)
})

test('posts token, secret, and remote IP to Cloudflare siteverify', async () => {
  mutableEnv.TURNSTILE_SECRET_KEY = 'secret'
  mutableEnv.NODE_ENV = 'development'
  const captured: { body?: Record<string, string> } = {}

  globalThis.fetch = (async (url, init) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify')
    captured.body = JSON.parse(String(init?.body)) as Record<string, string>
    return new Response(JSON.stringify({ success: true }))
  }) as typeof fetch

  const result = await verifyTurnstileToken({ token: ' token ', remoteIp: '203.0.113.7' })
  const submittedBody = captured.body

  assert.equal(result.ok, true)
  assert.ok(submittedBody)
  assert.equal(submittedBody.secret, 'secret')
  assert.equal(submittedBody.response, 'token')
  assert.equal(submittedBody.remoteip, '203.0.113.7')
  assert.ok(submittedBody.idempotency_key)
})
