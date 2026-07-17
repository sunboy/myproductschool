'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalibrationFlow } from '@/components/onboarding/CalibrationFlow'
import { QuickRoleSelect } from '@/components/onboarding/QuickRoleSelect'
import { useOnboardingModal } from '@/context/OnboardingModalContext'
import { HatchImage, type HatchImageState } from '@/components/redesign/HatchImage'

// ── Screen → Hatch pose mapping ────────────────────────────────────────────────
//
// CalibrationFlow screens: intro | role | context | goal | timeline | flow_intro |
//   q0 | q1 | q2 | q3 | reading | results
//
// The left welcome panel (Codex ref 2 split layout) shows the pose that matches
// what Hatch is doing at that step.

type CalScreen = 'intro' | 'role' | 'context' | 'goal' | 'timeline' | 'flow_intro' | 'q0' | 'q1' | 'q2' | 'q3' | 'reading' | 'results'

function screenToPose(screen: CalScreen): HatchImageState {
  if (screen === 'results') return 'celebrating'
  if (screen === 'reading') return 'reviewing'
  if (screen === 'q0' || screen === 'q1' || screen === 'q2' || screen === 'q3') return 'writing'
  if (screen === 'flow_intro') return 'presenting'
  if (screen === 'goal' || screen === 'timeline') return 'thinking'
  if (screen === 'role' || screen === 'context') return 'listening'
  return 'wave'
}

const SCREEN_PANEL_COPY: Record<CalScreen, string> = {
  intro: 'Four questions calibrate where your product thinking starts. Hatch routes your practice from there.',
  role: 'Role shapes which scenarios Hatch pulls. It reads your reasoning, not your title.',
  context: 'Context tells Hatch what kind of decisions you face day to day.',
  goal: 'Your goal sets which reps come first. Nothing here is locked in.',
  timeline: 'Timeline sets the pace of your plan, not a deadline.',
  flow_intro: 'FLOW is the four-move method every rep is graded against.',
  q0: 'Hatch is reading how you frame the problem, not hunting for a right answer.',
  q1: 'Hatch is reading how you frame the problem, not hunting for a right answer.',
  q2: 'Hatch is reading how you frame the problem, not hunting for a right answer.',
  q3: 'Hatch is reading how you frame the problem, not hunting for a right answer.',
  reading: 'Hatch is scoring your four answers against the FLOW rubric.',
  results: 'Your baseline is set. Every rep from here moves it.',
}

// ── Shared welcome panel (left pane, Codex ref 2) ──────────────────────────────

