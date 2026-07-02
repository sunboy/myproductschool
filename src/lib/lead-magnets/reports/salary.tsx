// Report content for /go/salary — the negotiation playbook delivered post-gate.
import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from './index'
import { getCompBand, METHODOLOGY_NOTE } from '@/lib/lead-magnets/quizzes/salary'

const BAND_BLURBS: Record<string, { headline: string; why: string }> = {
  'push-hard': {
    headline: 'Push, with numbers',
    why: 'Your situation carries genuine leverage: a competing offer, a position you could stay in, or both. Companies expect a push at this level and are often holding room precisely because they expect to use it. A specific, grounded counter is the standard move.',
  },
  'push-once': {
    headline: 'One calibrated push',
    why: 'You have enough position to ask once, cleanly. The risk of a second ask in your situation starts to outweigh the incremental upside. One clear, specific counter with one reason is the right move. Then you stop.',
  },
  hold: {
    headline: 'Hold and build leverage',
    why: 'Pushing from this position is more likely to slow the process than improve the offer. The smarter play is to accept, perform well for six to twelve months, and negotiate from a position of demonstrated value and real alternatives.',
  },
}

export function buildSalaryReport(
  result: MagnetResultPayload,
  name?: string | null,
): ReportContent {
  const greeting = name ? `${name}, here` : 'Here'

  // Re-derive profile from stored answers.
  const answers = result.answers ?? {}
  const profileAnswers =
    typeof answers.profile === 'object' && answers.profile !== null
      ? (answers.profile as Record<string, string>)
      : {}

  const role = String(profileAnswers.role ?? 'pm')
  const level = String(profileAnswers.level ?? 'mid')
  const region = String(profileAnswers.region ?? 'us-t1')

  const bandKey = result.band ?? 'push-once'
  const bandContent = BAND_BLURBS[bandKey] ?? BAND_BLURBS['push-once']!
  const directionalBand = getCompBand(role, level, region)

  const shouldPush = bandKey !== 'hold'

  return {
    title: 'Your negotiation playbook',
    intro: `${greeting} is what you need for the conversation: the signal, the script, the template, and the four questions to run before you say a word.`,
    sections: [
      {
        id: 'your-signal',
        title: 'Your signal',
        body: (
          <div>
            <div
              style={{
                background: 'var(--forest-soft)',
                borderLeft: '3px solid var(--forest)',
                borderRadius: 'var(--r-md)',
                padding: '14px 16px',
                marginBottom: '1.1rem',
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  color: 'var(--ink-1)',
                  fontSize: 17,
                  margin: '0 0 6px',
                }}
              >
                {bandContent.headline}
              </p>
              <p style={{ color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                {bandContent.why}
              </p>
            </div>
            <p style={{ lineHeight: 1.6, marginBottom: '0.9rem' }}>
              Directional comp for your profile: <strong>{directionalBand}</strong>.
            </p>
            <p style={{ lineHeight: 1.6, color: 'var(--ink-2)', fontSize: 14 }}>
              {METHODOLOGY_NOTE}
            </p>
          </div>
        ),
      },
      {
        id: 'negotiation-script',
        title: 'The one-page negotiation script',
        body: (
          <div>
            <p style={{ lineHeight: 1.6, marginBottom: '1.1rem' }}>
              {shouldPush
                ? 'Read this out loud before the call. Familiarity with the words removes the hesitation that makes candidates capitulate before the ask is even out.'
                : 'Even if you are holding, knowing the script means you can respond coherently if the recruiter asks whether you have concerns about the offer.'}
            </p>
            <div className="lm-report-moves">
              {SCRIPT_STEPS.map((step) => (
                <div key={step.id} className="lm-report-move-card">
                  <div className="lm-report-move-header">
                    <span className="lm-report-move-key">{step.tag}</span>
                    <span className="lm-report-move-name">{step.title}</span>
                  </div>
                  <p className="lm-report-move-def">{step.context}</p>
                  <div className="lm-report-move-template">
                    <span className="lm-report-template-label">What to say</span>
                    <span className="lm-report-template-text">{step.script}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'counter-offer-email',
        title: 'The counter-offer email template',
        body: (
          <div>
            <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
              Use this if the negotiation is happening over email or if you want to
              follow up a phone conversation in writing. Keep it short. Long emails
              signal anxiety, not confidence.
            </p>
            <div
              style={{
                background: 'var(--surface-2)',
                borderRadius: 'var(--r-md)',
                padding: '16px 18px',
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.7,
                color: 'var(--ink-1)',
              }}
            >
              <p style={{ margin: '0 0 10px' }}>Subject: Re: [Role] — offer discussion</p>
              <p style={{ margin: '0 0 10px' }}>Hi [Name],</p>
              <p style={{ margin: '0 0 10px' }}>
                Thank you for the offer. I am genuinely excited about [one specific thing
                about the role or team].
              </p>
              <p style={{ margin: '0 0 10px' }}>
                I have been reviewing the details. Based on [my research into market rates
                for this level / the competing offer I have / my experience in X], I was
                expecting a base closer to [your number]. Is there room to get there?
              </p>
              <p style={{ margin: '0 0 10px' }}>
                If base is fixed, I am also open to discussing [equity / signing bonus /
                start date flexibility] to bridge the gap.
              </p>
              <p style={{ margin: 0 }}>Looking forward to your thoughts.</p>
              <p style={{ margin: '10px 0 0' }}>[Your name]</p>
            </div>
            <p
              style={{
                color: 'var(--ink-3)',
                fontSize: 13,
                marginTop: 12,
                lineHeight: 1.55,
              }}
            >
              Two things to notice: the ask is specific (a number, not &quot;more&quot;), and it
              opens a door on non-salary levers without being aggressive about them.
            </p>
          </div>
        ),
      },
      {
        id: 'four-questions',
        title: 'The four questions before you push',
        body: (
          <div>
            <p style={{ lineHeight: 1.6, marginBottom: '1.1rem' }}>
              Run through these before the call. Not to talk yourself out of asking, but
              to arrive with answers rather than hesitations.
            </p>
            <div className="lm-report-templates">
              {FOUR_QUESTIONS.map((q) => (
                <div key={q.id} className="lm-report-template-card">
                  <div className="lm-report-template-header">
                    <span className="lm-report-template-tag">Q{q.id}</span>
                    <span className="lm-report-template-title">{q.question}</span>
                  </div>
                  <p className="lm-report-template-note">{q.note}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'methodology',
        title: 'Methodology',
        body: (
          <div>
            <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>{METHODOLOGY_NOTE}</p>
            <p style={{ lineHeight: 1.6 }}>
              Directional comp for your profile ({role.toUpperCase()}, {level}, {region.replace('us-t1', 'US tier-1 hub').replace('us-other', 'US other')}): <strong>{directionalBand}</strong>.
            </p>
          </div>
        ),
      },
    ],
  }
}

const SCRIPT_STEPS = [
  {
    id: 'opening',
    tag: '1',
    title: 'The opening line',
    context:
      'Say this immediately, before the recruiter can fill silence with their own framing. The goal is to signal appreciation and seriousness in the same breath.',
    script:
      '"Thank you for the offer. I am genuinely interested in the role. I have been looking at the details, and I want to have a straightforward conversation about compensation."',
  },
  {
    id: 'pause',
    tag: '2',
    title: 'The pause',
    context:
      'After your opening line, stop. Do not fill silence. The recruiter will ask what you are thinking, which is exactly where you want to be.',
    script:
      '"[Wait. Let them ask. If they do not, continue after five seconds.]"',
  },
  {
    id: 'number',
    tag: '3',
    title: 'Framing the number',
    context:
      'Name a specific number. A range signals the floor you will accept. One number signals what you actually want.',
    script:
      '"Based on [market data for this level / what I am seeing in the market for this role], I was expecting a base closer to [your number]. Is there room to get there?"',
  },
  {
    id: 'levers',
    tag: '4',
    title: 'Non-salary levers',
    context:
      'If base is fixed, open the door on other levers without abandoning the ask. Equity, signing bonus, start date, and review timing are all negotiable at most companies.',
    script:
      '"If base is fixed, I would be open to looking at [equity / a signing bonus / an early performance review at six months] to close the gap."',
  },
  {
    id: 'close',
    tag: '5',
    title: 'The close',
    context:
      'After your ask, stop talking. Do not justify, apologise, or soften. The recruiter needs to take your ask back to the hiring manager, and they can only do that if you have given them a clear number.',
    script:
      '"That is where I am. I wanted to be upfront about it so we can figure out together whether there is a path forward."',
  },
]

const FOUR_QUESTIONS = [
  {
    id: 1,
    question: 'Do I have a real alternative?',
    note: 'A real alternative is one you would genuinely take. "I might get other offers" is not an alternative. If you have one, say so. If you do not, do not pretend you do.',
  },
  {
    id: 2,
    question: 'Is the gap real or vibes?',
    note: 'Before naming a number, anchor it in something. Market data, a competing offer, or a clear rationale for why your experience commands a premium. Vibes-based asks fall apart under the first follow-up question.',
  },
  {
    id: 3,
    question: 'What am I trading for the ask?',
    note: 'Negotiating takes a small amount of social capital. In most cases the cost is low and recoverable. But in early-stage companies or cultures where asking is unusual, know the cost before you pay it.',
  },
  {
    id: 4,
    question: 'Does the relationship survive the ask?',
    note: 'A reasonable, professionally stated counter-offer has never caused a company to rescind an offer. If you are afraid it might, that tells you something important about the company, not about your ask.',
  },
]
