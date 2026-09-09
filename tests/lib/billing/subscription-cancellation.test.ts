import { describe, expect, it } from 'vitest'
import {
  mergeStripeSubscriptionSnapshot,
  scheduledCancellationState,
  subscriptionReflectsBillingAction,
} from '@/lib/billing/subscription-cancellation'

const NOW = Date.parse('2026-09-06T12:00:00.000Z')
const PERIOD_END = '2026-09-13T12:00:00.000Z'

describe('scheduledCancellationState', () => {
  it.each(['active', 'trialing'])('recognizes future cancel_at for a %s subscription', (status) => {
    expect(scheduledCancellationState({
      status,
      current_period_end: PERIOD_END,
      cancel_at_period_end: false,
      cancel_at: PERIOD_END,
    }, NOW)).toEqual({ scheduled: true, endsAt: PERIOD_END })
  })

  it('uses current_period_end for cancel_at_period_end cancellations', () => {
    expect(scheduledCancellationState({
      status: 'active',
      current_period_end: PERIOD_END,
      cancel_at_period_end: true,
      cancel_at: null,
    }, NOW)).toEqual({ scheduled: true, endsAt: PERIOD_END })
  })

  it('does not present a completed cancellation as scheduled', () => {
    expect(scheduledCancellationState({
      status: 'canceled',
      current_period_end: PERIOD_END,
      cancel_at_period_end: false,
      cancel_at: PERIOD_END,
    }, NOW)).toEqual({ scheduled: false, endsAt: null })
  })

  it('does not present an expired cancel_at timestamp as scheduled', () => {
    expect(scheduledCancellationState({
      status: 'active',
      cancel_at_period_end: false,
      cancel_at: '2026-09-05T12:00:00.000Z',
    }, NOW)).toEqual({ scheduled: false, endsAt: null })
  })
})

describe('billing action reconciliation', () => {
  it('uses the successful Stripe response while preserving app-owned fields', () => {
    expect(mergeStripeSubscriptionSnapshot({
      plan: 'pro',
      status: 'trialing',
      billing_interval: 'month',
      cancel_at_period_end: false,
      cancel_at: PERIOD_END,
    }, {
      status: 'trialing',
      cancel_at_period_end: false,
      cancel_at: null,
      canceled_at: 1_788_730_096,
      items: {
        data: [{
          current_period_end: 1_789_334_894,
          price: { recurring: { interval: 'year' } },
        }],
      },
    })).toEqual({
      plan: 'pro',
      status: 'trialing',
      billing_interval: 'year',
      cancel_at_period_end: false,
      cancel_at: null,
      canceled_at: '2026-09-06T21:28:16.000Z',
      current_period_end: '2026-09-13T21:28:14.000Z',
    })
  })

  it('does not accept a stale explicit cancellation after reactivation', () => {
    expect(subscriptionReflectsBillingAction({
      status: 'trialing',
      cancel_at_period_end: false,
      cancel_at: PERIOD_END,
    }, 'reactivate', undefined, NOW)).toBe(false)

    expect(subscriptionReflectsBillingAction({
      status: 'trialing',
      cancel_at_period_end: false,
      cancel_at: null,
    }, 'reactivate', undefined, NOW)).toBe(true)
  })

  it('waits for both the target interval and cleared cancellation on a plan change', () => {
    expect(subscriptionReflectsBillingAction({
      status: 'active',
      billing_interval: 'year',
      cancel_at_period_end: false,
      cancel_at: PERIOD_END,
    }, 'change-plan', 'annual', NOW)).toBe(false)

    expect(subscriptionReflectsBillingAction({
      status: 'active',
      billing_interval: 'year',
      cancel_at_period_end: false,
      cancel_at: null,
    }, 'change-plan', 'annual', NOW)).toBe(true)
  })

  it('accepts either supported scheduled-cancellation representation after cancel', () => {
    expect(subscriptionReflectsBillingAction({
      status: 'active',
      current_period_end: PERIOD_END,
      cancel_at_period_end: true,
      cancel_at: null,
    }, 'cancel', undefined, NOW)).toBe(true)

    expect(subscriptionReflectsBillingAction({
      status: 'trialing',
      cancel_at_period_end: false,
      cancel_at: PERIOD_END,
    }, 'cancel', undefined, NOW)).toBe(true)
  })
})
