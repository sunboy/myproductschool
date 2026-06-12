'use client'

import { useMemo } from 'react'
import type { ComplexityCurvesDiagram as ComplexityCurvesSpec } from '@/lib/solutions/schema'
import { DIAGRAM_COLOR_VAR } from './hooks'

interface Props {
  spec: ComplexityCurvesSpec
  animate: boolean
  reducedMotion: boolean
}

const PLOT_W = 240
const PLOT_H = 140
const PAD_LEFT = 30
const PAD_BOTTOM = 24
const PAD_TOP = 10

/** Growth shape -> normalized y in [0,1] for x in [0,1]. */
const SHAPE_FN: Record<ComplexityCurvesSpec['curves'][number]['shape'], (x: number) => number> = {
  constant: () => 0.06,
  log: (x) => Math.log2(1 + 15 * x) / 4,
  linear: (x) => x,
  linearithmic: (x) => (x * Math.log2(1 + 15 * x)) / 4,
  quadratic: (x) => x * x,
  exponential: (x) => (Math.pow(2, 8 * x) - 1) / 255,
}

function buildPath(shape: ComplexityCurvesSpec['curves'][number]['shape']): string {
  const fn = SHAPE_FN[shape]
  const points: string[] = []
  const samples = 40
  for (let i = 0; i <= samples; i++) {
    const x = i / samples
    const y = Math.min(fn(x), 1)
    const px = PAD_LEFT + x * PLOT_W
    const py = PAD_TOP + (1 - y) * PLOT_H
    points.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`)
  }
  return points.join(' ')
}

const FALLBACK_COLORS: Array<'primary' | 'secondary' | 'tertiary'> = ['primary', 'tertiary', 'secondary', 'primary']

/** Growth-rate comparison; each curve draws in via pathLength dashoffset. */
export function ComplexityCurvesDiagram({ spec, animate, reducedMotion }: Props) {
  const visible = animate || reducedMotion
  const width = PAD_LEFT + PLOT_W + 10
  const height = PAD_TOP + PLOT_H + PAD_BOTTOM
  const paths = useMemo(() => spec.curves.map((curve) => buildPath(curve.shape)), [spec])

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ overflow: 'visible' }} aria-hidden="true">
        {/* Axes */}
        <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + PLOT_H} stroke="var(--color-outline-variant)" strokeWidth={1} />
        <line x1={PAD_LEFT} y1={PAD_TOP + PLOT_H} x2={PAD_LEFT + PLOT_W} y2={PAD_TOP + PLOT_H} stroke="var(--color-outline-variant)" strokeWidth={1} />
        <text x={PAD_LEFT + PLOT_W / 2} y={height - 6} textAnchor="middle" fontSize={9.5} fill="var(--color-on-surface-variant)" fontFamily="var(--font-label)">
          {spec.xLabel ?? 'input size n'}
        </text>
        <text
          x={10}
          y={PAD_TOP + PLOT_H / 2}
          textAnchor="middle"
          fontSize={9.5}
          fill="var(--color-on-surface-variant)"
          fontFamily="var(--font-label)"
          transform={`rotate(-90 10 ${PAD_TOP + PLOT_H / 2})`}
        >
          {spec.yLabel ?? 'work'}
        </text>

        {spec.curves.map((curve, i) => (
          <path
            key={i}
            d={paths[i]}
            fill="none"
            stroke={DIAGRAM_COLOR_VAR[curve.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]]}
            strokeWidth={2.25}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={reducedMotion ? 0 : visible ? 0 : 1}
            style={{ transition: reducedMotion ? 'none' : `stroke-dashoffset 1000ms cubic-bezier(0.4,0,0.2,1) ${i * 220}ms` }}
          />
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 4 }}>
        {spec.curves.map((curve, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-label)', fontWeight: 600 }}>
            <span style={{
              width: 14,
              height: 3,
              borderRadius: 2,
              background: DIAGRAM_COLOR_VAR[curve.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]],
            }} />
            {curve.label}
          </span>
        ))}
      </div>
    </div>
  )
}
