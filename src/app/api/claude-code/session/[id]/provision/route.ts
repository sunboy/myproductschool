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
import { getLabServer, labIdForChallengeType } from '@/lib/labs/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { provisionSession } from '@/lib/sandbox/provision-session'
import { resolveSessionTtlSeconds } from '@/lib/sandbox/cost-policy'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  // The deployment that signs the snapshot token must also receive the snapshot.
  // Derive this request's origin so the container POSTs back here, not to a
  // hardcoded prod URL whose SESSION_TOKEN_SECRET may differ.
  const originUrl = new URL(req.url).origin

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
    .select('id, user_id, challenge_id, status, host_instance_id, wss_url, expires_at, transcript_uri')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Already live — return the connection (handles a double-call / reconnect).
  if (session.status === 'active' && session.wss_url) {
    return NextResponse.json({ status: 'active', wss_url: session.wss_url, expires_at: session.expires_at })
  }

  // Idempotency: a provisioning row whose revision was already PATCHed (host + wss
  // persisted) must NOT re-enter provisionSession — re-minting the same key alias
  // 400s on LiteLLM's _enforce_unique_key_alias, and re-creating the revision is
  // wasted work. The client keeps polling /state, which finishes readiness. This is
  // the common double-provision case (client double-fire / killed-then-retried AFTER
  // host persist). The narrow window where the kill happened BEFORE host persist
  // (host still NULL) falls through and is handled by the mint's duplicate-alias
  // recovery in llm-gateway.ts.
  if (session.status === 'provisioning' && session.host_instance_id && session.wss_url) {
    return NextResponse.json({
      status: 'provisioning',
      wss_url: session.wss_url,
      expires_at: session.expires_at,
    })
  }

  // Anything other than a fresh provisioning row: tell the client to restart.
  if (session.status !== 'provisioning') {
    return NextResponse.json(
      { error: 'Session is not provisioning. Start a new session.', status: session.status },
      { status: 409 },
    )
  }

  // --- Gather challenge metadata for the env build (lab-resolved) ---
  const { data: challenge } = await supabase
    .from('challenges')
    .select('metadata, challenge_type')
    .eq('id', session.challenge_id as string)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (challenge?.metadata ?? {}) as Record<string, any>
  const lab = getLabServer(labIdForChallengeType(challenge?.challenge_type as string | undefined))
  const labEnv = lab.resolveSandboxEnv(meta)
  const bqProject = labEnv.BQ_PROJECT ?? ''
  const bqDataset = labEnv.BQ_DATASET ?? ''
  const bqBillingProject = labEnv.BQ_BILLING_PROJECT ?? 'hackproduct'
  const claudeMd = labEnv.CLAUDE_MD ?? ''
  const ttlSeconds = resolveSessionTtlSeconds(process.env.CC_SESSION_TTL_SECONDS)

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

  // --- Lab starter tarball (e.g. the debugging repo), presigned like the rest ---
  let challengeTarballUrl: string | undefined
  const tarballPath = labEnv.CHALLENGE_TARBALL
  if (tarballPath) {
    const { data: signed } = await admin.storage
      .from('cc-lab-content')
      .createSignedUrl(tarballPath, ttlSeconds + 120)
    challengeTarballUrl = signed?.signedUrl
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
    challengeTarballUrl,
    extraAllowedTools: lab.allowedTools,
    workspaceRestoreUrl,
    originUrl,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  // `pending` = revision PATCHed + host/wss persisted, but not Ready inside the
  // optimistic window. The client keeps polling /state, which finishes readiness.
  return NextResponse.json({
    status: result.pending ? 'provisioning' : 'active',
    wss_url: result.wssUrl,
    expires_at: result.expiresAt,
  })
}
