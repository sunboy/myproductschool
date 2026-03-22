import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  LUMA_FEEDBACK_SYSTEM_PROMPT,
  buildFeedbackUserPrompt
} from '@/lib/luma/system-prompt'
import { MOCK_FEEDBACK, MOCK_FEEDBACK_FULL } from '@/lib/mock-data'
import { createAdminClient } from '@/lib/supabase/admin'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { challengeId, challengeTitle, challengePrompt, response: userResponse, userId, attemptId } = await req.json()

  if (!userResponse?.trim()) {
    return NextResponse.json({ error: 'No response provided' }, { status: 400 })
  }

  // Mock mode: return fixture feedback as a stream
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(MOCK_FEEDBACK_FULL)
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: LUMA_FEEDBACK_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildFeedbackUserPrompt(
            challengeTitle ?? 'Product Challenge',
            challengePrompt ?? '',
            userResponse
          ),
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    // Parse and validate the JSON
    const feedback = JSON.parse(content.text)

    // Persist detected patterns to DB
    if (feedback.detected_patterns?.length && userId) {
      try {
        const supabaseAdmin = createAdminClient()
        await supabaseAdmin.from('user_failure_patterns').insert(
          feedback.detected_patterns.map((p: { pattern_id: string; pattern_name: string; confidence: number; evidence: string; question?: string }) => ({
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

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Luma feedback error:', error)
    // Fall back to mock on error
    return NextResponse.json(MOCK_FEEDBACK)
  }
}
