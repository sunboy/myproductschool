import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { HATCH_NUDGE_SYSTEM_PROMPT, MENTAL_MODELS_CONTEXT, buildNudgeUserPrompt } from '@/lib/hatch/system-prompt'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { getReasoningMove } from '@/lib/v2/skills/rubric-loader'
import { apiError } from '@/lib/api/error'
import type { FlowStep } from '@/lib/types'

const MOCK_NUDGES = [
  "You've identified the problem well. What data would tell you *why* users aren't taking this action?",
  "Good start on the solution. What's the biggest risk of building this, and how would you validate the idea first?",
  "Your metric choice is reasonable. What are you willing to let get worse in order to improve it - what's the guardrail?",
  "You've described features, but what's the user's underlying job-to-be-done here?",
]

const ROUTE_KEY = 'hatch_nudge'
const RequestSchema = z.object({
  challengePrompt: z.string().max(20000).nullable().optional(),
  draft: z.string().max(50000).nullable().optional(),
  attemptId: z.string().uuid().nullable().optional(),
  step: z.enum(['frame', 'list', 'optimize', 'win']).nullable().optional(),
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

export async function POST(req: NextRequest) {
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }
  const { challengePrompt, draft, attemptId, step } = body

  if (!draft?.trim()) {
    return NextResponse.json({ nudge: null })
  }

  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    const randomNudge = MOCK_NUDGES[Math.floor(Math.random() * MOCK_NUDGES.length)]
    return NextResponse.json({ nudge: randomNudge })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError(401, 'auth_required', 'Unauthorized')
  }

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

  const budget = { userId: user.id, userPlan, route: ROUTE_KEY }

  // Nudge rate limiting
  if (attemptId) {
    const adminClient = createAdminClient()
    const { count } = await adminClient
      .from('nudge_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('attempt_id', attemptId)

    if ((count ?? 0) >= 3) {
      return apiError(429, 'nudge_limit_reached', 'Nudge limit reached', { remaining: 0 })
    }

    const nudgeSequence = (count ?? 0) + 1

    try {
      await adminClient.from('nudge_usage').insert({
        user_id: user.id,
        attempt_id: attemptId,
        nudge_sequence: nudgeSequence,
      })
    } catch {
      // If insert fails due to a unique constraint violation treat it as rate-limited.
      return apiError(429, 'nudge_limit_reached', 'Nudge limit reached', { remaining: 0 })
    }
  }

  try {
    await assertPlanLimit(user.id, userPlan, 'hatch_nudges')
  } catch (error) {
    if (error instanceof PlanLimitExceeded) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        used: error.used,
        limit: error.limit,
        feature: error.feature,
        windowDays: error.windowDays,
      })
    }

    throw error
  }

  try {
    const flowStep: FlowStep | undefined = step ?? undefined

    let userPrompt = buildNudgeUserPrompt(challengePrompt ?? '', draft)
    if (flowStep) {
      const reasoningMove = getReasoningMove(flowStep)
      userPrompt += `\n\nThe user is currently on the ${flowStep} step, practicing: ${reasoningMove}. Reference this reasoning move in your nudge.`
    }

    const systemPrompt = HATCH_NUDGE_SYSTEM_PROMPT + '\n\n' + MENTAL_MODELS_CONTEXT

    const message = await guardedCachedMessage(systemPrompt, userPrompt, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      budget,
    })

    const nudge = message.sanitized.trim() || null
    return NextResponse.json({ nudge })
  } catch (error) {
    if (error instanceof AiBudgetExceededError) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: 'hatch_ai_cents',
        used: error.used,
        limit: error.limit,
        windowDays: error.windowDays,
      })
    }

    console.error('Hatch nudge error:', error)
    return NextResponse.json({ nudge: null })
  }
}
