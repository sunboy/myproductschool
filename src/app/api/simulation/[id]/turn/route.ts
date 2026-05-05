import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HATCH_CHAT_SYSTEM_PROMPT } from '@/lib/hatch/system-prompt'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { getHatchContext, buildHatchContextString } from '@/lib/hatch-context'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { z, ZodError } from 'zod'

const ROUTE_KEY = 'simulation_turn'

const RequestSchema = z.object({
  content: z.string().trim().min(1).max(20000),
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
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userPlan = await getUserPlanForBudget(user.id)

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { content } = body
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

  const adminClient = createAdminClient()

  const { data: session, error: sessionError } = await adminClient
    .from('simulation_sessions')
    .select('*, company_profiles(name, industry, product_focus, interview_style), challenges(title, prompt_text)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.status === 'completed') return NextResponse.json({ error: 'Session already completed' }, { status: 400 })

  const [existingTurnsResult, hatchCtx] = await Promise.all([
    adminClient
      .from('simulation_turns')
      .select('role, content, turn_index')
      .eq('session_id', id)
      .order('turn_index', { ascending: true }),
    getHatchContext(user.id),
  ])

  const existingTurns = existingTurnsResult.data
  const nextTurnIndex = (existingTurns?.length ?? 0)

  const companyContext = session.company_profiles
    ? `\n\nYou are interviewing for ${session.company_profiles.name} (${session.company_profiles.industry}). Interview style: ${session.company_profiles.interview_style}.`
    : ''
  const challengeContext = session.challenges
    ? `\n\nChallenge prompt: ${session.challenges.prompt_text}`
    : ''
  const candidateContext = buildHatchContextString(hatchCtx, 'chat')
  const baseSystemPrompt = HATCH_CHAT_SYSTEM_PROMPT + companyContext + challengeContext
  const systemPrompt = baseSystemPrompt + (candidateContext ? '\n\n## Candidate Profile\n' + candidateContext : '')

  const conversation = [
    ...(existingTurns ?? []).map(t => `${t.role === 'hatch' ? 'Interviewer' : 'Candidate'}: ${t.content}`),
    `Candidate: ${content}`,
  ].join('\n\n')

  let hatchReply: string
  if (!shouldCallModel) {
    hatchReply = "That's an interesting perspective. Can you walk me through how you'd measure the success of that approach? What specific metrics would you track in the first 30 days?"
  } else {
    try {
      await assertPlanLimit(user.id, userPlan, 'simulation_turns')

      const response = await guardedCachedMessage(systemPrompt, `Interview transcript:\n\n${conversation}`, {
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        budget: { userId: user.id, userPlan, route: ROUTE_KEY },
      })
      hatchReply = response.sanitized
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

  await adminClient.from('simulation_turns').insert([
    { session_id: id, role: 'user', content, turn_index: nextTurnIndex },
    { session_id: id, role: 'hatch', content: hatchReply, turn_index: nextTurnIndex + 1 },
  ])

  const questionsRemaining = Math.max(0, 5 - Math.floor((nextTurnIndex + 2) / 2))

  return NextResponse.json({ reply: hatchReply, turn_index: nextTurnIndex + 1, questions_remaining: questionsRemaining })
}
