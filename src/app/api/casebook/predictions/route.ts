import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth-helpers'
import { withRoute } from '@/lib/api/withRoute'
import { apiError } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppFlag } from '@/lib/config/app-flags'
import type { DecisionPoint, DecisionPointOption, ExpertSessionRow } from '@/lib/casebook/replay-projection'

// cc_cases.id / decision_point.id / option.id are TEXT SLUGS, never uuids —
// see project_ids_not_always_uuid. Validate shape only, do not use
// z.string().uuid().
const SlugSchema = z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'invalid id')

const PredictionBodySchema = z.object({
  caseId: SlugSchema,
  checkpointId: SlugSchema,
  optionId: SlugSchema,
})

// Same allowlist approach as the replay route
// (src/app/api/casebook/replay/[caseId]/route.ts): `lab_casebook` stays
// false this phase, but the launch case needs the full watch -> predict
// flow working, so allowlisted cases bypass the flag. Duplicated here as a
// 1-line module-level constant rather than imported from the replay route
// — the replay route owns its own constant and the two routes should not
// couple on it. Any case id outside this set 404s while the flag is off.
const PREDICTABLE_CASE_IDS = new Set(['tuesday-dip'])

function projectOptionReveal(option: DecisionPointOption) {
  return {
    id: option.id,
    text: option.text,
    quality: option.quality,
    explanation: option.explanation,
  }
}

// POST /api/casebook/predictions
//
// The reveal gate for the Checkpoint prediction mechanic. A player commits
// a choice at a decision point; only after that write is persisted does the
// response include the answer-key data (quality, explanation, whether the
// choice matched the expert's). The replay route deliberately strips this
// data from every payload it serves (see replay-projection.ts) — this route
// is the ONLY place it is ever released, and only for the option the player
// actually chose plus the expert's own option. It never returns the full
// option set for a checkpoint.
//
// Re-predicting the same checkpoint (same user_id + decision_point_id)
// upserts: the new option_id, quality, and matched_expert overwrite the
// prior row. There is exactly one row per (user, checkpoint) at all times.
export const POST = withRoute(async (req) => {
  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  const json = await req.json().catch(() => null)
  const parsedBody = PredictionBodySchema.safeParse(json)
  if (!parsedBody.success) {
    return apiError(400, 'invalid_body', 'Invalid prediction payload', parsedBody.error.flatten())
  }
  const { caseId, checkpointId, optionId } = parsedBody.data

  const isAllowlisted = PREDICTABLE_CASE_IDS.has(caseId)
  if (!isAllowlisted) {
    const flagOn = await getAppFlag('lab_casebook', false)
    if (!flagOn) return apiError(404, 'not_found', 'Module not found')
  }

  const admin = createAdminClient()

  const sessionResult = await admin
    .from('cc_expert_sessions')
    .select('id, case_id, duration_s, transcript, moves, decision_points')
    .eq('case_id', caseId)
    .maybeSingle()

  if (sessionResult.error) {
    return apiError(500, 'session_query_failed', sessionResult.error.message)
  }
  const session = sessionResult.data as unknown as ExpertSessionRow | null
  if (!session) {
    return apiError(404, 'not_found', 'Module not found')
  }

  const decisionPoint = session.decision_points.find(
    (dp): dp is DecisionPoint => dp.id === checkpointId
  )
  if (!decisionPoint) {
    return apiError(404, 'not_found', 'Checkpoint not found')
  }

  const chosenOption = decisionPoint.options.find((opt) => opt.id === optionId)
  if (!chosenOption) {
    return apiError(404, 'not_found', 'Option not found')
  }

  const expertOption = decisionPoint.options.find(
    (opt) => opt.id === decisionPoint.expert_option_id
  )
  if (!expertOption) {
    // Data integrity issue in the expert session content, not a client error.
    return apiError(500, 'expert_option_missing', 'Expert option not found for checkpoint')
  }

  // Server-side truth only — quality and the match verdict are derived from
  // the DB row, never from anything the client sent.
  const matchedExpert = chosenOption.id === decisionPoint.expert_option_id

  const upsertResult = await admin
    .from('cc_predictions')
    .upsert(
      {
        user_id: user.id,
        decision_point_id: decisionPoint.id,
        case_id: caseId,
        option_id: chosenOption.id,
        quality: chosenOption.quality,
        matched_expert: matchedExpert,
      },
      { onConflict: 'user_id,decision_point_id' }
    )

  if (upsertResult.error) {
    return apiError(500, 'prediction_write_failed', upsertResult.error.message)
  }

  const res = NextResponse.json({
    matched_expert: matchedExpert,
    question: decisionPoint.question,
    your_option: projectOptionReveal(chosenOption),
    expert_option: projectOptionReveal(expertOption),
  })
  // Per-user reveal of answer-key data — must never be shared across a
  // public cache.
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}, { name: 'casebook.predictions' })
