import assert from 'node:assert/strict'
import test from 'node:test'

import { CloudRunProvider } from '../../../src/lib/sandbox/providers/cloud-run-provider'
import type { SessionEnv } from '../../../src/lib/sandbox/types'

const REQUIRED_ENV = {
  GCP_PROJECT: 'hackproduct',
  CLOUD_RUN_REGION: 'us-central1',
  CLOUD_RUN_SERVICE: 'cc-sandbox',
  SANDBOX_WSS_HOST: 'cc-sandbox.example.run.app',
  CLOUD_RUN_SA_JSON: '{}',
  CLOUD_RUN_RUNTIME_SA: 'cc-bq-readonly@hackproduct.iam.gserviceaccount.com',
  CLOUD_RUN_IMAGE: 'us-central1-docker.pkg.dev/hackproduct/cc/sandbox:test',
  CLOUD_RUN_BASE_REVISION: 'cc-sandbox-base',
  CC_MAX_SESSION_TTL_SECONDS: '1800',
} as const

function withRequiredEnv(): () => void {
  const previous = new Map<string, string | undefined>()
  for (const [name, value] of Object.entries(REQUIRED_ENV)) {
    previous.set(name, process.env[name])
    process.env[name] = value
  }
  return () => {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}

function sessionEnv(): SessionEnv {
  return {
    ANTHROPIC_API_KEY: 'budgeted-virtual-key',
    SESSION_ID: '123e4567-e89b-12d3-a456-426614174000',
    SESSION_TOKEN_SECRET: 'test-session-secret',
  }
}

test('createSession preserves live tags, carries etag, pins sterile base, and clamps TTL', async () => {
  const restore = withRequiredEnv()
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const fetchFn: typeof fetch = async (input, init) => {
    const url = String(input)
    calls.push({ url, init })
    if (!init?.method) {
      return Response.json({
        etag: 'service-version-7',
        traffic: [
          { type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST', percent: 100 },
          {
            type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
            revision: 'cc-sandbox-sother',
            tag: 'sother',
            percent: 0,
          },
        ],
      })
    }
    return Response.json({ name: 'operations/create-session' })
  }

  try {
    const provider = new CloudRunProvider({
      fetchFn,
      accessToken: async () => 'test-access-token',
    })
    const startedAt = Date.now()
    const result = await provider.createSession({
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      env: sessionEnv(),
      ttlSeconds: 7200,
    })

    assert.equal(calls.length, 2)
    assert.equal(calls[1].init?.method, 'PATCH')
    const body = JSON.parse(String(calls[1].init?.body))
    assert.equal(body.etag, 'service-version-7')
    assert.equal(body.template.timeout, '1800s')
    assert.deepEqual(body.traffic, [
      {
        type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
        revision: 'cc-sandbox-base',
        percent: 100,
      },
      {
        type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
        revision: 'cc-sandbox-sother',
        tag: 'sother',
        percent: 0,
      },
      {
        type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
        revision: `cc-sandbox-${result.hostInstanceId}`,
        tag: result.hostInstanceId,
        percent: 0,
      },
    ])
    const effectiveTtlMs = Date.parse(result.expiresAt) - startedAt
    assert.ok(effectiveTtlMs >= 1_799_000 && effectiveTtlMs <= 1_801_000)
  } finally {
    restore()
  }
})

test('destroySession does not delete a revision when traffic detach conflicts', async () => {
  const restore = withRequiredEnv()
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const fetchFn: typeof fetch = async (input, init) => {
    const url = String(input)
    calls.push({ url, init })
    if (!init?.method) {
      return Response.json({
        etag: 'service-version-8',
        traffic: [
          {
            type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
            revision: 'cc-sandbox-base',
            percent: 100,
          },
          {
            type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
            revision: 'cc-sandbox-smine',
            tag: 'smine',
            percent: 0,
          },
        ],
      })
    }
    return new Response('etag conflict', { status: 412 })
  }

  const originalError = console.error
  console.error = () => undefined
  try {
    const provider = new CloudRunProvider({
      fetchFn,
      accessToken: async () => 'test-access-token',
    })
    await assert.rejects(provider.destroySession('smine'), /Failed to detach session traffic tag/)
    assert.equal(calls.length, 2)
    assert.equal(calls[1].init?.method, 'PATCH')
    const patchBody = JSON.parse(String(calls[1].init?.body))
    assert.equal(patchBody.etag, 'service-version-8')
    assert.deepEqual(patchBody.traffic, [{
      type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION',
      revision: 'cc-sandbox-base',
      percent: 100,
    }])
    assert.equal(calls.some((call) => call.init?.method === 'DELETE'), false)
  } finally {
    console.error = originalError
    restore()
  }
})
