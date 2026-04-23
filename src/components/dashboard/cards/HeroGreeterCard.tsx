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
}

export function HeroGreeterCard({ displayName, streakDays, xpTotal, nextMilestoneMove, nextMilestoneLevel, dailyDone }: HeroGreeterCardProps) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % lines.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div
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

      {/* Mascot halo — bright green bloom on right where it's lighter */}
      <div
        aria-hidden
        className="absolute pointer-events-none hidden lg:block"
        style={{
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 260,
          height: 260,
          background: 'radial-gradient(ellipse at center, rgba(142,207,158,0.32) 0%, rgba(74,124,89,0.15) 45%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      {/* Diagonal stripe texture — subtle, right-side only */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04] hidden lg:block"
        style={{
          backgroundImage: 'repeating-linear-gradient(55deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 18px)',
          maskImage: 'linear-gradient(to left, black 0%, transparent 50%)',
          WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 50%)',
        }}
      />

      {/* Dot grid — left content area */}
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

      {/* Mascot — top-anchored, right side */}
      <div className="absolute top-4 right-8 hidden lg:block" aria-hidden>
        <MaskoAvatar size={200} style={{ filter: 'drop-shadow(0 8px 32px rgba(126,224,153,0.35)) drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
      </div>

      <div className="relative p-7 pb-2" style={{ paddingRight: 'max(1.75rem, 280px)' }}>
        {/* Luma badge */}
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
          Luma · Your coach
        </div>
        <h1
          className="font-headline text-[34px] leading-tight font-medium tracking-tight mb-2.5"
          suppressHydrationWarning
        >
          {timeOfDay()}, {displayName}.
        </h1>
        <p key={idx} className="animate-fade-up text-[15.5px] opacity-80" style={{ lineHeight: '1.5', height: '1.5em' }}>
          {lines[idx]}
        </p>
        <div className="flex gap-2.5 mt-5">
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-label font-bold text-sm"
            style={{ background: '#f3ede0', color: '#1e1b14' }}
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            Start today&apos;s session
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-label font-bold text-sm"
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
        className="relative mx-7 mt-4 pt-4 mb-5 grid grid-cols-4 gap-4"
        style={{}}
      >
        {[
          {
            k: 'Current streak',
            v: `${streakDays}`,
            sub: streakDays === 1 ? 'Day — Keep It Alive' : "Days — You're On Fire",
            icon: 'local_fire_department',
          },
          { k: 'XP today', v: `${xpTotal}`, sub: 'Total XP Earned', icon: 'bolt' },
          { k: 'Next milestone', v: `Lv ${nextMilestoneLevel}`, sub: `${nextMilestoneMove} · Keep Practicing`, icon: 'flag' },
          { k: 'Due this week', v: `${dailyDone}/5`, sub: 'Done Today', icon: 'event' },
        ].map((s, i) => (
          <div key={i} className="flex items-baseline gap-1.5">
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'rgba(243,237,224,0.6)', alignSelf: 'center' }}>{s.icon}</span>
            <span className="font-headline text-xl font-medium">{s.v}</span>
            <span className="text-[11px] font-semibold" style={{ color: 'rgba(243,237,224,0.6)' }}>{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
