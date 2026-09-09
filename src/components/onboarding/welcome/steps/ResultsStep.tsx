'use client'
import Link from 'next/link'
import { FLOW_MOVES } from '@/components/onboarding/CalibrationFlow'

export interface CalibrationResults {
  archetype: string | null
  hatch_observation: string | null
  scores: Record<string, number>
  starting_levels: Record<string, number>
  personalised_plan_slug: string | null
}

export function ResultsStep({ results, onStart, onPlan }: { results: CalibrationResults; onStart: () => void; onPlan: () => void }) {
  const tint: Record<string, string> = { frame: 'bg-primary-fixed text-forest-800', list: 'bg-[#e6eef8] text-[#2f5fa8]', optimize: 'bg-[#f7e6f0] text-[#9b2f6e]', win: 'bg-amber-soft text-tertiary' }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        {results.archetype && <span className="rounded-full bg-forest-800 px-3 py-1 text-meta font-bold text-white">{results.archetype}</span>}
        <span className="text-meta text-ink-secondary">Your starting profile</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {FLOW_MOVES.map(m => (
          <div key={m.key} data-testid={`score-${m.key}`} className={`rounded-xl p-3.5 text-center ${tint[m.key]}`}>
            <div className="text-caption font-bold text-ink-secondary">{m.label}</div>
            <div className="font-headline text-h1 font-bold">{results.scores[m.key] ?? 0}</div>
            <span className="rounded-full border border-hairline bg-card-bright px-2 py-0.5 text-caption text-ink-strong">Lv {results.starting_levels[m.key] ?? 1}</span>
          </div>
        ))}
      </div>
      {results.hatch_observation && <div className="rounded-xl bg-surface-container px-4 py-3.5 text-ui leading-[1.5]"><b>Hatch:</b> {results.hatch_observation}</div>}
      <div className="grid gap-2.5 sm:grid-cols-2">
        <button type="button" data-testid="results-start" onClick={onStart} className="rounded-full bg-forest-800 px-4 py-3 text-body font-bold text-white">Start my first challenge →</button>
        {results.personalised_plan_slug ? (
          <button type="button" data-testid="results-plan" onClick={onPlan} className="rounded-full border border-hairline bg-card-bright px-4 py-3 text-body font-bold">See my study plan</button>
        ) : (
          <Link href="/explore/plans" className="rounded-full border border-hairline bg-card-bright px-4 py-3 text-center text-body font-bold">Browse study plans</Link>
        )}
      </div>
    </div>
  )
}
