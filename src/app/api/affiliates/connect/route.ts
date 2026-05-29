import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeClient } from '@/lib/stripe/config'
import {
  affiliateAccountStatus,
  affiliateUrl,
  appUrlFromRequest,
  createAffiliateAccountLink,
  createAffiliateConnectAccount,
  defaultCommissionBps,
  normalizeAffiliateSlug,
  updateAffiliateAccountFromStripeAccount,
} from '@/lib/stripe/affiliates'

type AffiliatePartnerRow = {
  id: string
  user_id: string
  slug: string
  display_name: string
  email: string | null
  commission_bps: number
  status: string
  stripe_account_id: string | null
  stripe_account_status: string
  stripe_requirements: unknown
  stripe_capabilities: unknown
  created_at: string
  updated_at: string
}

type CommissionRow = {
  commission_amount: number
  currency: string
  status: 'pending' | 'ready' | 'paid' | 'skipped' | 'failed' | 'reversed'
}

function responsePartner(partner: AffiliatePartnerRow | null, appUrl: string) {
  if (!partner) return null

  return {
    id: partner.id,
    slug: partner.slug,
    displayName: partner.display_name,
    email: partner.email,
    commissionBps: partner.commission_bps,
    status: partner.status,
    stripeAccountStatus: partner.stripe_account_status,
    hasStripeAccount: !!partner.stripe_account_id,
    referralUrl: affiliateUrl(partner.slug, appUrl),
    createdAt: partner.created_at,
    updatedAt: partner.updated_at,
  }
}

