'use client'

// AnalystDimensionChart — renders the 7 analyst_v1 dimensions as horizontal bars
// (clearer than a 0/0.5/1 radar at this resolution), colored by score band. Shared
// by the post-session mirror and the public share artifact so they read identically.

import type { AnalystDimensionView } from '@/lib/coding-grading/analyst-rubric'

interface AnalystDimensionChartProps {
  dimensions: AnalystDimensionView[]
  overallNote?: string | null
  /** 'mirror' = on the cream debrief surface; 'share' = on the dark share page. */
  variant?: 'mirror' | 'share'
  className?: string
}

const SCORE_LABEL: Record<number, string> = { 1: 'Strong', 0.5: 'Partial', 0: 'Needs work' }

function barColor(score: number): string {
  if (score >= 1) return 'var(--color-primary)'
  if (score >= 0.5) return 'var(--color-tertiary)'
  return 'var(--color-outline)'
}

export function AnalystDimensionChart({
  dimensions,
  overallNote,
  variant = 'share',
  className,
}: AnalystDimensionChartProps) {
  if (!dimensions || dimensions.length === 0) return null

  const onSurface = variant === 'share' ? 'rgba(255,255,255,0.92)' : 'var(--color-on-surface)'
  const onVariant = variant === 'share' ? 'rgba(255,255,255,0.62)' : 'var(--color-on-surface-variant)'
  const track = variant === 'share' ? 'rgba(255,255,255,0.12)' : 'var(--color-surface-container-high)'
  const cardBg = variant === 'share' ? 'rgba(255,255,255,0.04)' : 'var(--color-surface-container)'

  return (
    <div
      className={className}
      style={{
        borderRadius: 12,
        background: cardBg,
        padding: variant === 'share' ? 20 : 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1, 'wght' 400" }}
        >
          insights
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: onVariant }}>
          Analyst scorecard
        </span>
      </div>

      {overallNote && (
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: onSurface, margin: 0 }}>{overallNote}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {dimensions.map((d) => (
          <div key={d.key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: onSurface }}>{d.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: barColor(d.score) }}>{SCORE_LABEL[d.score]}</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: track, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${d.score * 100}%`,
                  borderRadius: 999,
                  background: barColor(d.score),
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
