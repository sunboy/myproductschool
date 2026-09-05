'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { id: 'home', href: '/dashboard', icon: 'home', label: 'Home' },
  { id: 'practice', href: '/challenges', icon: 'track_changes', label: 'Practice' },
  { id: 'library', href: '/explore', icon: 'menu_book', label: 'Library' },
  { id: 'progress', href: '/progress', icon: 'bar_chart', label: 'Progress' },
] as const

function isTabActive(id: (typeof tabs)[number]['id'], pathname: string) {
  if (id === 'home') return pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  if (id === 'practice') {
    return pathname.startsWith('/challenges') || pathname.startsWith('/workspace/challenges') || pathname.startsWith('/live-interviews')
  }
  if (id === 'library') return pathname === '/explore' || pathname.startsWith('/explore/')
  return pathname === '/progress' || pathname.startsWith('/progress/')
}

export function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant bg-surface-container-low pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex min-w-0 items-stretch">
        {tabs.map(tab => {
          const active = isTabActive(tab.id, pathname)
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              data-hatch-target={tab.id === 'home' ? 'nav-dashboard' : `nav-${tab.id}`}
              className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 ${
                active ? 'mx-0.5 rounded-2xl bg-primary-fixed text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                {tab.icon}
              </span>
              <span className={`w-full truncate text-center text-[14px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
