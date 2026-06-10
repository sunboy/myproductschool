import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decidePublicRun, hashIp } from '../../../src/lib/careerops/public/limits'
import type { RateLimitResult } from '../../../src/lib/security/rate-limit'

function allowed(): RateLimitResult {
  return { allowed: true, remaining: 1, resetAt: new Date(Date.now() + 60_000) }
}

function denied(): RateLimitResult {
  return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + 60_000) }
}

test('happy path: no cookie, all limits clear', () => {
  const decision = decidePublicRun({
    hasUsedCookie: false,
    burstResult: allowed(),
    ipResult: allowed(),
    globalResult: allowed(),
  })
  assert.deepEqual(decision, { allowed: true, reason: null })
})

test('used cookie blocks even when limits are clear', () => {
  const decision = decidePublicRun({
    hasUsedCookie: true,
    burstResult: allowed(),
    ipResult: allowed(),
    globalResult: allowed(),
  })
  assert.deepEqual(decision, { allowed: false, reason: 'free_run_used' })
})

test('ip backstop catches cleared cookies', () => {
  const decision = decidePublicRun({
    hasUsedCookie: false,
    burstResult: allowed(),
    ipResult: denied(),
    globalResult: allowed(),
  })
  assert.deepEqual(decision, { allowed: false, reason: 'free_run_used' })
})

test('burst limit wins over everything', () => {
  const decision = decidePublicRun({
    hasUsedCookie: true,
    burstResult: denied(),
    ipResult: denied(),
    globalResult: denied(),
  })
  assert.deepEqual(decision, { allowed: false, reason: 'rate_limited' })
})

test('global cap reports capacity, not free_run_used', () => {
  const decision = decidePublicRun({
    hasUsedCookie: false,
    burstResult: allowed(),
    ipResult: allowed(),
    globalResult: denied(),
  })
  assert.deepEqual(decision, { allowed: false, reason: 'capacity' })
})

test('hashIp is deterministic and does not leak the ip', () => {
  const a = hashIp('203.0.113.7')
  const b = hashIp('203.0.113.7')
  const c = hashIp('203.0.113.8')
  assert.equal(a, b)
  assert.notEqual(a, c)
  assert.match(a, /^[0-9a-f]{64}$/)
  assert.ok(!a.includes('203'))
})
