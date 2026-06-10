'use client'

import { MagnetQuiz } from '@/components/landing-v3/lead-magnet/MagnetQuiz'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import type { QuizOutcome, MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import { failureModeQuizConfig } from '@/lib/lead-magnets/quizzes/failure-mode'

function ResultView({
  outcome,
  payload,
}: {
  outcome: QuizOutcome
  payload: MagnetResultPayload
}) {
  const detail = outcome.detail as {
    weakestMove: string
    weakestMoveLabel: string
    pickedOptionText: string
    sampleRewrite: string
    moveInsight: string
  } | undefined

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Archetype band */}
      <div className="lm-card">
        <p className="lm-quiz-eyebrow">Your thinking style</p>
        <p className="lm-result-band">{outcome.band.label}</p>
        <p className="lm-result-blurb">{outcome.band.blurb}</p>
      </div>

      {/* Four move bars */}
      {outcome.dimensions && outcome.dimensions.length > 0 && (
        <div className="lm-card">
          <p style={{ fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 16px' }}>
            Your four moves
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

      {/* The move you skip — concrete rewrite card */}
      {detail && detail.weakestMoveLabel && (
        <div className="lm-card">
          <p className="lm-quiz-eyebrow">The move you skip</p>
          <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink-1)', margin: '0 0 8px' }}>
            {detail.weakestMoveLabel}
          </p>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55, margin: '0 0 16px' }}>
            {detail.moveInsight}
          </p>

          {detail.pickedOptionText && (
            <div style={{ marginBottom: 14 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-3)',
                  margin: '0 0 6px',
                }}
              >
                What you picked
              </p>
              <p
                style={{
                  color: 'var(--ink-2)',
                  fontSize: 14,
                  lineHeight: 1.55,
                  margin: 0,
                  padding: '12px 14px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--r-md)',
                  borderLeft: '3px solid var(--line-2)',
                }}
              >
                {detail.pickedOptionText}
              </p>
            </div>
          )}

          {detail.sampleRewrite && (
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--forest-2)',
                  margin: '0 0 6px',
                }}
              >
                What the strong answer does
              </p>
              <p
                style={{
                  color: 'var(--ink-1)',
                  fontSize: 14,
                  lineHeight: 1.55,
                  margin: 0,
                  padding: '12px 14px',
                  background: 'var(--forest-soft)',
                  borderRadius: 'var(--r-md)',
                  borderLeft: '3px solid var(--forest)',
                }}
              >
                {detail.sampleRewrite}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Gate — only shown post-quiz */}
      <LeadGateForm
        sourceSlug="failure-mode"
        mode="gate"
        magnetResult={payload}
        title="Get your full failure-mode profile"
        subtitle="Six-skill breakdown, the three reps that fix your weakest move, and a printable 7-day plan."
        ctaLabel="See your full profile"
        postUnlockCtaLabel="Start training free"
        signupNext="/challenges"
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--ink-1)',
            margin: '0 0 10px',
          }}
        >
          What your full profile includes
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            color: 'var(--ink-1)',
            lineHeight: 1.7,
            fontSize: 14,
          }}
        >
          <li>Your six-skill profile across the thinking moves that decide PM screens</li>
          <li>Which specific skills your weakest move connects to</li>
          <li>Three reps to fix it, in order of highest impact</li>
          <li>A 7-day plan: day by day, starting from where you are</li>
        </ul>
        <p style={{ color: 'var(--ink-3)', marginTop: 12, fontSize: 13 }}>
          The full version is also in your inbox.
        </p>
      </LeadGateForm>
    </div>
  )
}

export function FailureModeClient() {
  return (
    <>
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow">
              <span className="dot" />
              Product-sense diagnostic
            </p>
            <h1>
              Your answers sound senior-engineer-good and PM-screen-bad. Find out which
              move you skip.
            </h1>
            <p className="lm-hero-lead">
              4 scenarios, 3 minutes, no signup to see your result. You get an archetype,
              the exact move you skip under pressure, and the rewrite that fixes it.
            </p>
            <ul className="lm-hero-bullets">
              <li>The archetype that describes your product-thinking pattern</li>
              <li>The one move you consistently drop when the question gets hard</li>
              <li>A concrete rewrite showing what the strong version does differently</li>
            </ul>
          </div>

          <div className="lm-hero-aside">
            <div className="lm-card">
              <p
                className="lm-gate-sub"
                style={{ margin: '0 0 10px' }}
              >
                How it works
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { step: '1', text: 'Read a real product scenario' },
                  { step: '2', text: 'Pick the move you would actually make' },
                  { step: '3', text: 'See your failure mode and the fix' },
                ].map((item) => (
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
            config={failureModeQuizConfig}
            renderResult={(outcome, payload) => (
              <ResultView outcome={outcome} payload={payload} />
            )}
          />
        </div>
      </section>
    </>
  )
}
