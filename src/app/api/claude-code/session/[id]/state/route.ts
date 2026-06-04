// GET /api/claude-code/session/[id]/state
//
// Returns live session state for the analytics medium's reconnect flow and
// status overlays. Lazily flips expired active sessions to terminated.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

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
      'id, user_id, challenge_id, status, wss_url, expires_at, last_snapshot_at, prompt_count, warehouse_query_count, total_input_tokens, total_output_tokens',
    )
    .eq('id', sessionId)
    .maybeSingle()

  // Ownership check
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  let status = session.status as string
  const expiresAt = session.expires_at as string | null

  // --- Lazy expiry flip: active → terminated ---
  if (status === 'active' && expiresAt && new Date(expiresAt) <= new Date()) {
    status = 'terminated'
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

  // --- Read sub_problems from challenge metadata ---
  let subProblems: unknown[] = []
  if (session.challenge_id) {
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

  // --- Usage meter: estimated spend vs the per-session budget cap ---
  // The hard cap lives on the gateway's virtual key; here we surface an estimate
  // from the token counters the snapshot loop writes, so the meter updates live
  // without exposing the virtual key. Opus pricing is the conservative ceiling
  // ($15/Mtok in, $75/Mtok out) so the meter never under-reports.
  const inTok = (session.total_input_tokens as number) ?? 0
  const outTok = (session.total_output_tokens as number) ?? 0
  const estSpentUsd = (inTok / 1_000_000) * 15 + (outTok / 1_000_000) * 75
  const budgetUsd = parseFloat(process.env.CC_SESSION_BUDGET_USD ?? '0.50')

  return NextResponse.json({
    status,
    wss_url: session.wss_url ?? null,
    expires_at: expiresAt,
    last_snapshot_at: session.last_snapshot_at ?? null,
    prompt_count: session.prompt_count ?? 0,
    warehouse_query_count: session.warehouse_query_count ?? 0,
    usage: {
      spent_usd: Math.round(estSpentUsd * 1000) / 1000,
      budget_usd: budgetUsd,
      input_tokens: inTok,
      output_tokens: outTok,
    },
    sub_problems: subProblems,
  })
}
