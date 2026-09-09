'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface Slots { left?: ReactNode; right?: ReactNode }

// Two contexts on purpose: pages only ever need the setter (stable), so
// updating the slots never re-renders the page that registered them. A single
// { slots, setSlots } value re-rendered the reader on every slot change, which
// re-created the slot elements, re-ran the effect, and looped forever.
const SlotsCtx = createContext<Slots>({})
const SetCtx = createContext<(s: Slots) => void>(() => {})

export function ReaderChromeProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<Slots>({})
  return <SetCtx.Provider value={setSlots}><SlotsCtx.Provider value={slots}>{children}</SlotsCtx.Provider></SetCtx.Provider>
}

export function useReaderChromeSlots() {
  return useContext(SlotsCtx)
}

/** Pages call this to put a back link (left) and actions (right) in the 48px
 *  top bar while mounted. Pass `deps` describing when the slot content changes
 *  (labels, completion state); the effect re-registers only on those changes. */
export function useReaderChrome(slots: Slots, deps: readonly unknown[] = []) {
  const setSlots = useContext(SetCtx)
  useEffect(() => {
    setSlots(slots)
    return () => setSlots({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSlots, ...deps])
}
