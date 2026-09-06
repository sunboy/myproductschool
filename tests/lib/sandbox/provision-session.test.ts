import assert from 'node:assert/strict'
import test from 'node:test'

import {
  blockOwnedFailedProvisioningKey,
  provisionSession,
  type ProvisionFailure,
  type ProvisionInput,
} from '../../../src/lib/sandbox/provision-session'
import type { createAdminClient } from '../../../src/lib/supabase/admin'

const input: ProvisionInput = {
  sessionId: 'session-fail-closed',
  userId: 'user-1',
  challengeId: 'analytics-1',
  bqProject: 'bigquery-public-data',
  bqDataset: 'samples',
  bqBillingProject: 'hackproduct',
  claudeMd: 'Test instructions',
  ttlSeconds: 1800,
}

test('provisionSession fails closed without the gateway even if a shared provider key exists', async () => {
  const previousProviderKey = process.env.ANTHROPIC_API_KEY
  process.env.ANTHROPIC_API_KEY = 'shared-provider-key-must-not-be-used'
  let recordedFailure: ProvisionFailure | undefined
  let failedSessionId: string | undefined

  try {
    const result = await provisionSession(input, {
      createAdminClient: () => ({}) as ReturnType<typeof createAdminClient>,
      isGatewayConfigured: () => false,
      allowsDirectProviderKey: () => false,
      markFailed: async (_admin, sessionId, failure) => {
        failedSessionId = sessionId
        recordedFailure = failure
        return true
      },
    })

    assert.deepEqual(result, {
      ok: false,
      status: 503,
      error: 'The analytics environment is temporarily unavailable. Please try again.',
    })
    assert.equal(failedSessionId, input.sessionId)
    assert.equal(recordedFailure?.code, 'gateway_unconfigured')
  } finally {
    if (previousProviderKey === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = previousProviderKey
  }
})

test('a provisioning loser cannot block the key owned by a racing active session', async () => {
  let calls = 0
  const result = await blockOwnedFailedProvisioningKey(false, 'session-race', async () => {
    calls++
    return { status: 'blocked', spentCents: 0 }
  })
  assert.equal(result, null)
  assert.equal(calls, 0)
})
