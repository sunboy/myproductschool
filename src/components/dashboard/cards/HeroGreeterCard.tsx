'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const lines = [
  "Ready for today's session? I lined up challenges that build on where you left off.",
  'Your Frame move is leveling up — keep going.',
  "Consistent practice compounds. You're on a streak — let's extend it.",
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
}

export function HeroGreeterCard({ displayName, streakDays, xpTotal }: HeroGreeterCardProps) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % lines.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="relative rounded-3xl p-7 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3e6a4b 0%, #264a34 60%, #1d3a26 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: 200,
        color: '#f3ede0',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(420px 260px at 80% 50%, rgba(191,240,199,0.22), transparent 60%), radial-gradient(300px 200px at 20% 90%, rgba(201,147,58,0.18), transparent 60%)',
        }}
      />
      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          maskImage: 'linear-gradient(to right, black 30%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 90%)',
        }}
      />

      <div className="relative grid gap-6 items-center" style={{ gridTemplateColumns: '1fr auto' }}>
        <div>
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
          <p key={idx} className="text-[15.5px] leading-relaxed opacity-80 max-w-lg">
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
        <div className="relative hidden lg:block">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none blur-md"
            style={{
              background:
                'radial-gradient(120px 120px at 50% 50%, rgba(191,240,199,0.35), transparent 70%)',
            }}
          />
          <div className="animate-luma-float">
            <LumaGlyph size={96} state="idle" className="text-white" />
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div
        className="relative mt-6 pt-5 grid grid-cols-4 gap-6"
        style={{ borderTop: '1px dashed rgba(255,255,255,0.12)' }}
      >
        {[
          {
            k: 'Current streak',
            v: `${streakDays}`,
            sub: streakDays === 1 ? 'day — keep it alive' : "days — you're on fire",
            icon: 'local_fire_department',
          },
          { k: 'XP today', v: `${xpTotal}`, sub: 'total XP earned', icon: 'bolt' },
          { k: 'Next milestone', v: 'Lv 4', sub: 'Frame · keep practicing', icon: 'flag' },
          { k: 'Due this week', v: '3', sub: 'challenges queued', icon: 'event' },
        ].map((s, i) => (
          <div key={i}>
            <div
              className="flex items-center gap-2 text-[11px] font-label font-bold tracking-widest uppercase mb-1"
              style={{ color: 'rgba(243,237,224,0.55)' }}
            >
              <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
              {s.k}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-2xl font-medium">{s.v}</span>
              <span className="text-xs" style={{ color: 'rgba(243,237,224,0.6)' }}>
                {s.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
