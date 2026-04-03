'use client'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { LumaInsightBlock } from '@/components/learning/LumaInsightBlock'
import { OptionCard } from '@/components/v2/OptionCard'
import type { AutopsyDecision, AutopsyChallenge } from '@/lib/types'

interface ChallengeViewerProps {
  decision: AutopsyDecision
  challenge: AutopsyChallenge
  productName: string
}

export function ChallengeViewer({ decision, challenge, productName }: ChallengeViewerProps) {
  return (
    <div className="p-6 space-y-5">

      {/* 1. Decision header */}
      <div>
        <p className="text-xs text-on-surface-variant font-label mb-1">{productName}</p>
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">{decision.title}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-0.5 text-xs font-label font-bold">
            {decision.area}
          </span>
          <span className="bg-surface-container-high text-on-surface-variant rounded-full px-3 py-0.5 text-xs font-label">
            {decision.difficulty}
          </span>
          <span className="bg-primary-fixed text-on-surface rounded-full px-3 py-0.5 text-xs font-label font-bold">
            {decision.principle}
          </span>
        </div>
      </div>

      {/* 2. What they did */}
      <div className="bg-surface-container rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="material-symbols-outlined text-lg text-primary"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            lightbulb
          </span>
          <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
            What They Did
          </span>
        </div>
        <p className="text-sm text-on-surface leading-relaxed">{decision.what_they_did}</p>
      </div>

      {/* 3. Real reasoning */}
      <div className="bg-tertiary-container/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
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

      {/* 4. FLOW Challenge */}
      <div>
        <p className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest mb-3">
          FLOW Challenge
        </p>
        <div className="bg-surface-container-high rounded-2xl p-5 mb-4">
          <p className="font-headline text-base font-bold text-on-surface">{decision.challenge_question}</p>
          {challenge.context && (
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{challenge.context}</p>
          )}
        </div>

        {/* Options (read-only) */}
        <div className="space-y-2">
          {challenge.options.map((opt, i) => (
            <OptionCard
              key={i}
              option={{
                id: `opt-${i}`,
                option_label: opt.label,
                option_text: opt.text,
              }}
              selected={false}
              revealed={false}
              disabled={true}
              onSelect={(_id: string) => {}}
            />
          ))}
        </div>

        {/* Luma "coming soon" nudge */}
        <div className="flex items-center gap-2 bg-primary-container/30 rounded-xl p-3 mt-3">
          <LumaGlyph state="idle" size={24} className="text-primary shrink-0" />
          <p className="text-xs text-on-surface-variant">
            Answer these in Practice Mode — graded FLOW challenges coming soon.
          </p>
        </div>
      </div>

      {/* 5. Luma's Take — most prominent Luma moment */}
      <div className="mt-6">
        <LumaInsightBlock insight={challenge.insight} />
      </div>
    </div>
  )
}
