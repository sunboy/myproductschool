'use client'

import type { FlowStep } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface CompetencySignal {
  primary: string
  signal: string
  framework_hint: string
}

interface StepRevealProps {
  step: FlowStep
  stepScore: number
  maxScore: number
  gradeLabel: string
  roleContext: string
  careerSignal: string
  competencySignal?: CompetencySignal | null
  onNext: () => void
  isLastStep: boolean
}

const STEP_NAMES: Record<FlowStep, string> = {
  frame:    'Frame',
  list:     'List',
  optimize: 'Optimize',
  win:      'Win',
}

const NEXT_STEP: Record<FlowStep, FlowStep | null> = {
  frame:    'list',
  list:     'optimize',
  optimize: 'win',
  win:      null,
}

const GRADE_BADGE: Record<string, string> = {
  Outstanding:     'bg-primary text-on-primary',
  Strong:          'bg-tertiary-container text-on-surface',
  Developing:      'bg-secondary-container text-on-secondary-container',
  'Needs Practice': 'bg-surface-container-highest text-on-surface-variant',
}

// Terra primary green — used for all step accents
const TERRA_PRIMARY = '#4a7c59'

export function StepReveal({
  step,
  stepScore,
  maxScore,
  gradeLabel,
  roleContext,
  careerSignal,
  competencySignal,
  onNext,
  isLastStep,
}: StepRevealProps) {
  const badgeClass = GRADE_BADGE[gradeLabel] ?? GRADE_BADGE['Needs Practice']
  const nextStep = NEXT_STEP[step]

  return (
    <div
      className="card-elevated rounded-xl p-6 space-y-5 border-t-4"
      style={{ borderTopColor: TERRA_PRIMARY }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-label text-sm text-on-surface-variant">{STEP_NAMES[step]} step result</p>
          <p className="font-headline text-3xl text-primary">
            {stepScore.toFixed(1)}{' '}
            <span className="text-on-surface-variant text-xl">/ {maxScore.toFixed(1)}</span>
          </p>
        </div>
        <span className={`rounded-full px-4 py-1.5 font-label text-sm font-semibold shadow-sm ${badgeClass}`}>
          {gradeLabel}
        </span>
      </div>

      {/* Luma coaching — glass card */}
      {roleContext && (
        <div
          className="flex items-start gap-3 rounded-xl p-4 border"
          style={{
            background: 'rgba(255,255,255,0.70)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderColor: 'rgba(74,124,89,0.12)',
            boxShadow: '0 2px 8px rgba(46,50,48,0.06)',
          }}
        >
          <LumaGlyph size={40} state="speaking" className="text-primary shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-body text-sm text-on-surface">{roleContext}</p>
            {careerSignal && (
              <p className="font-body text-xs text-on-surface-variant italic">{careerSignal}</p>
            )}
          </div>
        </div>
      )}

      {/* Reasoning Move — left step-color border */}
      {competencySignal && (
        <div
          className="rounded-lg bg-surface-container p-4 border-l-4"
          style={{ borderLeftColor: TERRA_PRIMARY }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary text-lg">neurology</span>
            <span className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wide">
              Reasoning Move
            </span>
          </div>
          <p className="text-sm font-body text-on-surface">{competencySignal.signal}</p>
          {competencySignal.framework_hint && (
            <p className="text-xs text-on-surface-variant mt-1 italic">{competencySignal.framework_hint}</p>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        >
          {isLastStep ? 'See Final Results' : `Next: ${nextStep ? STEP_NAMES[nextStep] : ''}`}
        </button>
      </div>
    </div>
  )
}
