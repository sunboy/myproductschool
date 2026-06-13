'use client'

import { useEffect, useState } from 'react'
import type { ComparisonBarsDiagram as ComparisonBarsSpec } from '@/lib/solutions/schema'
import { DIAGRAM_COLOR_VAR, truncateLabel } from './hooks'

interface Props {
  spec: ComparisonBarsSpec
  animate: boolean
  reducedMotion: boolean
}

const MAX_BAR_W = 170
const LABEL_W = 92
const ROW_H = 38
const BAR_H = 14

/** Horizontal comparison bars; fill widths transition in staggered, values count up. */
export function ComparisonBarsDiagram({ spec, animate, reducedMotion }: Props) {
  const visible = animate || reducedMotion
  const width = LABEL_W + MAX_BAR_W + 46
  const height = spec.bars.length * ROW_H + 10

  const [displayed, setDisplayed] = useState<number[]>(() => spec.bars.map(() => 0))

  useEffect(() => {
    if (!visible) return
    if (reducedMotion) {
      setDisplayed(spec.bars.map((b) => Math.round(b.value)))
      return
    }
    const duration = 700
    const start = performance.now()
    let rafId: number
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setDisplayed(spec.bars.map((b) => Math.round(b.value * progress)))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [visible, reducedMotion, spec.bars])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', width: '100%', maxWidth: width, height: 'auto', maxHeight: height, overflow: 'visible' }} aria-hidden="true">
      {spec.bars.map((bar, i) => {
        const y = i * ROW_H + 6
        const centerY = y + BAR_H / 2
        const fill = DIAGRAM_COLOR_VAR[bar.color ?? 'primary']
        const targetW = (Math.min(bar.value, 100) / 100) * MAX_BAR_W
        return (
          <g key={i}>
            <text x={0} y={centerY} fontSize={11} fontWeight={600} fill="var(--color-on-surface)" dominantBaseline="middle" fontFamily="var(--font-label)">
              {truncateLabel(bar.label, 16)}
            </text>
            <rect x={LABEL_W} y={y} width={MAX_BAR_W} height={BAR_H} rx={4} fill="var(--color-surface-container-highest)" />
            <rect
              x={LABEL_W}
              y={y}
              width={0}
              height={BAR_H}
              rx={4}
              fill={fill}
              style={{
                width: visible ? targetW : 0,
                transition: reducedMotion ? 'none' : `width ${0.7 + i * 0.1}s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s`,
              }}
            />
            <text x={LABEL_W + MAX_BAR_W + 6} y={centerY} fontSize={10} fill="var(--color-on-surface-variant)" dominantBaseline="middle" fontFamily="var(--font-label)">
              {displayed[i]}{spec.unit ?? ''}
            </text>
            {bar.annotation && (
              <text x={LABEL_W} y={y + BAR_H + 11} fontSize={9} fill="var(--color-on-surface-variant)" fontFamily="var(--font-body)">
                {truncateLabel(bar.annotation, 42)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
