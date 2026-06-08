import Link from 'next/link'
import { Check, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { PricingCta } from './PricingCta'

const monthlyFeatures = [
  'Live interviews across product, system design, SQL, and coding',
  'Live AI data analyst sessions, using Claude Code',
  'Hatch feedback and scoring on every answer',
]

const annualFeatures = [
  'Best value for an interview season',
  'Autopsies, study plans, and Hatch coaching included',
  'Lower monthly cost, same full access',
]

export function V3PricingSection() {
  return (
    <section className="pricing-section" id="pricing" aria-labelledby="pricing-heading">
      <div className="shell pricing-shell">
        <div className="pricing-copy">
          <h2 id="pricing-heading">One practice system. Two ways to commit.</h2>
          <p>
            AI coaching, real interview practice, and scoring in one place.
          </p>
        </div>

        <div className="pricing-grid" aria-label="HackProduct Pro pricing">
          <article className="pricing-card">
            <div className="pricing-card-top">
              <span className="pricing-badge">Flexible monthly practice</span>
              <Zap aria-hidden="true" strokeWidth={2} />
            </div>
            <h3>Monthly</h3>
            <div className="pricing-price">
              <span>$39</span>
              <small>/ month</small>
            </div>
            <p className="pricing-card-copy">
              Start training now and keep full Pro access while your interview loop is active.
            </p>
            <ul>
              {monthlyFeatures.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden="true" strokeWidth={2.2} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <PricingCta className="btn btn-forest pricing-cta" next="/pricing?plan=monthly">
              Start training with Hatch
            </PricingCta>
          </article>

          <article className="pricing-card pricing-card-featured">
            <div className="pricing-card-top">
              <span className="pricing-badge">Best for interview season</span>
              <Sparkles aria-hidden="true" strokeWidth={2} />
            </div>
            <h3>Annual</h3>
            <div className="pricing-price">
              <span>$199</span>
              <small>/ year</small>
            </div>
            <p className="pricing-card-copy">
              Commit to the full practice system for roughly $16.58 per month.
            </p>
            <ul>
              {annualFeatures.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden="true" strokeWidth={2.2} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <PricingCta className="btn btn-amber pricing-cta" next="/pricing?plan=annual">
              Start training with Hatch
            </PricingCta>
          </article>
        </div>

        <div className="pricing-note">
          <ShieldCheck aria-hidden="true" strokeWidth={2} />
          <span>
            Need the full plan comparison? Visit <Link href="/pricing">pricing</Link>. Billing is handled through Stripe.
          </span>
        </div>
      </div>
    </section>
  )
}
