'use client'

import type { LoopRound, LoopDiscipline } from '@/lib/interview-loops/types'

const DISCIPLINE_LABELS: Record<LoopDiscipline, string> = {
  product_sense: 'Product',
  system_design: 'Sys Design',
  data_modeling: 'Data',
  coding: 'Coding',
}

interface Props {
  loopTitle: string
  rounds: LoopRound[]
  currentRoundIndex: number
  onPause: () => void
}

export function LoopProgressBar({ loopTitle, rounds, currentRoundIndex, onPause }: Props) {
  return (
    <div className="bg-inverse-surface flex items-center gap-3 px-4 py-2.5 shrink-0">
      <span className="font-label font-bold text-inverse-on-surface text-xs whitespace-nowrap hidden sm:block">
        {loopTitle}
      </span>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {rounds.map((round, idx) => {
          const isDone = round.status === 'completed'
          const isActive = round.round_index === currentRoundIndex && round.status === 'active'
          const isPending = round.status === 'pending'

          return (
            <div key={round.id} className="flex items-center gap-2 min-w-0">
              {idx > 0 && (
                <div className={`h-px flex-1 min-w-2 rounded ${isDone ? 'bg-primary' : 'bg-white/20'}`} />
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={[
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  isDone ? 'bg-primary text-on-primary' : isActive ? 'bg-tertiary-container text-on-surface' : 'bg-white/10 text-white/30',
                ].join(' ')}>
                  {isDone ? (
                    <span className="material-symbols-outlined text-xs leading-none">check</span>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={`text-[10px] font-label hidden sm:block ${isActive ? 'text-inverse-on-surface font-semibold' : isPending ? 'text-white/30' : 'text-white/50'}`}>
                  {DISCIPLINE_LABELS[round.discipline]}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onPause}
        className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-2.5 py-1 text-inverse-on-surface font-label text-xs whitespace-nowrap transition-colors"
      >
        <span className="material-symbols-outlined text-sm leading-none">pause</span>
        <span className="hidden sm:inline">Pause loop</span>
      </button>
    </div>
  )
}
