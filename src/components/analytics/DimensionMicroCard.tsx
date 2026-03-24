interface Props {
  label: string
  score: number
  delta: number
  sparkline: number[]
  unit?: string
  footnote?: string
}

export function DimensionMicroCard({ label, score, delta, sparkline, unit = '/100', footnote }: Props) {
  const maxVal = Math.max(...sparkline, 1)

  // Delta display
  const deltaDisplay = delta > 0
    ? { text: `+${delta}%`, color: 'text-primary' }
    : delta < 0
      ? { text: `${delta}%`, color: 'text-error' }
      : { text: 'STABLE', color: 'text-primary' }

  // Generate percentile footnote if not provided
  const displayFootnote = footnote ?? (
    score >= 90 ? '95th percentile ranking'
    : score >= 80 ? '85th percentile ranking'
    : score >= 70 ? '72nd percentile ranking'
    : score >= 60 ? '58th percentile ranking'
    : 'Building momentum'
  )

  return (
    <div className={`bg-surface-container-lowest rounded-xl p-4 ghost-border editorial-shadow border-t-[3px] ${score >= 70 ? 'border-primary' : 'border-secondary'} flex flex-col justify-between`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase">{label}</span>
        <span className={`text-[10px] font-bold ${deltaDisplay.color}`}>{deltaDisplay.text}</span>
      </div>

      {/* Score + mini sparkline */}
      <div className="flex items-end justify-between mt-2">
        <span className="text-2xl font-headline font-bold text-on-surface" style={{ letterSpacing: '-0.02em' }}>{score}</span>
        <div className="w-12 h-6 flex items-end gap-0.5">
          {sparkline.slice(-6).map((val, i) => {
            const heightPct = Math.max(10, Math.round((val / maxVal) * 100))
            return (
              <div
                key={i}
                className={`flex-1 ${score >= 70 ? 'bg-primary/20' : 'bg-secondary/20'} rounded-sm`}
                style={{ height: `${heightPct}%` }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
