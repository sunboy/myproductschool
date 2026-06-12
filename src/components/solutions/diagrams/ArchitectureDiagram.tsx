'use client'

import { useMemo } from 'react'
import type { ArchitectureDiagram as ArchitectureSpec } from '@/lib/solutions/schema'
import { truncateLabel } from './hooks'

interface Props {
  spec: ArchitectureSpec
  animate: boolean
  reducedMotion: boolean
}

const ROLE_ACCENT: Record<string, string> = {
  client: 'var(--color-tertiary)',
  service: 'var(--color-primary)',
  store: 'var(--color-secondary)',
  queue: 'var(--color-tertiary)',
  external: 'var(--color-outline)',
}

const ROLE_ICON: Record<string, string> = {
  client: 'devices',
  service: 'settings',
  store: 'database',
  queue: 'stacked_email',
  external: 'public',
}

const NODE_W = 128
const NODE_H = 46
const NODE_GAP = 22
const LANE_TOP = 34

interface PlacedNode {
  id: string
  label: string
  sublabel?: string
  role?: string
  x: number
  y: number
}

/**
 * Lane-based architecture diagram. Layout is fully deterministic: lanes are
 * equal-width columns, nodes stack in declaration order within their lane,
 * edges are cubic curves between node centers. The spec never carries
 * coordinates.
 */
export function ArchitectureDiagram({ spec, animate, reducedMotion }: Props) {
  const visible = animate || reducedMotion
  const laneCount = spec.lanes.length
  const laneW = NODE_W + 36
  const width = laneCount * laneW
  const maxPerLane = Math.max(1, ...spec.lanes.map((_, lane) => spec.nodes.filter((n) => n.lane === lane).length))
  const height = LANE_TOP + maxPerLane * (NODE_H + NODE_GAP) + 8

  const placed = useMemo<Map<string, PlacedNode>>(() => {
    const map = new Map<string, PlacedNode>()
    const laneIndex: number[] = spec.lanes.map(() => 0)
    for (const node of spec.nodes) {
      const lane = Math.min(node.lane, laneCount - 1)
      const slot = laneIndex[lane]++
      map.set(node.id, {
        id: node.id,
        label: node.label,
        sublabel: node.sublabel,
        role: node.role,
        x: lane * laneW + (laneW - NODE_W) / 2,
        y: LANE_TOP + slot * (NODE_H + NODE_GAP),
      })
    }
    return map
  }, [spec, laneCount, laneW])

  const nodeOrder = useMemo(() => Array.from(placed.values()), [placed])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ overflow: 'visible' }} aria-hidden="true">
      <defs>
        <marker id="sol-arch-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--color-outline)" />
        </marker>
      </defs>

      {/* Lane headers + separators */}
      {spec.lanes.map((lane, i) => (
        <g key={i}>
          <text
            x={i * laneW + laneW / 2}
            y={14}
            textAnchor="middle"
            fontSize={10}
            fontWeight={800}
            letterSpacing="0.08em"
            fill="var(--color-on-surface-variant)"
            style={{ textTransform: 'uppercase', fontFamily: 'var(--font-label)' }}
          >
            {truncateLabel(lane.toUpperCase(), 18)}
          </text>
          {i > 0 && (
            <line x1={i * laneW} y1={24} x2={i * laneW} y2={height - 4} stroke="var(--color-outline-variant)" strokeWidth={1} strokeDasharray="3 5" opacity={0.6} />
          )}
        </g>
      ))}

      {/* Edges (under nodes) */}
      {spec.edges.map((edge, i) => {
        const from = placed.get(edge.from)
        const to = placed.get(edge.to)
        if (!from || !to) return null
        const x1 = from.x + NODE_W / 2
        const y1 = from.y + NODE_H / 2
        const x2 = to.x + NODE_W / 2
        const y2 = to.y + NODE_H / 2
        // Anchor on facing edges when nodes are in different lanes
        const sx = x2 > x1 + NODE_W ? from.x + NODE_W : x2 < x1 - NODE_W ? from.x : x1
        const tx = x2 > x1 + NODE_W ? to.x : x2 < x1 - NODE_W ? to.x + NODE_W : x2
        const sy = sx === x1 ? (y2 > y1 ? from.y + NODE_H : from.y) : y1
        const ty = tx === x2 ? (y2 > y1 ? to.y : to.y + NODE_H) : y2
        const mx = (sx + tx) / 2
        const path = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`
        const midX = (sx + tx) / 2
        const midY = (sy + ty) / 2 - 5
        return (
          <g key={i}>
            <path
              d={path}
              fill="none"
              stroke="var(--color-outline)"
              strokeWidth={1.5}
              markerEnd="url(#sol-arch-arrow)"
              pathLength={1}
              strokeDasharray={edge.animated && !reducedMotion ? '0.06 0.04' : '1'}
              strokeDashoffset={reducedMotion ? 0 : visible ? 0 : 1}
              style={{
                transition: reducedMotion || edge.animated ? 'none' : `stroke-dashoffset 800ms ease ${300 + i * 90}ms`,
                opacity: visible ? 1 : 0,
                ...(edge.animated && !reducedMotion && visible
                  ? { animation: 'sol-arch-flow 1.4s linear infinite' }
                  : {}),
              }}
            />
            {edge.label && (
              <text x={midX} y={midY} textAnchor="middle" fontSize={9} fill="var(--color-on-surface-variant)" fontFamily="var(--font-label)">
                {truncateLabel(edge.label, 20)}
              </text>
            )}
          </g>
        )
      })}

      {/* Nodes */}
      {nodeOrder.map((node, i) => {
        const accent = ROLE_ACCENT[node.role ?? 'service'] ?? ROLE_ACCENT.service
        return (
          <g
            key={node.id}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(8px)',
              transition: reducedMotion ? 'none' : `opacity 400ms ease ${i * 90}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${i * 90}ms`,
            }}
          >
            <rect
              x={node.x}
              y={node.y}
              width={NODE_W}
              height={NODE_H}
              rx={10}
              fill="var(--color-surface-container-low)"
              stroke="var(--color-outline-variant)"
              strokeWidth={1}
            />
            <rect x={node.x} y={node.y} width={4} height={NODE_H} rx={2} fill={accent} />
            <text
              x={node.x + 14}
              y={node.y + (node.sublabel ? 19 : 27)}
              fontSize={11}
              fontWeight={700}
              fill="var(--color-on-surface)"
              fontFamily="var(--font-label)"
            >
              {truncateLabel(node.label, 19)}
            </text>
            {node.sublabel && (
              <text x={node.x + 14} y={node.y + 34} fontSize={9} fill="var(--color-on-surface-variant)" fontFamily="var(--font-body)">
                {truncateLabel(node.sublabel, 24)}
              </text>
            )}
            <text x={node.x + NODE_W - 8} y={node.y + 16} textAnchor="end" fontSize={11} fill={accent} fontFamily="Material Symbols Outlined">
              {ROLE_ICON[node.role ?? 'service'] ?? ROLE_ICON.service}
            </text>
          </g>
        )
      })}

      <style>{`@keyframes sol-arch-flow { to { stroke-dashoffset: -1; } }`}</style>
    </svg>
  )
}
