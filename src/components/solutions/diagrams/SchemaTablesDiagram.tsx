'use client'

import { useMemo } from 'react'
import type { SchemaTablesDiagram as SchemaTablesSpec } from '@/lib/solutions/schema'
import { truncateLabel } from './hooks'

interface Props {
  spec: SchemaTablesSpec
  animate: boolean
  reducedMotion: boolean
}

const CARD_W = 148
const HEADER_H = 24
const ROW_H = 17
const GAP_X = 42
const GAP_Y = 30

interface PlacedTable {
  name: string
  columns: SchemaTablesSpec['tables'][number]['columns']
  x: number
  y: number
  h: number
}

const BADGE_COLOR: Record<string, string> = {
  PK: 'var(--color-primary)',
  FK: 'var(--color-tertiary)',
  UQ: 'var(--color-secondary)',
  IDX: 'var(--color-outline)',
}

/**
 * ER-style table cards on a 2-column grid with relation connectors.
 * Deterministic layout: tables placed in declaration order, row by row.
 */
export function SchemaTablesDiagram({ spec, animate, reducedMotion }: Props) {
  const visible = animate || reducedMotion
  const cols = spec.tables.length <= 2 ? spec.tables.length : 2

  const placed = useMemo<Map<string, PlacedTable>>(() => {
    const map = new Map<string, PlacedTable>()
    const rowHeights: number[] = []
    spec.tables.forEach((table, i) => {
      const row = Math.floor(i / cols)
      const h = HEADER_H + table.columns.length * ROW_H + 8
      rowHeights[row] = Math.max(rowHeights[row] ?? 0, h)
    })
    spec.tables.forEach((table, i) => {
      const row = Math.floor(i / cols)
      const col = i % cols
      const y = rowHeights.slice(0, row).reduce((acc, rh) => acc + rh + GAP_Y, 4)
      map.set(table.name, {
        name: table.name,
        columns: table.columns,
        x: col * (CARD_W + GAP_X) + 4,
        y,
        h: HEADER_H + table.columns.length * ROW_H + 8,
      })
    })
    return map
  }, [spec, cols])

  const tables = useMemo(() => Array.from(placed.values()), [placed])
  const width = cols * (CARD_W + GAP_X) - GAP_X + 8
  const height = Math.max(...tables.map((t) => t.y + t.h)) + 8

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', width: '100%', maxWidth: width, height: 'auto', margin: '0 auto', overflow: 'visible' }} aria-hidden="true">
      {/* Relations under cards */}
      {spec.relations.map((rel, i) => {
        const from = placed.get(rel.from)
        const to = placed.get(rel.to)
        if (!from || !to) return null
        const x1 = from.x + CARD_W / 2
        const y1 = from.y + from.h / 2
        const x2 = to.x + CARD_W / 2
        const y2 = to.y + to.h / 2
        const sx = x2 > x1 + CARD_W / 2 ? from.x + CARD_W : x2 < x1 - CARD_W / 2 ? from.x : x1
        const tx = x2 > x1 + CARD_W / 2 ? to.x : x2 < x1 - CARD_W / 2 ? to.x + CARD_W : x2
        const sy = sx === x1 ? (y2 > y1 ? from.y + from.h : from.y) : y1
        const ty = tx === x2 ? (y2 > y1 ? to.y : to.y + to.h) : y2
        const mx = (sx + tx) / 2
        return (
          <g key={i}>
            <path
              d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`}
              fill="none"
              stroke="var(--color-outline)"
              strokeWidth={1.25}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={reducedMotion ? 0 : visible ? 0 : 1}
              style={{ transition: reducedMotion ? 'none' : `stroke-dashoffset 700ms ease ${400 + i * 110}ms` }}
            />
            {rel.cardinality && (
              <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--color-on-surface-variant)" fontFamily="var(--font-label)">
                {rel.cardinality}
              </text>
            )}
          </g>
        )
      })}

      {/* Table cards */}
      {tables.map((table, i) => (
        <g
          key={table.name}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transition: reducedMotion ? 'none' : `opacity 400ms ease ${i * 110}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${i * 110}ms`,
          }}
        >
          <rect x={table.x} y={table.y} width={CARD_W} height={table.h} rx={8} fill="var(--color-surface-container-low)" stroke="var(--color-outline-variant)" strokeWidth={1} />
          <path
            d={`M ${table.x} ${table.y + 8} a 8 8 0 0 1 8 -8 h ${CARD_W - 16} a 8 8 0 0 1 8 8 v ${HEADER_H - 8} h -${CARD_W} z`}
            fill="var(--color-primary-fixed)"
          />
          <text x={table.x + 9} y={table.y + 16} fontSize={11} fontWeight={800} fill="var(--color-on-surface)" fontFamily="var(--font-label)">
            {truncateLabel(table.name, 18)}
          </text>
          {table.columns.map((column, j) => {
            const rowY = table.y + HEADER_H + j * ROW_H + 12
            return (
              <g key={j}>
                <text x={table.x + 9} y={rowY} fontSize={10} fill="var(--color-on-surface-variant)" fontFamily="var(--font-body)">
                  {truncateLabel(column.name, 16)}
                </text>
                {(column.badges ?? []).slice(0, 2).map((badge, k) => (
                  <text
                    key={k}
                    x={table.x + CARD_W - 8 - k * 22}
                    y={rowY}
                    textAnchor="end"
                    fontSize={8}
                    fontWeight={800}
                    fill={BADGE_COLOR[badge] ?? 'var(--color-outline)'}
                    fontFamily="var(--font-label)"
                  >
                    {badge}
                  </text>
                ))}
              </g>
            )
          })}
        </g>
      ))}
    </svg>
  )
}
