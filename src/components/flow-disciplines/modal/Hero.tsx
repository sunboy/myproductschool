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
      className="flex items-start justify-between gap-6 px-6 py-5"
      style={{ background: 'linear-gradient(135deg, #1f362d 0%, #2d4a3e 100%)', borderBottom: '1px solid rgba(212,165,116,0.18)' }}
    >
      {/* Left: discipline name + tagline */}
      <div className="flex flex-col gap-1 min-w-0">
        <p
          className="font-label text-[15px] uppercase tracking-widest"
          style={{ color: 'rgba(212,165,116,0.65)' }}
        >
          FLOW Discipline
        </p>
        <h2 className="font-headline text-[25px] font-bold leading-tight" style={{ color: '#f5f0e6' }}>
          {discipline.name}
        </h2>
        <p className="font-body text-[17.5px] mt-0.5 leading-snug" style={{ color: 'rgba(245,240,230,0.65)' }}>
          {discipline.tagline}
        </p>
        <div className="flex items-center gap-3 mt-2 text-[15px] font-label" style={{ color: 'rgba(212,165,116,0.55)' }}>
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
