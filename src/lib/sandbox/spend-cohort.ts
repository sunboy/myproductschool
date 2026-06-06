// lib/sandbox/spend-cohort.ts — server-side only.
//
// Labels a CC Analytics user as paid / beta / admin / internal for SPEND ALERT
// attribution. Per Codex review: `profiles.cc_analytics_access=true` is BOTH a
// beta-allowlist marker AND a paid-analytics marker, so it can't be read as
// "paid" on its own. Paid status comes from the subscription; the boolean alone
// means beta/internal. This is labeling only (the alert email), not a gate.

import type { SupabaseClient } from '@supabase/supabase-js'
import { subscriptionEntitlesPro } from '@/lib/billing/entitlements'

/**
 * Returns a short cohort label for a user, for alert context. Never throws.
 *  - 'admin'    : profiles.role = 'admin'
 *  - 'paid'     : an active/trialing analytics subscription
 *  - 'beta'     : cc_analytics_access=true but no paid subscription
 *  - 'unknown'  : none of the above / lookup failed
 */
export async function isBetaOrAdminCohort(
  admin: SupabaseClient,
  userId: string,
): Promise<string> {
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('role, cc_analytics_access, past_due_since')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.role === 'admin') return 'admin'

    const { data: sub } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (sub && subscriptionEntitlesPro(sub, new Date(), profile?.past_due_since)) {
      return 'paid'
    }
    if (profile?.cc_analytics_access === true) return 'beta'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}
