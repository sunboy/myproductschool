import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/site'

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service | HackProduct',
  description: 'The rules for using HackProduct, Hatch coaching, subscriptions, billing, user content, and affiliate features.',
  path: '/terms',
})

const TERMS_SECTIONS = [
  {
    title: 'Agreement',
    body: [
      'These terms govern access to HackProduct, including practice workspaces, Hatch coaching, live interviews, billing, affiliate tools, and related services.',
      'By creating an account, starting a trial, buying a subscription, or using the product, the account holder accepts these terms.',
      'If an account is used for a company, school, or other organization, the person creating the account confirms they have authority to bind that organization.',
    ],
  },
  {
    title: 'Accounts',
    body: [
      'Account information must be accurate and kept current.',
      'Account holders are responsible for activity under their login, including actions from linked identity providers.',
      'HackProduct may require email verification, bot checks, rate limits, reauthentication, or other security steps before allowing sensitive actions.',
      'Accounts may not be sold, rented, shared broadly, or used to bypass plan limits.',
    ],
  },
  {
    title: 'Product Use',
    body: [
      'HackProduct is for learning, interview practice, product judgment training, and related professional development.',
      'Hatch coaching is automated and may be incomplete, inaccurate, or outdated. It should not be treated as legal, financial, medical, tax, or employment advice.',
      'Users are responsible for reviewing outputs before relying on them in interviews, work, school, or public material.',
      'The product may change as new practice modes, limits, pricing, and safety controls are added.',
    ],
  },
  {
    title: 'Acceptable Use',
    body: [
      'Do not submit unlawful, harmful, harassing, hateful, sexually exploitative, infringing, deceptive, or abusive content.',
      'Do not attempt to extract system instructions, bypass plan limits, overload AI routes, abuse referrals, scrape private data, attack infrastructure, or interfere with another account.',
      'Do not upload confidential employer, customer, candidate, or third-party data unless permission has been granted.',
      'HackProduct may remove content, limit access, suspend accounts, or report activity when required for safety, security, fraud prevention, or legal reasons.',
    ],
  },
  {
    title: 'User Content',
    body: [
      'Account holders keep ownership of submitted answers, diagrams, code, comments, discussions, and profile content.',
      'HackProduct receives the rights needed to host, process, display, moderate, back up, analyze, and improve the service using that content.',
      'Discussion posts and shared scorecards may be visible to other users or public visitors depending on the feature selected.',
      'Feedback, bug reports, feature requests, and suggestions may be used without compensation.',
    ],
  },
  {
    title: 'Subscriptions And Billing',
    body: [
      'Paid plans, trials, prices, taxes, and usage limits are shown at checkout or inside the product.',
      'Stripe processes payments, billing portal sessions, invoices, refunds, tax calculations, coupons, trials, and payment method updates.',
      'A 7-day free trial may convert to a paid subscription unless canceled before the trial ends.',
      'Subscriptions renew automatically until canceled. Cancellation takes effect at the end of the current billing period unless Stripe or the account settings show a different result.',
      'Refunds are handled case by case unless a separate written refund policy applies.',
    ],
  },
  {
    title: 'Affiliate Program',
    body: [
      'Affiliate access may require Stripe Connect onboarding and approval.',
      'Affiliate codes, discounts, commissions, and payout cadence may change or end at any time.',
      'Fraudulent clicks, self-referrals, misleading promotion, paid ad abuse, coupon leakage, or other manipulative activity can void commissions.',
      'Payouts depend on Stripe Connect availability, account status, identity checks, tax requirements, and minimum operational thresholds.',
    ],
  },
  {
    title: 'Intellectual Property',
    body: [
      'HackProduct, Hatch, product design, curriculum, rubrics, scoring methods, prompts, branding, and software remain HackProduct property or licensed material.',
      'No right is granted to copy, resell, host, reverse engineer, or build a competing service from private product content, prompts, or non-public workflows.',
      'Open source dependencies remain governed by their own licenses.',
    ],
  },
  {
    title: 'Disclaimers And Limits',
    body: [
      'The service is provided as available and may have bugs, interruptions, data loss, or inaccurate outputs.',
      'HackProduct does not promise interview outcomes, job offers, promotions, admissions, revenue, or professional results.',
      'To the maximum extent allowed by law, HackProduct is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages.',
      'Where liability cannot be excluded, total liability is limited to the amount paid to HackProduct in the 3 months before the claim.',
    ],
  },
  {
    title: 'Termination',
    body: [
      'An account holder may stop using the product or delete an account through available settings or support channels.',
      'HackProduct may suspend or terminate access for violations, payment failure, security risk, fraud risk, legal requirements, or discontinued services.',
      'Some terms survive termination, including billing obligations, intellectual property rights, limitation of liability, dispute provisions, and records retained under the privacy policy.',
    ],
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-on-surface">
      <section className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
          <div>
            <Link href="/" className="text-sm font-bold text-primary no-underline">
              HackProduct
            </Link>
            <p className="mt-8 text-xs font-black uppercase text-primary">Terms of Service</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-on-surface sm:text-5xl">
              Rules for using HackProduct.
            </h1>
          </div>
          <div className="max-w-2xl">
            <p className="text-lg leading-8 text-on-surface-variant">
              These terms define account responsibilities, acceptable use, billing rules, content rights, affiliate terms, and the limits of Hatch coaching.
            </p>
            <div className="mt-6 rounded-lg border border-primary/25 bg-primary-container/40 p-4 text-sm font-semibold leading-6 text-on-surface">
              Placeholder: needs legal review before public launch.
            </div>
            <p className="mt-5 text-sm text-on-surface-variant">Last updated: May 6, 2026</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[240px_1fr] lg:px-8 lg:py-14">
        <aside className="hidden lg:block">
          <nav className="sticky top-8 space-y-2" aria-label="Terms sections">
            {TERMS_SECTIONS.map((section) => (
              <a
                key={section.title}
                href={`#${section.title.toLowerCase().replaceAll(' ', '-')}`}
                className="block rounded-md px-3 py-2 text-sm font-bold text-on-surface-variant no-underline transition-colors hover:bg-surface-container-low hover:text-primary"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          {TERMS_SECTIONS.map((section) => (
            <section
              key={section.title}
              id={section.title.toLowerCase().replaceAll(' ', '-')}
              className="rounded-lg border border-outline-variant bg-background p-5 sm:p-6"
            >
              <h2 className="text-2xl font-black text-on-surface">{section.title}</h2>
              <ul className="mt-5 space-y-3">
                {section.body.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-on-surface-variant">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="rounded-lg border border-outline-variant bg-surface-container-low p-5 sm:p-6">
            <h2 className="text-2xl font-black text-on-surface">Contact</h2>
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">
              Questions about these terms can be sent to{' '}
              <a className="font-bold text-primary" href="mailto:legal@hackproduct.dev">
                legal@hackproduct.dev
              </a>
              . Include the account email address and the request topic.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
