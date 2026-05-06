// src/app/api/interview-loops/[id]/debrief/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateLoopDebrief } from '@/lib/interview-loops/loop-debrief-generator'
import type { CrossRoundMemoryItem, LoopRound } from '@/lib/interview-loops/types'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'

function aiLimitResponse(error: unknown) {
  if (error instanceof PlanLimitExceeded) {
    return Response.json({
      error: 'limit_reached',
      feature: error.feature,
      used: error.used,
      limit: error.limit,
      windowDays: error.windowDays,
    }, { status: 402 })
  }

  if (error instanceof AiBudgetExceededError) {
    return Response.json({
      error: 'limit_reached',
      feature: 'hatch_ai_cents',
      used: error.used,
      limit: error.limit,
      windowDays: error.windowDays,
    }, { status: 402 })
  }

  return null
}

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
    adminClient.from('interview_loops' as string).select('*').eq('id', id).eq('user_id', user.id).single(),
    adminClient.from('loop_rounds' as string).select('*').eq('loop_id', id).order('round_index', { ascending: true }),
    adminClient.from('profiles').select('archetype, archetype_description').eq('id', user.id).single(),
  ])

  const loop = loopResult.data as {
    cross_round_memory: CrossRoundMemoryItem[]
    target_company: string | null
    target_role: string | null
  } | null

  if (!loop) return new Response('Loop not found', { status: 404 })

  const rounds = (roundsResult.data ?? []) as LoopRound[]
  const memory = (loop.cross_round_memory ?? []) as CrossRoundMemoryItem[]
  const userPlan = await getUserPlanForBudget(user.id)

  let debrief
  try {
    await assertPlanLimit(user.id, userPlan, 'ai_grading_runs')
    debrief = await generateLoopDebrief({
      rounds,
      crossRoundMemory: memory,
      targetCompany: loop.target_company,
      targetRole: loop.target_role,
      calibrationSnapshot: {
        archetype: profileResult.data?.archetype ?? 'Analyst',
        archetypeDescription: profileResult.data?.archetype_description ?? '',
      },
      budget: { userId: user.id, userPlan, route: 'interview_loop_debrief_manual' },
    })
  } catch (error) {
    const response = aiLimitResponse(error)
    if (response) return response
    throw error
  }

  await adminClient
    .from('interview_loops' as string)
    .update({ loop_debrief_json: debrief, status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)

  return Response.json({ debrief })
}
