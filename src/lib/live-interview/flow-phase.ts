export const FLOW_ORDER = ['frame', 'list', 'optimize', 'win'] as const

export type FlowMove = (typeof FLOW_ORDER)[number]

export interface FlowPhase {
  index: number
  label: string
  covered: Record<FlowMove, boolean>
}

export function derivePhase(signals: Array<{ flowMove?: string | null }>): FlowPhase {
  const covered: Record<FlowMove, boolean> = { frame: false, list: false, optimize: false, win: false }
  let max = -1

  for (const signal of signals) {
    const move = (signal.flowMove ?? '') as FlowMove
    const i = FLOW_ORDER.indexOf(move)
    if (i >= 0) {
      covered[FLOW_ORDER[i]] = true
      if (i > max) max = i
    }
  }

  const label = max < 0 ? 'Warm-up' : FLOW_ORDER[max].charAt(0).toUpperCase() + FLOW_ORDER[max].slice(1)
  return { index: max + 1, label, covered }
}
