import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  effectivePlanFromRows,
  subscriptionEntitlesPro,
} from '../../../src/lib/billing/entitlements'

const NOW = new Date('2026-05-06T12:00:00.000Z')
const FUTURE = '2026-05-13T12:00:00.000Z'
const PAST = '2026-05-05T12:00:00.000Z'
// past_due_since values relative to NOW (2026-05-06), 7-day grace window
const PAST_DUE_IN_GRACE = '2026-05-04T12:00:00.000Z' // 2 days ago → within grace
const PAST_DUE_PAST_GRACE = '2026-04-27T12:00:00.000Z' // 9 days ago → grace expired

test('active and trialing pro subscriptions are entitled before expiry', () => {
  assert.equal(subscriptionEntitlesPro({ plan: 'pro', status: 'active', current_period_end: FUTURE }, NOW), true)
  assert.equal(subscriptionEntitlesPro({ plan: 'pro', status: 'trialing', current_period_end: FUTURE }, NOW), true)
})

test('active and unexpired trialing Analytics subscriptions include Pro entitlement', () => {
  assert.equal(subscriptionEntitlesPro(
    { plan: 'analytics_monthly', status: 'active', current_period_end: FUTURE },
    NOW,
  ), true)
  assert.equal(subscriptionEntitlesPro(
    { plan: 'analytics_annual', status: 'trialing', current_period_end: FUTURE },
    NOW,
  ), true)

  assert.equal(effectivePlanFromRows(
    { plan: 'pro', pro_access: true, subscription_status: 'active' },
    { plan: 'analytics_monthly', status: 'active', current_period_end: FUTURE },
    NOW,
  ), 'pro')
})

test('Analytics subscriptions retain the same cancellation and expiry guards as Pro', () => {
  assert.equal(subscriptionEntitlesPro(
    { plan: 'analytics_monthly', status: 'canceled', current_period_end: FUTURE },
    NOW,
  ), false)
  assert.equal(subscriptionEntitlesPro(
    { plan: 'analytics_annual', status: 'trialing', current_period_end: PAST },
    NOW,
  ), false)
  assert.equal(subscriptionEntitlesPro({
    plan: 'analytics_monthly',
    status: 'active',
    current_period_end: PAST,
    cancel_at_period_end: true,
  }, NOW), false)
  assert.equal(subscriptionEntitlesPro(
    { plan: 'analytics_enterprise', status: 'active', current_period_end: FUTURE },
    NOW,
  ), false)
})

test('Analytics subscriptions use the same past-due grace window as Pro', () => {
  assert.equal(subscriptionEntitlesPro(
    { plan: 'analytics_monthly', status: 'past_due', past_due_since: PAST_DUE_IN_GRACE },
    NOW,
  ), true)
  assert.equal(subscriptionEntitlesPro(
    { plan: 'analytics_annual', status: 'past_due', past_due_since: PAST_DUE_PAST_GRACE },
    NOW,
  ), false)
})

test('past-due pro subscriptions keep access during billing grace', () => {
  // Grace keys off past_due_since (not current_period_end). Within the 7-day window → entitled.
  assert.equal(subscriptionEntitlesPro(
    { plan: 'pro', status: 'past_due', past_due_since: PAST_DUE_IN_GRACE }, NOW), true)
})

test('past-due pro subscriptions lose access once grace expires', () => {
  assert.equal(subscriptionEntitlesPro(
    { plan: 'pro', status: 'past_due', past_due_since: PAST_DUE_PAST_GRACE }, NOW), false)
  // No past_due_since recorded → cannot be in grace → not entitled.
  assert.equal(subscriptionEntitlesPro(
    { plan: 'pro', status: 'past_due', past_due_since: null }, NOW), false)
})

test('grace anchor (past_due_since) is read from the profile row, not the subscription', () => {
  // Real-world shape: past_due_since lives ONLY on profiles (migration 20260523140000).
  // The subscription row has status=past_due but NO past_due_since column.
  // effectivePlanFromRows must source the anchor from the profile and still grant Pro in grace.
  assert.equal(effectivePlanFromRows(
    { plan: 'pro', role: null, pro_access: true, subscription_status: 'past_due', payment_failures: 1, past_due_since: PAST_DUE_IN_GRACE },
    { plan: 'pro', status: 'past_due' }, // no past_due_since here — mirrors the DB
    NOW
  ), 'pro')
  // Same shape, but grace expired on the profile anchor → revoke.
  assert.equal(effectivePlanFromRows(
    { plan: 'pro', role: null, pro_access: true, subscription_status: 'past_due', payment_failures: 1, past_due_since: PAST_DUE_PAST_GRACE },
    { plan: 'pro', status: 'past_due' },
    NOW
  ), 'free')
})

test('dunning policy: grace window protects regardless of payment_failures count', () => {
  // Policy decision (2026-05-27): the 7-day grace window wins over the failure
  // count. A user with 3+ failed retries still keeps Pro while inside grace.
  // effectivePlanFromRows must NOT revoke on failure count alone.
  assert.equal(effectivePlanFromRows(
    { plan: 'pro', role: null, pro_access: true, subscription_status: 'past_due', payment_failures: 3 },
    { plan: 'pro', status: 'past_due', past_due_since: PAST_DUE_IN_GRACE },
    NOW
  ), 'pro')
  // But a genuine suspension state (unpaid / disputed) revokes immediately.
  assert.equal(effectivePlanFromRows(
    { plan: 'pro', role: null, pro_access: false, subscription_status: 'unpaid', payment_failures: 3 },
    { plan: 'pro', status: 'unpaid', past_due_since: PAST_DUE_IN_GRACE },
    NOW
  ), 'free')
  assert.equal(effectivePlanFromRows(
    { plan: 'pro', role: null, pro_access: false, subscription_status: 'disputed', payment_failures: 0 },
    { plan: 'pro', status: 'past_due', past_due_since: PAST_DUE_IN_GRACE },
    NOW
  ), 'free')
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
