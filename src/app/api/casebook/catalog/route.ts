import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth-helpers'
import { withRoute } from '@/lib/api/withRoute'
import { apiError } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppFlag } from '@/lib/config/app-flags'

// GET /api/casebook/catalog
//
// Returns the published Casebook catalog (tracks + slim case cards) plus the
// caller's own progress summary. Phase 0 skeleton: no plan_limits enforcement,
// no LLM calls. Gated on the `lab_casebook` app flag — the route 404s while
// the flag is off so the feature stays fully invisible until launch, matching
// the lab_debugging precedent in src/lib/labs/server.ts.
export const GET = withRoute(async () => {
  const flagOn = await getAppFlag('lab_casebook', false)
  if (!flagOn) return apiError(404, 'not_found', 'Not found')

  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  const admin = createAdminClient()

  const [tracksResult, casesResult, caseAttemptsResult, laneProgressResult] = await Promise.all([
    admin
      .from('cc_tracks')
      .select('id, title, outcome_copy, ordinal')
      .eq('is_published', true)
      .order('ordinal', { ascending: true }),
    // Slim case cards only — never select the big jsonb columns
    // (objectives, verdict_spec, brief_md). See project_practice_payload_bloat.
    admin
      .from('cc_cases')
      .select('id, track_id, title, hook, difficulty, est_minutes, is_free, ordinal')
      .eq('is_published', true)
      .order('ordinal', { ascending: true }),
    admin
      .from('cc_case_attempts')
      .select('id, case_id, mode, status, verdict, grade, started_at, filed_at, graded_at')
      .eq('user_id', user.id),
    admin
      .from('cc_user_lane_progress')
      .select('lane_key, clean_scenes, total_scenes_attempted, level, updated_at')
      .eq('user_id', user.id),
  ])

  if (tracksResult.error) {
    return apiError(500, 'tracks_query_failed', tracksResult.error.message)
  }
  if (casesResult.error) {
    return apiError(500, 'cases_query_failed', casesResult.error.message)
  }
  if (caseAttemptsResult.error) {
    return apiError(500, 'case_attempts_query_failed', caseAttemptsResult.error.message)
  }
  if (laneProgressResult.error) {
    return apiError(500, 'lane_progress_query_failed', laneProgressResult.error.message)
  }

  return NextResponse.json({
    tracks: tracksResult.data ?? [],
    cases: casesResult.data ?? [],
    progress: {
      case_attempts: caseAttemptsResult.data ?? [],
      lane_progress: laneProgressResult.data ?? [],
    },
  })
}, { name: 'casebook.catalog' })
