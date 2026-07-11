import Link from 'next/link'

export interface WeekDot {
  dayLabel: string
  completed: boolean
  isToday: boolean
}

export interface ThisWeekPanelProps {
  weekDates: WeekDot[]
  streakDays: number
  bestStreak?: number | null
  viewPlanHref?: string
}

/**
 * "This week" panel: 12px filled forest dots for completed days (chunky
 * done-state per spec §5.3), a ringed dot for today, quiet hairline dots for
 * the rest. Streak note at the bottom only renders real numbers — no invented
 * "best" if the loader doesn't have one.
 */
export function ThisWeekPanel({ weekDates, streakDays, bestStreak, viewPlanHref }: ThisWeekPanelProps) {
  return (
    <div className="rounded-2xl border border-hairline bg-card-bright p-4 pb-[18px] shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-body text-[15.5px] font-bold text-ink-strong">This week</div>
        {viewPlanHref && (
          <Link href={viewPlanHref} className="text-[11.5px] font-bold text-forest-700 no-underline">
            View full plan →
          </Link>
        )}
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {weekDates.map((d, i) => (
          <div key={`${d.dayLabel}-${i}`} className="flex size-[22px] items-center justify-center rounded-full">
            {d.completed ? (
              <span className="size-3 rounded-full bg-forest-600" />
            ) : d.isToday ? (
              <span className="flex size-[22px] items-center justify-center rounded-full border-2 border-forest-600 bg-white">
                <span className="size-[7px] rounded-full bg-forest-600" />
              </span>
            ) : (
              <span className="flex size-[22px] items-center justify-center rounded-full border-[1.4px] border-hairline bg-page-field">
                <span className="size-[5px] rounded-full bg-ink-muted" />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mb-3.5 grid grid-cols-7 gap-1.5">
        {weekDates.map((d, i) => (
          <div key={`${d.dayLabel}-label-${i}`} className="text-center text-[10.5px] font-bold text-ink-muted">
            {d.dayLabel}
          </div>
        ))}
      </div>

      {streakDays > 0 && (
        <div className="border-t border-hairline pt-3">
          <div className="text-xs leading-[1.4] tabular-nums text-ink-secondary">
            <b className="font-bold text-ink-strong">{streakDays}-day streak.</b>
            {typeof bestStreak === 'number' && bestStreak > streakDays && <> Your best is {bestStreak}.</>}
          </div>
        </div>
      )}
    </div>
  )
}
