'use client'

import { useAnimationMode } from '../context/AnimationModeContext'
import type { AnimationMode } from '@/lib/data/flow-framework/types'
import type { FlowStepId } from '@/lib/data/flow-framework/types'

interface ControlsBarProps {
  focusedStep: FlowStepId | null
  onStepFocus: (step: FlowStepId | null) => void
}

const ANIMATION_MODES: { value: AnimationMode; label: string }[] = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'maximalist', label: 'Maximalist' },
]

const FLOW_STEPS: { id: FlowStepId; label: string }[] = [
  { id: 'F', label: 'Frame' },
  { id: 'L', label: 'List' },
  { id: 'O', label: 'Optimize' },
  { id: 'W', label: 'Win' },
]

export function ControlsBar({ focusedStep, onStepFocus }: ControlsBarProps) {
  const { mode, setMode } = useAnimationMode()

  return (
    <div className="flex items-center justify-between gap-6 px-6 py-3 border-t border-outline-variant">
      {/* FLOW step filters */}
      <div className="flex items-center gap-1.5">
        <span className="font-label text-xs text-on-surface-variant mr-2 opacity-60 uppercase tracking-wider">
          Focus
        </span>
        <button
          type="button"
          onClick={() => onStepFocus(null)}
          className={`font-label text-xs px-2.5 py-1 rounded-full transition-all duration-200 ${
            focusedStep === null
              ? 'bg-secondary-container text-on-secondary-container'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          All
        </button>
        {FLOW_STEPS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onStepFocus(focusedStep === id ? null : id)}
            className={`font-label text-xs px-2.5 py-1 rounded-full transition-all duration-200 ${
              focusedStep === id
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Animation mode switcher */}
      <div className="flex items-center gap-0.5 bg-surface-container-high rounded-full p-0.5">
        {ANIMATION_MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`font-label text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
              mode === value
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
