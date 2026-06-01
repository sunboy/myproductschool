'use client'

// UsageContext is now a thin compatibility layer over SessionContext.
// Usage data is fetched once per session via /api/profile (see SessionProvider)
// instead of a separate /api/usage/me request on every app mount. The public
// API (useUsage / useIsAtLimit / UsageData / FeatureUsage) is unchanged so
// existing consumers keep working without edits.

import { type ReactNode } from 'react'
import { useSession, type UsageData, type FeatureUsage } from '@/context/SessionContext'

export type { UsageData, FeatureUsage }

// Passthrough kept for backward compatibility. Usage now lives in SessionProvider
// (mounted once in (app)/layout.tsx), so this no longer fetches or owns state —
// it simply renders children. Nested instances are harmless no-ops.
export function UsageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useUsage(): UsageData {
  return useSession().usage
}

export function useIsAtLimit(feature: keyof UsageData): boolean {
  const usage = useUsage()
  return usage[feature].used >= usage[feature].limit
}
