import { NextRequest, NextResponse } from 'next/server'
import { HATCH_NUDGE_SYSTEM_PROMPT, MENTAL_MODELS_CONTEXT } from '@/lib/hatch/system-prompt'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { getReasoningMove } from '@/lib/v2/skills/rubric-loader'
import type { FlowStep } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (process.env.USE_MOCK_DATA === 'true' || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true })
  }

  try {
    const { step } = await req.json()

    const validSteps = ['frame', 'list', 'optimize', 'win']
    const flowStep = validSteps.includes(step) ? (step as FlowStep) : undefined

    let userPrompt = 'Warmup call — priming prompt cache.'
    if (flowStep) {
      const reasoningMove = getReasoningMove(flowStep)
      userPrompt += ` Step: ${flowStep}. Reasoning move: ${reasoningMove}.`
    }

    const systemPrompt = HATCH_NUDGE_SYSTEM_PROMPT + '\n\n' + MENTAL_MODELS_CONTEXT

    // max_tokens: 1 seeds Anthropic's 5-minute prompt cache at near-zero cost
    await guardedCachedMessage(systemPrompt, userPrompt, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
    })
  } catch {
    // Warmup failure is silent — never surface to client
  }

  return NextResponse.json({ ok: true })
}
