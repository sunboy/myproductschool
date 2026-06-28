'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MaskoAvatar } from '@/components/shell/MaskoAvatar'
import { useOnboardingModal } from '@/context/OnboardingModalContext'

// Human-readable competency labels — never expose internal keys in user copy.
const COMPETENCY_LABELS: Record<string, string> = {
  motivation_theory: 'Motivation Theory',
  cognitive_empathy: 'Cognitive Empathy',
  taste: 'Taste',
  strategic_thinking: 'Strategic Thinking',
  creative_execution: 'Creative Execution',
  domain_expertise: 'Domain Expertise',
}

// Maps competency → the single reasoning move that builds it most directly.
const COMPETENCY_TO_NEXT_MOVE: Record<string, string> = {
  motivation_theory: 'a Frame challenge',
  cognitive_empathy: 'a List challenge',
  taste: 'an Optimize challenge',
  strategic_thinking: 'a Win challenge',
  creative_execution: 'a List challenge',
  domain_expertise: 'a Win challenge',
}

function timeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Produces a grounded one-liner from real data, or falls back gracefully.
function buildCoachLine(opts: {
  weakestCompetency: string | null
  competencyScore: number | null
  trend: string | null
  overallLevel: string
  recentCompletions: number
}): { headline: string; sub: string | null } {
  const { weakestCompetency, competencyScore, trend, overallLevel, recentCompletions } = opts

  if (!weakestCompetency) {
    // New user — no data yet
    return {
      headline: "Let's find your starting point.",
      sub: null,
    }
  }

  const label = COMPETENCY_LABELS[weakestCompetency] ?? weakestCompetency
  const nextMove = COMPETENCY_TO_NEXT_MOVE[weakestCompetency] ?? 'a challenge'

  let scoreCtx = ''
  if (competencyScore !== null) {
    if (competencyScore < 35) scoreCtx = 'early stage'
    else if (competencyScore < 60) scoreCtx = 'developing'
    else scoreCtx = 'solid foundation'
  }

  const trendLine =
    trend === 'improving'
      ? 'It is moving in the right direction.'
      : trend === 'declining'
      ? 'The last few reps show a dip here.'
      : ''

  const completionsCtx =
    recentCompletions > 0
      ? `Across ${recentCompletions} recent ${recentCompletions === 1 ? 'challenge' : 'challenges'}, `
      : ''

  const headline = `${completionsCtx}${label} is the gap right now.`
  const sub = [trendLine, scoreCtx ? `${scoreCtx.charAt(0).toUpperCase() + scoreCtx.slice(1)}. ${nextMove.charAt(0).toUpperCase() + nextMove.slice(1)} is the rep that moves you most.` : `${nextMove.charAt(0).toUpperCase() + nextMove.slice(1)} is the rep that moves you most.`]
    .filter(Boolean)
    .join(' ')

  return { headline, sub }
}

export interface CoachSpineCardProps {
  displayName: string
  streakDays: number
  xpTotal: number
  focusMove: string
  focusLevel: number
  dailyDone: number
  sessionHref?: string
  studyPlanHref?: string
  isCalibrated?: boolean
  // From getHatchContext
  weakestCompetency?: string | null
  competencyScore?: number | null
  competencyTrend?: string | null
  overallLevel?: string
  recentCompletions?: number
}

