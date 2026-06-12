// Shared types + fallback values for user-facing plan allowances.
// Deliberately has NO server imports so 'use client' components can import it
// without dragging the Supabase admin client into the browser bundle. The
// server-side loader lives in ./public-limits.ts.

export interface PlanLimitNumbers {
  challenges: number
  interviews: number
}

export interface PublicPlanLimits {
  free: PlanLimitNumbers
  pro: PlanLimitNumbers
}

// Fallback when the DB is unreachable (and the client hook's initial state).
// Keep in loose sync with plan_limits; drift here only shows during outages.
export const DEFAULT_PLAN_LIMITS: PublicPlanLimits = {
  free: { challenges: 20, interviews: 5 },
  pro: { challenges: 80, interviews: 12 },
}
