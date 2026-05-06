import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/site'

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
    <main className="min-h-screen bg-background text-on-surface">
      <section className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
          <div>
            <Link href="/" className="text-sm font-bold text-primary no-underline">
              HackProduct
            </Link>
            <p className="mt-8 text-xs font-black uppercase text-primary">Help Center</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-on-surface sm:text-5xl">
              Answers before launch.
            </h1>
          </div>
          <div className="max-w-2xl">
            <p className="text-lg leading-8 text-on-surface-variant">
              Use this page for account setup, Hatch coaching, streaks, billing, and support paths. The product is still moving quickly, so contact support when a workflow does not match what you see.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="mailto:hello@hackproduct.dev"
                className="rounded-md bg-primary px-4 py-2 text-sm font-black text-on-primary no-underline transition-opacity hover:opacity-90"
              >
                Contact support
              </Link>
              <Link
                href="/pricing"
                className="rounded-md border border-outline-variant px-4 py-2 text-sm font-black text-on-surface no-underline transition-colors hover:bg-surface-container"
              >
                View plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[240px_1fr] lg:px-8 lg:py-14">
        <aside className="hidden lg:block">
          <nav className="sticky top-8 space-y-2" aria-label="Help sections">
            {HELP_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-md px-3 py-2 text-sm font-bold text-on-surface-variant no-underline transition-colors hover:bg-surface-container-low hover:text-primary"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          {HELP_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-lg border border-outline-variant bg-background p-5 sm:p-6"
            >
              <h2 className="text-2xl font-black text-on-surface">{section.title}</h2>
              <ul className="mt-5 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-on-surface-variant">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
