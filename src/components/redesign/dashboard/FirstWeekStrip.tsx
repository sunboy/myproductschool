export interface FirstWeekStep {
  label: string
  meta: string
  active: boolean
}

/**
 * Day-0 replacement for the stat strip (spec §3 first-time rules: never
 * render zeros). Three-step activation row: Do one rep -> Read Hatch's
 * feedback -> Pick a plan, first step active.
 */
export function FirstWeekStrip({ steps }: { steps: FirstWeekStep[] }) {
  return (
    <div
      className="grid rounded-2xl border border-hairline bg-card-bright px-[22px] py-[18px] shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]"
      style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
    >
      {steps.map((step, i) => (
        <div key={step.label} className={`flex items-center gap-3 px-3.5 ${i < steps.length - 1 ? 'border-r border-hairline' : ''}`}>
          {step.active ? (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-forest-800 text-[13px] font-bold text-forest-800">
              {i + 1}
            </div>
          ) : (
            <div className="flex size-[26px] shrink-0 items-center justify-center rounded-full border-[1.8px] border-hairline text-xs font-extrabold text-ink-muted">
              {i + 1}
            </div>
          )}
          <div className="min-w-0">
            <div className={`text-[13.5px] font-bold ${step.active ? 'text-forest-800' : 'text-ink-strong'}`}>{step.label}</div>
            <div className="mt-0.5 text-[11.5px] text-ink-muted">{step.meta}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
