export const AFFILIATE_COOKIE_NAME = 'ref_code'
export const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
export const AFFILIATE_DEFAULT_COMMISSION_PCT = 20

const AFFILIATE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{3,23}$/

export type StripeRuntimeMode = 'live' | 'test'

export function affiliatesEnabled(env: Record<string, string | undefined> = process.env) {
  return env.NEXT_PUBLIC_ENABLE_AFFILIATES === 'true'
}

export function normalizeAffiliateCode(value: string | null | undefined) {
  const code = value?.trim().toUpperCase()
  if (!code || !AFFILIATE_CODE_PATTERN.test(code)) return null
  return code
}

export function suggestAffiliateCode(input: string | null | undefined, fallback: string) {
  const source = input?.trim() || fallback
  const code = source
    .toUpperCase()
    .replace(/@.*/, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)

  const fallbackCode = fallback
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 8)

  return normalizeAffiliateCode(code)
    ?? normalizeAffiliateCode(`HP-${fallbackCode}`)
    ?? 'HP-REF'
}

export function commissionAmountCents(amountPaid: number, commissionPct: number) {
  if (!Number.isFinite(amountPaid) || !Number.isFinite(commissionPct)) return 0
  if (amountPaid <= 0 || commissionPct <= 0) return 0
  return Math.round(amountPaid * (commissionPct / 100))
}

export function getAffiliateCouponId(
  mode: StripeRuntimeMode,
  env: Record<string, string | undefined> = process.env
) {
  if (mode === 'test') {
    return env.STRIPE_TEST_AFFILIATE_COUPON_ID?.trim()
      || env.STRIPE_AFFILIATE_COUPON_ID?.trim()
      || null
  }

  return env.STRIPE_AFFILIATE_COUPON_ID?.trim() || null
}
