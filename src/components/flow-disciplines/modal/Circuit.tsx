'use client'

import { useEffect, useRef, useCallback } from 'react'
import { TraditionGlyph } from '../shared/TraditionGlyph'
import { useAnimationMode } from '../context/AnimationModeContext'
import type { Discipline } from '@/lib/data/flow-framework/types'

interface CircuitProps {
  discipline: Discipline
  activeNodeId: string | null
  onNodeClick: (id: string, type: 'tradition' | 'competency' | 'step') => void
}

// SVG layout constants matching the reference HTML
const LAYOUT = {
  leftX: 200,
  midX: 600,
  rightX: 1000,
  topY: 60,
  bottomY: 540,
  traditionRadius: 26,
  stepRadius: 38,
  compRectW: 220,
  compRectH: 38,
  viewBox: '120 20 1060 560',
}

function yPositions(count: number): number[] {
  if (count === 1) return [(LAYOUT.topY + LAYOUT.bottomY) / 2]
  const usable = LAYOUT.bottomY - LAYOUT.topY
  const gap = usable / (count - 1)
  return Array.from({ length: count }, (_, i) => LAYOUT.topY + i * gap)
}

function fiberPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1
  return `M ${x1} ${y1} C ${x1 + dx * 0.55} ${y1}, ${x2 - dx * 0.55} ${y2}, ${x2} ${y2}`
}

