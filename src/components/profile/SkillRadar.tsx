'use client'

interface SkillRadarProps {
  dimensions: Record<string, { score: number }>
}

const AXES = [
  { key: 'diagnostic_accuracy', label: 'Diagnostic Accuracy', angle: 270 },
  { key: 'metric_fluency', label: 'Metric Fluency', angle: 0 },
  { key: 'framing_precision', label: 'Framing Precision', angle: 90 },
  { key: 'recommendation_strength', label: 'Recommendation Strength', angle: 180 },
]

const CENTER = 100
const MAX_RADIUS = 80
const RINGS = [0.33, 0.66, 1.0]

function polarToCartesian(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)]
}

export function SkillRadar({ dimensions }: SkillRadarProps) {
  // Build polygon points from scores
  const points = AXES.map((axis) => {
    const score = dimensions[axis.key]?.score ?? 0
    const r = (score / 100) * MAX_RADIUS
    return polarToCartesian(axis.angle, r)
  })

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z'

  // Label positions — pushed further out for readability
  const labelPositions: Record<string, { x: number; y: number; anchor: 'start' | 'middle' | 'end' }> = {
    diagnostic_accuracy: { x: CENTER, y: 6, anchor: 'middle' },
    metric_fluency: { x: 194, y: CENTER + 4, anchor: 'start' },
    framing_precision: { x: CENTER, y: 198, anchor: 'middle' },
    recommendation_strength: { x: 6, y: CENTER + 4, anchor: 'end' },
  }

  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full max-w-[280px]">
        {/* Grid rings */}
        {RINGS.map((scale) => (
          <circle
            key={scale}
            cx={CENTER}
            cy={CENTER}
            r={MAX_RADIUS * scale}
            fill="none"
            className="stroke-outline-variant"
            strokeWidth={0.75}
            strokeDasharray={scale < 1 ? '2,2' : undefined}
          />
        ))}

        {/* Axis lines */}
        {AXES.map((axis) => {
          const [ex, ey] = polarToCartesian(axis.angle, MAX_RADIUS)
          return (
            <line
              key={axis.key}
              x1={CENTER}
              y1={CENTER}
              x2={ex}
              y2={ey}
              className="stroke-outline-variant"
              strokeWidth={0.75}
            />
          )
        })}

        {/* Data polygon */}
        <path
          d={polygonPath}
          className="fill-primary/15 stroke-primary"
          strokeWidth={2}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={AXES[i].key}
            cx={p[0]}
            cy={p[1]}
            r={3}
            className="fill-primary"
          />
        ))}

        {/* Axis labels */}
        {AXES.map((axis) => {
          const pos = labelPositions[axis.key]
          return (
            <text
              key={axis.key}
              x={pos.x}
              y={pos.y}
              textAnchor={pos.anchor}
              className="fill-on-surface-variant text-[7px] font-label"
            >
              {axis.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
