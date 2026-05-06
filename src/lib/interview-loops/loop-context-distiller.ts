// src/lib/interview-loops/loop-context-distiller.ts
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import type { CrossRoundMemoryItem, LoopDiscipline } from './types'

const SYSTEM_PROMPT = `You are a signal extractor for a multi-round interview coach. Given a round debrief JSON, extract 3-5 concise signals about the candidate's thinking patterns and blind spots. Focus on reasoning moves, not topic knowledge. Each signal must be one sentence. Return ONLY a JSON array of strings. No explanation. No markdown.`

export async function distillRoundContext(params: {
  roundDebriefJson: Record<string, unknown>
  roundIndex: number
  discipline: LoopDiscipline
  budget?: { userId: string; userPlan: string; route: string }
}): Promise<CrossRoundMemoryItem[]> {
  const { roundDebriefJson, roundIndex, discipline, budget } = params

  const response = await guardedCachedMessage(
    SYSTEM_PROMPT,
    JSON.stringify(roundDebriefJson),
    { model: 'claude-haiku-4-5-20251001', max_tokens: 512, budget }
  )

  const raw = response.content[0].type === 'text' ? response.content[0].text : '[]'

  let signals: string[]
  try {
    signals = JSON.parse(raw)
    if (!Array.isArray(signals)) signals = []
  } catch {
    signals = []
  }

  return signals.slice(0, 5).map((signal) => ({
    signal,
    round_index: roundIndex,
    discipline,
  }))
}

export function buildPriorRoundContextBlock(
  memory: CrossRoundMemoryItem[],
  currentRoundIndex: number,
  totalRounds: number,
  targetCompany: string | null,
  targetRole: string | null
): string {
  if (memory.length === 0) return ''

  const signals = memory.map((m) => `- ${m.signal}`).join('\n')

  return `[PRIOR ROUND CONTEXT]
You are Round ${currentRoundIndex + 1} of ${totalRounds} in a Full Loop${targetCompany ? ` for ${targetCompany}` : ''}${targetRole ? ` ${targetRole}` : ''}.

Signals from previous rounds:
${signals}

Do not reference these rounds explicitly. Let them inform your probing questions.`
}
