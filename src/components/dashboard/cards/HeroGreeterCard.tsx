'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MaskoAvatar } from '@/components/shell/MaskoAvatar'

const lines = [
  "I lined up challenges that build on where you left off.",
  'Your Frame move is leveling up. Keep going.',
  "Consistent practice compounds. Keep the streak alive.",
]

function timeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface HeroGreeterCardProps {
  displayName: string
  streakDays: number
  xpTotal: number
  nextMilestoneMove: string
  nextMilestoneLevel: number
  dailyDone: number
  sessionHref?: string
  studyPlanHref?: string
}

export function HeroGreeterCard({ displayName, streakDays, xpTotal, nextMilestoneMove, nextMilestoneLevel, dailyDone, sessionHref = '/challenges', studyPlanHref = '/explore/plans' }: HeroGreeterCardProps) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % lines.length), 5000)
    return () => clearInterval(t)
  }, [])

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
        <filter id="hero-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-noise)" />
      </svg>

      {/* Bottom-left amber warmth */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(500px 320px at -5% 110%, rgba(201,147,58,0.18), transparent 55%)',
        }}
      />

      {/* Mascot halo: bright green bloom on right where it's lighter */}
      <div
        aria-hidden
        className="absolute pointer-events-none right-[-36px] top-[-18px] h-40 w-40 opacity-70 sm:right-[-18px] sm:top-3 sm:h-48 sm:w-48 md:right-2 md:top-1/2 md:h-56 md:w-56 md:-translate-y-1/2 lg:right-6 lg:h-[260px] lg:w-[260px] lg:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(142,207,158,0.32) 0%, rgba(74,124,89,0.15) 45%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      {/* Diagonal stripe texture: subtle, right-side only */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04] hidden lg:block"
        style={{
          backgroundImage: 'repeating-linear-gradient(55deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 18px)',
          maskImage: 'linear-gradient(to left, black 0%, transparent 50%)',
          WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 50%)',
        }}
      />

      {/* Dot grid: left content area */}
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

      {/* Mascot — responsive right-side anchor */}
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
        <p key={idx} className="animate-fade-up text-[15.5px] opacity-80" style={{ lineHeight: '1.5', height: '1.5em' }}>
          {lines[idx]}
        </p>
        <div className="flex flex-wrap gap-2.5 mt-5">
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
        </div>
      </div>

      {/* Stat strip */}
      <div
        className="relative mx-5 mt-4 mb-5 grid grid-cols-1 gap-x-3 gap-y-3 border-t border-white/10 pt-4 sm:mx-7 sm:grid-cols-2 md:grid-cols-[1.35fr_0.8fr_1fr_1fr] md:gap-4"
        style={{}}
      >
        {[
          { text: `${streakDays}d - ${streakDays === 1 ? 'keep it alive' : "you're on fire"}`, icon: 'local_fire_department' },
          { text: `${xpTotal.toLocaleString()} XP`, icon: 'bolt' },
          { text: `Lv ${nextMilestoneLevel} - ${nextMilestoneMove}`, icon: 'flag' },
          { text: `${dailyDone}/5 this week`, icon: 'event' },
        ].map((s, i) => (
          <div key={i} className="flex min-w-0 items-center gap-2">
            <span
              className="material-symbols-outlined shrink-0 text-[17px]"
              style={{ color: 'rgba(243,237,224,0.6)' }}
            >
              {s.icon}
            </span>
            <span className="min-w-0 truncate whitespace-nowrap font-headline text-lg font-medium leading-none sm:text-xl">
              {s.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
