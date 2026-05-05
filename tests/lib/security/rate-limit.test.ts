import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRateLimiter } from '../../../src/lib/security/rate-limit'

test('in-memory fallback allows up to the configured limit and then blocks', async () => {
  let now = 1_000
  const warnings: string[] = []
  const rateLimit = createRateLimiter({
    useUpstash: false,
    memoryFallback: true,
    now: () => now,
    warn: (message) => warnings.push(message),
  })

  const first = await rateLimit({ key: 'user:1', limit: 2, windowSec: 10 })
  const second = await rateLimit({ key: 'user:1', limit: 2, windowSec: 10 })
  const third = await rateLimit({ key: 'user:1', limit: 2, windowSec: 10 })

  assert.equal(first.allowed, true)
  assert.equal(first.remaining, 1)
  assert.equal(second.allowed, true)
  assert.equal(second.remaining, 0)
  assert.equal(third.allowed, false)
  assert.equal(third.remaining, 0)
  assert.equal(third.resetAt.getTime(), 11_000)
  assert.equal(warnings.length, 1)

  now = 11_001
  const reset = await rateLimit({ key: 'user:1', limit: 2, windowSec: 10 })
  assert.equal(reset.allowed, true)
  assert.equal(reset.remaining, 1)
  assert.equal(reset.resetAt.getTime(), 21_001)
})

test('in-memory fallback scopes buckets by key, limit, and window', async () => {
  const rateLimit = createRateLimiter({
    useUpstash: false,
    memoryFallback: true,
    now: () => 5_000,
    warn: () => {},
  })

  assert.equal((await rateLimit({ key: 'a', limit: 1, windowSec: 60 })).allowed, true)
  assert.equal((await rateLimit({ key: 'a', limit: 1, windowSec: 60 })).allowed, false)
  assert.equal((await rateLimit({ key: 'b', limit: 1, windowSec: 60 })).allowed, true)
  assert.equal((await rateLimit({ key: 'a', limit: 2, windowSec: 60 })).allowed, true)
  assert.equal((await rateLimit({ key: 'a', limit: 1, windowSec: 30 })).allowed, true)
})

test('uses injected Upstash limiter when configured', async () => {
  const calls: Array<{ limit: number; windowSec: number; key: string }> = []
  const rateLimit = createRateLimiter({
    useUpstash: true,
    memoryFallback: false,
    getUpstashLimiter: (limit, windowSec) => ({
      limit: async (key) => {
        calls.push({ limit, windowSec, key })
        return { success: false, remaining: 0, reset: 12_345 }
      },
    }),
  })

  const result = await rateLimit({ key: 'ip:127.0.0.1', limit: 5, windowSec: 60 })

  assert.deepEqual(calls, [{ limit: 5, windowSec: 60, key: 'ip:127.0.0.1' }])
  assert.equal(result.allowed, false)
  assert.equal(result.remaining, 0)
  assert.equal(result.resetAt.getTime(), 12_345)
})

test('throws in production-style mode when Upstash env is unavailable and fallback is disabled', async () => {
  const rateLimit = createRateLimiter({
    useUpstash: false,
    memoryFallback: false,
    warn: () => {},
  })

  await assert.rejects(
    () => rateLimit({ key: 'user:1', limit: 1, windowSec: 60 }),
    /UPSTASH_REDIS_REST_URL/
  )
})
