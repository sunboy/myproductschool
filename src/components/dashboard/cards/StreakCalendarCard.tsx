interface StreakCalendarCardProps {
  streakDays: number
  weekDates: { dayLabel: string; dateLabel: string; completed: boolean; isToday: boolean }[]
}

export function StreakCalendarCard({ streakDays, weekDates }: StreakCalendarCardProps) {
  const anyActivity = weekDates.some(d => d.completed)

  return (
    <div className="rounded-2xl p-5 bg-surface border border-outline-variant/40">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1", color: '#c9933a' }}>local_fire_department</span>
          <h3 className="font-headline text-[15px] font-semibold text-on-surface">This week</h3>
        </div>
        {streakDays > 0 && (
          <span className="text-[11px] font-label font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,147,58,0.15)', color: '#c9933a' }}>
            {streakDays}d streak
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-full flex items-center justify-center rounded-lg"
              style={{
                height: 36,
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
                color: d.completed ? '#fff' : 'var(--color-on-surface-variant)',
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              {d.completed
                ? <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                : d.isToday
                ? <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--color-primary)' }}>radio_button_unchecked</span>
                : null}
            </div>
            <div className="text-[10px] font-label font-semibold text-on-surface-variant">{d.dayLabel}</div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11.5px] text-on-surface-variant leading-relaxed">
        {streakDays === 0
          ? 'Complete a challenge today to start your streak.'
          : streakDays === 1
          ? <><strong className="text-on-surface">1-day streak.</strong> Come back tomorrow to keep it alive.</>
          : <><strong className="text-on-surface">{streakDays}-day streak.</strong> {streakDays >= 7 ? "You're on a roll." : "Keep it going."}</>}
      </p>
    </div>
  )
}
