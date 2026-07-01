'use client'

/**
 * First-run flow. New users land here straight from signup (see auth/callback +
 * signup redirect) instead of the heavy bento dashboard, which is where ~68% of
 * signups were last seen before abandoning (never reaching the one feature that
 * works: the live interview). This is deliberately ONE screen with ONE action.
 *
 * Tapping a role does three things at once:
 *  1. Creates the interview session server-side (POST /api/live-interview/start) —
 *     this IS the pre-warm; the personalized system prompt is built now, so by the
 *     time we land on the interview page only the opening turn is left to fetch.
 *  2. Persists the role + marks onboarding complete (fire-and-forget) so the
 *     dashboard's onboarding modal never fires later.
 *  3. Navigates straight into the interview with ?autostart=1, which skips the
 *     "Ready to begin?" breathe modal entirely.
 *
 * Everything else the old 12-screen calibration collected is deferred. Calibration
 * can happen after the first rep, not as a wall before it.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

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

    // Persist the role eagerly — it's harmless on its own and useful even if the user
    // never finishes. We do NOT mark onboarding complete yet: that's irreversible and
    // gates the dashboard's calibrated state + the onboarding modal, so it must only
    // happen once we know the interview actually starts (below). Marking it here and
    // then failing to start (e.g. a 402 at the limit) would strand a returning user on
    // a "calibrated" dashboard having done nothing, with no path back into onboarding.
    void fetch('/api/onboarding/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: roleId }),
    }).catch(() => {})

    try {
      const res = await fetch('/api/live-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      })

      // A brand-new free user has interview quota, but a returning not-yet-onboarded
      // user could be at the limit. Don't strand them here — send them to the
      // dashboard, where the usual paywall/limit surface lives. Onboarding is left
      // incomplete on purpose so they can still be onboarded properly later.
      if (res.status === 402) {
        router.push('/dashboard')
        return
      }

      if (!res.ok) throw new Error('start_failed')
      const data = await res.json()
      if (!data.sessionId) throw new Error('no_session')

      // The interview is starting — now it's safe to close out onboarding. Fire-and-
      // forget: the redirect shouldn't wait on it, and a straggler is harmless since
      // the user is already in the interview.
      void fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => {})

      const params = new URLSearchParams({ autostart: '1', role: data.role ?? roleId })
      if (data.scenarioTitle) params.set('scenario_title', data.scenarioTitle)
      if (data.discipline) params.set('discipline', data.discipline)
      router.push(`/live-interviews/${data.sessionId}?${params.toString()}`)
    } catch {
      setBusyRole(null)
      setError('Could not start your session. Try that again.')
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
              Hatch runs a live mock interview and reacts to how you actually think.
              Pick where you work today and it will pull a scenario that fits.
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
                aria-label={`Start a ${role.label} interview`}
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
            Setting up your interview…
          </p>
        )}

        {error && (
          <p className="mt-6 text-center font-body text-sm text-error">{error}</p>
        )}

        <p className="mt-8 text-center font-label text-xs text-on-surface-variant/70">
          No setup, no calibration. You can explore everything else after this rep.
        </p>
      </div>
    </div>
  )
}
