// POST /api/claude-code/session/[id]/snapshot
//
// The container's 30-second autosave loop POSTs the compressed workspace
// tarball here. Auth is a per-session HMAC bearer token, not a user cookie
// (the container has no browser session). Storage is Supabase Storage bucket
// 'cc-sessions' under <session_id>/workspace-<ts>.tar.gz.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifySnapshotToken } from '@/lib/sandbox/snapshot-token'

export const dynamic = 'force-dynamic'
// Streaming a gzip tarball can take a few seconds on slow uplinks.
export const maxDuration = 30

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  // --- Bearer token auth (constant-time HMAC compare) ---
  const authHeader = req.headers.get('authorization') ?? ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  const secret = process.env.SESSION_TOKEN_SECRET ?? ''
  if (!secret || !verifySnapshotToken(sessionId, bearer, secret)) {
    return new NextResponse(null, { status: 401 })
  }

  const admin = createAdminClient()

  // --- Verify session exists ---
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) {
    return new NextResponse(null, { status: 404 })
  }

  // Allow snapshots even if status is 'active' or 'provisioning'; reject only
  // once terminated so a final autosave from the dying container is captured.
  if (session.status === 'terminated') {
    return new NextResponse(null, { status: 410 }) // Gone
  }

  // --- Stream body to Supabase Storage ---
  const ts = Date.now()
  const storagePath = `${sessionId}/workspace-${ts}.tar.gz`

  // Read body as ArrayBuffer (Next.js request body — not a raw Node stream in
  // the edge runtime, but arrayBuffer() works in the Node runtime too).
  let bodyBuffer: Buffer
  try {
    const ab = await req.arrayBuffer()
    bodyBuffer = Buffer.from(ab)
  } catch (err) {
    console.error('[cc/snapshot] Failed to read request body:', err)
    return NextResponse.json({ error: 'Failed to read body' }, { status: 400 })
  }

  const { error: uploadErr } = await admin.storage
    .from('cc-sessions')
    .upload(storagePath, bodyBuffer, {
      contentType: 'application/gzip',
      upsert: true,
    })

  if (uploadErr) {
    console.error('[cc/snapshot] Storage upload failed:', uploadErr.message)
    return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
  }

  // --- Parse optional sidecar header for telemetry counters ---
  // The container can include X-Prompt-Count / X-Query-Count in the POST.
  const promptCount = parseInt(req.headers.get('x-prompt-count') ?? '', 10) || undefined
  const queryCount = parseInt(req.headers.get('x-query-count') ?? '', 10) || undefined
  const inputTokens = parseInt(req.headers.get('x-input-tokens') ?? '', 10) || undefined
  const outputTokens = parseInt(req.headers.get('x-output-tokens') ?? '', 10) || undefined

  // --- Update session row ---
  // transcript_uri is the LATEST autosave tarball (overwritten each 30s loop) —
  // it doubles as the workspace-restore pointer on resume. An autosave is also a
  // liveness signal, so refresh last_activity_at to keep the reaper from killing
  // an actively-working session.
  const updatePayload: Record<string, unknown> = {
    last_snapshot_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    transcript_uri: storagePath,
  }
  if (promptCount !== undefined) updatePayload.prompt_count = promptCount
  if (queryCount !== undefined) updatePayload.warehouse_query_count = queryCount
  if (inputTokens !== undefined) updatePayload.total_input_tokens = inputTokens
  if (outputTokens !== undefined) updatePayload.total_output_tokens = outputTokens

  await admin
    .from('claude_code_sessions')
    .update(updatePayload)
    .eq('id', sessionId)

  return new NextResponse(null, { status: 204 })
}
