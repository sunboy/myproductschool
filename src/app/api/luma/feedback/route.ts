import { NextRequest, NextResponse } from 'next/server'
import {
  LUMA_FEEDBACK_SYSTEM_PROMPT,
  LUMA_FEEDBACK_SYSTEM_PROMPT_V2,
  LUMA_CORE_IDENTITY,
  MENTAL_MODELS_CONTEXT,
  buildFeedbackUserPrompt
} from '@/lib/luma/system-prompt'
import { MOCK_FEEDBACK, MOCK_FEEDBACK_FULL } from '@/lib/mock-data'
import { createAdminClient } from '@/lib/supabase/admin'
import { LumaFeedbackSchema, clampFeedbackScores, V2FeedbackSchema, clampV2FeedbackScores } from '@/lib/luma/feedback-schema'
import { logEvent } from '@/lib/data/events'
import { createCachedMessage } from '@/lib/anthropic/cached-client'

export async function POST(req: NextRequest) {
  const { challengeId: _challengeId, challengeTitle, challengePrompt, response: userResponse, userId, attemptId, attempt_id } = await req.json()

  // V2 path: activated when attempt_id is provided (FLOW-based attempts)
  const v2AttemptId = attempt_id as string | undefined
  if (v2AttemptId) {
    return handleV2Feedback(v2AttemptId, userId, _challengeId)
  }

  // ── V1 path (legacy) ──────────────────────────────────────

  if (!userResponse?.trim()) {
    return NextResponse.json({ error: 'No response provided' }, { status: 400 })
  }

  // Mock mode: return fixture feedback as a stream
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(MOCK_FEEDBACK_FULL)
  }

  try {
    const userContent = buildFeedbackUserPrompt(
      challengeTitle ?? 'Product Challenge',
      challengePrompt ?? '',
      userResponse
    )

    const message = await createCachedMessage(LUMA_FEEDBACK_SYSTEM_PROMPT, userContent, {
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
    })

    // Attempt 1: parse and validate
    let parsedFeedback
    const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}'

    try {
      const parsed = JSON.parse(rawText)
      const validated = LumaFeedbackSchema.safeParse(parsed)

      if (validated.success) {
        parsedFeedback = clampFeedbackScores(validated.data)
      } else {
        // Retry once with stricter prompt
        const retryResponse = await createCachedMessage(
          LUMA_FEEDBACK_SYSTEM_PROMPT + '\n\nCRITICAL: Return ONLY a valid JSON object. No markdown, no explanation, no code blocks. Raw JSON only.',
          'The JSON was invalid. Return only the raw JSON object with no surrounding text.\n\nOriginal response:\n' + rawText,
          { model: 'claude-sonnet-4-6', max_tokens: 1500 }
        )
        const retryText = retryResponse.content[0].type === 'text' ? retryResponse.content[0].text : '{}'
        const retryParsed = JSON.parse(retryText)
        const retryValidated = LumaFeedbackSchema.safeParse(retryParsed)
        parsedFeedback = retryValidated.success ? clampFeedbackScores(retryValidated.data) : retryParsed
      }
    } catch {
      return NextResponse.json({ error: 'Failed to parse Luma feedback' }, { status: 500 })
    }

    // Persist detected patterns to DB
    if (parsedFeedback.detected_patterns?.length && userId) {
      try {
        const supabaseAdmin = createAdminClient()
        await supabaseAdmin.from('user_failure_patterns').insert(
          parsedFeedback.detected_patterns.map((p: { pattern_id: string; pattern_name: string; confidence: number; evidence: string; question?: string }) => ({
            user_id: userId,
            attempt_id: attemptId ?? null,
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
    if (userId) {
      logEvent(userId, 'session.feedback_generated', { attempt_id: attemptId ?? null, challenge_id: _challengeId ?? null })
    }

    return NextResponse.json(parsedFeedback)
  } catch (error) {
    console.error('Luma feedback error:', error)
    // Fall back to mock on error
    return NextResponse.json(MOCK_FEEDBACK)
  }
}

// ── V2 Feedback Handler (FLOW-based) ──────────────────────────

async function handleV2Feedback(attemptId: string, userId: string | undefined, challengeId: string | undefined) {
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(MOCK_FEEDBACK_FULL)
  }

  const admin = createAdminClient()

  // Fetch attempt with challenge info
  const { data: attempt, error: attemptError } = await admin
    .from('challenge_attempts')
    .select('id, challenge_id, user_id, role_id')
    .eq('id', attemptId)
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
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

  const systemPrompt = LUMA_CORE_IDENTITY + '\n\n' + MENTAL_MODELS_CONTEXT + '\n\n' + LUMA_FEEDBACK_SYSTEM_PROMPT_V2

  try {
    const message = await createCachedMessage(systemPrompt, userContent, {
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}'

    try {
      const parsed = JSON.parse(rawText)
      const validated = V2FeedbackSchema.safeParse(parsed)

      const feedback = validated.success ? clampV2FeedbackScores(validated.data) : parsed

      // Persist detected patterns
      if (feedback.detected_patterns?.length && userId) {
        try {
          await admin.from('user_failure_patterns').insert(
            feedback.detected_patterns.map((p: { pattern_id: string; pattern_name: string; confidence: number; evidence: string; question?: string }) => ({
              user_id: userId,
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

      if (userId) {
        logEvent(userId, 'session.feedback_generated', { attempt_id: attemptId, challenge_id: challengeId ?? null, version: 'v2' })
      }

      return NextResponse.json({ ...feedback, version: 'v2' })
    } catch {
      return NextResponse.json({ error: 'Failed to parse v2 feedback' }, { status: 500 })
    }
  } catch (error) {
    console.error('Luma v2 feedback error:', error)
    return NextResponse.json(MOCK_FEEDBACK)
  }
}
