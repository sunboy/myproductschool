import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { parseGradingSignal } from '@/lib/live-interview/parse-grading-signal'
import { applyCoverageCredit, type FlowMove } from '@/lib/live-interview/flow-coverage-credits'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'

const ROUTE_KEY = 'live_interview_turn'

const RequestSchema = z.object({
  messages: z.array(z.object({
    role: z.string().min(1).max(40),
    content: z.string().max(20000),
  })).min(1).max(100),
})

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (process.env.USE_MOCK_DATA === 'true') {
    return Response.json({
      choices: [{
        message: {
          role: 'assistant',
          content: "That's a great point. Can you tell me more about who specifically is affected by this problem?",
        },
        finish_reason: 'stop',
      }],
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }
  const { messages } = body

  const adminClient = createAdminClient()

  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session || session.status !== 'active') {
    return apiError(404, 'session_not_found', 'Session not found or not active')
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''

  // Get existing turns
  const { data: turns, count } = await adminClient
    .from('live_interview_turns')
    .select('role, content, turn_index', { count: 'exact' })
    .eq('session_id', id)
    .order('turn_index', { ascending: true })

  const turnCount = count ?? 0

  const conversation = [
    ...(turns ?? []).map((t) => `${t.role === 'hatch' ? 'Interviewer' : 'Candidate'}: ${t.content}`),
    `Candidate: ${lastUserMsg}`,
  ].join('\n\n')

  // Call Claude with multi-turn messages format
  const model = 'claude-sonnet-4-6'
  const maxTokens = 300
  const sessionUserId = user.id
  const userPlan = await getUserPlanForBudget(sessionUserId)
  const throttle = await rateLimit({
    key: `ai:${sessionUserId}:${ROUTE_KEY}`,
    limit: userPlan === 'pro' ? 15 : 5,
    windowSec: 60,
  })

  if (!throttle.allowed) {
    const retryAfter = retryAfterSeconds(throttle.resetAt)
    const response = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
    response.headers.set('Retry-After', String(retryAfter))
    return response
  }

  const systemPrompt = session.system_prompt ?? ''

  let rawContent = ''
  try {
    await assertPlanLimit(sessionUserId, userPlan, 'live_interview_turns')

    const response = await guardedCachedMessage(systemPrompt, `Interview transcript:\n\n${conversation}`, {
      model,
      max_tokens: maxTokens,
      budget: { userId: sessionUserId, userPlan, route: ROUTE_KEY },
    })
    rawContent = response.sanitized
  } catch (error) {
    if (error instanceof PlanLimitExceeded) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: error.feature,
        used: error.used,
        limit: error.limit,
        windowDays: error.windowDays,
      })
    }

    if (error instanceof AiBudgetExceededError) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: 'hatch_ai_cents',
        used: error.used,
        limit: error.limit,
        windowDays: error.windowDays,
      })
    }
    throw error
  }

  const { cleanContent, signal } = parseGradingSignal(rawContent)

  // Save turns and update session in parallel.
  // FLOW coverage is credited against the user's turn_index (`nextIndex`) so
  // a later /grade-turn pass on the same turn is a no-op.
  const nextIndex = turnCount
  const creditResult = signal?.flowMove
    ? applyCoverageCredit({
        coverage: session.flow_coverage,
        credits: (session as { flow_coverage_credits?: Record<string, number[]> | null }).flow_coverage_credits,
        move: signal.flowMove as FlowMove,
        turnIndex: nextIndex,
      })
    : null

  const sessionUpdate: Record<string, unknown> = { total_turns: nextIndex + 2 }
  if (creditResult?.credited) {
    sessionUpdate.flow_coverage = creditResult.coverage
    sessionUpdate.flow_coverage_credits = creditResult.credits
  }

  await Promise.all([
    adminClient.from('live_interview_turns').insert([
      {
        session_id: id,
        turn_index: nextIndex,
        role: 'user',
        content: lastUserMsg,
      },
      {
        session_id: id,
        turn_index: nextIndex + 1,
        role: 'hatch',
        content: cleanContent,
        flow_move_detected: signal?.flowMove || null,
        competency_signals: signal ? { competency: signal.competency, signal: signal.signal } : null,
      },
    ]),
    adminClient
      .from('live_interview_sessions')
      .update(sessionUpdate)
      .eq('id', id),
  ])

  return Response.json({
    choices: [{
      message: { role: 'assistant', content: cleanContent },
      finish_reason: 'stop',
    }],
  })
}
