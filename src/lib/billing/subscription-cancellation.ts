export type SubscriptionCancellationInput = {
  status?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean | null
  cancel_at?: string | null
}

export type ScheduledCancellationState = {
  scheduled: boolean
  endsAt: string | null
}

const SCHEDULABLE_STATUSES = new Set(['active', 'trialing', 'past_due'])

function isFutureDate(value: string | null | undefined, now: number) {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp > now
}

/**
 * Stripe can represent a future cancellation either with
 * `cancel_at_period_end` or an explicit `cancel_at` timestamp.
 */
export function scheduledCancellationState(
  subscription: SubscriptionCancellationInput | null | undefined,
  now = Date.now(),
): ScheduledCancellationState {
  if (!subscription?.status || !SCHEDULABLE_STATUSES.has(subscription.status)) {
    return { scheduled: false, endsAt: null }
  }

  if (isFutureDate(subscription.cancel_at, now)) {
    return { scheduled: true, endsAt: subscription.cancel_at ?? null }
  }

  if (subscription.cancel_at_period_end) {
    return { scheduled: true, endsAt: subscription.current_period_end ?? null }
  }

  return { scheduled: false, endsAt: null }
}
