// POST /api/claude-code/session/[id]/provision
//
// Runs the heavy provisioning pipeline for a session row that `session/start`
// created in `provisioning` status. Split out from `start` because Vercel Hobby
// kills a function at 60s and a cold start (SQL wake + revision boot + readiness)
// can exceed that. The client calls this after `start`, then polls
// `session/[id]/state` for status/wss_url to render progress.
//
// Idempotent-ish: if the row is already `active` it returns the live wss_url; if
// `failed`/`terminated` it 409s so the client re-runs `start` (which re-creates
// a fresh provisioning row, carrying the prior workspace forward).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { provisionSession } from '@/lib/sandbox/provision-session'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // --- Load the session row (ownership + status gate) ---
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, challenge_id, status, wss_url, expires_at, transcript_uri')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Already live — return the connection (handles a double-call / reconnect).
  if (session.status === 'active' && session.wss_url) {
    return NextResponse.json({ status: 'active', wss_url: session.wss_url, expires_at: session.expires_at })
  }

  // Anything other than a fresh provisioning row: tell the client to restart.
  if (session.status !== 'provisioning') {
    return NextResponse.json(
      { error: 'Session is not provisioning. Start a new session.', status: session.status },
      { status: 409 },
    )
  }

  // --- Gather challenge metadata for the env build ---
  const { data: challenge } = await supabase
    .from('challenges')
    .select('metadata')
    .eq('id', session.challenge_id as string)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (challenge?.metadata ?? {}) as Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ccMeta = (meta.claude_code ?? {}) as Record<string, any>
  const bqProject =
    ccMeta.dataset_project ?? ccMeta.BQ_PROJECT ??
    meta.dataset_project ?? meta.BQ_PROJECT ??
    process.env.GCP_PROJECT ?? ''
  const bqDataset =
    ccMeta.dataset_id ?? ccMeta.BQ_DATASET ?? meta.dataset_id ?? meta.BQ_DATASET ?? ''
  const bqBillingProject =
    ccMeta.dataset_billing_project ?? meta.dataset_billing_project ??
    process.env.GCP_PROJECT ?? 'hackproduct'
  const claudeMd = ccMeta.claude_md ?? meta.claude_md ?? ''
  const ttlSeconds = parseInt(process.env.CC_SESSION_TTL_SECONDS ?? '1800', 10)

  // --- Presign prior ~/.claude state (MCP regs + skills) for one-time setup ---
  const { data: profile } = await admin
    .from('profiles')
    .select('cc_claude_state_uri')
    .eq('id', user.id)
    .maybeSingle()
  const priorClaudeStateUri = (profile?.cc_claude_state_uri as string | null) ?? null

  let userClaudeStateUrl: string | undefined
  if (priorClaudeStateUri) {
    const { data: signed } = await admin.storage
      .from('cc-user-state')
      .createSignedUrl(priorClaudeStateUri, ttlSeconds + 120)
    userClaudeStateUrl = signed?.signedUrl
  }

  // --- Resume: presign prior workspace snapshot if this row carries one ---
  let workspaceRestoreUrl: string | undefined
  const resumeSnapshotUri = (session.transcript_uri as string | null) ?? null
  if (resumeSnapshotUri) {
    const { data: signed } = await admin.storage
      .from('cc-sessions')
      .createSignedUrl(resumeSnapshotUri, ttlSeconds + 120)
    workspaceRestoreUrl = signed?.signedUrl
  }

  // --- Run the provisioning pipeline ---
  const result = await provisionSession({
    sessionId,
    userId: user.id,
    challengeId: session.challenge_id as string,
    bqProject,
    bqDataset,
    bqBillingProject,
    claudeMd,
    ttlSeconds,
    userClaudeStateUrl,
    workspaceRestoreUrl,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    status: 'active',
    wss_url: result.wssUrl,
    expires_at: result.expiresAt,
  })
}
