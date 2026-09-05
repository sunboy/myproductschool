import assert from 'node:assert/strict'
import test from 'node:test'

import {
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
