'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/context/SessionContext'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { cn } from '@/lib/utils'
import { FreemiumUsageSummary, SpendIndicator } from '@/components/billing/FreemiumUsageSummary'
import { TrialBanner } from '@/components/billing/TrialBanner'
import { DunningBanner } from '@/components/billing/DunningBanner'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'

const NAV_ITEMS = [
  { id: 'home',       href: '/',               icon: 'home',          label: 'Home'       },
  { id: 'practice',   href: '/challenges',      icon: 'track_changes', label: 'Practice'   },
  { id: 'interviews', href: '/live-interviews', icon: 'graphic_eq',    label: 'Interviews' },
  { id: 'progress',   href: '/progress',        icon: 'bar_chart',     label: 'Progress'   },
]

const AFFILIATES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AFFILIATES === 'true'

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
  // Profile comes from the session fetched once by SessionProvider and refreshed
  // on challenge-completed / profile-stats-updated events — no per-navigation
  // /api/profile refetch.
  const { profile } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { muted, toggleMuted } = useHatchSonics()

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

  function openUpgrade() {
    window.dispatchEvent(new CustomEvent('open-upgrade-modal'))
    setMenuOpen(false)
  }

  const streak = profile?.streak_days ?? 0
  const xp = profile?.xp_total ?? 0
  const isPro = profile?.plan === 'pro'

  function isActive(item: typeof NAV_ITEMS[0]) {
    if (item.id === 'home') return pathname === '/' || pathname === '/dashboard'
    if (item.id === 'interviews') return pathname.startsWith('/live-interviews')
    return pathname.startsWith(item.href)
  }

  // Derive trial/dunning banners from already-fetched profile data
  const sub = profile?.subscription
  const isTrialing = sub?.status === 'trialing' && sub?.current_period_end
  const trialDaysLeft = isTrialing
    ? Math.ceil((new Date(sub!.current_period_end!).getTime() - Date.now()) / 86400000)
    : null
  // Dunning banner is driven by the server-computed dunning status, which keys off
  // the profile dunning columns (past_due_since / payment_failures) and matches the
  // entitlements grace policy. Falls back to the raw status if dunning isn't present.
  const dunning = profile?.dunning
  const showDunning = dunning?.shouldShowBanner ?? (sub?.status === 'past_due')
  const dunningMessage = dunning?.bannerMessage ?? 'Your payment failed. Update your payment method to keep Pro access.'
  const dunningDaysLeft = dunning?.gracePeriodEndsAt
    ? Math.max(0, Math.ceil((new Date(dunning.gracePeriodEndsAt).getTime() - Date.now()) / 86400000))
    : undefined

  return (
    <>
    {trialDaysLeft !== null && trialDaysLeft <= 7 && (
      <TrialBanner daysLeft={trialDaysLeft} trialEndsAt={sub!.current_period_end!} />
    )}
    {showDunning && (
      <DunningBanner message={dunningMessage} daysUntilSuspension={dunningDaysLeft} />
    )}
    <header
      data-topnav
      className="sticky top-0 z-40 w-full max-w-full border-b"
      style={{
        background: 'rgba(250,246,240,0.82)',
        backdropFilter: 'saturate(140%) blur(12px)',
        WebkitBackdropFilter: 'saturate(140%) blur(12px)',
        borderColor: 'var(--color-outline-faint)',
      }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] min-w-0 items-center gap-3 px-3 py-2 sm:gap-5 sm:px-5 lg:gap-8 lg:px-8">

        {/* Column 1: Brand. Wordmark file has padding around the glyphs, so it
            needs more pixels than the visible text suggests. */}
        <Link href="/dashboard" className="flex min-w-0 shrink items-center no-underline sm:shrink-0">
          <HackProductWordmark className="h-8 w-[168px] object-cover sm:h-12 sm:w-[242px]" />
        </Link>

        {/* Column 2: Nav pills (centered) */}
        <div className="hidden min-w-0 flex-1 justify-center md:flex">
        <nav
          className="flex min-w-0 gap-1 rounded-full border p-1"
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
                    data-hatch-target={item.id === 'home' ? 'nav-dashboard' : `nav-${item.id}`}
                    aria-label={item.label}
                    className={cn(
                      // Icon-only in the md→lg range (where 5 labelled pills + brand
                      // + right cluster used to collide), labels return at lg.
                      'inline-flex items-center gap-[7px] px-2.5 lg:px-4 py-2 rounded-full border-0 whitespace-nowrap cursor-pointer',
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
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                </Link>
              </AppTooltip>
            )
          })}
        </nav>
        </div>

        {/* Column 3: Right cluster */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">

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

          <AppTooltip label="Take the tour." side="bottom" className="hidden sm:inline-flex">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('start-intro-tour'))}
              aria-label="Take the tour"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className="material-symbols-outlined text-[17px]">tour</span>
            </button>
          </AppTooltip>

          {/* Live AI spend indicator — only visible when not pro */}
          {!isPro && (
            <div className="hidden sm:flex">
              <SpendIndicator />
            </div>
          )}

          {!isPro && (
            <AppTooltip label="Upgrade for more practice, mock loops, and Analytics Lab." side="bottom" className="hidden lg:inline-flex">
              <button
                type="button"
                onClick={openUpgrade}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-fixed px-3 py-1.5 text-xs font-label font-extrabold text-primary transition-colors hover:bg-primary-fixed-dim focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
                Upgrade
              </button>
            </AppTooltip>
          )}

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
                className="absolute right-0 top-12 z-50 w-[min(310px,calc(100vw-1.5rem))] rounded-xl border py-1 shadow-lg"
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
                {!isPro && (
                  <button
                    type="button"
                    onClick={openUpgrade}
                    className="mx-3 mb-1 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-label font-black text-on-primary transition-opacity hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      workspace_premium
                    </span>
                    Upgrade plan
                  </button>
                )}
                <Link
                  href="/affiliates"
                  data-hatch-sound="open"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container"
                  style={{ color: 'var(--color-on-surface)' }}
                >
                  <span className="material-symbols-outlined text-base" style={{ color: 'var(--color-on-surface-variant)' }}>handshake</span>
                  Affiliates
                </Link>
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
                {AFFILIATES_ENABLED && (
                  <Link
                    href="/affiliate"
                    data-hatch-sound="open"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container"
                    style={{ color: 'var(--color-on-surface)' }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ color: 'var(--color-on-surface-variant)' }}>handshake</span>
                    Affiliate
                  </Link>
                )}
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
    </>
  )
}
