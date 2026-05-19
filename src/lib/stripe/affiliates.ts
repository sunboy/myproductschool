import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import type { createAdminClient } from '@/lib/supabase/admin'

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

export const AFFILIATE_CODE_COOKIE = 'hp_affiliate_code'
export const AFFILIATE_CLICK_COOKIE = 'hp_affiliate_click_id'
export const AFFILIATE_VISITOR_COOKIE = 'hp_affiliate_visitor_id'

type AffiliatePartnerRow = {
  id: string
  user_id: string | null
  slug: string
  commission_bps: number | null
  status: string
  stripe_account_id: string | null
  stripe_account_status: string | null
}

export type ResolvedAffiliate = {
  affiliateId: string
  affiliateCode: string
  affiliateClickId: string | null
  commissionBps: number
}

export function normalizeAffiliateSlug(input: string | null | undefined) {
  const slug = input
    ?.normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48)

  return slug && slug.length >= 3 ? slug : null
}

export function defaultCommissionBps(env: Record<string, string | undefined> = process.env) {
  const configured = Number.parseInt(env.AFFILIATE_DEFAULT_COMMISSION_BPS ?? '', 10)
  if (!Number.isFinite(configured)) return 2000
  return Math.min(10000, Math.max(0, configured))
}

export function affiliateCookieMaxAge(env: Record<string, string | undefined> = process.env) {
  const days = Number.parseInt(env.AFFILIATE_COOKIE_DAYS ?? '', 10)
  const safeDays = Number.isFinite(days) && days > 0 ? days : 60
  return safeDays * 24 * 60 * 60
}

export function appUrlFromRequest(req: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || req.nextUrl.origin
}

export function affiliateUrl(slug: string, appUrl: string) {
  return new URL(`/r/${slug}`, appUrl).toString()
}

export function setAffiliateCookies(
  response: NextResponse,
  input: { code: string; clickId: string | null; visitorId: string }
) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: affiliateCookieMaxAge(),
  }

  response.cookies.set(AFFILIATE_CODE_COOKIE, input.code, cookieOptions)
  response.cookies.set(AFFILIATE_VISITOR_COOKIE, input.visitorId, cookieOptions)
  if (input.clickId) response.cookies.set(AFFILIATE_CLICK_COOKIE, input.clickId, cookieOptions)
}

function safeRedirectPath(input: string | null) {
  if (!input?.startsWith('/')) return '/login'
  if (input.startsWith('//')) return '/login'
  return input
}

export function referralLandingPath(req: NextRequest) {
  return safeRedirectPath(req.nextUrl.searchParams.get('next'))
}

export async function recordAffiliateClick(
  supabase: SupabaseAdminClient,
  req: NextRequest,
  codeInput: string,
  landingPath: string
) {
  const code = normalizeAffiliateSlug(codeInput)
  if (!code) return null

  const { data: partner } = await supabase
    .from('affiliate_partners')
    .select('id, user_id, slug, commission_bps, status, stripe_account_id, stripe_account_status')
    .eq('slug', code)
    .eq('status', 'active')
    .maybeSingle<AffiliatePartnerRow>()

  if (!partner) return null

  const visitorId = req.cookies.get(AFFILIATE_VISITOR_COOKIE)?.value || crypto.randomUUID()
  const { data: click, error } = await supabase
    .from('affiliate_clicks')
    .insert({
      affiliate_id: partner.id,
      code: partner.slug,
      visitor_id: visitorId,
      landing_path: safeRedirectPath(landingPath),
      referrer: req.headers.get('referer'),
      user_agent: req.headers.get('user-agent'),
    })
    .select('id')
    .single<{ id: string }>()

  if (error) {
    console.error('Failed to record affiliate click', error)
  }

  return {
    partner,
    clickId: click?.id ?? null,
    visitorId,
  }
}

export async function resolveAffiliateForCheckout(
  supabase: SupabaseAdminClient,
  req: NextRequest,
  userId: string
): Promise<ResolvedAffiliate | null> {
  const code = normalizeAffiliateSlug(req.cookies.get(AFFILIATE_CODE_COOKIE)?.value)
  if (!code) return null

  const { data: partner } = await supabase
    .from('affiliate_partners')
    .select('id, user_id, slug, commission_bps, status, stripe_account_id, stripe_account_status')
    .eq('slug', code)
    .eq('status', 'active')
    .maybeSingle<AffiliatePartnerRow>()

  if (!partner || partner.user_id === userId) return null

  const clickId = req.cookies.get(AFFILIATE_CLICK_COOKIE)?.value ?? null
  if (clickId) {
    await supabase
      .from('affiliate_clicks')
      .update({ converted_user_id: userId, converted_at: new Date().toISOString() })
      .eq('id', clickId)
      .eq('affiliate_id', partner.id)
  }

  return {
    affiliateId: partner.id,
    affiliateCode: partner.slug,
    affiliateClickId: clickId,
    commissionBps: partner.commission_bps ?? defaultCommissionBps(),
  }
}

