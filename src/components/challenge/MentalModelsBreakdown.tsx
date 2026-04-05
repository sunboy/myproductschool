'use client'

import Link from 'next/link'

interface MentalModelsBreakdownProps {
  breakdown: Array<{
    step: string
    competency: string
    reasoning_move: string
    demonstrated: string
    missed: string
  }>
  weakestCompetency?: string
  nextChallengeId?: string
  nextChallengeTitle?: string
}

const COMPETENCY_LABELS: Record<string, string> = {
  motivation_theory: 'Motivation Theory',
  cognitive_empathy: 'Cognitive Empathy',
  taste: 'Taste',
  strategic_thinking: 'Strategic Thinking',
  creative_execution: 'Creative Execution',
  domain_expertise: 'Domain Expertise',
}

const STEP_COLORS: Record<string, string> = {
  frame: 'bg-primary/10 text-primary',
  list: 'bg-tertiary/10 text-tertiary',
  optimize: 'bg-secondary/10 text-secondary',
  win: 'bg-primary-container/30 text-primary',
}

const STEP_ICONS: Record<string, string> = {
  frame: 'frame_inspect',
  list: 'list_alt',
  optimize: 'tune',
  win: 'emoji_events',
}

function formatCompetency(key: string): string {
  return COMPETENCY_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function MentalModelsBreakdown({
  breakdown,
  weakestCompetency,
  nextChallengeId,
  nextChallengeTitle,
}: MentalModelsBreakdownProps) {
  if (!breakdown || breakdown.length === 0) return null

  return (
    <div className="bg-surface-container rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-xl">auto_stories</span>
        <h3 className="font-headline text-lg font-bold text-on-surface">What You Were Building</h3>
      </div>

      {/* Step cards */}
      <div className="space-y-3">
        {breakdown.map((item) => {
          const stepKey = item.step.toLowerCase()
          const badgeColor = STEP_COLORS[stepKey] ?? 'bg-surface-container-high text-on-surface-variant'
          const icon = STEP_ICONS[stepKey] ?? 'check_circle'

          return (
            <div key={item.step} className="bg-surface-container-low rounded-lg p-4 space-y-2">
              {/* Step label + competency */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-label font-semibold uppercase tracking-wide ${badgeColor}`}>
                  <span className="material-symbols-outlined text-sm">{icon}</span>
                  {item.step.toUpperCase()}
                </span>
                <span className="text-xs font-label text-on-surface-variant">
                  {formatCompetency(item.competency)}
                </span>
              </div>

              {/* Reasoning move */}
              {item.reasoning_move && (
                <p className="text-sm font-body text-on-surface leading-relaxed">{item.reasoning_move}</p>
              )}

              {/* Demonstrated */}
              {item.demonstrated && item.demonstrated !== 'No signal recorded' && (
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">check_circle</span>
                  <p className="text-xs font-body text-on-surface-variant">{item.demonstrated}</p>
                </div>
              )}

              {/* Missed */}
              {item.missed && (
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-base mt-0.5 shrink-0">info</span>
                  <p className="text-xs font-body text-on-surface-variant">{item.missed}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Weakest competency callout */}
      {weakestCompetency && (
        <div className="bg-tertiary/5 border border-tertiary/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-lg">trending_down</span>
            <p className="text-sm font-label font-semibold text-on-surface">
              Weakest competency this challenge: <span className="text-tertiary">{formatCompetency(weakestCompetency)}</span>
            </p>
          </div>
          {nextChallengeId && nextChallengeTitle && (
            <Link
              href={`/challenges/${nextChallengeId}`}
              className="inline-flex items-center gap-1.5 text-sm font-label font-semibold text-primary hover:underline"
            >
              Next challenge to develop this
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
