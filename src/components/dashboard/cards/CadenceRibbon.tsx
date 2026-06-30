import Link from 'next/link'

interface PathStep {
  label: string
  sub: string
  icon: string
  done: boolean
  active: boolean
  href?: string
}

interface WeekDate {
  dayLabel: string
  dateLabel: string
  completed: boolean
  isToday: boolean
}

interface CadenceRibbonProps {
  streakDays: number
  todaysPathSteps: PathStep[]
  todaysPathCompleted: number
  weekDates: WeekDate[]
}

export function CadenceRibbon({
  streakDays,
  weekDates,
  todaysPathSteps,
  todaysPathCompleted,
}: CadenceRibbonProps) {
  const totalSteps = todaysPathSteps.length
  const hasTodaysPath = totalSteps > 0
  const hasWeek = weekDates.length > 0

  if (!hasTodaysPath && !hasWeek) return null

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface">
      <div className="flex flex-col divide-y divide-outline-variant/30 lg:flex-row lg:divide-x lg:divide-y-0">
        {hasWeek && (
          <div className="flex items-center gap-3 px-4 py-3 lg:min-w-[236px] lg:max-w-[276px]">
            <span
              className="material-symbols-outlined shrink-0 text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1", color: '#c9933a' }}
            >
              local_fire_department
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-[12px] font-label font-bold text-on-surface">This week</span>
                {streakDays > 0 && (
                  <span className="rounded-full bg-[rgba(201,147,58,0.15)] px-2 py-0.5 text-[10px] font-label font-bold text-[#a36f19]">
                    {streakDays}d
                  </span>
                )}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((d, i) => (
                  <div
                    key={`${d.dateLabel}-${i}`}
                    title={d.dateLabel}
                    className="flex h-5 items-center justify-center rounded"
                    style={{
                      background: d.completed
                        ? 'rgba(74,124,89,0.85)'
                        : d.isToday
                        ? 'var(--color-surface-container-high)'
                        : 'transparent',
                      border: d.isToday && !d.completed
                        ? '1.5px solid var(--color-primary)'
                        : d.completed
                        ? '1px solid transparent'
                        : '1px dashed var(--color-outline-variant)',
                    }}
                  >
                    {d.completed && (
                      <span className="material-symbols-outlined text-[10px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-0.5 grid grid-cols-7 gap-1">
                {weekDates.map((d, i) => (
                  <div key={`${d.dateLabel}-label-${i}`} className="text-center text-[9px] font-label font-semibold text-on-surface-variant">
                    {d.dayLabel}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {hasTodaysPath && (
          <div className="min-w-0 flex-1 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[12px] font-label font-bold text-on-surface">
                <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  today
                </span>
                Today&apos;s path
              </span>
              <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-label font-bold text-on-surface">
                {todaysPathCompleted} / {totalSteps}
              </span>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-1.5 xl:flex-nowrap">
              {todaysPathSteps.map((step, i) => {
                const content = (
                  <div
                    className={`flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                      step.active
                        ? 'bg-primary-container text-on-primary-container'
                        : step.done
                        ? 'bg-surface-container-low opacity-60'
                        : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: step.done || step.active
                          ? 'var(--color-primary)'
                          : 'var(--color-surface-container-highest)',
                        color: step.done || step.active ? '#fff' : 'var(--color-on-surface-variant)',
                      }}
                    >
                      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: step.done ? "'FILL' 1" : "'FILL' 0" }}>
                        {step.done ? 'check' : step.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[10.5px] font-label font-bold leading-tight">{step.label}</div>
                      <div className="truncate text-[9.5px] leading-tight opacity-70">{step.sub}</div>
                    </div>
                    {step.active && <span className="material-symbols-outlined shrink-0 text-[13px]">play_arrow</span>}
                  </div>
                )

                return (
                  <div key={`${step.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                    {i > 0 && <div className="hidden h-0.5 w-3 shrink-0 rounded-full bg-outline-variant/50 sm:block" aria-hidden />}
                    {step.href && !step.done ? (
                      <Link href={step.href} className="block min-w-0 no-underline" data-hatch-target={step.active ? 'dashboard-path-active' : undefined}>
                        {content}
                      </Link>
                    ) : (
                      <div className="min-w-0">{content}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
