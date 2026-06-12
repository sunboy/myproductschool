'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Check, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import {
  BILLING_PLANS,
  ANALYTICS_PLANS,
  annualSavingsPercent,
  formatPlanPrice,
  type BillingInterval,
  type BillingPlanId,
  type AnyPlanId,
} from '@/lib/billing/plans'
import { isAnalyticsFeatureEnabled } from '@/lib/flags/analytics'
import { DEFAULT_PLAN_LIMITS, type PublicPlanLimits } from '@/lib/usage/plan-limits-shared'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_PRICING_VIEWED, EVENT_CHECKOUT_STARTED } from '@/lib/posthog/events'

type BillingCycle = BillingPlanId

interface PlanPrice {
  id: AnyPlanId
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

// Limit numbers come from plan_limits (via the server page) so edits in
// /admin/paywall-config show up here without a deploy.
function freeLimits(limits: PublicPlanLimits) {
  return [
    `${limits.free.challenges} challenge starts per month`,
    `${limits.free.interviews} live AI interview starts per month`,
    'Starter Hatch AI budget',
    'Core practice library',
    'Progress history',
  ]
}

function proLimits(limits: PublicPlanLimits) {
  return [
    `${limits.pro.challenges} challenge starts per month`,
    `${limits.pro.interviews} live AI interview starts per month`,
    'Fair-use Hatch AI coaching budget',
    'Learner DNA, failure patterns, and study plans',
  ]
}

const ANALYTICS_LIMITS = [
  'Everything in Pro',
  'Live Claude Code sessions on real BigQuery data',
  'Hatch coaching inside the terminal',
  'Reusable skills and shareable analyst reports',
]

function featureRows(limits: PublicPlanLimits) {
  return [
  {
    feature: 'Challenge starts',
    free: `${limits.free.challenges} per month`,
    pro: `${limits.pro.challenges} per month`,
  },
  {
    feature: 'Hatch AI coaching',
    free: 'Starter budget',
    pro: 'Fair-use coaching budget',
  },
  {
    feature: 'Live AI interviews',
    free: `${limits.free.interviews} starts per month`,
    pro: `${limits.pro.interviews} starts per month`,
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
}

function fallbackPrice(planId: AnyPlanId): PlanPrice {
  const plan = planId === 'analytics_monthly' || planId === 'analytics_annual'
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

interface PricingClientProps {
  limits?: PublicPlanLimits
}

export function PricingClient({ limits = DEFAULT_PLAN_LIMITS }: PricingClientProps) {
  const FREE_LIMITS = freeLimits(limits)
  const PRO_LIMITS = proLimits(limits)
  const FEATURE_ROWS = featureRows(limits)
  const analyticsEnabled = isAnalyticsFeatureEnabled()
  const [billing, setBilling] = useState<BillingCycle>('annual')
  const [prices, setPrices] = useState<BillingPrices>(INITIAL_PRICES)
  // Analytics tier has its own monthly/annual sub-toggle, independent of Pro's.
  const [analyticsBilling, setAnalyticsBilling] = useState<BillingCycle>('annual')
  const [loadingPlan, setLoadingPlan] = useState<AnyPlanId | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Static fallback prices for the analytics tier (no live fetch needed for the
  // card; the checkout route resolves the real Stripe price at purchase).
  const analyticsPrices = {
    analytics_monthly: fallbackPrice('analytics_monthly'),
    analytics_annual: fallbackPrice('analytics_annual'),
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('plan') === 'monthly') setBilling('monthly')
    trackEvent(EVENT_PRICING_VIEWED)
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

  async function startCheckout(plan: AnyPlanId) {
    if (loadingPlan) return
    setCheckoutError(null)
    setLoadingPlan(plan)
    trackEvent(EVENT_CHECKOUT_STARTED, { plan })

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
    <>
      <section className="v3-page-hero">
        <div className="shell">
          <div className="v3-page-hero-inner">
            <p className="eyebrow">
              <span className="dot" />
              7-day free trial on Pro
            </p>
            <h1>Pricing that matches focused practice.</h1>
            <p className="v3-page-hero-sub">
              Start with the free plan, then move to Pro when Hatch coaching, live AI interviews,
              and deeper practice limits become part of your weekly routine.
            </p>
            <div className="v3-page-hero-cta">
              <button
                type="button"
                onClick={() => startCheckout(billing)}
                disabled={loadingPlan !== null}
                className="btn btn-forest"
              >
                {loadingPlan === billing ? 'Opening Stripe...' : 'Start Pro trial'}{' '}
                <span aria-hidden>→</span>
              </button>
              <Link href="/signup" className="btn btn-primary">
                Start free <span aria-hidden>→</span>
              </Link>
            </div>
            {checkoutError && (
              <p
                role="alert"
                className="v3-page-hero-sub"
                style={{ color: '#b83230', marginTop: 16 }}
              >
                {checkoutError}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="shell pricing-shell">
          <div className="pricing-copy">
            <h2>One practice system. The plan that fits your sprint.</h2>
            <p>
              Free to start, then a single Pro tier that unlocks Hatch coaching, live AI
              interviews, scoring, autopsies, and study plans in one place.
            </p>
          </div>

          <div
            className={analyticsEnabled ? 'pricing-grid pricing-grid-three' : 'pricing-grid'}
            aria-label="HackProduct pricing"
          >
            <article className="pricing-card">
              <div className="pricing-card-top">
                <span className="pricing-badge">No card required</span>
                <Zap aria-hidden="true" strokeWidth={2} />
              </div>
              <h3>Free</h3>
              <div className="pricing-price">
                <span>$0</span>
                <small>forever</small>
              </div>
              <p className="pricing-card-copy">
                A practical starting point for light practice and product fundamentals.
              </p>
              <ul>
                {FREE_LIMITS.map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden="true" strokeWidth={2.2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-primary pricing-cta">
                Create free account <span aria-hidden>→</span>
              </Link>
            </article>

            <article className="pricing-card pricing-card-featured">
              <div className="pricing-card-top">
                <span className="pricing-badge">7-day trial</span>
                <Sparkles aria-hidden="true" strokeWidth={2} />
              </div>
              <h3>Pro</h3>
              <div className="pricing-price">
                <span>{displayPrice(activePrice)}</span>
                <small>/ {activePrice.interval === 'year' ? 'year' : 'month'}</small>
              </div>
              <p className="pricing-card-copy">
                Full practice capacity for interview prep, skill growth, and Hatch feedback.
              </p>

              <div className="pricing-toggle" role="group" aria-label="Pro billing cycle">
                {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => {
                  const selected = billing === cycle
                  const price = prices[cycle]
                  return (
                    <button
                      key={cycle}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setBilling(cycle)}
                      data-selected={selected ? 'true' : undefined}
                      className="pricing-toggle-btn"
                    >
                      <span className="pricing-toggle-label">{cycle}</span>
                      <span className="pricing-toggle-price">
                        {displayPrice(price)} / {price.interval === 'year' ? 'yr' : 'mo'}
                      </span>
                      {cycle === 'annual' && annualSavings > 0 && (
                        <span className="pricing-toggle-save">
                          Save {annualSavings}% at {annualMonthly}/mo
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <ul>
                {PRO_LIMITS.map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden="true" strokeWidth={2.2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => startCheckout(billing)}
                disabled={loadingPlan !== null}
                className="btn btn-amber pricing-cta"
              >
                {loadingPlan === billing ? 'Opening Stripe...' : 'Start 7-day trial'}{' '}
                <span aria-hidden>→</span>
              </button>
            </article>

            {/* Claude Code Analytics — special tier. Only rendered when the
                feature flag is on; never visible while the feature ships dark. */}
            {analyticsEnabled && (() => {
              const aPrice = analyticsPrices[analyticsBilling === 'monthly' ? 'analytics_monthly' : 'analytics_annual']
              const aPlanId: AnyPlanId = analyticsBilling === 'monthly' ? 'analytics_monthly' : 'analytics_annual'
              const aAnnualMonthly = monthlyEquivalent(analyticsPrices.analytics_annual)
              const aSavings = Math.round(
                ((analyticsPrices.analytics_monthly.unitAmount * 12 - analyticsPrices.analytics_annual.unitAmount) /
                  (analyticsPrices.analytics_monthly.unitAmount * 12)) * 100,
              )
              return (
                <article className="pricing-card">
                  <div className="pricing-card-top">
                    <span className="pricing-badge">Includes Pro</span>
                    <Sparkles aria-hidden="true" strokeWidth={2} />
                  </div>
                  <h3>Analytics</h3>
                  <div className="pricing-price">
                    <span>{displayPrice(aPrice)}</span>
                    <small>/ {aPrice.interval === 'year' ? 'year' : 'month'}</small>
                  </div>
                  <p className="pricing-card-copy">
                    Everything in Pro, plus live Claude Code analytics sessions on real datasets.
                  </p>

                  <div className="pricing-toggle" role="group" aria-label="Analytics billing cycle">
                    {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => {
                      const selected = analyticsBilling === cycle
                      const price = analyticsPrices[cycle === 'monthly' ? 'analytics_monthly' : 'analytics_annual']
                      return (
                        <button
                          key={cycle}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setAnalyticsBilling(cycle)}
                          data-selected={selected ? 'true' : undefined}
                          className="pricing-toggle-btn"
                        >
                          <span className="pricing-toggle-label">{cycle}</span>
                          <span className="pricing-toggle-price">
                            {displayPrice(price)} / {price.interval === 'year' ? 'yr' : 'mo'}
                          </span>
                          {cycle === 'annual' && aSavings > 0 && (
                            <span className="pricing-toggle-save">
                              Save {aSavings}% at {aAnnualMonthly}/mo
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <ul>
                    {ANALYTICS_LIMITS.map((feature) => (
                      <li key={feature}>
                        <Check aria-hidden="true" strokeWidth={2.2} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => startCheckout(aPlanId)}
                    disabled={loadingPlan !== null}
                    className="btn btn-forest pricing-cta"
                  >
                    {loadingPlan === aPlanId ? 'Opening Stripe...' : 'Get Analytics'}{' '}
                    <span aria-hidden>→</span>
                  </button>
                </article>
              )
            })()}
          </div>

          <div className="pricing-note">
            <ShieldCheck aria-hidden="true" strokeWidth={2} />
            <span>
              Trial first. Cancel anytime from the customer portal. Billing is handled through Stripe.
            </span>
          </div>
        </div>
      </section>

      <section className="v3-section">
        <div className="shell">
          <div className="v3-section-head">
            <h2>Plan comparison</h2>
            <p>Compare the limits that matter when practice becomes a weekly habit.</p>
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

          <div className="hidden overflow-x-auto rounded-lg border border-outline-variant/60 md:block">
            <table className="w-full min-w-[40rem] border-collapse bg-white text-left">
              <thead className="bg-surface-container">
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

          <div className="v3-page-hero-cta" style={{ marginTop: 24 }}>
            <Link href="/terms" className="btn btn-primary">
              Billing terms <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
