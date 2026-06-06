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
    .select('id, user_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return new NextResponse(null, { status: 404 })
  const userId = session.user_id as string

  let bodyBuffer: Buffer
  try {
    bodyBuffer = Buffer.from(await req.arrayBuffer())
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  // Ignore empty bodies (the container sends nothing if there's no state yet).
  if (bodyBuffer.length === 0) return new NextResponse(null, { status: 204 })

  // Latest-state-wins: a stable per-user path, upserted each snapshot.
  const storagePath = `${userId}/claude.tar.gz`
  const { error: uploadErr } = await admin.storage
    .from('cc-user-state')
    .upload(storagePath, bodyBuffer, { contentType: 'application/gzip', upsert: true })

  if (uploadErr) {
    console.error('[cc/user-state] upload failed:', uploadErr.message)
    return NextResponse.json({ error: 'upload failed' }, { status: 500 })
  }

  await admin.from('profiles').update({ cc_claude_state_uri: storagePath }).eq('id', userId)

  return new NextResponse(null, { status: 204 })
}
