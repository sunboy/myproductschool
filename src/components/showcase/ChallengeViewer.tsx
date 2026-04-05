'use client'
import { useState } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { LumaInsightBlock } from '@/components/learning/LumaInsightBlock'
import { OptionCard } from '@/components/v2/OptionCard'
import type { AutopsyDecision, AutopsyChallenge } from '@/lib/types'

interface ChallengeViewerProps {
  decision: AutopsyDecision
  challenge: AutopsyChallenge
  productName: string
}

const FLOW_STEPS = [
  { key: 'frame',    label: 'Frame',    subtitle: 'What did they actually do?'        },
  { key: 'list',     label: 'List',     subtitle: 'Who and what was affected?'         },
  { key: 'optimize', label: 'Optimize', subtitle: 'What was the real reasoning?'       },
  { key: 'win',      label: 'Win',      subtitle: 'Which explanation is most correct?' },
]

const STEP_COACHING = [
  {
    thought: 'Start with what actually happened — not why. Describe the decision in one sentence as if explaining it to a teammate who doesn\'t use the product.',
    tip: 'The best product analysts separate observation from interpretation. What did they ship? Save the "why" for later.',
  },
  {
    thought: 'Who benefits from this decision? Who loses? Think beyond the obvious user — consider competitors, adjacent teams, the business model.',
    tip: 'Every product decision has at least three stakeholders most people miss. Work backwards from the outcome to find them.',
  },
  {
    thought: 'Surface-level reasoning is usually wrong. Ask: what would they have had to believe to make this choice? What were they optimizing for?',
    tip: 'The real reasoning behind a product decision often lives one level deeper than the announced rationale. Look for the strategic constraint.',
  },
  {
    thought: 'Pick the explanation that generalizes — the one that would help you make a better decision in a different product context.',
    tip: 'The best answer isn\'t just "correct about this product." It teaches a principle you can apply tomorrow.',
  },
]

