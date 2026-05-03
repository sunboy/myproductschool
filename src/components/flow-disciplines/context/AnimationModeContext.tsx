'use client'

import { createContext, useContext, useState } from 'react'
import type { AnimationMode } from '@/lib/data/flow-framework/types'

interface AnimationModeContextValue {
  mode: AnimationMode
  setMode: (mode: AnimationMode) => void
}

const AnimationModeContext = createContext<AnimationModeContextValue>({
  mode: 'cinematic',
  setMode: () => {},
})

export function AnimationModeProvider({
  children,
  initialMode = 'cinematic',
}: {
  children: React.ReactNode
  initialMode?: AnimationMode
}) {
  const [mode, setMode] = useState<AnimationMode>(initialMode)
  return (
    <AnimationModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AnimationModeContext.Provider>
  )
}

export function useAnimationMode() {
  return useContext(AnimationModeContext)
}
