'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { cn } from '@/lib/utils'
import { FreemiumUsageSummary } from '@/components/billing/FreemiumUsageSummary'

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
  subscription?: {
    status?: string | null
    current_period_end?: string | null
    billing_interval?: string | null
    cancel_at_period_end?: boolean | null
  } | null
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { muted, toggleMuted } = useHatchSonics()

  const fetchProfile = useCallback(() => {
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
          subscription: data.subscription ?? null,
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const refreshProfileStats = () => fetchProfile()
    window.addEventListener('challenge-completed', refreshProfileStats)
    window.addEventListener('profile-stats-updated', refreshProfileStats)
    return () => {
      window.removeEventListener('challenge-completed', refreshProfileStats)
      window.removeEventListener('profile-stats-updated', refreshProfileStats)
    }
  }, [fetchProfile])

  useEffect(() => {
    // Route transitions can occur after progression writes complete.
    // Re-fetch on path change to keep nav badges fresh.
    fetchProfile()
  }, [fetchProfile, pathname])

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

  const streak = profile?.streak_days ?? 0
  const xp = profile?.xp_total ?? 0
  const isPro = profile?.plan === 'pro'

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
      <div className="mx-auto max-w-[1440px] px-8 py-2 flex items-center gap-8">

        {/* Column 1: Brand. Wordmark file has padding around the glyphs, so it
            needs more pixels than the visible text suggests. */}
        <Link href="/dashboard" className="flex items-center no-underline shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/wordmark.png" alt="HackProduct" className="h-12" />
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
              <AppTooltip
                key={item.id}
                label={
                  item.id === 'practice' ? 'Find the right rep by discipline, role, company, and difficulty.'
                    : item.id === 'interviews' ? 'Run Hatch-led mock loops across product, systems, data, SQL, and coding.'
                    : item.id === 'progress' ? 'See your FLOW levels, discipline coverage, and readiness signals.'
                    : item.id === 'explore' ? 'Browse study plans, guides, autopsies, and learning domains.'
                    : 'Return to your personalized dashboard.'
                }
                side="bottom"
              >
                <Link href={href} className="no-underline">
                  <button
                    data-hatch-sound={active ? undefined : 'open'}
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
              </AppTooltip>
            )
          })}
        </nav>
        </div>

        {/* Column 3: Right cluster */}
        <div className="flex items-center gap-4">

          {/* Streak */}
          <AppTooltip label="Your current practice streak." side="bottom" className="hidden sm:inline-flex">
            <div
              className="inline-flex items-center gap-[5px] text-[13px] font-bold"
              style={{ color: '#c9933a' }}
              suppressHydrationWarning
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
              {streak}d
            </div>
          </AppTooltip>

          {/* XP */}
          <AppTooltip label="XP grows as you complete reps, interviews, and study plan work." side="bottom" className="hidden md:inline-flex">
            <div
              className="inline-flex items-center gap-[5px] text-[13px] font-bold"
              style={{ color: 'var(--color-primary)' }}
              suppressHydrationWarning
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
              {xp.toLocaleString()}
            </div>
          </AppTooltip>

          <AppTooltip
            label={muted ? 'Turn Hatch sounds on.' : 'Mute Hatch sounds.'}
            side="bottom"
            className="hidden sm:inline-flex"
          >
            <button
              type="button"
              onClick={toggleMuted}
              aria-label={muted ? 'Turn Hatch sounds on' : 'Mute Hatch sounds'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: muted ? "'FILL' 0" : "'FILL' 1" }}>
                {muted ? 'volume_off' : 'graphic_eq'}
              </span>
            </button>
          </AppTooltip>

          {/* Avatar button + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              data-hatch-sound={menuOpen ? 'close' : 'open'}
              aria-label="Account"
              title="Account and settings"
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
                className="absolute right-0 top-12 w-[310px] rounded-xl shadow-lg py-1 z-50 border"
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
                    <p className="mt-0.5 text-[11px] font-label font-semibold text-on-surface-variant">
                      {isPro
                        ? `Pro${profile.subscription?.billing_interval === 'year' ? ' annual' : ' monthly'}`
                        : 'Free plan'}
                    </p>
                  </div>
                )}
                <div className="px-3 py-2">
                  <FreemiumUsageSummary plan={profile?.plan} compact />
                </div>
                <Link
                  href="/settings"
                  data-hatch-sound="open"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container"
                  style={{ color: 'var(--color-on-surface)' }}
                >
                  <span className="material-symbols-outlined text-base" style={{ color: 'var(--color-on-surface-variant)' }}>settings</span>
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  data-hatch-sound="close"
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
