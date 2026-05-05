import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasValidReauthToken } from '@/lib/auth/reauth'
import { createStripeClient, getStripePlanConfig } from '@/lib/stripe/config'
import { isBillingPlanId } from '@/lib/billing/plans'

async function getUserSubscription(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data?.stripe_subscription_id) return null
  return data.stripe_subscription_id as string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasValidReauthToken(req, user.id)) {
    return NextResponse.json({ error: 'reauth_required' }, { status: 403 })
  }

  const { stripe, config } = createStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: config.error ?? 'Stripe not configured' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const action = body.action
  const subscriptionId = await getUserSubscription(user.id)
  if (!subscriptionId) return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })

  if (action === 'cancel') {
    const subscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
    return NextResponse.json({ subscription })
  }

  if (action === 'reactivate') {
    const subscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false })
    return NextResponse.json({ subscription })
  }

  if (action === 'change-plan') {
    const plan = body.plan
    if (!isBillingPlanId(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const planConfig = getStripePlanConfig(plan)
    if (!planConfig.priceId) {
      return NextResponse.json({ error: `Missing Stripe price for ${plan}` }, { status: 503 })
    }

    const current = await stripe.subscriptions.retrieve(subscriptionId)
    const itemId = current.items.data[0]?.id
    if (!itemId) return NextResponse.json({ error: 'Subscription item not found' }, { status: 404 })

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
      proration_behavior: 'create_prorations',
      items: [{ id: itemId, price: planConfig.priceId }],
    })
    return NextResponse.json({ subscription })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
