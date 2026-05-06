import 'server-only'

import { createHmac } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeAffiliateCode } from './config'

export type ReferralAttributionResult =
  | { applied: true; affiliateId: string; code: string }
  | { applied: false; reason: 'missing_code' | 'invalid_code' | 'not_found' | 'self_referral' | 'already_attributed' | 'update_failed' }

function hashSecret() {
  return process.env.AFFILIATE_HASH_SECRET
    ?? process.env.REAUTH_TOKEN_SECRET
    ?? process.env.UNSUBSCRIBE_TOKEN_SECRET
    ?? process.env.CRON_SECRET
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? 'development-affiliate-hash-secret'
}

export function hashAffiliateSignal(value: string | null | undefined) {
  const normalized = value?.trim()
  if (!normalized) return null

  return createHmac('sha256', hashSecret())
    .update(normalized)
    .digest('hex')
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
