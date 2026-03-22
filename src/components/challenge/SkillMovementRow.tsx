interface SkillDelta {
  dimension: string  // e.g. 'diagnostic_accuracy'
  delta: number      // e.g. +0.2, -0.1, 0
}

interface SkillMovementRowProps {
  deltas: SkillDelta[]
}

function prettifyDimension(key: string): string {
  const labels: Record<string, string> = {
    diagnostic_accuracy: 'Diagnostic',
    metric_fluency: 'Metrics',
    framing_precision: 'Framing',
    recommendation_strength: 'Recommendations',
  }
  return labels[key] ?? key.replace(/_/g, ' ')
}

export function SkillMovementRow({ deltas }: SkillMovementRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {deltas.map(({ dimension, delta }) => {
        const isPositive = delta > 0
        const isNegative = delta < 0
        const pillClass = isPositive
          ? 'bg-primary-fixed text-on-primary-fixed'
          : isNegative
          ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
          : 'bg-surface-container-highest text-on-surface-variant'
        const sign = isPositive ? '+' : ''
        const label = delta === 0 ? 'unchanged' : `${sign}${delta.toFixed(1)}`

        return (
          <span key={dimension} className={`rounded-full px-3 py-1 text-xs font-label font-semibold ${pillClass}`}>
            {prettifyDimension(dimension)} {label}
          </span>
        )
      })}
    </div>
  )
}
