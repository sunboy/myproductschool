import Link from 'next/link'

export interface WeekDot {
  dayLabel: string
  completed: boolean
  isToday: boolean
}

export type FocusAreaTone = 'sd' | 'ps' | 'sql' | 'dm'

export interface FocusArea {
  label: string
  tone: FocusAreaTone
}

export interface ThisWeekPanelProps {
  weekDates: WeekDot[]
  streakDays: number
  bestStreak?: number | null
  viewPlanHref?: string
  /** Weakest competencies (learner_competencies), already labeled. Empty → the section is absent. */
  focusAreas?: FocusArea[]
}

const FOCUS_CHIP_CLASS: Record<FocusAreaTone, string> = {
  sd: 'bg-sd-bg text-sd-fg',
  ps: 'bg-ps-bg text-ps-fg',
  sql: 'bg-sql-bg text-sql-fg',
  dm: 'bg-dm-bg text-dm-fg',
}

/**
 * "This week" panel per previews/round4/dashboard.html: day label above a
 * 12px filled forest dot for completed days (chunky done-state per spec §5.3),
 * a ringed dot for today, quiet hairline dots for the rest; then FOCUS AREAS
 * chips (weakest competencies — real data or the section is absent) and the
 * consistency callout. The callout only renders real numbers — no invented
 * "best" if the loader doesn't have one.
 */
export function ThisWeekPanel({ weekDates, streakDays, bestStreak, viewPlanHref, focusAreas }: ThisWeekPanelProps) {
  const activeDays = weekDates.filter(d => d.completed).length

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
          <div key={`${d.dayLabel}-${i}`} className="flex flex-col items-center gap-[7px]">
            <span className="text-center text-[10.5px] font-bold text-ink-muted">{d.dayLabel}</span>
            <span className="flex size-[22px] items-center justify-center rounded-full">
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
            </span>
          </div>
        ))}
      </div>

      {focusAreas && focusAreas.length > 0 && (
        <>
          <div className="mb-2 mt-3.5 font-label text-[11px] font-extrabold uppercase tracking-[0.05em] text-ink-muted">
            Focus Areas
          </div>
          <div className="mb-3.5 flex flex-wrap gap-1.5">
            {focusAreas.map(area => (
              <span
                key={area.label}
                className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${FOCUS_CHIP_CLASS[area.tone]}`}
              >
                {area.label}
              </span>
            ))}
          </div>
        </>
      )}

      {(streakDays > 0 || activeDays > 0) && (
        <div className="border-t border-hairline pt-3">
          <div className="text-xs leading-[1.4] tabular-nums text-ink-secondary">
            {streakDays > 0 && <b className="font-bold text-ink-strong">{streakDays}-day streak.</b>}
            {typeof bestStreak === 'number' && bestStreak > streakDays && <> Your best is {bestStreak}.</>}
            {activeDays > 0 && (
              <> {activeDays} active day{activeDays === 1 ? '' : 's'} this week.</>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
