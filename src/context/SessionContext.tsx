'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { identifyUser } from '@/lib/posthog/client'
import { isInternalUser } from '@/lib/posthog/internal'

// Session-scoped profile + usage, fetched ONCE per session from /api/profile
// (which already returns profile fields, subscription, dunning, and usage).
// Replaces the previous pattern where TopNav refetched /api/profile on every
// navigation and UsageProvider fetched /api/usage/me separately on mount.
//
// The single source of truth refreshes only when something actually changes:
// the `challenge-completed` / `profile-stats-updated` window events, or an
// explicit refresh() call. There is intentionally no pathname dependency.

export interface SessionProfile {
  id: string
  streak_days: number
  xp_total: number
  display_name: string | null
  avatar_url: string | null
  plan: string | null
  onboarding_completed_at: string | null
  has_seen_hatch_intro: boolean
  daily_attempts_today?: number
  subscription?: {
    status?: string | null
    current_period_end?: string | null
    billing_interval?: string | null
    cancel_at_period_end?: boolean | null
  } | null
  dunning?: {
    state: string
    shouldShowBanner: boolean
    bannerMessage: string | null
    gracePeriodEndsAt: string | null
  } | null
}

export interface FeatureUsage {
  used: number
  limit: number
  windowDays: number
  unit?: 'count' | 'cents'
}

export interface UsageData {
  challenges: FeatureUsage
  interviews: FeatureUsage
  hatchAiCents: FeatureUsage
}

export const DEFAULT_USAGE: UsageData = {
  challenges: { used: 0, limit: 20, windowDays: 30, unit: 'count' },
  interviews: { used: 0, limit: 5, windowDays: 30, unit: 'count' },
  hatchAiCents: { used: 0, limit: 35, windowDays: 30, unit: 'cents' },
}

interface SessionContextValue {
  profile: SessionProfile | null
  usage: UsageData
  userId: string | null
  loading: boolean
  refresh: () => void
}

const SessionContext = createContext<SessionContextValue>({
  profile: null,
  usage: DEFAULT_USAGE,
  userId: null,
  loading: true,
  refresh: () => {},
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SessionProfile | null>(null)
  const [usage, setUsage] = useState<UsageData>(DEFAULT_USAGE)
  const [loading, setLoading] = useState(true)
  // Guard against overlapping in-flight fetches (e.g. event fires mid-load).
  const inFlight = useRef(false)

  const refresh = useCallback(() => {
    if (inFlight.current) return
    inFlight.current = true
    fetch('/api/profile')
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.ok ? r.json() : null
      })
      .then(data => {
        if (data) {
          // Tie PostHog events (client + server) to this user. No-ops until the
          // user has consented and PostHog has initialized. is_internal flags
          // the team's own accounts (sandeeptnvs@gmail.com + all @hackproduct.com,
          // including e2e/paywall-audit/test seeds) so insights can filter them out.
          if (data.id) {
            identifyUser(data.id, { plan: data.plan ?? null, is_internal: isInternalUser(data.email) })
          }
          setProfile({
            id: data.id,
            streak_days: data.streak_days ?? 0,
            xp_total: data.xp_total ?? 0,
            display_name: data.display_name ?? null,
            avatar_url: data.avatar_url ?? null,
            plan: data.plan ?? null,
            onboarding_completed_at: data.onboarding_completed_at ?? null,
            has_seen_hatch_intro: data.has_seen_hatch_intro ?? false,
            daily_attempts_today: data.daily_attempts_today ?? 0,
            subscription: data.subscription ?? null,
            dunning: data.dunning ?? null,
          })
          if (data.usage) {
            setUsage({
              challenges: data.usage.challenges ?? DEFAULT_USAGE.challenges,
              interviews: data.usage.interviews ?? DEFAULT_USAGE.interviews,
              hatchAiCents: data.usage.hatchAiCents ?? DEFAULT_USAGE.hatchAiCents,
            })
          }
        }
      })
      .catch(() => {/* silent — defaults are safe */})
      .finally(() => {
        inFlight.current = false
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    refresh()

    const handleRefresh = () => refresh()
    window.addEventListener('challenge-completed', handleRefresh)
    window.addEventListener('profile-stats-updated', handleRefresh)
    return () => {
      window.removeEventListener('challenge-completed', handleRefresh)
      window.removeEventListener('profile-stats-updated', handleRefresh)
    }
  }, [refresh])

  return (
    <SessionContext.Provider value={{ profile, usage, userId: profile?.id ?? null, loading, refresh }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext)
}
