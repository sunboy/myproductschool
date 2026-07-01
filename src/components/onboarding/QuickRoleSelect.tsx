'use client'

import { useState } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_ONBOARDING_STEP, EVENT_FIRST_REP_ROUTED } from '@/lib/posthog/events'
import { FIRST_REP_FALLBACK_HREF } from '@/lib/onboarding/curated-first-rep'

// One-screen onboarding path behind the onboarding_value_first flag: a single
// tap gets a role, completes onboarding immediately (server sets
// onboarding_completed_at — see /api/onboarding/quick-start), and routes
// straight into a curated first rep. Full calibration stays available later
// as a dashboard CTA (CalibrationCtaCard) and reuses CalibrationFlow as-is.

const ROLES = [
  { id: 'swe',            label: 'Software Engineer',   icon: 'terminal' },
  { id: 'data_eng',       label: 'Data Engineer',       icon: 'storage' },
  { id: 'ml_eng',         label: 'ML Engineer',         icon: 'model_training' },
  { id: 'devops',         label: 'DevOps / Platform',   icon: 'settings_suggest' },
  { id: 'em',             label: 'Eng Manager',         icon: 'groups' },
  { id: 'founding_eng',   label: 'Founding Engineer',   icon: 'rocket_launch' },
  { id: 'tech_lead',      label: 'Tech Lead',           icon: 'account_tree' },
  { id: 'pm',             label: 'Product Manager',     icon: 'track_changes' },
  { id: 'designer',       label: 'Designer',            icon: 'palette' },
  { id: 'data_scientist', label: 'Data Scientist',      icon: 'query_stats' },
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
    <div className="w-full max-w-2xl mx-auto px-6 py-8 flex flex-col items-center gap-6 text-center">
      <HatchGlyph size={72} state="listening" className="text-primary" />

      <div className="space-y-2">
        <h1 className="font-headline font-bold text-[26px] text-on-surface leading-tight">
          What&apos;s your primary role?
        </h1>
        <p className="text-[14px] text-on-surface-variant font-body leading-relaxed">
          One tap gets you a real rep in under a minute. Hatch tunes the calibration later, whenever you want it.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 w-full">
        {ROLES.map(role => (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            disabled={submitting}
            className={[
              'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 active:scale-95 disabled:opacity-60',
              selectedRole === role.id
                ? 'bg-primary-fixed border-primary'
                : 'bg-surface-container border-outline-variant hover:bg-surface-container-high',
            ].join(' ')}
          >
            <span
              className="material-symbols-outlined text-[18px] flex-shrink-0 text-primary"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            >
              {role.icon}
            </span>
            <span className="text-[13px] font-label font-semibold text-on-surface leading-tight">
              {role.label}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={submitting}
        className="text-[13px] font-label font-semibold text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-60"
      >
        Skip for now
      </button>
    </div>
  )
}
