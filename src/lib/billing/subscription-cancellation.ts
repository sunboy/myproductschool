export type SubscriptionCancellationInput = {
  status?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean | null
  cancel_at?: string | null
}

export type BillingSubscriptionState = SubscriptionCancellationInput & {
  plan?: string | null
  billing_interval?: 'month' | 'year' | null
  canceled_at?: string | null
}

export type BillingSubscriptionAction = 'cancel' | 'reactivate' | 'change-plan'

export type StripeSubscriptionSnapshot = {
  status?: string | null
  cancel_at_period_end?: boolean | null
  cancel_at?: number | null
  canceled_at?: number | null
  current_period_end?: number | null
  items?: {
    data?: Array<{
      current_period_end?: number | null
      price?: { recurring?: { interval?: string | null } | null } | null
    }>
  } | null
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

function unixSecondsToIso(value: number | null | undefined) {
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined

  const date = new Date(value * 1000)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

/**
 * Stripe is authoritative for the action that just succeeded, while the local
 * subscription row catches up through its webhook. Convert only fields present
 * in the Stripe response and preserve the rest of the app's local snapshot.
 */
export function mergeStripeSubscriptionSnapshot(
  current: BillingSubscriptionState | null,
  stripe: StripeSubscriptionSnapshot | null | undefined,
): BillingSubscriptionState | null {
  if (!stripe) return current

  const next: BillingSubscriptionState = { ...(current ?? {}) }
  const firstItem = stripe.items?.data?.[0]

  if (typeof stripe.status === 'string' || stripe.status === null) {
    next.status = stripe.status
  }
  if (typeof stripe.cancel_at_period_end === 'boolean' || stripe.cancel_at_period_end === null) {
    next.cancel_at_period_end = stripe.cancel_at_period_end
  }

  const cancelAt = unixSecondsToIso(stripe.cancel_at)
  if (cancelAt !== undefined) next.cancel_at = cancelAt

  const canceledAt = unixSecondsToIso(stripe.canceled_at)
  if (canceledAt !== undefined) next.canceled_at = canceledAt

  const periodEnd = unixSecondsToIso(stripe.current_period_end ?? firstItem?.current_period_end)
  if (periodEnd !== undefined) next.current_period_end = periodEnd

  const interval = firstItem?.price?.recurring?.interval
  if (interval === 'month' || interval === 'year') next.billing_interval = interval

  return next
}

/** Returns true only once the webhook-backed profile reflects the requested action. */
export function subscriptionReflectsBillingAction(
  subscription: BillingSubscriptionState | null | undefined,
  action: BillingSubscriptionAction,
  requestedPlan?: unknown,
  now = Date.now(),
) {
  if (!subscription) return false

  const cancellationCleared = subscription.cancel_at_period_end === false && subscription.cancel_at == null

  if (action === 'cancel') {
    return scheduledCancellationState(subscription, now).scheduled
  }

  if (action === 'reactivate') return cancellationCleared

  const expectedInterval = requestedPlan === 'annual'
    ? 'year'
    : requestedPlan === 'monthly'
      ? 'month'
      : null

  return expectedInterval !== null
    && subscription.billing_interval === expectedInterval
    && cancellationCleared
}
