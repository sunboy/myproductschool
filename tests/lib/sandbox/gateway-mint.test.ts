import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import test from 'node:test'

import { mintSessionVirtualKey } from '../../../src/lib/sandbox/llm-gateway'

const MASTER = 'test-master-key-for-deterministic-mint'
const DOMAIN = 'myproductschool:cc-session-key:v1\0'

type GenerateBody = {
  key: string
  key_alias: string
  max_budget: number
  duration: string
  models: string[]
  metadata: {
    feature: string
    session_id: string
    key_derivation: string
    ttl_seconds: number
    expires_at: string
  }
}

function expectedRawKey(sessionId: string): string {
  return `sk-${createHmac('sha256', MASTER).update(`${DOMAIN}${sessionId}`).digest('base64url')}`
}

function tokenHash(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

// The gateway key is minted with headroom reserved off the ceiling (see
// cost-policy.ts resolveKeyMaxBudgetUsd). With the default 0.10 headroom and
// the 0.50 CC_SESSION_BUDGET_USD used throughout this file, the persisted
// gateway max_budget is 0.40 — never the raw 0.50 ceiling.
const EXPECTED_KEY_MAX_BUDGET = 0.4

function persistedKey(
  sessionId: string,
  expiresAt: string,
  overrides: Record<string, unknown> = {},
) {
  const rawKey = expectedRawKey(sessionId)
  return {
    key_alias: `cc-${sessionId}`,
    token: tokenHash(rawKey),
    metadata: {
      feature: 'claude_code_analytics',
      session_id: sessionId,
      key_derivation: 'hmac-sha256-v1',
      ttl_seconds: 900,
      expires_at: expiresAt,
    },
    max_budget: EXPECTED_KEY_MAX_BUDGET,
    models: ['claude-sonnet', 'claude-haiku'],
    blocked: false,
    expires: expiresAt,
    spend: 0,
    ...overrides,
  }
}

async function withGatewayEnvironment(run: () => Promise<void>): Promise<void> {
  const previous = {
    fetch: globalThis.fetch,
    url: process.env.LLM_GATEWAY_URL,
    master: process.env.LLM_GATEWAY_MASTER_KEY,
    budget: process.env.CC_SESSION_BUDGET_USD,
    timeout: process.env.CC_MINT_ATTEMPT_TIMEOUT_MS,
  }
  process.env.LLM_GATEWAY_URL = 'https://gateway.example.test'
  process.env.LLM_GATEWAY_MASTER_KEY = MASTER
  process.env.CC_SESSION_BUDGET_USD = '0.50'
  process.env.CC_MINT_ATTEMPT_TIMEOUT_MS = '50'
  try {
    await run()
  } finally {
    globalThis.fetch = previous.fetch
    for (const [name, value] of [
      ['LLM_GATEWAY_URL', previous.url],
      ['LLM_GATEWAY_MASTER_KEY', previous.master],
      ['CC_SESSION_BUDGET_USD', previous.budget],
      ['CC_MINT_ATTEMPT_TIMEOUT_MS', previous.timeout],
    ] as const) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}

test('recovers a lost successful generate response using the supplied deterministic key', async () => {
  await withGatewayEnvironment(async () => {
    const sessionId = 'session-lost-200'
    const expectedKey = expectedRawKey(sessionId)
    let generateBody: GenerateBody | null = null
    const calls: string[] = []

    globalThis.fetch = async (input, init) => {
      const url = String(input)
      calls.push(url)
      if (url.includes('/key/list')) {
        return Response.json({
          keys: generateBody
            ? [persistedKey(sessionId, generateBody.metadata.expires_at)]
            : [],
        })
      }
      if (url.endsWith('/key/generate')) {
        generateBody = JSON.parse(String(init?.body)) as GenerateBody
        assert.equal(generateBody.key, expectedKey)
        assert.equal(generateBody.key_alias, `cc-${sessionId}`)
        assert.equal(generateBody.max_budget, EXPECTED_KEY_MAX_BUDGET)
        assert.deepEqual(generateBody.models, ['claude-sonnet', 'claude-haiku'])
        assert.deepEqual(
          {
            feature: generateBody.metadata.feature,
            session_id: generateBody.metadata.session_id,
            key_derivation: generateBody.metadata.key_derivation,
            ttl_seconds: generateBody.metadata.ttl_seconds,
          },
          {
            feature: 'claude_code_analytics',
            session_id: sessionId,
            key_derivation: 'hmac-sha256-v1',
            ttl_seconds: 900,
          },
        )
        throw new DOMException('response lost after persistence', 'TimeoutError')
      }
      throw new Error(`Unexpected request: ${url}`)
    }

    const result = await mintSessionVirtualKey(
      sessionId,
      900,
      ['claude-sonnet', 'claude-haiku'],
    )
    assert.equal(result?.key, expectedKey)
    // budgetUsd returned to callers stays the user-facing ceiling, not the
    // reduced value minted on the gateway.
    assert.equal(result?.budgetUsd, 0.5)
    assert.equal(calls.filter((url) => url.endsWith('/key/generate')).length, 1)
    assert.equal(calls.some((url) => url.includes('/key/delete')), false)
  })
})

test('retries after a successful generate when its immediate verification lookup is unavailable', async () => {
  await withGatewayEnvironment(async () => {
    const sessionId = 'session-200-lookup-retry'
    const expectedKey = expectedRawKey(sessionId)
    const previousSetTimeout = globalThis.setTimeout
    let generateBody: GenerateBody | null = null
    let listCalls = 0
    let generateCalls = 0
    const calls: string[] = []

    globalThis.setTimeout = ((callback: (...args: unknown[]) => void) => {
      queueMicrotask(callback)
      return 0 as unknown as ReturnType<typeof setTimeout>
    }) as typeof setTimeout

    try {
      globalThis.fetch = async (input, init) => {
        const url = String(input)
        calls.push(url)
        if (url.includes('/key/list')) {
          listCalls++
          if (listCalls === 1) return Response.json({ keys: [] })
          if (listCalls === 2) return new Response('temporarily unavailable', { status: 503 })
          assert.ok(generateBody)
          return Response.json({
            keys: [persistedKey(sessionId, generateBody.metadata.expires_at)],
          })
        }
        if (url.endsWith('/key/generate')) {
          generateCalls++
          generateBody = JSON.parse(String(init?.body)) as GenerateBody
          assert.equal(generateBody.key, expectedKey)
          if (generateCalls === 1) return Response.json({ key: expectedKey })
          return new Response('duplicate alias', { status: 409 })
        }
        throw new Error(`Unexpected request: ${url}`)
      }

      const result = await mintSessionVirtualKey(
        sessionId,
        900,
        ['claude-sonnet', 'claude-haiku'],
      )
      assert.equal(result?.key, expectedKey)
      assert.equal(generateCalls, 2)
      assert.equal(listCalls, 3)
      assert.equal(calls.some((url) => url.includes('/key/delete')), false)
    } finally {
      globalThis.setTimeout = previousSetTimeout
    }
  })
})

test('cross-invocation recovery accepts the original bounded deadline without extending TTL', async () => {
  await withGatewayEnvironment(async () => {
    const sessionId = 'session-later-invocation'
    const originalDeadline = new Date(Date.now() + 8 * 60 * 1000).toISOString()
    const calls: string[] = []

    globalThis.fetch = async (input) => {
      const url = String(input)
      calls.push(url)
      if (url.includes('/key/list')) {
        return Response.json({ keys: [persistedKey(sessionId, originalDeadline)] })
      }
      throw new Error(`Recovery must not mutate or extend the persisted key: ${url}`)
    }

    const result = await mintSessionVirtualKey(
      sessionId,
      900,
      ['claude-haiku', 'claude-sonnet'],
    )
    assert.equal(result?.key, expectedRawKey(sessionId))
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.includes('/key/list'), true)
  })
})

test('refuses foreign hash or ownership metadata without generating or deleting a key', async () => {
  await withGatewayEnvironment(async () => {
    const cases = [
      { token: tokenHash('sk-foreign') },
      { metadata: { feature: 'other_feature', session_id: 'session-owned', key_derivation: 'hmac-sha256-v1', ttl_seconds: 900, expires_at: new Date(Date.now() + 60_000).toISOString() } },
      { metadata: { feature: 'claude_code_analytics', session_id: 'other-session', key_derivation: 'hmac-sha256-v1', ttl_seconds: 900, expires_at: new Date(Date.now() + 60_000).toISOString() } },
    ]

    for (const overrides of cases) {
      const calls: string[] = []
      const expiresAt = new Date(Date.now() + 60_000).toISOString()
      globalThis.fetch = async (input) => {
        const url = String(input)
        calls.push(url)
        return Response.json({ keys: [persistedKey('session-owned', expiresAt, overrides)] })
      }
      await assert.rejects(() => mintSessionVirtualKey(
        'session-owned',
        900,
        ['claude-sonnet', 'claude-haiku'],
      ))
      assert.equal(calls.length, 1)
      assert.equal(calls.some((url) => url.includes('/key/generate') || url.includes('/key/delete')), false)
    }
  })
})

test('refuses blocked and expired persisted keys without replacement', async () => {
  await withGatewayEnvironment(async () => {
    const cases = [
      persistedKey('session-state', new Date(Date.now() + 60_000).toISOString(), { blocked: true }),
      persistedKey('session-state', new Date(Date.now() - 60_000).toISOString()),
    ]

    for (const key of cases) {
      const calls: string[] = []
      globalThis.fetch = async (input) => {
        calls.push(String(input))
        return Response.json({ keys: [key] })
      }
      await assert.rejects(() => mintSessionVirtualKey(
        'session-state',
        900,
        ['claude-sonnet', 'claude-haiku'],
      ))
      assert.equal(calls.length, 1)
      assert.equal(calls.some((url) => url.includes('/key/generate') || url.includes('/key/delete')), false)
    }
  })
})

test('refuses persisted keys whose cap or model set differs from the request', async () => {
  await withGatewayEnvironment(async () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    const cases = [
      { max_budget: 0.51 },
      { max_budget: 0.49 },
      { models: ['claude-sonnet', 'claude-haiku', 'unexpected-model'] },
      { models: ['claude-sonnet'] },
    ]

    for (const overrides of cases) {
      const calls: string[] = []
      globalThis.fetch = async (input) => {
        calls.push(String(input))
        return Response.json({ keys: [persistedKey('session-policy', expiresAt, overrides)] })
      }
      await assert.rejects(() => mintSessionVirtualKey(
        'session-policy',
        900,
        ['claude-haiku', 'claude-sonnet'],
      ))
      assert.equal(calls.length, 1)
      assert.equal(calls.some((url) => url.includes('/key/generate') || url.includes('/key/delete')), false)
    }
  })
})