function WelcomePanel({
  pose,
  body,
  footnote,
}: {
  pose: HatchImageState
  body: string
  footnote: string
}) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-page-field p-6 sm:rounded-l-2xl">
      <div>
        <h2 className="font-headline text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-strong">
          Welcome to
          <br />
          HackProduct
        </h2>
        <p className="mt-3 font-body text-[13.5px] leading-relaxed text-ink-secondary">
          <span className="font-bold text-forest-800">Hatch</span> is the coach here.
          {' '}{body}
        </p>
      </div>

      <div className="flex justify-center py-2">
        <HatchImage state={pose} size={150} priority alt="Hatch" />
      </div>

      <div className="note-mint px-3.5 py-2.5 font-body text-[12px] font-bold text-forest-800">
        {footnote}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingModal() {
  const router = useRouter()
  const { open, closeModal, markCompleted, valueFirst } = useOnboardingModal()

  // Track current screen so we can show the right pose + panel copy
  const [currentScreen, setCurrentScreen] = useState<CalScreen>('intro')

  // Hide the close button during the reading/submit phase to prevent desync
  const showCloseButton = currentScreen !== 'reading'

  function handleComplete(path: 'challenge' | 'plan' | 'flow' | 'tour', slug?: string | null) {
    markCompleted()
    if (path === 'flow') {
      closeModal()
      window.dispatchEvent(new CustomEvent('open-flow-explorer'))
      return
    }
    if (path === 'tour') {
      closeModal()
      router.push('/dashboard')
      window.dispatchEvent(new Event('start-intro-tour'))
      return
    }
    if (path === 'plan' && slug) {
      router.push(`/explore/plans/${slug}`)
    } else {
      router.push('/challenges')
    }
  }

  function handleQuickStartRouted(href: string) {
    markCompleted()
    router.push(href)
  }

  // ── Value-first variant: split layout, one-tap role select completes ──────
  if (valueFirst) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) closeModal() }}>
        <DialogContent
          className="
            p-0 gap-0 overflow-hidden border border-hairline shadow-2xl
            w-full max-w-[calc(100%-1rem)]
            sm:max-w-3xl
            rounded-2xl bg-card-bright
          "
        >
          <DialogTitle className="sr-only">Pick your role to get started</DialogTitle>

          {/* Mobile: slim mascot strip */}
          <div className="flex items-center gap-3 bg-page-field px-5 py-3 sm:hidden">
            <HatchImage state="wave" size={44} alt="Hatch" />
            <p className="font-body text-[12.5px] font-bold text-ink-strong">
              Welcome to HackProduct
            </p>
          </div>

          <div className="sm:grid sm:min-h-[440px] sm:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
            <div className="hidden sm:block">
              <WelcomePanel
                pose="wave"
                body="It pulls a real scenario for your role, reads how you reason through it, and grades the rep."
                footnote="One tap. Under a minute to your first rep."
              />
            </div>
            <QuickRoleSelect onRouted={handleQuickStartRouted} onSkip={closeModal} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeModal() }}>
      <DialogContent
        showCloseButton={showCloseButton}
        className="
          p-0 gap-0 overflow-hidden border border-hairline shadow-2xl
          w-full max-w-[calc(100%-1rem)]
          sm:max-w-5xl
          rounded-2xl bg-card-bright
        "
      >
        {/* sr-only title for Radix a11y */}
        <DialogTitle className="sr-only">
          Calibrate your FLOW profile with Hatch
        </DialogTitle>

        {/* ── Mobile: slim mascot banner (hidden on sm+) ─────────────────── */}
        <div className="flex items-center gap-3 bg-page-field px-5 py-3 sm:hidden">
          <HatchImage state={screenToPose(currentScreen)} size={44} alt="Hatch" />
          <p className="min-w-0 font-body text-[12px] leading-snug text-ink-secondary">
            {SCREEN_PANEL_COPY[currentScreen]}
          </p>
        </div>

        {/* ── Desktop: two-pane grid (hidden on mobile) ─────────────────── */}
        <div className="hidden sm:grid sm:grid-cols-[3fr_7fr] min-h-[580px]">

          {/* LEFT — welcome panel (30%) */}
          <WelcomePanel
            pose={screenToPose(currentScreen)}
            body={SCREEN_PANEL_COPY[currentScreen]}
            footnote="About 5 minutes. Reset it anytime from Settings."
          />

          {/* RIGHT — form pane (70%) */}
          <div className="relative overflow-y-auto bg-card-bright max-h-[85vh]">
            <CalibrationFlowWrapper
              onScreenChange={setCurrentScreen}
              onComplete={handleComplete}
            />
          </div>
        </div>

        {/* ── Mobile: form pane below the banner ───────────────────────── */}
        <div className="sm:hidden overflow-y-auto bg-card-bright max-h-[75vh]">
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
// Thin wrapper that mirrors CalibrationFlow's internal screen transitions via
// the 'calibration-screen-change' custom DOM event (fired inside its
// transitionTo), so OnboardingModal can swap the left-panel pose + copy
// without forking CalibrationFlow or changing its signature.

function CalibrationFlowWrapper({
  onScreenChange,
  onComplete,
}: {
  onScreenChange: (screen: CalScreen) => void
  onComplete: (path: 'challenge' | 'plan' | 'flow' | 'tour', slug?: string | null) => void
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
