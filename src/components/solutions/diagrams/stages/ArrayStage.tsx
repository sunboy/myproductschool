'use client'

import type { SteppedBase, SteppedDelta } from '@/lib/solutions/schema'

interface Props {
  base: Extract<SteppedBase, { kind: 'array' }>
  delta: Extract<SteppedDelta, { base: 'array' }>
  reducedMotion: boolean
}

/**
 * Pure renderer for the `array` stepped base: indexed cells with pointer labels
 * (lo/mid/hi), a discarded (greyed) state, a highlighted compared cell, and an
 * optional live-range band. Stateless: it draws exactly the view described by
 * base + the current step's delta, so the parent stepper owns all navigation.
 *
 * Deterministic layout, no coordinates. Terra tokens only. Transitions are
 * disabled under reduced motion (the parent still allows manual stepping).
 */
export function ArrayStage({ base, delta, reducedMotion }: Props) {
  const n = base.cells.length
  const discarded = new Set(delta.discarded ?? [])
  const highlight = new Set(delta.highlight ?? [])

  // Invert pointerAt: index -> [pointer names] so each cell knows its labels.
  const labelsByIndex: Record<number, string[]> = {}
  for (const [name, idx] of Object.entries(delta.pointerAt)) {
    ;(labelsByIndex[idx] ??= []).push(name)
  }

  const transition = reducedMotion
    ? 'none'
    : 'background 220ms ease, border-color 220ms ease, opacity 220ms ease, transform 220ms ease'

  // Live-range band geometry (binary-search style): cover the lo..hi span.
  let rangeLeftPct = 0
  let rangeWidthPct = 0
  if (base.rangeTrack) {
    const lo = delta.pointerAt.lo ?? delta.pointerAt.l ?? 0
    const hi = delta.pointerAt.hi ?? delta.pointerAt.r ?? n - 1
    const left = Math.min(lo, hi)
    const right = Math.max(lo, hi)
    rangeLeftPct = (left / n) * 100
    rangeWidthPct = ((right - left + 1) / n) * 100
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div
        role="img"
        aria-label="Array state for this step"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          gap: 6,
          alignItems: 'end',
        }}
      >
        {base.cells.map((cell, i) => {
          const labels = labelsByIndex[i]
          const isMid = labels?.includes('mid')
          const isDiscarded = discarded.has(i)
          const isHighlight = highlight.has(i) && !delta.found
          const isFound = delta.found && isMid

          let background = 'var(--color-surface-container-low)'
          let borderColor = 'var(--color-outline-variant)'
          let color = 'var(--color-on-surface)'
          let transform = 'translateY(0)'
          if (isDiscarded) {
            background = 'var(--color-surface-dim)'
          }
          if (isHighlight) {
            background = 'var(--color-primary-fixed)'
            borderColor = 'var(--color-primary)'
          }
          if (isMid && !isFound) {
            transform = 'translateY(-6px)'
            borderColor = 'var(--color-primary)'
          }
          if (isFound) {
            background = 'var(--color-primary)'
            borderColor = 'var(--color-primary)'
            color = 'var(--color-on-primary)'
            transform = 'translateY(-8px)'
          }

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', minWidth: 0 }}>
              {/* pointer labels above the cell */}
              <div
                style={{
                  minHeight: 16,
                  fontFamily: 'var(--font-label)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: isMid ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                  textAlign: 'center',
                  lineHeight: 1.1,
                }}
              >
                {labels?.join(' / ') ?? ''}
              </div>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 8,
                  border: `1.5px solid ${borderColor}`,
                  background,
                  color,
                  opacity: isDiscarded ? 0.35 : 1,
                  transform,
                  transition,
                  fontFamily: 'var(--font-label)',
                  fontWeight: 800,
                  fontSize: 'clamp(11px, 2.4vw, 18px)',
                  minWidth: 0,
                }}
              >
                {cell.value}
              </div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface-variant)' }}>
                {i}
              </div>
            </div>
          )
        })}
      </div>

      {base.rangeTrack && (
        <div
          aria-hidden
          style={{
            position: 'relative',
            height: 8,
            borderRadius: 999,
            background: 'var(--color-surface-dim)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${rangeLeftPct}%`,
              width: `${rangeWidthPct}%`,
              borderRadius: 999,
              background: 'var(--color-primary)',
              opacity: 0.25,
              transition: reducedMotion ? 'none' : 'left 220ms ease, width 220ms ease',
            }}
          />
        </div>
      )}
    </div>
  )
}
