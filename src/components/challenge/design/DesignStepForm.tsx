'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GuidanceLabels } from '@/lib/hatch/canvasGuidance'
import type { DesignSection, DesignStep } from './designSteps'
import { DiagramSlot, type CanvasOpenOrigin } from './DiagramSlot'

export interface DesignStepFormProps {
  step: DesignStep
  /** sectionId -> text for THIS step. */
  values: Record<string, string>
  onChange: (sectionId: string, value: string) => void
  /** Diagram state for kind==='diagram' sections. */
  diagramThumbUrl: string | null
  diagramEntityCount: number
  diagramConnectionCount: number
  /** Discipline nouns (node/flow vs table/link). */
  diagramLabels: GuidanceLabels
  /** Opens the full-screen canvas overlay (origin = trigger center, for the scale-from-slot entrance). */
  onOpenCanvas: (origin?: CanvasOpenOrigin) => void
  /** Fired when a textarea section takes focus — lets the workspace track the
   *  active sub-section for Hatch's interpret/nudge payloads. */
  onSectionFocus?: (sectionId: string) => void
  className?: string
}

const DEFAULT_MIN_CHARS_DONE = 80

function textareaSectionDone(section: DesignSection, value: string): boolean {
  return value.trim().length >= (section.minCharsDone ?? DEFAULT_MIN_CHARS_DONE)
}

/**
 * One design step (Frame / List / Optimize / Win) as a numbered sub-section
 * form, per the mock's sub-task anatomy (High-level approach / System design
 * diagram / Deep dive / Trade-offs) pinned by
 * docs/redesign/round4-codex-direction/content-atoms.md and the write-up
 * inset in docs/redesign/previews/round4/canvas-workspace.html. Headings are
 * Nunito Sans 700 (spec §6, never serif); sections are hairline-separated
 * rows inside one container (spec §4), numbered with the 20px outlined
 * circle from the preview's .wc-num, which fills forest with a thick check
 * once the section clears its done threshold (spec §5.3).
 */
export function DesignStepForm({
  step,
  values,
  onChange,
  diagramThumbUrl,
  diagramEntityCount,
  diagramConnectionCount,
  diagramLabels,
  onOpenCanvas,
  onSectionFocus,
  className,
}: DesignStepFormProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="pb-4">
        <h2 className="font-headline text-2xl font-medium text-ink-strong">{step.title}</h2>
        <p className="mt-0.5 text-base leading-relaxed text-ink-secondary">{step.intro}</p>
      </div>

      <div className="divide-y divide-hairline">
        {step.sections.map((section, i) => {
          const value = values[section.id] ?? ''
          const done =
            section.kind === 'diagram'
              ? diagramEntityCount > 0
              : textareaSectionDone(section, value)

          return (
            <section key={section.id} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-2 flex items-start gap-2.5">
                {/* One stable element per marker so the done-state flip is a
                    quick color transition; the check itself eases in. */}
                <span
                  className={cn(
                    'mt-px flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-150',
                    done
                      ? 'bg-forest-600 text-white'
                      : 'border-[1.5px] border-forest-800 text-[10.5px] font-bold text-forest-800'
                  )}
                >
                  {done ? <Check size={12} strokeWidth={2.2} className="animate-check-in" /> : i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-snug text-ink-strong">
                    {section.label}
                  </h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-secondary">{section.prompt}</p>
                </div>
              </div>

              {section.kind === 'diagram' ? (
                <DiagramSlot
                  thumbUrl={diagramThumbUrl}
                  entityCount={diagramEntityCount}
                  connectionCount={diagramConnectionCount}
                  labels={diagramLabels}
                  onOpen={onOpenCanvas}
                  className="ml-[30px]"
                />
              ) : (
                <div className="ml-[30px]">
                  <textarea
                    aria-label={section.label}
                    value={value}
                    onFocus={() => onSectionFocus?.(section.id)}
                    onChange={(e) => {
                      const next =
                        section.maxChars !== undefined
                          ? e.target.value.slice(0, section.maxChars)
                          : e.target.value
                      onChange(section.id, next)
                    }}
                    maxLength={section.maxChars}
                    placeholder={section.placeholder}
                    rows={section.maxChars !== undefined && section.maxChars >= 1200 ? 6 : 4}
                    className="w-full resize-y rounded-lg border border-hairline bg-card-bright px-3 py-2.5 text-base leading-relaxed text-ink-strong outline-none transition-colors placeholder:text-ink-muted focus:border-forest-600"
                  />
                  {section.maxChars !== undefined && (
                    <div className="mt-1 flex justify-end">
                      <span className="text-xs font-semibold tabular-nums text-ink-muted">
                        {value.length} / {section.maxChars}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
