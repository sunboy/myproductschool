'use client'

import type { FlowStep } from '@/lib/types'

interface FlowStepperProps {
  currentStep: FlowStep
  completedSteps: FlowStep[]
  onStepClick?: (step: FlowStep) => void
  questionIdx?: number
  questionCount?: number
}

const STEPS: Array<{ id: FlowStep; label: string; icon: string }> = [
  { id: 'frame',    label: 'Frame',    icon: 'crop_free' },
  { id: 'list',     label: 'List',     icon: 'list' },
  { id: 'optimize', label: 'Optimize', icon: 'tune' },
  { id: 'win',      label: 'Win',      icon: 'emoji_events' },
]

export function FlowStepper({ currentStep, completedSteps, onStepClick, questionIdx, questionCount }: FlowStepperProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      {STEPS.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.id)
        const isActive = step.id === currentStep
        const isPending = !isCompleted && !isActive

        const pillContent = (
          <>
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              {isCompleted ? 'check_circle' : step.icon}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </>
        )

        const nextStepCompleted = idx < STEPS.length - 1 && completedSteps.includes(STEPS[idx + 1].id)
        const connectorGreen = isCompleted && nextStepCompleted

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              {isCompleted ? (
                <button
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-sm font-medium transition-all duration-200 flex-1 justify-center bg-primary text-on-primary hover:opacity-80 cursor-pointer"
                  onClick={() => onStepClick?.(step.id)}
                >
                  {pillContent}
                </button>
              ) : isActive ? (
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-sm font-medium flex-1 justify-center bg-primary text-on-primary shadow-sm transition-all duration-200">
                  {pillContent}
                </div>
              ) : (
                <div
                  className={[
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-sm font-medium flex-1 justify-center bg-surface-container-high text-on-surface-variant transition-all duration-200',
                    isPending ? 'opacity-60' : '',
                  ].join(' ')}
                >
                  {pillContent}
                </div>
              )}

              {isActive && (questionCount ?? 0) > 1 && (
                <div className="flex gap-1 items-center justify-center mt-1">
                  {Array.from({ length: questionCount! }).map((_, i) => {
                    const isCurrent = i === questionIdx
                    const isPast = i < (questionIdx ?? 0)
                    return (
                      <div
                        key={i}
                        className={[
                          'rounded-full transition-all duration-200',
                          isCurrent
                            ? 'w-3.5 h-1.5 bg-primary'
                            : isPast
                            ? 'w-1.5 h-1.5 bg-primary/50'
                            : 'w-1.5 h-1.5 bg-primary/25',
                        ].join(' ')}
                      />
                    )
                  })}
                </div>
              )}
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className="w-3 h-0.5 mx-1 shrink-0 transition-colors duration-500"
                style={{ background: connectorGreen ? '#4a7c59' : '#c4c8bc' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
