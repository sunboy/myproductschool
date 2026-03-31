interface Dimension {
  label: string
  score: number
}

interface ProductIQCardProps {
  score: number
  delta: number
  weeklyActivity: number[]
  dimensions: Dimension[]
}

export function ProductIQCard({ score, delta, weeklyActivity, dimensions }: ProductIQCardProps) {
  const maxActivity = Math.max(...weeklyActivity, 1)
  const sparklineBars = weeklyActivity.map(v => Math.max(4, Math.round((v / maxActivity) * 48)))

  return (
    <div className="bg-surface-container rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-label font-bold text-xs uppercase tracking-wider text-outline">ProductIQ Score</h3>
          <span className="text-3xl font-bold text-primary font-headline leading-none">{score}</span>
          <span className="text-xs font-semibold text-tertiary ml-2">
            {delta >= 0 ? '+' : ''}{delta} pts
          </span>
        </div>
      </div>

      {/* Sparkline bar chart */}
      <div className="flex items-end gap-1 h-12">
        {sparklineBars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/30"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* 4 dimension mini-bars in 2x2 grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {dimensions.map((dim) => (
          <div key={dim.label} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant truncate">{dim.label}</span>
              <span className="text-sm font-semibold text-on-surface ml-2">{dim.score}</span>
            </div>
            <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${dim.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
