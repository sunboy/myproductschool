'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard',  icon: 'home',           label: 'Home'     },
  { href: '/explore',    icon: 'explore',        label: 'Explore'  },
  { href: '/challenges', icon: 'track_changes', label: 'Practice' },
  { href: '/live-interviews', icon: 'graphic_eq', label: 'Interview' },
  { href: '/progress',   icon: 'bar_chart',      label: 'Progress' },
]

export function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant bg-surface-container-low pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex min-w-0 items-stretch">
        {tabs.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-hatch-target={
                tab.href === '/dashboard' ? 'nav-dashboard'
                  : tab.href === '/challenges' ? 'nav-practice'
                  : tab.href === '/live-interviews' ? 'nav-interviews'
                  : `nav-${tab.href.slice(1)}`
              }
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 ${
                active ? 'mx-0.5 rounded-2xl bg-primary-fixed text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl`}
                style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                {tab.icon}
              </span>
              <span className={`w-full truncate text-center text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
