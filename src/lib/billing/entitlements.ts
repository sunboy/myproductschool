import type { SupabaseClient } from '@supabase/supabase-js'
import { GRACE_DAYS } from './dunning'

export type EffectiveBillingPlan = 'free' | 'pro'

export interface ProfileEntitlementRow {
  plan?: string | null
  role?: string | null
  pro_access?: boolean | null
  subscription_status?: string | null
  payment_failures?: number | null
  // past_due_since lives on `profiles` (migration 20260523140000), NOT on
  // `subscriptions`. It is the authoritative grace-window anchor.
  past_due_since?: string | null
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

export function isWithinGracePeriod(
  pastDueSince: string | null | undefined,
  graceDays = GRACE_DAYS,
  now = new Date()
): boolean {
  if (!pastDueSince) return false
  const since = new Date(pastDueSince)
  const graceEnd = new Date(since.getTime() + graceDays * 24 * 60 * 60 * 1000)
  return now < graceEnd
}

export function subscriptionEntitlesPro(
  subscription: SubscriptionEntitlementRow | null | undefined,
  now = new Date(),
  // past_due_since lives on the `profiles` row, not `subscriptions`. Callers that
  // have the profile (effectivePlanFromRows) pass it here. When a test/caller sets
  // it directly on the subscription row that value is used as a fallback.
  pastDueSinceOverride?: string | null
) {
  if (!subscription || subscription.plan !== 'pro') return false

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    if (subscription.status === 'trialing' && isPastIso(subscription.current_period_end, now)) return false
    if (subscription.cancel_at_period_end && isPastIso(subscription.current_period_end, now)) return false
    return true
  }

  if (subscription.status === 'past_due') {
    const pastDueSince = pastDueSinceOverride ?? subscription.past_due_since
    return isWithinGracePeriod(pastDueSince, GRACE_DAYS, now)
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

  // Hard revoke override for genuine suspension states only. This catches paths
  // where access must be cut immediately and the subscriptions row may lag:
  //   - 'disputed'  → charge.dispute.funds_withdrawn (fraud signal, revoke now)
  //   - 'unpaid'    → grace window expired without payment
  //   - 'cancelled' → subscription fully terminated
  //
  // NOTE: 'past_due' is intentionally NOT in this list. A past_due user is in the
  // 7-day billing grace window and KEEPS Pro access regardless of how many payment
  // retries have failed. Suspension is driven by grace expiry (the webhook leaves
  // status at 'past_due' through the window; subscriptionEntitlesPro returns false
  // once isWithinGracePeriod(past_due_since) lapses), NOT by failure count. This
  // keeps entitlements, computeDunningStatus (the UI banner), and the webhook in
  // agreement. See docs/notes/stripe-paywall-audit.md.
  if (
    profile?.pro_access === false &&
    profile?.subscription_status &&
    ['unpaid', 'cancelled', 'canceled', 'disputed'].includes(profile.subscription_status)
  ) {
    return 'free'
  }

  // past_due_since is sourced from the profile row (authoritative location) and
  // injected into the subscription grace check.
  if (subscription) {
    return subscriptionEntitlesPro(subscription, now, profile?.past_due_since) ? 'pro' : 'free'
  }
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
      .select('plan, role, pro_access, subscription_status, payment_failures, past_due_since')
      .eq('id', userId)
      .maybeSingle(),
    admin
      .from('subscriptions')
      .select('plan, status, current_period_end, cancel_at_period_end')
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
