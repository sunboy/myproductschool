// src/app/api/live-interview/[id]/resume/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    .select('*')
    .eq('id', id)
    .single()

  if (!session) return new Response('Session not found', { status: 404 })

  type SessionRow = {
    loop_id?: string | null
    status: string
    round_index?: number | null
    flow_coverage?: Record<string, number> | null
    conversation_memory?: unknown[] | null
  }
  const s = session as SessionRow

  if (!s.loop_id) return Response.json({ error: 'Not a loop session' }, { status: 400 })
  if (s.status !== 'paused') return Response.json({ error: 'Session is not paused' }, { status: 409 })

  const { data: round } = await adminClient
    .from('loop_rounds' as string)
    .select('id, pause_snapshot')
    .eq('loop_id', s.loop_id)
    .eq('round_index', s.round_index ?? 0)
    .single()

  const snapshot = (round as { pause_snapshot?: { flow_coverage?: Record<string, number>; conversation_memory?: unknown[] } | null } | null)?.pause_snapshot

  const now = new Date().toISOString()

  await adminClient
    .from('live_interview_sessions')
    .update({
      status: 'active',
      flow_coverage: snapshot?.flow_coverage ?? s.flow_coverage,
      conversation_memory: snapshot?.conversation_memory ?? s.conversation_memory,
    })
    .eq('id', id)

  if (round) {
    await adminClient
      .from('loop_rounds' as string)
      .update({ status: 'active', resumed_at: now })
      .eq('id', (round as { id: string }).id)
  }

  await adminClient
    .from('interview_loops' as string)
    .update({ status: 'active' })
    .eq('id', s.loop_id)

  const { data: refreshed } = await adminClient
    .from('live_interview_sessions')
    .select('*')
    .eq('id', id)
    .single()

  return Response.json({ session: refreshed, resumedAt: now })
}
