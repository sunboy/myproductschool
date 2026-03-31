'use client'

import type { FlowStep } from '@/lib/types'

interface FlowStepperProps {
  currentStep: FlowStep
  completedSteps: FlowStep[]
}

const STEPS: Array<{ id: FlowStep; label: string; icon: string }> = [
  { id: 'frame', label: 'Frame', icon: 'crop_free' },
  { id: 'list', label: 'List', icon: 'list' },
  { id: 'optimize', label: 'Optimize', icon: 'tune' },
  { id: 'win', label: 'Win', icon: 'emoji_events' },
]

export function FlowStepper({ currentStep, completedSteps }: FlowStepperProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      {STEPS.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.id)
        const isActive = step.id === currentStep
        const isPending = !isCompleted && !isActive

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div
              className={[
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-sm font-medium transition-colors flex-1 justify-center',
                isActive
                  ? 'bg-primary text-on-primary'
                  : isCompleted
                  ? 'bg-primary-fixed text-on-surface'
                  : 'bg-surface-container text-on-surface-variant',
              ].join(' ')}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                {isCompleted ? 'check_circle' : step.icon}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="w-3 h-0.5 bg-outline-variant mx-1 shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}
