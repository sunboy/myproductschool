// GET /api/claude-code/session/report?session=<id>
//
// Returns the report.md the agent wrote during a session, extracted from the
// latest workspace snapshot tarball. Used by the session mirror's Download
// button and by the shareable report page. Auth: the requester must own the
// session (or it must be a published/shareable session — see the share page).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { readWorkspaceFile } from '@/lib/coding-grading/workspace-inspector'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from('claude_code_sessions')
    .select('id, user_id, transcript_uri')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Ownership: the session owner can always fetch their report.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== session.user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Prefer a report*.md; fall back to any markdown the session wrote.
  const report =
    (await readWorkspaceFile(session.transcript_uri as string | null, n => /report[^/]*\.md$/i.test(n)))
    ?? (await readWorkspaceFile(session.transcript_uri as string | null, n => n.endsWith('.md') && !n.includes('.claude/skills/')))

  if (!report) {
    return NextResponse.json({ error: 'No report found in this session' }, { status: 404 })
  }

  return new NextResponse(report.content, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="report-${sessionId.slice(0, 8)}.md"`,
      'Cache-Control': 'no-store',
    },
  })
}
