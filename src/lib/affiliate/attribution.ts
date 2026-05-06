import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeAffiliateCode } from './config'

export type ReferralAttributionResult =
  | { applied: true; affiliateId: string; code: string }
  | {
      applied: false
      reason:
        | 'missing_code'
        | 'invalid_code'
        | 'not_found'
        | 'disabled'
        | 'self_referral'
        | 'already_attributed'
        | 'update_failed'
    }

export async function applyReferralAttribution(
  admin: SupabaseClient,
  userId: string,
  rawCode: string | null | undefined
): Promise<ReferralAttributionResult> {
  if (rawCode == null) return { applied: false, reason: 'missing_code' }

  const code = normalizeAffiliateCode(rawCode)
  if (!code) return { applied: false, reason: 'invalid_code' }

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, user_id, code, status')
    .eq('code', code)
    .maybeSingle()

  if (!affiliate) return { applied: false, reason: 'not_found' }
  if (affiliate.status === 'disabled') return { applied: false, reason: 'disabled' }
  if (affiliate.user_id === userId) return { applied: false, reason: 'self_referral' }

  const { data: profile } = await admin
    .from('profiles')
    .select('affiliate_id')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.affiliate_id) return { applied: false, reason: 'already_attributed' }

  const { error } = await admin
    .from('profiles')
    .update({
      affiliate_id: affiliate.id,
      referral_source: code,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .is('affiliate_id', null)

  if (error) return { applied: false, reason: 'update_failed' }

  return { applied: true, affiliateId: affiliate.id as string, code }
}
