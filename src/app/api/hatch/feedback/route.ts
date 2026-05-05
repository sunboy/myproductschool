import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
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
import {
  buildCompetencySignal,
  computeChallengeCompetencyRollup,
  type CompetencySignalInput,
  type MentalModelBreakdownItem,
} from '@/lib/scoring/competency-rollup'
import { FLOW_MAX_SCORE } from '@/lib/scoring/flow-scale'

const ROUTE_KEY = 'hatch_feedback'
const V2_ROUTE_KEY = 'hatch_feedback_v2'

const RequestSchema = z.object({
  challengeId: z.string().max(200).nullable().optional(),
  challengeTitle: z.string().max(1000).nullable().optional(),
  challengePrompt: z.string().max(50000).nullable().optional(),
  response: z.string().max(100000).nullable().optional(),
  attemptId: z.string().uuid().nullable().optional(),
  attempt_id: z.string().uuid().nullable().optional(),
}).superRefine((body, ctx) => {
  if (!body.attempt_id && !body.response?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['response'],
      message: 'response is required unless attempt_id is provided',
    })
  }
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function mergeModelBreakdown(
  rollupBreakdown: MentalModelBreakdownItem[],
  modelBreakdown: Array<{ competency?: string; demonstrated?: string; missed?: string; score?: number }> | undefined
) {
  return rollupBreakdown.map((item, index) => {
    const modelItem = modelBreakdown?.[index]
    if (!modelItem) return item
    return {
      ...item,
      competency: modelItem.competency ?? item.competency,
      demonstrated: modelItem.demonstrated?.trim() || item.demonstrated,
      missed: modelItem.missed?.trim() || item.missed,
      score: typeof modelItem.score === 'number' ? Math.round(modelItem.score) : item.score,
    }
  })
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
  const { challengeId: _challengeId, challengeTitle, challengePrompt, response: userResponse, attemptId, attempt_id } = body

  // V2 path: activated when attempt_id is provided (FLOW-based attempts)
  const v2AttemptId = attempt_id ?? undefined
  if (v2AttemptId) {
    return handleV2Feedback(v2AttemptId, _challengeId ?? undefined)
  }

  // ── V1 path (legacy) ──────────────────────────────────────

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
      userResponse ?? ''
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
    .select('id, challenge_id, user_id, role_id, feedback_json')
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
    .select('step, question_id, selected_option_id, user_text, score, competencies_demonstrated, quality_label, grading_explanation, competency_signal')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })

  if (stepsError || !stepAttempts?.length) {
    return NextResponse.json({ error: 'No step attempts found' }, { status: 404 })
  }

  const questionIds = stepAttempts
    .map((attempt) => attempt.question_id)
    .filter((questionId): questionId is string => typeof questionId === 'string' && questionId.length > 0)

  const { data: questionRows } = questionIds.length > 0
    ? await admin
        .from('step_questions')
        .select('id, grading_weight_within_step, target_competencies')
        .in('id', questionIds)
    : { data: [] }

  const questionMetaMap = new Map<string, { weight: number; targetCompetencies: string[] }>(
    (questionRows ?? []).map((question: { id: string; grading_weight_within_step?: number | null; target_competencies?: string[] | null }) => [
      question.id,
      {
        weight: question.grading_weight_within_step ?? 1,
        targetCompetencies: question.target_competencies ?? [],
      },
    ])
  )

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
      const feedbackSteps = Array.isArray(feedback.steps) ? feedback.steps : []
      const signalByStep = new Map<string, CompetencySignalInput['competency_signal']>()

      for (const stepFeedback of feedbackSteps) {
        if (!stepFeedback || typeof stepFeedback !== 'object') continue
        const step = String(stepFeedback.step ?? '')
        const weightedScore = typeof stepFeedback.weighted_score === 'number'
          ? stepFeedback.weighted_score * FLOW_MAX_SCORE
          : undefined
        const stepSummary = typeof stepFeedback.step_summary === 'string' ? stepFeedback.step_summary : null
        const signalRaw = stepFeedback.competency_signal && typeof stepFeedback.competency_signal === 'object'
          ? stepFeedback.competency_signal as { primary?: string; competency?: string; signal?: string; framework_hint?: string }
          : null
        const signal = buildCompetencySignal({
          step,
          score: weightedScore,
          grading_explanation: stepSummary,
          competency_signal: signalRaw
            ? {
                competency: signalRaw.competency ?? signalRaw.primary,
                primary: signalRaw.primary,
                signal: signalRaw.signal,
                framework_hint: signalRaw.framework_hint,
              }
            : null,
        })
        signalByStep.set(step, signal)
      }

      for (const [step, signal] of signalByStep.entries()) {
        await admin
          .from('step_attempts')
          .update({ competency_signal: signal })
          .eq('attempt_id', attemptId)
          .eq('step', step)
          .is('competency_signal', null)
      }

      const rollupRows: CompetencySignalInput[] = stepAttempts.map((row: {
        step: string
        question_id: string
        score: number | null
        competencies_demonstrated?: string[] | null
        quality_label?: string | null
        grading_explanation?: string | null
        competency_signal?: CompetencySignalInput['competency_signal']
      }) => {
        const questionMeta = questionMetaMap.get(row.question_id)
        return {
          step: row.step,
          score: row.score ?? 0,
          weight: questionMeta?.weight ?? 1,
          target_competencies: questionMeta?.targetCompetencies ?? [],
          competencies_demonstrated: row.competencies_demonstrated ?? [],
          grading_explanation: row.grading_explanation ?? null,
          quality_label: row.quality_label ?? null,
          competency_signal: signalByStep.get(row.step) ?? row.competency_signal ?? null,
        }
      })
      const rollup = computeChallengeCompetencyRollup(rollupRows)
      const mentalModelsBreakdown = mergeModelBreakdown(
        rollup.mentalModelsBreakdown,
        Array.isArray(feedback.mental_models_breakdown) ? feedback.mental_models_breakdown : undefined
      )

      await admin
        .from('challenge_attempts')
        .update({
          mental_models_breakdown: mentalModelsBreakdown,
          primary_competency: rollup.primaryCompetency,
          weakest_competency: rollup.weakestCompetency,
          feedback_json: {
            ...asRecord(attempt.feedback_json),
            hatch_feedback: feedback,
            mental_models_breakdown: mentalModelsBreakdown,
            primary_competency: rollup.primaryCompetency,
            weakest_competency: rollup.weakestCompetency,
            competency_scores: rollup.competencyScores,
          },
        })
        .eq('id', attemptId)

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

      return NextResponse.json({
        ...feedback,
        mental_models_breakdown: mentalModelsBreakdown,
        primary_competency: rollup.primaryCompetency,
        weakest_competency: rollup.weakestCompetency,
        version: 'v2',
      })
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
