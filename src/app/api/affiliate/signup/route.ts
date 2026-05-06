import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { z, ZodError } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createStripeClient } from '@/lib/stripe/config'
import {
  AFFILIATE_DEFAULT_COMMISSION_PCT,
  getAffiliateCouponId,
  normalizeAffiliateCode,
  suggestAffiliateCode,
} from '@/lib/affiliate/config'

const SignupSchema = z.object({
  code: z.string().trim().max(24).optional(),
})

type AffiliateRow = {
  id: string
  user_id: string
  code: string
  stripe_promo_code_id: string | null
  stripe_connect_account_id: string | null
  commission_pct: number | string
  status: 'pending' | 'active' | 'disabled'
  created_at: string
}

function affiliatesEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_AFFILIATES === 'true'
}

function appUrl(request: NextRequest, path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin).toString()
}

function stripeUnavailable(detail: string | null, mode: string) {
  return NextResponse.json(
    { error: 'Stripe not configured', detail, mode },
    { status: 503 }
  )
}

function stripeAffiliateSetupError(error: unknown) {
  const stripeError = error as { code?: string; message?: string }
  const message = stripeError.message ?? ''

  if (/signed up for Connect/i.test(message)) {
    return NextResponse.json(
      { error: 'Affiliate payouts are not configured yet.' },
      { status: 503 }
    )
  }

  return NextResponse.json(
    {
      error: stripeError.code === 'resource_already_exists'
        ? 'Affiliate code is already taken.'
        : 'Could not create Stripe affiliate resources.',
    },
    { status: stripeError.code === 'resource_already_exists' ? 409 : 502 }
  )
}

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

async function currentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return error ? null : user
}

function affiliatePayload(request: NextRequest, affiliate: AffiliateRow | null, stats?: {
  clickCount: number
  pendingCents: number
  paidCents: number
}) {
  return {
    affiliate: affiliate
      ? {
          id: affiliate.id,
          code: affiliate.code,
          status: affiliate.status,
          commissionPct: Number(affiliate.commission_pct),
          hasStripeAccount: Boolean(affiliate.stripe_connect_account_id),
          shareUrl: appUrl(request, `/r/${affiliate.code}`),
          createdAt: affiliate.created_at,
        }
      : null,
    stats: stats ?? {
      clickCount: 0,
      pendingCents: 0,
      paidCents: 0,
    },
  }
}

async function getAffiliateDashboard(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, user_id, code, stripe_promo_code_id, stripe_connect_account_id, commission_pct, status, created_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (!affiliate) return { affiliate: null, stats: undefined }

  const [{ count: clickCount }, { data: commissions }] = await Promise.all([
    admin
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id),
    admin
      .from('affiliate_commissions')
      .select('amount_cents, status')
      .eq('affiliate_id', affiliate.id),
  ])

  const stats = (commissions ?? []).reduce(
    (acc, row) => {
      const amount = Number(row.amount_cents) || 0
      if (row.status === 'paid') acc.paidCents += amount
      if (row.status === 'pending') acc.pendingCents += amount
      return acc
    },
    { clickCount: clickCount ?? 0, pendingCents: 0, paidCents: 0 }
  )

  return { affiliate: affiliate as AffiliateRow, stats }
}

async function createConnectAccount(stripe: Stripe, user: { id: string; email?: string | null }) {
  return stripe.accounts.create({
    email: user.email ?? undefined,
    controller: {
      fees: { payer: 'application' },
      losses: { payments: 'application' },
      requirement_collection: 'stripe',
      stripe_dashboard: { type: 'express' },
    },
    capabilities: {
      transfers: { requested: true },
    },
    metadata: {
      user_id: user.id,
      source: 'hackproduct_affiliate',
    },
  })
}

async function createOnboardingUrl(stripe: Stripe, request: NextRequest, accountId: string) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: appUrl(request, '/affiliate?connect=refresh'),
    return_url: appUrl(request, '/api/affiliate/connect-callback'),
    collection_options: { fields: 'eventually_due' },
  })

  return link.url
}

