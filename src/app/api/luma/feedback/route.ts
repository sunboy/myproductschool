import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  LUMA_FEEDBACK_SYSTEM_PROMPT,
  buildFeedbackUserPrompt
} from '@/lib/luma/system-prompt'
import { MOCK_FEEDBACK, MOCK_FEEDBACK_FULL } from '@/lib/mock-data'
import { createAdminClient } from '@/lib/supabase/admin'
import { LumaFeedbackSchema, clampFeedbackScores } from '@/lib/luma/feedback-schema'
import { logEvent } from '@/lib/data/events'
import { IS_MOCK } from '@/lib/mock'
import { getLumaContext, buildLumaContextString } from '@/lib/luma-context'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { challengeId: _challengeId, challengeTitle, challengePrompt, response: userResponse, userId, attemptId } = await req.json()

  if (!userResponse?.trim()) {
    return NextResponse.json({ error: 'No response provided' }, { status: 400 })
  }

  // Mock mode: return fixture feedback as a stream
  if (IS_MOCK || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(MOCK_FEEDBACK_FULL)
  }

  try {
    const lumaCtx = userId ? await getLumaContext(userId) : null
    const contextBlock = lumaCtx ? buildLumaContextString(lumaCtx, 'feedback') : ''
    const systemPrompt = contextBlock
      ? LUMA_FEEDBACK_SYSTEM_PROMPT + '\n\n## Learner Context\n' + contextBlock
      : LUMA_FEEDBACK_SYSTEM_PROMPT

    const userMessage = {
      role: 'user' as const,
      content: buildFeedbackUserPrompt(
        challengeTitle ?? 'Product Challenge',
        challengePrompt ?? '',
        userResponse
      ),
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [userMessage],
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
        const retryResponse = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: systemPrompt + '\n\nCRITICAL: Return ONLY a valid JSON object. No markdown, no explanation, no code blocks. Raw JSON only.',
          messages: [userMessage, { role: 'assistant', content: rawText }, { role: 'user', content: 'The JSON was invalid. Return only the raw JSON object with no surrounding text.' }],
        })
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
