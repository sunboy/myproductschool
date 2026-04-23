'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ── SVG Art ───────────────────────────────────────────────────── */

function WaveSVG({ color = '#7ee099' }: { color?: string }) {
  return (
    <svg viewBox="0 0 260 180" style={{ position: 'absolute', bottom: 0, right: 0, width: '72%', height: '72%', pointerEvents: 'none', zIndex: 0 }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <path key={i}
          d={`M ${-20 + i * 12} 180 C ${60 + i * 8} ${120 - i * 10}, ${140 + i * 6} ${150 - i * 12}, 280 ${80 - i * 8}`}
          stroke={color} strokeWidth="1.6" fill="none" opacity={0.18 + i * 0.04}
        />
      ))}
    </svg>
  )
}

function DotGridSVG({ color = '#7aa7ff' }: { color?: string }) {
  const dots: React.ReactElement[] = []
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 10; c++) {
      const scale = (r + c) / 14
      dots.push(<circle key={`${r}-${c}`} cx={c * 24 + 12} cy={r * 22 + 12} r={2.5 + scale * 4} fill={color} opacity={0.22 * (0.4 + scale * 0.8)} />)
    }
  }
  return (
    <svg viewBox="0 0 252 168" style={{ position: 'absolute', bottom: -10, right: -10, width: '75%', height: '75%', pointerEvents: 'none', zIndex: 0 }}>
      {dots}
    </svg>
  )
}

function ChevronSVG({ color = '#c89df5' }: { color?: string }) {
  return (
    <svg viewBox="0 0 240 180" style={{ position: 'absolute', bottom: 0, right: 0, width: '70%', height: '70%', pointerEvents: 'none', zIndex: 0 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <path key={i}
          d={`M ${-40 + i * 38} 190 L ${60 + i * 38} 80 L ${160 + i * 38} 190`}
          stroke={color} strokeWidth="12" fill="none" strokeLinecap="round"
          opacity={0.16 + i * 0.03}
        />
      ))}
    </svg>
  )
}

