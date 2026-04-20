'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard',       icon: 'home',           label: 'Home'       },
  { href: '/explore',         icon: 'explore',        label: 'Explore'    },
  { href: '/challenges',      icon: 'fitness_center', label: 'Practice'   },
  { href: '/live-interviews', icon: 'mic',            label: 'Interviews' },
  { href: '/progress',        icon: 'bar_chart',      label: 'Progress'   },
]

interface ProfileData {
  streak_days: number
  xp_total: number
  display_name: string | null
  avatar_url: string | null
  plan: string | null
  daily_attempts_today?: number
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function GoalRing({ done, total }: { done: number; total: number }) {
  const r = 11
  const c = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(done / total, 1) : 0
  const size = 28
  const cx = size / 2
  return (
    <svg width={size} height={size} aria-label={`${done}/${total} daily goal`}>
      <circle cx={cx} cy={cx} r={r} stroke="var(--color-outline-variant)" strokeWidth="2.5" fill="none" />
      <circle
        cx={cx} cy={cx} r={r}
        stroke="var(--color-primary)" strokeWidth="2.5" fill="none"
        strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dasharray 600ms ease' }}
      />
    </svg>
  )
}

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.ok ? r.json() : null
      })
      .then(data => {
        if (data) setProfile({
          streak_days: data.streak_days ?? 0,
          xp_total: data.xp_total ?? 0,
          display_name: data.display_name ?? null,
          avatar_url: data.avatar_url ?? null,
          plan: data.plan ?? null,
          daily_attempts_today: data.daily_attempts_today ?? 0,
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const dailyDone = profile?.daily_attempts_today ?? 0
  const dailyTotal = 5

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-lg border-b border-outline-faint" style={{ background: 'rgba(250, 246, 240, 0.92)' }}>
      <div className="flex items-center h-14 px-6 gap-4 max-w-[1440px] mx-auto">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 mr-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}
          >
            <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
          </div>
          <span className="font-headline text-base font-medium tracking-tight text-on-surface hidden sm:block">
            HackProduct
          </span>
        </Link>

        {/* Nav pills */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-label font-semibold transition-all',
                  active
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                ].join(' ')}
              >
                <span
                  className="material-symbols-outlined text-[18px] leading-none"
                  style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right: goal ring + streak + XP + avatar */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">

          {/* Goal ring */}
          <div className="hidden lg:flex items-center gap-1.5" suppressHydrationWarning>
            <GoalRing done={dailyDone} total={dailyTotal} />
            <span className="text-xs text-on-surface-variant font-label" suppressHydrationWarning>
              {dailyDone}/{dailyTotal}
            </span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(112, 92, 48, 0.12)' }} suppressHydrationWarning>
            <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <span className="text-xs font-bold text-tertiary font-label" suppressHydrationWarning>
              {profile?.streak_days ?? 0}
            </span>
          </div>

          {/* XP */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: 'rgba(74, 124, 89, 0.12)' }} suppressHydrationWarning>
            <span className="text-xs font-bold text-primary font-label" suppressHydrationWarning>
              {(profile?.xp_total ?? 0).toLocaleString()} XP
            </span>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm focus:outline-none"
              aria-label="Profile menu"
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-on-primary font-label">
                    {getInitials(profile?.display_name)}
                  </span>
              }
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-background border border-outline-variant rounded-xl shadow-lg py-1 z-50">
                {profile?.display_name && (
                  <div className="px-4 py-2 border-b border-outline-variant/40">
                    <p className="text-xs font-bold text-on-surface truncate">{profile.display_name}</p>
                  </div>
                )}
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-on-surface-variant">settings</span>
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
