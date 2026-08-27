import type { WalkthroughPayload } from './types'

/**
 * The replay API (src/lib/casebook/replay-projection.ts) returns
 * { case, duration_s, transcript, decision_points[, moves] } — that shape is
 * owned by the API/data layer and predates the player's contract.
 * WalkthroughPlayer / types.ts (owned separately, do not modify) expect
 * { module, duration_s, transcript, checkpoints }. This adapts one to the
 * other so both sides keep their own naming.
 */
interface RawReplayResponse {
  case: { id: string; title: string; hook: string }
  duration_s: number
  transcript: Array<{ t: number; role: 'user' | 'assistant' | 'tool'; text: string }>
  decision_points: Array<{
    id: string
    t: number
    question: string
    options?: Array<{ id: string; text: string }>
  }>
}

export function adaptReplayResponse(raw: RawReplayResponse): WalkthroughPayload {
  return {
    module: {
      id: raw.case.id,
      title: raw.case.title,
      hook: raw.case.hook,
    },
    duration_s: raw.duration_s,
    transcript: raw.transcript,
    checkpoints: raw.decision_points.map((dp) => ({
      id: dp.id,
      t: dp.t,
      question: dp.question,
      options: dp.options,
    })),
  }
}
