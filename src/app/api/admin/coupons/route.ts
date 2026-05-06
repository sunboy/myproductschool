import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { createStripeClient } from '@/lib/stripe/config'

type CouponDuration = Stripe.CouponCreateParams.Duration

const VALID_DURATIONS: CouponDuration[] = ['once', 'repeating', 'forever']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user : null
}

function toPositiveInt(value: unknown) {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return null
  return parsed
}

function toUnixSeconds(value: unknown) {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(`${value}T23:59:59.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return Math.floor(date.getTime() / 1000)
}

function serializeCoupon(coupon: Stripe.Coupon) {
  return {
    id: coupon.id,
    name: coupon.name,
    percent_off: coupon.percent_off,
    amount_off: coupon.amount_off,
    currency: coupon.currency,
    duration: coupon.duration,
    duration_in_months: coupon.duration_in_months,
    max_redemptions: coupon.max_redemptions,
    times_redeemed: coupon.times_redeemed,
    redeem_by: coupon.redeem_by,
    valid: coupon.valid,
    created: coupon.created,
  }
}

function serializePromotionCode(code: Stripe.PromotionCode) {
  const coupon = typeof code.promotion.coupon === 'string' ? null : code.promotion.coupon
  const couponId = typeof code.promotion.coupon === 'string'
    ? code.promotion.coupon
    : code.promotion.coupon?.id ?? null

  return {
    id: code.id,
    code: code.code,
    coupon_id: couponId ?? '',
    coupon_name: coupon?.name ?? null,
    active: code.active,
    max_redemptions: code.max_redemptions,
    times_redeemed: code.times_redeemed,
    expires_at: code.expires_at,
    created: code.created,
  }
}

export async function GET() {
  const user = await assertAdmin()
  if (!user) return apiError(403, 'forbidden', 'Forbidden')

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return apiError(503, 'stripe_not_configured', config.error ?? 'Stripe not configured', {
      mode: config.mode,
    })
  }

  const [coupons, promotionCodes] = await Promise.all([
    stripe.coupons.list({ limit: 100 }),
    stripe.promotionCodes.list({ limit: 100, expand: ['data.promotion.coupon'] }),
  ])

  return NextResponse.json({
    mode: config.mode,
    coupons: coupons.data.map(serializeCoupon),
    promotionCodes: promotionCodes.data.map(serializePromotionCode),
  })
}

export async function POST(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return apiError(403, 'forbidden', 'Forbidden')

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return apiError(503, 'stripe_not_configured', config.error ?? 'Stripe not configured', {
      mode: config.mode,
    })
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const action = body.action

  if (action === 'create_coupon') {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const duration = VALID_DURATIONS.includes(body.duration as CouponDuration)
      ? body.duration as CouponDuration
      : 'once'
    const discountType = body.discount_type === 'amount' ? 'amount' : 'percent'

    if (!name) return apiError(400, 'name_required', 'Coupon name is required')

    const params: Stripe.CouponCreateParams = {
      name,
      duration,
      metadata: {
        created_by: user.id,
        source: 'hackproduct_admin',
      },
    }

    if (discountType === 'amount') {
      const amountDollars = Number(body.amount_off)
      if (!Number.isFinite(amountDollars) || amountDollars <= 0) {
        return apiError(400, 'amount_required', 'Amount off must be greater than 0')
      }
      params.amount_off = Math.round(amountDollars * 100)
      params.currency = typeof body.currency === 'string' && body.currency.trim()
        ? body.currency.trim().toLowerCase()
        : 'usd'
    } else {
      const percentOff = Number(body.percent_off)
      if (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) {
        return apiError(400, 'percent_required', 'Percent off must be between 1 and 100')
      }
      params.percent_off = percentOff
    }

    if (duration === 'repeating') {
      const months = toPositiveInt(body.duration_in_months)
      if (!months) return apiError(400, 'duration_months_required', 'Repeating coupons need duration in months')
      params.duration_in_months = months
    }

    const maxRedemptions = toPositiveInt(body.max_redemptions)
    if (maxRedemptions) params.max_redemptions = maxRedemptions

    const coupon = await stripe.coupons.create(params)
    return NextResponse.json({ coupon: serializeCoupon(coupon) }, { status: 201 })
  }

  if (action === 'create_promotion_code') {
    const coupon = typeof body.coupon === 'string' ? body.coupon.trim() : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    if (!coupon) return apiError(400, 'coupon_required', 'Coupon is required')
    if (!code) return apiError(400, 'code_required', 'Promotion code is required')

    const params: Stripe.PromotionCodeCreateParams = {
      promotion: { type: 'coupon', coupon },
      code,
      active: true,
      metadata: {
        created_by: user.id,
        source: 'hackproduct_admin',
      },
    }

    const maxRedemptions = toPositiveInt(body.max_redemptions)
    if (maxRedemptions) params.max_redemptions = maxRedemptions

    const expiresAt = toUnixSeconds(body.expires_at)
    if (expiresAt) params.expires_at = expiresAt

    const promotionCode = await stripe.promotionCodes.create(params)
    return NextResponse.json({ promotionCode: serializePromotionCode(promotionCode) }, { status: 201 })
  }

  return apiError(400, 'unsupported_action', 'Unsupported action')
}
