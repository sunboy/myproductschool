import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { HATCH_NUDGE_SYSTEM_PROMPT, MENTAL_MODELS_CONTEXT } from '@/lib/hatch/system-prompt'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { getReasoningMove } from '@/lib/v2/skills/rubric-loader'
import { createClient } from '@/lib/supabase/server'
import { getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { rateLimit } from '@/lib/security/rate-limit'
import type { FlowStep } from '@/lib/types'

const ROUTE_KEY = 'hatch_nudge_warmup'
const RequestSchema = z.object({
  step: z.enum(['frame', 'list', 'optimize', 'win']).optional(),
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
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userPlan = await getUserPlanForBudget(user.id)
  const throttle = await rateLimit({
    key: `ai:${user.id}:${ROUTE_KEY}`,
    limit: userPlan === 'pro' ? 30 : 10,
    windowSec: 60,
  })

  if (!throttle.allowed) {
    const retryAfter = retryAfterSeconds(throttle.resetAt)
    return NextResponse.json(
      { ok: false, error: 'rate_limited', retryAfter },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const flowStep = body.step as FlowStep | undefined

    let userPrompt = 'Warmup call — priming prompt cache.'
    if (flowStep) {
      const reasoningMove = getReasoningMove(flowStep)
      userPrompt += ` Step: ${flowStep}. Reasoning move: ${reasoningMove}.`
    }

    const systemPrompt = HATCH_NUDGE_SYSTEM_PROMPT + '\n\n' + MENTAL_MODELS_CONTEXT

    // max_tokens: 1 seeds Anthropic's 5-minute prompt cache at near-zero cost
    await guardedCachedMessage(systemPrompt, userPrompt, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
    })
  } catch {
    // Warmup failure is silent — never surface to client
  }

  return NextResponse.json({ ok: true })
}
