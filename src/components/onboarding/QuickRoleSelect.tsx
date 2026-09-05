'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_ONBOARDING_STEP, EVENT_FIRST_REP_ROUTED } from '@/lib/posthog/events'
import { FIRST_REP_FALLBACK_HREF } from '@/lib/onboarding/curated-first-rep'

// One-screen onboarding path behind the onboarding_value_first flag: a single
// tap gets a role, completes onboarding immediately (server sets
// onboarding_completed_at — see /api/onboarding/quick-start), and routes
// straight into a curated first rep. Full calibration stays available later
// as a dashboard CTA (CalibrationCtaCard) and reuses CalibrationFlow as-is.

const ROLES = [
  { id: 'swe',            label: 'Software Engineer' },
  { id: 'data_eng',       label: 'Data Engineer' },
  { id: 'ml_eng',         label: 'ML Engineer' },
  { id: 'devops',         label: 'DevOps / Platform' },
  { id: 'em',             label: 'Eng Manager' },
  { id: 'founding_eng',   label: 'Founding Engineer' },
  { id: 'tech_lead',      label: 'Tech Lead' },
  { id: 'pm',             label: 'Product Manager' },
  { id: 'designer',       label: 'Designer' },
  { id: 'data_scientist', label: 'Data Scientist' },
]

export function QuickRoleSelect({
  onRouted,
  onSkip,
}: {
  onRouted: (href: string) => void
  onSkip: () => void
}) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSelect(roleId: string) {
    if (selectedRole || submitting) return
    setSelectedRole(roleId)
    setSubmitting(true)

    trackEvent(EVENT_ONBOARDING_STEP, { step: 'role_quick', step_index: 0 })

    let challengeHref = FIRST_REP_FALLBACK_HREF
    try {
      const res = await fetch('/api/onboarding/quick-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleId }),
      })
      if (res.ok) {
        const data = await res.json()
        challengeHref = data.challenge_href ?? FIRST_REP_FALLBACK_HREF
      }
    } catch {
      // Network failure: still route to the safe fallback rather than
      // trapping the user on this screen.
    }

    trackEvent(EVENT_FIRST_REP_ROUTED, { role: roleId, challenge_href: challengeHref })
    onRouted(challengeHref)
  }

  return (
    <div className="flex h-full w-full flex-col justify-center px-6 py-8 sm:px-8">
      <div>
        <p className="font-label text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink-secondary">
          Pick your role
        </p>
        <h2 className="mt-1.5 font-body text-[19px] font-extrabold leading-tight text-ink-strong">
          Which role best matches your work?
        </h2>
        <p className="mt-1.5 max-w-md font-body text-[13.5px] leading-relaxed text-ink-secondary">
          One tap starts a real challenge, a short written scenario Hatch reads
          and grades. Calibration and goals stay optional, so you can begin learning now.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {ROLES.map(role => {
          const isSelected = selectedRole === role.id
          return (
            <button
              key={role.id}
              onClick={() => handleSelect(role.id)}
              disabled={submitting}
              className={[
                'flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 active:scale-[0.98]',
                isSelected
                  ? 'border-forest-600 bg-note-mint'
                  : 'border-hairline bg-card-bright hover:border-forest-600/40',
                submitting && !isSelected ? 'opacity-45' : '',
                submitting ? 'cursor-default' : 'cursor-pointer',
              ].join(' ')}
            >
              <span className="font-body text-[13px] font-bold leading-tight text-ink-strong">
                {role.label}
              </span>
              {isSelected && (
                submitting
                  ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-forest-600" strokeWidth={2.2} />
                  : <Check className="h-4 w-4 shrink-0 text-forest-600" strokeWidth={2.2} />
              )}
            </button>
          )
        })}
      </div>

      {submitting ? (
        <p className="mt-5 font-body text-[12.5px] text-ink-secondary">
          Pulling your first challenge, about 5 minutes, no setup.
        </p>
      ) : (
        <button
          type="button"
          onClick={onSkip}
          className="mt-5 self-start font-label text-[12.5px] font-bold text-ink-secondary transition-colors hover:text-ink-strong"
        >
          Skip for now
        </button>
      )}
    </div>
  )
}
