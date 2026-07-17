'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CompactStep {
  id: string
  label: string
}

interface CompactStepPipsProps {
  steps: CompactStep[]
  activeId: string
  /** Steps rendered as done (filled forest circle with a check). */
  doneIds?: readonly string[]
  onSelect?: (id: string) => void
  ariaLabel: string
  className?: string
}

/**
 * Slim step pips for a consolidated workspace top bar: 18/20px nodes, short
 * connectors, only the current step keeps its label on wide screens. Same
 * visual language as CodingStepper's compact mode, but generic over any step
 * list (used for the canvas FLOW steps).
 */
export function CompactStepPips({ steps, activeId, doneIds = [], onSelect, ariaLabel, className }: CompactStepPipsProps) {
  const activeIdx = steps.findIndex(s => s.id === activeId)

  return (
    <nav aria-label={ariaLabel} className={cn('flex items-center', className)} data-testid="compact-step-pips">
      {steps.map((step, i) => {
        const done = doneIds.includes(step.id)
        const current = i === activeIdx
        return (
          <div key={step.id} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-1 h-px w-3 shrink-0 transition-colors duration-150',
                  done || i <= activeIdx ? 'bg-forest-600' : 'bg-hairline'
                )}
              />
            )}
            <button
              type="button"
              onClick={onSelect ? () => onSelect(step.id) : undefined}
              aria-current={current ? 'step' : undefined}
              title={step.label}
              className={cn(
                'group flex items-center gap-1.5 rounded-lg px-1 py-0.5',
                onSelect && 'cursor-pointer'
              )}
            >
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,color] duration-150',
                  done && !current && 'size-[18px] bg-forest-600 text-white',
                  current && 'size-[20px] bg-forest-800 text-[10px] font-extrabold text-white',
                  !done && !current &&
                    'size-[18px] border-[1.4px] border-hairline-strong text-[9.5px] font-bold text-ink-muted'
                )}
              >
                {done && !current ? <Check size={10} strokeWidth={2.2} /> : i + 1}
              </span>
              {current && (
                <span className="hidden font-label text-[11.5px] font-extrabold text-ink-strong min-[1280px]:inline">
                  {step.label}
                </span>
              )}
            </button>
          </div>
        )
      })}
    </nav>
  )
}
