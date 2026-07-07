'use client'

// ArtifactSpineStrip — the session's deliverable, as a compact horizontal strip
// in the workspace header. Each milestone fills as the session runs (derived
// from live signals via deriveArtifactRows). It answers "what have I captured,
// what's left" at a glance without competing with the terminal for space, and
// it never wraps — a long adaptive arc scrolls horizontally inside 48px.
// The two accent rows (Connected = the BigQuery tools/MCP, Skill = the
// reusable play) read a shade louder; adaptive Regroup/Stretch rows carry
// their badge and a dashed border, mirroring the arc's injected steps.

import type { ArtifactRow } from './types'

interface ArtifactSpineStripProps {
  rows: ArtifactRow[]
  done: number
  total: number
}

export function ArtifactSpineStrip({ rows, done, total }: ArtifactSpineStripProps) {
  return (
    <div
      className="flex items-center gap-1.5 min-w-0 w-full"
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Analysis progress: ${done} of ${total} milestones`}
    >
      <span
        className="font-label font-bold uppercase tracking-wider text-on-surface-variant shrink-0 mr-1"
        style={{ fontSize: 10 }}
      >
        Analysis
      </span>
      <span
        className="font-mono font-bold text-primary shrink-0 mr-1.5"
        style={{ fontSize: 11 }}
      >
        {done}/{total}
      </span>

      <div className="flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar">
        {rows.map((row, i) => (
          <div key={`${row.key}-${row.stepId ?? i}`} className="flex items-center shrink-0">
            {i > 0 && (
              <span
                className="shrink-0"
                style={{
                  width: 10,
                  height: 1.5,
                  borderRadius: 99,
                  background:
                    rows[i - 1].state === 'filled' && row.state !== 'pending'
                      ? 'var(--color-primary)'
                      : 'var(--color-outline-variant)',
                  opacity: 0.7,
                }}
              />
            )}
            <Milestone row={row} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Milestone({ row }: { row: ArtifactRow }) {
  const filled = row.state === 'filled'
  const active = row.state === 'active'
  const accent = row.accent

  // Filled: primary (or tertiary accent for the differentiators). Active:
  // amber pulse. Pending: quiet outline. Adaptive rows keep a dashed border
  // so an injected step reads as inserted, not pre-planned.
  const color = filled
    ? accent
      ? 'var(--color-tertiary)'
      : 'var(--color-primary)'
    : active
      ? '#c9933a'
      : 'var(--color-on-surface-variant)'

  const bg = filled
    ? accent
      ? 'var(--color-tertiary-container)'
      : 'var(--color-primary-fixed)'
    : active
      ? 'rgba(201,147,58,0.14)'
      : 'transparent'

  const icon = filled
    ? 'check_circle'
    : active
      ? 'radio_button_checked'
      : 'radio_button_unchecked'

  const border = row.badge
    ? `1px dashed ${filled || active ? color : 'var(--color-outline-variant)'}`
    : filled || active
      ? '1px solid transparent'
      : '1px solid var(--color-outline-variant)'

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full shrink-0"
      title={row.value ? `${row.ariaTitle ?? row.label}: ${row.value}` : row.ariaTitle ?? row.label}
      aria-label={row.ariaTitle ?? row.label}
      style={{
        padding: '3px 8px 3px 6px',
        background: bg,
        border,
      }}
    >
      <span
        className={`material-symbols-outlined${active ? ' cc-artifact-pulse' : ''}`}
        style={{
          fontSize: 13,
          color,
          fontVariationSettings: `'FILL' ${filled || active ? 1 : 0}, 'wght' 500`,
        }}
      >
        {icon}
      </span>
      <span
        className="font-label font-bold whitespace-nowrap"
        style={{ fontSize: 10.5, color }}
      >
        {row.label}
      </span>
      {row.badge && (
        <span
          className="font-label whitespace-nowrap uppercase"
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color,
            border: `1px solid ${color}`,
            borderRadius: 999,
            padding: '0 4px',
            lineHeight: 1.5,
            opacity: 0.85,
          }}
        >
          {row.badge}
        </span>
      )}
    </span>
  )
}
