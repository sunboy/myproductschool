'use client'

import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { usageEventBus } from '@/lib/usage/event-bus'

interface FreemiumUsageSummaryProps {
  plan?: string | null
  compact?: boolean
  className?: string
}

interface UsageApiData {
  challenges: { used: number; limit: number }
  interviews: { used: number; limit: number }
  hatchAiCents: { used: number; limit: number }
  pct_consumed: number
  period_resets_at: string | null
  severity: 'calm' | 'notice' | 'warn' | 'critical'
  challenges_used: number
  challenges_cap: number
  interviews_used: number
  interviews_cap: number
  plan_tier: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

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

const SEVERITY_CONFIG = {
  calm: {
    barColor: 'bg-green-500',
    textColor: 'text-green-700',
    label: 'Free reps',
    pulse: false,
  },
  notice: {
    barColor: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    label: 'Free reps',
    pulse: false,
  },
  warn: {
    barColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    label: 'Nearing limit',
    pulse: true,
  },
  critical: {
    barColor: 'bg-red-500',
    textColor: 'text-red-600',
    label: 'Near cap',
    pulse: true,
  },
}

// Compact spend pill for TopNav — shown inline in the right cluster
export function SpendIndicator() {
  const { data, mutate } = useSWR<UsageApiData>('/api/usage/me', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    return usageEventBus.subscribe(() => { mutate() })
  }, [mutate])

  if (!data || !data.severity) return null

  const { severity, period_resets_at, challenges_used, challenges_cap, interviews_used, interviews_cap } = data
  const config = SEVERITY_CONFIG[severity]
  const isCritical = severity === 'critical'
  const isWarn = severity === 'warn'

  const fillPct = (used: number, cap: number) => (cap > 0 ? Math.min((used / cap) * 100, 100) : 0)
  const challPct = fillPct(challenges_used, challenges_cap)
  const intPct = fillPct(interviews_used, interviews_cap)

  const resetDate = period_resets_at
    ? new Date(period_resets_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  const openUpgrade = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('open-upgrade-modal'))
  }

  // Each bar turns red once that rep type is fully spent; otherwise primary green.
  const barColor = (atCap: boolean) =>
    `${atCap ? 'bg-red-500' : 'bg-primary'} ${atCap && config.pulse ? 'animate-pulse' : ''}`

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-label transition-colors ${config.textColor} hover:bg-surface-container`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Two rep bars: challenges + interviews */}
        <div className="flex flex-col gap-0.5">
          <div className="w-14 h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor(challenges_used >= challenges_cap)}`}
              style={{ width: `${challPct}%` }}
            />
          </div>
          <div className="w-14 h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor(interviews_used >= interviews_cap)}`}
              style={{ width: `${intPct}%` }}
            />
          </div>
        </div>

        {(isWarn || isCritical) && (
          <span className={`font-semibold ${config.textColor}`}>{config.label}</span>
        )}

        {isCritical && (
          <span
            role="button"
            tabIndex={0}
            className="ml-0.5 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 cursor-pointer"
            onClick={openUpgrade}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openUpgrade(e as unknown as React.MouseEvent) }}
          >
            Upgrade
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-inverse-surface text-inverse-on-surface text-xs rounded-lg px-3 py-2 w-52 shadow-lg">
          <div className="font-semibold mb-1">{config.label}</div>
          <div>Challenges {challenges_used}/{challenges_cap}</div>
          <div>Interviews {interviews_used}/{interviews_cap}</div>
          {resetDate && (
            <div className="mt-1 opacity-70">Resets {resetDate}</div>
          )}
          {(isWarn || isCritical) && (
            <div className="mt-1.5 border-t border-inverse-on-surface/20 pt-1.5">
              <button type="button" onClick={openUpgrade} className="text-green-300 underline">Upgrade for more</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Full usage summary card for dropdown menu
export function FreemiumUsageSummary({ plan, compact = false, className = '' }: FreemiumUsageSummaryProps) {
  const { data, mutate } = useSWR<UsageApiData>('/api/usage/me', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })

  useEffect(() => {
    return usageEventBus.subscribe(() => { mutate() })
  }, [mutate])

  if (plan !== 'free') return null
  if (!data) return null

  return (
    <div className={`rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 ${className}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-label font-extrabold uppercase tracking-[0.12em] text-on-surface-variant">
          Free reps left
        </span>
      </div>
      <div className={compact ? 'flex gap-3' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
        <Meter
          icon="track_changes"
          label="Challenges"
          used={data.challenges.used}
          limit={data.challenges.limit}
          compact={compact}
        />
        <Meter
          icon="graphic_eq"
          label="Interviews"
          used={data.interviews.used}
          limit={data.interviews.limit}
          compact={compact}
        />
      </div>
    </div>
  )
}
