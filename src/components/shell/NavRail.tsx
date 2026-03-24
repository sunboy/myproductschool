'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LumaGlyph } from './LumaGlyph'

const navItems = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/domains', icon: 'grid_view', label: 'Domains' },
  { href: '/product-75', icon: 'menu_book', label: 'Product 75' },
  { href: '/challenges', icon: 'fitness_center', label: 'Practice' },
  { href: '/progress', icon: 'bar_chart', label: 'Progress' },
  { href: '/interview-prep', icon: 'workspace_premium', label: 'Interview Prep' },
  { href: '/simulation', icon: 'sports_esports', label: 'Simulation' },
  { href: '/frameworks', icon: 'collections_bookmark', label: 'Frameworks' },
]

const DAILY_GOAL_DONE = 3
const DAILY_GOAL_TOTAL = 5

export function NavRail() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex flex-col h-screen sticky top-0 w-60 bg-surface-container-low border-r border-outline-variant">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <LumaGlyph size={28} className="text-primary flex-shrink-0" animated />
        <span className="font-headline text-lg font-bold text-primary">HackProduct</span>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-2 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Bottom widgets */}
      <div className="px-4 pb-3 space-y-3">
        {/* Daily Goal */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-on-surface font-label">Daily Goal</span>
            <span className="text-xs text-on-surface-variant font-label">{DAILY_GOAL_DONE}/{DAILY_GOAL_TOTAL} done</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-fixed transition-all"
              style={{ width: `${(DAILY_GOAL_DONE / DAILY_GOAL_TOTAL) * 100}%` }}
            />
          </div>
        </div>

        {/* Pro upgrade chip */}
        <div className="flex">
          <span className="inline-flex items-center gap-1.5 bg-tertiary-container text-on-tertiary-container rounded-full px-3 py-1 text-xs font-semibold font-label">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>workspace_premium</span>
            Upgrade to Pro
          </span>
        </div>
      </div>

      {/* Ask Luma button */}
      <div className="px-2 pb-4">
        <button
          disabled
          title="Coming soon"
          className="flex items-center gap-3 px-3 py-3 rounded-full bg-primary text-on-primary opacity-60 cursor-not-allowed w-full justify-center"
        >
          <LumaGlyph size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">Ask Luma</span>
        </button>
      </div>
    </nav>
  )
}
