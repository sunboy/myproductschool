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
}

const HatchContext = createContext<HatchContextValue | null>(null)

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

export function HatchProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [state, setState] = useState<HatchState>('idle')
  const [chatMessages, setChatMessages] = useState<HatchChatMessage[]>([])
  const [activeCue, setActiveCue] = useState<HatchCue | null>(null)

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
      }}
    >
      {children}
    </HatchContext.Provider>
  )
}

export function useHatchContext() {
  return useContext(HatchContext)
}
