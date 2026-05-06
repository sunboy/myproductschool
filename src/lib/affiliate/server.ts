import 'server-only'

import { createHmac } from 'node:crypto'
export { applyReferralAttribution, type ReferralAttributionResult } from './attribution'

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
