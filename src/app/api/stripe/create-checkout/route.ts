import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBillingPlanId } from '@/lib/billing/plans'
import {
  createStripeClient,
  getCheckoutBrandingSettings,
  getStripePlanConfig,
} from '@/lib/stripe/config'
import {
  affiliateCheckoutMetadata,
  resolveAffiliateForCheckout,
} from '@/lib/stripe/affiliates'

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

  let plan: 'monthly' | 'annual' = 'monthly'
  let embedded = false
  try {
    const body = await req.json()
    if (isBillingPlanId(body.plan)) plan = body.plan
    if (body.embedded === true) embedded = true
  } catch {
    // fall back to defaults
  }

  const config = getStripePlanConfig(plan)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const affiliate = await resolveAffiliateForCheckout(createAdminClient(), req, user.id)
  const referralMetadata = affiliateCheckoutMetadata(affiliate)

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
        },
        quantity: 1,
      }

  const baseSessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [lineItem],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { user_id: user.id, plan, stripe_mode: stripeRuntime.mode, ...referralMetadata },
    subscription_data: {
      metadata: { user_id: user.id, plan, stripe_mode: stripeRuntime.mode, ...referralMetadata },
    },
    allow_promotion_codes: true,
    branding_settings: getCheckoutBrandingSettings(appUrl),
  }

  if (embedded) {
    const session = await stripe.checkout.sessions.create({
      ...baseSessionParams,
      ui_mode: 'embedded',
      return_url: `${appUrl}/dashboard?upgraded=1`,
    })
    return NextResponse.json({ clientSecret: session.client_secret, mode: stripeRuntime.mode })
  }

  const session = await stripe.checkout.sessions.create({
    ...baseSessionParams,
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
  })

  return NextResponse.json({ url: session.url, mode: stripeRuntime.mode })
}
