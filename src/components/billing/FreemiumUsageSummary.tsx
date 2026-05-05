'use client'

import { useUsage } from '@/context/UsageContext'

interface FreemiumUsageSummaryProps {
  plan?: string | null
  compact?: boolean
  className?: string
}

function remaining(used: number, limit: number) {
  return Math.max(limit - used, 0)
}

function Meter({
  icon,
  label,
  used,
  limit,
  compact,
}: {
  icon: string
  label: string
  used: number
  limit: number
  compact?: boolean
}) {
  const left = remaining(used, limit)
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0

  return (
    <div className={compact ? 'min-w-[124px]' : 'min-w-0 flex-1'}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-label font-bold text-on-surface">
          <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 text-[11px] font-label font-bold text-on-surface-variant">
          {left}/{limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function FreemiumUsageSummary({ plan, compact = false, className = '' }: FreemiumUsageSummaryProps) {
  const usage = useUsage()

  if (plan !== 'free') return null

  return (
    <div className={`rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">
          Free reps left
        </span>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-label font-bold text-on-primary"
        >
          Upgrade
          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
        </button>
      </div>
      <div className={compact ? 'flex gap-3' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
        <Meter
          icon="track_changes"
          label="Challenges"
          used={usage.challenges.used}
          limit={usage.challenges.limit}
          compact={compact}
        />
        <Meter
          icon="graphic_eq"
          label="Interviews"
          used={usage.interviews.used}
          limit={usage.interviews.limit}
          compact={compact}
        />
      </div>
    </div>
  )
}
