import Link from 'next/link'
import type { InterviewLoop, LoopRound } from '@/lib/interview-loops/types'

const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product sense',
  system_design: 'System design',
  data_modeling: 'Data modeling',
  coding: 'Coding',
}

const ROUND_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: '#4a7c59', text: '#fff', label: '✓' },
  paused:    { bg: '#c9933a', text: '#fff', label: '⏸' },
  pending:   { bg: 'rgba(255,255,255,0.10)', text: 'rgba(255,255,255,0.40)', label: '' },
  active:    { bg: '#c9e86e', text: '#0e2818', label: '▶' },
}

interface Props {
  loop: InterviewLoop
  rounds: LoopRound[]
}

export function PausedLoopCard({ loop, rounds }: Props) {
  const pausedRound = rounds.find((r) => r.status === 'paused')
  if (!pausedRound) return null

  const completedCount = rounds.filter((r) => r.status === 'completed').length
  const totalCount = rounds.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const minutesIn = pausedRound.started_at
    ? Math.floor((Date.now() - new Date(pausedRound.started_at).getTime()) / 60000)
    : null

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: 'linear-gradient(135deg, #1e3528 0%, #14241c 100%)',
        border: '1px solid rgba(126,224,153,0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle dot grid */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          maskImage: 'radial-gradient(ellipse 80% 100% at 95% 50%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 95% 50%, black 20%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header row */}
      <div className="relative flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(201,147,58,0.25)', color: '#c9933a' }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9933a', animation: 'pulse 2s ease-in-out infinite', display: 'inline-block' }} />
          Loop paused
        </span>
        <span className="text-[11px]" style={{ color: 'rgba(243,237,224,0.50)' }}>
          {minutesIn !== null ? `${minutesIn} min in` : ''}
        </span>
      </div>

      {/* Title + progress */}
      <div className="relative">
        <div className="font-headline font-semibold text-[18px] leading-tight mb-0.5" style={{ color: '#f3ede0' }}>
          {loop.title}
        </div>
        <div className="text-[12px]" style={{ color: 'rgba(243,237,224,0.60)' }}>
          Round {pausedRound.round_index + 1} of {totalCount}
          {' — '}{DISCIPLINE_LABELS[pausedRound.discipline] ?? pausedRound.discipline}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #4a7c59, #7ee099)' }}
          />
        </div>
        <div className="flex justify-between text-[11px] mt-1.5" style={{ color: 'rgba(243,237,224,0.50)' }}>
          <span>{completedCount} of {totalCount} rounds done</span>
          <span>{progressPct}%</span>
        </div>
      </div>

      {/* Round pills */}
      <div className="relative flex flex-wrap gap-1.5">
        {rounds.map((r) => {
          const style = ROUND_STATUS_STYLES[r.status] ?? ROUND_STATUS_STYLES.pending
          return (
            <span
              key={r.id}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-label font-semibold"
              style={{ background: style.bg, color: style.text }}
            >
              {style.label && <span>{style.label}</span>}
              {DISCIPLINE_LABELS[r.discipline] ?? r.discipline}
            </span>
          )
        })}
      </div>

      {/* CTA */}
      {pausedRound.session_id && (
        <Link href={`/live-interviews/${pausedRound.session_id}`} className="relative">
          <div
            className="w-full py-2.5 rounded-xl text-center font-label font-bold text-sm cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: '#7ee099', color: '#0e2818' }}
          >
            Resume Round {pausedRound.round_index + 1} →
          </div>
        </Link>
      )}
    </div>
  )
}
