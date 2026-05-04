'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

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

const DEFAULT_USAGE: UsageData = {
  challenges: { used: 0, limit: 3, windowDays: 30, unit: 'count' },
  interviews:  { used: 0, limit: 1, windowDays: 30, unit: 'count' },
  hatchAiCents: { used: 0, limit: 35, windowDays: 30, unit: 'cents' },
}

const UsageContext = createContext<UsageData>(DEFAULT_USAGE)

export function UsageProvider({ children }: { children: ReactNode }) {
  const [usage, setUsage] = useState<UsageData>(DEFAULT_USAGE)

  useEffect(() => {
    fetch('/api/usage/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUsage(data) })
      .catch(() => {/* silent — defaults are safe */})
  }, [])

  return <UsageContext.Provider value={usage}>{children}</UsageContext.Provider>
}

export function useUsage(): UsageData {
  return useContext(UsageContext)
}

export function useIsAtLimit(feature: keyof UsageData): boolean {
  const usage = useUsage()
  return usage[feature].used >= usage[feature].limit
}
