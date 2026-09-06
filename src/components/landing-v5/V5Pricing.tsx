"use client";

import { useState } from "react";
import { CheckIcon } from "./icons";
import { Reveal } from "./motion";
import { PricingCta } from "@/components/landing-v3/PricingCta";
import { isAnalyticsFeatureEnabled } from "@/lib/flags/analytics";
import { annualAnalyticsSavingsPercent, type BillingPlanId } from "@/lib/billing/plans";
import {
  usePlanPrices,
  fallbackPrice,
  displayPrice,
  monthlyEquivalent,
  savingsPercent,
} from "@/lib/billing/use-plan-prices";
import { usePlanLimits } from "@/lib/usage/use-plan-limits";

export function V5Pricing() {
  const analyticsEnabled = isAnalyticsFeatureEnabled();
  // Live Pro prices, seeded from a static fallback then overridden by a
  // /api/billing/prices fetch — see use-plan-prices.ts.
  const prices = usePlanPrices();
  // Live plan_limits values, 60s-cached (module-level cache in use-plan-limits.ts
  // and a server-side 60s cache behind /api/billing/limits). Never hardcode
  // allowance numbers in this copy per CLAUDE.md.
  const limits = usePlanLimits();

  // v5's design shares one billing toggle across all three cards, unlike
  // V3PricingSection's independent per-plan toggles. Simpler, and fine here.
  const [annual, setAnnual] = useState(true);
  const billing: BillingPlanId = annual ? "annual" : "monthly";

  const proPrice = prices[billing];
  const proSavings = savingsPercent(prices);
  const proAnnualMonthly = monthlyEquivalent(prices.annual);

  // Static fallback for the Analytics tier (no live fetch for the card; the
  // checkout route resolves the real Stripe price at purchase), same pattern
  // as V3PricingSection.
  const analyticsPrices = {
    monthly: fallbackPrice("analytics_monthly"),
    annual: fallbackPrice("analytics_annual"),
  };
  const analyticsPrice = analyticsPrices[billing];
  const analyticsSavings = annualAnalyticsSavingsPercent();
  const analyticsAnnualMonthly = monthlyEquivalent(analyticsPrices.annual);
  const analyticsPlanParam = annual ? "analytics_annual" : "analytics_monthly";

  return (
    <section className="section pricing-section" id="pricing">
      <div className="page-shell">
        <Reveal className="pricing-heading">
          <div>
            <div className="eyebrow">PRICING</div>
            <h2>Choose how you want to practice.</h2>
            <p>Start free. Upgrade for unlimited practice or live AI-directed analytics.</p>
          </div>
          <div className="billing-toggle" role="group" aria-label="Billing interval">
            <button type="button" aria-pressed={!annual} className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button>
            <button type="button" aria-pressed={annual} className={annual ? "active" : ""} onClick={() => setAnnual(true)}>Annual</button>
          </div>
        </Reveal>
        <div className="pricing-grid">
          <Reveal className="plan-card">
            <div className="plan-name">Free</div>
            <div className="plan-price">$0<small> / forever</small></div>
            <p className="plan-description">Explore the core practice areas and see how detailed review works before upgrading.</p>
            <ul>
              <li><span><CheckIcon size={15}/></span>{limits.free.challenges} practice challenges each month</li>
              <li><span><CheckIcon size={15}/></span>{limits.free.interviews} live interviews each month</li>
              <li><span><CheckIcon size={15}/></span>Feedback on every submission</li>
              <li><span><CheckIcon size={15}/></span>No credit card required</li>
            </ul>
            <PricingCta className="plan-cta outline-button" next="/dashboard">
              Start with Free
            </PricingCta>
          </Reveal>

          <Reveal delay={65} className="plan-card featured">
            <span className="plan-label">Most popular</span>
            <div className="plan-name">Pro</div>
            <div className="plan-price">
              {displayPrice(proPrice)}
              <small>{annual ? " / year" : " / month"}</small>
            </div>
            {annual && proSavings > 0 && (
              <div className="annual-note">Save {proSavings}% at {proAnnualMonthly}/mo</div>
            )}
            <p className="plan-description">Full practice capacity for interview prep and skill growth across the core platform.</p>
            <ul>
              <li><span><CheckIcon size={15}/></span>Unlimited coding, SQL, system design, and product judgment practice</li>
              <li><span><CheckIcon size={15}/></span>Live interviews</li>
              <li><span><CheckIcon size={15}/></span>Full scoring and review</li>
              <li><span><CheckIcon size={15}/></span>7-day trial</li>
            </ul>
            <PricingCta className="plan-cta button" next={`/pricing?plan=${billing}&checkout=1`}>
              Start Pro trial
            </PricingCta>
          </Reveal>

          {analyticsEnabled && (
            <Reveal delay={130} className="plan-card analytics">
              <div className="plan-name">Analytics</div>
              <div className="plan-price">
                {displayPrice(analyticsPrice)}
                <small>{annual ? " / year" : " / month"}</small>
              </div>
              {annual && analyticsSavings > 0 && (
                <div className="annual-note">Save {analyticsSavings}% at {analyticsAnnualMonthly}/mo</div>
              )}
              <p className="plan-description">Everything in Pro, plus live AI-directed analytics sessions on real datasets.</p>
              <ul>
                <li><span><CheckIcon size={15}/></span>Everything in Pro</li>
                <li><span><CheckIcon size={15}/></span>Live AI-directed analytics sessions</li>
                <li><span><CheckIcon size={15}/></span>Real dataset workflows</li>
                <li><span><CheckIcon size={15}/></span>Grading on scoping, direction, and catching mistakes</li>
              </ul>
              <PricingCta className="plan-cta amber-cta" next={`/pricing?plan=${analyticsPlanParam}&checkout=1`}>
                Start Analytics trial
              </PricingCta>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
