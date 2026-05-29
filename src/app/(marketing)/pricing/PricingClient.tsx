'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FloatingNav } from '@/components/marketing/FloatingNav'
import { GradientFooter } from '@/components/marketing/GradientFooter'
import {
  BILLING_PLANS,
  annualSavingsPercent,
  formatPlanPrice,
  type BillingInterval,
  type BillingPlanId,
} from '@/lib/billing/plans'

type BillingCycle = BillingPlanId

interface PlanPrice {
  id: BillingPlanId
  priceId: string | null
  unitAmount: number
  currency: string
  interval: BillingInterval
  formatted: string | null
  source: 'fallback' | 'stripe'
}

interface BillingPrices {
  monthly: PlanPrice
  annual: PlanPrice
  fetchedAt?: string
}

const FREE_LIMITS = [
  '3 challenge starts per month',
  'Starter Hatch AI budget',
  'Core practice library',
  'Progress history',
]

const PRO_LIMITS = [
  '80 challenge starts per month',
  '12 live AI interview starts per month',
  'Fair-use Hatch AI coaching budget',
  'Learner DNA, failure patterns, and study plans',
]

const FEATURE_ROWS = [
  {
    feature: 'Challenge starts',
    free: '3 per month',
    pro: '80 per month',
  },
  {
    feature: 'Hatch AI coaching',
    free: 'Starter budget',
    pro: 'Fair-use coaching budget',
  },
  {
    feature: 'Live AI interviews',
    free: 'Not included',
    pro: '12 starts per month',
  },
  {
    feature: 'Learner DNA',
    free: 'Basic activity history',
    pro: 'Radar, failure patterns, and next drills',
  },
  {
    feature: 'Study plans',
    free: 'Public templates',
    pro: 'Personalized plans and autopsies',
  },
  {
    feature: 'Billing',
    free: 'Free forever',
    pro: '7-day free trial, cancel anytime',
  },
]

