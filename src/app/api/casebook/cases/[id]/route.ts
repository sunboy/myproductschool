import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth-helpers'
import { withRoute } from '@/lib/api/withRoute'
import { apiError } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppFlag } from '@/lib/config/app-flags'

// cc_cases.id is a TEXT SLUG primary key, never a uuid — see
// project_ids_not_always_uuid. Validate shape only, do not use z.string().uuid().
const CaseIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'invalid case id')

// GET /api/casebook/cases/[id]
//
// Case detail + its published scenes + the caller's own attempts for that
// case. Phase 0 skeleton: no plan_limits enforcement, no LLM calls. Gated on
// the `lab_casebook` app flag — 404s while the flag is off.
export const GET = withRoute(async (
  _req,
  { params }: { params: Promise<{ id: string }> }
) => {
  const flagOn = await getAppFlag('lab_casebook', false)
  if (!flagOn) return apiError(404, 'not_found', 'Not found')

  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  const { id: rawId } = await params
  const parsedId = CaseIdSchema.safeParse(rawId)
  if (!parsedId.success) {
    return apiError(400, 'invalid_case_id', 'Invalid case id')
  }
  const caseId = parsedId.data

  const admin = createAdminClient()

  const caseResult = await admin
    .from('cc_cases')
    .select(
      'id, track_id, title, hook, brief_md, difficulty, est_minutes, warehouse_dataset, objectives, verdict_spec, unlock_lane, unlock_level, is_free, ordinal'
    )
    .eq('id', caseId)
    .eq('is_published', true)
    .maybeSingle()

  if (caseResult.error) {
    return apiError(500, 'case_query_failed', caseResult.error.message)
  }
  if (!caseResult.data) {
    return apiError(404, 'not_found', 'Case not found')
  }

  const [scenesResult, attemptsResult] = await Promise.all([
    admin
      .from('cc_scenes')
      .select('id, case_id, ordinal, title, goal_md, skill_lane, decision_point_id, time_budget_s')
      .eq('case_id', caseId)
      .eq('is_published', true)
      .order('ordinal', { ascending: true }),
    admin
      .from('cc_case_attempts')
      .select('id, case_id, mode, status, verdict, grade, started_at, filed_at, graded_at')
      .eq('case_id', caseId)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
  ])

  if (scenesResult.error) {
    return apiError(500, 'scenes_query_failed', scenesResult.error.message)
  }
  if (attemptsResult.error) {
    return apiError(500, 'attempts_query_failed', attemptsResult.error.message)
  }

  return NextResponse.json({
    case: caseResult.data,
    scenes: scenesResult.data ?? [],
    attempts: attemptsResult.data ?? [],
  })
}, { name: 'casebook.case_detail' })
