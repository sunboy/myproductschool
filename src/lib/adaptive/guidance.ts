// Guidance level: the single derived signal that drives every adaptive
// surface effect (arc shape, prompt density, teaching notes, nudge eagerness,
// coach register). Pre-session derivation lives here; the bounded in-session
// state machine is client-side (see design §3.2).
// Design: docs/superpowers/specs/2026-07-04-adaptive-workspaces-design.md.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  archetypePriorLevel,
  deriveLevelFromCompetencies,
  type OverallLevel,
} from '@/lib/adaptive/confidence'

export type GuidanceLevel = 'scaffolded' | 'guided' | 'open'

export interface GuidanceInputs {
  level: OverallLevel
  totalEvidence: number
  priorCcSessions: number
}

/**
 * Pre-session guidance derivation.
 * - scaffolded: Beginner, or nearly no evidence anywhere.
 * - open: Advanced/Expert with real evidence AND at least one prior CC
 *   session — expertise in the platform does not imply fluency in this
 *   medium, so the first analytics session is never `open`.
 * - guided: everyone else (and the compatibility default everywhere).
 */
export function deriveGuidanceLevel(inputs: GuidanceInputs): GuidanceLevel {
  const { level, totalEvidence, priorCcSessions } = inputs
  if (level === 'Beginner' || totalEvidence < 3) return 'scaffolded'
  if ((level === 'Advanced' || level === 'Expert') && priorCcSessions >= 1) return 'open'
  return 'guided'
}

/**
 * Lightweight loader for `session/start` — deliberately NOT getHatchContext,
 * which fans out to ~12 queries; this route is thin by design (Vercel 60s
 * provisioning split). Three narrow reads, all failure-tolerant.
 */
export async function loadGuidanceInputs(
  admin: SupabaseClient,
  userId: string,
): Promise<GuidanceInputs> {
  const [competenciesRes, profileRes, ccSessionsRes] = await Promise.all([
    admin
      .from('learner_competencies')
      .select('score, total_attempts')
      .eq('user_id', userId)
      .then(({ data }) => data ?? [], () => []),
    admin
      .from('profiles')
      .select('archetype')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => data, () => null),
    admin
      .from('claude_code_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'terminated')
      .then((res) => res.count ?? 0, () => 0),
  ])

  const rows = (competenciesRes as Array<{ score: number; total_attempts: number | null }>).map(
    (r) => ({ score: r.score, total_attempts: r.total_attempts ?? 0 }),
  )
  const prior = archetypePriorLevel((profileRes as { archetype?: string | null } | null)?.archetype)
  return {
    level: deriveLevelFromCompetencies(rows, prior),
    totalEvidence: rows.reduce((sum, r) => sum + r.total_attempts, 0),
    priorCcSessions: ccSessionsRes as number,
  }
}
