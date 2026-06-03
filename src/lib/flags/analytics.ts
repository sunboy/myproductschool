// Claude Code Analytics — feature flag + access entitlement.
//
// Single source of truth for "is the analytics feature on?" and "can THIS user
// use it?". The feature ships dark: nothing about it is visible or sellable until
// the global flag is on. A per-user allowlist (profiles.cc_analytics_access) lets
// us grant beta access while the global flag is still off.
//
// Access model (Pro super-set): an analytics subscriber also resolves to `pro`
// for every existing Pro gate (the webhook sets profiles.plan='pro'); this module
// only answers the EXTRA "has analytics" question.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  subscriptionEntitlesPlan,
  type ProfileEntitlementRow,
  type SubscriptionEntitlementRow,
} from '@/lib/billing/entitlements'
import { isAnalyticsPlanId } from '@/lib/billing/plans'

/** Global master switch. Usable on client and server (NEXT_PUBLIC_*). */
export function isAnalyticsFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CC_ANALYTICS_ENABLED === 'true'
}

interface AnalyticsAccessInputs {
  /** Result of isAnalyticsFeatureEnabled() (passed in so callers control timing). */
  flagEnabled: boolean
  profile: (ProfileEntitlementRow & { cc_analytics_access?: boolean | null; role?: string | null }) | null
  subscription: SubscriptionEntitlementRow | null
}

/**
 * Does this user have access to the Claude Code Analytics feature?
 *
 * True when EITHER:
 *  - per-user allowlist: profile.cc_analytics_access === true (beta — works even
 *    when the global flag is OFF; also the marker the webhook sets for paid subs), OR
 *  - global flag ON and the user holds an active/trialing/in-grace analytics
 *    subscription, OR an admin while the flag is on.
 */
export function hasAnalyticsAccess(
  { flagEnabled, profile, subscription }: AnalyticsAccessInputs,
  now = new Date()
): boolean {
  // Per-user allowlist / paid marker. Authoritative and flag-independent so beta
  // users work pre-launch and the webhook can grant/revoke with one boolean.
  if (profile?.cc_analytics_access === true) return true

  if (!flagEnabled) return false

  // Admins get access once the feature is globally on (mirrors Pro admin path).
  if (profile?.role === 'admin') return true

  // Paid analytics subscription (status + grace), independent of the boolean above
  // in case the marker lags a webhook.
  return subscriptionEntitlesPlan(subscription, isAnalyticsPlanId, now, profile?.past_due_since)
}

export interface AnalyticsAccess {
  enabled: boolean
  hasAccess: boolean
}

/**
 * Server helper: one query, returns whether the feature is enabled and whether
 * this user may use it. Mirrors getEffectiveUserPlan's shape. Use the service-role
 * admin client (RLS only grants users SELECT on their own profile/subscription).
 */
export async function getAnalyticsAccess(
  admin: SupabaseClient,
  userId: string,
  now = new Date()
): Promise<AnalyticsAccess> {
  const enabled = isAnalyticsFeatureEnabled()

  const [profileResult, subscriptionResult] = await Promise.all([
    admin
      .from('profiles')
      .select('plan, role, cc_analytics_access, subscription_status, past_due_since')
      .eq('id', userId)
      .maybeSingle(),
    admin
      .from('subscriptions')
      .select('plan, status, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const profile = (profileResult.data as AnalyticsAccessInputs['profile']) ?? null
  const subscription = subscriptionResult.error
    ? null
    : ((subscriptionResult.data as SubscriptionEntitlementRow | null) ?? null)

  return {
    enabled,
    hasAccess: hasAnalyticsAccess({ flagEnabled: enabled, profile, subscription }, now),
  }
}
