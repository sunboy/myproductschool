import { NextRequest, NextResponse } from 'next/server'
import { loadSkillPrompt } from '@/lib/ai/skill-loader'
import { extractJson } from '@/lib/anthropic/extract-json'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { applyMoveLevelXp } from '@/lib/data/move-levels-update'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'
import { buildCompletedQuickTakeResult } from '@/lib/scoring/completed-attempt-result'
import { buildEmptyStateResponse, buildSkillContextPrompt, detectSubmissionQuality } from '@/lib/hatch/skill-context'
import { checkAndGrantAchievements } from '@/lib/achievements/check'
import { recordHatchInteraction } from '@/lib/hatch/interactions'
import { captureServerImmediate } from '@/lib/posthog/server'

// XP base for quick-takes (lower than full challenges)
const QUICK_TAKE_XP_BASE = 20
const ROUTE_KEY = 'quick_take_submit'

const RequestSchema = z.object({
  challenge_id: z.string().uuid(),
  response_text: z.string().trim().max(6000),
})

const MOCK_RESPONSE = {
  score: 0.75,
  xp_earned: 15,
  feedback_summary: 'Good framing, you identified the key diagnostic signals. Consider prioritizing metric breakdowns earlier.',
}

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function notReadyResponse(reason: 'empty' | 'too_thin') {
  const emptyState = buildEmptyStateResponse({
    surface: 'grading',
    discipline: 'product',
    challengeType: 'quick_take',
  })

  return NextResponse.json({
    status: 'not_ready',
    ready_to_grade: false,
    reason,
    empty_state: emptyState,
    summary: emptyState.summary,
    next_actions: emptyState.next_actions,
  }, { status: 422 })
}

/**
 * Grade a quick-take response with Haiku.
 * Returns a quality score 0.0–1.0 and structured coaching feedback.
 */
async function gradeWithHaiku(
  responseText: string,
  promptText: string,
  contextBlock: string,
  budget: { userId: string; userPlan: string; route: string }
): Promise<{ score: number; feedback: string; structured?: { what_worked: string | null; what_to_improve: string | null; example_move: string | null } | null }> {
  const inlinePrompt = `You are Hatch, a product thinking coach. Grade a quick-take response and give direct, specific coaching.

Never use em dashes. Short sentences. No filler like "Great job" or "Certainly". Be honest, don't soften weak answers.

Honest, not soft: this is a 90-second rep, a low-stakes moment to build confidence. Lead with the one thing they got right in what_worked before naming the gap. Frame what_to_improve as the next move, not a failure. Never use pressure, guilt, or "you're behind." Calm about the person, exact about the thinking. This holds across any discipline.

Scoring:
- 0.8-1.0 (Sharp): Frames the problem clearly, names a specific diagnosis or insight, shows reasoning not just description
- 0.5-0.79 (Solid): On track but generic, missing a specific metric, user segment, or concrete next step
- 0.2-0.49 (Surface): Restates the question or lists obvious things without real analysis
- 0.0-0.19 (Weak): Too short, off-topic, or shows no product reasoning

Return valid JSON only:
{
  "score": <0.0–1.0>,
  "what_worked": "<one sentence on the strongest part of their answer, or null if nothing worked>",
  "what_to_improve": "<one concrete, specific thing they should add or change>",
  "example_move": "<a short example of the sharper thinking move they should make>"
}`
  const systemPrompt = loadSkillPrompt('hackproduct-quicktake-grader', inlinePrompt)

  const userContent = [
    contextBlock,
    `Challenge prompt: "${promptText}"`,
    `User's response: "${responseText}"`,
  ].filter(Boolean).join('\n\n')

  try {
    const msg = await guardedCachedMessage(systemPrompt, userContent, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      budget,
    })
    const raw = msg.sanitized
    // Tolerant parse: recover the object even if the model wrapped it in fences
    // or prose. On total failure, fall through to the word-count heuristic below.
    const parsed = extractJson<{
      score?: unknown
      what_worked?: unknown
      what_to_improve?: unknown
      example_move?: unknown
    }>(raw)
    if (!parsed) throw new Error('quick-take: no JSON in model output')
    const score = Math.max(0, Math.min(1, Number(parsed.score) || 0))

    // Keep the structured fields (the UI renders them distinctly); the flat
    // string stays for back-compat readers of feedback_json.feedback.
    const structured = {
      what_worked: parsed.what_worked && parsed.what_worked !== 'null' ? String(parsed.what_worked) : null,
      what_to_improve: parsed.what_to_improve ? String(parsed.what_to_improve) : null,
      example_move: parsed.example_move ? String(parsed.example_move) : null,
    }
    const parts: string[] = []
    if (structured.what_worked) parts.push(structured.what_worked)
    if (structured.what_to_improve) parts.push(structured.what_to_improve)
    if (structured.example_move) parts.push(`Try: ${structured.example_move}`)

    return {
      score,
      feedback: parts.join('\n\n') || 'Keep practising.',
      structured,
    }
  } catch (err) {
    if (err instanceof AiBudgetExceededError) throw err

    console.error('[quick-take] grading error:', err)
    const wordCount = responseText.trim().split(/\s+/).length
    return {
      score: Math.min(1, wordCount / 100),
      feedback: 'Keep practising.',
    }
  }
}

