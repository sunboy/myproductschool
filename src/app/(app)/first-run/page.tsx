'use client'

/**
 * First-run flow. New users land here straight from signup (see auth/callback +
 * signup redirect) instead of the heavy bento dashboard, which is where ~68% of
 * signups were last seen before abandoning. This is deliberately ONE screen with
 * ONE action.
 *
 * Tapping a role does two things in one server round-trip
 * (POST /api/onboarding/quick-start):
 *  1. Persists the role AND marks onboarding complete in a single atomic update
 *     (profiles.preferred_role + onboarding_completed_at), and clears any partial
 *     calibration draft. This is AWAITED — navigation only happens on success, so
 *     a returning not-yet-onboarded user is never stranded on a "calibrated"
 *     dashboard having done nothing.
 *  2. Returns the curated first-rep challenge URL for that role — a written,
 *     graded FLOW rep that grades in place with no microphone and no Run
 *     round-trip. First value must never depend on hardware.
 *
 * The live voice interview is not the first thing anymore; it is a celebrated
 * step 2 offered on the rep's completion screen, where the mic gate meets an
 * already-activated user. Full calibration is likewise deferred: it stays
 * available afterward as a dashboard CTA, never as a wall before first value.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_ONBOARDING_STEP, EVENT_FIRST_REP_ROUTED } from '@/lib/posthog/events'
import { FIRST_REP_FALLBACK_HREF } from '@/lib/onboarding/curated-first-rep'

const ROLES = [
  { id: 'swe', label: 'Software Engineer', icon: 'terminal' },
  { id: 'data_eng', label: 'Data Engineer', icon: 'storage' },
  { id: 'ml_eng', label: 'ML Engineer', icon: 'model_training' },
  { id: 'devops', label: 'DevOps / Platform', icon: 'settings_suggest' },
  { id: 'em', label: 'Eng Manager', icon: 'groups' },
  { id: 'founding_eng', label: 'Founding Engineer', icon: 'rocket_launch' },
  { id: 'tech_lead', label: 'Tech Lead', icon: 'account_tree' },
  { id: 'pm', label: 'Product Manager', icon: 'track_changes' },
  { id: 'designer', label: 'Designer', icon: 'palette' },
  { id: 'data_scientist', label: 'Data Scientist', icon: 'query_stats' },
] as const

export default function FirstRunPage() {
  const router = useRouter()
  const [busyRole, setBusyRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function pickRole(roleId: string) {
    if (busyRole) return
    setBusyRole(roleId)
    setError(null)

    trackEvent(EVENT_ONBOARDING_STEP, { step: 'role_quick', step_index: 0 })

    try {
      // One round-trip: sets preferred_role + onboarding_completed_at atomically
      // and returns the curated first-rep URL. Awaited on purpose — we only
      // navigate once onboarding is genuinely closed out server-side, so the
      // dashboard's onboarding modal can never re-wall this user later.
      const res = await fetch('/api/onboarding/quick-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleId }),
      })

      if (!res.ok) throw new Error('quick_start_failed')

      const data = await res.json()
      const challengeHref = typeof data?.challenge_href === 'string' && data.challenge_href
        ? data.challenge_href
        : FIRST_REP_FALLBACK_HREF

      trackEvent(EVENT_FIRST_REP_ROUTED, { role: roleId, challenge_href: challengeHref })
      router.push(challengeHref)
    } catch {
      setBusyRole(null)
      setError('Could not set up your first rep. Try that again.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center text-center gap-4">
          <HatchGlyph size={64} state="idle" className="text-primary" />
          <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold text-on-background">
              Let&apos;s do a real rep first.
            </h1>
            <p className="font-body text-base text-on-surface-variant max-w-md mx-auto leading-relaxed">
              A short product scenario you work through in writing. Hatch reads how
              you reason and grades it. Pick where you work today and it will pull a
              scenario that fits.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 gap-3">
          {ROLES.map((role) => {
            const isBusy = busyRole === role.id
            const isDimmed = busyRole !== null && !isBusy
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => pickRole(role.id)}
                disabled={busyRole !== null}
                aria-label={`Start a ${role.label} rep`}
                className={[
                  'group flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all',
                  'bg-surface-container hover:bg-surface-container-high',
                  'border border-transparent hover:border-outline-variant',
                  isBusy ? 'ring-2 ring-primary bg-surface-container-high' : '',
                  isDimmed ? 'opacity-40' : '',
                  busyRole !== null ? 'cursor-default' : 'cursor-pointer',
                ].join(' ')}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isBusy ? 'progress_activity' : role.icon}
                  </span>
                </span>
                <span className="font-label text-sm font-semibold text-on-surface">
                  {role.label}
                </span>
              </button>
            )
          })}
        </div>

        {busyRole && (
          <p className="mt-6 text-center font-body text-sm text-on-surface-variant">
            Pulling your first rep…
          </p>
        )}

        {error && (
          <p className="mt-6 text-center font-body text-sm text-error">{error}</p>
        )}

        <p className="mt-8 text-center font-label text-xs text-on-surface-variant/70">
          No setup, no calibration, no microphone. You can explore everything else after this rep.
        </p>
      </div>
    </div>
  )
}
