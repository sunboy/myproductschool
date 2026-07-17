'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from '@/components/redesign/ProgressRing'
import { HatchImage } from '@/components/redesign/HatchImage'
import type { GuidanceState } from '@/lib/hatch/canvasGuidance'
import type { DesignSection, DesignStep, DesignStepId } from './designSteps'

export interface DesignRailProps {
  steps: DesignStep[]
  activeStepId: DesignStepId
  onSelectStep: (id: DesignStepId) => void
  /** Whether a section currently clears its done threshold. The caller owns
   *  the rule (diagram sections depend on canvas state the rail cannot see). */
  isSectionDone: (stepId: DesignStepId, section: DesignSection) => boolean
  guidance: GuidanceState
  /** A live Hatch nudge overrides the phase copy in the guidance panel. */
  nudge?: { text: string; onDismiss?: () => void } | null
  className?: string
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/**
 * Phase copy for the Live guidance panel. One voice for the whole canvas
 * surface: this panel replaces CanvasThinkingDock, CanvasEmptyState, and
 * CanvasCoachCard as the single guidance reader of the phase machine
 * (src/lib/hatch/canvasGuidance.ts).
 */
function guidanceMessage(g: GuidanceState): string {
  switch (g.phase) {
    case 'empty':
      return `Start anywhere. A first ${g.labels.entity} on the canvas or a first sentence in the write-up both count.`
    case 'sketching':
      return `One ${g.labels.entity} is a start. Add the ${g.labels.entityPlural} it talks to and draw the ${g.labels.relationPlural} between them.`
    case 'has_canvas_no_notes':
      return `The diagram has ${plural(g.entityCount, g.labels.entity, g.labels.entityPlural)} and ${plural(g.connectionCount, g.labels.relation, g.labels.relationPlural)}. Put words behind it, starting with your approach.`
    case 'notes_no_tradeoffs':
      return g.strictHold
        ? 'A defensible design at this level needs written reasoning in more than one section. Keep writing.'
        : 'You have a diagram and notes. Name the trade-off you are betting on before you submit.'
    case 'ready':
      return 'Diagram, write-up, and trade-off are in place. Read it once as an interviewer would, then submit.'
  }
}

/**
 * Right rail for the structured SD/DM workspace: Session progress ring over
 * all sub-sections, free step navigation with per-section done markers, and
 * the single Live guidance voice with Hatch in its listening pose. Panels are
 * 16px padding with 12px gaps (spec §6); the guidance panel is the page's one
 * tinted note surface (spec §7, mint = coach).
 */
export function DesignRail({
  steps,
  activeStepId,
  onSelectStep,
  isSectionDone,
  guidance,
  nudge,
  className,
}: DesignRailProps) {
  const allSections = steps.flatMap((step) =>
    step.sections.map((section) => ({ step, section }))
  )
  const doneCount = allSections.filter(({ step, section }) =>
    isSectionDone(step.id, section)
  ).length
  const totalCount = allSections.length
  const percent = totalCount === 0 ? 0 : (doneCount / totalCount) * 100

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Session progress */}
      <div className="flex items-center gap-3.5 rounded-xl border border-hairline bg-card-bright p-4">
        <ProgressRing
          percent={percent}
          size={60}
          strokeWidth={7}
          trackColor="#ece7dd"
          color="#266235"
        >
          <span className="text-[13px] font-extrabold tabular-nums text-ink-strong">
            {doneCount}/{totalCount}
          </span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink-strong">Session progress</p>
          <p className="mt-0.5 text-xs leading-normal text-ink-secondary">
            {doneCount} of {totalCount} sections have enough substance to grade.
          </p>
        </div>
      </div>

      {/* Step navigation */}
      <nav aria-label="Design steps" className="rounded-xl border border-hairline bg-card-bright p-4">
        <p className="mb-2.5 text-[13px] font-bold text-ink-strong">Steps</p>
        <ul className="flex flex-col">
          {steps.map((step, i) => {
            const stepDone = step.sections.every((s) => isSectionDone(step.id, s))
            const active = step.id === activeStepId
            return (
              <li key={step.id} className="border-b border-hairline last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelectStep(step.id)}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left',
                    active && 'bg-forest-800 text-white'
                  )}
                >
                  {stepDone ? (
                    <span
                      className={cn(
                        'flex size-[21px] shrink-0 items-center justify-center rounded-full text-white',
                        active ? 'bg-forest-600' : 'bg-forest-600'
                      )}
                    >
                      <Check size={12} strokeWidth={2.2} />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'flex size-[21px] shrink-0 items-center justify-center rounded-full border-[1.4px] text-[10.5px] font-bold',
                        active
                          ? 'border-white/70 text-white'
                          : 'border-hairline-strong text-ink-muted'
                      )}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span
                    className={cn(
                      'flex-1 text-[13.5px] font-bold',
                      active ? 'text-white' : 'text-ink-strong'
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold tabular-nums',
                      active ? 'text-white/70' : 'text-ink-muted'
                    )}
                  >
                    {step.sections.filter((s) => isSectionDone(step.id, s)).length}/
                    {step.sections.length}
                  </span>
                </button>

                {active && (
                  <ul className="mb-2 ml-[18px] flex flex-col border-l border-hairline pl-3.5">
                    {step.sections.map((section) => {
                      const done = isSectionDone(step.id, section)
                      return (
                        <li key={section.id} className="flex items-center gap-2 py-1">
                          {done ? (
                            <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-forest-600 text-white">
                              <Check size={9} strokeWidth={2.6} />
                            </span>
                          ) : (
                            <span className="size-3.5 shrink-0 rounded-full border-[1.4px] border-hairline-strong" />
                          )}
                          <span
                            className={cn(
                              'text-xs',
                              done ? 'font-semibold text-ink-strong' : 'text-ink-secondary'
                            )}
                          >
                            {section.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Live guidance — the page's one tinted note surface (mint = coach).
          A live Hatch nudge takes the slot over the phase copy. */}
      <div className="note-mint rounded-xl px-[15px] py-[13px]">
        <div className="mb-1.5 flex items-center justify-between gap-1.5 text-[11.5px] font-bold text-forest-800">
          <span className="flex items-center gap-1.5">
            <HatchImage state="listening" size={18} className="rounded-full" />
            {nudge ? "Hatch's read" : 'Live guidance'}
          </span>
          {nudge?.onDismiss && (
            <button
              type="button"
              onClick={nudge.onDismiss}
              aria-label="Dismiss nudge"
              className="text-ink-secondary hover:text-ink-strong"
            >
              <span className="text-[13px] leading-none">✕</span>
            </button>
          )}
        </div>
        <p className="text-xs leading-[1.45] text-ink-strong">
          {nudge?.text ?? guidanceMessage(guidance)}
        </p>
      </div>
    </div>
  )
}
