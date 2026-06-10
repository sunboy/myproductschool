// Abuse and spend control for the anonymous /job-fit run. Anonymous Sonnet
// calls bypass the per-user budget ledger, so the only thing standing between
// the tool and an unbounded Anthropic bill is this module: a one-run cookie,
// an IP backstop for cookie-clearers, a burst limit, and a global daily cap.

import { createHash } from 'node:crypto'
import type { RateLimitResult } from '@/lib/security/rate-limit'

export const FIT_USED_COOKIE = 'hp_fit_used'

export const PUBLIC_FIT_LIMITS = {
  burst: { limit: 5, windowSec: 60 },
  // Backstop for cleared cookies: 2 runs per IP per 7 days.
  ip: { limit: 2, windowSec: 7 * 24 * 3600 },
  global: {
    limit: (() => {
      const raw = Number(process.env.PUBLIC_FIT_GLOBAL_DAILY_LIMIT)
      return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 500
    })(),
    windowSec: 24 * 3600,
  },
} as const

export type PublicRunDenial = 'free_run_used' | 'rate_limited' | 'capacity'

export interface PublicRunDecision {
  allowed: boolean
  reason: PublicRunDenial | null
}

// Pure so the matrix is unit-testable without env/cookie gymnastics.
export function decidePublicRun(input: {
  hasUsedCookie: boolean
  burstResult: RateLimitResult
  ipResult: RateLimitResult
  globalResult: RateLimitResult
}): PublicRunDecision {
  if (!input.burstResult.allowed) return { allowed: false, reason: 'rate_limited' }
  if (!input.globalResult.allowed) return { allowed: false, reason: 'capacity' }
  if (input.hasUsedCookie || !input.ipResult.allowed) {
    return { allowed: false, reason: 'free_run_used' }
  }
  return { allowed: true, reason: null }
}

export function hashIp(ip: string): string {
  const salt = process.env.PUBLIC_FIT_IP_SALT || 'public-fit-v1'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}
