import assert from 'node:assert/strict'
import test from 'node:test'
import { blockSessionKey, getSessionKeySpend } from '../../../src/lib/sandbox/llm-gateway'

test('gateway usage selects the exact alias, preserves real spend, and always displays the configured ceiling (never the gateway\'s reduced max_budget)', async () => {
  const previousFetch = globalThis.fetch
  const previousUrl = process.env.LLM_GATEWAY_URL
  const previousKey = process.env.LLM_GATEWAY_MASTER_KEY
  const previousSessionBudget = process.env.CC_SESSION_BUDGET_USD
  process.env.LLM_GATEWAY_URL = 'https://gateway.example.test'
  process.env.LLM_GATEWAY_MASTER_KEY = 'test-only'
  process.env.CC_SESSION_BUDGET_USD = '0.5'
  try {
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input))
      assert.equal(url.searchParams.get('key_alias'), 'cc-test-session')
      assert.equal(init?.cache, 'no-store')
      return Response.json({ keys: [
        { key_alias: 'cc-test-session-other', spend: 9, max_budget: 10 },
        // The gateway's own max_budget (0.4) is the reduced mint value, not
        // the 0.5 ceiling — getSessionKeySpend must ignore it and display
        // the configured ceiling instead.
        { key_alias: 'cc-test-session', spend: 0.073, max_budget: 0.35 },
      ] })
    }
    assert.deepEqual(await getSessionKeySpend('test-session'), { spentUsd: 0.073, budgetUsd: 0.5 })
    globalThis.fetch = async () => Response.json({ keys: [{ key_alias: 'cc-test-session-other', spend: 9 }] })
    assert.equal(await getSessionKeySpend('test-session'), null)
    globalThis.fetch = async () => Response.json({ keys: [{ key_alias: 'cc-test-session' }] })
    assert.equal(await getSessionKeySpend('test-session'), null)
    globalThis.fetch = async () => new Response('unavailable', { status: 503 })
    assert.equal(await getSessionKeySpend('test-session'), null)
    globalThis.fetch = async () => { throw new Error('timeout') }
    assert.equal(await getSessionKeySpend('test-session'), null)
    globalThis.fetch = async () => Response.json({ keys: [{ key_alias: 'cc-test-session', spend: 0, max_budget: null }] })
    assert.deepEqual(await getSessionKeySpend('test-session'), { spentUsd: 0, budgetUsd: 0.5 })
  } finally {
    if (previousSessionBudget === undefined) delete process.env.CC_SESSION_BUDGET_USD
    else process.env.CC_SESSION_BUDGET_USD = previousSessionBudget
    globalThis.fetch = previousFetch
    if (previousUrl === undefined) delete process.env.LLM_GATEWAY_URL
    else process.env.LLM_GATEWAY_URL = previousUrl
    if (previousKey === undefined) delete process.env.LLM_GATEWAY_MASTER_KEY
    else process.env.LLM_GATEWAY_MASTER_KEY = previousKey
  }
})

test('session key blocking validates exact alias and metadata while retaining spend', async () => {
  const previousFetch = globalThis.fetch
  const previousUrl = process.env.LLM_GATEWAY_URL
  const previousKey = process.env.LLM_GATEWAY_MASTER_KEY
  process.env.LLM_GATEWAY_URL = 'https://gateway.example.test'
  process.env.LLM_GATEWAY_MASTER_KEY = 'test-only'
  const calls: Array<{ url: string; method: string; body?: unknown }> = []
  try {
    globalThis.fetch = async (input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      calls.push({
        url,
        method,
        ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}),
      })
      if (url.includes('/key/list')) {
        return Response.json({
          keys: [
            {
              key_alias: 'cc-session-1-neighbor',
              token: 'neighbor-hash',
              metadata: { feature: 'claude_code_analytics', session_id: 'session-1-neighbor' },
              spend: 9,
              blocked: false,
            },
            {
              key_alias: 'cc-session-1',
              token: 'exact-hash',
              metadata: { feature: 'claude_code_analytics', session_id: 'session-1' },
              spend: 0.073,
              blocked: false,
            },
          ],
        })
      }
      assert.equal(url, 'https://gateway.example.test/key/block')
      assert.deepEqual(JSON.parse(String(init?.body)), { key: 'exact-hash' })
      return Response.json({ blocked: true, spend: 0.073, token: 'exact-hash' })
    }

    assert.deepEqual(await blockSessionKey('session-1'), { status: 'blocked', spentCents: 7 })
    assert.equal(calls.length, 2)
    assert.equal(calls.some((call) => call.url.includes('/key/delete')), false)
  } finally {
    globalThis.fetch = previousFetch
    if (previousUrl === undefined) delete process.env.LLM_GATEWAY_URL
    else process.env.LLM_GATEWAY_URL = previousUrl
    if (previousKey === undefined) delete process.env.LLM_GATEWAY_MASTER_KEY
    else process.env.LLM_GATEWAY_MASTER_KEY = previousKey
  }
})

test('session key blocking is idempotent and refuses mismatched metadata', async () => {
  const previousFetch = globalThis.fetch
  const previousUrl = process.env.LLM_GATEWAY_URL
  const previousKey = process.env.LLM_GATEWAY_MASTER_KEY
  process.env.LLM_GATEWAY_URL = 'https://gateway.example.test'
  process.env.LLM_GATEWAY_MASTER_KEY = 'test-only'
  try {
    let calls = 0
    globalThis.fetch = async () => {
      calls++
      return Response.json({
        keys: [{
          key_alias: 'cc-session-2',
          token: 'exact-hash',
          metadata: { feature: 'claude_code_analytics', session_id: 'session-2' },
          spend: 0.11,
          blocked: true,
        }],
      })
    }
    assert.deepEqual(await blockSessionKey('session-2'), {
      status: 'already_blocked',
      spentCents: 11,
    })
    assert.equal(calls, 1)

    globalThis.fetch = async () => Response.json({
      keys: [{
        key_alias: 'cc-session-2',
        token: 'exact-hash',
        metadata: { feature: 'claude_code_analytics', session_id: 'session-2' },
        blocked: true,
      }],
    })
    assert.deepEqual(await blockSessionKey('session-2'), {
      status: 'already_blocked',
      spentCents: null,
    })

    globalThis.fetch = async () => Response.json({
      keys: [{
        key_alias: 'cc-session-2',
        token: 'must-not-be-used',
        metadata: { feature: 'claude_code_analytics', session_id: 'different-session' },
        spend: 0.11,
        blocked: false,
      }],
    })
    assert.deepEqual(await blockSessionKey('session-2'), {
      status: 'failed',
      reason: 'metadata_mismatch',
    })
  } finally {
    globalThis.fetch = previousFetch
    if (previousUrl === undefined) delete process.env.LLM_GATEWAY_URL
    else process.env.LLM_GATEWAY_URL = previousUrl
    if (previousKey === undefined) delete process.env.LLM_GATEWAY_MASTER_KEY
    else process.env.LLM_GATEWAY_MASTER_KEY = previousKey
  }
})
