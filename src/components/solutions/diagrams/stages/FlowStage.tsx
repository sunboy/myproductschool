'use client'

import type { SteppedBase, SteppedDelta } from '@/lib/solutions/schema'

interface Props {
  base: Extract<SteppedBase, { kind: 'flow' }>
  delta: Extract<SteppedDelta, { base: 'flow' }>
  reducedMotion: boolean
}

/**
 * Pure renderer for the `flow` stepped base: a request-flow walkthrough through
 * named nodes (client -> api -> db) where each step lights the active node and
 * marks the visited path. Asserts no computed state, so this base is authored,
 * not trace-generated. Terra tokens only.
 */
export function FlowStage({ base, delta, reducedMotion }: Props) {
  const transition = reducedMotion ? 'none' : 'background 220ms ease, border-color 220ms ease, color 220ms ease, transform 220ms ease'
  const visited = new Set(delta.visited ?? [])

  return (
    <div
      role="img"
      aria-label="Request flow for this step"
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, minWidth: 0 }}
    >
      {base.nodes.map((node, i) => {
        const active = node.id === delta.activeNode
        const done = visited.has(node.id)
        return (
          <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div
              style={{
                padding: '9px 13px',
                borderRadius: 10,
                border: `1.5px solid ${active ? 'var(--color-primary)' : done ? 'var(--color-primary-fixed)' : 'var(--color-outline-variant)'}`,
                background: active ? 'var(--color-primary)' : done ? 'var(--color-primary-fixed)' : 'var(--color-surface-container-low)',
                color: active ? 'var(--color-on-primary)' : done ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                transform: active ? 'translateY(-2px)' : 'translateY(0)',
                transition,
                fontFamily: 'var(--font-label)',
                fontSize: 12.5,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {node.label}
            </div>
            {i < base.nodes.length - 1 && (
              <span aria-hidden style={{ color: 'var(--color-outline)', fontFamily: 'var(--font-label)', fontWeight: 800 }}>→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
