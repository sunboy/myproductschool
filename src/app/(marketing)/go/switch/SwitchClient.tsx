'use client'

import { MagnetQuiz } from '@/components/landing-v3/lead-magnet/MagnetQuiz'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import type { QuizOutcome, MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import { switchQuizConfig } from '@/lib/lead-magnets/quizzes/switch'

function ResultView({
  outcome,
  payload,
}: {
  outcome: QuizOutcome
  payload: MagnetResultPayload
}) {
  const detail = outcome.detail as {
    background: string
    storyType: string
    weakestLens: 'customer' | 'tradeoff' | 'outcome'
    gapsForBackground: string[]
    transfersForBackground: string[]
  } | undefined

  const backgroundLabel: Record<string, string> = {
    backend: 'backend engineering',
    frontend: 'frontend engineering',
    data: 'data and analytics',
    'infra-platform': 'infra and platform work',
  }

  const weakestLensLabel: Record<string, string> = {
    customer: 'Customer lens',
    tradeoff: 'Tradeoff lens',
    outcome: 'Outcome lens',
  }

  const weakestLensInsight: Record<string, string> = {
    customer: 'The interviewer wants to hear whose goal was blocked and why it mattered to real people. That context is what turns a technical win into a product story.',
    tradeoff: 'The interviewer is listening for the moment where two good options competed and you picked one. Naming what you gave up, and why the sacrifice was acceptable, is the move most engineers skip.',
    outcome: 'The interviewer wants a specific metric reaching a specific threshold in a named window. Closing with shipped-on-time or well-received is not a product outcome.',
  }

  const strongestTransfer = detail?.transfersForBackground[0]
  const firstGap = detail?.gapsForBackground[0]

  const bgLabel = detail ? (backgroundLabel[detail.background] ?? detail.background) : ''

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Band */}
      <div className="lm-card">
        <p className="lm-quiz-eyebrow">Your story audit</p>
        <p className="lm-result-band">{outcome.band.label}</p>
        <p className="lm-result-blurb">{outcome.band.blurb}</p>
      </div>

      {/* Lens bars */}
      {outcome.dimensions && outcome.dimensions.length > 0 && (
        <div className="lm-card">
          <p style={{ fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 16px' }}>
            Your three lenses
          </p>
          {outcome.dimensions.map((dim) => (
            <div key={dim.key} className="lm-score-row">
              <span className="lm-score-label">{dim.label}</span>
              <span className="lm-score-val">{dim.value} / {dim.max}</span>
              <div className="lm-score-bar">
                <div
                  className="lm-score-fill"
                  style={{ width: `${(dim.value / dim.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {detail && (
            <p style={{ marginTop: 14, color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.55, margin: '14px 0 0' }}>
              <strong>{weakestLensLabel[detail.weakestLens]}</strong> is the one you drop most.{' '}
              {weakestLensInsight[detail.weakestLens]}
            </p>
          )}
        </div>
      )}

      {/* Background-specific transfers and gap */}
      {detail && (
        <div className="lm-card">
          <p className="lm-quiz-eyebrow">From {bgLabel}</p>
          <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink-1)', margin: '0 0 8px' }}>
            What transfers immediately
          </p>
          {strongestTransfer && (
            <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55, margin: '0 0 16px' }}>
              {strongestTransfer}
            </p>
          )}
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink-1)', margin: '0 0 6px' }}>
            The first gap interviewers notice
          </p>
          {firstGap && (
            <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55, margin: 0 }}>
              {firstGap}
            </p>
          )}
        </div>
      )}

      {/* Gate */}
      <LeadGateForm
        sourceSlug="switch"
        mode="gate"
        magnetResult={payload}
        title="Get your transition plan"
        subtitle="Your story reframed into customer, tradeoff, metric, and judgment language, plus a 30-day plan and the five stories every PM screen expects."
        ctaLabel="Open your plan"
        postUnlockCtaLabel="Start practicing free"
        signupNext="/challenges"
      >
        <p
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--ink-1)',
            margin: '0 0 6px',
          }}
        >
          {detail
            ? `The ${detail.storyType === 'rescue' ? 'rescue story'
                : detail.storyType === 'scale' ? 'scale story'
                : detail.storyType === 'zero-to-one' ? 'zero-to-one story'
                : 'migration story'} retold with all three lenses active, plus the five stories every PM screen expects you to have ready.`
            : 'Your story retold with all three lenses active, plus the five stories every PM screen expects you to have ready.'}
        </p>
      </LeadGateForm>
    </div>
  )
}

export function SwitchClient() {
  return (
    <>
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow">
              <span className="dot" />
              Engineer-to-PM story audit
            </p>
            <h1>
              Your best engineering story is probably your weakest PM story. Audit it before an interviewer does.
            </h1>
            <p className="lm-hero-lead">
              Five steps, one real story, no signup to see your result. You get a lens breakdown, the gap that will cost you the screen, and the reframe.
            </p>
            <ul className="lm-hero-bullets">
              <li>Audit one real story in five steps, using the criteria interviewers actually grade on</li>
              <li>See which product lens your telling skips and why interviewers notice it immediately</li>
              <li>Get the reframe and a 30-day plan for building the rest of the story library</li>
            </ul>
          </div>

          <div className="lm-hero-aside">
            <div className="lm-card">
              <p className="lm-gate-sub" style={{ margin: '0 0 10px' }}>
                How it works
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { step: '1', text: 'Tell us your background and the story type you would lead with' },
                  { step: '2', text: 'Answer three questions about how you currently tell it' },
                  { step: '3', text: 'See your lens scores, your strongest transfer, and your first gap' },
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
            config={switchQuizConfig}
            renderResult={(outcome, payload) => (
              <ResultView outcome={outcome} payload={payload} />
            )}
          />
        </div>
      </section>
    </>
  )
}
