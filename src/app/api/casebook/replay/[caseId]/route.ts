import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth-helpers'
import { withRoute } from '@/lib/api/withRoute'
import { apiError } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppFlag } from '@/lib/config/app-flags'
import {
  projectFullReplay,
  projectTeaserReplay,
  type CaseRow,
  type ExpertSessionRow,
} from '@/lib/casebook/replay-projection'

// cc_cases.id is a TEXT SLUG primary key, never a uuid — see
// project_ids_not_always_uuid. Validate shape only, do not use z.string().uuid().
const CaseIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'invalid case id')

// Content allowlist for the public, unauthenticated teaser + the
// flag-bypass in full mode. `lab_casebook` stays false this phase, but the
// Phase 2 exit criterion requires the Walkthrough teaser to load for a
// logged-out visitor, so teaser access is gated on this allowlist instead
// of the flag. A module-level constant, not a DB column — adding a schema
// column for this would be a scope-creeping migration for one launch case.
// Any case id not in this set 404s regardless of auth or flag state.
const TEASER_CASE_IDS = new Set(['tuesday-dip'])

// GET /api/casebook/replay/[caseId]
//
// Serves the expert-session Walkthrough transcript. Two modes:
//   - `?teaser=1`: no auth required, no lab_casebook check. Gated on
//     TEASER_CASE_IDS. Returns a truncated, answer-key-free projection.
//   - default (no query param): requires auth. Bypasses lab_casebook only
//     for TEASER_CASE_IDS (so the watch -> predict flow works this phase
//     for the one launch case); every other case keeps the existing
//     404-while-flag-off behavior.
//
// IMPORTANT: cc_cases.is_published and cc_expert_sessions.is_published are
// FALSE for the Tuesday Dip rows and stay false this phase (publish-case.ts
// has not been run). Do NOT add `.eq('is_published', true)` filters for
// TEASER_CASE_IDS rows — that would make both the teaser and the exit
// criterion serve nothing. The allowlist itself is the gate for this phase;
// is_published becomes the gate once the case is actually published.
export const GET = withRoute(async (
  req,
  { params }: { params: Promise<{ caseId: string }> }
) => {
  const { caseId: rawCaseId } = await params
  const parsedId = CaseIdSchema.safeParse(rawCaseId)
  if (!parsedId.success) {
    return apiError(400, 'invalid_case_id', 'Invalid module id')
  }
  const caseId = parsedId.data

  const url = new URL(req.url)
  const isTeaser = url.searchParams.get('teaser') === '1'
  const isAllowlisted = TEASER_CASE_IDS.has(caseId)

  if (isTeaser) {
    // Public watch-only teaser: no auth, no flag check. Allowlist only.
    if (!isAllowlisted) return apiError(404, 'not_found', 'Module not found')

    const admin = createAdminClient()
    const { caseRow, session, error } = await loadCaseAndSession(admin, caseId)
    if (error) return error
    if (!caseRow || !session) return apiError(404, 'not_found', 'Module not found')

    const body = projectTeaserReplay(caseRow, session)
    const res = NextResponse.json(body)
    // Static public content — safe to cache at the edge/CDN.
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    return res
  }

  // Full mode: requires auth. lab_casebook bypass applies only to
  // allowlisted cases (see comment above); everything else keeps the
  // pre-existing 404-while-flag-off behavior.
  if (!isAllowlisted) {
    const flagOn = await getAppFlag('lab_casebook', false)
    if (!flagOn) return apiError(404, 'not_found', 'Not found')
  }

  const { user, error: authError } = await requireAuth()
  if (authError) return authError
  void user

  const admin = createAdminClient()
  const { caseRow, session, error } = await loadCaseAndSession(admin, caseId)
  if (error) return error
  if (!caseRow || !session) return apiError(404, 'not_found', 'Module not found')

  const body = projectFullReplay(caseRow, session)
  const res = NextResponse.json(body)
  // Per-user-gated content — must never be shared across a public cache.
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}, { name: 'casebook.replay' })

async function loadCaseAndSession(
  admin: ReturnType<typeof createAdminClient>,
  caseId: string
): Promise<
  | { caseRow: CaseRow; session: ExpertSessionRow; error: null }
  | { caseRow: null; session: null; error: null }
  | { caseRow: null; session: null; error: NextResponse }
> {
  const [caseResult, sessionResult] = await Promise.all([
    admin
      .from('cc_cases')
      .select('id, title, hook')
      .eq('id', caseId)
      .maybeSingle(),
    admin
      .from('cc_expert_sessions')
      .select('id, case_id, duration_s, transcript, moves, decision_points')
      .eq('case_id', caseId)
      .maybeSingle(),
  ])

  if (caseResult.error) {
    return { caseRow: null, session: null, error: apiError(500, 'case_query_failed', caseResult.error.message) }
  }
  if (sessionResult.error) {
    return { caseRow: null, session: null, error: apiError(500, 'session_query_failed', sessionResult.error.message) }
  }
  if (!caseResult.data || !sessionResult.data) {
    return { caseRow: null, session: null, error: null }
  }

  return {
    caseRow: caseResult.data as CaseRow,
    session: sessionResult.data as unknown as ExpertSessionRow,
    error: null,
  }
}
