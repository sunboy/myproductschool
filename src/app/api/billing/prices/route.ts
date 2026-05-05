import { NextResponse } from 'next/server'
import { BILLING_PLANS, type BillingPlanId } from '@/lib/billing/plans'
import { createStripeClient, getStripePlanConfig } from '@/lib/stripe/config'

function formatPrice(unitAmount: number | null | undefined, currency: string | null | undefined) {
  if (unitAmount == null) return null
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency ?? 'usd').toUpperCase(),
      maximumFractionDigits: unitAmount % 100 === 0 ? 0 : 2,
    }).format(unitAmount / 100)
  } catch {
    return `$${(unitAmount / 100).toFixed(2)}`
  }
}

async function resolvePlanPrice(planId: BillingPlanId) {
  const plan = getStripePlanConfig(planId)
  const fallback = BILLING_PLANS[planId]
  const { stripe } = createStripeClient()

  if (!stripe || !plan.priceId) {
    return {
      id: planId,
      priceId: plan.priceId,
      unitAmount: fallback.unitAmount,
      currency: 'usd',
      interval: fallback.interval,
      formatted: formatPrice(fallback.unitAmount, 'usd'),
      source: 'fallback',
    }
  }

  const price = await stripe.prices.retrieve(plan.priceId)
  const interval = price.recurring?.interval ?? fallback.interval
  const unitAmount = price.unit_amount ?? fallback.unitAmount
  const currency = price.currency ?? 'usd'

  return {
    id: planId,
    priceId: price.id,
    unitAmount,
    currency,
    interval,
    formatted: formatPrice(unitAmount, currency),
    source: 'stripe',
  }
}

export async function GET() {
  const [monthly, annual] = await Promise.all([
    resolvePlanPrice('monthly'),
    resolvePlanPrice('annual'),
  ])

  return NextResponse.json({
    monthly,
    annual,
    fetchedAt: new Date().toISOString(),
  })
}
