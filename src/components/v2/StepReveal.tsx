'use client'

import type { FlowStep } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface StepRevealProps {
  step: FlowStep
  stepScore: number
  maxScore: number
  gradeLabel: string
  roleContext: string
  careerSignal: string
  onNext: () => void
  isLastStep: boolean
}

const STEP_NAMES: Record<FlowStep, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const NEXT_STEP: Record<FlowStep, FlowStep | null> = {
  frame: 'list',
  list: 'optimize',
  optimize: 'win',
  win: null,
}

const GRADE_BADGE: Record<string, string> = {
  Outstanding: 'bg-primary text-on-primary',
  Strong: 'bg-tertiary-container text-on-surface',
  Developing: 'bg-secondary-container text-on-secondary-container',
  'Needs Practice': 'bg-surface-container-highest text-on-surface-variant',
}

export function StepReveal({
  step,
  stepScore,
  maxScore,
  gradeLabel,
  roleContext,
  careerSignal,
  onNext,
  isLastStep,
}: StepRevealProps) {
  const badgeClass = GRADE_BADGE[gradeLabel] ?? GRADE_BADGE['Needs Practice']
  const nextStep = NEXT_STEP[step]

  return (
    <div className="bg-surface-container rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-label text-sm text-on-surface-variant">{STEP_NAMES[step]} step result</p>
          <p className="font-headline text-2xl text-on-surface">
            {stepScore.toFixed(1)} <span className="text-on-surface-variant text-lg">/ {maxScore.toFixed(1)}</span>
          </p>
        </div>
        <span className={`rounded-full px-4 py-1.5 font-label text-sm font-semibold ${badgeClass}`}>
          {gradeLabel}
        </span>
      </div>

      {/* Luma coaching */}
      {roleContext && (
        <div className="flex items-start gap-3 bg-surface-container-low rounded-xl p-4">
          <LumaGlyph size={40} state="speaking" className="text-primary shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-body text-sm text-on-surface">{roleContext}</p>
            {careerSignal && (
              <p className="font-body text-xs text-on-surface-variant italic">{careerSignal}</p>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {isLastStep ? 'See Final Results' : `Next: ${nextStep ? STEP_NAMES[nextStep] : ''}`}
        </button>
      </div>
    </div>
  )
}
