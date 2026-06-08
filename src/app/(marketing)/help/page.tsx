import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'Help Center | HackProduct',
  description: 'Answers for getting started, Hatch coaching, streaks, billing, account security, and support.',
  path: '/help',
})

const HELP_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      'Create an account, verify email, and finish onboarding so HackProduct can set the right starting point.',
      'Start with the dashboard recommendation if the practice hub feels too broad.',
      'Use Quick Take for a short rep, a full challenge for FLOW practice, and live interviews for timed sessions.',
    ],
  },
  {
    id: 'hatch',
    title: 'How Hatch Works',
    items: [
      'Hatch reads the challenge context, your draft, and your recent practice signals when coaching is available.',
      'Hatch can be wrong or incomplete. Treat coaching as practice feedback, not professional advice.',
      'Keep private employer, customer, candidate, and third-party data out of practice prompts unless you have permission.',
    ],
  },
  {
    id: 'streaks',
    title: 'Streaks And XP',
    items: [
      'A streak counts when a qualifying practice activity is completed for the day.',
      'XP reflects challenge difficulty, score quality, and eligible streak multipliers.',
      'If a score or streak looks wrong, contact support with the challenge title and completion time.',
    ],
  },
  {
    id: 'billing',
    title: 'Billing And Plans',
    items: [
      'The free plan has monthly practice and Hatch limits. Pro raises those limits and opens paid practice surfaces.',
      'Billing, payment methods, cancellation, coupons, tax, and invoices are handled through Stripe.',
      'Open Settings, then Manage billing, to update a card or review subscription status.',
    ],
  },
  {
    id: 'account-security',
    title: 'Account And Security',
    items: [
      'HackProduct supports email and password, magic link sign-in, password reset, and Google account linking.',
      'Sensitive settings actions can require a fresh password confirmation.',
      'Use the forgot-password flow if you lose access to a password-based account.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    items: [
      'For support, email hello@hackproduct.dev from the account email when possible.',
      'For privacy requests, email privacy@hackproduct.dev.',
      'For billing questions, include the Stripe invoice number if you have it.',
    ],
  },
]

export default function HelpPage() {
  return (
    <V3PageShell>
      <V3PageHero
        eyebrow="Help Center"
        title="Answers before launch."
        subtitle="Use this page for account setup, Hatch coaching, streaks, billing, and support paths. The product is still moving quickly, so contact support when a workflow does not match what you see."
        ctas={[
          { label: 'Contact support', href: 'mailto:hello@hackproduct.dev' },
          { label: 'View plans', href: '/pricing', variant: 'amber' },
        ]}
      />

      {HELP_SECTIONS.map((section) => (
        <V3Section key={section.id} title={section.title}>
          <V3CardGrid>
            {section.items.map((item) => (
              <V3Card key={item} title={item} />
            ))}
          </V3CardGrid>
        </V3Section>
      ))}

      <V3CtaBand
        title="Still stuck?"
        subtitle="Email support from your account address and we will help."
        ctas={[{ label: 'Contact support', href: 'mailto:hello@hackproduct.dev' }]}
      />
    </V3PageShell>
  )
}
