import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FlowStepKey = 'frame' | 'list' | 'optimize' | 'win'
export type FlowStepStatus = 'done' | 'current' | 'upcoming'

export interface FlowStepDefinition {
  key: FlowStepKey
  title: string
  /** Short status line, e.g. "Problem framed" / "Design solution" / "Validate & communicate". */
  subtitle: string
  status: FlowStepStatus
}

export interface FlowStepperProps {
  steps: FlowStepDefinition[]
  className?: string
}

const DEFAULT_TITLES: Record<FlowStepKey, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

/**
 * Frame / List / Optimize / Win stepper with chunky done-states per spec
 * §5.3: completed = filled forest circle + thick white check; current =
 * visibly chunkier numbered circle with a soft forest ring; upcoming = quiet
 * hairline ring. Dashed connectors match previews/round4/flow-workspace.html
 * .step-connector.
 */
export function FlowStepper({ steps, className }: FlowStepperProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, i) => {
        const stepNumber = i + 1
        return (
          <div key={step.key} className="flex min-w-0 flex-1 items-center last:flex-none">
            <div className="flex shrink-0 items-center gap-3">
              {/* One stable node per step: advancing transitions colors and the
                  current ring in place (quick, eased, no bounce); the check
                  eases in via .animate-check-in. */}
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,box-shadow,color] duration-150',
                  step.status === 'done' &&
                    'size-[23px] bg-forest-600 text-white',
                  step.status === 'current' &&
                    'size-[25px] bg-forest-800 text-[12.5px] font-bold text-white shadow-[0_0_0_4px_rgba(18,59,32,0.12)]',
                  step.status === 'upcoming' &&
                    'size-[22px] border-[1.4px] border-hairline-strong text-[11.5px] font-bold text-ink-muted'
                )}
              >
                {step.status === 'done' ? (
                  <Check size={13} strokeWidth={2.2} className="animate-check-in" />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="flex flex-col gap-px">
                <span
                  className={cn(
                    'text-[14.5px] font-bold transition-colors duration-150',
                    step.status === 'upcoming' ? 'text-ink-muted' : 'text-ink-strong'
                  )}
                >
                  {step.title || DEFAULT_TITLES[step.key]}
                </span>
                <span className="text-xs text-ink-muted">{step.subtitle}</span>
              </div>
            </div>

            {i < steps.length - 1 && (
              <div
                className="mx-4 h-0.5 flex-1"
                style={{
                  backgroundImage:
                    step.status === 'done'
                      ? 'repeating-linear-gradient(to right, #266235 0, #266235 6px, transparent 6px, transparent 12px)'
                      : 'repeating-linear-gradient(to right, #d8d3c8 0, #d8d3c8 6px, transparent 6px, transparent 12px)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
