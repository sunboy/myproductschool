'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/explore', icon: 'explore', label: 'Explore' },
  { href: '/challenges', icon: 'fitness_center', label: 'Practice' },
  { href: '/prep', icon: 'workspace_premium', label: 'Prep' },
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
              <span
                className={`material-symbols-outlined text-xl ${active ? 'text-primary' : 'text-on-surface-variant'}`}
                style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
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
