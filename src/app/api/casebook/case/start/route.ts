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
// Same tradeoff practice/start makes (see its maxDuration comment): Vercel
// Hobby kills a function at 60s, and a cold sandbox boot (SQL wake + gateway
// key mint + revision PATCH + readiness) can exceed that on its own. This
// route still provisions inline rather than splitting into a separate
// start/provision pair the way the analytics lab does, because
// provisionSession already has a "not Ready yet" success path
// (`pending: true`) that leaves the row `provisioning` with its host/wss
// persisted, which is enough for the client to open the terminal (it needs
// only wss_url; see PracticeClient.tsx, which sets its own local status).
//
// This route flips the row to `active` itself (see the plain guarded UPDATE
// right after provisionSession below) rather than routing through
// probeAndActivate: that helper resolves sessionKind via a cc_scenes lookup
// keyed on challenge_id, which for a case id misses DETERMINISTICALLY,
// leaving sessionKind undefined so `?? 'case'` would charge the analytics-lab
// trial unit on every casebook_case session. This route already has
// sessionKind in hand and does not need to meter at all (usage is recorded
// route-side via recordUsageEvent below), so it updates status/provision_phase
// directly with no call into markActiveAndMeter. A 90-minute TTL only affects
// how long the session may run once active; it does not change how long
// provisioning itself may take.
export const maxDuration = 60

// cc_cases.id is a TEXT SLUG, never a uuid — see project_ids_not_always_uuid.
// Validate shape only, do not use z.string().uuid().
const SlugSchema = z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'invalid id')

const BodySchema = z.object({
  caseId: SlugSchema,
  // Test-out: a pro user attempts the Challenge cold, without doing the
  // Practice warm-up scenes first. Gated separately below on
  // cc_test_out_attempts_monthly (free=0, pro=5/rolling month). Optional and
  // defaults to false so every existing standard-mode caller is unaffected.
  testOut: z.boolean().optional(),
})

// Same allowlist approach as practice/start and the Phase 2 replay/predictions
// routes: `lab_casebook` stays false this phase, but the launch case needs the
// full Challenge flow working end to end, so allowlisted case ids bypass the
// flag. Duplicated as a 1-line module-level constant rather than shared —
// each route owns its own constant, matching the existing convention.
const CHALLENGE_CASE_IDS = new Set(['tuesday-dip'])

interface CaseRow {
  id: string
  title: string
}

