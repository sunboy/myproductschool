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
  ai_spend_usd: number
  ai_spend_cap_usd: number
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
    label: 'AI usage',
    pulse: false,
  },
  notice: {
    barColor: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    label: 'AI usage',
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

  const { severity, pct_consumed, ai_spend_usd, ai_spend_cap_usd, period_resets_at, plan_tier } = data
  const config = SEVERITY_CONFIG[severity]
  const pctDisplay = Math.round(pct_consumed * 100)
  const isCritical = severity === 'critical'
  const isWarn = severity === 'warn'

  const resetDate = period_resets_at
    ? new Date(period_resets_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-label transition-colors ${config.textColor} hover:bg-surface-container`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Progress bar */}
        <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${config.barColor} ${config.pulse ? 'animate-pulse' : ''}`}
            style={{ width: `${pctDisplay}%` }}
          />
        </div>

        <span className={config.textColor}>
          {isCritical ? (
            <span className="font-semibold">{config.label} {pctDisplay}%</span>
          ) : (
            <span>{pctDisplay}%</span>
          )}
        </span>

        {isCritical && (
          <a
            href="/pricing"
            className="ml-1 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700"
            onClick={e => e.stopPropagation()}
          >
            Upgrade
          </a>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-inverse-surface text-inverse-on-surface text-xs rounded-lg px-3 py-2 w-52 shadow-lg">
          <div className="font-semibold mb-1">{config.label}</div>
          <div>${ai_spend_usd.toFixed(2)} of ${ai_spend_cap_usd.toFixed(2)} AI budget used</div>
          {resetDate && (
            <div className="mt-1 opacity-70">Resets {resetDate}</div>
          )}
          {plan_tier === 'free' && (
            <div className="mt-1">
              Challenges: {data.challenges_used}/{data.challenges_cap} &bull; Interviews: {data.interviews_used}/{data.interviews_cap}
            </div>
          )}
          {(isWarn || isCritical) && (
            <div className="mt-1.5 border-t border-inverse-on-surface/20 pt-1.5">
              <a href="/pricing" className="text-green-300 underline">Upgrade for more</a>
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
