import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HATCH_SIMULATION_DEBRIEF_PROMPT } from '@/lib/hatch/system-prompt'
import { HatchFeedbackSchema, clampFeedbackScores } from '@/lib/hatch/feedback-schema'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'

const ROUTE_KEY = 'simulation_end'

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userPlan = await getUserPlanForBudget(user.id)

  const adminClient = createAdminClient()

  const [sessionResult, turnsResult] = await Promise.all([
    adminClient.from('simulation_sessions').select('*, company_profiles(name)').eq('id', id).eq('user_id', user.id).single(),
    adminClient.from('simulation_turns').select('role, content, turn_index').eq('session_id', id).order('turn_index', { ascending: true }),
  ])

  if (sessionResult.error || !sessionResult.data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (sessionResult.data.status === 'completed') return NextResponse.json(sessionResult.data.debrief_json)
  const shouldCallModel = !IS_MOCK && Boolean(process.env.ANTHROPIC_API_KEY)

  if (shouldCallModel) {
    const throttle = await rateLimit({
      key: `ai:${user.id}:${ROUTE_KEY}`,
      limit: userPlan === 'pro' ? 15 : 5,
      windowSec: 60,
    })

    if (!throttle.allowed) {
      const retryAfter = retryAfterSeconds(throttle.resetAt)
      return NextResponse.json(
        { error: 'rate_limited', retryAfter },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      )
    }
  }

  const transcript = (turnsResult.data ?? []).map(t => `${t.role === 'hatch' ? 'Interviewer' : 'Candidate'}: ${t.content}`).join('\n\n')

  let debrief: object
  if (!shouldCallModel) {
    debrief = { overall_score: 72, dimensions: [], strengths: ['Clear structure'], improvements: ['Add more metrics'], detected_patterns: [], interview_summary: 'Good overall performance.' }
  } else {
    try {
      await assertPlanLimit(user.id, userPlan, 'ai_grading_runs')

      const response = await guardedCachedMessage(
        HATCH_SIMULATION_DEBRIEF_PROMPT,
        `Interview transcript:\n\n${transcript}`,
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          budget: { userId: user.id, userPlan, route: ROUTE_KEY },
        }
      )
      const raw = response.sanitized || '{}'
      const parsed = JSON.parse(raw)
      const validated = HatchFeedbackSchema.safeParse(parsed)
      debrief = validated.success ? clampFeedbackScores(validated.data) : parsed
    } catch (error) {
      if (error instanceof PlanLimitExceeded) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            feature: error.feature,
            used: error.used,
            limit: error.limit,
            windowDays: error.windowDays,
          },
          { status: 402 }
        )
      }

      if (error instanceof AiBudgetExceededError) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            feature: 'hatch_ai_cents',
            used: error.used,
            limit: error.limit,
            windowDays: error.windowDays,
          },
          { status: 402 }
        )
      }

      throw error
    }
  }

  await adminClient.from('simulation_sessions').update({
    status: 'completed',
    debrief_json: debrief,
    completed_at: new Date().toISOString(),
  }).eq('id', id)

  // Insert hatch_context challenge_insight (fire-and-forget, non-mock only)
  if (!IS_MOCK && process.env.ANTHROPIC_API_KEY) {
    const debriefAny = debrief as { dimensions?: Array<{ dimension: string; score: number }> }
    const dimensions = debriefAny.dimensions ?? []
    let strongestDimension: string | undefined
    let weakestDimension: string | undefined
    if (dimensions.length > 0) {
      const sorted = [...dimensions].sort((a, b) => b.score - a.score)
      strongestDimension = sorted[0].dimension
      weakestDimension = sorted[sorted.length - 1].dimension
      // Only set weakest as a growth area if it's meaningfully lower than strongest
      if (sorted[0].score === sorted[sorted.length - 1].score) {
        weakestDimension = undefined
      }
    }
    const sessionData = sessionResult.data as { company_profiles?: { name?: string } | null }
    const companyName = sessionData.company_profiles?.name ?? undefined
    const contentStr = strongestDimension
      ? `Completed simulation${companyName ? ' "' + companyName + '"' : ''}. Strongest dimension: ${strongestDimension}. Growth area: ${weakestDimension ?? 'keep practising'}.`
      : `Completed simulation${companyName ? ' "' + companyName + '"' : ''}.`
    adminClient.from('hatch_context').insert({
      user_id: user.id,
      context_type: 'challenge_insight',
      content: contentStr,
      is_active: true,
      created_at: new Date().toISOString(),
    }).then(() => {}, () => {})
  }

  // Trigger achievement check
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/achievements/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-service-key': process.env.SUPABASE_SERVICE_ROLE_KEY ?? '' },
    body: JSON.stringify({ user_id: user.id, event_type: 'simulation_complete', event_value: 1 }),
  }).catch(() => {})

  return NextResponse.json(debrief)
}
