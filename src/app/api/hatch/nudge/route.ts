import { NextRequest, NextResponse } from 'next/server'
import { HATCH_NUDGE_SYSTEM_PROMPT, MENTAL_MODELS_CONTEXT, buildNudgeUserPrompt } from '@/lib/hatch/system-prompt'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import { getReasoningMove } from '@/lib/v2/skills/rubric-loader'
import type { FlowStep } from '@/lib/types'

const MOCK_NUDGES = [
  "You've identified the problem well. What data would tell you *why* users aren't taking this action?",
  "Good start on the solution. What's the biggest risk of building this, and how would you validate the idea first?",
  "Your metric choice is reasonable. What are you willing to let get worse in order to improve it — what's the guardrail?",
  "You've described features, but what's the user's underlying job-to-be-done here?",
]

export async function POST(req: NextRequest) {
  const { challengeId: _challengeId, challengePrompt, draft, attemptId, step } = await req.json()

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

      // Record nudge usage.
      // TODO: add a unique constraint on (user_id, attempt_id, nudge_sequence) to eliminate the
      // TOCTOU race between the count check above and this insert. Until then, concurrent requests
      // may exceed the limit by one nudge before either insert is committed.
      try {
        await adminClient.from('nudge_usage').insert({ user_id: user.id, attempt_id: attemptId })
      } catch (insertError) {
        // If insert fails due to a unique constraint violation treat it as rate-limited.
        console.warn('nudge_usage insert failed (possible race / constraint):', insertError)
        return NextResponse.json({ error: 'Nudge limit reached', remaining: 0 }, { status: 429 })
      }
    }
  }

  try {
    const validSteps = ['frame', 'list', 'optimize', 'win']
    const flowStep = validSteps.includes(step) ? (step as FlowStep) : undefined

    let userPrompt = buildNudgeUserPrompt(challengePrompt ?? '', draft)
    if (flowStep) {
      const reasoningMove = getReasoningMove(flowStep)
      userPrompt += `\n\nThe user is currently on the ${flowStep} step, practicing: ${reasoningMove}. Reference this reasoning move in your nudge.`
    }

    const systemPrompt = HATCH_NUDGE_SYSTEM_PROMPT + '\n\n' + MENTAL_MODELS_CONTEXT

    const message = await createCachedMessage(systemPrompt, userPrompt, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
    })

    const content = message.content[0]
    const nudge = content.type === 'text' ? content.text.trim() : null
    return NextResponse.json({ nudge })
  } catch (error) {
    console.error('Hatch nudge error:', error)
    return NextResponse.json({ nudge: null })
  }
}
