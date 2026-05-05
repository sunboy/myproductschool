import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from '@/lib/notifications/unsubscribe'

const originalSecret = process.env.UNSUBSCRIBE_TOKEN_SECRET

after(() => {
  if (originalSecret == null) {
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET
  } else {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = originalSecret
  }
})

describe('unsubscribe tokens', () => {
  it('round-trips a signed notification preference payload', () => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = 'test-secret'

    const token = createUnsubscribeToken({
      userId: '00000000-0000-0000-0000-000000000001',
      preference: 'streak_reminder',
    })

    assert.ok(token)
    assert.deepEqual(verifyUnsubscribeToken(token), {
      userId: '00000000-0000-0000-0000-000000000001',
      preference: 'streak_reminder',
    })
  })

  it('rejects a tampered token', () => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = 'test-secret'

    const token = createUnsubscribeToken({
      userId: '00000000-0000-0000-0000-000000000001',
      preference: 'streak_reminder',
    })

    assert.ok(token)
    assert.equal(verifyUnsubscribeToken(`${token.slice(0, -1)}x`), null)
  })
})
