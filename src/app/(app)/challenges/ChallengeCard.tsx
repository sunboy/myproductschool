'use client'

import React from 'react'
import Link from 'next/link'
import type { ChallengeWithDomain, FlowMove } from '@/lib/types'

const PARADIGM_STYLE: Record<string, {
  bg: string
  fg: string
  accent: string
}> = {
  Traditional: {
    bg: '#dfe7e1',
    fg: '#2d4a3b',
    accent: '#6b8275',
  },
  'AI-Assisted': {
    bg: '#e1ecff',
    fg: '#174a99',
    accent: '#7aa7ff',
  },
  Agentic: {
    bg: '#ecdeff',
    fg: '#5a2e86',
    accent: '#a878d6',
  },
  'AI-Native': {
    bg: '#fbe1d0',
    fg: '#8a3c12',
    accent: '#e37d4a',
  },
}

// ── SVG art backgrounds per paradigm ─────────────────────────────────────────

function TraditionalArt({ color }: { color: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      {/* Concentric compass arcs — foundation / craft */}
      <g opacity="0.18" stroke={color} fill="none" strokeWidth="1.2">
        <circle cx="240" cy="20" r="40" />
        <circle cx="240" cy="20" r="65" />
        <circle cx="240" cy="20" r="90" />
        <circle cx="240" cy="20" r="115" />
        <circle cx="240" cy="20" r="140" />
      </g>
      {/* Cross-hair lines */}
      <g opacity="0.10" stroke={color} strokeWidth="0.8">
        <line x1="200" y1="0" x2="280" y2="0" />
        <line x1="240" y1="-20" x2="240" y2="60" />
        <line x1="210" y1="10" x2="270" y2="30" />
        <line x1="210" y1="30" x2="270" y2="10" />
      </g>
      {/* Tick marks around outermost arc */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const r1 = 138, r2 = 144
        const cx = 240, cy = 20
        return (
          <line
            key={i}
            x1={cx + r1 * Math.cos(angle)}
            y1={cy + r1 * Math.sin(angle)}
            x2={cx + r2 * Math.cos(angle)}
            y2={cy + r2 * Math.sin(angle)}
            stroke={color} strokeWidth="1" opacity="0.15"
          />
        )
      })}
    </svg>
  )
}

function AIAssistedArt({ color }: { color: string }) {
  const nodes = [
    { x: 220, y: 30 }, { x: 260, y: 80 }, { x: 200, y: 110 },
    { x: 250, y: 140 }, { x: 180, y: 60 }, { x: 270, y: 40 },
  ]
  const edges = [[0,1],[0,4],[0,5],[1,2],[1,3],[1,5],[2,3],[4,5]]
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      {/* Node graph — human+model collaboration */}
      <g opacity="0.15" stroke={color} strokeWidth="1">
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
        ))}
      </g>
      <g opacity="0.22" fill={color}>
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={i === 0 ? 5 : 3} />
        ))}
      </g>
      {/* Flowing wave beneath */}
      <g opacity="0.08" stroke={color} fill="none" strokeWidth="1.2">
        <path d="M 160 160 Q 190 140 220 155 Q 250 170 280 150" />
        <path d="M 160 170 Q 195 152 225 165 Q 255 178 280 162" />
      </g>
    </svg>
  )
}

function AgenticArt({ color }: { color: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      {/* Recursive spiral — autonomous loops */}
      <g opacity="0.16" stroke={color} fill="none" strokeWidth="1.2">
        <path d="M 250 50 C 280 50 280 90 250 90 C 220 90 200 70 210 50 C 220 30 260 20 270 40 C 280 60 265 95 240 100 C 210 105 190 80 198 55 C 206 30 240 10 258 28" />
      </g>
      {/* Arrow-heads suggesting direction */}
      <g opacity="0.18" fill={color}>
        <polygon points="258,18 262,30 252,26" />
      </g>
      {/* Concentric dashed loops */}
      {[55, 75, 95].map((r, i) => (
        <circle key={i} cx="245" cy="70" r={r} stroke={color} strokeWidth="0.8" fill="none"
          strokeDasharray="4 6" opacity="0.10" />
      ))}
    </svg>
  )
}

