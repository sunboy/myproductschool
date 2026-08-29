import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth-helpers'
import { withRoute } from '@/lib/api/withRoute'
import { apiError } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppFlag } from '@/lib/config/app-flags'
import { getLabServer, labIdForChallengeType } from '@/lib/labs/server'
import { provisionSession } from '@/lib/sandbox/provision-session'
import { getEffectiveUserPlan } from '@/lib/billing/entitlements'
import { checkUsageLimit, recordUsageEvent } from '@/lib/usage/check-limit'

export const dynamic = 'force-dynamic'
// Practice's provisioning must fit Vercel Hobby's 60s function ceiling. Unlike
// the analytics case-session flow (session/start + session/[id]/provision split
// across two calls because a cold start can exceed 60s), Practice scenes are
// short (10-minute hard wall, see DRILL_TTL_SECONDS in provision-session.ts) and
// this task's scope is a single route — so provisionSession runs inline here.
// A cold SQL wake could still be slow; provisionSession's own timeouts
// (SQL_WAKE_MS etc.) already fail closed well inside 60s.
export const maxDuration = 60

// cc_cases.id / cc_scenes.id are TEXT SLUGS, never uuids — see
// project_ids_not_always_uuid. Validate shape only, do not use z.string().uuid().
const SlugSchema = z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'invalid id')

const BodySchema = z.object({
  caseId: SlugSchema,
  sceneId: SlugSchema,
})

// Same allowlist approach as the Phase 2 replay/predictions routes
// (src/app/api/casebook/replay/[caseId]/route.ts,
// src/app/api/casebook/predictions/route.ts): `lab_casebook` stays false this
// phase, but the launch case needs Practice working end to end, so allowlisted
// case ids bypass the flag. Duplicated here as a 1-line module-level constant
// rather than imported from those routes — each route owns its own constant.
const PRACTICE_CASE_IDS = new Set(['tuesday-dip'])

interface SceneRow {
  id: string
  case_id: string
  title: string
  goal_md: string
  skill_lane: string
  preload: { context_md?: string; seed_transcript?: unknown[]; visible_tables?: string[] }
  time_budget_s: number
  rubric: {
    required_moves?: Array<{ id: string; label: string; detector?: unknown }>
    bonus_moves?: unknown[]
    fail_conditions?: unknown[]
  }
}

