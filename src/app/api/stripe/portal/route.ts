import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { createStripeClient } from '@/lib/stripe/config'
import {
  resolveBillingCustomer,
  type BillingCustomerResolution,
} from '@/lib/stripe/billing-customer'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError(401, 'auth_required', 'Unauthorized')
  }

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return apiError(
      503,
      'stripe_not_configured',
      config.error ?? 'Stripe not configured',
      { mode: config.mode }
    )
  }

  const admin = createAdminClient()
  const { data: storedBilling, error: lookupError } = await admin
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (lookupError) {
    return apiError(
      500,
      'subscription_lookup_failed',
      'Could not load billing account',
      { detail: lookupError.message }
    )
  }

  let billing: BillingCustomerResolution
  try {
    billing = await resolveBillingCustomer({
      stripe,
      mode: config.mode,
      userId: user.id,
      stored: storedBilling,
    })
  } catch (error) {
    return apiError(
      502,
      'billing_customer_verification_failed',
      'Could not verify billing account',
      { detail: error instanceof Error ? error.message : 'Unknown Stripe error' }
    )
  }

  if (!billing.customerId) {
    return apiError(404, 'no_billing_account', 'No billing account found')
  }

  if (billing.customerId !== storedBilling?.stripe_customer_id) {
    const { error: backfillError } = await admin
      .from('subscriptions')
      .update({ stripe_customer_id: billing.customerId })
      .eq('user_id', user.id)
    if (backfillError) {
      console.error('[stripe.portal] Customer reference backfill failed', backfillError)
    }
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.customerId,
      return_url: new URL('/settings', appUrl).toString(),
    })
    return NextResponse.json({ url: session.url, mode: config.mode })
  } catch (error) {
    return apiError(
      502,
      'billing_portal_failed',
      'Could not open billing portal',
      { detail: error instanceof Error ? error.message : 'Unknown Stripe error' }
    )
  }
}