export function affiliateCheckoutMetadata(affiliate: ResolvedAffiliate | null): Stripe.MetadataParam {
  if (!affiliate) return {}
  return {
    affiliate_id: affiliate.affiliateId,
    affiliate_code: affiliate.affiliateCode,
    affiliate_click_id: affiliate.affiliateClickId ?? '',
    affiliate_commission_bps: String(affiliate.commissionBps),
  }
}

function stringId(value: string | { id?: string } | null | undefined) {
  if (!value) return null
  return typeof value === 'string' ? value : value.id ?? null
}

export async function upsertAffiliateReferralFromCheckoutSession(
  supabase: SupabaseAdminClient,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata ?? {}
  const affiliateId = metadata.affiliate_id
  const referredUserId = session.client_reference_id ?? metadata.user_id

  if (!affiliateId || !referredUserId) return

  const firstClickId = metadata.affiliate_click_id || null
  const subscriptionId = stringId(session.subscription)
  const customerId = stringId(session.customer)

  await supabase.from('affiliate_referrals').upsert({
    affiliate_id: affiliateId,
    referred_user_id: referredUserId,
    first_click_id: firstClickId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: 'active',
    metadata: {
      checkout_session_id: session.id,
      affiliate_code: metadata.affiliate_code ?? null,
    },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'affiliate_id,referred_user_id' })

  if (firstClickId) {
    await supabase
      .from('affiliate_clicks')
      .update({ converted_user_id: referredUserId, converted_at: new Date().toISOString() })
      .eq('id', firstClickId)
      .eq('affiliate_id', affiliateId)
  }
}

export function stripeInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription
  if (legacy) return stringId(legacy)

  const parent = invoice.parent as
    | { subscription_details?: { subscription?: string | Stripe.Subscription | null } | null }
    | null
    | undefined

  return stringId(parent?.subscription_details?.subscription)
}

function stripeInvoiceCustomerId(invoice: Stripe.Invoice) {
  return stringId(invoice.customer)
}

function stripeInvoiceSubscriptionMetadata(invoice: Stripe.Invoice): Stripe.Metadata {
  const parent = invoice.parent as
    | { subscription_details?: { metadata?: Stripe.Metadata | null } | null }
    | null
    | undefined

  return parent?.subscription_details?.metadata ?? invoice.metadata ?? {}
}

function metadataBps(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(10000, Math.max(0, parsed))
}

async function invoiceChargeId(stripe: Stripe, invoice: Stripe.Invoice) {
  const charge = (invoice as Stripe.Invoice & { charge?: string | Stripe.Charge | null }).charge
  const chargeId = stringId(charge)
  if (chargeId) return chargeId

  const paymentIntent = (invoice as Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null
  }).payment_intent
  const paymentIntentId = stringId(paymentIntent)
  if (!paymentIntentId) return null

  const retrieved = typeof paymentIntent === 'string'
    ? await stripe.paymentIntents.retrieve(paymentIntentId)
    : paymentIntent

  if (!retrieved) return null
  return stringId(retrieved.latest_charge)
}

function affiliateAccountStatus(account: Stripe.V2.Core.Account) {
  if (account.closed) return 'disabled'
  const transferStatus = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status
  if (transferStatus === 'active') return 'active'
  if (transferStatus === 'restricted') return 'restricted'
  if (transferStatus === 'unsupported') return 'disabled'
  return transferStatus === 'pending' ? 'onboarding' : 'created'
}

export async function createAffiliateConnectAccount(
  stripe: Stripe,
  input: {
    email: string
    displayName: string
    userId: string
    country?: string
    currency?: string
  }
) {
  return stripe.v2.core.accounts.create({
    contact_email: input.email,
    display_name: input.displayName,
    dashboard: 'express',
    identity: {
      country: (input.country || 'US').toUpperCase(),
      entity_type: 'individual',
    },
    configuration: {
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: { requested: true },
          },
        },
      },
    },
    defaults: {
      currency: (input.currency || 'usd').toLowerCase(),
      responsibilities: {
        fees_collector: 'application',
        losses_collector: 'application',
      },
    },
    metadata: {
      hackproduct_user_id: input.userId,
      affiliate: 'true',
    },
    include: ['configuration.recipient', 'defaults', 'identity', 'requirements'],
  })
}

export async function createAffiliateAccountLink(
  stripe: Stripe,
  accountId: string,
  appUrl: string
) {
  return stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        configurations: ['recipient'],
        refresh_url: new URL('/affiliates?connect=refresh', appUrl).toString(),
        return_url: new URL('/affiliates?connect=return', appUrl).toString(),
      },
    },
  })
}

