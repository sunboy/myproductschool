'use client'

import Link from 'next/link'
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
  scenarioPanel?: React.ReactNode
  fromPlan?: string
  nextChallengeSlug?: string
}

const STEP_LABELS: Record<FlowStep, string> = {
  frame:    'Frame',
  list:     'List',
  optimize: 'Optimize',
  win:      'Win',
}

const GRADE_COLOR: Record<string, string> = {
  Outstanding:      'text-primary',
  Strong:           'text-primary',
  Developing:       'text-on-surface-variant',
  'Needs Practice': 'text-on-surface-variant',
}

export function ChallengeComplete({
  totalScore,
  maxScore,
  gradeLabel,
  xpAwarded,
  stepBreakdown,
  competencyDeltas,
  onRetry,
  onNextChallenge,
  scenarioPanel,
  fromPlan,
  nextChallengeSlug,
}: ChallengeCompleteProps) {
  const isHighScore = gradeLabel === 'Outstanding' || gradeLabel === 'Strong'
  const gradeColorClass = GRADE_COLOR[gradeLabel] ?? 'text-on-surface-variant'

  return (
    <div className="flex h-full animate-step-enter">

      {/* ── Left: scenario panel with success overlay ── */}
      {scenarioPanel && (
        <div className="relative w-[360px] shrink-0">
          {scenarioPanel}
          {/* Translucent success overlay */}
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3"
            style={{
              background: 'rgba(23,37,28,0.60)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
            }}
          >
            <span
              className="material-symbols-outlined text-white"
              style={{
                fontSize: 80,
                fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48",
                filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.3))',
              }}
            >
              task_alt
            </span>
            <div className="text-center px-6">
              <p className={`font-headline font-bold text-2xl text-white`}>{gradeLabel}</p>
              <p className="font-label text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Challenge complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Right: results scroll ── */}
      <div
        className="flex-1 overflow-y-auto px-8 py-10 space-y-10"
        style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(74,124,89,0.05) 0%, transparent 55%)' }}
      >

        {/* Score hero */}
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <LumaGlyph
            size={72}
            state={isHighScore ? 'celebrating' : 'reviewing'}
            className="text-primary"
          />
          <p className="font-label text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            Challenge complete
          </p>
          <h1
            className={`font-headline font-bold leading-none ${gradeColorClass}`}
            style={{ fontSize: 'clamp(36px, 5vw, 52px)', letterSpacing: '-0.025em' }}
          >
            {gradeLabel}
          </h1>
          <p className="font-headline text-2xl text-on-surface" style={{ letterSpacing: '-0.01em' }}>
            {totalScore.toFixed(1)}{' '}
            <span className="text-on-surface-variant text-lg">/ {maxScore.toFixed(1)}</span>
          </p>
          <span
            className="inline-block bg-primary text-on-primary rounded-full px-5 py-1.5 font-label font-semibold text-sm"
            style={{ boxShadow: '0 2px 10px rgba(74,124,89,0.25)' }}
          >
            +{xpAwarded} XP
          </span>
        </div>

        {/* ── Section divider ── */}
        <div className="h-px bg-outline-variant/30" />

        {/* FLOW breakdown */}
        {stepBreakdown.length > 0 && (
          <div className="space-y-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              Your FLOW
            </p>
            <div className="grid grid-cols-4 gap-0 divide-x divide-outline-variant/20">
              {stepBreakdown.map(({ step, score, maxScore: ms }) => {
                const pct = ms > 0 ? (score / ms) * 100 : 0
                return (
                  <div key={step} className="px-4 first:pl-0 last:pr-0 space-y-2">
                    <p className="font-label text-xs text-on-surface-variant">{STEP_LABELS[step]}</p>
                    <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <p className="font-label text-sm text-on-surface tabular-nums">
                      {score.toFixed(1)}
                      <span className="text-on-surface-variant text-xs">/{ms.toFixed(0)}</span>
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Learner DNA */}
        {competencyDeltas.length > 0 && (
          <div className="space-y-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              Learner DNA
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
          <button
            onClick={onRetry}
            className="bg-secondary-container text-on-secondary-container rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150"
          >
            Try again
          </button>
          {fromPlan && (
            <Link
              href={`/explore/plans/${fromPlan}`}
              className="inline-flex items-center gap-1.5 bg-surface-container text-on-surface rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 border border-outline-variant/40"
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                arrow_back
              </span>
              Back to plan
            </Link>
          )}
          {fromPlan && nextChallengeSlug ? (
            <Link
              href={`/workspace/challenges/${nextChallengeSlug}?from_plan=${fromPlan}`}
              className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-sm"
            >
              Next challenge
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
              >
                arrow_forward
              </span>
            </Link>
          ) : !fromPlan ? (
            <button
              onClick={onNextChallenge}
              className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-sm"
            >
              Next challenge
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
