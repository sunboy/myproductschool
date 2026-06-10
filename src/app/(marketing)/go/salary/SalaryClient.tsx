'use client'

import { MagnetQuiz } from '@/components/landing-v3/lead-magnet/MagnetQuiz'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import type { QuizOutcome, MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import { salaryQuizConfig } from '@/lib/lead-magnets/quizzes/salary'

// ── Result card ──────────────────────────────────────────────────────────────

function ResultView({
  outcome,
  payload,
}: {
  outcome: QuizOutcome
  payload: MagnetResultPayload
}) {
  const detail = outcome.detail as {
    directionalBand: string
    methodology: string
  } | undefined

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Signal band */}
      <div className="lm-card">
        <p className="lm-quiz-eyebrow">Your signal</p>
        <p className="lm-result-band">{outcome.band.label}</p>
        <p className="lm-result-blurb">{outcome.band.blurb}</p>
      </div>

      {/* Dimension bars */}
      {outcome.dimensions && outcome.dimensions.length > 0 && (
        <div className="lm-card">
          <p style={{ fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 16px' }}>
            What drives the signal
          </p>
          {outcome.dimensions.map((dim) => (
            <div key={dim.key} className="lm-score-row">
              <span className="lm-score-label">{dim.label}</span>
              <span className="lm-score-val">{dim.value}</span>
              <div className="lm-score-bar">
                <div
                  className="lm-score-fill"
                  style={{ width: `${(dim.value / dim.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Directional comp band */}
      {detail?.directionalBand && (
        <div className="lm-card">
          <p className="lm-quiz-eyebrow">Directional comp for your profile</p>
          <p
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--ink-1)',
              lineHeight: 1.5,
              margin: '6px 0 12px',
            }}
          >
            {detail.directionalBand}
          </p>
          {detail.methodology && (
            <p style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>
              {detail.methodology}
            </p>
          )}
        </div>
      )}

      {/* Recommended next */}
      {outcome.recommendedNext && (
        <div style={{ textAlign: 'center' }}>
          <a href={outcome.recommendedNext.href} className="btn btn-forest">
            {outcome.recommendedNext.label}
          </a>
        </div>
      )}

      {/* Lead gate */}
      <LeadGateForm
        sourceSlug="salary"
        mode="gate"
        magnetResult={payload}
        title="Get the negotiation playbook"
        subtitle="A one-page script you can read aloud, a counter-offer email template, and the four questions that tell you whether to push."
        ctaLabel="Get the playbook"
        postUnlockCtaLabel="Start training free"
        signupNext="/challenges"
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--ink-1)',
            margin: '0 0 10px',
          }}
        >
          The script opens like this:
        </p>
        <p
          style={{
            color: 'var(--ink-2)',
            fontSize: 14,
            lineHeight: 1.6,
            margin: '0 0 14px',
            padding: '12px 14px',
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-md)',
            borderLeft: '3px solid var(--line-2)',
            fontStyle: 'italic',
          }}
        >
          &ldquo;Thank you for the offer. I am genuinely interested in the role. I have been looking at the details, and I want to have a straightforward conversation about compensation.&rdquo;
        </p>
        <p style={{ color: 'var(--ink-3)', marginTop: 4, fontSize: 13, lineHeight: 1.55 }}>
          The full playbook walks through five steps, a complete email template, and the four questions that tell you whether your push has a real foundation.
        </p>
      </LeadGateForm>
    </div>
  )
}

// ── Page client ──────────────────────────────────────────────────────────────

export function SalaryClient() {
  return (
    <>
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow">
              <span className="dot" />
              Offer decision tool
            </p>
            <h1>
              Most people lose the negotiation before it starts, by not knowing whether
              to push at all.
            </h1>
            <p className="lm-hero-lead">
              Two questions, no signup to see your result. You get a push or hold signal
              specific to your situation, the directional comp band for your profile, and
              the negotiation script if you push.
            </p>
            <ul className="lm-hero-bullets">
              <li>Your push or hold signal, derived from a transparent rule table</li>
              <li>The directional comp band for your role, level, and region</li>
              <li>The script if you push: opening line, the number, and the close</li>
            </ul>
          </div>

          <div className="lm-hero-aside">
            <div className="lm-card">
              <p className="lm-gate-sub" style={{ margin: '0 0 10px' }}>
                How it works
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {HOW_IT_WORKS.map((item) => (
                  <div
                    key={item.step}
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  >
                    <span
                      style={{
                        flex: '0 0 24px',
                        height: 24,
                        borderRadius: '50%',
                        background: 'var(--forest-soft)',
                        color: 'var(--forest)',
                        fontWeight: 800,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.step}
                    </span>
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--ink-1)',
                        fontSize: 14,
                        lineHeight: 1.45,
                        paddingTop: 3,
                      }}
                    >
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lm-section lm-section-alt">
        <div className="shell" style={{ maxWidth: 680 }}>
          <MagnetQuiz
            config={salaryQuizConfig}
            renderResult={(outcome, payload) => (
              <ResultView outcome={outcome} payload={payload} />
            )}
          />
        </div>
      </section>
    </>
  )
}

const HOW_IT_WORKS = [
  { step: '1', text: 'Tell us your role, level, region, and offer situation' },
  { step: '2', text: 'Describe where you stand relative to the offer' },
  { step: '3', text: 'Get your push or hold signal and the directional comp band' },
]
