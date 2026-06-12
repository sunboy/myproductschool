'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_PLAN_LIMITS, type PublicPlanLimits } from '@/lib/usage/plan-limits-shared'

// Module-level cache: many paywall surfaces can mount in one session; fetch once.
let cached: PublicPlanLimits | null = null
let inflight: Promise<PublicPlanLimits> | null = null

async function fetchPlanLimits(): Promise<PublicPlanLimits> {
  if (cached) return cached
  inflight ??= fetch('/api/billing/limits')
    .then(r => (r.ok ? r.json() : DEFAULT_PLAN_LIMITS))
    .then((limits: PublicPlanLimits) => {
      cached = limits
      return limits
    })
    .catch(() => DEFAULT_PLAN_LIMITS)
  return inflight
}

/**
 * Live plan allowances for user-facing copy ("80 challenge starts each month").
 * Starts from DEFAULT_PLAN_LIMITS and settles to the plan_limits DB values, so
 * limit changes made in /admin/paywall-config show up without a deploy.
 */
export function usePlanLimits(): PublicPlanLimits {
  const [limits, setLimits] = useState<PublicPlanLimits>(cached ?? DEFAULT_PLAN_LIMITS)

  useEffect(() => {
    let active = true
    fetchPlanLimits().then(l => { if (active) setLimits(l) })
    return () => { active = false }
  }, [])

  return limits
}
