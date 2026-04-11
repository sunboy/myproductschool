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
  const [dailyDone, setDailyDone] = useState<number | null>(null)
  const dailyTotal = 5
  const pct = dailyDone != null && dailyTotal > 0 ? Math.round((dailyDone / dailyTotal) * 100) : 0

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.daily_attempts_today != null) setDailyDone(data.daily_attempts_today) })
      .catch(() => {})
  }, [])

  return (
    <nav className="hidden md:flex flex-col h-screen sticky top-0 w-56 bg-primary shrink-0 text-white">

      {/* ── Brand ── */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <LumaGlyph size={24} state="idle" className="text-white shrink-0" />
        <span className="font-headline text-base font-bold text-white tracking-tight">HackProduct</span>
      </div>

      {/* ── Nav items ── */}
      <div className="flex-1 px-2 py-2 space-y-px">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px] shrink-0 leading-none"
                style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}
              >
                {item.icon}
              </span>
              <span className={`text-sm tracking-tight font-label ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
              )}
            </Link>
          )
        })}
      </div>

      {/* ── Bottom section ── */}
      <div className="px-3 pb-5 space-y-2">

        {/* Daily Goal */}
        <div className="bg-black/15 rounded-xl px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-label">Daily Goal</span>
            <span className="text-[11px] font-bold text-white font-label tabular-nums" suppressHydrationWarning>
              {dailyDone ?? 0}/{dailyTotal}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/90 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {dailyDone != null && (
            <p className="text-[10px] mt-1.5 font-label" suppressHydrationWarning>
              {dailyDone >= dailyTotal
                ? <span className="text-white/70 font-bold">Goal complete!</span>
                : <span className="text-white/50">{dailyTotal - dailyDone} more to hit your goal</span>
              }
            </p>
          )}
        </div>

        {/* Ask Luma */}
        <button
          onClick={onAskLuma}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/18 text-white w-full transition-all duration-200 group"
        >
          <LumaGlyph size={16} state="idle" className="shrink-0" />
          <span className="text-xs font-semibold font-label">Ask Luma</span>
          <span className="ml-auto material-symbols-outlined text-sm text-white/50 group-hover:text-white/70 transition-colors">chevron_right</span>
        </button>

        {/* Pro upgrade */}
        <Link
          href="/pricing"
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
        >
          <span
            className="material-symbols-outlined text-[16px] shrink-0"
            style={{ fontVariationSettings: "'FILL' 1", color: '#fbbf24' }}
          >
            workspace_premium
          </span>
          <span className="text-[11px] font-semibold text-white/70 font-label group-hover:text-white transition-colors">Upgrade to Pro</span>
        </Link>
      </div>
    </nav>
  )
}
