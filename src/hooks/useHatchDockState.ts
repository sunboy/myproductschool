'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'

export type HatchDockMode = 'closed' | 'floating' | 'docked'

const DEFAULT_WIDTH = 320
const MIN_WIDTH = 240
const MAX_WIDTH = 480

export function useHatchDockState(surface: 'canvas' | 'flow') {
  const modeKey = useMemo(() => `hatch-mode:${surface}`, [surface])
  const widthKey = useMemo(() => `hatch-width:${surface}`, [surface])

  // Hydration-safe: the server renders 'closed', so the FIRST client render must
  // also be 'closed'. Reading localStorage in the initializer made SSR (collapsed
  // pill) disagree with the client (expanded panel) and threw a hydration
  // mismatch on lab pages. The mount effect below restores the stored state.
  const [mode, setModeState] = useState<HatchDockMode>('closed')
  const [panelWidth, setPanelWidthState] = useState<number>(DEFAULT_WIDTH)

  const setMode = useCallback((m: HatchDockMode) => {
    setModeState(m)
    localStorage.setItem(modeKey, m)
  }, [modeKey])

  const setPanelWidth = useCallback((w: number) => {
    const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w))
    setPanelWidthState(clamped)
    localStorage.setItem(widthKey, String(clamped))
  }, [widthKey])

  // Sync on mount in case another tab changed localStorage
  useEffect(() => {
    const stored = localStorage.getItem(modeKey) as HatchDockMode | null
    if (stored) setModeState(stored)
    const storedW = parseInt(localStorage.getItem(widthKey) ?? '', 10)
    if (!isNaN(storedW)) setPanelWidthState(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, storedW)))
  }, [modeKey, widthKey])

  return { mode, panelWidth, setMode, setPanelWidth, MIN_WIDTH, MAX_WIDTH }
}
