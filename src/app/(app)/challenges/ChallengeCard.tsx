'use client'

import Link from 'next/link'
import type { ChallengeWithDomain, FlowMove } from '@/lib/types'

const MOVE_DISPLAY: Record<FlowMove, { label: string; symbol: string }> = {
  frame: { label: 'Frame',    symbol: '◇' },
  list:  { label: 'List',     symbol: '◈' },
  weigh: { label: 'Weigh',    symbol: '◆' },
  sell:  { label: 'Sell',     symbol: '◎' },
}

// Per-paradigm: gradient, accent color, badge colors
const PARADIGM_STYLE: Record<string, {
  gradient: string
  border: string
  badge: string
  badgeText: string
  accent: string
}> = {
  Traditional: {
    gradient: 'linear-gradient(135deg, rgba(45,212,160,0.08) 0%, rgba(45,212,160,0.02) 100%)',
    border: 'rgba(45,212,160,0.25)',
    badge: 'rgba(45,212,160,0.15)',
    badgeText: '#0d7f5f',
    accent: '#10b981',
  },
  'AI-Assisted': {
    gradient: 'linear-gradient(135deg, rgba(94,174,255,0.10) 0%, rgba(94,174,255,0.02) 100%)',
    border: 'rgba(94,174,255,0.30)',
    badge: 'rgba(94,174,255,0.15)',
    badgeText: '#1e5fa8',
    accent: '#3b82f6',
  },
  Agentic: {
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(167,139,250,0.02) 100%)',
    border: 'rgba(167,139,250,0.30)',
    badge: 'rgba(167,139,250,0.15)',
    badgeText: '#6d28d9',
    accent: '#8b5cf6',
  },
  'AI-Native': {
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.02) 100%)',
    border: 'rgba(245,158,11,0.30)',
    badge: 'rgba(245,158,11,0.15)',
    badgeText: '#92400e',
    accent: '#f59e0b',
  },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; dot: string }> = {
  warmup:     { label: 'Warm-up',   dot: '#10b981' },
  standard:   { label: 'Standard',  dot: '#f59e0b' },
  advanced:   { label: 'Advanced',  dot: '#ef4444' },
  staff_plus: { label: 'Staff+',    dot: '#8b5cf6' },
  beginner:   { label: 'Easy',      dot: '#10b981' },
  intermediate: { label: 'Medium',  dot: '#f59e0b' },
  hard:       { label: 'Hard',      dot: '#ef4444' },
}

export function ChallengeCard({
  challenge,
  paradigm,
  listView = false,
  locked = false,
}: {
  challenge: ChallengeWithDomain
  paradigm: string
  listView?: boolean
  locked?: boolean
}) {
  const moveTags = (challenge.move_tags ?? []) as FlowMove[]
  const style = PARADIGM_STYLE[paradigm] ?? PARADIGM_STYLE.Traditional
  const diff = DIFFICULTY_CONFIG[challenge.difficulty] ?? { label: challenge.difficulty, dot: '#74796e' }
  const attempts = challenge.attempt_count ?? 0

  if (listView) {
    return (
      <div
        className="flex items-center gap-4 px-4 py-3 group transition-colors hover:bg-surface-container/50"
        style={{ backgroundColor: '#f5f1ea' }}
      >
        {/* Difficulty dot */}
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: diff.dot }} />

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <Link href={`/workspace/challenges/${challenge.slug ?? challenge.id}`} className="block">
            <p className="font-headline font-bold text-[14px] text-on-surface leading-snug truncate group-hover:text-primary transition-colors">
              {challenge.title}
            </p>
          </Link>
          {challenge.prompt_text && (
            <p className="text-[11px] text-on-surface-variant font-body truncate mt-0.5">
              {challenge.prompt_text}
            </p>
          )}
        </div>

        {/* Paradigm badge */}
        <span
          className="hidden sm:inline text-[11px] font-bold px-2 py-0.5 rounded-md font-label shrink-0"
          style={{ background: style.badge, color: style.badgeText }}
        >
          {paradigm}
        </span>

        {/* Difficulty label */}
        <span className="hidden md:inline text-[11px] text-on-surface-variant font-label shrink-0 w-16 text-right">
          {diff.label}
        </span>

        {/* Move tags */}
        {moveTags.length > 0 && (
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {moveTags.map(move => {
              const m = MOVE_DISPLAY[move]
              if (!m) return null
              return (
                <span
                  key={move}
                  className="text-[11px] font-bold font-label px-2 py-0.5 rounded-md bg-surface-container-highest/60 text-on-surface-variant"
                >
                  {m.symbol} {m.label}
                </span>
              )
            })}
          </div>
        )}

        {/* Attempts */}
        <span className="hidden sm:flex text-[11px] text-on-surface-variant font-label items-center gap-1 shrink-0 w-16 justify-end">
          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 0", color: style.accent }}>group</span>
          {attempts > 0 ? `${attempts}` : '—'}
        </span>

        {/* CTA */}
        {locked ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-label font-semibold bg-surface-container-high text-on-surface-variant cursor-not-allowed select-none shrink-0">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Upgrade
          </span>
        ) : (
          <Link
            href={`/workspace/challenges/${challenge.slug ?? challenge.id}`}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg text-on-primary font-label transition-all duration-150 active:scale-95 shrink-0"
            style={{ backgroundColor: style.accent }}
          >
            Start
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: style.gradient,
        border: `1px solid ${style.border}`,
        backgroundColor: '#f5f1ea', // surface-container-low fallback under gradient
      }}
    >
      {/* Top row: paradigm badge + difficulty */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-md font-label"
          style={{ background: style.badge, color: style.badgeText }}
        >
          {paradigm}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant font-label">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: diff.dot }} />
          {diff.label}
        </span>
      </div>

      {/* Title */}
      <Link href={`/workspace/challenges/${challenge.slug ?? challenge.id}`} className="block">
        <h3 className="font-headline font-bold text-[15px] text-on-surface leading-snug group-hover:text-primary transition-colors" style={{ textWrap: 'balance' } as React.CSSProperties}>
          {challenge.title}
        </h3>
      </Link>

      {/* Description */}
      {challenge.prompt_text && (
        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 font-body">
          {challenge.prompt_text}
        </p>
      )}

      {/* Move tags */}
      {moveTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {moveTags.map(move => {
            const m = MOVE_DISPLAY[move]
            if (!m) return null
            return (
              <span
                key={move}
                className="text-[11px] font-bold font-label px-2 py-0.5 rounded-md bg-surface-container-highest/60 text-on-surface-variant"
              >
                {m.symbol} {m.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 mt-auto border-t border-outline-variant/20">
        <span className="text-[11px] text-on-surface-variant font-label flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 0", color: style.accent }}>group</span>
          {attempts > 0 ? `${attempts} tried` : 'Be first'}
        </span>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/challenges/${challenge.slug ?? challenge.id}/discussion`}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            title="Discussion"
          >
            <span className="material-symbols-outlined text-[15px]">forum</span>
          </Link>
          {locked ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-label font-semibold bg-surface-container-high text-on-surface-variant cursor-not-allowed select-none">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Upgrade
            </span>
          ) : (
            <Link
              href={`/workspace/challenges/${challenge.slug ?? challenge.id}`}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg text-on-primary font-label transition-all duration-150 active:scale-95"
              style={{ backgroundColor: style.accent }}
            >
              Start
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
