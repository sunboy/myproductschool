'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Volume2, VolumeX, Compass, LogOut, Settings, Handshake, Sparkles, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/context/SessionContext'
import { useHatchSonics } from '@/hooks/useHatchSonics'
import { FreemiumUsageSummary, SpendIndicator } from '@/components/billing/FreemiumUsageSummary'
import { TrialBanner } from '@/components/billing/TrialBanner'
import { DunningBanner } from '@/components/billing/DunningBanner'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'
import { openFeedbackModal } from '@/components/feedback/FeedbackWidget'
import { TopUtilityBar } from '@/components/redesign/TopUtilityBar'

const AFFILIATES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AFFILIATES === 'true'

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Desktop TopUtilityBar (real search, sound + tour toggles,
 * avatar dropdown) and the collapsed mobile top bar (logo + avatar, no sidebar, no search). Replaces TopNav inside (app)/layout.tsx
 * only — TopNav itself stays mounted by (workspace)/layout.tsx and other
 * surfaces that still import it directly.
 */
export function AppTopShell() {
  const router = useRouter()
  const { profile } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
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

  // ⌘K / Ctrl+K focuses the search input, matching the kbd hint in the pill.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = searchValue.trim()
    router.push(q ? `/challenges?q=${encodeURIComponent(q)}` : '/challenges')
  }

  const isPro = profile?.plan === 'pro'

  // Derive trial/dunning banners from already-fetched profile data (same logic as TopNav).
  const sub = profile?.subscription
  const isTrialing = sub?.status === 'trialing' && sub?.current_period_end
  const trialDaysLeft = isTrialing
    ? Math.ceil((new Date(sub!.current_period_end!).getTime() - Date.now()) / 86400000)
    : null
  const dunning = profile?.dunning
  const showDunning = dunning?.shouldShowBanner ?? (sub?.status === 'past_due')
  const dunningMessage = dunning?.bannerMessage ?? 'Your payment failed. Update your payment method to keep Pro access.'
  const dunningDaysLeft = dunning?.gracePeriodEndsAt
    ? Math.max(0, Math.ceil((new Date(dunning.gracePeriodEndsAt).getTime() - Date.now()) / 86400000))
    : undefined

  function AvatarMenu({ compact }: { compact?: boolean }) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          data-hatch-sound={menuOpen ? 'close' : 'open'}
          aria-label="Account"
          title="Account and settings"
          className="flex items-center gap-2.5"
        >
          <span
            className={`flex ${compact ? 'size-8' : 'size-8'} items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white`}
            style={{ background: 'linear-gradient(135deg, #4a7c59, #264a34)' }}
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="avatar" className="size-full object-cover" />
            ) : (
              getInitials(profile?.display_name)
            )}
          </span>
          {!compact && (
            <>
              <span className="text-[13.5px] font-bold text-ink-strong">{profile?.display_name ?? 'You'}</span>
              {isPro && (
                <span className="rounded-full border border-gold bg-amber-soft px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.03em] text-forest-950">
                  Pro
                </span>
              )}
            </>
          )}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-11 z-50 w-[min(310px,calc(100vw-1.5rem))] rounded-xl border border-hairline bg-card-bright py-1 shadow-lg">
            {profile?.display_name && (
              <div className="border-b border-hairline px-4 py-2">
                <p className="truncate text-xs font-bold text-ink-strong">{profile.display_name}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-ink-muted">
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
                className="mx-3 mb-1 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-lg bg-forest-800 px-3 py-2 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
              >
                <Sparkles size={16} strokeWidth={1.8} />
                Upgrade plan
              </button>
            )}
            <Link
              href="/affiliates"
              data-hatch-sound="open"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-strong transition-colors hover:bg-page-field"
            >
              <Handshake size={16} strokeWidth={1.8} className="text-ink-secondary" />
              Affiliates
            </Link>
            <button
              type="button"
              onClick={() => {
                openFeedbackModal()
                setMenuOpen(false)
              }}
              data-hatch-sound="open"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink-strong transition-colors hover:bg-page-field"
            >
              <MessageSquare size={16} strokeWidth={1.8} className="text-ink-secondary" />
              Send feedback
            </button>
            <Link
              href="/settings"
              data-hatch-sound="open"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-strong transition-colors hover:bg-page-field"
            >
              <Settings size={16} strokeWidth={1.8} className="text-ink-secondary" />
              Settings
            </Link>
            {AFFILIATES_ENABLED && (
              <Link
                href="/affiliate"
                data-hatch-sound="open"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-strong transition-colors hover:bg-page-field"
              >
                <Handshake size={16} strokeWidth={1.8} className="text-ink-secondary" />
                Affiliate
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              data-hatch-sound="close"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-error transition-colors hover:bg-page-field"
            >
              <LogOut size={16} strokeWidth={1.8} />
              Log out
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {trialDaysLeft !== null && trialDaysLeft <= 7 && (
        <TrialBanner daysLeft={trialDaysLeft} trialEndsAt={sub!.current_period_end!} />
      )}
      {showDunning && (
        <DunningBanner message={dunningMessage} daysUntilSuspension={dunningDaysLeft} />
      )}

      {/* Desktop (lg+): full TopUtilityBar with live search, sound + tour toggles, avatar menu. */}
      <div data-topnav className="hidden lg:block">
        <TopUtilityBar
          searchPlaceholder="Search topics, problems, or interviews..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={handleSearchSubmit}
          searchInputRef={searchInputRef}
          avatarInitial={getInitials(profile?.display_name)}
          displayName={profile?.display_name ?? 'You'}
          isPro={isPro}
          avatarSlot={<AvatarMenu />}
          endSlot={
            <>
              {!isPro && <SpendIndicator />}
              <button
                type="button"
                onClick={toggleMuted}
                aria-label={muted ? 'Turn Hatch sounds on' : 'Mute Hatch sounds'}
                title={muted ? 'Turn Hatch sounds on' : 'Mute Hatch sounds'}
                className="flex size-[34px] items-center justify-center rounded-lg border border-hairline bg-white text-ink-secondary"
              >
                {muted ? <VolumeX size={16} strokeWidth={1.8} /> : <Volume2 size={16} strokeWidth={1.8} />}
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('start-intro-tour'))}
                aria-label="Take the tour"
                title="Take the tour"
                className="flex size-[34px] items-center justify-center rounded-lg border border-hairline bg-white text-ink-secondary"
              >
                <Compass size={16} strokeWidth={1.8} />
              </button>
            </>
          }
        />
      </div>

      {/* Mobile (<lg): collapsed bar — logo + avatar. No sidebar, no search box. */}
      <div data-topnav className="flex items-center gap-3 border-b border-hairline bg-page-field px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center">
          <HackProductWordmark className="h-7 w-[147px] object-cover" />
        </Link>

        <div className="ml-auto flex items-center gap-4">
          <AvatarMenu compact />
        </div>
      </div>
    </>
  )
}
