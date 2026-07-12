import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Weakest-FLOW-move derivation, shared between the dashboard server component
 * and GET /api/hatch/pick. One definition so Hatch's page cues, the dashboard
 * hero, and the recommended-challenge query all agree on what "your gap" means.
 */

export const FLOW_MOVES = ['frame', 'list', 'optimize', 'win'] as const
export type FlowMoveName = (typeof FLOW_MOVES)[number]

export interface MoveLevelLite {
  move: string
  xp: number
}

/**
 * Same rule the dashboard has always used: the move with the lowest XP in
 * `move_levels` wins; a user with no graded reps defaults to 'frame'.
 * Sorts defensively so callers don't have to order their query.
 */
export function weakestMoveFrom(moveLevels: readonly MoveLevelLite[] | null | undefined): string {
  if (!moveLevels || moveLevels.length === 0) return 'frame'
  return [...moveLevels].sort((a, b) => a.xp - b.xp)[0]?.move ?? 'frame'
}

export interface HatchPick {
  weakestMove: string
  reason: string
  /** Slug of a published study plan matching the move, or the user's latest enrolled published plan. Null when neither exists. */
  planSlug: string | null
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Cheap, AI-free pick: weakest move from `move_levels` plus a study plan the
 * user can actually open. The 4 move-shell plans (frame-like-a-pm etc.) are
 * unpublished, so the move mapping is checked against `study_plans.move_tag`
 * with a publish gate, then falls back to the user's latest enrollment in a
 * published plan. Callers must treat `planSlug: null` as "no plan CTA".
 */
export async function getHatchPick(userId: string): Promise<HatchPick> {
  const admin = createAdminClient()

  const { data: moveLevels } = await admin
    .from('move_levels')
    .select('move, xp')
    .eq('user_id', userId)
    .order('xp', { ascending: true })

  const rows = (moveLevels ?? []) as MoveLevelLite[]
  const weakestMove = weakestMoveFrom(rows)

  const reason =
    rows.length > 0
      ? `${capitalize(weakestMove)} has the least XP across your graded reps, so it is the move holding your scores back.`
      : `No graded reps yet, so Hatch starts everyone on ${capitalize(weakestMove)}: finding the real problem before touching solutions.`

  // Prefer a published plan tagged with the move (the calibration-era mapping:
  // frame-like-a-pm / the-list-move / optimize-under-pressure / win-the-room,
  // if any of them is ever re-published), then the user's own latest enrollment.
  const { data: movePlan } = await admin
    .from('study_plans')
    .select('slug')
    .eq('move_tag', weakestMove)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()

  let planSlug: string | null = (movePlan as { slug: string } | null)?.slug ?? null

  if (!planSlug) {
    // Most recent enrollments first; the newest may point at a retired
    // (unpublished) plan, so scan a handful and take the first openable one.
    const { data: enrollments } = await admin
      .from('user_study_plan_enrollments')
      .select('study_plans(slug, is_published)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(5)

    const rowsList = (enrollments ?? []) as unknown as { study_plans: { slug: string; is_published: boolean } | null }[]
    planSlug = rowsList.find(r => r.study_plans?.is_published && r.study_plans.slug)?.study_plans?.slug ?? null
  }

  return { weakestMove, reason, planSlug }
}
