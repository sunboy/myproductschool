import assert from 'node:assert/strict'
import test from 'node:test'
import { getSessionKeySpend } from '../../../src/lib/sandbox/llm-gateway'

test('gateway usage selects the exact alias, preserves real spend and rejects unavailable data', async () => {
  const previousFetch = globalThis.fetch
  const previousUrl = process.env.LLM_GATEWAY_URL
  const previousKey = process.env.LLM_GATEWAY_MASTER_KEY
  process.env.LLM_GATEWAY_URL = 'https://gateway.example.test'
  process.env.LLM_GATEWAY_MASTER_KEY = 'test-only'
  try {
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input))
      assert.equal(url.searchParams.get('key_alias'), 'cc-test-session')
      assert.equal(init?.cache, 'no-store')
      return Response.json({ keys: [
        { key_alias: 'cc-test-session-other', spend: 9, max_budget: 10 },
        { key_alias: 'cc-test-session', spend: 0.073, max_budget: 0.5 },
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
    assert.deepEqual(await getSessionKeySpend('test-session'), { spentUsd: 0, budgetUsd: null })
  } finally {
    globalThis.fetch = previousFetch
    if (previousUrl === undefined) delete process.env.LLM_GATEWAY_URL
    else process.env.LLM_GATEWAY_URL = previousUrl
    if (previousKey === undefined) delete process.env.LLM_GATEWAY_MASTER_KEY
    else process.env.LLM_GATEWAY_MASTER_KEY = previousKey
  }
})
