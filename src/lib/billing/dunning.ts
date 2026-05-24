export type DunningState = 'current' | 'past_due' | 'grace' | 'suspended' | 'cancelled'

export interface DunningStatus {
  state: DunningState
  pastDueSince: string | null
  paymentFailures: number
  gracePeriodEndsAt: string | null
  shouldShowBanner: boolean
  bannerMessage: string | null
}

const GRACE_DAYS = 7

export function computeDunningStatus(profile: {
  subscription_status: string | null
  past_due_since: string | null
  payment_failures: number | null
}): DunningStatus {
  const { subscription_status, past_due_since, payment_failures } = profile
  const failures = payment_failures || 0

  if (!subscription_status || subscription_status === 'active' || subscription_status === 'trialing') {
    return {
      state: 'current',
      pastDueSince: null,
      paymentFailures: 0,
      gracePeriodEndsAt: null,
      shouldShowBanner: false,
      bannerMessage: null,
    }
  }

  if (subscription_status === 'past_due' && past_due_since) {
    const since = new Date(past_due_since)
    const graceEnd = new Date(since.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000)
    const isInGrace = new Date() < graceEnd
    const daysLeft = Math.ceil((graceEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    return {
      state: isInGrace ? 'grace' : 'suspended',
      pastDueSince: past_due_since,
      paymentFailures: failures,
      gracePeriodEndsAt: graceEnd.toISOString(),
      shouldShowBanner: true,
      bannerMessage: isInGrace
        ? `Your payment failed. Update your payment method within ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to keep Pro access.`
        : 'Your Pro access has been suspended due to a failed payment. Update your payment method to restore access.',
    }
  }

  if (subscription_status === 'unpaid' || subscription_status === 'cancelled') {
    return {
      state: subscription_status === 'unpaid' ? 'suspended' : 'cancelled',
      pastDueSince: past_due_since,
      paymentFailures: failures,
      gracePeriodEndsAt: null,
      shouldShowBanner: true,
      bannerMessage: 'Your subscription has ended. Upgrade to restore Pro access.',
    }
  }

  return {
    state: 'current',
    pastDueSince: null,
    paymentFailures: 0,
    gracePeriodEndsAt: null,
    shouldShowBanner: false,
    bannerMessage: null,
  }
}