// POST /api/casebook/case/start
//
// Starts a Challenge attempt: the full 90-minute Casebook case session
// (internal: "case"/"capstone"; user-facing: Challenge). Creates the
// cc_case_attempts row so evidence/verdict/report progress is tracked, plus a
// fresh challenge_attempts row so provisioning has somewhere to hang
// claude_code_sessions off of, then hands back what the Challenge workspace
// needs to mount a sandbox session.
//
// SHIM BOUNDARY: cc_cases is the SOLE content authority for a case (title,
// brief, objectives, warehouse). A `challenges` row with id === caseId
// (challenge_type='claude_code_analytics', metadata.casebook_kind='case')
// exists ONLY to satisfy claude_code_sessions' NOT NULL challenge_id/
// attempt_id FKs and to carry the sandbox bootstrap config
// (metadata.claude_code.claude_md / .bq_dataset) — it carries no case content
// of its own, same pattern as the per-scene shim rows practice/start reads.
// The orchestrator seeds this row; this route does not, and never writes to
// `challenges`. Until it exists for a given case id, the challenge_attempts
// insert below fails its FK and this route returns a clean error.
//
// RETRY SEMANTICS — each Challenge start MINTS A NEW challenge_attempts row,
// it does NOT find-or-create like session/start/route.ts:164-196 does for
// analytics-lab sessions. Why: claude_code_sessions has UNIQUE (attempt_id).
// If we reused an existing in_progress challenge_attempts row, a retry would
// reconnect to THAT row's existing claude_code_sessions session — which may
// already be budget-dead (Phase 1 documented exactly this trap: a second
// session for the same user reconnected to the same budget-dead session
// instead of minting a fresh key). So: any prior in_progress
// challenge_attempts row for this user+case-shim is marked 'abandoned' (the
// existing terminal status this codebase already uses for superseded/stale
// attempts — see src/app/api/cron/reap-stale-sessions/route.ts) BEFORE a
// fresh row is inserted. Do not "optimize" this back to find-or-create.
//
// Provisioning: after the attempt rows are settled, this route creates a
// `claude_code_sessions` row (status='provisioning', attempt_id = the fresh
// challenge_attempts row above) and calls provisionSession(...,
// sessionKind: 'casebook_case') inline. `sessionKind: 'casebook_case'` is
// DELIBERATELY not `'case'` — that name already means the existing analytics
// lab session and metering must stay distinguishable (see the sessionKind
// doc comment on ProvisionInput). A failed provision does NOT fail this
// route or the attempt bookkeeping already committed — the response still
// returns 200 with `session: null` (or `session_error` set) and the client
// treats a missing `session` block as "not provisioned yet."
//
// BUDGET NOTE: case sessions currently run under the SAME process-global
// $0.50 spend cap as every other sandbox session (ANTHROPIC_BUDGET_USD /
// CC_SESSION_BUDGET_USD in provision-session.ts / llm-gateway.ts). A
// higher $3.00 cap for Challenge sessions specifically requires a
// per-call override threaded through ProvisionInput -> mintSessionVirtualKey
// -> the ANTHROPIC_BUDGET_USD env line, all outside this route's file scope
// — see the task report for the exact change needed.
export const POST = withRoute(async (req: NextRequest) => {
  const json = await req.json().catch(() => null)
  const parsedBody = BodySchema.safeParse(json)
  if (!parsedBody.success) {
    return apiError(400, 'invalid_body', 'Invalid challenge request', parsedBody.error.flatten())
  }
  const { caseId, testOut } = parsedBody.data

  const isAllowlisted = CHALLENGE_CASE_IDS.has(caseId)
  if (!isAllowlisted) {
    const flagOn = await getAppFlag('lab_casebook', false)
    if (!flagOn) return apiError(404, 'not_found', 'Not found')
  }

  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  const admin = createAdminClient()

  // --- Usage gates (Challenge session cap [+ test-out, + terminal minutes]) ---
  // All gates run before any attempt bookkeeping or sandbox provisioning
  // below, so a refused user never costs a real Cloud Run boot or LLM spend.
  const { plan: userPlan } = await getEffectiveUserPlan(admin, user.id)

  // Test-out gate FIRST when requested, so a blocked free/over-quota user
  // gets the test-out-framed 402 (plan doc §5: "Paywall with test-out
  // framing") rather than the generic Challenge-cap message below. This is
  // IN ADDITION to the cc_case_attempts_total gate, not instead of it — a
  // test-out attempt is still a Challenge session and must also respect that
  // cap (free=1 lifetime trial; pro's cap is 10000 so this never costs pro
  // users a real-world denial in practice).
  if (testOut) {
    const testOutResult = await checkUsageLimit(user.id, 'cc_test_out_attempts_monthly', userPlan)
    if (!testOutResult.allowed) {
      return apiError(
        402,
        'limit_reached',
        `You have used all your test-out attempts for now. Upgrade for more, or warm up with Practice first.`,
        {
          used: testOutResult.used,
          limit: testOutResult.limit,
          feature: 'cc_test_out_attempts_monthly',
          windowDays: testOutResult.windowDays,
          upgrade_url: '/pricing',
        },
      )
    }
  }

  // Distinct feature key from both the analytics lab's 'claude_code_sessions'
  // and Practice's 'cc_drill_sessions_weekly' — a Challenge (full case) is
  // its own metered surface (free = 1 lifetime trial, pro = effectively
  // unlimited; see plan_limits).
  const usageResult = await checkUsageLimit(user.id, 'cc_case_attempts_total', userPlan)
  if (!usageResult.allowed) {
    return apiError(
      402,
      'limit_reached',
      `You have used all your challenge attempts for now. Upgrade for more.`,
      {
        used: usageResult.used,
        limit: usageResult.limit,
        feature: 'cc_case_attempts_total',
        windowDays: usageResult.windowDays,
        upgrade_url: '/pricing',
      },
    )
  }

  // Terminal-minutes gate. NOTE: recording (recordUsageEvent) for this
  // feature is NOT wired anywhere yet — see the task report's "scoped out"
  // finding on session-duration metering. This pre-start read-side gate is
  // still correct and harmless to ship now: getUsedQuantity reads whatever
  // has been recorded (0 today, so it never blocks), and the gate starts
  // enforcing automatically the moment a future change records real elapsed
  // minutes, with no further code change needed here.
  const terminalMinutesResult = await checkUsageLimit(user.id, 'cc_terminal_minutes_weekly', userPlan)
  if (!terminalMinutesResult.allowed) {
    return apiError(
      402,
      'limit_reached',
      `You have used all your sandbox time for now. It resets on a rolling basis, or you can upgrade for more.`,
      {
        used: terminalMinutesResult.used,
        limit: terminalMinutesResult.limit,
        feature: 'cc_terminal_minutes_weekly',
        windowDays: terminalMinutesResult.windowDays,
        upgrade_url: '/pricing',
      },
    )
  }

  const caseResult = await admin
    .from('cc_cases')
    .select('id, title')
    .eq('id', caseId)
    .maybeSingle()

  if (caseResult.error) {
    return apiError(500, 'case_query_failed', caseResult.error.message)
  }
  const caseRow = caseResult.data as CaseRow | null
  if (!caseRow) {
    return apiError(404, 'not_found', 'Module not found')
  }

  // --- challenge_attempts lifecycle for this Challenge start ---
  // See the route doc comment (RETRY SEMANTICS) for why this is a fresh
  // insert rather than session/start's find-or-create: claude_code_sessions
  // has UNIQUE (attempt_id), so reusing an in_progress attempt would risk
  // reconnecting a retry to a budget-dead prior session.
  //
  // 1) Supersede any prior in_progress challenge_attempts row for this
  //    user+case-shim BEFORE inserting the new one, so there is never a
  //    window with two in_progress rows for the same user+case.
  const supersedeResult = await admin
    .from('challenge_attempts')
    .update({ status: 'abandoned' })
    .eq('user_id', user.id)
    .eq('challenge_id', caseId)
    .eq('status', 'in_progress')

  if (supersedeResult.error) {
    return apiError(500, 'attempt_supersede_failed', supersedeResult.error.message)
  }

  // 2) Insert the fresh challenge_attempts row. challenge_id = caseId only
  //    works once the orchestrator has seeded the challenges shim row for
  //    this case (see SHIM BOUNDARY comment above) — until then this FK
  //    fails and we surface a clean error rather than a raw 500 leak.
  const challengeAttemptResult = await admin
    .from('challenge_attempts')
    .insert({
      user_id: user.id,
      challenge_id: caseId,
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (challengeAttemptResult.error || !challengeAttemptResult.data) {
    console.error(
      '[casebook/case/start] challenge_attempts insert failed (likely missing challenges shim row for case):',
      challengeAttemptResult.error?.message,
    )
    return apiError(
      500,
      'attempt_create_failed',
      'This challenge is not provisioned yet',
    )
  }
  const challengeAttemptId = challengeAttemptResult.data.id as string

  // 3) Insert the cc_case_attempts row that tracks evidence/verdict/report
  //    progress for this Challenge run.
  const caseAttemptResult = await admin
    .from('cc_case_attempts')
    .insert({
      user_id: user.id,
      case_id: caseId,
      // cc_case_attempts.mode CHECK already allows 'standard' | 'test_out'
      // (migration 20260826100100, live). This is the marker the debrief/
      // report surfaces read to distinguish test-out framing ("passed,
      // warm-ups credited" / "didn't pass, here's what to review") from the
      // normal Challenge messaging — see the task report for that follow-up.
      mode: testOut ? 'test_out' : 'standard',
      status: 'in_progress',
    })
    .select('id, status, started_at, mode')
    .single()

  if (caseAttemptResult.error || !caseAttemptResult.data) {
    return apiError(
      500,
      'attempt_create_failed',
      caseAttemptResult.error?.message ?? 'insert failed',
    )
  }
  const caseAttempt = caseAttemptResult.data

  // --- Provision the sandbox session ---
  // The challenges shim row (id === caseId, challenge_type='claude_code_analytics')
  // carries the BigQuery + CLAUDE.md bootstrap config in metadata.claude_code — see
  // the SHIM BOUNDARY comment above. Read it through the SAME lab-resolution path
  // practice/start and the analytics case-session provision route use
  // (src/app/api/claude-code/session/[id]/provision/route.ts) rather than reaching
  // into metadata directly, so all callers stay in sync if that shape changes.
  const shimChallengeResult = await admin
    .from('challenges')
    .select('metadata, challenge_type')
    .eq('id', caseId)
    .maybeSingle()

  let sessionPayload: { wss_url: string; expires_at: string; status: 'active' | 'provisioning' } | null =
    null
  let sessionError: string | null = null

  if (shimChallengeResult.error || !shimChallengeResult.data) {
    // Should not happen — the challenge_attempts insert above already required
    // this row to exist via its FK. Fail soft: attempt bookkeeping stands.
    sessionError = 'Challenge session could not start'
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shimMeta = (shimChallengeResult.data.metadata ?? {}) as Record<string, any>
    const lab = getLabServer(labIdForChallengeType(shimChallengeResult.data.challenge_type as string | undefined))
    const labEnv = lab.resolveSandboxEnv(shimMeta)
    const bqProject = labEnv.BQ_PROJECT ?? ''
    const bqDataset = labEnv.BQ_DATASET ?? ''
    const bqBillingProject = labEnv.BQ_BILLING_PROJECT ?? 'hackproduct'
    // shim row's claude_md is the orchestrator-seeded case brief (see
    // SHIM BOUNDARY) and is the full context this session needs — unlike
    // Practice, there is no separate scene-level goal/context markdown to
    // append on top of it.
    //
    // Hatch-awareness (repo CLAUDE.md, "Hatch-Awareness — Required for Every
    // Feature"): the in-session coaching surface for a Casebook Challenge IS
    // the sandbox Claude Code instance itself, driven entirely by this
    // claudeMd — there is no separate Hatch chat panel or nudger skill wired
    // into casebook sessions yet (grep confirms no casebook-specific
    // hackproduct-*-coach/-nudger skill exists). So the only place to make
    // Hatch aware of test-out mode in this phase's scope is right here: when
    // testOut is true, append an explicit assessment-mode instruction so the
    // in-sandbox assistant does not proactively coach through what is meant
    // to be a cold, unaided assessment (over-coaching here would invalidate
    // the "pass = warm-ups credited" signal the debrief relies on).
    const claudeMd = testOut
      ? [
          labEnv.CLAUDE_MD,
          '## Test-out mode\n\nThe learner is attempting this case COLD, without having done the Practice warm-up scenes first, to test out of them. Do not proactively coach, hint, or walk them through the investigation as you normally would — let them drive. Answer direct factual questions about the data/tools if asked, but do not volunteer the next step or point out what they are missing. This is a graded assessment, not a guided session.',
        ]
          .filter(Boolean)
          .join('\n\n')
      : labEnv.CLAUDE_MD
    // 90-minute capstone hard wall — plan §3.3. Passed explicitly rather than
    // relying on a default; provisionSession only overrides ttlSeconds
    // internally for sessionKind: 'drill', so 'casebook_case' passes this
    // value through unchanged.
    const ttlSeconds = 5400

    const sessionId = randomUUID()
    // The deployment that signs the snapshot HMAC must also receive the
    // container's snapshot POSTs — derive from this request's own origin, same
    // as practice/start and session/[id]/provision/route.ts:34. Never
    // hardcode NEXT_PUBLIC_APP_URL.
    const originUrl = new URL(req.url).origin

    const sessionInsertResult = await admin.from('claude_code_sessions').insert({
      id: sessionId,
      attempt_id: challengeAttemptId,
      user_id: user.id,
      challenge_id: caseId,
      status: 'provisioning',
    })

    if (sessionInsertResult.error) {
      console.error(
        '[casebook/case/start] claude_code_sessions insert failed:',
        sessionInsertResult.error.message,
      )
      sessionError = 'Challenge session could not start'
    } else {
      const result = await provisionSession({
        sessionId,
        userId: user.id,
        challengeId: caseId,
        originUrl,
        bqProject,
        bqDataset,
        bqBillingProject,
        claudeMd,
        ttlSeconds,
        extraAllowedTools: lab.allowedTools,
        // sessionKind: 'casebook_case' selects a distinct metering identity
        // from the analytics lab's default ('case') and Practice's ('drill').
        // It threads SESSION_KIND='casebook_case' into the container env only
        // — it never touches any DB column and never appears in this route's
        // response body.
        sessionKind: 'casebook_case',
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
        // silently charge the analytics-lab trial unit (see the doc comment
        // above).
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
        // Flipping eagerly on `pending` closes the real bug: a case session
        // runs for up to 90 minutes, and stale-provisioning-reap.ts sweeps
        // ANY row still `status='provisioning'` past its 60-minute cutoff,
        // confirms the live compute, and destroys it — killing a learner
        // mid-Challenge. Waiting for a later readiness confirmation that
        // never arrives on this path (no /state poll runs for casebook
        // sessions) would leave exactly the slow-boot sessions most at risk
        // of the sweep-kill unprotected. This is also the same status every
        // OTHER reaper on this row keys on (cc-reap/route.ts,
        // practice-idle-reap.ts both select `status='active'`) — a row stuck
        // at `provisioning` is invisible to normal idle reaping, so flipping
        // early plugs this row into the correct enforcement path rather than
        // leaving it in a status nothing but the stale sweep ever looks at.
        // If the boot then dies anyway, the row is now `active` with dead
        // compute, which the normal idle sweep catches on its own cutoff —
        // a bounded, self-healing cleanup delay, not a live-session kill.
        // Guarded with the same CAS pattern used everywhere else so a
        // concurrent transition can't double-apply.
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
        await recordUsageEvent(user.id, 'cc_case_attempts_total', 1, {
          case_id: caseId,
          session_id: sessionId,
        })
        // Test-out is metered as an ADDITIONAL event on the same successful
        // provision, not a replacement for the cc_case_attempts_total event
        // above — a test-out attempt is still a Challenge session and must
        // count against both caps.
        if (testOut) {
          await recordUsageEvent(user.id, 'cc_test_out_attempts_monthly', 1, {
            case_id: caseId,
            session_id: sessionId,
          })
        }
      } else {
        // provisionSession already maps every failure (SQL wake timeout,
        // gateway key mint failure, sandbox create failure, readiness
        // timeout) to a clean, learner-facing string — never a raw
        // provider/gateway error. Budget exhaustion specifically surfaces
        // through the container's own ANTHROPIC_BUDGET_USD cap at runtime,
        // not at provisioning time, so it is not a distinct branch here.
        sessionError = 'Challenge session could not start'
      }
    }
  }

  // Response payload. Deliberately allowlisted field-by-field — never spread
  // the raw case/attempt rows. `session_kind` / the internal 'casebook_case'
  // enum NEVER appears in this body — sessionPayload only carries
  // wss_url/expires_at/status.
  return NextResponse.json({
    attempt: {
      id: caseAttempt.id,
      status: caseAttempt.status,
      started_at: caseAttempt.started_at,
      mode: caseAttempt.mode,
    },
    challenge: {
      case_id: caseRow.id,
      title: caseRow.title,
    },
    // A missing `session` block means "not provisioned" — the client already
    // handles this for Practice. `session_error`, when present, is a clean,
    // in-vocabulary message safe to render directly.
    session: sessionPayload,
    ...(sessionError ? { session_error: sessionError } : {}),
  })
}, { name: 'casebook.case.start' })
