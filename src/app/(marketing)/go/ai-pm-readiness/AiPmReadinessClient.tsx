'use client'

import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { MagnetQuiz } from '@/components/landing-v3/lead-magnet/MagnetQuiz'
import { LeadGateForm } from '@/components/landing-v3/lead-magnet/LeadGateForm'
import { aiPmReadinessConfig } from '@/lib/lead-magnets/quizzes/ai-pm-readiness'
import type { QuizOutcome, MagnetResultPayload, QuizDimension } from '@/lib/lead-magnets/quiz-types'

export function AiPmReadinessClient() {
  return (
    <>
      <section className="lm-hero">
        <div className="shell">
          <div>
            <p className="eyebrow"><span className="dot" />AI product sense</p>
            <h1>The prep that worked in 2023 gets you rejected in 2026.</h1>
            <p className="lm-hero-lead">
              The AI product-sense round is now standard at AI-native companies and most
              established tech firms. Most engineers walk in with 2023 prep and face
              questions their prep never covered.
            </p>
            <ul className="lm-hero-bullets">
              <li>Five scenarios covering every dimension the round tests</li>
              <li>Your readiness band, plus which dimensions are weak</li>
              <li>A full gap report with a worked model-layer vs app-layer example</li>
            </ul>
          </div>
          <div className="lm-hero-aside">
            <div className="lm-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <HatchGlyph size={32} state="reviewing" className="text-primary" />
                <p className="lm-gate-sub" style={{ margin: 0 }}>What this quiz tests</p>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)', lineHeight: 1.7, fontSize: 14 }}>
                <li>When not to reach for a model</li>
                <li>What belongs in the prompt vs what needs fine-tuning</li>
                <li>How to know whether a feature actually works</li>
                <li>Where safety shows up before launch day</li>
                <li>What the feature produces and what it feeds on</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lm-section lm-section-alt">
        <div className="shell" style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HatchGlyph size={40} state="listening" className="text-primary" />
            <h2 style={{ margin: 0 }}>Five scenarios. Your real readiness.</h2>
          </div>
          <p className="lm-section-sub" style={{ marginTop: 8 }}>
            Each question has one best answer that hinges on a real reasoning move, not on
            length or confidence. Pick what you would actually say.
          </p>
          <div style={{ marginTop: 28 }}>
            <MagnetQuiz
              config={aiPmReadinessConfig}
              introCta="Start the readiness check"
              renderResult={(outcome, payload) => (
                <ReadinessResult outcome={outcome} payload={payload} />
              )}
            />
          </div>
        </div>
      </section>
    </>
  )
}

// ── Result + Gate ─────────────────────────────────────────────────────────────

interface ReadinessResultProps {
  outcome: QuizOutcome
  payload: MagnetResultPayload
}

function ReadinessResult({ outcome, payload }: ReadinessResultProps) {
  const dims = outcome.dimensions ?? []
  const gaps = (outcome.detail?.gaps ?? {}) as Record<string, string>

  // Find the single sharpest gap to surface inline on the result card
  const weakest = dims.reduce<QuizDimension | null>((worst, d) => {
    if (!worst) return d
    return d.value < worst.value ? d : worst
  }, null)

  return (
    <>
      <section className="lm-section">
        <div className="shell" style={{ maxWidth: 680 }}>
          <div className="lm-card">
            <p className="eyebrow"><span className="dot" />Your result</p>
            <p className="lm-result-band" style={{ marginTop: 10 }}>{outcome.band.label}</p>
            <p className="lm-result-blurb">{outcome.band.blurb}</p>

            {dims.length > 0 && (
              <div style={{ marginTop: 24 }}>
                {dims.map((d) => (
                  <div key={d.key} className="lm-score-row">
                    <span className="lm-score-label">{d.label}</span>
                    <span className="lm-score-val">{d.value} / {d.max}</span>
                    <div className="lm-score-bar">
                      <div
                        className="lm-score-fill"
                        style={{ width: `${Math.round((d.value / d.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {weakest && gaps[weakest.key] && (
              <div
                style={{
                  marginTop: 20,
                  padding: '14px 16px',
                  background: 'var(--amber-soft)',
                  borderLeft: '3px solid var(--amber-2)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--ink-1)',
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--amber-2)' }}>
                  Biggest gap ({weakest.label}):
                </span>{' '}
                {gaps[weakest.key]}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="lm-section lm-section-alt">
        <div className="shell" style={{ maxWidth: 640 }}>
          <h2>Open your full gap report.</h2>
          <p className="lm-section-sub" style={{ marginBottom: 24 }}>
            The per-dimension breakdown, the model-layer vs app-layer worked example that
            most candidates never see, and a safety-woven answer template you can use in
            any AI product-sense round.
          </p>
          <LeadGateForm
            sourceSlug="ai-pm-readiness"
            mode="gate"
            magnetResult={payload}
            title="Open your full gap report"
            subtitle="Per-dimension gaps, the model-layer vs app-layer worked example, and a safety-woven answer template."
            ctaLabel="Open your gap report"
            postUnlockCtaLabel="Practice it on a real challenge"
            signupNext="/challenges"
          >
            <p className="eyebrow"><span className="dot" />Unlocked: model layer vs app layer</p>
            <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
              A team is debating whether to fine-tune a model to fix inconsistent output.
              The first question to ask is not which model to use but whether the model is
              the right layer to fix this in. Most formatting and consistency problems are
              app-layer problems: a system prompt with explicit output rules, a few-shot
              template, or a post-processing step will fix them without touching the model
              and without the cost and latency of fine-tuning.
            </p>
            <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6, margin: '8px 0 0' }}>
              The line that separates a pass from a reject: can you say exactly which layer
              owns the problem and why moving it to a different layer would cost more than
              it gains?
            </p>
          </LeadGateForm>
        </div>
      </section>
    </>
  )
}
