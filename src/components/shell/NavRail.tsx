'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LumaGlyph } from './LumaGlyph'

const navItems = [
  { href: '/dashboard',   icon: 'home',           label: 'Home'     },
  { href: '/explore',     icon: 'explore',        label: 'Explore'  },
  { href: '/challenges',  icon: 'fitness_center', label: 'Practice' },
  { href: '/live-interviews', icon: 'mic',        label: 'Interviews' },
  { href: '/progress',    icon: 'bar_chart',      label: 'Progress' },
]

interface NavRailProps {
  onAskLuma?: () => void
}

export function NavRail({ onAskLuma }: NavRailProps) {
  const pathname = usePathname()
  const [dailyDone, setDailyDone] = useState(0)
  const dailyTotal = 5
  const pct = dailyTotal > 0 ? Math.round((dailyDone / dailyTotal) * 100) : 0

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.daily_attempts_today != null) setDailyDone(data.daily_attempts_today) })
      .catch(() => {})
  }, [])

  return (
    <nav className="hidden md:flex flex-col h-screen sticky top-0 w-56 bg-primary shrink-0 text-white">

      {/* ── Brand ── */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <LumaGlyph size={26} state="idle" className="text-white shrink-0" />
        <span className="font-headline text-base font-bold text-white tracking-tight">HackProduct</span>
      </div>

      {/* ── Nav items ── */}
      <div className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 ${
                active
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl shrink-0"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className={`text-sm font-semibold tracking-tight ${active ? 'font-bold' : ''}`}>
                {item.label}
              </span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          )
        })}
      </div>

      {/* ── Bottom section ── */}
      <div className="px-3 pb-4 space-y-3">

        {/* Daily Goal */}
        <div className="bg-black/10 rounded-xl px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 font-label">Daily Goal</span>
            <span className="text-[11px] font-bold text-white font-label">{dailyDone}/{dailyTotal}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-white/60 mt-1 font-label">{dailyDone} of {dailyTotal} challenges done</p>
        </div>

        {/* Pro upgrade */}
        <Link
          href="/pricing"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group"
        >
          <span
            className="material-symbols-outlined text-amber-400 text-base shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            workspace_premium
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-white font-label leading-none">Upgrade to Pro</p>
            <p className="text-[10px] text-white/60 font-label mt-0.5">Unlock all challenges</p>
          </div>
        </Link>

        {/* Ask Luma */}
        <button
          onClick={onAskLuma}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white w-full transition-colors"
        >
          <LumaGlyph size={16} state="idle" className="shrink-0" />
          <span className="text-xs font-semibold font-label">Ask Luma</span>
        </button>
      </div>
    </nav>
  )
}
