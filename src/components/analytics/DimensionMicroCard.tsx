interface Props {
  label: string
  score: number
  delta: number
  sparkline: number[]
}

export function DimensionMicroCard({ label, score, delta, sparkline }: Props) {
  const maxVal = Math.max(...sparkline, 1)

  return (
    <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
          {label}
        </span>
        {delta > 0 ? (
          <span className="text-primary text-xs font-bold">+{delta}%</span>
        ) : delta < 0 ? (
          <span className="text-error text-xs font-bold">{delta}%</span>
        ) : (
          <span className="text-on-surface-variant text-xs font-bold">Stable</span>
        )}
      </div>

      {/* Score */}
      <p className="text-2xl font-bold font-headline text-on-surface mb-4">{score}</p>

      {/* Sparkline */}
      <div className="w-full h-8 flex items-end gap-0.5">
        {sparkline.map((val, i) => {
          const heightPct = Math.max(8, Math.round((val / maxVal) * 100))
          return (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/30"
              style={{ height: `${heightPct}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}
