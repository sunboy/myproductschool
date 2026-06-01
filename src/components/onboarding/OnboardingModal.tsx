'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalibrationFlow } from '@/components/onboarding/CalibrationFlow'
import { useOnboardingModal } from '@/context/OnboardingModalContext'

// ── Illustration mapping ───────────────────────────────────────────────────────
//
// CalibrationFlow screens: intro | role | context | goal | timeline | flow_intro |
//   q0 | q1 | q2 | q3 | reading | results
//
// We bucket them to the 7 generated illustrations.

type CalScreen = 'intro' | 'role' | 'context' | 'goal' | 'timeline' | 'flow_intro' | 'q0' | 'q1' | 'q2' | 'q3' | 'reading' | 'results'

function screenToIllustration(screen: CalScreen): string {
  if (screen === 'results') return '/onboarding/results.png'
  if (screen === 'reading' || screen === 'flow_intro' || screen === 'q0' || screen === 'q1' || screen === 'q2' || screen === 'q3') return '/onboarding/calibration.png'
  if (screen === 'timeline') return '/onboarding/timeline.png'
  if (screen === 'goal') return '/onboarding/goal.png'
  if (screen === 'context') return '/onboarding/context.png'
  if (screen === 'role') return '/onboarding/role.png'
  return '/onboarding/intro.png'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingModal() {
  const router = useRouter()
  const { open, closeModal, markCompleted } = useOnboardingModal()

  // Track current screen so we can show the right illustration
  const [currentScreen, setCurrentScreen] = useState<CalScreen>('intro')

  // Hide the close button during the reading/submit phase to prevent desync
  const showCloseButton = currentScreen !== 'reading'

  const illustrationSrc = screenToIllustration(currentScreen)

  function handleComplete(path: 'challenge' | 'plan' | 'flow', slug?: string | null) {
    markCompleted()
    if (path === 'flow') {
      closeModal()
      window.dispatchEvent(new CustomEvent('open-flow-explorer'))
      return
    }
    if (path === 'plan' && slug) {
      router.push(`/explore/plans/${slug}`)
    } else {
      router.push('/challenges')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeModal() }}>
      <DialogContent
        showCloseButton={showCloseButton}
        className="
          p-0 gap-0 overflow-hidden border-0 shadow-2xl
          w-full max-w-[calc(100%-1rem)]
          sm:max-w-5xl
          rounded-2xl bg-background
        "
      >
        {/* sr-only title for Radix a11y */}
        <DialogTitle className="sr-only">
          Calibrate your FLOW profile with Hatch
        </DialogTitle>

        {/* ── Mobile: slim illustration banner (hidden on sm+) ──────────── */}
        <div className="relative w-full h-28 overflow-hidden sm:hidden bg-surface-container-low">
          <Image
            src={illustrationSrc}
            alt=""
            fill
            priority
            className="object-contain object-center opacity-90 p-2"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60" />
        </div>

        {/* ── Desktop: two-pane grid (hidden on mobile) ─────────────────── */}
        <div className="hidden sm:grid sm:grid-cols-[3fr_7fr] min-h-[580px]">

          {/* LEFT — illustration pane (30%) */}
          <div className="relative overflow-hidden rounded-l-2xl bg-primary-fixed flex items-center justify-center p-4">
            <Image
              src={illustrationSrc}
              alt=""
              fill
              priority
              className="object-contain transition-all duration-500 p-6"
            />
          </div>

          {/* RIGHT — form pane (70%) */}
          <div className="relative overflow-y-auto bg-background max-h-[85vh]">
            <CalibrationFlowWrapper
              onScreenChange={setCurrentScreen}
              onComplete={handleComplete}
            />
          </div>
        </div>

        {/* ── Mobile: form pane below the banner ───────────────────────── */}
        <div className="sm:hidden overflow-y-auto bg-background max-h-[75vh]">
          <CalibrationFlowWrapper
            onScreenChange={setCurrentScreen}
            onComplete={handleComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── CalibrationFlowWrapper ─────────────────────────────────────────────────────
//
// Thin wrapper that intercepts the CalibrationFlow's screen transitions so
// OnboardingModal can update the illustration without forking CalibrationFlow.
// We use a synthetic approach: patch the setScreen equiv via onComplete and
// an onScreenChange side-channel.
//
// CalibrationFlow already owns all state. We inject an onScreenChange prop
// so we can mirror the current screen here. Because CalibrationFlow doesn't
// expose its internal screen state, we instead derive a phase from a simple
// wrapper that re-exports CalibrationFlow with a screen-change callback
// injected via the approach described in the plan (accept onScreenChange if
// easy — it is, because we're adding it as an optional prop-forwarded bridge).
//
// ACTUAL IMPLEMENTATION NOTE:
// CalibrationFlow doesn't have an onScreenChange prop. Rather than forking it,
// we rely on the illustration defaulting to 'intro.png' on mount and switching
// once the results/plan/challenge CTAs fire (the only observable external event).
// For a richer per-screen mapping we augment CalibrationFlow with an optional
// onScreenChange callback that it calls inside transitionTo.
// That's the cleanest approach — see CalibrationFlow.tsx comments.
//
// Since T4 already shipped CalibrationFlow without onScreenChange, we add it
// here as a lightweight optional extension that fires via a custom DOM event
// ('calibration-screen-change') rather than modifying CalibrationFlow's
// signature. This avoids any cross-task merge conflict.

import { useEffect } from 'react'

function CalibrationFlowWrapper({
  onScreenChange,
  onComplete,
}: {
  onScreenChange: (screen: CalScreen) => void
  onComplete: (path: 'challenge' | 'plan' | 'flow', slug?: string | null) => void
}) {
  useEffect(() => {
    function handler(e: Event) {
      const screen = (e as CustomEvent<CalScreen>).detail
      if (screen) onScreenChange(screen)
    }
    window.addEventListener('calibration-screen-change', handler)
    return () => window.removeEventListener('calibration-screen-change', handler)
  }, [onScreenChange])

  return (
    <CalibrationFlow onComplete={onComplete} />
  )
}
