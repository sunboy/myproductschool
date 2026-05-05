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
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[#edf5e9] p-4 shadow-[0_18px_46px_-38px_rgba(38,74,52,0.78)]">
      <svg className="pointer-events-none absolute inset-y-0 right-0 h-full w-44 opacity-[0.16]" viewBox="0 0 220 150" fill="none" aria-hidden="true">
        <path d="M40 112 C74 52, 116 126, 176 42" stroke="#4a7c59" strokeWidth="7" strokeLinecap="round" />
        <path d="M114 34 H184 V102" stroke="#2e3230" strokeWidth="1.5" strokeDasharray="5 8" />
        <circle cx="176" cy="42" r="24" fill="#4a7c59" opacity="0.25" />
        <rect x="126" y="84" width="46" height="42" rx="14" fill="#c9933a" opacity="0.22" />
      </svg>

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-8 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_10px_20px_-14px_rgba(74,124,89,0.95)]" />
          <h3 className="truncate font-headline text-[17px] font-semibold leading-tight text-on-surface">
            Latest interview
          </h3>
        </div>
        <Link
          href={`/live-interviews/${data.sessionId}/debrief`}
          className="flex shrink-0 items-center gap-1 rounded-md bg-white/55 px-2 py-1 text-[11px] font-label font-bold text-primary ring-1 ring-primary/10 transition-colors hover:bg-white"
        >
          Debrief
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </Link>
      </div>

      <div className="relative mt-3 grid gap-3 sm:grid-cols-[8.5rem_1fr]">
        <div className="rounded-xl bg-[#203b2b] px-3 py-2.5 text-[#f7f1e6] shadow-[0_16px_30px_-22px_rgba(20,48,32,0.95)]">
          <div className="flex items-baseline gap-1.5">
            <span className="font-headline text-[32px] font-semibold leading-none tabular-nums">
              {scoreDisplay}
            </span>
            <span className="font-label text-xs font-bold text-[#f7f1e6]/62">
              / {FLOW_MAX_SCORE}
            </span>
          </div>
          {data.grade && (
            <span
              className="mt-2 inline-flex rounded-md px-2 py-0.5 font-label text-[11px] font-extrabold"
              style={{ background: colors.bg, color: colors.text }}
            >
              {data.grade}
            </span>
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <div className="min-w-0 rounded-xl bg-white/50 px-3 py-2 ring-1 ring-primary/10">
            {data.companyName && (
              <div className="font-label text-[12px] font-extrabold leading-tight text-on-surface">
                {data.companyName}
              </div>
            )}
            {data.scenarioTitle && (
              <div className="mt-0.5 truncate font-label text-[11px] font-semibold leading-tight text-on-surface-variant">
                {data.scenarioTitle}
              </div>
            )}
          </div>

          {(data.topStrength || data.topGrowth) && (
            <div className="grid gap-1.5">
              {data.topStrength && (
                <div className="grid grid-cols-[3px_1fr] gap-2 rounded-lg bg-white/40 px-2.5 py-1.5">
                  <span className="mt-1 h-4 rounded-full bg-primary" />
                  <p className="line-clamp-2 font-body text-[12px] font-semibold leading-snug text-on-surface">{data.topStrength}</p>
                </div>
              )}
              {data.topGrowth && (
                <div className="grid grid-cols-[3px_1fr] gap-2 rounded-lg bg-[#f5e2bc]/60 px-2.5 py-1.5">
                  <span className="mt-1 h-4 rounded-full bg-tertiary" />
                  <p className="line-clamp-2 font-body text-[12px] font-semibold leading-snug text-on-surface-variant">{data.topGrowth}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
