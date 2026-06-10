'use client'

import { MagnetQuiz } from '@/components/landing-v3/lead-magnet/MagnetQuiz'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import type { QuizOutcome, MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import { teardownQuizConfig } from '@/lib/lead-magnets/quizzes/teardown'

const GRADE_READS: Record<string, string> = {
  sharp:
    'Both calls matched what actually happened, and more importantly the reasoning held up. The separating move in each scenario was following the decision through to its structural consequence, not stopping at the immediate product effect. That pattern of thinking is what these 104 decisions are built to train.',
  solid:
    'One call was close, one drifted. The gap usually shows up in how far ahead the reasoning runs. It is easy to pick the option that sounds most defensible. The harder move is asking what the decision makes true six months from now, for users who did not switch, for competitors who cannot copy it, or for habits that need time to compound.',
  surface:
    'Both calls were plausible but landed short of what actually happened. The pattern: the option with the best surface logic — more research, free licensing, curriculum depth — was not the option with the best structural logic. That distinction is the whole skill, and it sharpens fast with more reps.',
  missed:
    'The options that looked safest turned out to be the ones that cost the most. That is not a judgment on instinct. It is a signal that the reasoning pattern these decisions reward is not yet automatic. The good news: it becomes automatic faster than most people expect, because the pattern is consistent across every decision in the library.',
}

function ResultView({
  outcome,
  payload,
}: {
  outcome: QuizOutcome
  payload: MagnetResultPayload
}) {
  const detail = outcome.detail as { totalPoints: number } | undefined
  const gradeRead = GRADE_READS[outcome.band.key] ?? outcome.band.blurb

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Band */}
      <div className="lm-card">
        <p className="lm-quiz-eyebrow">Your score</p>
        <p className="lm-result-band">{outcome.band.label}</p>
        <p className="lm-result-blurb">{outcome.band.blurb}</p>
      </div>

      {/* Grade read */}
      <div className="lm-card">
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          {gradeRead}
        </p>
        {detail !== undefined && (
          <p
            style={{
              marginTop: 14,
              color: 'var(--ink-3)',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            The library has 104 decisions scored the same way. Each one shows the situation at the
            decision point, the option the company actually chose, and the reasoning move that
            separated the best answer from the plausible-wrong ones.
          </p>
        )}
      </div>

      {/* Signup gate */}
      <LeadGateForm
        sourceSlug="teardown"
        mode="signup"
        magnetResult={payload}
        title="Practice another decision"
        subtitle="104 real product decisions, scored and explained."
        ctaLabel="Practice another decision"
        signupNext="/explore/autopsies"
      />
    </div>
  )
}

export function TeardownClient() {
  return (
    <>
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow">
              <span className="dot" />
              Product decision teardown
            </p>
            <h1>
              104 real product decisions, dissected. Score your instinct on two of them in three
              minutes.
            </h1>
            <p className="lm-hero-lead">
              Two decisions from public company history, no signup to see your result. Each scenario
              shows the situation at the decision point. Pick the option you would have chosen, then
              see what the company did and the reasoning that separated the best answer from the
              plausible-wrong ones.
            </p>
            <ul className="lm-hero-bullets">
              <li>
                Both decisions are grounded in public sources: patents, founder accounts, and
                observable company behavior.
              </li>
              <li>
                The scoring does not reward caution. The defensible-sounding option is often wrong.
              </li>
              <li>
                The reveal shows the reasoning move, not just the answer, so you can apply it to
                the next decision.
              </li>
            </ul>
          </div>

          <div className="lm-hero-aside">
            <div className="lm-card">
              <p className="lm-gate-sub" style={{ margin: '0 0 10px' }}>
                How it works
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { step: '1', text: 'Read the situation at the actual decision point' },
                  { step: '2', text: 'Pick the option you would have chosen' },
                  { step: '3', text: 'See what happened and the reasoning move behind it' },
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
            config={teardownQuizConfig}
            renderResult={(outcome, payload) => (
              <ResultView outcome={outcome} payload={payload} />
            )}
          />
        </div>
      </section>
    </>
  )
}
