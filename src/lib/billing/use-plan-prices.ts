'use client'

import { useEffect, useState } from 'react'
import {
  BILLING_PLANS,
  ANALYTICS_PLANS,
  annualSavingsPercent,
  formatPlanPrice,
  type BillingInterval,
  type BillingPlanId,
  type AnyPlanId,
} from './plans'

/**
 * Live Pro pricing for the marketing surfaces. Seeded from the static
 * BILLING_PLANS config, then overridden by a validated /api/billing/prices
 * fetch so a price change in Stripe shows up without a deploy. The analytics
 * tier stays static (the prices API only covers Pro monthly/annual); build its
 * prices with `fallbackPrice('analytics_monthly' | 'analytics_annual')`.
 */
export interface PlanPrice {
  id: AnyPlanId
  priceId: string | null
  unitAmount: number
  currency: string
  interval: BillingInterval
  formatted: string | null
  source: 'fallback' | 'stripe'
}

export interface BillingPrices {
  monthly: PlanPrice
  annual: PlanPrice
  fetchedAt?: string
}

export function fallbackPrice(planId: AnyPlanId): PlanPrice {
  const plan =
    planId === 'analytics_monthly' || planId === 'analytics_annual'
      ? ANALYTICS_PLANS[planId]
      : BILLING_PLANS[planId]
  return {
    id: plan.id,
    priceId: null,
    unitAmount: plan.unitAmount,
    currency: 'usd',
    interval: plan.interval,
    formatted: formatPlanPrice(plan),
    source: 'fallback',
  }
}

function isPlanPrice(value: unknown, id: BillingPlanId): value is PlanPrice {
  if (!value || typeof value !== 'object') return false
  const price = value as Partial<PlanPrice>
  return (
    price.id === id &&
    typeof price.unitAmount === 'number' &&
    typeof price.currency === 'string' &&
    (price.interval === 'month' || price.interval === 'year')
  )
}

function formatCurrency(unitAmount: number, currency: string, forceCents = false) {
  try {
    const amount = unitAmount / 100
    const whole = Number.isInteger(amount)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: forceCents ? 2 : whole ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `$${(unitAmount / 100).toFixed(forceCents ? 2 : 0)}`
  }
}

export function displayPrice(price: PlanPrice) {
  return price.formatted ?? formatCurrency(price.unitAmount, price.currency)
}

export function monthlyEquivalent(price: PlanPrice) {
  const amount = price.interval === 'year' ? price.unitAmount / 12 : price.unitAmount
  return formatCurrency(amount, price.currency, true)
}

export function savingsPercent(prices: BillingPrices) {
  const annualizedMonthly = prices.monthly.unitAmount * 12
  if (annualizedMonthly <= prices.annual.unitAmount) return annualSavingsPercent()
  return Math.round(((annualizedMonthly - prices.annual.unitAmount) / annualizedMonthly) * 100)
}

const INITIAL_PRICES: BillingPrices = {
  monthly: fallbackPrice('monthly'),
  annual: fallbackPrice('annual'),
}

/** Pro monthly + annual prices, live from Stripe with a static fallback. */
export function usePlanPrices(): BillingPrices {
  const [prices, setPrices] = useState<BillingPrices>(INITIAL_PRICES)

  useEffect(() => {
    let cancelled = false

    fetch('/api/billing/prices', { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Partial<BillingPrices> | null) => {
        if (
          !cancelled &&
          data &&
          isPlanPrice(data.monthly, 'monthly') &&
          isPlanPrice(data.annual, 'annual')
        ) {
          setPrices({ monthly: data.monthly, annual: data.annual, fetchedAt: data.fetchedAt })
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return prices
}
