import { Mail } from 'lucide-react'
import { renderEmailForPreview, type TransactionalEmailKind } from '@/lib/email/send-core'
import { renderNewsletterEmail } from '@/lib/email/newsletter'
import { EMAIL_SAMPLES, NEWSLETTER_SAMPLE, SAMPLE_FROM } from '@/lib/email/samples'
import { SendTestButton } from './SendTestButton'

export const dynamic = 'force-dynamic'

interface EmailSection {
  title: string
  kinds: TransactionalEmailKind[]
}

const SECTIONS: EmailSection[] = [
  {
    title: 'Lifecycle',
    kinds: [
      'welcome',
      'streak_reminder',
      'weekly_digest',
      'challenge_completion',
      'resume_challenge',
      'upgrade_nudge',
      'resume_article',
      'promotion',
      'paid_insight',
      'lead_magnet_unlock',
      'activation_day1',
      'activation_day3',
      'activation_day7',
    ],
  },
  {
    title: 'Auth',
    kinds: ['verification', 'magic_link', 'password_reset'],
  },
  {
    title: 'Billing',
    kinds: [
      'payment_receipt',
      'payment_failed',
      'payment_action_required',
      'trial_ending',
      'affiliate_payout',
      'cancellation_confirmed',
      'cancellation_scheduled',
      'subscription_reactivated',
      'plan_changed',
    ],
  },
  {
    title: 'Internal',
    kinds: ['discussion_reply', 'account_deleted', 'abuse_report', 'product_feedback', 'growth_report'],
  },
]

function EmailCard({
  kind,
  from,
  subject,
  html,
  text,
}: {
  kind: string
  from: string
  subject: string
  html: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-card-bright p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-wide text-ink-muted">{kind}</div>
          <div className="mt-0.5 text-sm font-semibold text-ink-strong">{subject}</div>
          <div className="mt-0.5 text-xs text-ink-secondary">From: {from}</div>
        </div>
        <SendTestButton kind={kind} />
      </div>
      <iframe
        srcDoc={html}
        sandbox=""
        title={`${kind} preview`}
        style={{
          width: '100%',
          height: 520,
          border: '1px solid var(--color-hairline)',
          borderRadius: 12,
          background: '#fff',
        }}
      />
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink-secondary">Text version</summary>
        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-hairline bg-accent p-3 text-xs text-ink-strong">
          {text}
        </pre>
      </details>
    </div>
  )
}

export default function AdminEmailsPage() {
  const newsletter = renderNewsletterEmail(NEWSLETTER_SAMPLE)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Mail className="h-6 w-6 text-ink-strong" />
        <div>
          <h1 className="font-headline text-2xl font-bold text-ink-strong">Email preview</h1>
          <p className="text-sm text-ink-secondary">
            Every transactional email kind rendered against a realistic sample payload, plus the newsletter shell.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {SECTIONS.map(section => (
          <section key={section.title}>
            <h2 className="mb-4 font-headline text-lg font-bold text-ink-strong">{section.title}</h2>
            <div className="space-y-6">
              {section.kinds.map(kind => {
                const sample = EMAIL_SAMPLES[kind]
                const { html, text } = renderEmailForPreview(sample)
                return (
                  <EmailCard
                    key={kind}
                    kind={kind}
                    from={SAMPLE_FROM[kind]}
                    subject={sample.subject}
                    html={html}
                    text={text}
                  />
                )
              })}
            </div>
          </section>
        ))}

        <section>
          <h2 className="mb-4 font-headline text-lg font-bold text-ink-strong">Newsletter</h2>
          <div className="space-y-6">
            <EmailCard
              kind="newsletter"
              from={process.env.RESEND_NEWSLETTER_FROM?.trim() || 'Hatch (HackProduct) <founders@hackproduct.com>'}
              subject={NEWSLETTER_SAMPLE.title}
              html={newsletter.html}
              text={newsletter.text}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
