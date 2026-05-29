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
      className="flex flex-col gap-2.5 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
      style={{ background: 'linear-gradient(135deg, #1f362d 0%, #2d4a3e 100%)', borderBottom: '1px solid rgba(212,165,116,0.18)' }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <p
          className="font-label text-[10px] uppercase tracking-[0.16em]"
          style={{ color: 'rgba(212,165,116,0.65)' }}
        >
          FLOW discipline map
        </p>
        <h2 className="font-headline text-[20px] font-bold leading-tight sm:text-[22px]" style={{ color: '#f5f0e6', letterSpacing: 0 }}>
          How {discipline.name} uses FLOW
        </h2>
        <p className="font-body text-[13px] max-w-[760px] leading-snug sm:text-[14px]" style={{ color: 'rgba(245,240,230,0.68)' }}>
          {discipline.learnerExplanation.plainPurpose}
        </p>
        <div className="mt-1 inline-flex max-w-max rounded-md px-2.5 py-1" style={{ background: 'rgba(22,38,32,0.55)', border: '1px solid rgba(212,165,116,0.14)' }}>
          <p className="font-label text-[11px] leading-tight" style={{ color: 'rgba(245,240,230,0.62)' }}>
            Source ideas → skills → scored FLOW moves
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 lg:pb-0">
        {FLOW_STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onStepClick(step)}
            className="appearance-none bg-transparent border-0 p-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary rounded"
            aria-label={`Show ${step} step`}
          >
            <FlowNodePip
              step={step}
              active={focusedStep === step}
              size={28}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
