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
}

export const HATCH_TOUR_STEPS: HatchTourStep[] = [
  {
    id: 'dashboard-session',
    target: 'dashboard-session',
    message: "This is your launch pad. Start here when you want Hatch to pick the next useful rep.",
    animation: 'lead',
  },
  {
    id: 'explore',
    target: 'nav-explore',
    message: 'Explore is the map: plans, autopsies, domains, and the rabbit holes worth taking.',
    animation: 'point',
  },
  {
    id: 'practice',
    target: 'nav-practice',
    message: 'Practice is where the reps live. Hatch will help you find the right kind of challenge.',
    animation: 'guide',
  },
  {
    id: 'interviews',
    target: 'nav-interviews',
    message: 'Interviews are the pressure chamber. Use them when you want the room to feel real.',
    animation: 'wake',
  },
  {
    id: 'progress',
    target: 'nav-progress',
    message: 'Progress shows the pattern underneath the scores, including where Hatch wants you training next.',
    animation: 'celebrating',
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

const TOUR_COMPLETED_KEY = 'hatch-tour:v1:completed'
const TOUR_SKIPPED_KEY = 'hatch-tour:v1:skipped'

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
    setTourStepIndex(0)
    setActiveCue(null)
  }, [])

  const completeTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_COMPLETED_KEY, new Date().toISOString())
      localStorage.removeItem(TOUR_SKIPPED_KEY)
      snoozeTourSurfacesForToday()
    }
    setTourActive(false)
    setTourStepIndex(0)
    setActiveCue(null)
  }, [])

  const skipTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOUR_SKIPPED_KEY, new Date().toISOString())
    }
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
          snoozeTourSurfacesForToday()
        }
        setTourActive(false)
        setActiveCue(null)
        return 0
      }
      setActiveCue(null)
      return index + 1
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
