import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { LUMA_NUDGE_SYSTEM_PROMPT, buildNudgeUserPrompt } from '@/lib/luma/system-prompt'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MOCK_NUDGES = [
  "You've identified the problem well. What data would tell you *why* users aren't taking this action?",
  "Good start on the solution. What's the biggest risk of building this, and how would you validate the idea first?",
  "Your metric choice is reasonable. What are you willing to let get worse in order to improve it — what's the guardrail?",
  "You've described features, but what's the user's underlying job-to-be-done here?",
]

export async function POST(req: NextRequest) {
  const { challengeId: _challengeId, challengePrompt, draft, attemptId } = await req.json()

  if (!draft?.trim()) {
    return NextResponse.json({ nudge: null })
  }

  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    const randomNudge = MOCK_NUDGES[Math.floor(Math.random() * MOCK_NUDGES.length)]
    return NextResponse.json({ nudge: randomNudge })
  }

  // Nudge rate limiting
  if (attemptId) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!authError && user) {
      const adminClient = createAdminClient()
      const { count } = await adminClient
        .from('nudge_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('attempt_id', attemptId)

      if ((count ?? 0) >= 3) {
        return NextResponse.json({ error: 'Nudge limit reached', remaining: 0 }, { status: 429 })
      }

      // Record nudge usage
      await adminClient.from('nudge_usage').insert({ user_id: user.id, attempt_id: attemptId })
    }
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      system: LUMA_NUDGE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildNudgeUserPrompt(challengePrompt ?? '', draft),
        },
      ],
    })

    const content = message.content[0]
    const nudge = content.type === 'text' ? content.text.trim() : null
    return NextResponse.json({ nudge })
  } catch (error) {
    console.error('Luma nudge error:', error)
    return NextResponse.json({ nudge: null })
  }
}
