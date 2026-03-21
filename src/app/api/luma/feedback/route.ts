import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  LUMA_FEEDBACK_SYSTEM_PROMPT,
  buildFeedbackUserPrompt
} from '@/lib/luma/system-prompt'
import { MOCK_FEEDBACK } from '@/lib/mock-data'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { challengeId, challengeTitle, challengePrompt, response: userResponse } = await req.json()

  if (!userResponse?.trim()) {
    return NextResponse.json({ error: 'No response provided' }, { status: 400 })
  }

  // Mock mode: return fixture feedback as a stream
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    const mockJson = JSON.stringify(MOCK_FEEDBACK)
    return new Response(mockJson, {
      headers: { 'Content-Type': 'application/json' },
    })
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
    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Luma feedback error:', error)
    // Fall back to mock on error
    return NextResponse.json(MOCK_FEEDBACK)
  }
}
