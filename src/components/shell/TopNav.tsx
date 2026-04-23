'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { id: 'home',       href: '/',               icon: 'home',          label: 'Home'       },
  { id: 'explore',    href: '/explore',         icon: 'explore',       label: 'Explore'    },
  { id: 'practice',   href: '/challenges',      icon: 'track_changes', label: 'Practice'   },
  { id: 'interviews', href: '/live-interviews', icon: 'graphic_eq',    label: 'Interviews' },
  { id: 'progress',   href: '/progress',        icon: 'bar_chart',     label: 'Progress'   },
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

function LogoMark() {
  return (
    <div
      className="w-8 h-8 flex items-center justify-center shrink-0"
      style={{
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #4a7c59 0%, #264a34 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
      }}
    >
      <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <text
          x="4" y="16"
          fontFamily="serif"
          fontSize="13"
          fontWeight="bold"
          fill="#f7ede0"
          stroke="#f7ede0"
          strokeWidth="0.3"
        >
          HP
        </text>
        <circle cx="17" cy="6" r="2" fill="#c9933a" />
      </svg>
    </div>
  )
}

function GoalRing({ done, total }: { done: number; total: number }) {
  const size = 20
  const cx = size / 2
  const r = (size - 3) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, done / Math.max(1, total))
  return (
    <svg width={size} height={size} aria-label={`${done}/${total} daily goal`}>
      <circle cx={cx} cy={cx} r={r} stroke="var(--color-outline-variant)" strokeWidth="2.5" fill="none" />
      <circle
        cx={cx} cy={cx} r={r}
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray={`${c * pct} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
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
  const streak = profile?.streak_days ?? 0
  const xp = profile?.xp_total ?? 0

  function isActive(item: typeof NAV_ITEMS[0]) {
    if (item.id === 'home') return pathname === '/' || pathname === '/dashboard'
    if (item.id === 'interviews') return pathname.startsWith('/live-interviews')
    return pathname.startsWith(item.href)
  }

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: 'rgba(250,246,240,0.82)',
        backdropFilter: 'saturate(140%) blur(12px)',
        WebkitBackdropFilter: 'saturate(140%) blur(12px)',
        borderColor: 'var(--color-outline-faint)',
      }}
    >
      <div className="mx-auto max-w-[1440px] px-8 py-3 flex items-center gap-8">

        {/* Column 1: Brand */}
        <Link href="/dashboard" className="flex items-center no-underline shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/wordmark.png" alt="HackProduct" className="h-[84px]" />
        </Link>

        {/* Column 2: Nav pills (centered) */}
        <div className="hidden md:flex flex-1 justify-center">
        <nav
          className="flex gap-1 p-1 rounded-full border"
          style={{
            background: 'var(--color-surface-container-low)',
            borderColor: 'var(--color-outline-faint)',
          }}
        >
          {NAV_ITEMS.map(item => {
            const active = isActive(item)
            const href = item.id === 'home' ? '/dashboard' : item.href
            return (
              <Link key={item.id} href={href} className="no-underline">
                <button
                  className={cn(
                    'inline-flex items-center gap-[7px] px-4 py-2 rounded-full border-0 whitespace-nowrap cursor-pointer',
                    'text-[13px] font-bold transition-[background,color] duration-200',
                    active
                      ? 'text-white'
                      : 'hover:bg-[var(--color-surface-container)]',
                  )}
                  style={
                    active
                      ? { background: 'var(--color-primary)', color: 'var(--color-on-primary)' }
                      : { color: 'var(--color-on-surface-variant)' }
                  }
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </Link>
            )
          })}
        </nav>
        </div>

        {/* Column 3: Right cluster */}
        <div className="flex items-center gap-4">

          {/* Streak */}
          <div
            className="hidden sm:inline-flex items-center gap-[5px] text-[13px] font-bold"
            style={{ color: '#c9933a' }}
            suppressHydrationWarning
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            {streak}d
          </div>

          {/* XP */}
          <div
            className="hidden md:inline-flex items-center gap-[5px] text-[13px] font-bold"
            style={{ color: 'var(--color-primary)' }}
            suppressHydrationWarning
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
            {xp.toLocaleString()}
          </div>

          {/* Avatar button + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Account"
              className="w-9 h-9 rounded-full border-0 inline-flex items-center justify-center text-white font-bold text-[13px] overflow-hidden hover:opacity-90 transition-opacity focus:outline-none"
              style={{ background: 'linear-gradient(135deg, #4a7c59, #264a34)' }}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : getInitials(profile?.display_name)
              }
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-12 w-48 rounded-xl shadow-lg py-1 z-50 border"
                style={{
                  background: 'var(--color-background)',
                  borderColor: 'var(--color-outline-variant)',
                }}
              >
                {profile?.display_name && (
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--color-on-surface)' }}>
                      {profile.display_name}
                    </p>
                  </div>
                )}
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container"
                  style={{ color: 'var(--color-on-surface)' }}
                >
                  <span className="material-symbols-outlined text-base" style={{ color: 'var(--color-on-surface-variant)' }}>settings</span>
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container text-error"
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
