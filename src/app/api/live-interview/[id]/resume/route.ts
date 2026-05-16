// src/app/api/live-interview/[id]/resume/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPromptFromSession } from '@/lib/live-interview/build-prompt-from-session'

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
    .select('id, user_id, status, loop_id, round_index, flow_coverage, conversation_memory, company_id, role_id, challenge_id, calibration_snapshot')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) return new Response('Session not found', { status: 404 })

  type SessionRow = {
    loop_id?: string | null
    status: string
    round_index?: number | null
    flow_coverage?: Record<string, number> | null
    conversation_memory?: unknown[] | null
    company_id?: string | null
    role_id?: string | null
    challenge_id?: string | null
    calibration_snapshot?: Record<string, unknown> | null
  }
  const s = session as SessionRow

  if (!s.loop_id) return Response.json({ error: 'Not a loop session' }, { status: 400 })
  if (s.status !== 'paused') return Response.json({ error: 'Session is not paused' }, { status: 409 })

  const { data: round } = await adminClient
    .from('loop_rounds' as string)
    .select('id, pause_snapshot, discipline')
    .eq('loop_id', s.loop_id)
    .eq('round_index', s.round_index ?? 0)
    .single()

  const snapshot = (round as { pause_snapshot?: { flow_coverage?: Record<string, number>; conversation_memory?: unknown[] } | null } | null)?.pause_snapshot
  const roundDiscipline = (round as { discipline?: string | null } | null)?.discipline ?? null

  const now = new Date().toISOString()

  // Rebuild the session instructions from current move_levels / competencies / failure
  // patterns so a long-paused session reflects the user's latest state.
  const built = await buildPromptFromSession({
    adminClient,
    userId: user.id,
    companyId: s.company_id ?? null,
    roleId: s.role_id ?? null,
    challengeId: s.challenge_id ?? null,
    discipline: roundDiscipline,
  })

  await adminClient
    .from('live_interview_sessions')
    .update({
      status: 'active',
      flow_coverage: snapshot?.flow_coverage ?? s.flow_coverage,
      conversation_memory: snapshot?.conversation_memory ?? s.conversation_memory,
      system_prompt: built.systemPrompt,
      scenario_rubric: built.scenarioRubric,
      calibration_snapshot: {
        ...(s.calibration_snapshot ?? {}),
        ...built.calibrationSnapshot,
        companyName: built.companyName ?? s.calibration_snapshot?.companyName ?? null,
        scenarioTitle: built.scenarioTitle ?? s.calibration_snapshot?.scenarioTitle ?? null,
        effectiveDiscipline: built.effectiveDiscipline ?? s.calibration_snapshot?.effectiveDiscipline ?? null,
      },
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

  return Response.json({
    session: {
      id,
      company_id: s.company_id ?? null,
      role_id: s.role_id ?? null,
      challenge_id: s.challenge_id ?? null,
      loop_id: s.loop_id,
      round_index: s.round_index ?? 0,
      status: 'active',
    },
    resumedAt: now,
    discipline: built.effectiveDiscipline,
  })
}
