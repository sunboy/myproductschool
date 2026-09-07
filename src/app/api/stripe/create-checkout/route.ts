import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAnalyticsPlanId, isAnyPlanId, type AnyPlanId } from '@/lib/billing/plans'
import { getAnalyticsAccess } from '@/lib/flags/analytics'
import {
  createStripeClient,
  getCheckoutBrandingSettings,
  getStripePlanConfig,
} from '@/lib/stripe/config'
import {
  affiliateCheckoutMetadata,
  resolveAffiliateForCheckout,
} from '@/lib/stripe/affiliates'
import {
  resolveOrCreateCheckoutCustomer,
  type BillingCustomerResolution,
} from '@/lib/stripe/billing-customer'

const PRO_TRIAL_DAYS = 7

export async function POST(req: NextRequest) {
  const { stripe, config: stripeRuntime } = createStripeClient()

  if (!stripe) {
    return NextResponse.json(
      {
        error: 'Stripe not configured',
        detail: stripeRuntime.error,
        mode: stripeRuntime.mode,
      },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let plan: AnyPlanId = 'monthly'
  let embedded = false
  try {
    const body = await req.json()
    if (isAnyPlanId(body.plan)) plan = body.plan
    if (body.embedded === true) embedded = true
  } catch {
    // fall back to defaults
  }

  const admin = createAdminClient()
  const isAnalyticsPlan = isAnalyticsPlanId(plan)
  if (isAnalyticsPlan) {
    // Hard gate: the Analytics tier is only SELLABLE when the global feature flag
    // is on. The per-user allowlist (cc_analytics_access) grants feature ACCESS
    // for beta users, but must NOT open a checkout while the tier is unlaunched —
    // otherwise an allowlisted user could buy a tier with no live Stripe price
    // (create-checkout would fall back to inline price_data). Gate on `enabled`
    // alone here, independent of the allowlist. (Stripe audit finding.)
    const { enabled } = await getAnalyticsAccess(admin, user.id)
    if (!enabled) {
      return NextResponse.json({ error: 'Claude Code Analytics is not available yet' }, { status: 400 })
    }
  }

  const config = getStripePlanConfig(plan)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data: storedBilling, error: storedBillingError } = await admin
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (storedBillingError) {
    console.error('[create-checkout] Subscription lookup failed', storedBillingError)
    return NextResponse.json(
      { error: 'Could not verify your billing account. Please try again.' },
      { status: 500 }
    )
  }

  let billing: BillingCustomerResolution
  try {
    billing = await resolveOrCreateCheckoutCustomer({
      stripe,
      mode: stripeRuntime.mode,
      userId: user.id,
      email: user.email,
      stored: storedBilling,
      persistence: {
        persistIfUnclaimed: async (customerId) => {
          if (storedBilling) {
            const { data, error } = await admin
              .from('subscriptions')
              .update({ stripe_customer_id: customerId })
              .eq('user_id', user.id)
              .is('stripe_customer_id', null)
              .is('stripe_subscription_id', null)
              .select('stripe_customer_id')
              .maybeSingle()
            if (error) throw new Error(error.message)
            return data?.stripe_customer_id === customerId
          }

          const { error } = await admin.from('subscriptions').insert({
            user_id: user.id,
            stripe_customer_id: customerId,
            plan: 'free',
          })
          if (!error) return true
          if (error.code === '23505') return false
          throw new Error(error.message)
        },
        reloadStored: async () => {
          const { data, error } = await admin
            .from('subscriptions')
            .select('stripe_customer_id, stripe_subscription_id')
            .eq('user_id', user.id)
            .maybeSingle()
          if (error) throw new Error(error.message)
          return data
        },
      },
    })
  } catch (error) {
    console.error('[create-checkout] Stripe customer verification failed', error)
    return NextResponse.json(
      { error: 'Could not verify your billing account. Please try again.' },
      { status: 502 }
    )
  }

  if (
    billing.source === 'stored_subscription'
    && billing.customerId
    && billing.customerId !== storedBilling?.stripe_customer_id
  ) {
    const { error: backfillError } = await admin
      .from('subscriptions')
      .update({ stripe_customer_id: billing.customerId })
      .eq('user_id', user.id)
    if (backfillError) {
      console.error('[create-checkout] Customer reference backfill failed', backfillError)
    }
  }

  if (billing.customerId && billing.blockingSubscription) {
    try {
      const portal = await stripe.billingPortal.sessions.create({
        customer: billing.customerId,
        return_url: new URL('/settings', appUrl).toString(),
      })
      return NextResponse.json({
        url: portal.url,
        action: 'manage_subscription',
        mode: stripeRuntime.mode,
      })
    } catch (error) {
      console.error('[create-checkout] Billing portal creation failed', error)
      return NextResponse.json(
        { error: 'Could not open your billing account. Please try again.' },
        { status: 502 }
      )
    }
  }

  const affiliate = await resolveAffiliateForCheckout(admin, req, user.id)
  const referralMetadata = affiliateCheckoutMetadata(affiliate)
  const metadata = {
    user_id: user.id,
    plan,
    stripe_mode: stripeRuntime.mode,
    ...referralMetadata,
    ...(isAnalyticsPlan ? { tier: 'analytics' } : {}),
  }

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = config.priceId
    ? { price: config.priceId, quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          product_data: {
            name: config.label,
            description: 'Fair-use Hatch AI coaching, practice starts, Learner DNA, interviews, and study plans',
          },
          unit_amount: config.unitAmount,
          recurring: { interval: config.interval },
          tax_behavior: 'exclusive',
        },
        quantity: 1,
      }

  const baseSessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [lineItem],
    ...(billing.customerId
      ? {
          customer: billing.customerId,
          customer_update: { address: 'auto' },
        }
      : { customer_email: user.email }),
    client_reference_id: user.id,
    metadata,
    subscription_data: {
      trial_period_days: PRO_TRIAL_DAYS,
      metadata,
    },
    billing_address_collection: 'required',
    automatic_tax: { enabled: true },
    allow_promotion_codes: true,
  }

  // Round to the nearest minute so client-side retries within the same minute
  // (network blip, double-click) collapse to the same Stripe session.
  const minuteBucket = Math.floor(Date.now() / 60_000)
  const idempotencyKey = `checkout-${user.id}-${plan}-${embedded ? 'e' : 'h'}-${minuteBucket}`

  try {
    if (embedded) {
      const session = await stripe.checkout.sessions.create(
        {
          ...baseSessionParams,
          // Stripe rejects logo/icon branding on embedded sessions.
          branding_settings: getCheckoutBrandingSettings(appUrl, { embedded: true }),
          ui_mode: 'embedded',
          return_url: `${appUrl}/dashboard?upgraded=1`,
        },
        { idempotencyKey }
      )
      return NextResponse.json({ clientSecret: session.client_secret, mode: stripeRuntime.mode })
    }

    const session = await stripe.checkout.sessions.create(
      {
        ...baseSessionParams,
        branding_settings: getCheckoutBrandingSettings(appUrl),
        success_url: `${appUrl}/dashboard?upgraded=1`,
        cancel_url: `${appUrl}/dashboard`,
      },
      { idempotencyKey }
    )

    return NextResponse.json({ url: session.url, mode: stripeRuntime.mode })
  } catch (err) {
    console.error('[create-checkout] Stripe session creation failed', err)
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 500 }
    )
  }
}
