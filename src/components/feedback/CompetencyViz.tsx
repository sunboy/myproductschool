'use client'

// CompetencyViz — one competency/dimension visualizer for every feedback
// surface. Unifies the live-interview hexagon radar and the analytics
// horizontal bars behind a single data contract: items valued 0-1.

export interface CompetencyVizItem {
  key: string
  label: string
  /** 0-1 normalized value. */
  value: number
  /** Optional band label shown next to bars (e.g. Strong / Partial). */
  bandLabel?: string
}

interface CompetencyVizProps {
  items: CompetencyVizItem[]
  variant?: 'radar' | 'bars'
  /** 'light' = cream surfaces (default); 'dark' = share pages. */
  theme?: 'light' | 'dark'
  title?: string
  note?: string | null
  className?: string
}

function barColor(value: number): string {
  if (value >= 0.75) return 'var(--color-primary)'
  if (value >= 0.4) return 'var(--color-tertiary)'
  return 'var(--color-outline)'
}

export function CompetencyViz({ items, variant = 'bars', theme = 'light', title, note, className = '' }: CompetencyVizProps) {
  if (!items.length) return null
  const dark = theme === 'dark'
  const onSurface = dark ? 'rgba(255,255,255,0.92)' : 'var(--color-on-surface)'
  const onVariant = dark ? 'rgba(255,255,255,0.62)' : 'var(--color-on-surface-variant)'
  const track = dark ? 'rgba(255,255,255,0.12)' : 'var(--color-surface-container-high)'

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
            insights
          </span>
          <span className="font-label text-xs font-bold uppercase tracking-wider" style={{ color: onVariant }}>{title}</span>
        </div>
      )}
      {note && <p className="font-body text-sm leading-relaxed mb-3" style={{ color: onSurface }}>{note}</p>}
      {variant === 'bars' ? (
        <div className="flex flex-col gap-2.5">
          {items.map((d) => (
            <div key={d.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-body text-[12.5px] font-semibold" style={{ color: onSurface }}>{d.label}</span>
                {d.bandLabel && (
                  <span className="font-label text-[11px] font-bold" style={{ color: barColor(d.value) }}>{d.bandLabel}</span>
                )}
              </div>
              <div style={{ height: 7, borderRadius: 999, background: track, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(d.value * 100)}%`, borderRadius: 999, background: barColor(d.value), transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Radar items={items} onVariant={onVariant} />
      )}
    </div>
  )
}

function Radar({ items, onVariant }: { items: CompetencyVizItem[]; onVariant: string }) {
  const size = 280
  const center = size / 2
  const radius = 100
  const n = items.length
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2

  const point = (i: number, v: number): [number, number] => {
    const a = startAngle + i * angleStep
    return [center + radius * v * Math.cos(a), center + radius * v * Math.sin(a)]
  }
  const path = (pts: [number, number][]) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z'

  const dataPoints = items.map((d, i) => point(i, Math.max(0, Math.min(1, d.value))))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <path key={r} d={path(items.map((_, i) => point(i, r)))} fill="none" stroke="var(--color-outline-variant)" strokeWidth="0.5" opacity="0.5" />
      ))}
      {items.map((_, i) => {
        const [x, y] = point(i, 1)
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="var(--color-outline-variant)" strokeWidth="0.5" opacity="0.5" />
      })}
      <path d={path(dataPoints)} fill="var(--color-primary)" fillOpacity="0.25" stroke="var(--color-primary)" strokeWidth="2" />
      {dataPoints.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="var(--color-primary)" />)}
      {items.map((d, i) => {
        const [x, y] = point(i, 1.25)
        const lines = d.label.split(' ')
        const lineHeight = 12
        const yOffset = -((lines.length - 1) * lineHeight) / 2
        return (
          <text key={d.key} x={x} y={y + yOffset} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 10, fontFamily: 'var(--font-label, sans-serif)', fill: onVariant }}>
            {lines.map((line, li) => (
              <tspan key={li} x={x} dy={li === 0 ? 0 : lineHeight}>{line}</tspan>
            ))}
          </text>
        )
      })}
    </svg>
  )
}
