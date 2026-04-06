'use client'

const COMPETENCY_KEYS = [
  'motivation_theory',
  'cognitive_empathy',
  'taste',
  'strategic_thinking',
  'creative_execution',
  'domain_expertise',
] as const

const COMPETENCY_LABELS: Record<string, string> = {
  motivation_theory: 'Motivation\nTheory',
  cognitive_empathy: 'Cognitive\nEmpathy',
  taste: 'Taste',
  strategic_thinking: 'Strategic\nThinking',
  creative_execution: 'Creative\nExecution',
  domain_expertise: 'Domain\nExpertise',
}

interface CompetencyRadarProps {
  signals: Array<{ competency: string; signal: string; stepDetected: string }>
  className?: string
}

export default function CompetencyRadar({ signals, className }: CompetencyRadarProps) {
  const size = 280
  const center = size / 2
  const radius = 100

  // Count signals per competency, normalize to 0-1
  const counts: Record<string, number> = {}
  for (const s of signals) {
    counts[s.competency] = (counts[s.competency] ?? 0) + 1
  }
  const maxCount = Math.max(1, ...Object.values(counts))

  const numAxes = COMPETENCY_KEYS.length
  const angleStep = (2 * Math.PI) / numAxes
  const startAngle = -Math.PI / 2 // start at top

  function getPoint(index: number, value: number): [number, number] {
    const angle = startAngle + index * angleStep
    return [
      center + radius * value * Math.cos(angle),
      center + radius * value * Math.sin(angle),
    ]
  }

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0]

  // Data polygon
  const dataPoints = COMPETENCY_KEYS.map((key, i) => {
    const value = Math.min(1, (counts[key] ?? 0) / maxCount)
    return getPoint(i, value)
  })
  const dataPath = dataPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      {/* Grid rings */}
      {rings.map((r) => {
        const points = COMPETENCY_KEYS.map((_, i) => getPoint(i, r))
        const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z'
        return <path key={r} d={path} fill="none" stroke="#c4c8bc" strokeWidth="0.5" opacity="0.5" />
      })}

      {/* Axis lines */}
      {COMPETENCY_KEYS.map((_, i) => {
        const [x, y] = getPoint(i, 1)
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#c4c8bc" strokeWidth="0.5" opacity="0.5" />
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="#4a7c59" fillOpacity="0.25" stroke="#4a7c59" strokeWidth="2" />

      {/* Data points */}
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#4a7c59" />
      ))}

      {/* Labels */}
      {COMPETENCY_KEYS.map((key, i) => {
        const [x, y] = getPoint(i, 1.25)
        const lines = COMPETENCY_LABELS[key].split('\n')
        // Shift up by half the total block height to center multiline labels
        const lineHeight = 12
        const yOffset = -((lines.length - 1) * lineHeight) / 2
        return (
          <text
            key={key}
            x={x}
            y={y + yOffset}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-on-surface-variant"
            style={{ fontSize: '10px', fontFamily: 'var(--font-label, sans-serif)' }}
          >
            {lines.map((line, li) => (
              <tspan key={li} x={x} dy={li === 0 ? 0 : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        )
      })}
    </svg>
  )
}
