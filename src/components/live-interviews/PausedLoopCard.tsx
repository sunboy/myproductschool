import Link from 'next/link'
import type { InterviewLoop, LoopRound } from '@/lib/interview-loops/types'

const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product',
  system_design: 'Sys Design',
  data_modeling: 'Data',
  coding: 'Coding',
}

interface Props {
  loop: InterviewLoop
  rounds: LoopRound[]
}

export function PausedLoopCard({ loop, rounds }: Props) {
  const pausedRound = rounds.find((r) => r.status === 'paused')
  if (!pausedRound) return null

  const minutesIn = pausedRound.started_at
    ? Math.floor((Date.now() - new Date(pausedRound.started_at).getTime()) / 60000)
    : null

  return (
    <div className="bg-inverse-surface rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-tertiary-container rounded-full" />
        <span className="font-label text-[10px] text-inverse-on-surface/50 uppercase tracking-wider">Loop paused</span>
      </div>

      <div>
        <div className="font-label font-bold text-inverse-on-surface text-sm">{loop.title}</div>
        <div className="font-label text-xs text-inverse-on-surface/60 mt-0.5">
          Round {pausedRound.round_index + 1} of {loop.round_order.length}
          {' — '}{DISCIPLINE_LABELS[pausedRound.discipline] ?? pausedRound.discipline}
          {minutesIn !== null && ` · ${minutesIn} min in`}
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {rounds.map((r) => (
          <span
            key={r.id}
            className={[
              'rounded px-2 py-0.5 text-[9px] font-label',
              r.status === 'completed' ? 'bg-primary text-on-primary' :
              r.status === 'paused' ? 'bg-tertiary-container text-on-surface' :
              'bg-white/10 text-white/40',
            ].join(' ')}
          >
            {r.status === 'completed' ? '✓ ' : r.status === 'paused' ? '⏸ ' : ''}
            {DISCIPLINE_LABELS[r.discipline] ?? r.discipline}
          </span>
        ))}
      </div>

      {pausedRound.session_id && (
        <Link href={`/live-interviews/${pausedRound.session_id}`}>
          <div className="bg-primary text-on-primary rounded-xl py-2.5 text-center font-label font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
            Resume Round {pausedRound.round_index + 1} &rarr;
          </div>
        </Link>
      )}
    </div>
  )
}
