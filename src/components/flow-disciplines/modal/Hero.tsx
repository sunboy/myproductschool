'use client'

import { FlowNodePip } from '../shared/FlowNodePip'
import type { Discipline, FlowStepId } from '@/lib/data/flow-framework/types'

interface HeroProps {
  discipline: Discipline
  focusedStep: FlowStepId | null
  onStepClick: (step: FlowStepId) => void
}

const FLOW_STEPS: FlowStepId[] = ['F', 'L', 'O', 'W']

export function Hero({ discipline, focusedStep, onStepClick }: HeroProps) {
  return (
    <div
      className="flex items-start justify-between gap-6 px-6 py-5 border-b border-outline-variant"
      style={{ background: 'linear-gradient(135deg, rgba(31,54,45,0.06) 0%, rgba(45,74,62,0.04) 100%)' }}
    >
      {/* Left: discipline name + tagline */}
      <div className="flex flex-col gap-1 min-w-0">
        <p
          className="font-label text-xs uppercase tracking-widest"
          style={{ color: 'rgba(212,164,116,0.7)' }}
        >
          FLOW Discipline
        </p>
        <h2 className="font-headline text-xl font-semibold text-on-surface leading-tight">
          {discipline.name}
        </h2>
        <p className="font-body text-sm text-on-surface-variant mt-0.5 leading-snug">
          {discipline.tagline}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant font-label opacity-70">
          <span>{discipline.traditions.length} traditions</span>
          <span>·</span>
          <span>{discipline.competencies.length} competencies</span>
        </div>
      </div>

      {/* Right: FLOW step pips */}
      <div className="flex items-center gap-3 shrink-0 pt-1">
        {FLOW_STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onStepClick(step)}
            className="appearance-none bg-transparent border-0 p-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
            aria-label={`Focus ${step} step`}
          >
            <FlowNodePip
              step={step}
              active={focusedStep === step}
              size={36}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
