import type { LoopRound } from '@/lib/interview-loops/types'

interface Props {
  previousRound: LoopRound | null
}

export function PriorRoundRecap({ previousRound }: Props) {
  if (!previousRound || !previousRound.round_debrief_json) return null

  const debrief = previousRound.round_debrief_json as {
    strengths?: string[]
    improvements?: string[]
    overallScore?: number
  }

  const strengths = (debrief.strengths ?? []).slice(0, 2)
  const topMiss = (debrief.improvements ?? [])[0]
  const score = debrief.overallScore

  const DISCIPLINE_LABELS: Record<string, string> = {
    product_sense: 'Product Sense',
    system_design: 'System Design',
    data_modeling: 'Data Modeling',
    coding: 'Coding',
  }

  return (
    <div className="bg-surface-container rounded-xl p-3 border border-outline-variant flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
          Round {previousRound.round_index + 1} recap
        </span>
        {score !== undefined && (
          <span className="font-label text-xs font-bold text-primary">{score}/100</span>
        )}
      </div>
      <div className="font-label text-[10px] text-on-surface-variant">
        {DISCIPLINE_LABELS[previousRound.discipline] ?? previousRound.discipline}
      </div>
      {strengths.map((s, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs">
          <span className="text-primary mt-0.5 shrink-0">&#10003;</span>
          <span className="text-on-surface leading-snug">{s}</span>
        </div>
      ))}
      {topMiss && (
        <div className="flex items-start gap-1.5 text-xs">
          <span className="text-error mt-0.5 shrink-0">&#10007;</span>
          <span className="text-on-surface leading-snug">{topMiss}</span>
        </div>
      )}
      <div className="text-[9px] text-on-surface-variant/60 border-t border-outline-variant pt-1.5">
        Hatch is carrying this context into this round.
      </div>
    </div>
  )
}
