'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/domains', icon: 'grid_view', label: 'Domains' },
  { href: '/challenges', icon: 'fitness_center', label: 'Practice' },
  { href: '/progress', icon: 'bar_chart', label: 'Progress' },
  { href: '/profile', icon: 'person', label: 'Profile' },
]

export function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface-container-low border-t border-outline-variant safe-area-bottom z-50">
      <div className="flex items-stretch">
        {tabs.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1 py-2 px-1"
            >
              <span className={`material-symbols-${active ? 'filled' : 'outlined'} text-xl ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
