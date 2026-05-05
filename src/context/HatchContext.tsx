'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { HatchState } from '@/components/shell/HatchGlyph'

export interface HatchChatMessage {
  role: 'user' | 'hatch'
  content: string
}

interface HatchContextValue {
  message: string
  state: HatchState
  setHatch: (message: string, state: HatchState) => void
  chatMessages: HatchChatMessage[]
  setChatMessages: React.Dispatch<React.SetStateAction<HatchChatMessage[]>>
}

const HatchContext = createContext<HatchContextValue | null>(null)

export function HatchProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('')
  const [state, setState] = useState<HatchState>('idle')
  const [chatMessages, setChatMessages] = useState<HatchChatMessage[]>([])

  const setHatch = useCallback((msg: string, s: HatchState) => {
    setMessage(msg)
    setState(s)
  }, [])

  return (
    <HatchContext.Provider value={{ message, state, setHatch, chatMessages, setChatMessages }}>
      {children}
    </HatchContext.Provider>
  )
}

export function useHatchContext() {
  return useContext(HatchContext)
}
