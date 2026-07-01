'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MaskoAvatar } from '@/components/shell/MaskoAvatar'
import { useOnboardingModal } from '@/context/OnboardingModalContext'

const COMPETENCY_LABELS: Record<string, string> = {
  motivation_theory: 'Motivation Theory',
  cognitive_empathy: 'Cognitive Empathy',
  taste: 'Taste',
  strategic_thinking: 'Strategic Thinking',
  creative_execution: 'Creative Execution',
  domain_expertise: 'Domain Expertise',
}

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

function buildCoachLine(opts: {
  weakestCompetency: string | null
  competencyScore: number | null
  trend: string | null
  recentCompletions: number
}): { headline: string; sub: string | null } {
  const { weakestCompetency, competencyScore, trend, recentCompletions } = opts

  if (!weakestCompetency) {
    return {
      headline: "Let's find your starting point.",
      sub: 'Do one calibration challenge and Hatch will set up the rest of your dashboard around what you need.',
    }
  }

  const label = COMPETENCY_LABELS[weakestCompetency] ?? weakestCompetency
  const nextMove = COMPETENCY_TO_NEXT_MOVE[weakestCompetency] ?? 'a challenge'
  const scoreCtx =
    competencyScore === null
      ? ''
      : competencyScore < 35
      ? 'Early stage.'
      : competencyScore < 60
      ? 'Developing.'
      : 'Solid foundation.'
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

  return {
    headline: `${completionsCtx}${label} is the gap right now.`,
    sub: [trendLine, `${scoreCtx} ${nextMove.charAt(0).toUpperCase() + nextMove.slice(1)} is the rep that moves you most.`]
      .filter(Boolean)
      .join(' ')
      .trim(),
  }
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
  weakestCompetency?: string | null
  competencyScore?: number | null
  competencyTrend?: string | null
  recentCompletions?: number
  /** True when the user has never completed a challenge attempt. Swaps the primary CTA to the curated first rep. */
  isFirstRep?: boolean
  /** Curated first-rep challenge link (src/lib/onboarding/curated-first-rep.ts), used only when isFirstRep is true. */
  firstRepHref?: string
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
  recentCompletions = 0,
  isFirstRep = false,
  firstRepHref,
}: CoachSpineCardProps) {
  const [whyOpen, setWhyOpen] = useState(false)
  const { openModal } = useOnboardingModal()
  const hasRealData = isCalibrated && weakestCompetency !== null

  const { headline, sub } = isCalibrated && isFirstRep
    ? {
        headline: "Let's get your first rep in.",
        sub: 'One real scenario, about 7 minutes. Hatch scores it and starts building your FLOW profile from there.',
      }
    : buildCoachLine({
        weakestCompetency: hasRealData ? weakestCompetency : null,
        competencyScore,
        trend: competencyTrend,
        recentCompletions,
      })

  const competencyLabel = weakestCompetency ? (COMPETENCY_LABELS[weakestCompetency] ?? weakestCompetency) : null
  const nextMove = weakestCompetency ? (COMPETENCY_TO_NEXT_MOVE[weakestCompetency] ?? 'a challenge') : null

  return (
    <article
      data-hatch-target="dashboard-hero"
      className="relative min-h-[256px] overflow-hidden rounded-[24px] text-[#f3ede0] shadow-[0_24px_50px_-34px_rgba(15,33,24,0.9)] sm:min-h-[270px]"
      style={{
        background: 'linear-gradient(118deg, #0f2118 0%, #284f35 58%, #4a7c59 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.055]" style={{ mixBlendMode: 'soft-light' }}>
        <filter id="coach-spine-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#coach-spine-noise)" />
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(520px 320px at -5% 105%, rgba(201,147,58,0.2), transparent 56%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          maskImage: 'linear-gradient(to right, black 0%, transparent 58%)',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 58%)',
        }}
      />

      <div
        className="pointer-events-none absolute right-[-8px] top-4 z-0 hidden opacity-75 sm:block sm:right-4 sm:top-1/2 sm:-translate-y-1/2 sm:opacity-95 lg:right-7"
        aria-hidden
        data-hatch-target="dashboard-hero-avatar"
      >
        <MaskoAvatar
          size={176}
          className="h-24 w-24 sm:h-36 sm:w-36 lg:h-44 lg:w-44"
          style={{ filter: 'drop-shadow(0 8px 32px rgba(126,224,153,0.35)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
        />
      </div>

      <div className="relative z-10 p-4 sm:p-6 sm:pr-44 lg:pr-[238px]">
        <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-label font-semibold uppercase tracking-[0.12em] text-[#cfe3d3] sm:text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7ee099] shadow-[0_0_0_4px_rgba(126,224,153,0.2)]" />
          Hatch / today&apos;s brief
        </div>

        <h1 className="mb-2 max-w-[17ch] text-balance font-headline text-[26px] font-semibold leading-[0.98] tracking-tight sm:max-w-[16ch] sm:text-[36px]" suppressHydrationWarning>
          {timeOfDay()}, {displayName}.
        </h1>

        <p className="max-w-[45ch] text-[13.5px] leading-snug text-[#f3ede0]/88 sm:text-[15px]">{headline}</p>
        {sub && <p className="mt-1 hidden max-w-[46ch] text-[12.5px] leading-5 text-[#f3ede0]/62 sm:block">{sub}</p>}

        {hasRealData && competencyLabel && nextMove && (
          <button
            type="button"
            onClick={() => setWhyOpen(o => !o)}
            className="mt-2 inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[10px] font-label font-semibold uppercase tracking-[0.1em] text-[#f3ede0]/55 transition-colors hover:text-[#f3ede0]/80 sm:text-[11px]"
          >
            {whyOpen ? 'Hide rationale' : 'Why this?'}
            <span className="material-symbols-outlined text-[13px]">{whyOpen ? 'expand_less' : 'expand_more'}</span>
          </button>
        )}

        {whyOpen && competencyLabel && nextMove && (
          <div className="mt-2.5 max-w-[48ch] rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-2.5 text-[12px] leading-5 text-[#cfe3d3]">
            Hatch tracks six competency dimensions across every rep. Your scores put{' '}
            <strong className="text-[#f3ede0]">{competencyLabel}</strong> at the bottom right now
            {competencyScore !== null ? ` (${competencyScore}/100)` : ''}
            {competencyTrend === 'improving' ? ', though it is trending up' : competencyTrend === 'declining' ? ', and it has been dipping lately' : ''}.
            {' '}The next rep is <strong className="text-[#f3ede0]">{nextMove}</strong> because that step builds this skill most directly.
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {isCalibrated && isFirstRep && firstRepHref ? (
            <Link
              href={firstRepHref}
              data-hatch-target="dashboard-first-rep"
              className="animate-cta-pulse inline-flex max-w-full items-center justify-center gap-1.5 rounded-full bg-[#f3ede0] px-3.5 py-2 font-label text-[12px] font-bold text-[#1e1b14] no-underline transition-opacity hover:opacity-90 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Do your first rep (~7 min)
            </Link>
          ) : isCalibrated ? (
            <>
              <Link
                href={sessionHref}
                data-hatch-target="dashboard-session"
                className="inline-flex max-w-full items-center justify-center gap-1.5 rounded-full bg-[#f3ede0] px-3.5 py-2 font-label text-[12px] font-bold text-[#1e1b14] no-underline transition-opacity hover:opacity-90 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                Start today&apos;s session
              </Link>
              <Link
                href={studyPlanHref}
                data-hatch-target="dashboard-study-plan"
                className="inline-flex max-w-full items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 font-label text-[12px] font-bold text-[#f3ede0] no-underline transition-colors hover:bg-white/10 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                Study plan
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => openModal('hero')}
              data-hatch-target="dashboard-calibrate"
              className="animate-cta-pulse inline-flex max-w-full items-center justify-center gap-2 rounded-full bg-[#f3ede0] px-4 py-2.5 font-label text-[13px] font-bold text-[#1e1b14] transition-opacity hover:opacity-90 sm:px-6 sm:text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Start calibration
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 mx-4 mb-4 mt-0 grid grid-cols-4 gap-2 border-t border-white/10 pt-3 sm:mx-6 sm:mb-5 sm:gap-2.5">
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
            sublabel: 'all moves',
            icon: 'bolt',
          },
          {
            value: focusMove,
            unit: `focus / Lv ${focusLevel}`,
            sublabel: 'lowest move',
            icon: 'center_focus_strong',
          },
          {
            value: `${dailyDone}`,
            unit: 'done today',
            sublabel: 'reps logged',
            icon: 'event',
          },
        ].map(s => (
          <div key={s.unit} className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="material-symbols-outlined hidden shrink-0 text-[17px] text-[#f3ede0]/60 sm:inline-block">{s.icon}</span>
            <div className="min-w-0">
              <span className="block truncate font-headline text-[13px] font-medium leading-none text-[#f3ede0] sm:text-lg">{s.value}</span>
              <span className="mt-0.5 block truncate font-label text-[8px] font-semibold uppercase tracking-[0.06em] text-[#f3ede0]/55 sm:text-[10px]">{s.unit}</span>
              <p className="mt-0.5 hidden truncate font-body text-[11px] text-[#f3ede0]/42 sm:block">{s.sublabel}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
