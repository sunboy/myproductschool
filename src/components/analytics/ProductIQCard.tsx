interface Props {
  score: number
  delta: number
  weeklyActivity: number[]
  totalAttempts: number
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function ProductIQCard({ score, delta, weeklyActivity, totalAttempts }: Props) {
  const maxActivity = Math.max(...weeklyActivity, 1)

  return (
    <div className="bg-surface-container rounded-xl p-8 h-full">
      {/* Header */}
      <p className="text-xs font-bold uppercase tracking-wider text-tertiary">ProductIQ Score</p>

      {/* Score row */}
      <div className="flex items-center gap-3 mt-2">
        <span className="font-headline text-5xl font-bold text-on-surface">{score}</span>
        <span
          className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-sm font-bold ${
            delta >= 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 12, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            {delta >= 0 ? 'trending_up' : 'trending_down'}
          </span>
          {delta >= 0 ? '+' : ''}{delta}
        </span>
      </div>

      <p className="text-xs text-on-surface-variant mt-1">composite skill score</p>

      {/* Bar chart */}
      <div className="mt-8 h-32 flex items-end gap-2">
        {weeklyActivity.map((val, i) => {
          const isToday = i === weeklyActivity.length - 1
          const heightPct = Math.max(8, Math.round((val / maxActivity) * 100))
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-lg transition-all cursor-pointer ${
                isToday ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'
              }`}
              style={{ height: `${heightPct}%` }}
              title={`${DAY_LABELS[i]}: ${val} challenge${val === 1 ? '' : 's'}`}
            />
          )
        })}
      </div>

      {/* Day labels */}
      <div className="flex justify-between mt-2 text-[10px] font-bold text-on-surface-variant uppercase px-1">
        {DAY_LABELS.map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </div>
  )
}
