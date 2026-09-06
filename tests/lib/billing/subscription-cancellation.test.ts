import { describe, expect, it } from 'vitest'
import { scheduledCancellationState } from '@/lib/billing/subscription-cancellation'

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