function summarizeCommissions(rows: CommissionRow[] | null) {
  return (rows ?? []).reduce(
    (acc, row) => {
      if (row.currency !== acc.currency) return acc
      if (row.status === 'paid') acc.paid += row.commission_amount
      if (row.status === 'ready') acc.ready += row.commission_amount
      if (row.status === 'pending') acc.pending += row.commission_amount
      if (row.status === 'failed') acc.failed += row.commission_amount
      return acc
    },
    { currency: 'usd', paid: 0, ready: 0, pending: 0, failed: 0 }
  )
}

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getAffiliatePayload(userId: string, appUrl: string) {
  const admin = createAdminClient()
  const { data: partner } = await admin
    .from('affiliate_partners')
    .select('id, user_id, slug, display_name, email, commission_bps, status, stripe_account_id, stripe_account_status, stripe_requirements, stripe_capabilities, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle<AffiliatePartnerRow>()

  if (!partner) {
    return {
      partner: null,
      stats: {
        clicks: 0,
        referrals: 0,
        commissions: { currency: 'usd', paid: 0, ready: 0, pending: 0, failed: 0 },
      },
      autopayoutsEnabled: process.env.AFFILIATE_AUTOPAYOUTS_ENABLED === 'true',
      defaultCommissionBps: defaultCommissionBps(),
    }
  }

  const [
    clicksResult,
    referralsResult,
    commissionsResult,
  ] = await Promise.all([
    admin.from('affiliate_clicks').select('id', { count: 'exact', head: true }).eq('affiliate_id', partner.id),
    admin.from('affiliate_referrals').select('id', { count: 'exact', head: true }).eq('affiliate_id', partner.id),
    admin
      .from('affiliate_commissions')
      .select('commission_amount, currency, status')
      .eq('affiliate_id', partner.id)
      .returns<CommissionRow[]>(),
  ])

  return {
    partner: responsePartner(partner, appUrl),
    stats: {
      clicks: clicksResult.count ?? 0,
      referrals: referralsResult.count ?? 0,
      commissions: summarizeCommissions(commissionsResult.data),
    },
    autopayoutsEnabled: process.env.AFFILIATE_AUTOPAYOUTS_ENABLED === 'true',
    defaultCommissionBps: defaultCommissionBps(),
  }
}

async function uniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  requested: string,
  userId: string
) {
  const base = normalizeAffiliateSlug(requested) ?? `affiliate-${userId.slice(0, 8)}`

  for (let index = 0; index < 8; index += 1) {
    const candidate = index === 0
      ? base
      : `${base.slice(0, 40)}-${crypto.randomUUID().slice(0, 6)}`

    const { data } = await admin
      .from('affiliate_partners')
      .select('id, user_id')
      .eq('slug', candidate)
      .maybeSingle<{ id: string; user_id: string }>()

    if (!data || data.user_id === userId) return candidate
  }

  return `${base.slice(0, 36)}-${crypto.randomUUID().slice(0, 10)}`
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await getAffiliatePayload(user.id, appUrlFromRequest(req)))
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured', detail: config.error, mode: config.mode },
      { status: 503 }
    )
  }

  const appUrl = appUrlFromRequest(req)
  const admin = createAdminClient()
  const body = await req.json().catch(() => ({})) as {
    slug?: string
    country?: string
    currency?: string
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .maybeSingle<{ display_name: string | null; email: string | null }>()

  const email = user.email ?? profile?.email
  if (!email) return NextResponse.json({ error: 'Affiliate payouts require an account email' }, { status: 400 })

  const displayName = profile?.display_name?.trim() || email.split('@')[0] || 'HackProduct affiliate'
  const requestedSlug = body.slug ?? displayName
  const slug = await uniqueSlug(admin, requestedSlug, user.id)
  const now = new Date().toISOString()

  const { data: existingPartner } = await admin
    .from('affiliate_partners')
    .select('id, user_id, slug, display_name, email, commission_bps, status, stripe_account_id, stripe_account_status, stripe_requirements, stripe_capabilities, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle<AffiliatePartnerRow>()

  const partnerPayload = {
    user_id: user.id,
    slug,
    display_name: displayName,
    email,
    commission_bps: existingPartner?.commission_bps ?? defaultCommissionBps(),
    status: existingPartner?.status ?? 'active',
    updated_at: now,
  }

  const { data: partner, error: partnerError } = existingPartner
    ? await admin
      .from('affiliate_partners')
      .update(partnerPayload)
      .eq('id', existingPartner.id)
      .select('id, user_id, slug, display_name, email, commission_bps, status, stripe_account_id, stripe_account_status, stripe_requirements, stripe_capabilities, created_at, updated_at')
      .single<AffiliatePartnerRow>()
    : await admin
      .from('affiliate_partners')
      .insert({ ...partnerPayload, created_at: now })
      .select('id, user_id, slug, display_name, email, commission_bps, status, stripe_account_id, stripe_account_status, stripe_requirements, stripe_capabilities, created_at, updated_at')
      .single<AffiliatePartnerRow>()

  if (partnerError || !partner) {
    return NextResponse.json({ error: partnerError?.message ?? 'Could not create affiliate profile' }, { status: 400 })
  }

  let accountLinkUrl: string
  try {
    let accountId = partner.stripe_account_id
    if (!accountId) {
      const account = await createAffiliateConnectAccount(stripe, {
        email,
        displayName,
        userId: user.id,
        country: body.country,
        currency: body.currency,
      })

      accountId = account.id
      await admin
        .from('affiliate_partners')
        .update({
          stripe_account_id: account.id,
          stripe_account_livemode: account.livemode,
          stripe_account_status: affiliateAccountStatus(account),
          stripe_requirements: account.requirements ?? {},
          stripe_capabilities: account.configuration?.recipient?.capabilities ?? {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', partner.id)
    } else {
      const account = await stripe.v2.core.accounts.retrieve(accountId, {
        include: ['configuration.recipient', 'requirements', 'future_requirements'],
      })
      await updateAffiliateAccountFromStripeAccount(admin, account)
    }

    const accountLink = await createAffiliateAccountLink(stripe, accountId, appUrl)
    accountLinkUrl = accountLink.url
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not start Stripe onboarding' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ...(await getAffiliatePayload(user.id, appUrl)),
    onboardingUrl: accountLinkUrl,
  })
}
