'use client'

import type { SteppedBase, SteppedDelta } from '@/lib/solutions/schema'

interface Props {
  base: Extract<SteppedBase, { kind: 'pipeline' }>
  delta: Extract<SteppedDelta, { base: 'pipeline' }>
  reducedMotion: boolean
}

/**
 * Pure renderer for the `pipeline` stepped base: a horizontal chain of named
 * stages (e.g. raw rows -> group by -> filter), with the active stage lit and
 * its intermediate result table revealed below. Stateless: draws exactly the
 * view for base + the current step's delta. Terra tokens only.
 */
export function PipelineStage({ base, delta, reducedMotion }: Props) {
  const transition = reducedMotion ? 'none' : 'background 220ms ease, border-color 220ms ease, color 220ms ease'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      {/* Stage chain */}
      <div
        role="img"
        aria-label="Pipeline stages for this step"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}
      >
        {base.stages.map((stage, i) => {
          const active = i === delta.activeStage
          const done = i < delta.activeStage
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div
                style={{
                  padding: '7px 11px',
                  borderRadius: 8,
                  border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                  background: active ? 'var(--color-primary-fixed)' : done ? 'var(--color-surface-container-high)' : 'var(--color-surface-container-low)',
                  color: active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                  opacity: !active && !done && i > delta.activeStage ? 0.55 : 1,
                  fontFamily: 'var(--font-label)',
                  fontSize: 12,
                  fontWeight: 800,
                  transition,
                  whiteSpace: 'nowrap',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {stage}
              </div>
              {i < base.stages.length - 1 && (
                <span aria-hidden style={{ color: 'var(--color-outline)', fontFamily: 'var(--font-label)', fontWeight: 800 }}>→</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Intermediate result table for the active stage */}
      {delta.table && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-outline-variant)', borderRadius: 10 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: 'var(--font-body)', fontSize: 12 }}>
            <thead>
              <tr>
                {delta.table.columns.map((col, c) => (
                  <th
                    key={c}
                    style={{
                      textAlign: 'left',
                      padding: '7px 10px',
                      background: 'var(--color-surface-container-high)',
                      color: 'var(--color-on-surface-variant)',
                      fontFamily: 'var(--font-label)',
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--color-outline-variant)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {delta.table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      style={{
                        padding: '6px 10px',
                        color: 'var(--color-on-surface)',
                        borderBottom: r < delta.table!.rows.length - 1 ? '1px solid var(--color-outline-variant)' : 'none',
                        fontFamily: 'var(--font-mono, ui-monospace, Menlo, monospace)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