export async function updateAffiliateAccountFromStripeAccount(
  supabase: SupabaseAdminClient,
  account: Stripe.V2.Core.Account
) {
  await supabase
    .from('affiliate_partners')
    .update({
      stripe_account_livemode: account.livemode,
      stripe_account_status: affiliateAccountStatus(account),
      stripe_requirements: account.requirements ?? {},
      stripe_capabilities: account.configuration?.recipient?.capabilities ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_account_id', account.id)
}

export async function processAffiliateInvoicePaid(input: {
  stripe: Stripe
  supabase: SupabaseAdminClient
  invoice: Stripe.Invoice
  eventId: string
}) {
  const { stripe, supabase, invoice, eventId } = input
  if (!invoice.id) return

  const { data: existing } = await supabase
    .from('affiliate_commissions')
    .select('id, status, stripe_transfer_id')
    .eq('stripe_invoice_id', invoice.id)
    .maybeSingle<{ id: string; status: string; stripe_transfer_id: string | null }>()

  if (existing?.status === 'paid') return

  const metadata = stripeInvoiceSubscriptionMetadata(invoice)
  const subscriptionId = stripeInvoiceSubscriptionId(invoice)
  const customerId = stripeInvoiceCustomerId(invoice)

  let affiliateId: string | null = metadata.affiliate_id ?? null
  let referredUserId: string | null = metadata.user_id ?? null
  let referralId: string | null = null

  if (!affiliateId && subscriptionId) {
    const { data: referral } = await supabase
      .from('affiliate_referrals')
      .select('id, affiliate_id, referred_user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle<{ id: string; affiliate_id: string; referred_user_id: string }>()

    affiliateId = referral?.affiliate_id ?? null
    referredUserId = referral?.referred_user_id ?? referredUserId
    referralId = referral?.id ?? null
  } else if (affiliateId && subscriptionId) {
    const { data: referral } = await supabase
      .from('affiliate_referrals')
      .select('id, referred_user_id')
      .eq('affiliate_id', affiliateId)
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle<{ id: string; referred_user_id: string }>()

    referredUserId = referral?.referred_user_id ?? referredUserId
    referralId = referral?.id ?? null
  }

  if (!affiliateId) return

  const { data: partner } = await supabase
    .from('affiliate_partners')
    .select('id, commission_bps, status, stripe_account_id, stripe_account_status')
    .eq('id', affiliateId)
    .maybeSingle<AffiliatePartnerRow>()

  if (!partner || partner.status !== 'active') return

  const commissionBps = metadataBps(
    metadata.affiliate_commission_bps,
    partner.commission_bps ?? defaultCommissionBps()
  )
  const grossAmount = Math.max(0, invoice.amount_paid ?? 0)
  const commissionAmount = Math.floor((grossAmount * commissionBps) / 10000)
  const chargeId = await invoiceChargeId(stripe, invoice)
  const connectedAccountReady = !!partner.stripe_account_id && partner.stripe_account_status === 'active'
  const autopayoutsEnabled = process.env.AFFILIATE_AUTOPAYOUTS_ENABLED === 'true'
  const baseStatus = commissionAmount <= 0
    ? 'skipped'
    : connectedAccountReady
      ? 'ready'
      : 'pending'

  const commissionPayload = {
    affiliate_id: affiliateId,
    referral_id: referralId,
    referred_user_id: referredUserId,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    stripe_charge_id: chargeId,
    gross_amount: grossAmount,
    commission_bps: commissionBps,
    commission_amount: commissionAmount,
    currency: invoice.currency,
    status: baseStatus,
    error: null,
    event_id: eventId,
    metadata: {
      invoice_number: invoice.number ?? null,
      billing_reason: invoice.billing_reason ?? null,
    },
    updated_at: new Date().toISOString(),
  }

  await supabase
    .from('affiliate_commissions')
    .upsert(commissionPayload, { onConflict: 'stripe_invoice_id' })

  if (
    !autopayoutsEnabled
    || baseStatus !== 'ready'
    || !partner.stripe_account_id
    || existing?.stripe_transfer_id
  ) {
    return
  }

  try {
    const transferParams: Stripe.TransferCreateParams = {
      amount: commissionAmount,
      currency: invoice.currency,
      destination: partner.stripe_account_id,
      description: `HackProduct affiliate commission for ${invoice.id}`,
      metadata: {
        affiliate_id: affiliateId,
        invoice_id: invoice.id,
        referral_id: referralId ?? '',
      },
      transfer_group: `affiliate:${subscriptionId ?? invoice.id}`,
    }
    if (chargeId) transferParams.source_transaction = chargeId

    const transfer = await stripe.transfers.create(transferParams, {
      idempotencyKey: `affiliate_commission:${invoice.id}`,
    })

    await supabase
      .from('affiliate_commissions')
      .update({
        status: 'paid',
        stripe_transfer_id: transfer.id,
        paid_at: new Date().toISOString(),
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_invoice_id', invoice.id)
  } catch (error) {
    await supabase
      .from('affiliate_commissions')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Stripe transfer failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_invoice_id', invoice.id)
  }
}

export { affiliateAccountStatus }
