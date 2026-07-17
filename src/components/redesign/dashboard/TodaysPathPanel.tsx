import Link from 'next/link'
import { Check } from 'lucide-react'
import { InkMark } from '@/components/redesign/InkMark'

export interface TodaysPathStep {
  label: string
  sub: string
  done: boolean
  active: boolean
  /** Real destination for this step's action button. No href = no button (spec: no stubs). */
  href?: string
  /** Button label per preview: Start / Continue / Review. */
  cta?: string
}

export interface TodaysPathPanelProps {
  steps: TodaysPathStep[]
  completed: number
}

/**
 * "Today's path" panel: chunky done-states per spec §5.3 — completed rows get
 * a filled forest circle + thick check, the current row sits on an amber
 * sticky-note tilt with a hand-drawn ink arrow pointing at its action button,
 * and upcoming rows stay quiet hairline circles. Each step with a real
 * destination gets a per-row action button (Start/Continue/Review per the
 * approved round4 preview); steps without a live destination render no button.
 */
export function TodaysPathPanel({ steps, completed }: TodaysPathPanelProps) {
  return (
    <div className="rounded-2xl border border-hairline bg-card-bright p-4 pb-[18px] shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-body text-[15.5px] font-bold text-ink-strong">Today&apos;s path</div>
        <div className="text-[11.5px] font-semibold text-ink-muted">
          {completed} of {steps.length} done
        </div>
      </div>

      <div className="flex flex-col">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          if (step.active) {
            return (
              <div
                key={`${step.label}-${i}`}
                className="note-tilt note-amber my-0.5 flex items-center gap-3.5 rounded-[10px] px-3 py-2.5"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-forest-800 text-xs font-bold text-forest-800">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold text-forest-800">{step.label}</div>
                  <div className="mt-0.5 text-[11.5px] tabular-nums text-ink-muted">{step.sub}</div>
                </div>
                {step.href && step.cta && (
                  <>
                    <InkMark variant="arrow" className="shrink-0" />
                    <Link
                      href={step.href}
                      className="shrink-0 rounded-lg bg-forest-800 px-3.5 py-[7px] text-[12px] font-bold text-white transition-opacity hover:opacity-90"
                    >
                      {step.cta}
                    </Link>
                  </>
                )}
                {!(step.href && step.cta) && <InkMark variant="arrow" className="-mr-1.5 shrink-0" />}
              </div>
            )
          }
          return (
            <div
              key={`${step.label}-${i}`}
              className={`flex items-center gap-3.5 py-2.5 ${!isLast ? 'border-b border-hairline' : ''}`}
            >
              {step.done ? (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-forest-600 text-white">
                  <Check size={13} strokeWidth={2.2} />
                </div>
              ) : (
                <div className="flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.8px] border-hairline text-[11px] font-extrabold text-ink-muted">
                  {i + 1}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-ink-strong">{step.label}</div>
                <div className="mt-0.5 text-[11.5px] tabular-nums text-ink-muted">{step.sub}</div>
              </div>
              {step.href && step.cta && (
                <Link
                  href={step.href}
                  className="shrink-0 rounded-lg border border-hairline bg-white px-3.5 py-[7px] text-[12px] font-bold text-ink-strong transition-colors hover:bg-surface-container-low"
                >
                  {step.cta}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
