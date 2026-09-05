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
 *     graded challenge that works in place with no microphone or setup
 *     round-trip. First value must never depend on hardware.
 *
 * The live voice interview is not the first thing anymore; it is a celebrated
 * step 2 offered on the challenge completion screen, where the mic gate meets an
 * already-activated user. Full calibration is likewise deferred: it stays
 * available afterward as a dashboard CTA, never as a wall before first value.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_ONBOARDING_STEP, EVENT_FIRST_REP_ROUTED } from '@/lib/posthog/events'
import { FIRST_REP_FALLBACK_HREF } from '@/lib/onboarding/curated-first-rep'

const ROLES = [
  { id: 'swe', label: 'Software Engineer' },
  { id: 'data_eng', label: 'Data Engineer' },
  { id: 'ml_eng', label: 'ML Engineer' },
  { id: 'devops', label: 'DevOps / Platform' },
  { id: 'em', label: 'Eng Manager' },
  { id: 'founding_eng', label: 'Founding Engineer' },
  { id: 'tech_lead', label: 'Tech Lead' },
  { id: 'pm', label: 'Product Manager' },
  { id: 'designer', label: 'Designer' },
  { id: 'data_scientist', label: 'Data Scientist' },
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
      setError('Could not set up your first challenge. Try that again.')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-page-field px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-hairline bg-card-bright shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]">
        <div className="sm:grid sm:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">

          {/* ── Welcome panel (Codex ref 2 split layout) ─────────────────── */}
          <div className="flex flex-col justify-between bg-page-field p-6">
            <div>
              <h1 className="font-headline text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-strong">
                Let&apos;s start with a real <span className="hl-word">challenge</span>
              </h1>
              <p className="mt-3 font-body text-[13.5px] leading-relaxed text-ink-secondary">
                A short product scenario you work through in writing.
                {' '}<span className="font-bold text-forest-800">Hatch</span> reads
                how you reason and grades it.
              </p>
            </div>
            <div className="flex justify-center py-3">
              <HatchImage state="wave" size={140} priority alt="Hatch" />
            </div>
            <div className="note-mint px-3.5 py-2.5 font-body text-[12px] font-bold text-forest-800">
              About 5 minutes. No setup, no microphone.
            </div>
          </div>

          {/* ── Role chip-select ─────────────────────────────────────────── */}
          <div className="flex flex-col justify-center p-6 sm:p-7">
            <p className="font-label text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">
              Pick your role
            </p>
            <h2 className="mt-1.5 font-body text-[18px] font-extrabold leading-tight text-ink-strong">
              Which role best matches your work?
            </h2>
            <p className="mt-1 font-body text-[13px] leading-relaxed text-ink-secondary">
              Hatch pulls a scenario that fits. Goals and calibration stay
              optional, so you can start learning before answering more questions.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const isBusy = busyRole === role.id
                const isDimmed = busyRole !== null && !isBusy
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => pickRole(role.id)}
                    disabled={busyRole !== null}
                    aria-label={`Start a ${role.label} challenge`}
                    className={[
                      'flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 active:scale-[0.98]',
                      isBusy
                        ? 'border-forest-600 bg-note-mint'
                        : 'border-hairline bg-card-bright hover:border-forest-600/40',
                      isDimmed ? 'opacity-45' : '',
                      busyRole !== null ? 'cursor-default' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    <span className="font-body text-[13px] font-bold leading-tight text-ink-strong">
                      {role.label}
                    </span>
                    {isBusy && (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-forest-600" strokeWidth={2.2} />
                    )}
                  </button>
                )
              })}
            </div>

            {busyRole && (
              <p className="mt-4 flex items-center gap-1.5 font-body text-[12.5px] text-ink-secondary">
                <Check className="h-3.5 w-3.5 text-forest-600" strokeWidth={2.2} />
                Pulling your first challenge
              </p>
            )}

            {error && (
              <p className="mt-4 font-body text-[12.5px] text-error">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
