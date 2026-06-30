'use client'

import type { SteppedBase, SteppedDelta } from '@/lib/solutions/schema'

interface Props {
  base: Extract<SteppedBase, { kind: 'grid' }>
  delta: Extract<SteppedDelta, { base: 'grid' }>
  reducedMotion: boolean
}

/**
 * Pure renderer for the `grid` stepped base: a 2-D dynamic-programming table
 * (LCS, edit distance, knapsack) that fills cell by cell as the learner steps.
 * Stateless: it draws exactly the view described by base + the current step's
 * delta, so the parent stepper owns all navigation.
 *
 * The full grid extent (every row and column, including optional axis labels) is
 * always reserved, so advancing a step only changes a cell's fill, never the
 * layout. Filled cells use the primary-fixed tone, the active cell uses solid
 * primary, and recurrence-input cells use the tertiary container. Terra tokens
 * only; transitions are disabled under reduced motion.
 */
export function GridStage({ base, delta, reducedMotion }: Props) {
  const { rows, cols, rowLabels, colLabels } = base

  // Index the delta by "r,c" so each cell knows its filled value and emphasis.
  const valueByCell: Record<string, string> = {}
  for (const cell of delta.fill) valueByCell[`${cell.r},${cell.c}`] = cell.value
  const highlight = new Set((delta.highlight ?? []).map((h) => `${h.r},${h.c}`))
  const activeKey = delta.active ? `${delta.active.r},${delta.active.c}` : null

  const transition = reducedMotion
    ? 'none'
    : 'background 220ms ease, border-color 220ms ease, color 220ms ease, transform 220ms ease'

  const hasColLabels = Array.isArray(colLabels) && colLabels.length > 0
  const hasRowLabels = Array.isArray(rowLabels) && rowLabels.length > 0

  // One leading column for row labels (when present), then `cols` data columns.
  const gridTemplateColumns = `${hasRowLabels ? 'minmax(28px, auto) ' : ''}repeat(${cols}, minmax(0, 1fr))`

  const labelCellStyle: React.CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    minHeight: 22,
    fontFamily: 'var(--font-label)',
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--color-on-surface-variant)',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ minWidth: 0, overflowX: 'auto' }}>
      <div
        role="img"
        aria-label="Dynamic programming table for this step"
        style={{
          display: 'grid',
          gridTemplateColumns,
          gap: 5,
          alignItems: 'stretch',
        }}
      >
        {/* Optional column-label header row */}
        {hasColLabels && (
          <>
            {hasRowLabels && <div style={labelCellStyle} aria-hidden />}
            {Array.from({ length: cols }, (_, c) => (
              <div key={`col-${c}`} style={labelCellStyle}>
                {colLabels![c] ?? ''}
              </div>
            ))}
          </>
        )}

        {/* Data rows, each optionally prefixed by a row label */}
        {Array.from({ length: rows }, (_, r) => (
          <RowFragment key={`row-${r}`}>
            {hasRowLabels && (
              <div style={labelCellStyle}>{rowLabels![r] ?? ''}</div>
            )}
            {Array.from({ length: cols }, (_, c) => {
              const key = `${r},${c}`
              const value = valueByCell[key]
              const filled = value !== undefined
              const isActive = activeKey === key
              const isHighlight = highlight.has(key)

              let background = 'var(--color-surface-container-low)'
              let borderColor = 'var(--color-outline-variant)'
              let color = 'var(--color-on-surface-variant)'
              let transform = 'translateY(0)'

              if (filled) {
                background = 'var(--color-primary-fixed)'
                borderColor = 'var(--color-primary)'
                color = 'var(--color-on-surface)'
              }
              if (isHighlight) {
                background = 'var(--color-tertiary-container)'
                borderColor = 'var(--color-tertiary)'
                color = 'var(--color-on-surface)'
              }
              if (isActive) {
                background = 'var(--color-primary)'
                borderColor = 'var(--color-primary)'
                color = 'var(--color-on-primary)'
                transform = 'translateY(-4px)'
              }

              return (
                <div
                  key={key}
                  style={{
                    aspectRatio: '1',
                    minHeight: 30,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 8,
                    border: `1.5px solid ${borderColor}`,
                    background,
                    color,
                    transform,
                    transition,
                    fontFamily: 'var(--font-label)',
                    fontWeight: 800,
                    fontSize: 'clamp(10px, 2vw, 16px)',
                    minWidth: 0,
                  }}
                >
                  {filled ? value : ''}
                </div>
              )
            })}
          </RowFragment>
        ))}
      </div>
    </div>
  )
}

/** Contiguous cells in a CSS grid; a fragment keeps the flat single-grid layout. */
function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
