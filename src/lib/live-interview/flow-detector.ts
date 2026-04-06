export type FlowMove = 'frame' | 'list' | 'optimize' | 'win'

const KEYWORDS: Record<FlowMove, string[]> = {
  frame: [
    'problem',
    'root cause',
    'why',
    'friction',
    'issue',
    'user pain',
    'define',
    'core problem',
    'underlying',
    'symptom',
    'diagnose',
  ],
  list: [
    'stakeholder',
    'option',
    'solution',
    'approach',
    'who',
    'affected',
    'alternative',
    'consider',
    'segment',
    'persona',
  ],
  optimize: [
    'tradeoff',
    'criterion',
    'sacrifice',
    'priority',
    'metric',
    'guardrail',
    'weigh',
    'balance',
    'optimize',
    'measure',
    'kpi',
  ],
  win: [
    'recommend',
    'bet',
    'launch',
    'implement',
    'ship',
    'my recommendation',
    'we should',
    'proposal',
    'commit',
    'decision',
    'i would',
  ],
}

export function detectFlowMove(text: string): FlowMove | null {
  const lower = text.toLowerCase()

  const counts: Record<FlowMove, number> = { frame: 0, list: 0, optimize: 0, win: 0 }

  for (const [move, keywords] of Object.entries(KEYWORDS) as Array<[FlowMove, string[]]>) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        counts[move]++
      }
    }
  }

  const maxCount = Math.max(...Object.values(counts))
  if (maxCount === 0) return null

  // Find all moves with the max count — if tied, return null
  const topMoves = (Object.keys(counts) as FlowMove[]).filter((m) => counts[m] === maxCount)
  if (topMoves.length > 1) return null

  return topMoves[0]
}
