'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ShieldCheck, Sparkles } from 'lucide-react'
import { PricingCta } from './PricingCta'
import { isAnalyticsFeatureEnabled } from '@/lib/flags/analytics'
import { annualAnalyticsSavingsPercent, type BillingPlanId } from '@/lib/billing/plans'
import {
  usePlanPrices,
  fallbackPrice,
  displayPrice,
  monthlyEquivalent,
  savingsPercent,
} from '@/lib/billing/use-plan-prices'
import { usePlanLimits } from '@/lib/usage/use-plan-limits'

const proFeatures = [
  'Live interviews across product, system design, SQL, and coding',
  'Live AI data analyst sessions, using Claude Code',
  'Hatch feedback and scoring on every answer',
  'Autopsies, study plans, and Hatch coaching included',
]

const analyticsFeatures = [
  'Everything in Pro',
  'Live Claude Code sessions on real BigQuery data',
  'Hatch coaching inside the terminal',
  'Reusable skills and shareable analyst reports',
]

const CYCLES: BillingPlanId[] = ['monthly', 'annual']

export function V3PricingSection() {
  const analyticsEnabled = isAnalyticsFeatureEnabled()
  const prices = usePlanPrices()
  // Live plan_limits values (60s-cached API); never hardcode allowance numbers.
  const limits = usePlanLimits()
  const [proBilling, setProBilling] = useState<BillingPlanId>('annual')
  // Analytics tier has its own monthly/annual sub-toggle, independent of Pro's.
  const [analyticsBilling, setAnalyticsBilling] = useState<BillingPlanId>('annual')

  const proPrice = prices[proBilling]
  const proSavings = savingsPercent(prices)
  const proAnnualMonthly = monthlyEquivalent(prices.annual)

  // Static fallback prices for the analytics tier (no live fetch for the card;
  // the checkout route resolves the real Stripe price at purchase).
  const analyticsPrices = {
    monthly: fallbackPrice('analytics_monthly'),
    annual: fallbackPrice('analytics_annual'),
  }
  const analyticsPrice = analyticsPrices[analyticsBilling]
  const analyticsSavings = annualAnalyticsSavingsPercent()
  const analyticsAnnualMonthly = monthlyEquivalent(analyticsPrices.annual)
  const analyticsPlanParam =
    analyticsBilling === 'monthly' ? 'analytics_monthly' : 'analytics_annual'

  return (
    <section className="pricing-section" id="pricing" aria-labelledby="pricing-heading">
      <div className="shell pricing-shell">
        <div className="pricing-copy">
          <h2 id="pricing-heading">One practice system. The plan that fits your learning needs.</h2>
          <p>AI coaching, real interview practice, and scoring in one place.</p>
        </div>

        <div
          className={analyticsEnabled ? 'pricing-grid pricing-grid-three' : 'pricing-grid'}
          aria-label="HackProduct pricing"
        >
          <article className="pricing-card">
            <div className="pricing-card-top">
              <span className="pricing-badge">Free forever</span>
            </div>
            <h3>Free</h3>
            <div className="pricing-price">
              <span>$0</span>
              <small>/ forever</small>
            </div>
            <p className="pricing-card-copy">
              Enough monthly practice to test the system before you commit anything.
            </p>
            <ul>
              <li>
                <Check aria-hidden="true" strokeWidth={2.2} />
                <span>{limits.free.challenges} practice challenges each month</span>
              </li>
              <li>
                <Check aria-hidden="true" strokeWidth={2.2} />
                <span>{limits.free.interviews} live interviews each month</span>
              </li>
              <li>
                <Check aria-hidden="true" strokeWidth={2.2} />
                <span>Hatch feedback on every answer</span>
              </li>
              <li>
                <Check aria-hidden="true" strokeWidth={2.2} />
                <span>No credit card required</span>
              </li>
            </ul>
            <PricingCta className="btn btn-outline-dark pricing-cta" next="/dashboard">
              Start free
            </PricingCta>
          </article>

          <article className="pricing-card pricing-card-featured">
            <div className="pricing-card-top">
              <span className="pricing-badge">7-day trial</span>
              <Sparkles aria-hidden="true" strokeWidth={2} />
            </div>
            <h3>Pro</h3>
            <div className="pricing-price">
              <span>{displayPrice(proPrice)}</span>
              <small>/ {proPrice.interval === 'year' ? 'year' : 'month'}</small>
            </div>
            <p className="pricing-card-copy">
              Full practice capacity for interview prep, skill growth, and Hatch feedback.
            </p>

            <div className="pricing-toggle" role="group" aria-label="Pro billing cycle">
              {CYCLES.map((cycle) => {
                const selected = proBilling === cycle
                const price = prices[cycle]
                return (
                  <button
                    key={cycle}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setProBilling(cycle)}
                    data-selected={selected ? 'true' : undefined}
                    className="pricing-toggle-btn"
                  >
                    <span className="pricing-toggle-label">{cycle}</span>
                    <span className="pricing-toggle-price">
                      {displayPrice(price)} / {price.interval === 'year' ? 'yr' : 'mo'}
                    </span>
                    {cycle === 'annual' && proSavings > 0 && (
                      <span className="pricing-toggle-save">
                        Save {proSavings}% at {proAnnualMonthly}/mo
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <ul>
              {proFeatures.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden="true" strokeWidth={2.2} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <PricingCta
              className="btn btn-amber pricing-cta"
              next={`/pricing?plan=${proBilling}&checkout=1`}
            >
              Start your free trial
            </PricingCta>
          </article>

          {/* Claude Code Analytics — special tier. Only rendered when the feature
              flag is on; never visible while the feature ships dark. */}
          {analyticsEnabled && (
            <article className="pricing-card">
              <div className="pricing-card-top">
                <span className="pricing-badge">Includes Pro</span>
                <Sparkles aria-hidden="true" strokeWidth={2} />
              </div>
              <h3>Analytics</h3>
              <div className="pricing-price">
                <span>{displayPrice(analyticsPrice)}</span>
                <small>/ {analyticsPrice.interval === 'year' ? 'year' : 'month'}</small>
              </div>
              <p className="pricing-card-copy">
                Everything in Pro, plus live Claude Code analytics sessions on real datasets.
              </p>

              <div className="pricing-toggle" role="group" aria-label="Analytics billing cycle">
                {CYCLES.map((cycle) => {
                  const selected = analyticsBilling === cycle
                  const price = analyticsPrices[cycle]
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
                      {cycle === 'annual' && analyticsSavings > 0 && (
                        <span className="pricing-toggle-save">
                          Save {analyticsSavings}% at {analyticsAnnualMonthly}/mo
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <ul>
                {analyticsFeatures.map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden="true" strokeWidth={2.2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <PricingCta
                className="btn btn-outline-dark pricing-cta"
                next={`/pricing?plan=${analyticsPlanParam}&checkout=1`}
              >
                Get Analytics
              </PricingCta>
            </article>
          )}
        </div>

        <div className="pricing-note">
          <ShieldCheck aria-hidden="true" strokeWidth={2} />
          <span>
            Need the full plan comparison? Visit <Link href="/pricing">pricing</Link>. Billing is
            handled through Stripe.
          </span>
        </div>
      </div>
    </section>
  )
}
