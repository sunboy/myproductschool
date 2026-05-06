import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoverageNote } from '@/lib/live-interview/system-prompt'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'

const ROUTE_KEY = 'live_interview_chat'

const RequestSchema = z.object({
  message: z.string().trim().min(1).max(20000),
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

  // Mock mode
  if (process.env.USE_MOCK_DATA === 'true') {
    return Response.json({
      reply: "Hold on, you jumped straight to a solution. What's the actual problem here? If I asked the user, what would they say is broken?",
    })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

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
  const { message } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError(503, 'hatch_unavailable', 'Hatch ran into a problem. Try again.')
  }

  const adminClient = createAdminClient()

  // Load session
  const { data: session } = await adminClient
    .from('live_interview_sessions')
    .select('system_prompt, status, flow_coverage, conversation_memory, started_at, challenge_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) return apiError(404, 'session_not_found', 'Session not found')
  if (session.status === 'completed') return apiError(410, 'session_ended', 'Session ended')

  // Load existing turns for conversation history
  const { data: turnsData, count, error: turnsError } = await adminClient
    .from('live_interview_turns')
    .select('role, content, turn_index', { count: 'exact' })
    .eq('session_id', id)
    .order('turn_index', { ascending: true })

  if (turnsError) return apiError(500, 'live_interview_turns_load_failed', 'Internal Server Error')
  const nextIndex = count ?? 0

  const conversation = [
    ...(turnsData ?? []).map((t) => `${t.role === 'hatch' ? 'Interviewer' : 'Candidate'}: ${t.content}`),
    `Candidate: ${message.trim()}`,
  ].join('\n\n')

  // Build dynamic context to inject alongside the stored system prompt
  const dynamicContext: string[] = []

  // FLOW coverage steering
  const flowCoverage = (session.flow_coverage ?? { frame: 0, list: 0, optimize: 0, win: 0 }) as Record<string, number>
  dynamicContext.push(buildCoverageNote(flowCoverage))

  // Conversation memory — salient items from earlier in the interview
  const memory = (session.conversation_memory ?? []) as string[]
  if (memory.length > 0) {
    dynamicContext.push(
      `[THINGS THE CANDIDATE HAS SAID]\n${memory.map((m) => `- ${m}`).join('\n')}\nReference these when relevant, especially contradictions.`
    )
  }

  // Time-based soft closing signal
  if (session.started_at) {
    const elapsed = (Date.now() - new Date(session.started_at).getTime()) / 1000 / 60
    if (elapsed >= 20) {
      dynamicContext.push(
        `[TIME CHECK] The interview has been going for ${Math.round(elapsed)} minutes. Start looking for a natural closing point when the candidate reaches a good stopping place.`
      )
    }
  }

  const fullSystemPrompt = [
    session.system_prompt ?? '',
    ...dynamicContext,
  ].join('\n\n')

  // Generate Hatch's response — no grading signals, pure conversation
  const model = 'claude-sonnet-4-6'
  const maxTokens = 600
  const userPlan = await getUserPlanForBudget(user.id)
  const throttle = await rateLimit({
    key: `ai:${user.id}:${ROUTE_KEY}`,
    limit: userPlan === 'pro' ? 15 : 5,
    windowSec: 60,
  })

  if (!throttle.allowed) {
    const retryAfter = retryAfterSeconds(throttle.resetAt)
    const response = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
    response.headers.set('Retry-After', String(retryAfter))
    return response
  }

  let reply = ''
  try {
    await assertPlanLimit(user.id, userPlan, 'live_interview_turns')

    const response = await guardedCachedMessage(fullSystemPrompt, `Interview transcript:\n\n${conversation}`, {
      model,
      max_tokens: maxTokens,
      budget: { userId: user.id, userPlan, route: ROUTE_KEY },
    })
    reply = response.sanitized
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

  // Save both turns to DB
  const { error: insertError } = await adminClient.from('live_interview_turns').insert([
    {
      session_id: id,
      turn_index: nextIndex,
      role: 'user',
      content: message.trim(),
    },
    {
      session_id: id,
      turn_index: nextIndex + 1,
      role: 'hatch',
      content: reply,
    },
  ])

  if (insertError) {
    console.error('Failed to save turns:', insertError)
    return apiError(500, 'live_interview_turn_save_failed', 'Failed to save turn')
  }

  // Update total turns
  await adminClient
    .from('live_interview_sessions')
    .update({ total_turns: nextIndex + 2 })
    .eq('id', id)

  // Fire async grading — non-blocking, don't await
  const recentTurns = [
    // Include last 2 existing turns for context + the new exchange
    ...(turnsData ?? []).slice(-2).map((t) => ({
      role: t.role as 'user' | 'hatch',
      content: t.content,
    })),
    { role: 'user' as const, content: message.trim() },
    { role: 'hatch' as const, content: reply },
  ]

  const origin = request.headers.get('origin') ?? request.headers.get('host') ?? ''
  const protocol = origin.startsWith('http') ? '' : 'http://'
  const gradeUrl = `${protocol}${origin}/api/live-interview/${id}/grade-turn`

  fetch(gradeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recentTurns, challengeId: session.challenge_id, turnIndex: nextIndex }),
  }).catch((err) => {
    console.error('Async grade-turn failed:', err)
  })

  return Response.json({ reply })
}
