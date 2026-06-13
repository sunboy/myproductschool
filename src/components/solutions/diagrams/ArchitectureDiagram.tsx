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

const NODE_W = 150
const NODE_H = 54
const NODE_GAP = 26
const LANE_TOP = 36
const LANE_PAD = 26 // horizontal breathing room each side of a node within its lane

interface PlacedNode {
  id: string
  label: string
  sublabel?: string
  role?: string
  x: number
  y: number
}

interface EdgeGeom {
  sx: number
  sy: number
  tx: number
  ty: number
  path: string
  midX: number
  midY: number
}

function edgeGeometry(from: PlacedNode, to: PlacedNode): EdgeGeom {
  const x1 = from.x + NODE_W / 2
  const y1 = from.y + NODE_H / 2
  const x2 = to.x + NODE_W / 2
  const y2 = to.y + NODE_H / 2
  // Anchor on facing edges when nodes sit in different lanes.
  const sx = x2 > x1 + NODE_W ? from.x + NODE_W : x2 < x1 - NODE_W ? from.x : x1
  const tx = x2 > x1 + NODE_W ? to.x : x2 < x1 - NODE_W ? to.x + NODE_W : x2
  const sy = sx === x1 ? (y2 > y1 ? from.y + NODE_H : from.y) : y1
  const ty = tx === x2 ? (y2 > y1 ? to.y : to.y + NODE_H) : y2
  const mx = (sx + tx) / 2
  return {
    sx, sy, tx, ty,
    path: `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`,
    midX: (sx + tx) / 2,
    midY: (sy + ty) / 2,
  }
}

/**
 * Lane-based architecture diagram. Layout is fully deterministic: lanes are
 * equal-width columns, nodes stack in declaration order within their lane,
 * edges are cubic curves between node centers. The spec never carries
 * coordinates. The SVG is capped at its intrinsic width so it never scales up
 * (which would balloon the type), and edge labels render as staggered chips so
 * parallel edges into the same lane do not pile their text on top of each other.
 */
export function ArchitectureDiagram({ spec, animate, reducedMotion }: Props) {
  const visible = animate || reducedMotion
  const laneCount = spec.lanes.length
  const laneW = NODE_W + LANE_PAD * 2
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

  const edges = useMemo(
    () => spec.edges
      .map((edge) => {
        const from = placed.get(edge.from)
        const to = placed.get(edge.to)
        return from && to ? { edge, geom: edgeGeometry(from, to) } : null
      })
      .filter((e): e is { edge: ArchitectureSpec['edges'][number]; geom: EdgeGeom } => e !== null),
    [spec, placed]
  )

  // Label chips: bucket by horizontal corridor and stagger vertically so two
  // edges crossing the same gap (e.g. two clients hitting one cache) do not
  // overlap. 0 -> centered, then +1 row, -1 row, +2 rows, ...
  const labels = useMemo(() => {
    const usedPerBand = new Map<number, number>()
    return edges
      .filter(({ edge }) => Boolean(edge.label))
      .map(({ edge, geom }) => {
        const band = Math.round(geom.midX / 36)
        const idx = usedPerBand.get(band) ?? 0
        usedPerBand.set(band, idx + 1)
        const step = Math.ceil(idx / 2)
        const sign = idx % 2 === 1 ? 1 : -1
        const text = truncateLabel(edge.label as string, 16)
        return {
          text,
          x: geom.midX,
          y: geom.midY + step * 16 * sign,
          w: text.length * 5.7 + 14,
        }
      })
  }, [edges])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ display: 'block', width: '100%', maxWidth: width, height: 'auto', margin: '0 auto', overflow: 'visible' }}
      aria-hidden="true"
    >
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

      {/* Edges (under nodes and labels) */}
      {edges.map(({ edge, geom }, i) => (
        <path
          key={i}
          d={geom.path}
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
      ))}

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
              y={node.y + (node.sublabel ? 22 : 31)}
              fontSize={11}
              fontWeight={700}
              fill="var(--color-on-surface)"
              fontFamily="var(--font-label)"
            >
              {truncateLabel(node.label, 20)}
            </text>
            {node.sublabel && (
              <text x={node.x + 14} y={node.y + 39} fontSize={9} fill="var(--color-on-surface-variant)" fontFamily="var(--font-body)">
                {truncateLabel(node.sublabel, 26)}
              </text>
            )}
            <text x={node.x + NODE_W - 8} y={node.y + 17} textAnchor="end" fontSize={11} fill={accent} fontFamily="Material Symbols Outlined">
              {ROLE_ICON[node.role ?? 'service'] ?? ROLE_ICON.service}
            </text>
          </g>
        )
      })}

      {/* Edge label chips (above everything so the background never merges with a node) */}
      {labels.map((label, i) => (
        <g key={i} opacity={visible ? 1 : 0} style={{ transition: reducedMotion ? 'none' : `opacity 300ms ease ${500 + i * 60}ms` }}>
          <rect
            x={label.x - label.w / 2}
            y={label.y - 9}
            width={label.w}
            height={17}
            rx={8}
            fill="var(--color-surface)"
            stroke="var(--color-outline-variant)"
            strokeWidth={0.75}
          />
          <text x={label.x} y={label.y + 3} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--color-on-surface-variant)" fontFamily="var(--font-label)">
            {label.text}
          </text>
        </g>
      ))}

      <style>{`@keyframes sol-arch-flow { to { stroke-dashoffset: -1; } }`}</style>
    </svg>
  )
}
