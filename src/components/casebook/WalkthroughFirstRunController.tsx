'use client'

// First-run hook: routes a user to the Walkthrough exactly once, after
// onboarding has completed. Mirrors the existing intro-tour precedent
// (src/components/shell/IntroTourController.tsx / interviewTour.ts) rather
// than inventing a new mechanism:
//   - Gated on profile.onboarding_completed_at, same field the intro tour
//     auto-start uses.
//   - Fire-once latch lives in localStorage, same approach as
//     'interview-tour:v1:done' in src/lib/tours/interviewTour.ts. A DB
//     column (like has_seen_hatch_intro) was considered and rejected — that
//     column already belongs to the intro tour and adding a new one is a
//     schema change out of scope for this phase.
// Only navigates once, from the dashboard, after the profile has loaded and
// onboarding is confirmed complete. Does not fight the intro tour or the
// onboarding modal — if either is active this stays quiet.
//
// IntroTourController auto-starts on the SAME route under the SAME
// condition (profile.onboarding_completed_at set, dashboard, not mid-modal)
// gated on `!profile.has_seen_hatch_intro`. If this controller fired at the
// same time it would yank a brand-new user out of the intro tour mid-flight
// via router.push. So this stays quiet (and does NOT latch as seen) until
// has_seen_hatch_intro is true — the tour wins the first dashboard visit,
// and this fires on a later one instead.

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/context/SessionContext'
import { useOnboardingModal } from '@/context/OnboardingModalContext'

const SEEN_KEY = 'walkthrough-first-run:v1:done'
const WALKTHROUGH_CASE_ID = 'tuesday-dip'

function firstRunSeen(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(SEEN_KEY) !== null
  } catch {
    return true
  }
}

function markFirstRunSeen() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString())
  } catch {
    /* best effort */
  }
}

export function WalkthroughFirstRunController() {
  const { profile, loading } = useSession()
  const { open: onboardingOpen } = useOnboardingModal()
  const pathname = usePathname()
  const router = useRouter()
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || firstRunSeen()) return
    if (loading || !profile) return
    if (onboardingOpen) return
    if (!pathname.startsWith('/dashboard')) return
    if (!profile.onboarding_completed_at) return
    // Let the intro tour take the first dashboard visit uncontested.
    if (!profile.has_seen_hatch_intro) return

    firedRef.current = true
    markFirstRunSeen()
    router.push(`/walkthrough/${WALKTHROUGH_CASE_ID}`)
  }, [loading, profile, onboardingOpen, pathname, router])

  return null
}
