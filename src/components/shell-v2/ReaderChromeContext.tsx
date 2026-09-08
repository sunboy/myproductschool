'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface Slots { left?: ReactNode; right?: ReactNode }

const Ctx = createContext<{ slots: Slots; setSlots: (s: Slots) => void }>({ slots: {}, setSlots: () => {} })

export function ReaderChromeProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<Slots>({})
  return <Ctx.Provider value={{ slots, setSlots }}>{children}</Ctx.Provider>
}

export function useReaderChromeSlots() {
  return useContext(Ctx).slots
}

/** Pages call this to put a back link (left) and actions (right) in the 48px top bar while mounted. */
export function useReaderChrome(slots: Slots) {
  const { setSlots } = useContext(Ctx)
  useEffect(() => {
    setSlots(slots)
    return () => setSlots({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.left, slots.right])
}
