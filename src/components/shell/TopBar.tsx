'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LumaGlyph } from './LumaGlyph'

interface ProfileBadge {
  streak_days: number
  xp_total: number
  display_name: string | null
  avatar_url: string | null
  plan: string | null
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function TopBar() {
  const [profile, setProfile] = useState<ProfileBadge | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/profile')
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return null }
        return r.ok ? r.json() : null
      })
      .then(data => { if (data) setProfile({ streak_days: data.streak_days ?? 0, xp_total: data.xp_total ?? 0, display_name: data.display_name ?? null, avatar_url: data.avatar_url ?? null, plan: data.plan ?? null }) })
      .catch(() => {})
  }, [])

  // Close dropdown when clicking outside
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

  const streakDays = profile?.streak_days ?? 0
  const xpTotal = profile?.xp_total ?? 0

  return (
    <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-lg border-b border-surface-container-high">
      <div className="flex items-center justify-between gap-3 px-4 h-13 w-full">

        {/* Mobile: logo (hidden on desktop where NavRail shows branding) */}
        <div className="md:hidden shrink-0">
          <LumaGlyph size={22} className="text-primary animate-luma-glow" state="idle" />
        </div>

        {/* Spacer — pushes badges to right on desktop */}
        <div className="hidden md:block flex-1" />

        {/* Right badges + avatar */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Streak + XP — suppressHydrationWarning because these update after client fetch */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-tertiary-fixed/70 rounded-full" suppressHydrationWarning>
            <span
              className="material-symbols-outlined text-tertiary text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="text-xs font-bold text-tertiary font-label" suppressHydrationWarning>{streakDays}</span>
          </div>

          {/* XP */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-primary-fixed/70 rounded-full" suppressHydrationWarning>
            <span className="text-xs font-bold text-primary font-label" suppressHydrationWarning>{xpTotal.toLocaleString()} XP</span>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="relative w-8 h-8 rounded-full overflow-visible bg-primary flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Profile menu"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-on-primary font-label">{getInitials(profile?.display_name)}</span>
                }
              </div>
              {profile?.plan === 'pro' && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #4a7c59, #3a6b4a)', boxShadow: '0 0 0 1.5px #faf6f0' }}
                  title="Pro"
                >
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '8px', fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </span>
              )}
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
