'use client'

import type { FlowStepId } from '@/lib/data/flow-framework/types'

interface ControlsBarProps {
  focusedStep: FlowStepId | null
  onStepFocus: (step: FlowStepId | null) => void
}

const FLOW_STEPS: { id: FlowStepId; label: string }[] = [
  { id: 'F', label: 'Frame' },
  { id: 'L', label: 'List' },
  { id: 'O', label: 'Optimize' },
  { id: 'W', label: 'Win' },
]

export function ControlsBar({ focusedStep, onStepFocus }: ControlsBarProps) {
  return (
    <div
      className="flex items-center gap-4 overflow-x-auto px-4 py-1.5 sm:px-5"
      style={{ borderTop: '1px solid rgba(212,165,116,0.18)', background: '#1a2f26' }}
    >
      {/* FLOW step filters */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="font-label text-[11px] mr-1 uppercase tracking-wider"
          style={{ color: 'rgba(212,165,116,0.5)' }}
        >
          Show
        </span>
        <button
          type="button"
          onClick={() => onStepFocus(null)}
          className="font-label text-[12px] px-2.5 py-0.5 rounded-full transition-all duration-200 whitespace-nowrap"
          style={
            focusedStep === null
              ? { background: 'rgba(212,165,116,0.2)', color: '#ffc580' }
              : { color: 'rgba(245,240,230,0.5)' }
          }
        >
          Whole map
        </button>
        {FLOW_STEPS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onStepFocus(focusedStep === id ? null : id)}
            className="font-label text-[12px] px-2.5 py-0.5 rounded-full transition-all duration-200 whitespace-nowrap"
            style={
              focusedStep === id
                ? { background: '#d4a574', color: '#1f362d' }
                : { color: 'rgba(245,240,230,0.5)' }
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
