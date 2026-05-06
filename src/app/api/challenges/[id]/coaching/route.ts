import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getHatchContext } from '@/lib/v2/hatch-context'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'
import { z, ZodError } from 'zod'

const ROUTE_KEY = 'challenge_coaching'

const RequestSchema = z.object({
  attempt_id: z.string().uuid(),
  question_id: z.string().uuid(),
  option_id: z.string().uuid().nullable().optional(),
  step: z.enum(['frame', 'list', 'optimize', 'win']),
  role_id: z.string().max(100).optional(),
  user_text: z.string().max(50000).nullable().optional(),
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

function aiBudgetResponse(error: unknown) {
  if (!(error instanceof AiBudgetExceededError)) return null

  return apiError(402, 'limit_reached', 'limit_reached', {
    feature: 'hatch_ai_cents',
    used: error.used,
    limit: error.limit,
    windowDays: error.windowDays,
  })
}

function planLimitResponse(error: unknown) {
  if (!(error instanceof PlanLimitExceeded)) return null

  return apiError(402, 'limit_reached', 'limit_reached', {
    feature: error.feature,
    used: error.used,
    limit: error.limit,
    windowDays: error.windowDays,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')
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

  const { id: challengeId } = await params
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
  const { attempt_id, question_id, option_id, step, user_text } = body

  const admin = createAdminClient()

  // Fetch attempt to get role_id
  const { data: attempt, error: attemptError } = await admin
    .from('challenge_attempts')
    .select('role_id, user_id')
    .eq('id', attempt_id)
    .eq('user_id', user.id)
    .single()

  if (attemptError || !attempt) {
    return apiError(404, 'attempt_not_found', 'Attempt not found or unauthorized')
  }

  const roleId = attempt.role_id as string

  // Freeform path — no selected option
  if (!option_id) {
    const cacheKey = `${user.id}:${challengeId}:${step}:${question_id}:freeform`

    const { data: cached } = await admin
      .from('coaching_cache')
      .select('role_context, career_signal, hit_count')
      .eq('cache_key', cacheKey)
      .single()

    if (cached) {
      await admin
        .from('coaching_cache')
        .update({ hit_count: cached.hit_count + 1, last_hit_at: new Date().toISOString() })
        .eq('cache_key', cacheKey)
      return NextResponse.json({ role_context: cached.role_context, career_signal: cached.career_signal, cached: true })
    }

    // Cache miss — fetch question + challenge + role lens
    const [
      { data: question },
      { data: challenge },
      { data: roleLens },
    ] = await Promise.all([
      admin.from('step_questions').select('question_text').eq('id', question_id).single(),
      admin.from('challenges').select('scenario_context, scenario_trigger').eq('id', challengeId).single(),
      admin.from('role_lenses').select('label').eq('role_id', roleId).single(),
    ])

    const roleLabel = roleLens?.label ?? roleId
    const questionText = question?.question_text ?? ''
    const scenarioContext = challenge?.scenario_context ?? ''
    const scenarioTrigger = challenge?.scenario_trigger ?? ''
    const hatchContext = await getHatchContext(user.id, challengeId, step)

    const systemPrompt = `You are Hatch, a coach at HackProduct. You give personalized, career-relevant coaching to engineers practicing product thinking.`
    let userPrompt = `The learner is a ${roleLabel} who just answered the ${step} step.
Challenge: ${scenarioContext} ${scenarioTrigger}
Question: ${questionText}
Their answer: "${user_text ?? '(no answer provided)'}"`

    if (hatchContext) {
      userPrompt += `\n\nLearner context:\n${hatchContext}`
    }

    userPrompt += `

Generate two short paragraphs:
1. "role_context" (2-3 sentences): Connect their answer to a real-world situation a ${roleLabel} faces.
2. "career_signal" (1 sentence): How this skill/gap affects their career. Be concrete.

Tone: Direct, warm. Senior ${roleLabel} mentoring a junior. No filler.
Return ONLY JSON: {"role_context":"...","career_signal":"..."}`

    let message
    try {
      await assertPlanLimit(user.id, userPlan, 'hatch_chat_msgs')
      message = await guardedCachedMessage(systemPrompt, userPrompt, {
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        thinking: { type: 'adaptive' },
        budget,
      })
    } catch (error) {
      const planResponse = planLimitResponse(error)
      if (planResponse) return planResponse
      const response = aiBudgetResponse(error)
      if (response) return response
      throw error
    }

    const rawText = message.sanitized

    let role_context = ''
    let career_signal = ''
    try {
      const parsed = JSON.parse(rawText)
      role_context = parsed.role_context ?? ''
      career_signal = parsed.career_signal ?? ''
    } catch {
      const rcMatch = rawText.match(/"role_context"\s*:\s*"([^"]+)"/)
      const csMatch = rawText.match(/"career_signal"\s*:\s*"([^"]+)"/)
      role_context = rcMatch?.[1] ?? ''
      career_signal = csMatch?.[1] ?? ''
    }

    await admin.from('coaching_cache').upsert({
      cache_key: cacheKey,
      role_context,
      career_signal,
      hit_count: 0,
      last_hit_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    await admin
      .from('step_attempts')
      .update({ role_context, career_signal })
      .eq('attempt_id', attempt_id)
      .eq('question_id', question_id)

    return NextResponse.json({ role_context, career_signal, cached: false })
  }

  // Option-based path
  // Check global pre-generated cache first (covers all MCQ selections, all users)
  const globalKey = `global:${challengeId}:${step}:${question_id}:${option_id}:${roleId}`
  const { data: globalHit } = await admin
    .from('coaching_cache')
    .select('role_context, career_signal')
    .eq('cache_key', globalKey)
    .single()
  if (globalHit) {
    return NextResponse.json({
      role_context: globalHit.role_context,
      career_signal: globalHit.career_signal,
      cached: true,
    })
  }

  // Cache key: userId:challengeId:step:questionId:optionId:roleId
  const cacheKey = `${user.id}:${challengeId}:${step}:${question_id}:${option_id}:${roleId}`

  // Check coaching_cache for hit
  const { data: cached } = await admin
    .from('coaching_cache')
    .select('role_context, career_signal, hit_count')
    .eq('cache_key', cacheKey)
    .single()

  if (cached) {
    // Increment hit_count, update last_hit_at
    await admin
      .from('coaching_cache')
      .update({ hit_count: cached.hit_count + 1, last_hit_at: new Date().toISOString() })
      .eq('cache_key', cacheKey)
    return NextResponse.json({ role_context: cached.role_context, career_signal: cached.career_signal, cached: true })
  }

  // Cache miss — fetch all needed data in parallel
  const [
    { data: question },
    { data: option },
    { data: challenge },
    { data: roleLens },
  ] = await Promise.all([
    admin.from('step_questions')
      .select('question_text')
      .eq('id', question_id)
      .single(),
    admin.from('flow_options')
      .select('option_text, quality, explanation, framework_hint')
      .eq('id', option_id)
      .single(),
    admin.from('challenges')
      .select('scenario_context, scenario_trigger')
      .eq('id', challengeId)
      .single(),
    admin.from('role_lenses')
      .select('label, short_label')
      .eq('role_id', roleId)
      .single(),
  ])

  // Get best option for this question
  const { data: bestOption } = await admin
    .from('flow_options')
    .select('option_text')
    .eq('question_id', question_id)
    .eq('quality', 'best')
    .limit(1)
    .single()

  const roleLabel = roleLens?.label ?? roleId
  const selectedText = option?.option_text ?? ''
  const qualityLabel = option?.quality ?? ''
  const staticExplanation = option?.explanation ?? ''
  const frameworkHint = (option as Record<string, unknown>)?.framework_hint as string | null ?? null
  const bestText = bestOption?.option_text ?? ''
  const scenarioContext = challenge?.scenario_context ?? ''
  const scenarioTrigger = challenge?.scenario_trigger ?? ''
  const questionText = question?.question_text ?? ''

  // Get Hatch context for personalization
  const hatchContext = await getHatchContext(user.id, challengeId, step)

  // Build the prompt
  const systemPrompt = `You are Hatch, a coach at HackProduct. You give personalized, career-relevant coaching to engineers practicing product thinking.`

  let userPrompt = `The learner is a ${roleLabel} who just answered the ${step} step.
Challenge: ${scenarioContext} ${scenarioTrigger}
Question: ${questionText}
They selected: "${selectedText}" (${qualityLabel})
Best answer: "${bestText}"
Static explanation: ${staticExplanation}`

  if (hatchContext) {
    userPrompt += `\n\nLearner context:\n${hatchContext}`
  }

  userPrompt += `

Generate two short paragraphs:
1. "role_context" (2-3 sentences): Connect their choice to a real-world situation a ${roleLabel} faces.
2. "career_signal" (1 sentence): How this skill/gap affects their career. Be concrete.

Tone: Direct, warm. Senior ${roleLabel} mentoring a junior. No filler.
Return ONLY JSON: {"role_context":"...","career_signal":"..."}`

  let message
  try {
    await assertPlanLimit(user.id, userPlan, 'hatch_chat_msgs')
    message = await guardedCachedMessage(systemPrompt, userPrompt, {
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      thinking: { type: 'adaptive' },
      budget,
    })
  } catch (error) {
    const planResponse = planLimitResponse(error)
    if (planResponse) return planResponse
    const response = aiBudgetResponse(error)
    if (response) return response
    throw error
  }

  const rawText = message.sanitized

  let role_context = ''
  let career_signal = ''

  try {
    const parsed = JSON.parse(rawText)
    role_context = parsed.role_context ?? ''
    career_signal = parsed.career_signal ?? ''
  } catch {
    // If JSON parse fails, try to extract from text
    const rcMatch = rawText.match(/"role_context"\s*:\s*"([^"]+)"/)
    const csMatch = rawText.match(/"career_signal"\s*:\s*"([^"]+)"/)
    role_context = rcMatch?.[1] ?? ''
    career_signal = csMatch?.[1] ?? ''
  }

  // Store result in coaching_cache
  await admin.from('coaching_cache').upsert({
    cache_key: cacheKey,
    role_context,
    career_signal,
    hit_count: 0,
    last_hit_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  })

  // Update step_attempts with role_context and career_signal
  await admin
    .from('step_attempts')
    .update({ role_context, career_signal })
    .eq('attempt_id', attempt_id)
    .eq('question_id', question_id)

  return NextResponse.json({ role_context, career_signal, framework_hint: frameworkHint, cached: false })
}
