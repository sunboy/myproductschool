import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/site'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy | HackProduct',
  description: 'How HackProduct collects, uses, stores, and deletes account, practice, billing, and coaching data.',
  path: '/privacy',
})

const DATA_SECTIONS = [
  {
    title: 'Data We Collect',
    body: [
      'Account data: name, email address, authentication provider, avatar, password hash handled by Supabase, linked identity data, and account security events.',
      'Profile data: plan, onboarding answers, role preferences, calibration results, skill progress, streak state, XP, saved settings, notification choices, and referral attribution.',
      'Practice data: challenge starts, submissions, answers, diagrams, code, test results, discussion posts, replies, votes, reports, feedback, scorecards, and learning history.',
      'Hatch coaching data: messages, prompts, generated feedback, usage counts, safety signals, and voice-rule replacement logs when model output is cleaned before display.',
      'Billing data: Stripe customer, subscription, invoice, coupon, promotion code, tax, and billing portal identifiers. Full payment card numbers are processed by Stripe, not HackProduct.',
      'Affiliate data: affiliate codes, Stripe Connect account identifiers, click counts, hashed IP and user-agent signals, commission rows, payout status, and transfer identifiers.',
      'Device and network data: IP address, user-agent, cookies, session identifiers, rate-limit counters, analytics events if accepted, and error diagnostics.',
    ],
  },
  {
    title: 'How We Use Data',
    body: [
      'Run the product, authenticate accounts, route users through onboarding, preserve workspace state, and show progress across practice surfaces.',
      'Generate Hatch coaching, grade submissions, recommend next practice, maintain usage limits, and prevent cost spikes or abuse.',
      'Process payments, taxes, refunds, coupons, trials, billing notices, affiliate attribution, and Stripe Connect payouts.',
      'Send transactional email such as verification links, password reset links, billing notices, streak reminders, weekly digests, discussion replies, and account alerts.',
      'Improve product quality through aggregate usage analysis, bug reports, moderation review, security logs, and support requests.',
      'Meet legal, tax, accounting, fraud prevention, and security obligations.',
    ],
  },
  {
    title: 'Third Parties',
    body: [
      'Supabase provides authentication, database, storage, and server-side access controls.',
      'Anthropic powers Hatch coaching and grading features through large language models.',
      'OpenAI Moderation may be used to screen user-submitted discussion or abuse-report content.',
      'Stripe processes checkout, subscriptions, tax, invoices, refunds, coupons, billing portal sessions, and payment method updates.',
      'Stripe Connect supports affiliate onboarding and commission payouts where available.',
      'Resend sends transactional email.',
      'Vercel hosts the application and runs scheduled jobs.',
      'Cloudflare Turnstile helps detect bot signup and account recovery attempts.',
      'Upstash Redis stores rate-limit counters and related short-lived operational data.',
      'Sentry may capture application errors when error monitoring is enabled.',
      'PostHog may collect product analytics when analytics is enabled and a visitor accepts non-essential cookies.',
    ],
  },
  {
    title: 'Retention',
    body: [
      'Account, billing, and security records are kept while the account exists and longer when required for tax, fraud prevention, dispute, or legal reasons.',
      'Practice history, scorecards, learner state, and discussion content are kept while the account exists unless deleted by the account holder or removed under moderation rules.',
      'Hatch chat and generated feedback retention may vary by plan. Free-plan history may be pruned sooner than Pro-plan history once automated retention jobs are active.',
      'Rate-limit data, Turnstile checks, session cookies, and operational logs are kept for shorter periods based on security and debugging needs.',
      'Affiliate commission and payout records are kept for accounting and dispute review after payout.',
    ],
  },
  {
    title: 'Rights And Choices',
    body: [
      'Account holders can request access, correction, export, or deletion of personal data by contacting privacy@hackproduct.dev.',
      'Notification preferences can be changed in settings or through signed unsubscribe links in email.',
      'Cookie choices are saved in the current browser. Essential storage is required for login, security, billing, and core product operation.',
      'Deleting an account removes profile data and cascaded practice data where technically possible. Some billing, security, affiliate, tax, dispute, and audit records may remain when retention is required.',
      'Affiliate payouts through Stripe Connect may require additional identity, tax, and bank account information handled by Stripe.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-on-surface">
      <section className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
          <div>
            <Link href="/" className="text-sm font-bold text-primary no-underline">
              HackProduct
            </Link>
            <p className="mt-8 text-xs font-black uppercase text-primary">Privacy Policy</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-on-surface sm:text-5xl">
              How data moves through HackProduct.
            </h1>
          </div>
          <div className="max-w-2xl">
            <p className="text-lg leading-8 text-on-surface-variant">
              This policy explains what HackProduct collects, why it is used, which vendors process it, how long it is kept, and how account holders can ask for access or deletion.
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
          <nav className="sticky top-8 space-y-2" aria-label="Privacy sections">
            {DATA_SECTIONS.map((section) => (
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
          {DATA_SECTIONS.map((section) => (
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
              Privacy requests can be sent to{' '}
              <a className="font-bold text-primary" href="mailto:privacy@hackproduct.dev">
                privacy@hackproduct.dev
              </a>
              . Include the account email address and the request type.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
