'use client'

import type { Challenge, FlowStep } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { CompetencyDelta } from './CompetencyDelta'

interface StepBreakdownItem {
  step: FlowStep
  score: number
  maxScore: number
}

interface CompetencyDeltaItem {
  competency: string
  before: number
  after: number
}

interface ChallengeCompleteProps {
  challenge: Challenge
  totalScore: number
  maxScore: number
  gradeLabel: string
  xpAwarded: number
  stepBreakdown: StepBreakdownItem[]
  competencyDeltas: CompetencyDeltaItem[]
  onRetry: () => void
  onNextChallenge: () => void
}

const STEP_LABELS: Record<FlowStep, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const GRADE_COLOR: Record<string, string> = {
  Outstanding: 'text-primary',
  Strong: 'text-tertiary',
  Developing: 'text-on-surface-variant',
  'Needs Practice': 'text-on-surface-variant',
}

export function ChallengeComplete({
  challenge,
  totalScore,
  maxScore,
  gradeLabel,
  xpAwarded,
  stepBreakdown,
  competencyDeltas,
  onRetry,
  onNextChallenge,
}: ChallengeCompleteProps) {
  const isHighScore = totalScore >= 2.0
  const gradeColorClass = GRADE_COLOR[gradeLabel] ?? 'text-on-surface-variant'

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <LumaGlyph size={80} state={isHighScore ? 'celebrating' : 'reviewing'} className="text-primary" />
          </div>
          <p className="font-label text-sm text-on-surface-variant uppercase tracking-wide">Challenge complete</p>
          <h1 className={`font-headline text-4xl font-bold ${gradeColorClass}`}>{gradeLabel}</h1>
          <p className="font-headline text-2xl text-on-surface">
            {totalScore.toFixed(1)} <span className="text-on-surface-variant text-lg">/ {maxScore.toFixed(1)}</span>
          </p>
          <span className="inline-block bg-primary text-on-primary rounded-full px-5 py-1.5 font-label font-semibold text-sm">
            +{xpAwarded} XP
          </span>
        </div>

        {/* Step breakdown */}
        <div className="bg-surface-container rounded-xl p-5 space-y-4">
          <h2 className="font-headline text-base text-on-surface">Step breakdown</h2>
          <div className="grid grid-cols-4 gap-3">
            {stepBreakdown.map(({ step, score, maxScore: ms }) => {
              const pct = ms > 0 ? (score / ms) * 100 : 0
              return (
                <div key={step} className="space-y-2">
                  <p className="font-label text-xs text-on-surface-variant text-center">{STEP_LABELS[step]}</p>
                  <div className="h-16 bg-surface-container-high rounded-lg overflow-hidden flex items-end">
                    <div
                      className="w-full bg-primary rounded-lg transition-all duration-500"
                      style={{ height: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <p className="font-label text-xs text-center text-on-surface">
                    {score.toFixed(1)}<span className="text-on-surface-variant">/{ms.toFixed(0)}</span>
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Competency deltas */}
        {competencyDeltas.length > 0 && (
          <div className="bg-surface-container rounded-xl p-5 space-y-4">
            <h2 className="font-headline text-base text-on-surface">Learner DNA update</h2>
            <div className="space-y-3">
              {competencyDeltas.map((d) => (
                <CompetencyDelta
                  key={d.competency}
                  label={d.competency}
                  before={d.before}
                  after={d.after}
                />
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="bg-secondary-container text-on-secondary-container rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <button
            onClick={onNextChallenge}
            className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Next Challenge
          </button>
        </div>
      </div>
    </div>
  )
}
