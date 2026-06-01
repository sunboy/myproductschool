'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { HATCH_TOUR_STEPS, HATCH_TOUR_STORAGE, useHatchContext } from '@/context/HatchContext'
import type { HatchCueInput } from '@/context/HatchContext'

const TOUR_COMPLETED_KEY = HATCH_TOUR_STORAGE.completed
const TOUR_SKIPPED_KEY = HATCH_TOUR_STORAGE.skipped
const TOUR_OFFERED_KEY = HATCH_TOUR_STORAGE.offered
const ROUTE_CUE_AUTO_HIDE_MS = 8500
const TOUR_INVITE_AUTO_HIDE_MS = 9000
const TARGET_GRACE_MS = 600

function tourSeen() {
  if (typeof window === 'undefined') return true
  return Boolean(
    localStorage.getItem(TOUR_COMPLETED_KEY) ||
    localStorage.getItem(TOUR_SKIPPED_KEY) ||
    localStorage.getItem(TOUR_OFFERED_KEY),
  )
}

function markTourOffered() {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOUR_OFFERED_KEY, new Date().toISOString())
}

function targetExists(id: string | undefined): boolean {
  if (!id || typeof document === 'undefined') return false
  return Boolean(document.querySelector(`[data-hatch-target="${CSS.escape(id)}"]`))
}

function routeCue(pathname: string): HatchCueInput | null {
  if (pathname.startsWith('/workspace')) return null

  if (pathname.startsWith('/dashboard')) {
    return {
      surface: 'dashboard',
      message: 'I found your next useful rep. Want me to point you at it?',
      state: 'delighted',
      animation: 'guide',
      target: 'dashboard-session',
      cooldownKey: 'dashboard',
      source: 'route',
      priority: 2,
      cta: { label: 'Show me', action: 'open-chat', prompt: 'Show me the next useful rep and why it fits where I am right now.' },
      autoHideMs: 9000,
    }
  }

  if (pathname.startsWith('/explore')) {
    return {
      surface: 'explore',
      message: 'Exploring is easier with a compass. Start with plans, then jump into a rep.',
      state: 'intrigued',
      animation: 'peek',
      target: 'nav-explore',
      cooldownKey: 'explore',
      source: 'route',
      cta: { label: 'Ask Hatch', action: 'open-chat', prompt: 'I am not sure where to start exploring. Ask me what I need and point me at the right plan.' },
      autoHideMs: ROUTE_CUE_AUTO_HIDE_MS,
    }
  }

  if (pathname.startsWith('/challenges')) {
    return {
      surface: 'practice',
      message: 'I can help narrow these to the FLOW move that needs the most reps.',
      state: 'challenging',
      animation: 'point',
      target: 'nav-practice',
      cooldownKey: 'practice',
      source: 'route',
      cta: { label: 'Help me choose', action: 'open-chat', prompt: 'Help me choose the challenge that targets the FLOW move I need the most reps on.' },
      autoHideMs: ROUTE_CUE_AUTO_HIDE_MS,
    }
  }

  if (pathname.startsWith('/live-interviews')) return null

  if (pathname.startsWith('/progress') || pathname.startsWith('/history')) {
    return {
      surface: 'progress',
      message: 'Your scores have a pattern. I can help translate it into the next rep.',
      state: 'reviewing',
      animation: 'observing',
      target: 'nav-progress',
      cooldownKey: 'progress',
      source: 'route',
      cta: { label: 'Read the pattern', action: 'open-chat', prompt: 'Read the pattern in my recent scores and tell me what to practice next.' },
      autoHideMs: ROUTE_CUE_AUTO_HIDE_MS,
    }
  }

  if (
    pathname.startsWith('/notes') ||
    pathname.startsWith('/frameworks') ||
    pathname.startsWith('/flashcards') ||
    pathname.startsWith('/vocabulary') ||
    pathname.startsWith('/product-75')
  ) {
    return {
      surface: 'study',
      message: 'Study mode. I can turn this into a quick practice move when you are ready.',
      state: 'idle',
      animation: 'idle-hover',
      target: 'nav-practice',
      cooldownKey: 'study',
      source: 'route',
      cta: { label: 'Find a rep', href: '/challenges' },
      autoHideMs: ROUTE_CUE_AUTO_HIDE_MS,
    }
  }

  return {
    surface: 'app',
    message: 'Need a next move? I can point you at the useful part.',
    state: 'idle',
    animation: 'peek',
    target: 'nav-dashboard',
    cooldownKey: `app:${pathname}`,
    source: 'route',
    cta: { label: 'Ask Hatch', action: 'open-chat', prompt: 'Tell me the most useful next move from this page.' },
    autoHideMs: ROUTE_CUE_AUTO_HIDE_MS,
  }
}

