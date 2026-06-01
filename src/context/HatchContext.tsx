'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { HatchState } from '@/components/shell/HatchGlyph'

export interface HatchChatMessage {
  role: 'user' | 'hatch'
  content: string
}

export type HatchAnimation =
  | 'idle-hover'
  | 'listening'
  | 'thinking'
  | 'reviewing'
  | 'celebrating'
  | 'wake'
  | 'peek'
  | 'point'
  | 'guide'
  | 'dance'
  | 'spin'
  | 'stuck-check'
  | 'observing'
  | 'drawing'
  | 'caution'
  | 'nudging'
  | 'wave'
  | 'lead'
  | 'land'

export type HatchCueAction =
  | 'open-chat'
  | 'open-workspace-chat'
  | 'start-tour'
  | 'next-tour-step'
  | 'skip-tour'
  | 'complete-tour'

export interface HatchCueCta {
  label: string
  action?: HatchCueAction
  href?: string
  event?: string
  /** First-person message pre-filled into the Hatch input when an open-chat CTA fires outside the workspace. */
  prompt?: string
}

export interface HatchCue {
  id: string
  surface: string
  message: string
  state: HatchState
  animation: HatchAnimation
  target?: string
  cta?: HatchCueCta
  priority: number
  cooldownKey?: string
  source: 'route' | 'tour' | 'workspace' | 'nudge' | 'system'
  createdAt: number
  autoHideMs?: number
  /** When true, the target highlight overlay subtracts target padding (hugs content area). */
  highlightInset?: boolean
}

export type HatchCueInput = Omit<HatchCue, 'id' | 'createdAt' | 'priority' | 'source'> & {
  id?: string
  priority?: number
  source?: HatchCue['source']
}

export interface HatchTourStep {
  id: string
  target: string
  message: string
  animation: HatchAnimation
  /** Step is allowed to silently auto-advance if its target isn't on the page. */
  optional?: boolean
  /** Highlight overlay hugs content area (subtracts padding) instead of the border-box. */
  highlightInset?: boolean
  /** Fallback copy used when the target is missing and step is required (anchor stays at FAB). */
  fallback?: { copy: string }
}

export const HATCH_TOUR_STEPS: HatchTourStep[] = [
  {
    id: 'dashboard-hero',
    target: 'dashboard-hero',
    message: "Welcome. This is your home base — Hatch lives here and points you at the next useful rep.",
    animation: 'wave',
    optional: true,
  },
  {
    id: 'explore',
    target: 'nav-explore',
    message: 'Explore is the map: plans, autopsies, domains, and the rabbit holes worth taking.',
    animation: 'point',
    fallback: { copy: "We'll come back to Explore when you're on a page with the side nav." },
  },
  {
    id: 'dashboard-quick-take',
    target: 'dashboard-quick-take',
    message: "Quick Takes are bite-sized reps. Two minutes, one sharp answer, instant feedback.",
    animation: 'point',
    optional: true,
    highlightInset: true,
  },
  {
    id: 'dashboard-session',
    target: 'dashboard-session',
    message: "This is your launch pad. Start here when you want Hatch to pick the next useful rep.",
    animation: 'lead',
    optional: true,
    highlightInset: true,
  },
  {
    id: 'practice',
    target: 'nav-practice',
    message: 'Practice is where the reps live. Hatch will help you find the right kind of challenge.',
    animation: 'guide',
    fallback: { copy: "We'll come back to Practice when you're on a page with the side nav." },
  },
  {
    id: 'interviews',
    target: 'nav-interviews',
    message: 'Interviews are the pressure chamber. Use them when you want the room to feel real.',
    animation: 'wake',
    fallback: { copy: "We'll come back to Interviews when you're on a page with the side nav." },
  },
  {
    id: 'progress',
    target: 'nav-progress',
    message: 'Progress shows the pattern underneath the scores, including where Hatch wants you training next.',
    animation: 'celebrating',
    fallback: { copy: "We'll come back to Progress when you're on a page with the side nav." },
  },
]

interface HatchContextValue {
  message: string
  state: HatchState
  setHatch: (message: string, state: HatchState) => void
  chatMessages: HatchChatMessage[]
  setChatMessages: Dispatch<SetStateAction<HatchChatMessage[]>>
  activeCue: HatchCue | null
  emitCue: (cue: HatchCueInput, options?: { force?: boolean }) => boolean
  dismissCue: (options?: { snooze?: boolean }) => void
  clearCue: () => void
  tourActive: boolean
  tourStepIndex: number
  startTour: () => void
  nextTourStep: () => void
  skipTour: () => void
  completeTour: () => void
}

const HatchContext = createContext<HatchContextValue | null>(null)

