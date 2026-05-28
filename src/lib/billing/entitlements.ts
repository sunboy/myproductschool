import type { SupabaseClient } from '@supabase/supabase-js'

export type EffectiveBillingPlan = 'free' | 'pro'

export interface ProfileEntitlementRow {
  plan?: string | null
  role?: string | null
  pro_access?: boolean | null
  subscription_status?: string | null
  payment_failures?: number | null
}

export interface SubscriptionEntitlementRow {
  plan?: string | null
  status?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean | null
  past_due_since?: string | null
}

export interface EffectiveUserPlan {
  plan: EffectiveBillingPlan
  isAdmin: boolean
  profile: ProfileEntitlementRow | null
  subscription: SubscriptionEntitlementRow | null
}

function isPastIso(value: string | null | undefined, now: Date) {
  if (!value) return false
  const time = new Date(value).getTime()
  return Number.isFinite(time) && time <= now.getTime()
}

export function isWithinGracePeriod(pastDueSince: string | null | undefined, graceDays = 7): boolean {
  if (!pastDueSince) return false
  const since = new Date(pastDueSince)
  const graceEnd = new Date(since.getTime() + graceDays * 24 * 60 * 60 * 1000)
  return new Date() < graceEnd
}

export function subscriptionEntitlesPro(
  subscription: SubscriptionEntitlementRow | null | undefined,
  now = new Date()
) {
  if (!subscription || subscription.plan !== 'pro') return false

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    if (subscription.status === 'trialing' && isPastIso(subscription.current_period_end, now)) return false
    if (subscription.cancel_at_period_end && isPastIso(subscription.current_period_end, now)) return false
    return true
  }

  if (subscription.status === 'past_due') {
    return isWithinGracePeriod(subscription.past_due_since)
  }

  // cancelled, unpaid, paused, incomplete_expired → not entitled
  return false
}

export function effectivePlanFromRows(
  profile: ProfileEntitlementRow | null | undefined,
  subscription: SubscriptionEntitlementRow | null | undefined,
  now = new Date()
): EffectiveBillingPlan {
  if (profile?.role === 'admin') return 'pro'

  // Dunning hard override: if profiles.pro_access === false AND status is a
  // failure state AND we've hit the 3-failure threshold, revoke regardless of
  // what the subscriptions row reports. This makes the dunning revoke path in
  // invoice.payment_failed (webhook) authoritative.
  if (
    profile?.pro_access === false &&
    profile?.subscription_status &&
    ['past_due', 'unpaid', 'cancelled', 'canceled'].includes(profile.subscription_status) &&
    (profile?.payment_failures ?? 0) >= 3
  ) {
    return 'free'
  }

  if (subscription) return subscriptionEntitlesPro(subscription, now) ? 'pro' : 'free'
  return profile?.plan === 'pro' ? 'pro' : 'free'
}

export async function getEffectiveUserPlan(
  admin: SupabaseClient,
  userId: string,
  now = new Date()
): Promise<EffectiveUserPlan> {
  const [profileResult, subscriptionResult] = await Promise.all([
    admin
      .from('profiles')
      .select('plan, role, pro_access, subscription_status, payment_failures')
      .eq('id', userId)
      .maybeSingle(),
    admin
      .from('subscriptions')
      .select('plan, status, current_period_end, cancel_at_period_end, past_due_since')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const profile = (profileResult.data as ProfileEntitlementRow | null) ?? null
  const subscription = subscriptionResult.error
    ? null
    : ((subscriptionResult.data as SubscriptionEntitlementRow | null) ?? null)

  return {
    plan: effectivePlanFromRows(profile, subscription, now),
    isAdmin: profile?.role === 'admin',
    profile,
    subscription,
  }
}
