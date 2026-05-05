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
import type { FlowStep } from '@/lib/types'

const MOCK_NUDGES = [
  "You've identified the problem well. What data would tell you *why* users aren't taking this action?",
  "Good start on the solution. What's the biggest risk of building this, and how would you validate the idea first?",
  "Your metric choice is reasonable. What are you willing to let get worse in order to improve it — what's the guardrail?",
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
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userPlan = await getUserPlanForBudget(user.id)
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
      return NextResponse.json({ error: 'Nudge limit reached', remaining: 0 }, { status: 429 })
    }

    // Record nudge usage.
    // TODO: add a unique constraint on (user_id, attempt_id, nudge_sequence) to eliminate the
    // TOCTOU race between the count check above and this insert. Until then, concurrent requests
    // may exceed the limit by one nudge before either insert is committed.
    try {
      await adminClient.from('nudge_usage').insert({ user_id: user.id, attempt_id: attemptId })
    } catch (insertError) {
      // If insert fails due to a unique constraint violation treat it as rate-limited.
      console.warn('nudge_usage insert failed (possible race / constraint):', insertError)
      return NextResponse.json({ error: 'Nudge limit reached', remaining: 0 }, { status: 429 })
    }
  }

  try {
    await assertPlanLimit(user.id, userPlan, 'hatch_nudges')
  } catch (error) {
    if (error instanceof PlanLimitExceeded) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          used: error.used,
          limit: error.limit,
          feature: error.feature,
          windowDays: error.windowDays,
        },
        { status: 402 }
      )
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

    console.error('Hatch nudge error:', error)
    return NextResponse.json({ nudge: null })
  }
}
