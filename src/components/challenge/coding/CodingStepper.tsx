'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CODING_STEPS, codingStepIndex, type CodingStep } from './codingSteps'

export interface CodingStepperProps {
  /** The step the learner is currently on. Everything before it renders done. */
  activeStep: CodingStep
  /**
   * Advisory click handler. Clicking a node never gates or submits anything;
   * the caller may scroll or focus the matching surface (Test → test panel).
   */
  onSelectStep?: (id: CodingStep) => void
  className?: string
}

/**
 * Advisory 5-node stepper for the coding workspace header
 * (Understand → Plan → Code → Test → Optimize), per the round-4 coding
 * workspace ref and spec §"Signature components" #4 / §5.3:
 * done = filled forest circle with a thick white check, current = chunky
 * forest-800 numbered node, upcoming = quiet grey hairline ring.
 */
export function CodingStepper({ activeStep, onSelectStep, className }: CodingStepperProps) {
  const activeIdx = codingStepIndex(activeStep)

  return (
    <nav
      aria-label="Suggested solving path"
      className={cn('flex items-center', className)}
      data-testid="coding-stepper"
    >
      {CODING_STEPS.map((step, i) => {
        const done = i < activeIdx
        const current = i === activeIdx
        return (
          <div key={step.id} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-1.5 h-px w-4 shrink-0 transition-colors duration-150 lg:w-6',
                  i <= activeIdx ? 'bg-forest-600' : 'bg-hairline'
                )}
              />
            )}
            <button
              type="button"
              onClick={onSelectStep ? () => onSelectStep(step.id) : undefined}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'group flex items-center gap-1.5 rounded-lg px-1 py-0.5',
                onSelectStep && 'cursor-pointer'
              )}
            >
              {/* One stable node per step: advancing transitions colors in
                  place; the check eases in via .animate-check-in. */}
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,color] duration-150',
                  done && 'size-[22px] bg-forest-600 text-white',
                  current && 'size-[24px] bg-forest-800 text-[11.5px] font-extrabold text-white',
                  !done && !current &&
                    'size-[22px] border-[1.4px] border-hairline-strong text-[10.5px] font-bold text-ink-muted'
                )}
              >
                {done ? <Check size={12} strokeWidth={2.2} className="animate-check-in" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden font-label text-[12.5px] transition-colors duration-150 xl:inline',
                  current
                    ? 'font-extrabold text-ink-strong'
                    : done
                      ? 'font-bold text-ink-strong'
                      : 'font-semibold text-ink-muted'
                )}
              >
                {step.label}
              </span>
            </button>
          </div>
        )
      })}
    </nav>
  )
}