export function CoachSpineCard({
  displayName,
  streakDays,
  xpTotal,
  focusMove,
  focusLevel,
  dailyDone,
  sessionHref = '/challenges',
  studyPlanHref = '/explore/plans',
  isCalibrated = true,
  weakestCompetency = null,
  competencyScore = null,
  competencyTrend = null,
  overallLevel = 'Beginner',
  recentCompletions = 0,
}: CoachSpineCardProps) {
  const [whyOpen, setWhyOpen] = useState(false)
  const { openModal } = useOnboardingModal()

  const hasRealData = isCalibrated && weakestCompetency !== null

  const { headline, sub } = buildCoachLine({
    weakestCompetency: hasRealData ? weakestCompetency : null,
    competencyScore,
    trend: competencyTrend,
    overallLevel,
    recentCompletions,
  })

  const competencyLabel = weakestCompetency ? (COMPETENCY_LABELS[weakestCompetency] ?? weakestCompetency) : null
  const nextMove = weakestCompetency ? (COMPETENCY_TO_NEXT_MOVE[weakestCompetency] ?? 'a challenge') : null

  return (
    <div
      data-hatch-target="dashboard-hero"
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(to right, #0f2118 0%, #3e6a4b 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        minHeight: 220,
        color: '#f3ede0',
      }}
    >
      {/* Noise texture overlay */}
      <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]" style={{ mixBlendMode: 'soft-light' }}>
        <filter id="coach-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#coach-noise)" />
      </svg>

      {/* Bottom-left amber warmth */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(500px 320px at -5% 110%, rgba(201,147,58,0.18), transparent 55%)',
        }}
      />

      {/* Mascot halo */}
      <div
        aria-hidden
        className="absolute pointer-events-none right-[-36px] top-[-18px] h-40 w-40 opacity-70 sm:right-[-18px] sm:top-3 sm:h-48 sm:w-48 md:right-2 md:top-1/2 md:h-56 md:w-56 md:-translate-y-1/2 lg:right-6 lg:h-[260px] lg:w-[260px] lg:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(142,207,158,0.32) 0%, rgba(74,124,89,0.15) 45%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      {/* Diagonal stripe texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04] hidden lg:block"
        style={{
          backgroundImage: 'repeating-linear-gradient(55deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 18px)',
          maskImage: 'linear-gradient(to left, black 0%, transparent 50%)',
          WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 50%)',
        }}
      />

      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          maskImage: 'linear-gradient(to right, black 0%, transparent 55%)',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 55%)',
        }}
      />

      {/* Mascot */}
      <div
        className="absolute right-[-8px] top-3 z-0 pointer-events-none opacity-80 sm:right-2 sm:top-4 sm:opacity-90 md:right-5 md:top-1/2 md:-translate-y-1/2 lg:right-8 lg:opacity-100"
        aria-hidden
        data-hatch-target="dashboard-hero-avatar"
      >
        <MaskoAvatar
          size={200}
          className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-[200px] lg:w-[200px]"
          style={{ filter: 'drop-shadow(0 8px 32px rgba(126,224,153,0.35)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
        />
      </div>

      <div className="relative z-10 p-5 pb-2 pr-24 sm:p-7 sm:pb-2 sm:pr-40 md:pr-52 lg:pr-[280px]">
        {/* Hatch badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-label font-semibold tracking-wider uppercase mb-3"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#cfe3d3',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#7ee099', boxShadow: '0 0 0 4px rgba(126,224,153,0.2)' }}
          />
          Hatch · Your coach
        </div>

        <h1
          className="font-headline text-[28px] leading-tight font-medium tracking-tight mb-2.5 sm:text-[34px]"
          suppressHydrationWarning
        >
          {timeOfDay()}, {displayName}.
        </h1>

        {/* Data-grounded coach read */}
        <p className="text-[15.5px] opacity-85 leading-snug">
          {headline}
        </p>
        {sub && (
          <p className="text-[13px] mt-1.5 opacity-60 leading-relaxed">
            {sub}
          </p>
        )}

        {/* "Why this?" affordance — only when there's real competency data */}
        {hasRealData && competencyLabel && nextMove && (
          <button
            type="button"
            onClick={() => setWhyOpen(o => !o)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-label font-semibold tracking-wide uppercase"
            style={{ color: 'rgba(243,237,224,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {whyOpen ? 'Hide' : 'Why this?'}
            <span className="material-symbols-outlined text-[13px]">{whyOpen ? 'expand_less' : 'expand_more'}</span>
          </button>
        )}

        {whyOpen && competencyLabel && nextMove && (
          <div
            className="mt-2 rounded-xl px-3.5 py-3 text-[12px] leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', color: '#cfe3d3' }}
          >
            Hatch tracks six competency dimensions across every rep. Your scores put{' '}
            <strong style={{ color: '#f3ede0' }}>{competencyLabel}</strong> at the bottom right now
            {competencyScore !== null ? ` (${competencyScore}/100)` : ''}
            {competencyTrend === 'improving' ? ', though it is trending up' : competencyTrend === 'declining' ? ', and it has been dipping lately' : ''}.
            {' '}The next rep is{' '}
            <strong style={{ color: '#f3ede0' }}>{nextMove}</strong> because that step builds this skill most directly.
          </div>
        )}

        <div className="flex flex-wrap gap-2.5 mt-5">
          {isCalibrated ? (
            <>
              <Link
                href={sessionHref}
                data-hatch-target="dashboard-session"
                className="inline-flex max-w-full items-center justify-center gap-2 rounded-full px-3.5 py-2.5 font-label text-[13px] font-bold sm:px-5 sm:py-3 sm:text-sm"
                style={{ background: '#f3ede0', color: '#1e1b14' }}
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                Start today&apos;s session
              </Link>
              <Link
                href={studyPlanHref}
                data-hatch-target="dashboard-study-plan"
                className="inline-flex max-w-full items-center justify-center gap-2 rounded-full px-3.5 py-2.5 font-label text-[13px] font-bold sm:px-5 sm:py-3 sm:text-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: '#f3ede0',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                Open study plan
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => openModal('hero')}
              data-hatch-target="dashboard-calibrate"
              className="animate-cta-pulse inline-flex max-w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 font-label text-[13px] font-bold sm:px-6 sm:py-3 sm:text-sm"
              style={{ background: '#f3ede0', color: '#1e1b14' }}
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Start calibration
            </button>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <div
        className="relative mx-5 mt-4 mb-5 grid grid-cols-1 gap-x-3 gap-y-3 border-t border-white/10 pt-4 sm:mx-7 sm:grid-cols-2 md:grid-cols-[1.35fr_0.8fr_1fr_1fr] md:gap-4"
      >
        {[
          {
            value: `${streakDays}`,
            unit: 'day streak',
            sublabel: streakDays === 0 ? 'start today' : streakDays === 1 ? 'keep it going' : 'stay consistent',
            icon: 'local_fire_department',
          },
          {
            value: `${xpTotal.toLocaleString()}`,
            unit: 'total XP',
            sublabel: 'across all moves',
            icon: 'bolt',
          },
          {
            value: focusMove,
            unit: `focus · Lv ${focusLevel}`,
            sublabel: 'your weakest move',
            icon: 'center_focus_strong',
          },
          {
            value: `${dailyDone}`,
            unit: 'done today',
            sublabel: 'reps logged',
            icon: 'event',
          },
        ].map((s, i) => (
          <div key={i} className="flex min-w-0 items-center gap-2.5">
            <span
              className="material-symbols-outlined shrink-0 text-[17px]"
              style={{ color: 'rgba(243,237,224,0.6)' }}
            >
              {s.icon}
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 items-baseline gap-1.5">
                <span className="font-headline text-lg font-medium leading-none sm:text-xl truncate" style={{ color: '#f3ede0' }}>
                  {s.value}
                </span>
                <span className="font-label text-[10px] font-semibold uppercase tracking-wider truncate" style={{ color: 'rgba(243,237,224,0.55)' }}>
                  {s.unit}
                </span>
              </div>
              <p className="font-body text-[11px] mt-0.5 truncate" style={{ color: 'rgba(243,237,224,0.42)' }}>
                {s.sublabel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
