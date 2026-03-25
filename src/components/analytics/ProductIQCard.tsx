interface Props {
  score: number
  delta: number
  weeklyActivity: number[]
  totalAttempts: number
  dimensions: Record<string, { score: number; delta: number; sparkline: number[] }>
}

export function ProductIQCard({ score, delta, weeklyActivity, totalAttempts, dimensions }: Props) {
  // Generate sparkline bar heights from weekly activity — pad to 14 bars to match Stitch
  const bars = weeklyActivity.length >= 14
    ? weeklyActivity
    : [...Array(14 - weeklyActivity.length).fill(0), ...weeklyActivity]
  const maxBar = Math.max(...bars, 1)

  // Sub-metrics from dimensions (mapped to Stitch labels)
  const subMetrics = [
    {
      label: 'Diagnostic Accuracy',
      value: dimensions.diagnostic_accuracy?.score ?? 0,
      color: 'bg-primary',
    },
    {
      label: 'Metric Fluency',
      value: dimensions.metric_fluency?.score ?? 0,
      color: 'bg-tertiary',
    },
    {
      label: 'Framing Precision',
      value: dimensions.framing_precision?.score ?? 0,
      color: 'bg-error',
    },
  ]

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl editorial-shadow ghost-border relative overflow-hidden h-full">
      {/* Header row */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="font-headline text-2xl font-bold text-primary">ProductIQ Score</h3>
          <p className="text-on-surface-variant text-sm font-medium">Global composite performance index</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-5xl font-headline font-black text-primary">{score}</span>
          <span className="text-primary text-sm font-bold flex items-center gap-1">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              {delta >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            {delta >= 0 ? '+' : ''}{delta}% vs last cycle
          </span>
        </div>
      </div>

      {/* Sparkline bar chart */}
      <div className="h-48 w-full bg-surface-container rounded-xl flex items-end gap-1 px-4 py-2 mb-6">
        {bars.map((val, i) => {
          const heightPct = Math.max(10, Math.round((val / maxBar) * 100))
          // Increasing opacity based on value magnitude
          const opacityClass =
            heightPct >= 90 ? 'bg-primary'
            : heightPct >= 75 ? 'bg-primary/80'
            : heightPct >= 60 ? 'bg-primary/60'
            : heightPct >= 45 ? 'bg-primary/50'
            : heightPct >= 30 ? 'bg-primary/40'
            : heightPct >= 15 ? 'bg-primary/30'
            : 'bg-primary/20'
          return (
            <div
              key={i}
              className={`flex-1 ${opacityClass} rounded-t-sm`}
              style={{ height: `${heightPct}%` }}
            />
          )
        })}
      </div>

      {/* Sub-metric progress bars */}
      <div className="grid grid-cols-3 gap-6 pt-6 border-t border-outline-variant/20">
        {subMetrics.map(metric => (
          <div key={metric.label}>
            <p className="text-xs font-bold uppercase tracking-wider text-outline mb-1">{metric.label}</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className={`h-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
              </div>
              <span className="text-sm font-bold">{metric.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
