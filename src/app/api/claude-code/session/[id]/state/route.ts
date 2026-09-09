import { blockSessionKey, getSessionKeySpend } from '@/lib/sandbox/llm-gateway'
import { resolveSessionBudgetUsd } from '@/lib/sandbox/cost-policy'
import { readAnalyticsProgress } from '@/lib/sandbox/analytics-progress'
// GET /api/claude-code/session/[id]/state
//
// Returns live session state for the analytics medium's reconnect flow and
// status overlays. Lazily flips expired active sessions to terminated.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSandbox } from '@/lib/sandbox'
import { probeAndActivate } from '@/lib/sandbox/provision-session'

export const dynamic = 'force-dynamic'
// A provisioning row's per-poll readiness probe lives here (a few seconds). Keep
// headroom over that single probe; this never blocks for the full cold boot.
export const maxDuration = 15

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  // --- Auth ---
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // --- Load session ---
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select(
      'id, user_id, challenge_id, status, host_instance_id, wss_url, expires_at, last_snapshot_at, prompt_count, warehouse_query_count, total_input_tokens, total_output_tokens, final_artifact, provision_phase, failure_code',
    )
    .eq('id', sessionId)
    .maybeSingle()

  // Ownership check
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  let status = session.status as string
  const expiresAt = session.expires_at as string | null

  // --- Readiness probe: a provisioning row whose revision was already PATCHed
  // (host_instance_id present) gets a quick Ready check here. This is how the
  // cold-boot finishes when the provision route was killed at Hobby's 60s ceiling
  // mid-wait — the client polls this every few seconds and we flip to `active`
  // the moment the revision is Ready, without ever blocking a single request for
  // the whole boot. ---
  const hostId0 = session.host_instance_id as string | null
  const wss0 = session.wss_url as string | null
  if (status === 'provisioning' && hostId0 && wss0) {
    try {
      const activated = await probeAndActivate(
        sessionId,
        hostId0,
        user.id,
        session.challenge_id as string,
        'cloud_run',
        wss0,
      )
      if (activated) status = 'active'
    } catch (err) {
      console.error('[cc/state] readiness probe failed (will retry next poll):', err)
    }
  }

  // --- Lazy expiry flip: active → terminated ---
  if (status === 'active' && expiresAt && new Date(expiresAt) <= new Date()) {
    status = 'terminated'
    const keyBlock = await blockSessionKey(sessionId, 3000)
    if (keyBlock.status === 'failed' || keyBlock.status === 'not_found') {
      const reason = keyBlock.status === 'failed' ? keyBlock.reason : keyBlock.status
      console.error(`[cc/state] session key block failed (${reason})`)
    }
    // Tear the sandbox down BEFORE flipping the row out of `active`. The reaper
    // only sweeps `active` sessions, so once this row is `terminated` nothing
    // else will free its Cloud Run instance — skipping destroySession here
    // orphans the revision (minScale=1, billing) indefinitely. Best-effort: the
    // orphan-reconcile sweep in cc-reap is the backstop if this throws.
    const hostId = session.host_instance_id as string | null
    if (hostId) {
      await getSandbox()
        .destroySession(hostId)
        .catch((err) => console.error('[cc/state] destroySession failed (best-effort):', err))
    }
    await admin
      .from('claude_code_sessions')
      .update({ status: 'terminated', ended_at: new Date().toISOString() })
      .eq('id', sessionId)
  } else if (status === 'active') {
    // The medium polls this every ~15s while the tab is open — a liveness signal.
    // Refresh last_activity_at so the idle reaper backs off an open, in-use tab.
    await admin
      .from('claude_code_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId)
  }

  // --- Sub-problems: the per-session adaptive arc wins over challenge metadata
  // (design §5/§7 — a refresh must reconstruct the guidance-shaped arc). ---
  const adaptive = (session.final_artifact as
    | { adaptive?: { guidance?: string; arc?: unknown[] } }
    | null)?.adaptive
  let subProblems: unknown[] = []
  let arcComplete = false
  if (adaptive?.arc?.length) {
    subProblems = adaptive.arc
    arcComplete = true
  } else if (session.challenge_id) {
    const { data: challenge } = await supabase
      .from('challenges')
      .select('metadata')
      .eq('id', session.challenge_id as string)
      .maybeSingle()

    if (challenge?.metadata) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subProblems = (challenge.metadata as any)?.sub_problems ?? []
    }
  }

  // The container does not emit token counters. Use the gateway's real spend,
  // and report an unavailable meter honestly when the bounded lookup fails.
  const gatewayUsage = status === 'active' ? await getSessionKeySpend(sessionId) : null
  const budgetUsd = gatewayUsage?.budgetUsd ?? resolveSessionBudgetUsd(process.env.CC_SESSION_BUDGET_USD)

  return NextResponse.json({
    status,
    // Provisioning sub-phase + failure code for the client's staged progress and
    // silent cold-start retry. Null until provisionSession writes them.
    provision_phase: (session.provision_phase as string | null) ?? null,
    failure_code: (session.failure_code as string | null) ?? null,
    wss_url: session.wss_url ?? null,
    expires_at: expiresAt,
    last_snapshot_at: session.last_snapshot_at ?? null,
    prompt_count: session.prompt_count ?? 0,
    warehouse_query_count: session.warehouse_query_count ?? 0,
    usage: {
      spent_usd: gatewayUsage ? Math.round(gatewayUsage.spentUsd * 1000) / 1000 : null,
      budget_usd: budgetUsd,
      input_tokens: session.total_input_tokens ?? null,
      output_tokens: session.total_output_tokens ?? null,
    },
    sub_problems: subProblems,
    arc_complete: arcComplete,
    guidance: adaptive?.guidance ?? 'guided',
    progress: readAnalyticsProgress(session.final_artifact),
  })
}
