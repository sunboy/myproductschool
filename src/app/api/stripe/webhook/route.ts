import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  : null

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {

    // ── Buy Button flow: client_reference_id is the user_id ──────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      if (!userId) break

      // Immediately mark user as pro — subscription event follows shortly
      await supabase.from('profiles').update({ plan: 'pro' }).eq('id', userId)

      // Upsert a subscription row with what we know now
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string ?? null,
        stripe_subscription_id: session.subscription as string ?? null,
        plan: 'pro',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      break
    }

    // ── Subscription lifecycle (handles renewal, cancellation, etc.) ──────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      // user_id comes from metadata (set by custom checkout) OR we look it up
      // from the subscriptions table by stripe_subscription_id / stripe_customer_id
      let userId = subscription.metadata?.user_id

      if (!userId) {
        // Buy Button path: look up via customer ID
        const { data } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()
        userId = data?.user_id
      }

      if (!userId) break

      const item = subscription.items.data[0]
      const periodEnd = item?.current_period_end
      const interval = item?.plan?.interval ?? null
      const priceId = item?.price?.id ?? null

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        billing_interval: interval,
        plan: subscription.status === 'active' ? 'pro' : 'free',
        status: subscription.status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      if (subscription.status === 'active') {
        await supabase.from('profiles').update({ plan: 'pro' }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      let userId = subscription.metadata?.user_id

      if (!userId) {
        const { data } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()
        userId = data?.user_id
      }

      if (!userId) break

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan: 'free',
        status: 'canceled',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
