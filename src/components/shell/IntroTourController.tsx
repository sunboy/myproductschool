'use client'

// Decides when the MAIN intro tour should run, then hands off to the generic
// TourRunner. Two entry points:
//   1. Auto-start once on first login, after onboarding completes.
//   2. Manual via the `start-intro-tour` window event (TopNav button, calibration CTA).

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/context/SessionContext'
import { useOnboardingModal } from '@/context/OnboardingModalContext'
import { TourRunner } from '@/components/shell/TourRunner'
import { MAIN_TOUR } from '@/lib/tours/mainTour'
import { setCursor } from '@/lib/tours/shepherdEngine'

function isMobile() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

// Session-scoped latch so a layout remount can't re-fire the auto-start before
// the profile reflects the POST that sets has_seen_hatch_intro.
const AUTO_START_LATCH = 'intro-tour:auto-started'

function autoStartLatched() {
  if (typeof window === 'undefined') return true
  return window.sessionStorage.getItem(AUTO_START_LATCH) !== null
}

function latchAutoStart() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(AUTO_START_LATCH, '1')
}

export function IntroTourController() {
  const { profile, loading } = useSession()
  const { open: onboardingOpen } = useOnboardingModal()
  const pathname = usePathname()
  const router = useRouter()

  const [active, setActive] = useState(false)
  const autoStartedRef = useRef(false)

  const start = () => {
    setCursor(MAIN_TOUR.id, 0)
    setActive(true)
  }

  // Auto-start: once per session, on the dashboard, after onboarding, desktop only.
  useEffect(() => {
    if (autoStartedRef.current || autoStartLatched()) return
    if (loading || !profile) return
    if (onboardingOpen) return
    if (!pathname.startsWith('/dashboard')) return
    if (isMobile()) return
    if (!profile.onboarding_completed_at) return
    if (profile.has_seen_hatch_intro) return

    autoStartedRef.current = true
    latchAutoStart()
    start()
  }, [loading, profile, onboardingOpen, pathname])

  // Manual trigger from anywhere (ignores the seen flag).
  useEffect(() => {
    const handler = () => {
      autoStartedRef.current = true // don't let auto-start double-fire later
      if (!window.location.pathname.startsWith('/dashboard')) {
        router.push('/dashboard')
      }
      start()
    }
    window.addEventListener('start-intro-tour', handler)
    return () => window.removeEventListener('start-intro-tour', handler)
  }, [router])

  // Pause while the onboarding modal is open; resume when it closes.
  const runnerActive = active && !onboardingOpen

  return (
    <TourRunner config={MAIN_TOUR} active={runnerActive} onFinish={() => setActive(false)} />
  )
}
