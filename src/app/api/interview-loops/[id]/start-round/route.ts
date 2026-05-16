// src/app/api/interview-loops/[id]/start-round/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPriorRoundContextBlock } from '@/lib/interview-loops/loop-context-distiller'
import type { CrossRoundMemoryItem } from '@/lib/interview-loops/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  const [loopResult, roundsResult, profileResult] = await Promise.all([
    adminClient
      .from('interview_loops' as string)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    adminClient
      .from('loop_rounds' as string)
      .select('*')
      .eq('loop_id', id)
      .order('round_index', { ascending: true }),
    adminClient
      .from('profiles')
      .select('archetype, archetype_description, active_role, display_name')
      .eq('id', user.id)
      .single(),
  ])

  const loop = loopResult.data as {
    id: string
    user_id: string
    title: string
    target_company: string | null
    target_role: string | null
    status: string
    round_order: string[]
    current_round_index: number
    cross_round_memory: CrossRoundMemoryItem[]
    started_at: string | null
  } | null

  const rounds = roundsResult.data ?? []

  if (!loop) return new Response('Loop not found', { status: 404 })

  const currentRound = rounds.find(
    (r: { round_index: number; status: string }) => r.round_index === loop.current_round_index
  )
  if (!currentRound) return new Response('Round not found', { status: 404 })

  if ((currentRound as { status: string }).status === 'completed') {
    return Response.json({ error: 'Round already completed' }, { status: 409 })
  }

  const profile = profileResult.data
  const memory = (loop.cross_round_memory ?? []) as CrossRoundMemoryItem[]

  const priorContextBlock = buildPriorRoundContextBlock(
    memory,
    loop.current_round_index,
    loop.round_order.length,
    loop.target_company,
    loop.target_role
  )

  const disciplineLabel = (currentRound as { discipline: string }).discipline.replace(/_/g, ' ')
  const basePrompt = `You are Hatch, an AI interview coach conducting a ${disciplineLabel} interview round${loop.target_company ? ` for ${loop.target_company}` : ''}${loop.target_role ? ` (${loop.target_role})` : ''}.

This is Round ${loop.current_round_index + 1} of ${loop.round_order.length} in a Full Loop interview simulation.

Conduct a realistic ${disciplineLabel} interview. Ask probing questions. Challenge assumptions. Give the candidate space to think.

${priorContextBlock}`

  const calibrationSnapshot = {
    archetype: profile?.archetype ?? 'Analyst',
    target_company: loop.target_company,
    target_role: loop.target_role,
    companyName: loop.target_company,
    scenarioTitle: `${loop.target_company ?? 'Full loop'} ${disciplineLabel} round`,
    effectiveDiscipline: (currentRound as { discipline: string }).discipline,
  }

  const { data: session, error: sessionError } = await adminClient
    .from('live_interview_sessions')
    .insert({
      user_id: user.id,
      company_id: null,
      role_id: profile?.active_role ?? loop.target_role ?? 'SWE',
      status: 'active',
      started_at: new Date().toISOString(),
      system_prompt: basePrompt,
      calibration_snapshot: calibrationSnapshot,
      loop_id: id,
      round_index: loop.current_round_index,
      prior_round_context: memory.length > 0 ? memory : null,
    })
    .select()
    .single()

  if (sessionError || !session) {
    return Response.json(
      { error: sessionError?.message ?? 'Failed to create session' },
      { status: 500 }
    )
  }

  await Promise.all([
    adminClient
      .from('loop_rounds' as string)
      .update({
        session_id: session.id,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', (currentRound as { id: string }).id),
    adminClient
      .from('interview_loops' as string)
      .update({
        status: 'active',
        started_at: loop.started_at ?? new Date().toISOString(),
      })
      .eq('id', id),
  ])

  return Response.json({
    sessionId: session.id,
    roundIndex: loop.current_round_index,
    discipline: (currentRound as { discipline: string }).discipline,
    priorContextInjected: memory.length > 0,
  })
}
