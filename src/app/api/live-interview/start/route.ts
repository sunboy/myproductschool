import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkUsageLimit, recordUsageEvent } from '@/lib/usage/check-limit'
import { buildPromptFromSession } from '@/lib/live-interview/build-prompt-from-session'

export async function POST(request: Request) {
  if (process.env.USE_MOCK_DATA === 'true') {
    return Response.json({ sessionId: 'mock-session-id', companyName: 'Uber', role: 'PM' })
  }

  const { companyId, roleId, challengeId, discipline } = await request.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  // Fetch profile for plan + admin status (early check before expensive lookups)
  const { data: profileForLimit } = await adminClient
    .from('profiles')
    .select('plan, role')
    .eq('id', user.id)
    .single()

  const isAdminUser = profileForLimit?.role === 'admin'
  const userPlanForLimit = profileForLimit?.plan ?? 'free'

  if (!isAdminUser) {
    const limitResult = await checkUsageLimit(user.id, 'interviews', userPlanForLimit)
    if (!limitResult.allowed) {
      return Response.json(
        {
          error: 'limit_reached',
          used: limitResult.used,
          limit: limitResult.limit,
          feature: 'interviews',
          windowDays: limitResult.windowDays,
        },
        { status: 402 }
      )
    }
  }

  const built = await buildPromptFromSession({
    adminClient,
    userId: user.id,
    companyId,
    roleId,
    challengeId,
    discipline,
  })

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .insert({
      user_id: user.id,
      company_id: companyId ?? null,
      role_id: roleId ?? 'PM',
      challenge_id: challengeId ?? null,
      status: 'active',
      started_at: new Date().toISOString(),
      system_prompt: built.systemPrompt,
      scenario_rubric: built.scenarioRubric,
      calibration_snapshot: built.calibrationSnapshot,
    })
    .select('id')
    .single()

  // Record usage event
  if (!isAdminUser) {
    await recordUsageEvent(user.id, 'interviews')
  }

  return Response.json({
    sessionId: session?.id,
    companyName: built.companyName,
    role: roleId ?? 'PM',
    scenarioTitle: built.scenarioTitle,
    challengeId: challengeId ?? null,
    discipline: built.effectiveDiscipline,
  })
}
