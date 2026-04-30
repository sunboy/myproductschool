import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const body = await request.json() as { artifactSnapshot?: unknown }
  if (!body.artifactSnapshot) {
    return Response.json({ ok: false, error: 'artifactSnapshot required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('calibration_snapshot')
    .eq('id', id)
    .single()

  if (!session) {
    return new Response('Session not found', { status: 404 })
  }

  const existing = (session.calibration_snapshot ?? {}) as Record<string, unknown>
  const updated = { ...existing, _artifactSnapshot: body.artifactSnapshot }

  await adminClient
    .from('live_interview_sessions')
    .update({ calibration_snapshot: updated })
    .eq('id', id)

  return Response.json({ ok: true })
}