export function ChallengeViewer({ decision, challenge, productName }: ChallengeViewerProps) {
  const [activeStep, setActiveStep] = useState(0)

  const step = FLOW_STEPS[activeStep]
  const coaching = STEP_COACHING[activeStep]
  const pct = Math.round((activeStep / FLOW_STEPS.length) * 100)

  return (
    <section className="flex-1 bg-surface flex flex-col overflow-hidden relative h-full">

      {/* ── Progress bar + FLOW step tabs ── */}
      <div className="border-b border-outline-variant/30 flex-shrink-0">
        {/* Thin progress track */}
        <div className="w-full h-0.5 bg-outline-variant/20">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Step tabs row */}
        <div className="px-6 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {FLOW_STEPS.map((s, i) => {
              const isComplete = i < activeStep
              const isActive   = i === activeStep
              return (
                <div key={s.key} className="flex items-center gap-2">
                  {i > 0 && <div className="border-r border-outline-variant/30 h-4 mx-1" />}
                  <button
                    onClick={() => setActiveStep(i)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container'
                        : isComplete
                          ? 'text-primary'
                          : 'opacity-40 text-on-surface-variant'
                    }`}
                  >
                    {isComplete ? (
                      <div className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px]">✓</div>
                    ) : (
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        article
                      </span>
                    )}
                    <span className="text-xs font-bold">{s.label}</span>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Progress badge */}
          {pct > 0 && pct < 100 && (
            <span className="text-[10px] font-bold text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full">
              {pct}% done — keep going
            </span>
          )}
        </div>
      </div>

      {/* ── Step content ── */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">

          {/* Step heading */}
          <p className="text-xs text-on-surface-variant font-label mb-1">{productName}</p>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-1">
            {step.label} — {step.subtitle}
          </h2>
          <h3 className="font-headline text-base text-on-surface-variant mb-6">{decision.title}</h3>

          {/* Step 0 — Frame: what they did */}
          {activeStep === 0 && (
            <div className="space-y-4">
              <div className="bg-surface-container rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="material-symbols-outlined text-lg text-primary"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                  >
                    lightbulb
                  </span>
                  <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                    The Decision
                  </span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{decision.what_they_did}</p>
              </div>
              <button
                onClick={() => setActiveStep(1)}
                className="w-full mt-2 bg-primary text-on-primary rounded-full py-2.5 text-sm font-label font-bold hover:opacity-90 transition-opacity"
              >
                Continue to List →
              </button>
            </div>
          )}

          {/* Step 1 — List: area + principle + challenge question */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="bg-surface-container rounded-xl p-5">
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-0.5 text-xs font-label font-bold">
                    {decision.area}
                  </span>
                  <span className="bg-surface-container-high text-on-surface-variant rounded-full px-3 py-0.5 text-xs font-label">
                    {decision.difficulty}
                  </span>
                </div>
                <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  The Challenge Question
                </p>
                <p className="font-headline text-base font-bold text-on-surface">{decision.challenge_question}</p>
                {challenge.context && (
                  <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{challenge.context}</p>
                )}
              </div>
              <button
                onClick={() => setActiveStep(2)}
                className="w-full mt-2 bg-primary text-on-primary rounded-full py-2.5 text-sm font-label font-bold hover:opacity-90 transition-opacity"
              >
                Continue to Optimize →
              </button>
            </div>
          )}

          {/* Step 2 — Optimize: real reasoning */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="bg-tertiary-container/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="material-symbols-outlined text-lg text-tertiary"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                  >
                    psychology
                  </span>
                  <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                    The Real Reasoning
                  </span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{decision.real_reasoning}</p>
              </div>
              <div className="bg-primary-fixed/40 rounded-xl p-4">
                <span className="text-xs font-label font-bold text-primary uppercase tracking-widest">Principle</span>
                <p className="text-sm font-bold text-on-surface mt-1">{decision.principle}</p>
              </div>
              <button
                onClick={() => setActiveStep(3)}
                className="w-full mt-2 bg-primary text-on-primary rounded-full py-2.5 text-sm font-label font-bold hover:opacity-90 transition-opacity"
              >
                Win — Test your understanding →
              </button>
            </div>
          )}

          {/* Step 3 — Win: MCQ options + Luma's insight */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant font-label mb-4">
                Which of these best explains the strategic reasoning behind this decision?
              </p>

              <div className="space-y-2">
                {challenge.options.map((opt, i) => (
                  <OptionCard
                    key={i}
                    option={{
                      id: opt.id,
                      option_label: opt.id.toUpperCase(),
                      option_text: opt.text,
                    }}
                    selected={false}
                    revealed={false}
                    disabled={true}
                    onSelect={(_id: string) => {}}
                  />
                ))}
              </div>

              {/* Coming soon nudge */}
              <div className="flex items-center gap-2 bg-primary-container/30 rounded-xl p-3 mt-2">
                <LumaGlyph state="idle" size={22} className="text-primary shrink-0" />
                <p className="text-xs text-on-surface-variant">
                  Answer these in Practice Mode — graded FLOW challenges coming soon.
                </p>
              </div>

              {/* Luma's Take — most prominent moment */}
              <div className="mt-6">
                <LumaInsightBlock insight={challenge.insight} />
              </div>
            </div>
          )}

          {/* Luma thought starter — shown on all steps */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <div className="flex items-center gap-2 mb-3">
                <LumaGlyph size={22} state="speaking" className="text-primary" />
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">
                  Luma's Thought Starter
                </span>
              </div>
              <p className="text-xs italic text-on-surface-variant leading-relaxed">
                &ldquo;{coaching.thought}&rdquo;
              </p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="material-symbols-outlined text-sm text-on-surface-variant"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                >
                  info
                </span>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">
                  About This Decision
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-on-surface-variant">
                  <span className="font-bold text-on-surface">Area:</span> {decision.area}
                </p>
                <p className="text-xs text-on-surface-variant">
                  <span className="font-bold text-on-surface">Difficulty:</span> {decision.difficulty}
                </p>
                <p className="text-xs text-on-surface-variant">
                  <span className="font-bold text-on-surface">Principle:</span> {decision.principle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Luma coaching strip — pinned to bottom ── */}
      <div className="bg-primary-fixed/30 border-t border-primary/10 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <LumaGlyph size={28} state="speaking" className="text-primary flex-shrink-0" />
        <div className="flex-1 text-sm text-on-primary-container font-medium">
          <span className="font-bold">Pro tip:</span> {coaching.tip}
        </div>
      </div>

    </section>
  )
}
