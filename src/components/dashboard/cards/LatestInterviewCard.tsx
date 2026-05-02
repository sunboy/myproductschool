import Link from 'next/link'
import type { LatestInterviewSummary } from '@/lib/data/dashboard'
import { FLOW_MAX_SCORE } from '@/lib/scoring/flow-scale'

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  Outstanding: { bg: '#cfe3d3', text: '#0f3d1f' },
  Strong: { bg: '#dfe7e1', text: '#1f4a2a' },
  Developing: { bg: '#f3e2b9', text: '#5a3e0f' },
  'Needs Practice': { bg: '#f5d6cf', text: '#5a1a10' },
}

interface LatestInterviewCardProps {
  data: LatestInterviewSummary
}

export function LatestInterviewCard({ data }: LatestInterviewCardProps) {
  const colors = GRADE_COLORS[data.grade] ?? GRADE_COLORS['Strong']
  const scoreDisplay = data.overallScore.toFixed(1)

  return (
    <div className="rounded-2xl p-6 bg-surface border border-outline-variant/30 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-headline text-xl font-medium tracking-tight">Latest interview</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {data.companyName && (
              <span className="rounded-full px-2.5 py-0.5 font-label text-xs font-semibold bg-primary-container text-on-primary-container">
                {data.companyName}
              </span>
            )}
            {data.scenarioTitle && (
              <span className="font-label text-xs text-on-surface-variant truncate">
                {data.scenarioTitle}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/live-interviews/${data.sessionId}/debrief`}
          className="flex items-center gap-1 text-xs font-label font-bold uppercase tracking-wider text-primary shrink-0"
        >
          Debrief{' '}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>

      {/* Score hero */}
      <div className="flex items-end gap-3">
        <div className="font-headline text-5xl font-semibold tracking-tight leading-none text-on-surface">
          {scoreDisplay}
        </div>
        <div className="font-label text-sm text-on-surface-variant pb-1">
          / {FLOW_MAX_SCORE}
        </div>
        {data.grade && (
          <span
            className="ml-auto rounded-full px-3 py-1 font-label text-xs font-bold mb-1"
            style={{ background: colors.bg, color: colors.text }}
          >
            {data.grade}
          </span>
        )}
      </div>

      {/* Strength + growth */}
      {(data.topStrength || data.topGrowth) && (
        <div className="flex flex-col gap-2 pt-1">
          {data.topStrength && (
            <div className="flex items-start gap-2">
              <span
                className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                trending_up
              </span>
              <p className="font-body text-sm text-on-surface leading-snug">{data.topStrength}</p>
            </div>
          )}
          {data.topGrowth && (
            <div className="flex items-start gap-2">
              <span
                className="material-symbols-outlined text-tertiary text-[18px] mt-0.5 shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lightbulb
              </span>
              <p className="font-body text-sm text-on-surface-variant leading-snug">{data.topGrowth}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
