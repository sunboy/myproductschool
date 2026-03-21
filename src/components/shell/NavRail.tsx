'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LumaGlyph } from './LumaGlyph'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/domains', icon: 'grid_view', label: 'Domains' },
  { href: '/challenges', icon: 'fitness_center', label: 'Practice' },
  { href: '/progress', icon: 'bar_chart', label: 'Progress' },
  { href: '/interview-prep', icon: 'workspace_premium', label: 'Interview Prep' },
]

export function NavRail() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <nav className={`hidden md:flex flex-col h-screen sticky top-0 bg-surface-container-low border-r border-outline-variant transition-all duration-300 ${collapsed ? 'w-18' : 'w-64'}`}>
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
        <LumaGlyph size={28} className="text-primary flex-shrink-0" />
        {!collapsed && (
          <span className="font-headline text-lg font-bold text-on-surface">MyProductSchool</span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 px-2 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${collapsed ? 'justify-center' : ''} ${
                active
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className={active ? 'material-symbols-filled' : 'material-symbols-outlined'}>
                {item.icon}
              </span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* Luma ask button */}
      <div className="px-2 pb-2">
        <Link
          href="/luma"
          className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-primary text-on-primary hover:opacity-90 transition-opacity ${collapsed ? 'justify-center' : ''}`}
        >
          <LumaGlyph size={20} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Ask Luma</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <div className="px-2 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="material-symbols-outlined text-sm">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </nav>
  )
}