export async function POST(req: NextRequest) {
  if (IS_MOCK) {
    return NextResponse.json(MOCK_RESPONSE)
  }

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
  const { challenge_id, response_text } = body

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')
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

  const adminClient = createAdminClient()

  // Fetch challenge for move tags and title
  const { data: challenge } = await adminClient
    .from('challenges')
    .select('title, prompt_text, move_tags')
    .eq('id', challenge_id)
    .eq('challenge_type', 'quick_take')
    .single()

  if (!challenge) return apiError(404, 'prompt_not_found', 'Prompt not found')

  const { data: completedAttempt } = await adminClient
    .from('challenge_attempts')
    .select('total_score, feedback_json')
    .eq('user_id', user.id)
    .eq('challenge_id', challenge_id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (completedAttempt) {
    return NextResponse.json(buildCompletedQuickTakeResult(completedAttempt))
  }

  const submissionQuality = detectSubmissionQuality(response_text)
  if (submissionQuality !== 'substantive') {
    return notReadyResponse(submissionQuality)
  }

  // Grade with Haiku - quality score 0.0–1.0
  let score: number
  let feedback: string
  let structured: { what_worked: string | null; what_to_improve: string | null; example_move: string | null } | null = null
  try {
    await assertPlanLimit(user.id, userPlan, 'quick_takes')

    const contextBlock = await buildSkillContextPrompt(user.id, {
      surface: 'grading',
      challengeType: 'quick_take',
      challengeTitle: challenge.title,
      challengePrompt: challenge.prompt_text,
      submissionText: response_text,
      includePracticeLink: true,
    }).catch(() => '')
    const result = await gradeWithHaiku(
      response_text,
      challenge.prompt_text ?? challenge.title ?? challenge_id,
      contextBlock,
      { userId: user.id, userPlan, route: ROUTE_KEY }
    )
    score = result.score
    feedback = result.feedback
    structured = result.structured ?? null
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

  // XP = base * quality score
  const xp_earned = Math.round(QUICK_TAKE_XP_BASE * score)

  const primaryMove = challenge.move_tags?.[0] ?? 'frame'

  // Record attempt so "unattempted" filtering works for next-question routing
  const { error: attemptInsertError } = await adminClient.from('challenge_attempts').insert({
    user_id: user.id,
    challenge_id,
    status: 'completed',
    current_step: 'done',
    current_question_sequence: 1,
    completed_at: new Date().toISOString(),
    total_score: score,
    max_score: 1,
    grade_label: score >= 0.8 ? 'Sharp' : score >= 0.5 ? 'Solid' : score >= 0.2 ? 'Surface' : 'Weak',
    feedback_json: { feedback, ...(structured ? { structured } : {}), xp_earned, move: primaryMove },
  })
  if (attemptInsertError) {
    console.error('[quick-take] challenge_attempts insert failed:', attemptInsertError.message)
    return apiError(500, 'quick_take_attempt_save_failed', 'Failed to save quick-take attempt')
  }

  const { error: sessionEventError } = await adminClient.from('session_events').insert({
    user_id: user.id,
    event_type: 'quick_take_submit',
    payload: { challenge_id, move: primaryMove, score, xp_earned },
  })
  if (sessionEventError) console.error('[quick-take] session_events insert failed:', sessionEventError.message)

  // Session memory: fire-and-forget, never blocks or fails the submit.
  recordHatchInteraction(user.id, 'quick_take_submit', { challenge_id, move: primaryMove, score, xp_earned })

  await applyMoveLevelXp(user.id, { [primaryMove]: Math.round(score * 10) }, 'quick-take')

  // Award XP to profile
  const { data: profileRow, error: profileReadError } = await adminClient
    .from('profiles')
    .select('xp_total')
    .eq('id', user.id)
    .single()
  if (profileReadError || !profileRow) {
    return apiError(500, 'profile_xp_load_failed', 'Failed to load profile for XP update')
  }

  const { error: xpUpdateError } = await adminClient
    .from('profiles')
    .update({ xp_total: (profileRow.xp_total ?? 0) + xp_earned })
    .eq('id', user.id)
  if (xpUpdateError) {
    return apiError(500, 'quick_take_xp_award_failed', 'Failed to award quick-take XP')
  }

  const { error: streakError } = await adminClient.rpc('update_user_streak', { p_user_id: user.id })
  if (streakError) console.error('[quick-take] update_user_streak failed:', streakError.message)

  checkAndGrantAchievements(user.id, adminClient).catch(err =>
    console.error('[quick-take] achievement check failed:', err)
  )

  await captureServerImmediate({
    distinctId: user.id,
    event: 'quick_take_submitted',
    properties: { challenge_id, move: primaryMove, score, xp_earned },
  })

  return NextResponse.json({ score, xp_earned, feedback_summary: feedback, structured: structured ?? null })
}
