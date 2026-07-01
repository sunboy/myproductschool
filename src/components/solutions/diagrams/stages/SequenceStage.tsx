'use client'

import type { SteppedBase, SteppedDelta } from '@/lib/solutions/schema'

interface Props {
  base: Extract<SteppedBase, { kind: 'sequence' }>
  delta: Extract<SteppedDelta, { base: 'sequence' }>
  reducedMotion: boolean
}

/**
 * Pure renderer for the `sequence` stepped base: an ordered left-to-right row of
 * labeled nodes (a linked list in list order, or a tree traversal in visit order)
 * with a moving cursor, named pointers (prev/curr/next) above the nodes, a visited
 * (settled) tone, and an emphasis highlight. Stateless: it draws exactly the view
 * described by base + the current step's delta, so the parent stepper owns all
 * navigation.
 *
 * The full row of nodes (and the connector arrows between them) is always present,
 * so advancing a step only re-tones a node, never reflows the layout. Terra tokens
 * only; transitions are disabled under reduced motion. A horizontal scroll guards
 * the widest rows so a 12-node sequence never overflows its container.
 */
export function SequenceStage({ base, delta, reducedMotion }: Props) {
  const nodes = base.nodes
  const visited = new Set(delta.visited ?? [])
  const highlight = new Set(delta.highlight ?? [])

  // Invert pointers: index -> [pointer names] so each node knows its labels.
  const labelsByIndex: Record<number, string[]> = {}
  for (const [name, idx] of Object.entries(delta.pointers ?? {})) {
    ;(labelsByIndex[idx] ??= []).push(name)
  }

  const transition = reducedMotion
    ? 'none'
    : 'background 220ms ease, border-color 220ms ease, color 220ms ease, transform 220ms ease, opacity 220ms ease'

  return (
    <div style={{ minWidth: 0, overflowX: 'auto' }}>
      <div
        role="img"
        aria-label="Sequence state for this step"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
          minWidth: 'min-content',
        }}
      >
        {nodes.map((node, i) => {
          const labels = labelsByIndex[i]
          const isCurr = labels?.includes('curr')
          const isActive = i === delta.activeIndex
          const isVisited = visited.has(i)
          const isHighlight = highlight.has(i)
          const isLast = i === nodes.length - 1

          let background = 'var(--color-surface-container-low)'
          let borderColor = 'var(--color-outline-variant)'
          let color = 'var(--color-on-surface)'
          let transform = 'translateY(0)'

          if (isVisited) {
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
            transform = 'translateY(-6px)'
          }

          return (
            <div key={node.id} style={{ display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', minWidth: 0 }}>
                {/* pointer labels above the node */}
                <div
                  style={{
                    minHeight: 16,
                    fontFamily: 'var(--font-label)',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: isCurr ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {labels?.join(' / ') ?? ''}
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 10,
                    border: `1.5px solid ${borderColor}`,
                    background,
                    color,
                    transform,
                    transition,
                    fontFamily: 'var(--font-label)',
                    fontWeight: 800,
                    fontSize: 'clamp(12px, 2.4vw, 18px)',
                    minWidth: 0,
                  }}
                >
                  {node.label}
                </div>
                <div style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface-variant)' }}>
                  {i}
                </div>
              </div>

              {/* Connector arrow to the next node (reserved width, no reflow). */}
              {!isLast && (
                <div
                  aria-hidden
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 22,
                    height: 48,
                    marginTop: 22,
                    color: 'var(--color-on-surface-variant)',
                    fontSize: 16,
                    fontWeight: 800,
                  }}
                >
                  →
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
