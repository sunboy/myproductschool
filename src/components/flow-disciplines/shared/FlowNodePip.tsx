'use client'

import type { FlowStepId } from '@/lib/data/flow-framework/types'

const STEP_NAMES: Record<FlowStepId, string> = {
  F: 'FRAME',
  L: 'LIST',
  O: 'OPTIMIZE',
  W: 'WIN',
}

interface FlowNodePipProps {
  step: FlowStepId
  active?: boolean
  size?: number
  className?: string
}

export function FlowNodePip({ step, active = false, size = 32, className = '' }: FlowNodePipProps) {
  const label = STEP_NAMES[step]
  return (
    <div
      className={`flex flex-col items-center gap-1 ${className}`}
      aria-label={`${label} step${active ? ' (active)' : ''}`}
    >
      <div
        className={`
          flex items-center justify-center rounded-full border font-label font-semibold text-xs transition-all duration-300
          ${active
            ? 'bg-primary border-primary text-on-primary shadow-sm'
            : 'bg-surface-container-high border-outline-variant text-on-surface-variant'
          }
        `}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
      >
        {step}
      </div>
      <span
        className="font-label font-bold uppercase tracking-widest transition-colors duration-300"
        style={{
          fontSize: Math.round(size * 0.3),
          color: active ? '#8ecf9e' : 'rgba(245,240,230,0.85)',
        }}
      >
        {label}
      </span>
    </div>
  )
}
