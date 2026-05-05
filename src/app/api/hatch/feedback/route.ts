import { NextRequest, NextResponse } from 'next/server'
import {
  HATCH_FEEDBACK_SYSTEM_PROMPT,
  HATCH_FEEDBACK_SYSTEM_PROMPT_V2,
  HATCH_CORE_IDENTITY,
  MENTAL_MODELS_CONTEXT,
  buildFeedbackUserPrompt
} from '@/lib/hatch/system-prompt'
import { MOCK_FEEDBACK, MOCK_FEEDBACK_FULL } from '@/lib/mock-data'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { HatchFeedbackSchema, clampFeedbackScores, V2FeedbackSchema, clampV2FeedbackScores } from '@/lib/hatch/feedback-schema'
import { logEvent } from '@/lib/data/events'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'

const ROUTE_KEY = 'hatch_feedback'
const V2_ROUTE_KEY = 'hatch_feedback_v2'

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

async function getAuthenticatedUserId() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user.id
}

async function throttleFeedback(userId: string, userPlan: string) {
  const throttle = await rateLimit({
    key: `ai:${userId}:${ROUTE_KEY}`,
    limit: userPlan === 'pro' ? 15 : 5,
    windowSec: 60,
  })

  if (throttle.allowed) return null

  const retryAfter = retryAfterSeconds(throttle.resetAt)
  return NextResponse.json(
    { error: 'rate_limited', retryAfter },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    }
  )
}

