'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LumaGlyph } from './LumaGlyph'

const navItems = [
  { href: '/dashboard',   icon: 'home',           label: 'Home'     },
  { href: '/learn',       icon: 'auto_stories',   label: 'Learn'    },
  { href: '/explore',     icon: 'explore',        label: 'Explore'  },
  { href: '/challenges',  icon: 'fitness_center', label: 'Practice' },
  { href: '/progress',    icon: 'bar_chart',      label: 'Progress' },
]

interface NavRailProps {
  dailyDone?: number
  dailyTotal?: number
}

export function NavRail({ dailyDone = 0, dailyTotal = 5 }: NavRailProps) {
  const pathname = usePathname()
  const pct = dailyTotal > 0 ? Math.round((dailyDone / dailyTotal) * 100) : 0

  return (
    <nav className="hidden md:flex flex-col h-screen sticky top-0 w-56 bg-surface-container-low border-r border-outline-variant/60 shrink-0">

      {/* ── Brand ── */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-outline-variant/30">
        <LumaGlyph size={26} state="idle" className="text-primary shrink-0" />
        <span className="font-headline text-base font-bold text-primary tracking-tight">HackProduct</span>
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
                  ? 'bg-primary text-on-primary shadow-sm glow-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
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
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-on-primary/60" />
              )}
            </Link>
          )
        })}
      </div>

      {/* ── Bottom section ── */}
      <div className="px-3 pb-4 space-y-3">

        {/* Daily Goal */}
        <div className="bg-surface-container rounded-xl px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-label">Daily Goal</span>
            <span className="text-[11px] font-bold text-primary font-label">{dailyDone}/{dailyTotal}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-on-surface-variant mt-1 font-label">{dailyDone} of {dailyTotal} challenges done</p>
        </div>

        {/* Pro upgrade */}
        <Link
          href="/pricing"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-tertiary-fixed/60 hover:bg-tertiary-fixed transition-colors group"
        >
          <span
            className="material-symbols-outlined text-tertiary text-base shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            workspace_premium
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-tertiary font-label leading-none">Upgrade to Pro</p>
            <p className="text-[10px] text-on-tertiary-fixed-variant font-label mt-0.5">Unlock all challenges</p>
          </div>
        </Link>

        {/* Ask Luma */}
        <button
          disabled
          title="Coming soon"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/8 text-primary w-full opacity-50 cursor-not-allowed"
        >
          <LumaGlyph size={16} className="shrink-0" />
          <span className="text-xs font-semibold font-label">Ask Luma</span>
          <span className="ml-auto text-[9px] font-bold text-primary/60 font-label uppercase tracking-wider">Soon</span>
        </button>
      </div>
    </nav>
  )
}
