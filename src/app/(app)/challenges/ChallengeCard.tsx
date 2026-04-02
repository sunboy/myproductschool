'use client'

import Link from 'next/link'
import type { ChallengeWithDomain, FlowMove } from '@/lib/types'

const MOVE_DISPLAY: Record<FlowMove, { label: string; symbol: string; color: string }> = {
  frame:    { label: 'Frame',    symbol: '◇', color: 'text-blue-600' },
  list:     { label: 'List',     symbol: '◈', color: 'text-rose-600' },
  weigh: { label: 'Weigh', symbol: '◆', color: 'text-amber-600' },
  sell:  { label: 'Sell',  symbol: '◎', color: 'text-emerald-600' },
}

function getParadigmBadgeClass(paradigm: string): string {
  switch (paradigm) {
    case 'Traditional': return 'bg-emerald-100 text-emerald-800'
    case 'AI-Assisted': return 'bg-blue-100 text-blue-800'
    case 'Agentic': return 'bg-purple-100 text-purple-800'
    case 'AI-Native': return 'bg-amber-100 text-amber-800'
    default: return 'bg-surface-container-high text-on-surface-variant'
  }
}

function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'EASY'
    case 'intermediate': return 'MEDIUM'
    case 'advanced': return 'HARD'
    default: return difficulty.toUpperCase()
  }
}

function getDifficultyClass(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'text-on-surface-variant'
    case 'intermediate': return 'text-amber-600'
    case 'advanced': return 'text-red-600'
    default: return 'text-on-surface-variant'
  }
}

export function ChallengeCard({
  challenge,
  paradigm,
}: {
  challenge: ChallengeWithDomain
  paradigm: string
}) {
  const moveTags = (challenge.move_tags ?? []) as FlowMove[]

  return (
    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant hover:shadow-md transition-shadow flex flex-col group">
      {/* Paradigm badge + difficulty */}
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${getParadigmBadgeClass(paradigm)}`}>
          {paradigm}
        </span>
        <span className={`text-[10px] font-bold ${getDifficultyClass(challenge.difficulty)}`}>
          {getDifficultyLabel(challenge.difficulty)}
        </span>
      </div>

      {/* Title */}
      <Link href={`/challenges/${challenge.id}`}>
        <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors">
          {challenge.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">
        {challenge.prompt_text}
      </p>

      {/* Move tags */}
      {moveTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
          {moveTags.map(move => {
            const m = MOVE_DISPLAY[move]
            if (!m) return null
            return (
              <span key={move} className={`${m.color} text-[10px] font-bold`}>
                {m.symbol} {m.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Peer social signal — Wes Kao: community pull at card level */}
      <div className="flex items-center gap-1.5 mb-3 text-[10px] text-on-surface-variant">
        <span className="material-symbols-outlined text-xs text-primary/60">group</span>
        <span>{(challenge.attempt_count ?? 0) > 0 ? `${challenge.attempt_count} engineers tried this` : 'Be the first to try this'}</span>
      </div>

      {/* Footer: Start button + Discussion link */}
      <div className="flex items-center gap-2 mt-auto">
        <Link
          href={`/challenges/${challenge.id}`}
          className="flex-1 py-2 bg-primary text-on-primary text-xs font-bold rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          Start <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
        <Link
          href={`/challenges/${challenge.id}/discussion`}
          className="p-2 rounded-full bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
          title="Discussion"
        >
          <span className="material-symbols-outlined text-sm">forum</span>
        </Link>
      </div>
    </div>
  )
}