function fallbackPrice(planId: BillingPlanId): PlanPrice {
  const plan = BILLING_PLANS[planId]
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

function displayPrice(price: PlanPrice) {
  return price.formatted ?? formatCurrency(price.unitAmount, price.currency)
}

function monthlyEquivalent(price: PlanPrice) {
  const amount = price.interval === 'year' ? price.unitAmount / 12 : price.unitAmount
  return formatCurrency(amount, price.currency, true)
}

function savingsPercent(prices: BillingPrices) {
  const annualizedMonthly = prices.monthly.unitAmount * 12
  if (annualizedMonthly <= prices.annual.unitAmount) return annualSavingsPercent()
  return Math.round(((annualizedMonthly - prices.annual.unitAmount) / annualizedMonthly) * 100)
}

const INITIAL_PRICES: BillingPrices = {
  monthly: fallbackPrice('monthly'),
  annual: fallbackPrice('annual'),
}

export function PricingClient() {
  const [billing, setBilling] = useState<BillingCycle>('annual')
  const [prices, setPrices] = useState<BillingPrices>(INITIAL_PRICES)
  const [loadingPlan, setLoadingPlan] = useState<BillingPlanId | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('plan') === 'monthly') setBilling('monthly')
  }, [])

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
          setPrices({
            monthly: data.monthly,
            annual: data.annual,
            fetchedAt: data.fetchedAt,
          })
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const activePrice = prices[billing]
  const annualSavings = useMemo(() => savingsPercent(prices), [prices])
  const annualMonthly = monthlyEquivalent(prices.annual)

  async function startCheckout(plan: BillingPlanId) {
    if (loadingPlan) return
    setCheckoutError(null)
    setLoadingPlan(plan)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        window.location.href = `/signup?next=${encodeURIComponent(`/pricing?plan=${plan}`)}`
        return
      }

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'Could not start checkout.')
      }

      window.location.href = data.url
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Could not start checkout.')
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      <FloatingNav />

      <main>
        <section className="relative overflow-hidden border-b border-outline-variant/30 bg-[#f6f0e7] pt-36">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white/70 px-3 py-2 text-sm font-bold text-primary shadow-sm">
                <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                7-day free trial on Pro
              </div>
              <h1 className="font-headline text-4xl font-extrabold leading-tight text-on-surface md:text-6xl">
                Pricing that matches focused practice.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant">
                Start with the free plan, then move to Pro when Hatch coaching, live AI interviews,
                and deeper practice limits become part of your weekly routine.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => startCheckout(billing)}
                  disabled={loadingPlan !== null}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white shadow-[0_14px_28px_rgba(74,124,89,0.20)] transition-colors hover:bg-[#3f6d4d] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingPlan === billing ? 'Opening Stripe...' : 'Start Pro trial'}
                  <span className="material-symbols-outlined text-[19px]">arrow_forward</span>
                </button>
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-outline-variant bg-white px-6 py-3 font-bold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
                >
                  Start free
                </Link>
              </div>
              {checkoutError && (
                <p className="mt-4 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {checkoutError}
                </p>
              )}
            </div>

            <div className="relative hidden min-h-[340px] items-end justify-center lg:flex">
              <div className="absolute inset-x-8 bottom-0 top-12 rounded-lg border border-primary/15 bg-white/50 shadow-[0_24px_70px_rgba(46,50,48,0.12)]" />
              <Image
                src="/images/hatch-mascot.png"
                alt=""
                width={320}
                height={320}
                priority
                className="relative z-10 h-auto w-72 drop-shadow-[0_26px_28px_rgba(46,50,48,0.20)]"
              />
              <div className="absolute bottom-8 left-0 z-20 rounded-lg border border-outline-variant/60 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(46,50,48,0.14)]">
                <p className="text-sm font-bold text-on-surface">Pro plan</p>
                <p className="mt-1 text-2xl font-extrabold text-primary">{displayPrice(activePrice)}</p>
                <p className="text-sm text-on-surface-variant">
                  per {activePrice.interval === 'year' ? 'year' : 'month'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="flex min-h-[560px] flex-col rounded-lg border border-outline-variant/60 bg-white p-7 shadow-[0_16px_34px_rgba(46,50,48,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-headline text-3xl font-extrabold text-on-surface">Free</h2>
                  <p className="mt-3 text-on-surface-variant">
                    A practical starting point for light practice and product fundamentals.
                  </p>
                </div>
                <span className="rounded-lg bg-[#efe8dc] px-3 py-1 text-sm font-bold text-on-surface-variant">
                  No card
                </span>
              </div>

              <div className="mt-8 flex items-end gap-2">
                <span className="font-headline text-5xl font-extrabold text-on-surface">$0</span>
                <span className="pb-2 font-semibold text-on-surface-variant">forever</span>
              </div>

              <ul className="mt-8 space-y-4">
                {FREE_LIMITS.map((feature) => (
                  <li key={feature} className="flex gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined mt-0.5 text-[20px] text-primary">
                      check_circle
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-auto inline-flex min-h-12 items-center justify-center rounded-lg border border-outline-variant bg-white px-6 py-3 font-bold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
              >
                Create free account
              </Link>
            </article>

            <article className="flex min-h-[560px] flex-col rounded-lg border border-primary/25 bg-white p-7 shadow-[0_20px_44px_rgba(74,124,89,0.13)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-headline text-3xl font-extrabold text-on-surface">Pro</h2>
                  <p className="mt-3 text-on-surface-variant">
                    Full practice capacity for interview prep, skill growth, and Hatch feedback.
                  </p>
                </div>
                <span className="rounded-lg bg-primary-container px-3 py-1 text-sm font-bold text-primary">
                  7-day trial
                </span>
              </div>

              <div className="mt-7 grid gap-2 rounded-lg bg-[#f0ece4] p-1 sm:grid-cols-2">
                {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => {
                  const selected = billing === cycle
                  const price = prices[cycle]
                  return (
                    <button
                      key={cycle}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setBilling(cycle)}
                      className={`rounded-lg px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'bg-white text-on-surface shadow-[0_1px_8px_rgba(46,50,48,0.12)]'
                          : 'text-on-surface-variant hover:bg-white/60'
                      }`}
                    >
                      <span className="block text-sm font-bold capitalize">{cycle}</span>
                      <span className="mt-1 block text-lg font-extrabold">
                        {displayPrice(price)}
                        <span className="text-sm font-semibold text-on-surface-variant">
                          {' '}
                          / {price.interval === 'year' ? 'yr' : 'mo'}
                        </span>
                      </span>
                      {cycle === 'annual' && annualSavings > 0 && (
                        <span className="mt-1 block text-xs font-bold text-primary">
                          Save {annualSavings}% at {annualMonthly}/mo
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <ul className="mt-8 space-y-4">
                {PRO_LIMITS.map((feature) => (
                  <li key={feature} className="flex gap-3 text-on-surface">
                    <span
                      className="material-symbols-outlined mt-0.5 text-[20px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    <span className="font-semibold">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <button
                  type="button"
                  onClick={() => startCheckout(billing)}
                  disabled={loadingPlan !== null}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white shadow-[0_14px_28px_rgba(74,124,89,0.20)] transition-colors hover:bg-[#3f6d4d] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingPlan === billing ? 'Opening Stripe...' : 'Start 7-day trial'}
                  <span className="material-symbols-outlined text-[19px]">arrow_forward</span>
                </button>
                <p className="mt-3 text-center text-sm font-semibold text-on-surface-variant">
                  Trial first. Cancel anytime from the customer portal.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="border-y border-outline-variant/30 bg-white py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="font-headline text-3xl font-extrabold text-on-surface md:text-4xl">
                  Plan comparison
                </h2>
                <p className="mt-3 max-w-2xl text-on-surface-variant">
                  Compare the limits that matter when practice becomes a weekly habit.
                </p>
              </div>
              <Link
                href="/terms"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-outline-variant px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
              >
                Billing terms
              </Link>
            </div>

            <div className="grid gap-3 md:hidden">
              {FEATURE_ROWS.map((row) => (
                <article
                  key={row.feature}
                  className="rounded-lg border border-outline-variant/60 bg-white p-5"
                >
                  <h3 className="font-bold text-on-surface">{row.feature}</h3>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div>
                      <p className="font-bold text-on-surface-variant">Free</p>
                      <p className="mt-1 text-on-surface-variant">{row.free}</p>
                    </div>
                    <div>
                      <p className="font-bold text-primary">Pro</p>
                      <p className="mt-1 font-semibold text-on-surface">{row.pro}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden rounded-lg border border-outline-variant/60 md:block">
              <table className="w-full border-collapse bg-white text-left">
                <thead className="bg-[#f6f0e7]">
                  <tr>
                    <th className="w-1/3 px-5 py-4 text-sm font-extrabold text-on-surface">
                      Feature
                    </th>
                    <th className="w-1/3 px-5 py-4 text-sm font-extrabold text-on-surface">
                      Free
                    </th>
                    <th className="w-1/3 px-5 py-4 text-sm font-extrabold text-on-surface">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ROWS.map((row) => (
                    <tr key={row.feature} className="border-t border-outline-variant/50">
                      <td className="px-5 py-4 font-bold text-on-surface">{row.feature}</td>
                      <td className="px-5 py-4 text-on-surface-variant">{row.free}</td>
                      <td className="px-5 py-4 font-semibold text-on-surface">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <GradientFooter />
    </div>
  )
}
