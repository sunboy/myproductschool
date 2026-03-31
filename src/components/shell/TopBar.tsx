'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LumaGlyph } from './LumaGlyph'

interface ProfileBadge {
  streak_days: number
  xp_total: number
}

export function TopBar() {
  const [profile, setProfile] = useState<ProfileBadge | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProfile({ streak_days: data.streak_days ?? 0, xp_total: data.xp_total ?? 0 }) })
      .catch(() => {})
  }, [])

  const streakDays = profile?.streak_days ?? 0
  const xpTotal = profile?.xp_total ?? 0

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-lg border-b border-outline-variant/40">
      <div className="flex items-center gap-3 px-4 h-13">

        {/* Mobile: logo */}
        <div className="md:hidden shrink-0">
          <LumaGlyph size={22} className="text-primary animate-luma-glow" state="idle" />
        </div>

        {/* Search */}
        <div className="flex-1 flex">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search challenges, concepts..."
              className="w-full bg-surface-container rounded-full pl-9 pr-4 py-1.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none border border-outline-variant/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Right badges + avatar */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Streak */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-tertiary-fixed/70 rounded-full">
            <span
              className="material-symbols-outlined text-tertiary text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="text-xs font-bold text-tertiary font-label">{streakDays}</span>
          </div>

          {/* XP */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-primary-fixed/70 rounded-full">
            <span className="text-xs font-bold text-primary font-label">{xpTotal.toLocaleString()} XP</span>
          </div>

          {/* Avatar */}
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="text-xs font-bold text-on-primary font-label">S</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
