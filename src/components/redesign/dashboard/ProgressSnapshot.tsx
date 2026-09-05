import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export interface WeekDay { label: string; completed: boolean; today: boolean }
interface FocusMove { move: string; level: number; progress_pct: number }

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function ProgressSnapshot({ week, streakDays, focusMove }: { week: WeekDay[]; streakDays: number; focusMove: FocusMove | null }) {
  const activeDays = week.filter(day => day.completed).length
  const hasProgress = week.length > 0 && (activeDays > 0 || streakDays > 0 || focusMove)

  return (
    <section className="rounded-2xl border border-hairline bg-card-bright p-5 shadow-[0_14px_42px_-34px_rgba(30,27,20,.35)]" aria-labelledby="progress-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="progress-title" className="font-headline text-xl font-semibold text-ink-strong">Your progress</h2>
        <Link href="/progress" className="inline-flex items-center gap-1 text-sm font-bold text-forest-700">Details <ArrowRight size={15} /></Link>
      </div>

      {!hasProgress ? (
        <p className="mt-4 rounded-xl bg-page-field px-4 py-4 text-sm leading-relaxed text-ink-secondary">Your weekly activity and focus area will appear after you complete a challenge.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1.5" aria-label={`${activeDays} active days this week`}>
            {week.map((day, index) => (
              <div key={`${day.label}-${index}`} className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-ink-muted">{day.label}</span>
                <span className={`flex size-6 items-center justify-center rounded-full ${day.completed ? 'bg-forest-600' : day.today ? 'border-2 border-gold bg-amber-soft' : 'border border-hairline bg-page-field'}`}>
                  {day.completed ? <span className="size-1.5 rounded-full bg-white" /> : day.today ? <span className="size-1.5 rounded-full bg-gold" /> : null}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-hairline pt-4">
            <div className="flex items-end justify-between gap-3 text-sm">
              <span className="text-ink-secondary">This week</span>
              <span className="font-extrabold tabular-nums text-ink-strong">{activeDays} active {activeDays === 1 ? 'day' : 'days'}</span>
            </div>
            {streakDays > 0 && <p className="mt-1 text-xs font-semibold text-ink-muted">Current streak: {streakDays} {streakDays === 1 ? 'day' : 'days'}</p>}
            {focusMove && (
              <div className="mt-4 rounded-xl bg-note-mint px-3.5 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-forest-800">Focus: {capitalize(focusMove.move)}</span>
                  <span className="font-extrabold tabular-nums text-forest-700">Level {focusMove.level}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-forest-600" style={{ width: `${Math.max(0, Math.min(100, focusMove.progress_pct))}%` }} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
