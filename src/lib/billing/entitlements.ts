import type { SupabaseClient } from '@supabase/supabase-js'

export type EffectiveBillingPlan = 'free' | 'pro'

export interface ProfileEntitlementRow {
  plan?: string | null
  role?: string | null
}

export interface SubscriptionEntitlementRow {
  plan?: string | null
  status?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean | null
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

export function subscriptionEntitlesPro(
  subscription: SubscriptionEntitlementRow | null | undefined,
  now = new Date()
) {
  if (!subscription || subscription.plan !== 'pro') return false
  if (subscription.status !== 'active' && subscription.status !== 'trialing') return false
  if (subscription.status === 'trialing' && isPastIso(subscription.current_period_end, now)) return false
  if (subscription.cancel_at_period_end && isPastIso(subscription.current_period_end, now)) return false
  return true
}

export function effectivePlanFromRows(
  profile: ProfileEntitlementRow | null | undefined,
  subscription: SubscriptionEntitlementRow | null | undefined,
  now = new Date()
): EffectiveBillingPlan {
  if (profile?.role === 'admin') return 'pro'
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
      .select('plan, role')
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
