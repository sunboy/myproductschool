'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useHatchContext } from '@/context/HatchContext'
import { useSession } from '@/context/SessionContext'

// HatchDirector drives Hatch's proactive presence on the hub pages. It is
// deliberately restrained and fully deterministic: at most one contextual cue
// per hub, gated behind a once-per-day snooze (handled by emitCue's
// cooldownKey) so Hatch never feels naggy. The workspace, live-interview and
// canvas surfaces emit their own in-context cues and are intentionally
// excluded here.
//
// (The old AI-driven route bubble was removed on 2026-06-02 when onboarding
// moved to the Shepherd.js tour. This is the rebuilt rule-based layer.)

interface HubCue {
  /** Matched against the EXACT hub root only (not deep sub-pages). */
  prefix: string
  message: string
  cta: { label: string; prompt: string }
  cooldownKey: string
}

const HUB_CUES: HubCue[] = [
  {
    prefix: '/dashboard',
    message: "Ready to pick today's rep? I can tell you which one builds your weakest move.",
    cta: { label: 'Pick my rep', prompt: 'What should I practice today, and why that one?' },
    cooldownKey: 'hub:dashboard',
  },
  {
    prefix: '/explore',
    message: "Tell me your role and I'll point you at the reps that move your weakest move.",
    cta: { label: 'Help me pick', prompt: 'Which path here fits my role and my gaps?' },
    cooldownKey: 'hub:explore',
  },
  {
    prefix: '/challenges',
    message: 'I can filter these to the one move you most need to practice.',
    cta: { label: 'Filter for me', prompt: 'Which move should I practice, and can you filter to it?' },
    cooldownKey: 'hub:challenges',
  },
  {
    prefix: '/progress',
    message: 'Want me to read what your numbers actually say about where to focus next?',
    cta: { label: 'Show me', prompt: 'Looking at my progress, where should I focus next?' },
    cooldownKey: 'hub:progress',
  },
]

// Only fire on the hub ROOT, never on a deep sub-page that owns its own context
// (e.g. /challenges/{id}/feedback, /explore/domains/{slug}, /progress/skill-ladder).
function matchHubRoot(pathname: string): HubCue | null {
  for (const cue of HUB_CUES) {
    if (pathname === cue.prefix) return cue
  }
  return null
}

export function HatchDirector() {
  const pathname = usePathname()
  const hatchCtx = useHatchContext()
  const session = useSession()
  // One emit per mounted route visit; resets when the pathname changes.
  const emittedForRef = useRef<string | null>(null)
  const onboardingDone = Boolean(session.profile?.onboarding_completed_at)

  // HatchProvider's context value is a fresh object each render, so keep emitCue
  // in a ref and DON'T depend on hatchCtx identity — otherwise the effect would
  // re-run (and rebuild the timer) on every provider render.
  const emitCueRef = useRef(hatchCtx?.emitCue)
  emitCueRef.current = hatchCtx?.emitCue

  useEffect(() => {
    if (!pathname) return
    // Don't coach until onboarding is finished; the tour owns that moment.
    if (!onboardingDone) return
    // Don't re-emit for the same route within a single visit.
    if (emittedForRef.current === pathname) return

    const hub = matchHubRoot(pathname)
    if (!hub) return

    emittedForRef.current = pathname

    // Let the page settle so the bubble doesn't fight the route transition,
    // then emit. emitCue self-suppresses if this cooldownKey was snoozed today.
    const timer = window.setTimeout(() => {
      emitCueRef.current?.({
        surface: 'hub',
        source: 'route',
        message: hub.message,
        state: 'speaking',
        animation: 'idle-hover',
        priority: 2,
        cooldownKey: hub.cooldownKey,
        autoHideMs: 9000,
        cta: { label: hub.cta.label, action: 'open-chat', prompt: hub.cta.prompt },
      })
    }, 1400)

    return () => window.clearTimeout(timer)
  }, [pathname, onboardingDone])

  return null
}
