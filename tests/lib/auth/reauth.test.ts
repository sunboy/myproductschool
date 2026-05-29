import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import {
  createReauthToken,
  REAUTH_MAX_AGE_SECONDS,
  verifyReauthToken,
} from '@/lib/auth/reauth'

const originalSecret = process.env.REAUTH_TOKEN_SECRET

after(() => {
  if (originalSecret == null) {
    delete process.env.REAUTH_TOKEN_SECRET
  } else {
    process.env.REAUTH_TOKEN_SECRET = originalSecret
  }
})

describe('reauth tokens', () => {
  it('round-trips a short-lived user token', () => {
    process.env.REAUTH_TOKEN_SECRET = 'test-secret'
    const userId = '00000000-0000-0000-0000-000000000001'
    const issuedAt = 1_000

    const token = createReauthToken(userId, issuedAt)

    assert.ok(token)
    assert.equal(verifyReauthToken(token, userId, issuedAt), true)
  })

  it('rejects another user and expired tokens', () => {
    process.env.REAUTH_TOKEN_SECRET = 'test-secret'
    const userId = '00000000-0000-0000-0000-000000000001'
    const issuedAt = 1_000

    const token = createReauthToken(userId, issuedAt)

    assert.ok(token)
    assert.equal(verifyReauthToken(token, '00000000-0000-0000-0000-000000000002', issuedAt), false)
    assert.equal(verifyReauthToken(token, userId, issuedAt + REAUTH_MAX_AGE_SECONDS * 1000 + 1), false)
  })
})
