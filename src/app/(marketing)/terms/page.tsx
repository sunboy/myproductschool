import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3ProseSection, V3ProseBlock } from '@/components/landing-v3/sections'

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
  {
    title: 'Changes To These Terms',
    body: [
      'These terms may change as the product, pricing, features, and legal requirements evolve.',
      'Material changes will be surfaced inside the product or by email to the account address before they take effect where required.',
      'Continued use of HackProduct after a change means the updated terms are accepted.',
    ],
  },
]

export default function TermsPage() {
  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: 'https://hackproduct.dev/' },
            { name: 'Terms of Service', path: 'https://hackproduct.dev/terms' },
          ]),
        ]}
      />

      <V3PageHero
        eyebrow="Terms of Service"
        title="Rules for using HackProduct."
        subtitle="These terms define account responsibilities, acceptable use, billing rules, content rights, affiliate terms, and the limits of Hatch coaching."
      />

      <V3ProseSection>
        <V3ProseBlock>
          <p>Last updated: June 1, 2026</p>
        </V3ProseBlock>

        {TERMS_SECTIONS.map((section) => (
          <V3ProseBlock key={section.title} title={section.title}>
            <ul>
              {section.body.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </V3ProseBlock>
        ))}

        <V3ProseBlock title="Contact">
          <p>
            Questions about these terms can be sent to{' '}
            <a href="mailto:founders@hackproduct.com">founders@hackproduct.com</a>. Include the
            account email address and the request topic.
          </p>
        </V3ProseBlock>
      </V3ProseSection>
    </V3PageShell>
  )
}
