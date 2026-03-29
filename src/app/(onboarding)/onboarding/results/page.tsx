import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const RADAR_DIMENSIONS = [
  { label: 'Problem\nReframing', score: 4, angle: -90 },
  { label: 'User\nSegmentation', score: 5, angle: -18, star: true },
  { label: 'Data\nReasoning', score: 3, angle: 54 },
  { label: 'Tradeoff\nClarity', score: 4, angle: 126 },
  { label: 'Communication', score: 2, angle: 198 },
]

const MOVE_LEVELS = [
  { name: 'Frame', level: 2, icon: 'pentagon' },
  { name: 'List', level: 3, icon: 'join_inner' },
  { name: 'Optimize', level: 2, icon: 'balance' },
  { name: 'Win', level: 1, icon: 'emoji_events' },
]

function pentagonPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function RadarChart() {
  const cx = 120
  const cy = 120
  const maxR = 100
  const angles = [-90, -18, 54, 126, 198]

  // Grid rings
  const rings = [1, 2, 3, 4, 5]

  // Data polygon
  const dataPoints = RADAR_DIMENSIONS.map((d, i) => {
    const r = (d.score / 5) * maxR
    return pentagonPoint(cx, cy, r, angles[i])
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'

  return (
    <svg viewBox="-20 -10 280 260" className="w-full max-w-[280px] mx-auto">
      {/* Grid rings */}
      {rings.map((ring) => {
        const r = (ring / 5) * maxR
        const pts = angles.map((a) => pentagonPoint(cx, cy, r, a))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
        return <path key={ring} d={path} fill="none" stroke="var(--color-outline-variant)" strokeWidth="0.5" opacity={0.6} />
      })}

      {/* Axis lines */}
      {angles.map((a, i) => {
        const p = pentagonPoint(cx, cy, maxR, a)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-outline-variant)" strokeWidth="0.5" opacity={0.4} />
      })}

      {/* Data fill */}
      <path d={dataPath} fill="var(--color-primary)" fillOpacity={0.2} stroke="var(--color-primary)" strokeWidth="2" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--color-primary)" />
      ))}

      {/* Labels */}
      {RADAR_DIMENSIONS.map((d, i) => {
        const labelR = maxR + 22
        const p = pentagonPoint(cx, cy, labelR, angles[i])
        const lines = d.label.split('\n')
        return (
          <g key={i}>
            {lines.map((line, li) => (
              <text
                key={li}
                x={p.x}
                y={p.y + li * 11 - (lines.length - 1) * 5}
                textAnchor="middle"
                fill="var(--color-on-surface-variant)"
                fontSize="8"
                fontFamily="var(--font-body)"
              >
                {line}
              </text>
            ))}
            {d.star && (
              <text x={p.x + 22} y={p.y - 4} textAnchor="middle" fill="var(--color-tertiary)" fontSize="10">★</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function ResultsPage() {
  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-fixed rounded-full">
          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
          <span className="text-xs font-label font-bold text-primary">Assessment Complete</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary-container rounded-full">
          <span className="material-symbols-outlined text-tertiary text-base">local_fire_department</span>
          <span className="text-xs font-label font-bold text-on-tertiary-container">12 DAY STREAK</span>
        </div>
      </div>

      {/* Luma quote */}
      <div className="flex items-start gap-3 mb-8 bg-surface-container-low rounded-xl p-5">
        <LumaGlyph size={36} className="text-primary flex-shrink-0" state="celebrating" />
        <div>
          <span className="text-xs font-label font-bold text-primary uppercase tracking-wide">Luma</span>
          <p className="text-sm text-on-surface font-body mt-1">
            Sharp instincts — you&apos;ve got a strong analytical foundation. Let&apos;s sharpen your <strong>Win</strong> move.
          </p>
        </div>
      </div>

      {/* Radar chart */}
      <div className="mb-8">
        <h2 className="font-headline text-xl font-bold text-on-surface mb-4 text-center">Your Skill Radar</h2>
        <RadarChart />
      </div>

      {/* Level badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-secondary-container rounded-full px-5 py-2">
          <span className="material-symbols-outlined text-secondary text-lg">military_tech</span>
          <span className="font-label font-bold text-on-secondary-container">Intermediate</span>
        </div>
        <p className="text-sm text-on-surface-variant font-body mt-2">2 of 5 dimensions at Level 4+</p>
      </div>

      {/* Archetype */}
      <div className="bg-surface-container rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">diamond</span>
          <h3 className="font-headline font-bold text-on-surface">Your Thinking Archetype: The Analyst</h3>
        </div>
        <p className="text-sm text-on-surface-variant font-body">
          Strong at breaking down problems (Frame + List), developing your communication muscle (Win).
        </p>
      </div>

      {/* Thinking Journal */}
      <div className="flex items-center gap-3 bg-tertiary-container/30 border border-tertiary-container rounded-xl p-4 mb-6">
        <span className="material-symbols-outlined text-tertiary">lightbulb</span>
        <div>
          <span className="text-sm font-label font-semibold text-on-surface">Composition Effect</span>
          <span className="text-sm text-on-surface-variant font-body"> added to your Thinking Journal</span>
        </div>
      </div>

      {/* Move Levels */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {MOVE_LEVELS.map((move) => (
          <div key={move.name} className="bg-surface-container rounded-xl p-3 text-center">
            <span className="material-symbols-outlined text-primary text-lg">{move.icon}</span>
            <p className="text-xs font-label font-bold text-on-surface mt-1">{move.name}</p>
            <p className="text-xs font-label text-on-surface-variant">Lv{move.level}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-8 py-3 font-label font-semibold hover:bg-primary/90 transition-colors"
        >
          Start Training
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
        <p className="text-sm text-on-surface-variant font-body mt-3">
          First challenge: <strong>Power User Paradox</strong> (targets Communication)
        </p>
        <p className="mt-4">
          <Link href="/onboarding/calibration/frame" className="text-sm text-primary font-label font-semibold hover:underline">
            Take the assessment again
          </Link>
        </p>
      </div>
    </div>
  )
}
