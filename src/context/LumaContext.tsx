'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { LumaState } from '@/components/shell/LumaGlyph'

export interface LumaChatMessage {
  role: 'user' | 'luma'
  content: string
}

interface LumaContextValue {
  message: string
  state: LumaState
  setLuma: (message: string, state: LumaState) => void
  chatMessages: LumaChatMessage[]
  setChatMessages: React.Dispatch<React.SetStateAction<LumaChatMessage[]>>
}

const LumaContext = createContext<LumaContextValue | null>(null)

export function LumaProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('')
  const [state, setState] = useState<LumaState>('idle')
  const [chatMessages, setChatMessages] = useState<LumaChatMessage[]>([])

  const setLuma = useCallback((msg: string, s: LumaState) => {
    setMessage(msg)
    setState(s)
  }, [])

  return (
    <LumaContext.Provider value={{ message, state, setLuma, chatMessages, setChatMessages }}>
      {children}
    </LumaContext.Provider>
  )
}

export function useLumaContext() {
  return useContext(LumaContext)
}