function AINativeArt({ color }: { color: string }) {
  const sparks = Array.from({ length: 18 }, (_, i) => {
    const angle = (i * 20 * Math.PI) / 180
    const r = 30 + (i % 3) * 20
    return {
      x1: 250 + 8 * Math.cos(angle),
      y1: 60 + 8 * Math.sin(angle),
      x2: 250 + r * Math.cos(angle),
      y2: 60 + r * Math.sin(angle),
      len: r,
    }
  })
  return (
    <svg width="100%" height="100%" viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      {/* Radial burst — emergence / generative */}
      <g stroke={color} fill="none">
        {sparks.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            strokeWidth={s.len > 45 ? 0.8 : 1.2}
            opacity={s.len > 45 ? 0.10 : 0.18}
          />
        ))}
      </g>
      {/* Center dot */}
      <circle cx="250" cy="60" r="4" fill={color} opacity="0.22" />
      {/* Scattered small rects */}
      {[[180, 130], [200, 150], [215, 125], [195, 110], [175, 145]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="4" height="4" rx="1"
          fill={color} opacity="0.12" transform={`rotate(${i * 17} ${x} ${y})`} />
      ))}
    </svg>
  )
}

const PARADIGM_ART: Record<string, React.FC<{ color: string }>> = {
  Traditional: TraditionalArt,
  'AI-Assisted': AIAssistedArt,
  Agentic: AgenticArt,
  'AI-Native': AINativeArt,
}

const DIFFICULTY_CONFIG: Record<string, { label: string; dot: string }> = {
  warmup:       { label: 'Warm-up',  dot: '#10b981' },
  standard:     { label: 'Standard', dot: '#f59e0b' },
  advanced:     { label: 'Advanced', dot: '#ef4444' },
  staff_plus:   { label: 'Staff+',   dot: '#8b5cf6' },
  beginner:     { label: 'Easy',     dot: '#10b981' },
  intermediate: { label: 'Medium',   dot: '#f59e0b' },
  hard:         { label: 'Hard',     dot: '#ef4444' },
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
  const style = PARADIGM_STYLE[paradigm] ?? PARADIGM_STYLE.Traditional
  const diff = DIFFICULTY_CONFIG[challenge.difficulty] ?? { label: challenge.difficulty, dot: '#74796e' }
  const attempts = challenge.attempt_count ?? 0

  if (listView) {
    return (
      <div
        className="flex items-center gap-4 px-4 py-3 group transition-all duration-200 hover:bg-surface-container/50"
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
            <p className="text-[11px] text-on-surface-variant font-body font-semibold truncate mt-0.5">
              {challenge.prompt_text}
            </p>
          )}
        </div>

        {/* Paradigm badge */}
        <span
          className="hidden sm:inline text-[11px] font-bold px-2 py-0.5 rounded-full font-label shrink-0"
          style={{ backgroundColor: style.bg, color: style.fg }}
        >
          {paradigm}
        </span>

        {/* Difficulty label */}
        <span className="hidden md:inline text-[11px] text-on-surface-variant font-label shrink-0 w-16 text-right">
          {diff.label}
        </span>

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
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full font-label transition-all duration-[120ms] active:scale-95 shrink-0 hover:-translate-y-px"
            style={{ backgroundColor: style.accent, color: '#fff' }}
          >
            Start
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </Link>
        )}
      </div>
    )
  }

  const Art = PARADIGM_ART[paradigm] ?? PARADIGM_ART.Traditional

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2 group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_6px_20px_-8px_rgba(30,27,20,0.22)]"
      style={{
        backgroundColor: style.bg,
        border: '1px solid rgba(0,0,0,0.04)',
        minHeight: 140,
      }}
    >
      {/* SVG art background */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Art color={style.accent} />
      </div>

      {/* Top row: paradigm badge + difficulty */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full font-label"
          style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: style.fg }}
        >
          {paradigm}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium font-label" style={{ color: `${style.fg}bb` }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: diff.dot }} />
          {diff.label}
        </span>
      </div>

      {/* Title */}
      <Link href={`/workspace/challenges/${challenge.slug ?? challenge.id}`} className="block">
        <h3
          className="font-headline font-[600] text-[16px] tracking-[-0.01em] leading-snug transition-colors"
          style={{ color: style.fg, textWrap: 'balance' } as React.CSSProperties}
        >
          {challenge.title}
        </h3>
      </Link>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[11px] font-label flex items-center gap-2" style={{ color: `${style.fg}a0` }}>
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 0" }}>group</span>
            {attempts > 0 ? attempts : '—'}
          </span>
        </span>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/challenges/${challenge.slug ?? challenge.id}/discussion`}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: `${style.fg}80` }}
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
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full font-label transition-all duration-[120ms] active:scale-95 hover:-translate-y-px"
              style={{ backgroundColor: style.accent, color: '#fff' }}
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
