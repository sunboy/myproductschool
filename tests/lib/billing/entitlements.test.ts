import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  effectivePlanFromRows,
  subscriptionEntitlesPro,
} from '../../../src/lib/billing/entitlements'

const NOW = new Date('2026-05-06T12:00:00.000Z')
const FUTURE = '2026-05-13T12:00:00.000Z'
const PAST = '2026-05-05T12:00:00.000Z'

test('active and trialing pro subscriptions are entitled before expiry', () => {
  assert.equal(subscriptionEntitlesPro({ plan: 'pro', status: 'active', current_period_end: FUTURE }, NOW), true)
  assert.equal(subscriptionEntitlesPro({ plan: 'pro', status: 'trialing', current_period_end: FUTURE }, NOW), true)
})

test('past-due pro subscriptions keep access during billing grace', () => {
  assert.equal(subscriptionEntitlesPro({ plan: 'pro', status: 'past_due', current_period_end: PAST }, NOW), true)
})

test('expired trials, canceled subscriptions, and stale cancel-at-period-end rows are not entitled', () => {
  assert.equal(subscriptionEntitlesPro({ plan: 'pro', status: 'trialing', current_period_end: PAST }, NOW), false)
  assert.equal(subscriptionEntitlesPro({ plan: 'pro', status: 'canceled', current_period_end: FUTURE }, NOW), false)
  assert.equal(subscriptionEntitlesPro({
    plan: 'pro',
    status: 'active',
    current_period_end: PAST,
    cancel_at_period_end: true,
  }, NOW), false)
})

test('effective plan trusts subscription status over a stale profile plan', () => {
  assert.equal(effectivePlanFromRows(
    { plan: 'pro', role: null },
    { plan: 'pro', status: 'canceled', current_period_end: FUTURE },
    NOW
  ), 'free')
})

test('effective plan keeps the legacy profile fallback only when no subscription row exists', () => {
  assert.equal(effectivePlanFromRows({ plan: 'pro', role: null }, null, NOW), 'pro')
})

test('effective plan always treats admins as pro', () => {
  assert.equal(effectivePlanFromRows(
    { plan: 'free', role: 'admin' },
    { plan: 'free', status: 'canceled', current_period_end: PAST },
    NOW
  ), 'pro')
})
