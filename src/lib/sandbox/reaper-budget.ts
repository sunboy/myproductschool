/** All phase deadlines are measured from request entry, never reset per loop. */
export const REAPER_PHASE_END_MS = { sessions: 20_000, orphans: 40_000, response: 55_000 } as const

export function reaperRemainingMs(startedAt: number, phase: keyof typeof REAPER_PHASE_END_MS, now = Date.now()): number {
  return Math.max(0, REAPER_PHASE_END_MS[phase] - (now - startedAt))
}