function ScatterSVG({ color = '#f5a76c' }: { color?: string }) {
  const rects: [number, number, number, number, number][] = [
    [180, 120, 32, 7, 48], [158, 148, 26, 6, -22], [200, 155, 20, 5, 15],
    [220, 130, 28, 7, 60], [165, 110, 18, 5, -35], [210, 100, 22, 6, 80],
    [175, 165, 30, 6, 10], [195, 175, 16, 5, -50], [230, 160, 24, 6, 30],
    [150, 135, 34, 7, 70], [240, 145, 18, 5, -15], [168, 180, 26, 6, 55],
  ]
  return (
    <svg viewBox="0 0 280 200" style={{ position: 'absolute', bottom: 0, right: 0, width: '78%', height: '78%', pointerEvents: 'none', zIndex: 0 }}>
      {rects.map(([x, y, w, h, r], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={h / 2}
          fill={color} opacity={0.18 + (i % 4) * 0.03}
          transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`}
        />
      ))}
    </svg>
  )
}

/* ── Data ─────────────────────────────────────────────────────── */

const TR = '200ms cubic-bezier(0.2, 0.8, 0.2, 1)'

const PARADIGMS = [
  {
    key: 'Traditional',
    tagline: 'Core craft',
    desc: 'Metrics, trade-offs, and prioritization — the PM toolkit that never expires.',
    quote: '"DAU/MAU looks great but revenue is flat. What\'s going on?"',
    count: 34, badge: 'Core collection',
    bg: '#1e3528', text: '#f3ede0', artColor: '#7ee099',
    icon: 'anchor', Art: WaveSVG,
  },
  {
    key: 'AI-Assisted',
    tagline: 'Human + model',
    desc: 'When to trust AI output, how to validate, and keeping judgment sharp.',
    quote: '"Your Copilot code passes tests but introduces a subtle security flaw."',
    count: 21, badge: 'Growing fast',
    bg: '#172240', text: '#e8f0ff', artColor: '#7aa7ff',
    icon: 'smart_toy', Art: DotGridSVG,
  },
  {
    key: 'Agentic',
    tagline: 'Autonomous loops',
    desc: 'Multi-step AI systems — agents, evals, failure modes, and trust boundaries.',
    quote: '"Your agent auto-approved 40 refunds overnight. 3 were fraudulent."',
    count: 14, badge: 'Growing',
    bg: '#25143a', text: '#f0e8ff', artColor: '#c89df5',
    icon: 'account_tree', Art: ChevronSVG,
  },
  {
    key: 'AI-Native',
    tagline: 'New product shapes',
    desc: "Products that couldn't exist without AI — entirely new interaction models.",
    quote: '"Your AI tutor is great at math but hallucinates history. Ship or hold?"',
    count: 17, badge: 'Emerging',
    bg: '#301a0a', text: '#fdeede', artColor: '#f5a76c',
    icon: 'auto_awesome', Art: ScatterSVG,
  },
] as const

/* ── Card ─────────────────────────────────────────────────────── */

function ParadigmCard({
  p, big = false, wide = false,
}: {
  p: typeof PARADIGMS[number]
  big?: boolean
  wide?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const { Art } = p

  const href = `/challenges?paradigm=${p.key.toLowerCase().replace(' ', '-')}`

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: p.bg,
        color: p.text,
        borderRadius: 32,
        padding: big ? '28px 28px 22px' : '22px 18px 16px',
        position: 'relative', overflow: 'hidden',
        minHeight: big ? 300 : wide ? 155 : 150,
        height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        cursor: 'pointer',
        transition: `transform ${TR}, box-shadow ${TR}`,
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'none',
        boxShadow: hovered ? '0 24px 60px -20px rgba(0,0,0,0.5)' : '0 4px 24px -8px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Art color={p.artColor} />

      {/* Top content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon + badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: big ? 20 : 12 }}>
          <div style={{
            width: big ? 42 : 34, height: big ? 42 : 34,
            borderRadius: big ? 13 : 10,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{
              color: p.artColor,
              fontSize: big ? 22 : 17,
              fontVariationSettings: "'FILL' 1, 'wght' 500",
            }}>{p.icon}</span>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)',
            padding: '4px 10px', borderRadius: 999,
            color: p.artColor,
          }}>{p.badge}</div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>
          {p.tagline}
        </div>
        <h3 style={{
          margin: '0 0 10px',
          fontFamily: 'var(--font-headline)',
          fontSize: big ? 28 : wide ? 22 : 19,
          fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1,
          color: p.text,
        }}>{p.key}</h3>

        {!wide && (
          <p style={{ margin: '0 0 12px', fontSize: big ? 13 : 12, lineHeight: 1.55, opacity: 0.8, maxWidth: 340 }}>
            {p.desc}
          </p>
        )}
        {wide && (
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, opacity: 0.8, maxWidth: 600 }}>
            {p.desc}
          </p>
        )}
      </div>

      {/* Bottom row */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          {!wide && (
            <div style={{
              fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.5, opacity: 0.65,
              maxWidth: 260, marginBottom: 14,
              borderLeft: `2px solid ${p.artColor}`, paddingLeft: 10,
            }}>
              {p.quote}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.75 }}>{p.count} challenges</span>
            <Link
              href={href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: p.text, padding: '8px 16px', borderRadius: 999,
                fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}
            >
              Explore{' '}
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>arrow_forward</span>
            </Link>
          </div>
        </div>
        {big && (
          <div style={{
            fontFamily: 'var(--font-headline)', fontSize: 120, fontWeight: 700,
            lineHeight: 0.85, opacity: 0.06, letterSpacing: '-0.04em',
            userSelect: 'none', color: p.artColor,
          }}>
            Tr.
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Grid ─────────────────────────────────────────────────────── */

export function ParadigmGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.45fr 1fr 1fr',
      gridTemplateRows: 'auto auto',
      gap: 14,
      marginBottom: 48,
    }}>
      {/* Traditional — big, spans 2 rows */}
      <div style={{ gridRow: '1 / span 2', gridColumn: 1 }}>
        <ParadigmCard p={PARADIGMS[0]} big />
      </div>
      {/* AI-Assisted — top right col 2 */}
      <div style={{ gridRow: 1, gridColumn: 2 }}>
        <ParadigmCard p={PARADIGMS[1]} />
      </div>
      {/* Agentic — top right col 3 */}
      <div style={{ gridRow: 1, gridColumn: 3 }}>
        <ParadigmCard p={PARADIGMS[2]} />
      </div>
      {/* AI-Native — wide, bottom cols 2+3 */}
      <div style={{ gridRow: 2, gridColumn: '2 / span 2' }}>
        <ParadigmCard p={PARADIGMS[3]} wide />
      </div>
    </div>
  )
}