function planLimitResponse(error: PlanLimitExceeded) {
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

export async function POST(req: NextRequest) {
  const { challengeId: _challengeId, challengeTitle, challengePrompt, response: userResponse, attemptId, attempt_id } = await req.json()

  // V2 path: activated when attempt_id is provided (FLOW-based attempts)
  const v2AttemptId = attempt_id as string | undefined
  if (v2AttemptId) {
    return handleV2Feedback(v2AttemptId, _challengeId)
  }

  // ── V1 path (legacy) ──────────────────────────────────────

  if (!userResponse?.trim()) {
    return NextResponse.json({ error: 'No response provided' }, { status: 400 })
  }

  // Mock mode: return fixture feedback as a stream
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(MOCK_FEEDBACK_FULL)
  }

  const authenticatedUserId = await getAuthenticatedUserId()
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userPlan = await getUserPlanForBudget(authenticatedUserId)
  const throttleResponse = await throttleFeedback(authenticatedUserId, userPlan)
  if (throttleResponse) return throttleResponse

  try {
    const supabaseAdmin = createAdminClient()
    const ownedAttemptId = typeof attemptId === 'string' ? attemptId : null
    if (ownedAttemptId) {
      const { data: ownedAttempt } = await supabaseAdmin
        .from('challenge_attempts')
        .select('id')
        .eq('id', ownedAttemptId)
        .eq('user_id', authenticatedUserId)
        .maybeSingle()

      if (!ownedAttempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
      }
    }

    await assertPlanLimit(authenticatedUserId, userPlan, 'ai_grading_runs')

    const budget = { userId: authenticatedUserId, userPlan, route: ROUTE_KEY }

    const userContent = buildFeedbackUserPrompt(
      challengeTitle ?? 'Product Challenge',
      challengePrompt ?? '',
      userResponse
    )

    const message = await guardedCachedMessage(HATCH_FEEDBACK_SYSTEM_PROMPT, userContent, {
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      budget,
    })

    // Attempt 1: parse and validate
    let parsedFeedback
    const rawText = message.sanitized || '{}'

    try {
      const parsed = JSON.parse(rawText)
      const validated = HatchFeedbackSchema.safeParse(parsed)

      if (validated.success) {
        parsedFeedback = clampFeedbackScores(validated.data)
      } else {
        // Retry once with stricter prompt
        const retryResponse = await guardedCachedMessage(
          HATCH_FEEDBACK_SYSTEM_PROMPT + '\n\nCRITICAL: Return ONLY a valid JSON object. No markdown, no explanation, no code blocks. Raw JSON only.',
          'The JSON was invalid. Return only the raw JSON object with no surrounding text.\n\nOriginal response:\n' + rawText,
          { model: 'claude-sonnet-4-6', max_tokens: 1500, budget }
        )
        const retryText = retryResponse.sanitized || '{}'
        const retryParsed = JSON.parse(retryText)
        const retryValidated = HatchFeedbackSchema.safeParse(retryParsed)
        parsedFeedback = retryValidated.success ? clampFeedbackScores(retryValidated.data) : retryParsed
      }
    } catch {
      return NextResponse.json({ error: 'Failed to parse Hatch feedback' }, { status: 500 })
    }

    // Persist detected patterns to DB
    if (parsedFeedback.detected_patterns?.length) {
      try {
        await supabaseAdmin.from('user_failure_patterns').insert(
          parsedFeedback.detected_patterns.map((p: { pattern_id: string; pattern_name: string; confidence: number; evidence: string; question?: string }) => ({
            user_id: authenticatedUserId,
            attempt_id: ownedAttemptId,
            pattern_id: p.pattern_id,
            pattern_name: p.pattern_name,
            confidence: p.confidence,
            evidence: p.evidence,
            question: p.question ?? null,
          }))
        )
      } catch (err) {
        // Non-fatal: log but don't fail the feedback response
        console.error('Failed to persist failure patterns:', err)
      }
    }

    // Log feedback generated event
    logEvent(authenticatedUserId, 'session.feedback_generated', { attempt_id: ownedAttemptId, challenge_id: _challengeId ?? null })

    return NextResponse.json(parsedFeedback)
  } catch (error) {
    if (error instanceof PlanLimitExceeded) {
      return planLimitResponse(error)
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

    console.error('Hatch feedback error:', error)
    // Fall back to mock on error
    return NextResponse.json(MOCK_FEEDBACK)
  }
}

// ── V2 Feedback Handler (FLOW-based) ──────────────────────────

async function handleV2Feedback(attemptId: string, challengeId: string | undefined) {
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(MOCK_FEEDBACK_FULL)
  }

  const authenticatedUserId = await getAuthenticatedUserId()
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userPlan = await getUserPlanForBudget(authenticatedUserId)
  const throttleResponse = await throttleFeedback(authenticatedUserId, userPlan)
  if (throttleResponse) return throttleResponse

  const admin = createAdminClient()

  // Fetch attempt with challenge info
  const { data: attempt, error: attemptError } = await admin
    .from('challenge_attempts')
    .select('id, challenge_id, user_id, role_id')
    .eq('id', attemptId)
    .eq('user_id', authenticatedUserId)
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }
  const budget = {
    userId: authenticatedUserId,
    userPlan,
    route: V2_ROUTE_KEY,
  }

  // Fetch all step_attempts for this attempt
  const { data: stepAttempts, error: stepsError } = await admin
    .from('step_attempts')
    .select('step, question_id, selected_option_id, user_text, competency_signal')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })

  if (stepsError || !stepAttempts?.length) {
    return NextResponse.json({ error: 'No step attempts found' }, { status: 404 })
  }

  // Fetch challenge context
  const { data: challenge } = await admin
    .from('challenges')
    .select('title, scenario_context, scenario_trigger')
    .eq('id', attempt.challenge_id)
    .single()

  // Group step attempts by step
  const stepGroups: Record<string, typeof stepAttempts> = {}
  for (const sa of stepAttempts) {
    const step = sa.step as string
    if (!stepGroups[step]) stepGroups[step] = []
    stepGroups[step].push(sa)
  }

  // Build per-step summaries for the prompt
  const stepSummaries = Object.entries(stepGroups).map(([step, attempts]) => {
    const answers = attempts.map(a => {
      if (a.user_text) return `  Freeform: "${a.user_text}"`
      if (a.selected_option_id) return `  Selected option: ${a.selected_option_id}`
      return '  (no answer)'
    }).join('\n')
    const signals = attempts
      .filter(a => a.competency_signal)
      .map(a => `  Signal: ${JSON.stringify(a.competency_signal)}`)
      .join('\n')
    return `### ${step.toUpperCase()} step\n${answers}${signals ? '\n' + signals : ''}`
  }).join('\n\n')

  const userContent = `Challenge: ${challenge?.title ?? 'Unknown'}
Context: ${challenge?.scenario_context ?? ''} ${challenge?.scenario_trigger ?? ''}

## Learner's FLOW Responses

${stepSummaries}

Evaluate each FLOW step using its rubric criteria (F1-F4, L1-L4, O1-O4, W1-W4).
Return valid JSON only.`

  const systemPrompt = HATCH_CORE_IDENTITY + '\n\n' + MENTAL_MODELS_CONTEXT + '\n\n' + HATCH_FEEDBACK_SYSTEM_PROMPT_V2

  try {
    await assertPlanLimit(authenticatedUserId, userPlan, 'ai_grading_runs')

    const message = await guardedCachedMessage(systemPrompt, userContent, {
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      budget,
    })

    const rawText = message.sanitized || '{}'

    try {
      const parsed = JSON.parse(rawText)
      const validated = V2FeedbackSchema.safeParse(parsed)

      const feedback = validated.success ? clampV2FeedbackScores(validated.data) : parsed

      // Persist detected patterns
      if (feedback.detected_patterns?.length) {
        try {
          await admin.from('user_failure_patterns').insert(
            feedback.detected_patterns.map((p: { pattern_id: string; pattern_name: string; confidence: number; evidence: string; question?: string }) => ({
              user_id: authenticatedUserId,
              attempt_id: attemptId,
              pattern_id: p.pattern_id,
              pattern_name: p.pattern_name,
              confidence: p.confidence,
              evidence: p.evidence,
              question: p.question ?? null,
            }))
          )
        } catch (err) {
          console.error('Failed to persist failure patterns:', err)
        }
      }

      logEvent(authenticatedUserId, 'session.feedback_generated', { attempt_id: attemptId, challenge_id: challengeId ?? attempt.challenge_id, version: 'v2' })

      return NextResponse.json({ ...feedback, version: 'v2' })
    } catch {
      return NextResponse.json({ error: 'Failed to parse v2 feedback' }, { status: 500 })
    }
  } catch (error) {
    if (error instanceof PlanLimitExceeded) {
      return planLimitResponse(error)
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

    console.error('Hatch v2 feedback error:', error)
    return NextResponse.json(MOCK_FEEDBACK)
  }
}
