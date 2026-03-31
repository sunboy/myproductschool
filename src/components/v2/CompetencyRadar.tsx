'use client'

interface CompetencyRadarProps {
  competencies: Array<{
    label: string
    score: number
  }>
}

const MAX_RADIUS = 110
const GRID_RINGS = [25, 50, 75, 100]
const CENTER = 0

function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  }
}

export function CompetencyRadar({ competencies }: CompetencyRadarProps) {
  const n = competencies.length
  if (n === 0) return null

  const angleStep = 360 / n
  // Start from top (270°)
  const angles = competencies.map((_, i) => 270 + i * angleStep)

  // Outer polygon points (ring at score)
  const dataPoints = competencies.map((c, i) => {
    const r = (Math.min(100, Math.max(0, c.score)) / 100) * MAX_RADIUS
    return polarToXY(angles[i], r)
  })

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  // Grid ring polygons
  const gridPolygons = GRID_RINGS.map((pct) => {
    const r = (pct / 100) * MAX_RADIUS
    return angles.map((a) => {
      const p = polarToXY(a, r)
      return `${p.x},${p.y}`
    }).join(' ')
  })

  // Label positions (slightly beyond max radius)
  const labelPositions = competencies.map((c, i) => {
    const pos = polarToXY(angles[i], MAX_RADIUS + 22)
    return { ...pos, label: c.label, score: c.score }
  })

  return (
    <div className="flex justify-center">
      <svg
        width={280}
        height={280}
        viewBox="-150 -150 300 300"
        className="overflow-visible"
      >
        {/* Grid rings */}
        {gridPolygons.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="#c4c8bc"
            strokeWidth={0.75}
            opacity={0.6}
          />
        ))}

        {/* Axis lines */}
        {angles.map((a, i) => {
          const end = polarToXY(a, MAX_RADIUS)
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={end.x}
              y2={end.y}
              stroke="#c4c8bc"
              strokeWidth={0.75}
              opacity={0.6}
            />
          )
        })}

        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          fill="rgba(74,124,89,0.18)"
          stroke="#4a7c59"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data point dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#4a7c59" />
        ))}

        {/* Labels */}
        {labelPositions.map((lp, i) => (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="#4a4e4a"
            fontFamily="'Nunito Sans', sans-serif"
          >
            <tspan x={lp.x} dy="-6">{lp.label}</tspan>
            <tspan x={lp.x} dy="13" fontWeight="600" fill="#2e3230">{Math.round(lp.score)}</tspan>
          </text>
        ))}
      </svg>
    </div>
  )
}
