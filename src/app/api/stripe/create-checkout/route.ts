import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  : null

const PLAN_CONFIG = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY ?? null,
    unitAmount: 2900,
    interval: 'month' as const,
    label: 'HackProduct Pro — Monthly',
  },
  annual: {
    priceId: process.env.STRIPE_PRICE_ANNUAL ?? null,
    unitAmount: 19900,
    interval: 'year' as const,
    label: 'HackProduct Pro — Annual',
  },
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
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
    if (body.plan === 'annual' || body.plan === 'monthly') plan = body.plan
    if (body.embedded === true) embedded = true
  } catch {
    // fall back to defaults
  }

  const config = PLAN_CONFIG[plan]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = config.priceId
    ? { price: config.priceId, quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          product_data: {
            name: config.label,
            description: 'Unlimited challenges, full Luma coaching, Learner DNA, and all study plans',
          },
          unit_amount: config.unitAmount,
          recurring: { interval: config.interval },
        },
        quantity: 1,
      }

  if (embedded) {
    // Embedded checkout — returns client_secret, no redirect
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [lineItem],
      customer_email: user.email,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
      ui_mode: 'embedded',
      return_url: `${appUrl}/dashboard?upgraded=1`,
      allow_promotion_codes: true,
    })
    return NextResponse.json({ clientSecret: session.client_secret })
  }

  // Hosted checkout — redirect flow
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [lineItem],
    customer_email: user.email,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
