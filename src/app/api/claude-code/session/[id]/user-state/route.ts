// POST /api/claude-code/session/[id]/user-state
//
// The container's autosave loop POSTs a per-user ~/.claude snapshot here (the
// portable bits: .mcp.json MCP registrations + the skills the user wrote). We
// store it at cc-user-state/<userId>/claude.tar.gz and point
// profiles.cc_claude_state_uri at it, so the next session rehydrates it — making
// MCP setup one-time and compounding the user's skills across challenges.
//
// Auth: the same per-session HMAC bearer as the workspace snapshot (the caller
// is the container, not a browser). The user is resolved from the session row.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifySnapshotToken } from '@/lib/sandbox/snapshot-token'
import {
  expiredUserStateSnapshotUris,
  isDuplicateSnapshotUploadError,
  readSnapshotCaptureHeaders,
  snapshotCaptureFromUri,
  snapshotStoragePath,
} from '@/lib/sandbox/snapshot-provenance'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params
  if (!sessionId) return new NextResponse(null, { status: 400 })

  const authHeader = req.headers.get('authorization') ?? ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const secret = process.env.SESSION_TOKEN_SECRET ?? ''
  if (!secret || !verifySnapshotToken(sessionId, bearer, secret)) {
    return new NextResponse(null, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, started_at')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return new NextResponse(null, { status: 404 })
  const userId = session.user_id as string

  const provenance = readSnapshotCaptureHeaders(req.headers)
  if (provenance.status === 'invalid') {
    return NextResponse.json({ error: 'Invalid snapshot capture provenance' }, { status: 400 })
  }
  const sessionStartedAtMs = Date.parse(session.started_at as string)
  if (
    provenance.status === 'proven'
    && Number.isFinite(sessionStartedAtMs)
    && provenance.captureStartedAtMs < sessionStartedAtMs - 5 * 60_000
  ) {
    return NextResponse.json({ error: 'Snapshot capture predates session' }, { status: 400 })
  }

  let bodyBuffer: Buffer
  try {
    bodyBuffer = Buffer.from(await req.arrayBuffer())
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  // Ignore empty bodies (the container sends nothing if there's no state yet).
  if (bodyBuffer.length === 0) return new NextResponse(null, { status: 204 })

  // V2 uses an immutable path so the profile pointer identifies the exact
  // archive and its capture-start time. Legacy images retain the stable path.
  const storagePath = provenance.status === 'proven'
    ? snapshotStoragePath(userId, 'user-state', provenance, sessionId)
    : `${userId}/claude.tar.gz`
  const { error: uploadErr } = await admin.storage
    .from('cc-user-state')
    .upload(storagePath, bodyBuffer, {
      contentType: 'application/gzip',
      // V2 is create-only; a retry reuses this exact archive identity.
      upsert: provenance.status === 'legacy',
    })

  if (uploadErr && !(provenance.status === 'proven' && isDuplicateSnapshotUploadError(uploadErr))) {
    console.error('[cc/user-state] upload failed:', uploadErr.message)
    return NextResponse.json({ error: 'upload failed' }, { status: 500 })
  }

  // Compare-and-set the pointer so overlapping sessions cannot let an older
  // capture win merely because its upload completed last. Expired versions are
  // cleaned after a grace period long enough for an in-flight finalizer.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('cc_claude_state_uri')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'profile pointer unavailable' }, { status: 500 })
    }

    const currentUri = (profile.cc_claude_state_uri as string | null | undefined) ?? null
    if (currentUri === storagePath) return new NextResponse(null, { status: 204 })

    const currentCapture = snapshotCaptureFromUri(currentUri, 'user-state')
    const incomingWins = provenance.status === 'proven'
      ? !currentCapture
        || provenance.captureStartedAtMs > currentCapture.captureStartedAtMs
        || (
          provenance.captureStartedAtMs === currentCapture.captureStartedAtMs
          && storagePath.localeCompare(currentUri ?? '') > 0
        )
      : !currentCapture

    if (!incomingWins) {
      return new NextResponse(null, { status: 204 })
    }

    let update = admin
      .from('profiles')
      .update({ cc_claude_state_uri: storagePath })
      .eq('id', userId)
    update = currentUri === null
      ? update.is('cc_claude_state_uri', null)
      : update.eq('cc_claude_state_uri', currentUri)

    const { data: updated, error: updateError } = await update.select('id')
    if (updateError) {
      return NextResponse.json({ error: 'profile pointer update failed' }, { status: 500 })
    }

    if (updated?.length) {
      const { data: objects, error: listError } = await admin.storage
        .from('cc-user-state')
        // Oldest first lets each autosave drain a pre-existing backlog too.
        .list(userId, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } })
      if (listError) {
        console.error('[cc/user-state] snapshot retention scan failed:', listError.message)
      } else {
        const expiredUris = expiredUserStateSnapshotUris(userId, objects ?? [], storagePath)
        if (expiredUris.length) {
          const { error: cleanupError } = await admin.storage.from('cc-user-state').remove(expiredUris)
          if (cleanupError) console.error('[cc/user-state] expired snapshot cleanup failed:', cleanupError.message)
        }
      }
      return new NextResponse(null, { status: 204 })
    }
  }

  return NextResponse.json({ error: 'profile pointer changed concurrently' }, { status: 409 })
}
