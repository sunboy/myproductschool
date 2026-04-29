import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('id, status, loop_id, round_index, system_prompt')
    .eq('id', id)
    .single()

  if (!session) return new Response('Session not found', { status: 404 })
  if (!(session as { loop_id?: string | null }).loop_id) {
    return Response.json({ error: 'Only loop sessions can be paused' }, { status: 400 })
  }
  if ((session as { status: string }).status === 'completed') {
    return Response.json({ error: 'Session already completed' }, { status: 409 })
  }

  const pauseSnapshot = {
    system_prompt_hash: createHash('sha256')
      .update((session as { system_prompt?: string }).system_prompt ?? '')
      .digest('hex')
      .slice(0, 16),
    paused_at: new Date().toISOString(),
  }

  const now = new Date().toISOString()
  const loopId = (session as { loop_id: string }).loop_id
  const roundIndex = (session as { round_index?: number | null }).round_index

  await adminClient
    .from('live_interview_sessions')
    .update({ status: 'paused' })
    .eq('id', id)

  if (roundIndex !== null && roundIndex !== undefined) {
    const { data: round } = await adminClient
      .from('loop_rounds' as string)
      .select('id')
      .eq('loop_id', loopId)
      .eq('round_index', roundIndex)
      .single()

    if (round) {
      await adminClient
        .from('loop_rounds' as string)
        .update({ status: 'paused', paused_at: now, pause_snapshot: pauseSnapshot })
        .eq('id', (round as { id: string }).id)
    }
  }

  await adminClient
    .from('interview_loops' as string)
    .update({ status: 'paused' })
    .eq('id', loopId)

  return Response.json({ ok: true, paused_at: now })
}
