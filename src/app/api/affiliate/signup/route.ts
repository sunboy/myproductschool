import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { z, ZodError } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createStripeClient } from '@/lib/stripe/config'
import {
  affiliateAccountStatus,
  affiliateProgramStatusFromAccountStatus,
  createAffiliateAccountLink,
  createAffiliateConnectAccount,
  refreshAffiliateConnectAccount,
  syncAffiliateConnectAccount,
} from '@/lib/affiliate/connect'
import {
  AFFILIATE_DEFAULT_COMMISSION_PCT,
  affiliatesEnabled,
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
  stripe_account_status: string | null
  stripe_requirements: Record<string, unknown> | null
  stripe_future_requirements: Record<string, unknown> | null
  stripe_capabilities: Record<string, unknown> | null
  commission_pct: number | string
  status: 'pending' | 'active' | 'disabled'
  created_at: string
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

function userDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return 'HackProduct affiliate'
  const metadata = user.user_metadata ?? {}
  const name = metadata.display_name ?? metadata.full_name ?? metadata.name
  if (typeof name === 'string' && name.trim()) return name.trim()
  if (user.email) return user.email.split('@')[0] || 'HackProduct affiliate'
  return 'HackProduct affiliate'
}

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
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
          connectStatus: affiliate.stripe_account_status ?? (affiliate.stripe_connect_account_id ? 'created' : 'not_started'),
          connectRequirements: affiliate.stripe_requirements ?? {},
          connectFutureRequirements: affiliate.stripe_future_requirements ?? {},
          connectCapabilities: affiliate.stripe_capabilities ?? {},
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
    .select('id, user_id, code, stripe_promo_code_id, stripe_connect_account_id, stripe_account_status, stripe_requirements, stripe_future_requirements, stripe_capabilities, commission_pct, status, created_at')
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
      if (!user.email) {
        return NextResponse.json({ error: 'Affiliate payouts require an account email.' }, { status: 400 })
      }

      const account = await createAffiliateConnectAccount(stripe, {
        email: user.email,
        displayName: userDisplayName(user),
        userId: user.id,
      })
      accountId = account.id
      const sync = await syncAffiliateConnectAccount(admin, account)
      await admin
        .from('affiliates')
        .update({
          stripe_connect_account_id: account.id,
          status: sync.programStatus,
          stripe_account_livemode: account.livemode,
          stripe_account_status: sync.accountStatus,
          stripe_requirements: jsonRecord(account.requirements),
          stripe_future_requirements: jsonRecord(account.future_requirements),
          stripe_capabilities: jsonRecord(account.configuration?.recipient?.capabilities),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.affiliate.id)
      existing.affiliate.stripe_connect_account_id = account.id
      existing.affiliate.status = sync.programStatus
      existing.affiliate.stripe_account_status = sync.accountStatus
      existing.affiliate.stripe_requirements = jsonRecord(account.requirements)
      existing.affiliate.stripe_future_requirements = jsonRecord(account.future_requirements)
      existing.affiliate.stripe_capabilities = jsonRecord(account.configuration?.recipient?.capabilities)
    } else {
      const sync = await refreshAffiliateConnectAccount(stripe, admin, accountId)
      existing.affiliate.status = sync.programStatus
      existing.affiliate.stripe_account_status = sync.accountStatus
      existing.affiliate.stripe_requirements = jsonRecord(sync.account.requirements)
      existing.affiliate.stripe_future_requirements = jsonRecord(sync.account.future_requirements)
      existing.affiliate.stripe_capabilities = jsonRecord(sync.account.configuration?.recipient?.capabilities)
    }

    const onboardingUrl = existing.affiliate.status === 'active'
      ? null
      : (await createAffiliateAccountLink(stripe, {
          accountId,
          refreshUrl: appUrl(request, '/affiliate?connect=refresh'),
          returnUrl: appUrl(request, '/api/affiliate/connect-callback'),
        })).url

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

  if (!user.email) {
    return NextResponse.json({ error: 'Affiliate payouts require an account email.' }, { status: 400 })
  }

  let promotionCode: Stripe.PromotionCode
  let account: Stripe.V2.Core.Account
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
      createAffiliateConnectAccount(stripe, {
        email: user.email,
        displayName: userDisplayName(user),
        userId: user.id,
      }),
    ])
  } catch (error) {
    return stripeAffiliateSetupError(error)
  }

  const accountStatus = affiliateAccountStatus(account)
  const accountSync = {
    status: affiliateProgramStatusFromAccountStatus(accountStatus),
    stripe_account_livemode: account.livemode,
    stripe_account_status: accountStatus,
    stripe_requirements: jsonRecord(account.requirements),
    stripe_future_requirements: jsonRecord(account.future_requirements),
    stripe_capabilities: jsonRecord(account.configuration?.recipient?.capabilities),
  }

  const { data: affiliate, error } = await admin
    .from('affiliates')
    .insert({
      user_id: user.id,
      code,
      stripe_promo_code_id: promotionCode.id,
      stripe_connect_account_id: account.id,
      commission_pct: AFFILIATE_DEFAULT_COMMISSION_PCT,
      ...accountSync,
    })
    .select('id, user_id, code, stripe_promo_code_id, stripe_connect_account_id, stripe_account_status, stripe_requirements, stripe_future_requirements, stripe_capabilities, commission_pct, status, created_at')
    .single()

  if (error || !affiliate) {
    return NextResponse.json(
      { error: error?.message ?? 'Could not create affiliate account.' },
      { status: error?.code === '23505' ? 409 : 500 }
    )
  }

  const onboardingUrl = (await createAffiliateAccountLink(stripe, {
    accountId: account.id,
    refreshUrl: appUrl(request, '/affiliate?connect=refresh'),
    returnUrl: appUrl(request, '/api/affiliate/connect-callback'),
  })).url

  return NextResponse.json({
    ...affiliatePayload(request, affiliate as AffiliateRow),
    onboardingUrl,
  })
}