export function HatchDirector() {
  const pathname = usePathname()
  const hatch = useHatchContext()
  const emitCue = hatch?.emitCue
  const nextTourStep = hatch?.nextTourStep
  const tourActive = hatch?.tourActive
  const tourStepIndex = hatch?.tourStepIndex ?? 0

  useEffect(() => {
    if (!emitCue || tourActive) return

    const timer = window.setTimeout(() => {
      if (pathname.startsWith('/dashboard') && !tourSeen()) {
        markTourOffered()
        emitCue({
          id: 'tour-invite',
          surface: 'dashboard',
          message: 'Want the two-minute tour? I will show you where the good stuff lives.',
          state: 'delighted',
          animation: 'wave',
          target: 'dashboard-session',
          source: 'tour',
          priority: 8,
          cta: { label: 'Show me around', action: 'start-tour' },
          autoHideMs: TOUR_INVITE_AUTO_HIDE_MS,
        }, { force: true })
        return
      }

      const cue = routeCue(pathname)
      if (cue) emitCue(cue)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [emitCue, pathname, tourActive])

  useEffect(() => {
    if (!emitCue || !tourActive || !nextTourStep) return
    // Suspend the tour on workspace routes; resume on next non-workspace visit.
    if (pathname.startsWith('/workspace')) return

    const step = HATCH_TOUR_STEPS[tourStepIndex]
    if (!step) return

    const isLast = tourStepIndex === HATCH_TOUR_STEPS.length - 1

    // Two-tier validation: try target immediately, then once more after a grace window
    // (covers late-mounting dashboard cards). If still missing, optional → auto-advance,
    // required → emit cue with no target + fallback copy anchored at FAB.
    let graceTimer: number | undefined
    const emit = () => {
      const present = targetExists(step.target)
      if (!present) {
        if (step.optional) {
          // Silently auto-advance.
          nextTourStep()
          return
        }
        emitCue({
          id: `tour-${step.id}`,
          surface: 'tour',
          message: step.fallback?.copy ?? step.message,
          state: isLast ? 'celebrating' : 'delighted',
          animation: step.animation,
          target: undefined,
          source: 'tour',
          priority: 10,
          cta: {
            label: isLast ? 'Finish tour' : 'Next stop',
            action: isLast ? 'complete-tour' : 'next-tour-step',
          },
        }, { force: true })
        return
      }

      emitCue({
        id: `tour-${step.id}`,
        surface: 'tour',
        message: step.message,
        state: isLast ? 'celebrating' : 'delighted',
        animation: step.animation,
        target: step.target,
        highlightInset: step.highlightInset,
        source: 'tour',
        priority: 10,
        cta: {
          label: isLast ? 'Finish tour' : 'Next stop',
          action: isLast ? 'complete-tour' : 'next-tour-step',
        },
      }, { force: true })
    }

    const firstTry = window.setTimeout(() => {
      if (targetExists(step.target)) {
        emit()
      } else {
        graceTimer = window.setTimeout(emit, TARGET_GRACE_MS)
      }
    }, 160)

    return () => {
      window.clearTimeout(firstTry)
      if (graceTimer) window.clearTimeout(graceTimer)
    }
  }, [emitCue, nextTourStep, tourActive, tourStepIndex, pathname])

  return null
}