// POST /api/casebook/practice/start
//
// Starts a Practice attempt on one scene (internal: a "drill" cut from a
// case's expert-session decision points). Creates the cc_scene_attempts row
// so progress is tracked, plus a fresh challenge_attempts row so a future
// provisioning call has somewhere to hang claude_code_sessions off of, then
// hands back what the practice workspace needs to mount a sandbox session.
//
// SHIM BOUNDARY: the settled architecture (Phase 3) gives every practice
// scene an unpublished `challenges` row whose id equals the scene id (e.g.
// 'tuesday-dip-s1', challenge_type='claude_code_analytics'). cc_scenes is the
// SOLE content authority for a practice scene — the challenges shim row
// exists ONLY to satisfy claude_code_sessions' NOT NULL challenge_id/
// attempt_id FKs (see supabase/migrations/20260507120000_claude_code_analytics.sql)
// and carries no content of its own. The orchestrator seeds these shim rows;
// this route does not, and never writes to `challenges`. Until a shim row
// exists for a given scene id, the challenge_attempts insert below fails its
// FK and this route returns a clean error — that is expected, not a bug, for
// any scene the orchestrator hasn't seeded yet.
//
// RETRY SEMANTICS — each practice start MINTS A NEW challenge_attempts row,
// it does NOT find-or-create like session/start/route.ts:164-196 does for
// case sessions. Why: claude_code_sessions has UNIQUE (attempt_id). If we
// reused an existing in_progress challenge_attempts row, a retry would
// reconnect to THAT row's existing claude_code_sessions session — which may
// already be budget-dead (Phase 1 documented exactly this trap: a second
// session for the same user reconnected to the same budget-dead session
// instead of minting a fresh key). Under practice retries that trap becomes
// user-facing on the very next attempt. So: any prior in_progress
// challenge_attempts row for this user+scene-shim is marked 'abandoned' (the
// existing terminal status this codebase already uses for superseded/stale
// attempts — see src/app/api/cron/reap-stale-sessions/route.ts) BEFORE a
// fresh row is inserted. Do not "optimize" this back to find-or-create.
//
// Provisioning: after the attempt rows are settled, this route creates a
// `claude_code_sessions` row (status='provisioning', attempt_id = the fresh
// challenge_attempts row above) and calls provisionSession(...,
// sessionKind: 'drill') inline (see maxDuration comment above for why this is
// one call, not the two-route split analytics case sessions use). A failed
// provision does NOT fail this route or the attempt bookkeeping already
// committed — the response still returns 200 with `session: null` (or
// `session_error` set) and the client treats a missing `session` block as
// "not provisioned yet," same contract as before this task. Never let a raw
// provider/gateway error string reach the client; provisionSession already
// returns a clean, mapped `error` string for every failure branch.
//
// Practice sessions run read-only against the shared warehouse this phase —
// no scratch-dataset write path exists (deferred to Phase 4: it needs a
// server-only BigQuery identity distinct from the one already injected into
// every sandbox container, which does not exist yet).
export const POST = withRoute(async (req: NextRequest) => {
  const json = await req.json().catch(() => null)
  const parsedBody = BodySchema.safeParse(json)
  if (!parsedBody.success) {
    return apiError(400, 'invalid_body', 'Invalid practice request', parsedBody.error.flatten())
  }
  const { caseId, sceneId } = parsedBody.data

  const isAllowlisted = PRACTICE_CASE_IDS.has(caseId)
  if (!isAllowlisted) {
    const flagOn = await getAppFlag('lab_casebook', false)
    if (!flagOn) return apiError(404, 'not_found', 'Not found')
  }

  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  const admin = createAdminClient()

  // --- Usage gate (practice session cap) ---
  // Runs before any attempt bookkeeping or sandbox provisioning below, so a
  // refused user never costs a real Cloud Run boot or LLM spend. Composes
  // with (does not replace) the analytics session cap session/start enforces
  // on 'claude_code_sessions' — this route uses a distinct feature key
  // ('cc_drill_sessions_weekly') because Practice sessions are metered
  // separately (free = 3/7d vs. claude_code_sessions' 1/30d trial). Admins
  // are not exempted here (unlike session/start) since Practice has no
  // separate lab-flag admin bypass to mirror.
  const { plan: userPlan } = await getEffectiveUserPlan(admin, user.id)
  const usageResult = await checkUsageLimit(user.id, 'cc_drill_sessions_weekly', userPlan)
  if (!usageResult.allowed) {
    return apiError(
      402,
      'limit_reached',
      `You have used all your practice sessions for now. They reset on a rolling basis, or you can upgrade for more practice sessions.`,
      {
        used: usageResult.used,
        limit: usageResult.limit,
        feature: 'cc_drill_sessions_weekly',
        windowDays: usageResult.windowDays,
        upgrade_url: '/pricing',
      },
    )
  }

  const sceneResult = await admin
    .from('cc_scenes')
    .select('id, case_id, title, goal_md, skill_lane, preload, time_budget_s, rubric')
    .eq('id', sceneId)
    .eq('case_id', caseId)
    .maybeSingle()

  if (sceneResult.error) {
    return apiError(500, 'scene_query_failed', sceneResult.error.message)
  }
  const scene = sceneResult.data as SceneRow | null
  if (!scene) {
    return apiError(404, 'not_found', 'Practice not found')
  }

  // --- challenge_attempts lifecycle for this practice start ---
  // See the route doc comment (RETRY SEMANTICS) for why this is a fresh
  // insert rather than session/start's find-or-create: claude_code_sessions
  // has UNIQUE (attempt_id), so reusing an in_progress attempt would risk
  // reconnecting a retry to a budget-dead prior session.
  //
  // 1) Supersede any prior in_progress challenge_attempts row for this
  //    user+scene-shim BEFORE inserting the new one, so there is never a
  //    window with two in_progress rows for the same user+scene.
  const supersedeResult = await admin
    .from('challenge_attempts')
    .update({ status: 'abandoned' })
    .eq('user_id', user.id)
    .eq('challenge_id', sceneId)
    .eq('status', 'in_progress')

  if (supersedeResult.error) {
    return apiError(500, 'attempt_supersede_failed', supersedeResult.error.message)
  }

  // 2) Insert the fresh challenge_attempts row. challenge_id = sceneId only
  //    works once the orchestrator has seeded the challenges shim row for
  //    this scene (see SHIM BOUNDARY comment above) — until then this FK
  //    fails and we surface a clean error rather than a raw 500 leak.
  const challengeAttemptResult = await admin
    .from('challenge_attempts')
    .insert({
      user_id: user.id,
      challenge_id: sceneId,
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (challengeAttemptResult.error || !challengeAttemptResult.data) {
    console.error(
      '[casebook/practice/start] challenge_attempts insert failed (likely missing challenges shim row for scene):',
      challengeAttemptResult.error?.message,
    )
    return apiError(
      500,
      'attempt_create_failed',
      'Practice is not provisioned for this scene yet',
    )
  }
  const challengeAttemptId = challengeAttemptResult.data.id as string

  // Next attempt_no for this user+scene.
  const priorAttemptsResult = await admin
    .from('cc_scene_attempts')
    .select('attempt_no')
    .eq('user_id', user.id)
    .eq('scene_id', sceneId)
    .order('attempt_no', { ascending: false })
    .limit(1)

  if (priorAttemptsResult.error) {
    return apiError(500, 'attempt_query_failed', priorAttemptsResult.error.message)
  }
  const nextAttemptNo = ((priorAttemptsResult.data?.[0]?.attempt_no as number | undefined) ?? 0) + 1

  const insertResult = await admin
    .from('cc_scene_attempts')
    .insert({
      user_id: user.id,
      scene_id: sceneId,
      attempt_no: nextAttemptNo,
      status: 'in_progress',
      hint_used: false,
    })
    .select('id, attempt_no, status, created_at')
    .single()

  if (insertResult.error || !insertResult.data) {
    return apiError(500, 'attempt_create_failed', insertResult.error?.message ?? 'insert failed')
  }
  const attempt = insertResult.data

  // Context handed to the sandbox: the scene's goal + context markdown becomes
  // the session's CLAUDE.md (the `claudeMd` ProvisionInput field — see
  // src/lib/sandbox/provision-session.ts). Used below in the provisioning block.
  const contextMd = [scene.preload?.context_md, scene.goal_md].filter(Boolean).join('\n\n')

  // --- Provision the sandbox session ---
  // The challenges shim row (id === sceneId, challenge_type='claude_code_analytics')
  // carries the BigQuery + CLAUDE.md bootstrap config in metadata.claude_code — see
  // the SHIM BOUNDARY comment above. Read it through the SAME lab-resolution path
  // the analytics case-session provision route uses
  // (src/app/api/claude-code/session/[id]/provision/route.ts) rather than reaching
  // into metadata directly, so both callers stay in sync if that shape changes.
  const shimChallengeResult = await admin
    .from('challenges')
    .select('metadata, challenge_type')
    .eq('id', sceneId)
    .maybeSingle()

  let sessionPayload: { wss_url: string; expires_at: string; status: 'active' | 'provisioning' } | null =
    null
  let sessionError: string | null = null

  if (shimChallengeResult.error || !shimChallengeResult.data) {
    // Should not happen — the challenge_attempts insert above already required
    // this row to exist via its FK. Fail soft: attempt bookkeeping stands.
    sessionError = 'Practice session could not start'
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shimMeta = (shimChallengeResult.data.metadata ?? {}) as Record<string, any>
    const lab = getLabServer(labIdForChallengeType(shimChallengeResult.data.challenge_type as string | undefined))
    const labEnv = lab.resolveSandboxEnv(shimMeta)
    const bqProject = labEnv.BQ_PROJECT ?? ''
    const bqDataset = labEnv.BQ_DATASET ?? ''
    const bqBillingProject = labEnv.BQ_BILLING_PROJECT ?? 'hackproduct'
    // shim row's claude_md is the orchestrator-seeded bootstrap (warehouse/
    // table guidance for the scene's bq_dataset) and is the source of truth
    // per the task spec — it goes first so it is never silently dropped. The
    // scene's own goal/context markdown (contextMd) is appended as the
    // Practice-specific brief on top of that base.
    const claudeMd = [labEnv.CLAUDE_MD, contextMd].filter(Boolean).join('\n\n')
    const ttlSeconds = scene.time_budget_s || parseInt(process.env.CC_SESSION_TTL_SECONDS ?? '1800', 10)

    const sessionId = randomUUID()
    // The deployment that signs the snapshot HMAC must also receive the
    // container's snapshot POSTs — derive from this request's own origin, same
    // as session/[id]/provision/route.ts:34. Never hardcode NEXT_PUBLIC_APP_URL.
    const originUrl = new URL(req.url).origin

    const sessionInsertResult = await admin.from('claude_code_sessions').insert({
      id: sessionId,
      attempt_id: challengeAttemptId,
      user_id: user.id,
      challenge_id: sceneId,
      status: 'provisioning',
    })

    if (sessionInsertResult.error) {
      console.error(
        '[casebook/practice/start] claude_code_sessions insert failed:',
        sessionInsertResult.error.message,
      )
      sessionError = 'Practice session could not start'
    } else {
      const result = await provisionSession({
        sessionId,
        userId: user.id,
        challengeId: sceneId,
        originUrl,
        bqProject,
        bqDataset,
        bqBillingProject,
        claudeMd,
        ttlSeconds,
        extraAllowedTools: lab.allowedTools,
        // sessionKind: 'drill' selects the 600s hard wall inside
        // provisionSession regardless of ttlSeconds above, and threads
        // SESSION_KIND='drill' into the container env only — it never touches
        // any DB column (claude_code_sessions has no session_kind column; see
        // src/lib/sandbox/practice-idle-reap.ts's module doc for why) and
        // never appears in this route's response body.
        sessionKind: 'drill',
      })

      if (result.ok) {
        sessionPayload = {
          wss_url: result.wssUrl,
          expires_at: result.expiresAt,
          status: result.pending ? 'provisioning' : 'active',
        }
        // Flip the DB row to `active` on any successful provision, including
        // the `pending` (still-booting) case. Mirrors provision-session.ts's
        // markActiveAndMeter's state transition WITHOUT the metering call —
        // this route already records its own usage event below, so calling
        // that helper (or probeAndActivate) would double-meter or, worse,
        // silently charge the analytics-lab trial unit (probeAndActivate
        // resolves sessionKind via a cc_scenes lookup and falls back to
        // 'case' on a miss).
        //
        // DISCRIMINATOR: compute existence, not boot completion. `result.ok`
        // (the ProvisionResult union in provision-session.ts) is only ever
        // `true` after hostInstanceId/wssUrl have already been persisted to
        // this row, in both the ready branch and the `pending: true` branch —
        // there is no `ok: true` outcome with no host attached. So checking
        // `result.ok` alone (ignoring `pending`) already IS "flip only when a
        // host is attached, never when provisioning died before compute
        // existed" — the `!result.ok` branch below (sessionError) is exactly
        // that stranded case, and it correctly leaves the row untouched for
        // the stale-provisioning sweep to retire.
        //
        // Flipping eagerly on `pending` matters even for Practice's short
        // TTL: stale-provisioning-reap.ts sweeps ANY row still
        // `status='provisioning'` past its 60-minute cutoff regardless of
        // session kind, confirms the live compute, and destroys it. This is
        // also the same status every OTHER reaper on this row keys on
        // (cc-reap/route.ts, practice-idle-reap.ts both select
        // `status='active'`) — a row stuck at `provisioning` is invisible to
        // normal idle reaping. If the boot then dies anyway, the row is now
        // `active` with dead compute, which the normal idle sweep catches on
        // its own cutoff — a bounded, self-healing cleanup delay. Guarded
        // with the same CAS pattern used everywhere else so a concurrent
        // transition can't double-apply.
        await admin
          .from('claude_code_sessions')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
            provision_phase: 'ready',
          })
          .eq('id', sessionId)
          .eq('status', 'provisioning')
        // Record usage only on a successful provision — see the usage gate
        // comment above. Without this call getUsedQuantity would always read
        // 0 for this feature and the gate above could never trip.
        await recordUsageEvent(user.id, 'cc_drill_sessions_weekly', 1, {
          case_id: caseId,
          scene_id: sceneId,
          session_id: sessionId,
        })
      } else {
        // provisionSession already maps every failure (SQL wake timeout,
        // gateway key mint failure, sandbox create failure, readiness
        // timeout) to a clean, learner-facing string — never a raw
        // provider/gateway error. Budget exhaustion specifically surfaces
        // through the container's own ANTHROPIC_BUDGET_USD cap at runtime,
        // not at provisioning time, so it is not a distinct branch here.
        sessionError = 'Practice session could not start'
      }
    }
  }

  // Response payload. Deliberately allowlisted field-by-field — never spread
  // the raw scene row: rubric.required_moves[].detector is answer-adjacent
  // (it is the pattern the grader matches against) and must never reach the
  // client. `session_kind` / the internal 'drill' enum NEVER appears in this
  // body — sessionPayload only carries wss_url/expires_at/status.
  return NextResponse.json({
    attempt: {
      id: attempt.id,
      attempt_no: attempt.attempt_no,
      status: attempt.status,
      started_at: attempt.created_at,
    },
    practice: {
      case_id: scene.case_id,
      scene_id: scene.id,
      title: scene.title,
      goal_md: scene.goal_md,
      skill_lane: scene.skill_lane,
      time_budget_s: scene.time_budget_s,
    },
    // A missing `session` block means "not provisioned" — the client already
    // handles this. `session_error`, when present, is a clean, in-vocabulary
    // message safe to render directly.
    session: sessionPayload,
    ...(sessionError ? { session_error: sessionError } : {}),
  })
}, { name: 'casebook.practice.start' })
