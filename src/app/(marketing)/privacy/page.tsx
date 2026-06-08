import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3ProseSection, V3ProseBlock } from '@/components/landing-v3/sections'

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
    title: 'Google Sign-In',
    body: [
      'When an account is created or accessed with "Continue with Google," HackProduct receives a limited set of Google account fields through Supabase Auth: email address, name, and profile picture.',
      'These fields are used only to create and authenticate the account and to populate the profile name and avatar. They are not sold or used for advertising.',
      'HackProduct requests only basic profile and email scopes. It does not access Gmail, Google Drive, Google Contacts, Calendar, or any other Google service data.',
      'Google account access can be revoked at any time from the Google Account permissions page, which signs the linked identity out of HackProduct.',
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
      'AI processing providers support Hatch coaching and grading features.',
      'Automated moderation providers may be used to screen user-submitted discussion or abuse-report content.',
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
      'Account holders can request access, correction, export, or deletion of personal data by contacting founders@hackproduct.com.',
      'Notification preferences can be changed in settings or through signed unsubscribe links in email.',
      'Cookie choices are saved in the current browser. Essential storage is required for login, security, billing, and core product operation.',
      'Deleting an account removes profile data and cascaded practice data where technically possible. Some billing, security, affiliate, tax, dispute, and audit records may remain when retention is required.',
      'Affiliate payouts through Stripe Connect may require additional identity, tax, and bank account information handled by Stripe.',
    ],
  },
  {
    title: 'Data Location And Transfers',
    body: [
      'HackProduct relies on US-based service providers, including Supabase, Stripe, Vercel, Resend, Upstash, and analytics vendors, to operate the product.',
      'Using the service means personal data is processed and stored in the United States, regardless of where the account holder is located.',
      'Each provider maintains its own security and compliance program covering the data it processes on behalf of HackProduct.',
    ],
  },
  {
    title: 'Children',
    body: [
      'HackProduct is built for working professionals and is not directed to children under 16.',
      'Accounts are not knowingly created for anyone under 16. A parent or guardian who believes a child has provided personal data can contact founders@hackproduct.com to have it removed.',
    ],
  },
  {
    title: 'Changes To This Policy',
    body: [
      'This policy may change as the product, vendors, and legal requirements evolve.',
      'Material changes will be surfaced inside the product or sent to the account email before they take effect where required.',
      'Continued use of HackProduct after a change means the updated policy is accepted.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: 'https://hackproduct.dev/' },
            { name: 'Privacy', path: 'https://hackproduct.dev/privacy' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'PrivacyPolicy',
            name: 'HackProduct Privacy Policy',
            url: 'https://hackproduct.dev/privacy',
            description:
              'How HackProduct collects, uses, stores, and deletes account, practice, billing, and coaching data.',
          },
        ]}
      />

      <V3PageHero
        eyebrow="Privacy Policy"
        title="How data moves through HackProduct."
        subtitle="This policy explains what HackProduct collects, why it is used, which vendors process it, how long it is kept, and how account holders can ask for access or deletion. Last updated: June 1, 2026."
      />

      <V3ProseSection>
        {DATA_SECTIONS.map((section) => (
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
            Privacy requests can be sent to{' '}
            <a href="mailto:founders@hackproduct.com">founders@hackproduct.com</a>. Include the
            account email address and the request type.
          </p>
        </V3ProseBlock>
      </V3ProseSection>
    </V3PageShell>
  )
}
