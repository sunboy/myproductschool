'use client'

import Link from 'next/link'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_FIT_SIGNUP_CTA_CLICKED } from '@/lib/posthog/events'
import type { PublicFitMode } from '@/lib/careerops/public/types'
import { HatchScene } from '@/components/careerops/report/HatchScene'

interface FitToolGateProps {
  mode: PublicFitMode
}

export function FitToolGate({ mode }: FitToolGateProps) {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-surface-container-low p-8 text-center">
      <div className="flex justify-center">
        <HatchScene scene="gated" size={110} />
      </div>
      <h2 className="mt-4 font-headline text-2xl font-bold text-on-surface">
        Your free run is used
      </h2>
      <p className="mt-2 font-body text-sm text-on-surface-variant">
        Members score every job they consider, track the gaps over time, and get a practice plan
        that moves the score. The report you already ran comes with you.
      </p>
      <div className="mt-5 flex justify-center">
        <Link
          href="/signup?redirectTo=/career-ops"
          onClick={() => trackEvent(EVENT_FIT_SIGNUP_CTA_CLICKED, { mode, source: 'gate' })}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary no-underline"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            rocket_launch
          </span>
          Sign up and keep scoring
        </Link>
      </div>
    </div>
  )
}
