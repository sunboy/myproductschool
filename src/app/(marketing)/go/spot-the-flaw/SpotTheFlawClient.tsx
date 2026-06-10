'use client'

import { MagnetQuiz } from '@/components/landing-v3/lead-magnet/MagnetQuiz'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import type { QuizOutcome, MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import { spotTheFlawConfig } from '@/lib/lead-magnets/quizzes/spot-the-flaw'

const RULES = [
  {
    id: 'flaw-1',
    rule: 'Name whose problem it is before any solution. An answer that opens with a feature is aimed at a guess.',
  },
  {
    id: 'flaw-2',
    rule: 'Every success metric needs a counter-signal. Without a failure condition, any outcome can be called a win.',
  },
  {
    id: 'flaw-3',
    rule: 'A tradeoff names what the team gives up, not just what it gains. Reasons for a choice are not the same as a decision.',
  },
]

const CORRECT_IDS: Record<string, string> = {
  'flaw-1': 'b',
  'flaw-2': 'c',
  'flaw-3': 'c',
}

function ResultView({
  outcome,
  payload,
}: {
  outcome: QuizOutcome
  payload: MagnetResultPayload
}) {
  const detail = outcome.detail as {
    correctCount: number
    missedRules: string[]
  } | undefined

  const missedSet = new Set(detail?.missedRules ?? [])

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Band */}
      <div className="lm-card">
        <p className="lm-quiz-eyebrow">Your flaw-spotting eye</p>
        <p className="lm-result-band">{outcome.band.label}</p>
        <p className="lm-result-blurb">{outcome.band.blurb}</p>
      </div>

      {/* Rejection rules learned */}
      <div className="lm-card">
        <p
          style={{
            fontWeight: 700,
            color: 'var(--ink-1)',
            fontSize: 16,
            margin: '0 0 14px',
          }}
        >
          The rejection rules from this set
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {RULES.map((item) => {
            const answers = payload.answers as Record<string, string>
            const picked = answers[item.id]
            const correct = CORRECT_IDS[item.id]
            const wasMissed = picked !== correct
            return (
              <div
                key={item.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  background: wasMissed ? 'var(--amber-soft)' : 'var(--forest-soft)',
                  borderLeft: `3px solid ${wasMissed ? 'var(--amber-2)' : 'var(--forest)'}`,
                }}
              >
                <p
                  style={{
                    margin: '0 0 4px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: wasMissed ? 'var(--amber-2)' : 'var(--forest)',
                  }}
                >
                  {wasMissed ? 'The one you missed' : 'Spotted correctly'}
                </p>
                <p
                  style={{
                    margin: 0,
                    color: 'var(--ink-1)',
                    fontSize: 14,
                    lineHeight: 1.55,
                  }}
                >
                  {item.rule}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Gate */}
      <LeadGateForm
        sourceSlug="spot-the-flaw"
        mode="gate"
        magnetResult={payload}
        title="Open the full flaw-spotting set"
        subtitle="Seven more answers to dissect, the full rejection-reason taxonomy, and the strong-answer move for each flaw, in a printable report."
        ctaLabel="Open the full set"
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
          The taxonomy, by family
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
          <li>Skipped the problem — answers that propose solutions before anyone has named the actual friction</li>
          <li>Unfalsifiable thinking — answers that define success in a way that can never be proven wrong</li>
          <li>Fake tradeoffs — answers that state a preference with supporting reasons but never name what gets sacrificed</li>
        </ul>
        <p style={{ color: 'var(--ink-3)', marginTop: 12, fontSize: 13 }}>
          The full version is also in your inbox.
        </p>
      </LeadGateForm>
    </div>
  )
}

export function SpotTheFlawClient() {
  return (
    <>
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow">
              <span className="dot" />
              Interview answer trainer
            </p>
            <h1>
              Interviewers reject in the first ninety seconds. Train the eye they use to
              do it.
            </h1>
            <p className="lm-hero-lead">
              Read three answers that sound smart, tap where each one loses the room, see
              the rejection reason interviewers never say out loud.
            </p>
            <ul className="lm-hero-bullets">
              <li>Three real-sounding weak answers, each with a hidden flaw</li>
              <li>Instant reveal showing what the interviewer actually caught</li>
              <li>The reusable rejection rule each scenario teaches</li>
            </ul>
          </div>

          <div className="lm-hero-aside">
            <div className="lm-card">
              <p className="lm-gate-sub" style={{ margin: '0 0 10px' }}>
                How it works
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { step: '1', text: 'Read a candidate answer that sounds solid' },
                  { step: '2', text: 'Pick where it loses the room' },
                  { step: '3', text: 'See the exact rejection reason behind it' },
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
            config={spotTheFlawConfig}
            renderResult={(outcome, payload) => (
              <ResultView outcome={outcome} payload={payload} />
            )}
          />
        </div>
      </section>
    </>
  )
}
