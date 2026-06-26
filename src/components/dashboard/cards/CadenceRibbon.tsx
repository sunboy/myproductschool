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
  xpTotal: number
  dailyDone: number
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
    <div className="rounded-2xl border border-outline-variant/40 bg-surface overflow-hidden">
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">

        {/* Streak week view */}
        {hasWeek && (
          <div className="flex items-center gap-4 px-5 py-4 md:min-w-[260px] md:max-w-[320px]">
            <span
              className="material-symbols-outlined text-[22px] shrink-0"
              style={{ fontVariationSettings: "'FILL' 1", color: '#c9933a' }}
            >
              local_fire_department
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-label font-bold text-on-surface">This week</span>
                {streakDays > 0 && (
                  <span
                    className="text-[10px] font-label font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,147,58,0.15)', color: '#c9933a' }}
                  >
                    {streakDays}d
                  </span>
                )}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((d, i) => (
                  <div
                    key={i}
                    title={d.dateLabel}
                    className="h-5 rounded flex items-center justify-center"
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
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 10, color: '#fff', fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 mt-0.5">
                {weekDates.map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-on-surface-variant font-label font-semibold"
                    style={{ fontSize: 9 }}
                  >
                    {d.dayLabel}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Today's path steps — horizontal strip */}
        {hasTodaysPath && (
          <div className="flex-1 px-5 py-4 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-label font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>today</span>
                Today&apos;s path
              </span>
              <span className="text-[10px] font-label font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-surface">
                {todaysPathCompleted} / {totalSteps}
              </span>
            </div>

            <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
              {todaysPathSteps.map((step, i) => {
                const content = (
                  <div
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 min-w-0 transition-colors ${
                      step.active
                        ? 'bg-primary-container text-on-primary-container'
                        : step.done
                        ? 'bg-surface-container-low opacity-60'
                        : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: step.done || step.active
                          ? 'var(--color-primary)'
                          : 'var(--color-surface-container-highest)',
                        color: step.done || step.active ? '#fff' : 'var(--color-on-surface-variant)',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 11, fontVariationSettings: step.done ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {step.done ? 'check' : step.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-bold font-label leading-tight truncate">{step.label}</div>
                      <div className="text-[10px] opacity-70 leading-tight truncate">{step.sub}</div>
                    </div>
                    {step.active && (
                      <span className="material-symbols-outlined text-[14px] shrink-0">play_arrow</span>
                    )}
                  </div>
                )

                return (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    {i > 0 && (
                      <div
                        className="hidden sm:block w-5 h-0.5 rounded-full bg-outline-variant/50 shrink-0"
                        aria-hidden
                      />
                    )}
                    {step.href && !step.done ? (
                      <Link href={step.href} className="block min-w-0" data-hatch-target={step.active ? 'dashboard-path-active' : undefined}>
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
    </div>
  )
}
