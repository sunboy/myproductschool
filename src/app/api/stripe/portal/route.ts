import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { createStripeClient } from '@/lib/stripe/config'

type SubscriptionBillingLookup = {
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

function stripeCustomerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.id
}

async function getStripeCustomerId(userId: string, stripe: Stripe) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)

  const subscription = data as SubscriptionBillingLookup | null
  if (subscription?.stripe_customer_id) return subscription.stripe_customer_id
  if (!subscription?.stripe_subscription_id) return null

  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
  const customerId = stripeCustomerId(stripeSubscription.customer)

  if (customerId) {
    await admin
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', userId)
  }

  return customerId
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError(401, 'auth_required', 'Unauthorized')
  }

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return apiError(503, 'stripe_not_configured', config.error ?? 'Stripe not configured', {
      mode: config.mode,
    })
  }

  let customerId: string | null
  try {
    customerId = await getStripeCustomerId(user.id, stripe)
  } catch (error) {
    return apiError(500, 'subscription_lookup_failed', 'Could not load billing account', {
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  if (!customerId) {
    return apiError(404, 'billing_customer_missing', 'No billing account found')
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: new URL('/settings', appUrl).toString(),
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return apiError(502, 'billing_portal_failed', 'Could not open billing portal', {
      detail: error instanceof Error ? error.message : 'Unknown Stripe error',
    })
  }
}