async function ensureUniqueSuggestedCode(
  admin: ReturnType<typeof createAdminClient>,
  baseCode: string
) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = attempt === 0
      ? baseCode
      : `${baseCode.slice(0, Math.max(4, 20 - attempt.toString().length))}-${attempt}`

    const { data } = await admin
      .from('affiliates')
      .select('id')
      .eq('code', code)
      .maybeSingle()

    if (!data) return code
  }

  return `${baseCode.slice(0, 15)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export async function GET(request: NextRequest) {
  if (!affiliatesEnabled()) {
    return NextResponse.json({ error: 'Affiliate program is not available.' }, { status: 404 })
  }

  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { affiliate, stats } = await getAffiliateDashboard(admin, user.id)

  return NextResponse.json(affiliatePayload(request, affiliate, stats))
}

export async function POST(request: NextRequest) {
  if (!affiliatesEnabled()) {
    return NextResponse.json({ error: 'Affiliate program is not available.' }, { status: 404 })
  }

  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof SignupSchema>
  try {
    body = SignupSchema.parse(await request.json().catch(() => ({})))
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request body', issues: validationIssues(error) }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { stripe, config } = createStripeClient()
  if (!stripe) return stripeUnavailable(config.error, config.mode)

  const admin = createAdminClient()
  const existing = await getAffiliateDashboard(admin, user.id)

  if (existing.affiliate?.status === 'disabled') {
    return NextResponse.json({ error: 'Affiliate account disabled' }, { status: 403 })
  }

  if (existing.affiliate) {
    let accountId = existing.affiliate.stripe_connect_account_id
    if (!accountId) {
      const account = await createConnectAccount(stripe, user)
      accountId = account.id
      await admin
        .from('affiliates')
        .update({ stripe_connect_account_id: account.id, updated_at: new Date().toISOString() })
        .eq('id', existing.affiliate.id)
      existing.affiliate.stripe_connect_account_id = account.id
    }

    const account = await stripe.accounts.retrieve(accountId)
    const status = account.capabilities?.transfers === 'active' || account.payouts_enabled
      ? 'active'
      : 'pending'

    if (status !== existing.affiliate.status) {
      await admin
        .from('affiliates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', existing.affiliate.id)
      existing.affiliate.status = status
    }

    const onboardingUrl = status === 'active'
      ? null
      : await createOnboardingUrl(stripe, request, accountId)

    return NextResponse.json({
      ...affiliatePayload(request, existing.affiliate, existing.stats),
      onboardingUrl,
    })
  }

  const couponId = getAffiliateCouponId(config.mode)
  if (!couponId) {
    return NextResponse.json(
      { error: 'Affiliate coupon is not configured', mode: config.mode },
      { status: 503 }
    )
  }

  const requestedCode = body.code ? normalizeAffiliateCode(body.code) : null
  if (body.code && !requestedCode) {
    return NextResponse.json({ error: 'Use 4-24 uppercase letters, numbers, or hyphens.' }, { status: 400 })
  }

  if (requestedCode) {
    const { data: taken } = await admin
      .from('affiliates')
      .select('id')
      .eq('code', requestedCode)
      .maybeSingle()

    if (taken) return NextResponse.json({ error: 'Affiliate code is already taken.' }, { status: 409 })
  }

  const metaName = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name
  const suggestedCode = suggestAffiliateCode(
    requestedCode ?? (typeof metaName === 'string' ? metaName : user.email),
    user.id
  )
  const code = requestedCode ?? await ensureUniqueSuggestedCode(admin, suggestedCode)

  let promotionCode: Stripe.PromotionCode
  let account: Stripe.Account
  try {
    [promotionCode, account] = await Promise.all([
      stripe.promotionCodes.create({
        promotion: { type: 'coupon', coupon: couponId },
        code,
        metadata: {
          affiliate_user_id: user.id,
          source: 'hackproduct_affiliate',
        },
      }),
      createConnectAccount(stripe, user),
    ])
  } catch (error) {
    return stripeAffiliateSetupError(error)
  }

  const { data: affiliate, error } = await admin
    .from('affiliates')
    .insert({
      user_id: user.id,
      code,
      stripe_promo_code_id: promotionCode.id,
      stripe_connect_account_id: account.id,
      commission_pct: AFFILIATE_DEFAULT_COMMISSION_PCT,
      status: 'pending',
    })
    .select('id, user_id, code, stripe_promo_code_id, stripe_connect_account_id, commission_pct, status, created_at')
    .single()

  if (error || !affiliate) {
    return NextResponse.json(
      { error: error?.message ?? 'Could not create affiliate account.' },
      { status: error?.code === '23505' ? 409 : 500 }
    )
  }

  const onboardingUrl = await createOnboardingUrl(stripe, request, account.id)

  return NextResponse.json({
    ...affiliatePayload(request, affiliate as AffiliateRow),
    onboardingUrl,
  })
}