export const HATCH_TOUR_STORAGE = {
  completed: 'hatch-tour:v2:completed',
  skipped: 'hatch-tour:v2:skipped',
  offered: 'hatch-tour:v2:offered',
  stepIndex: 'hatch-tour:v2:step',
} as const

const TOUR_COMPLETED_KEY = HATCH_TOUR_STORAGE.completed
const TOUR_SKIPPED_KEY = HATCH_TOUR_STORAGE.skipped
const TOUR_STEP_KEY = HATCH_TOUR_STORAGE.stepIndex

function postTourSeen() {
  if (typeof window === 'undefined') return
  try {
    fetch('/api/onboarding/hatch-intro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function snoozeStorageKey(key: string) {
  return `hatch-cue-snooze:${key}`
}

function isSnoozedToday(key?: string) {
  if (!key || typeof window === 'undefined') return false
  return localStorage.getItem(snoozeStorageKey(key)) === todayKey()
}

function snoozeForToday(key?: string) {
  if (!key || typeof window === 'undefined') return
  localStorage.setItem(snoozeStorageKey(key), todayKey())
}

function snoozeTourSurfacesForToday() {
  for (const surface of ['dashboard', 'explore', 'practice', 'interviews', 'progress']) {
    snoozeForToday(surface)
  }
}

export function HatchProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [state, setState] = useState<HatchState>('idle')
  const [chatMessages, setChatMessages] = useState<HatchChatMessage[]>([])
  const [activeCue, setActiveCue] = useState<HatchCue | null>(null)
  const [tourActive, setTourActive] = useState(false)
  const [tourStepIndex, setTourStepIndex] = useState(0)

  const setHatch = useCallback((msg: string, s: HatchState) => {
    setMessage(msg)
    setState(s)
  }, [])

  const emitCue = useCallback((cue: HatchCueInput, options?: { force?: boolean }) => {
    if (!options?.force && isSnoozedToday(cue.cooldownKey)) return false

    const next: HatchCue = {
      ...cue,
      id: cue.id ?? `${cue.surface}-${Date.now()}`,
      priority: cue.priority ?? 1,
      source: cue.source ?? 'system',
      createdAt: Date.now(),
    }

    setActiveCue((current) => {
      if (!options?.force && current && current.priority > next.priority) return current
      return next
    })
    setMessage(next.message)
    setState(next.state)
    return true
  }, [])

  const dismissCue = useCallback((options?: { snooze?: boolean }) => {
    setActiveCue((current) => {
      if (options?.snooze !== false) snoozeForToday(current?.cooldownKey)
      return null
    })
  }, [])

  const clearCue = useCallback(() => {
    setActiveCue(null)
  }, [])

  const startTour = useCallback(() => {
    setTourActive(true)
    // Resume from persisted step index if it exists and is valid; else start at 0.
    let resumeIndex = 0
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(TOUR_STEP_KEY)
      const parsed = raw ? parseInt(raw, 10) : NaN
      if (Number.isFinite(parsed) && parsed >= 0 && parsed < HATCH_TOUR_STEPS.length) {
        resumeIndex = parsed
      }
    }
    setTourStepIndex(resumeIndex)
    setActiveCue(null)
  }, [])

  const completeTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_COMPLETED_KEY, new Date().toISOString())
      localStorage.removeItem(TOUR_SKIPPED_KEY)
      localStorage.removeItem(TOUR_STEP_KEY)
      snoozeTourSurfacesForToday()
    }
    postTourSeen()
    setTourActive(false)
    setTourStepIndex(0)
    setActiveCue(null)
  }, [])

  const skipTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_SKIPPED_KEY, new Date().toISOString())
      localStorage.removeItem(TOUR_STEP_KEY)
    }
    postTourSeen()
    setTourActive(false)
    setTourStepIndex(0)
    setActiveCue(null)
  }, [])

  const nextTourStep = useCallback(() => {
    setTourStepIndex((index) => {
      if (index >= HATCH_TOUR_STEPS.length - 1) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOUR_COMPLETED_KEY, new Date().toISOString())
          localStorage.removeItem(TOUR_SKIPPED_KEY)
          localStorage.removeItem(TOUR_STEP_KEY)
          snoozeTourSurfacesForToday()
        }
        postTourSeen()
        setTourActive(false)
        setActiveCue(null)
        return 0
      }
      const next = index + 1
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOUR_STEP_KEY, String(next))
      }
      setActiveCue(null)
      return next
    })
  }, [])

  return (
    <HatchContext.Provider
      value={{
        message,
        state,
        setHatch,
        chatMessages,
        setChatMessages,
        activeCue,
        emitCue,
        dismissCue,
        clearCue,
        tourActive,
        tourStepIndex,
        startTour,
        nextTourStep,
        skipTour,
        completeTour,
      }}
    >
      {children}
    </HatchContext.Provider>
  )
}

export function useHatchContext() {
  return useContext(HatchContext)
}