export function Circuit({ discipline, activeNodeId, onNodeClick }: CircuitProps) {
  const { mode } = useAnimationMode()
  const svgRef = useRef<SVGSVGElement>(null)
  const gsapRef = useRef<typeof import('gsap').gsap | null>(null)

  const traditionYs = yPositions(discipline.traditions.length)
  const compYs = yPositions(discipline.competencies.length)
  const stepYs = yPositions(discipline.steps.length)

  const tPos: Record<string, { x: number; y: number }> = {}
  discipline.traditions.forEach((t, i) => { tPos[t.id] = { x: LAYOUT.leftX, y: traditionYs[i] } })

  const cPos: Record<string, { x: number; y: number }> = {}
  discipline.competencies.forEach((c, i) => { cPos[c.id] = { x: LAYOUT.midX, y: compYs[i] } })

  const sPos: Record<string, { x: number; y: number }> = {}
  discipline.steps.forEach((s, i) => { sPos[s.id] = { x: LAYOUT.rightX, y: stepYs[i] } })

  // Gather all fibers for this discipline
  const fibers: { path: string; fromId: string; toId: string }[] = []
  Object.entries(discipline.edges).forEach(([fromId, targets]) => {
    if (fromId.startsWith('t') && tPos[fromId]) {
      targets.forEach((toId) => {
        if (cPos[toId]) {
          fibers.push({
            fromId,
            toId,
            path: fiberPath(
              tPos[fromId].x + LAYOUT.traditionRadius,
              tPos[fromId].y,
              cPos[toId].x - LAYOUT.compRectW / 2,
              cPos[toId].y
            ),
          })
        }
      })
    } else if (cPos[fromId]) {
      targets.forEach((toId) => {
        if (sPos[toId]) {
          fibers.push({
            fromId,
            toId,
            path: fiberPath(
              cPos[fromId].x + LAYOUT.compRectW / 2,
              cPos[fromId].y,
              sPos[toId].x - LAYOUT.stepRadius,
              sPos[toId].y
            ),
          })
        }
      })
    }
  })

  // Determine active connected nodes for dimming
  const connectedIds = new Set<string>()
  if (activeNodeId) {
    connectedIds.add(activeNodeId)
    const edges = discipline.edges[activeNodeId] ?? []
    edges.forEach((id) => connectedIds.add(id))
    // Also find nodes that connect TO the active node
    Object.entries(discipline.edges).forEach(([fromId, targets]) => {
      if (targets.includes(activeNodeId)) connectedIds.add(fromId)
    })
  }

  const isFiberActive = (fromId: string, toId: string) => {
    if (!activeNodeId) return false
    return connectedIds.has(fromId) && connectedIds.has(toId)
  }

  const isNodeDimmed = (id: string) => {
    if (!activeNodeId) return false
    return !connectedIds.has(id)
  }

  // Entrance animation
  const runEntrance = useCallback(() => {
    const gsap = gsapRef.current
    if (!gsap || !svgRef.current) return
    const stagger = mode === 'maximalist' ? 0.04 : mode === 'cinematic' ? 0.025 : 0.015
    const dur = mode === 'maximalist' ? 0.7 : 0.5
    const ease = mode === 'maximalist' ? 'back.out(1.7)' : 'power2.out'

    gsap.fromTo(
      svgRef.current.querySelectorAll('.circuit-node'),
      { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' },
      { opacity: 1, scale: 1, duration: dur, stagger, ease }
    )
    gsap.fromTo(
      svgRef.current.querySelectorAll('.circuit-fiber'),
      { opacity: 0 },
      { opacity: 0.18, duration: 0.8, delay: 0.2, ease: 'power1.out' }
    )
  }, [mode])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    import('gsap').then(({ gsap }) => {
      gsapRef.current = gsap
      runEntrance()
    }).catch(() => {})
  }, [discipline.id, runEntrance])

  return (
    <svg
      ref={svgRef}
      viewBox={LAYOUT.viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full overflow-visible block"
      style={{ minHeight: 0 }}
    >
      <defs>
        <filter id="circuitGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Fiber paths */}
      {fibers.map(({ path, fromId, toId }) => {
        const active = isFiberActive(fromId, toId)
        return (
          <path
            key={`${fromId}-${toId}`}
            className={`circuit-fiber ${active ? 'fiber-active' : ''}`}
            d={path}
            fill="none"
            stroke={active ? '#ffc580' : '#d4a574'}
            strokeWidth={active ? 1.7 : 1}
            opacity={activeNodeId ? (active ? 0.95 : 0.07) : 0.25}
            strokeDasharray={active ? '4 6' : undefined}
            style={active ? { animation: 'fiberFlow 1.2s linear infinite' } : undefined}
          />
        )
      })}

      {/* Tradition nodes */}
      {discipline.traditions.map((t, i) => {
        const { x, y } = tPos[t.id]
        const dimmed = isNodeDimmed(t.id)
        const active = activeNodeId === t.id
        return (
          <g
            key={t.id}
            className="circuit-node"
            style={{ cursor: 'pointer', opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.4s' }}
            onClick={() => onNodeClick(t.id, 'tradition')}
          >
            <circle
              cx={x}
              cy={y}
              r={LAYOUT.traditionRadius}
              fill="#1f362d"
              stroke={active ? '#ffc580' : '#d4a574'}
              strokeWidth={active ? 2.4 : 1.45}
              filter={active ? 'url(#circuitGlow)' : undefined}
            />
            {/* Glyph centered inside tradition circle: offset by -(size/2) */}
            <g transform={`translate(${x - 11}, ${y - 11})`}>
              <TraditionGlyph
                index={t.glyph as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                size={22}
              />
            </g>
            {/* Tradition number label to the left */}
            <text
              x={x - LAYOUT.traditionRadius - 14}
              y={y + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="12.5"
              fill="#d4a574"
              opacity="0.72"
              letterSpacing="1.5"
            >
              {String(i + 1).padStart(2, '0')}
            </text>
          </g>
        )
      })}

      {/* Competency nodes (rectangles) */}
      {discipline.competencies.map((c) => {
        const { x, y } = cPos[c.id]
        const dimmed = isNodeDimmed(c.id)
        const active = activeNodeId === c.id
        return (
          <g
            key={c.id}
            className="circuit-node"
            style={{ cursor: 'pointer', opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.4s' }}
            onClick={() => onNodeClick(c.id, 'competency')}
          >
            <rect
              x={x - LAYOUT.compRectW / 2}
              y={y - LAYOUT.compRectH / 2}
              width={LAYOUT.compRectW}
              height={LAYOUT.compRectH}
              rx="6"
              fill="#1f362d"
              stroke={active ? '#ffc580' : '#d4a574'}
              strokeWidth={active ? 2.4 : 1.45}
              filter={active ? 'url(#circuitGlow)' : undefined}
            />
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="15"
              fontWeight="700"
              fill={active ? '#ffc580' : '#d4a574'}
              letterSpacing="0.3"
              opacity={dimmed ? 0.6 : 1}
            >
              {c.label.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </text>
          </g>
        )
      })}

      {/* FLOW step nodes (circles) */}
      {discipline.steps.map((s) => {
        const { x, y } = sPos[s.id]
        const dimmed = isNodeDimmed(s.id)
        const active = activeNodeId === s.id
        return (
          <g
            key={s.id}
            className="circuit-node"
            style={{ cursor: 'pointer', opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.4s' }}
            onClick={() => onNodeClick(s.id, 'step')}
          >
            <circle
              cx={x}
              cy={y}
              r={LAYOUT.stepRadius}
              fill="#1f362d"
              stroke={active ? '#ffc580' : '#d4a574'}
              strokeWidth={active ? 2.5 : 1.65}
              filter={active ? 'url(#circuitGlow)' : undefined}
            />
            <text
              x={x}
              y={y + 6}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="25"
              fontWeight="700"
              fill={active ? '#ffc580' : '#d4a574'}
              letterSpacing="0.5"
              opacity={dimmed ? 0.6 : 1}
            >
              {s.label}
            </text>
            {/* Step name label to the right */}
            <text
              x={x + LAYOUT.stepRadius + 14}
              y={y + 4}
              textAnchor="start"
              fontFamily="JetBrains Mono, monospace"
              fontSize="12.5"
              fill="#d4a574"
              opacity={dimmed ? 0.42 : 0.78}
              letterSpacing="2"
            >
              {s.name}
            </text>
          </g>
        )
      })}

      <style>{`
        @keyframes fiberFlow {
          to { stroke-dashoffset: -10; }
        }
      `}</style>
    </svg>
  )
}
