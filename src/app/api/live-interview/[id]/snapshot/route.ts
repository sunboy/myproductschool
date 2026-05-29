import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { LiveInterviewArtifactSnapshot } from '@/lib/live-interview/artifact-context'
import { LiveInterviewArtifactSnapshotSchema } from '@/lib/live-interview/snapshot-schema'
import { normalizeDiscipline } from '@/lib/live-interview/disciplines'
import { buildLiveWorkspaceSignal } from '@/lib/live-interview/workspace-adapters'
import { z, ZodError } from 'zod'

const RequestSchema = z.object({
  artifactSnapshot: LiveInterviewArtifactSnapshotSchema,
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  let body: { artifactSnapshot: LiveInterviewArtifactSnapshot }
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { ok: false, error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('calibration_snapshot, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return new Response('Session not found', { status: 404 })
  }
  if (session.status !== 'active') {
    return Response.json({ ok: false, error: 'Session is not active' }, { status: 409 })
  }

  const existing = (session.calibration_snapshot ?? {}) as Record<string, unknown>
  const discipline = normalizeDiscipline(
    body.artifactSnapshot.discipline ??
    (existing.effectiveDiscipline as string | undefined) ??
    null
  )
  const workspaceSignal = buildLiveWorkspaceSignal(body.artifactSnapshot, discipline)
  const updated = {
    ...existing,
    _artifactSnapshot: body.artifactSnapshot,
    _workspaceDigest: workspaceSignal.digest,
    _workspaceSummaryVersion: 1,
    _latestWorkspaceEvent: {
      state: workspaceSignal.state,
      type: workspaceSignal.type,
      discipline: workspaceSignal.discipline,
      summary: workspaceSignal.summary,
      capturedAt: Date.now(),
    },
  }

  await adminClient
    .from('live_interview_sessions')
    .update({ calibration_snapshot: updated })
    .eq('id', id)
    .eq('user_id', user.id)

  return Response.json({ ok: true })
}
