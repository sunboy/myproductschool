import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { LiveInterviewArtifactSnapshot } from '@/lib/live-interview/artifact-context'
import { z, ZodError } from 'zod'

const ArtifactSnapshotSchema = z.object({
  type: z.enum(['canvas', 'editor']),
  discipline: z.string().max(100).optional(),
  capturedAt: z.number().finite().nonnegative().optional(),
  elementCount: z.number().int().min(0).max(10000).optional(),
  elementTypes: z.record(z.string(), z.number().int().min(0)).optional(),
  textLabels: z.array(z.string().max(1000)).max(1000).optional(),
  code: z.string().max(40000).optional(),
  language: z.string().max(80).optional(),
  cursorLine: z.number().int().min(0).optional(),
  pasteEvents: z.array(z.object({
    length: z.number().int().min(0),
    percentOfBuffer: z.number().finite().min(0).max(1),
    timestamp: z.number().finite().nonnegative(),
  })).max(100).optional(),
  runResult: z.unknown().optional(),
})

const RequestSchema = z.object({
  artifactSnapshot: ArtifactSnapshotSchema,
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
    .select('calibration_snapshot')
    .eq('id', id)
    .eq('user_id', user.id)
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
    .eq('user_id', user.id)

  return Response.json({ ok: true })
}
