'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { forcedRail } from '@/lib/shell/route-kind'
import { persistUiPrefs, readLocalUiPrefs, type UiPrefs } from '@/lib/shell/ui-prefs'

interface UiShellValue {
  density: boolean
  /** User preference (persisted). */
  navCollapsedPref: boolean
  /** Effective state: forced rail on reader/workspace routes, else preference. */
  railCollapsed: boolean
  forced: boolean
  setNavCollapsed: (collapsed: boolean) => void
  practiceView: 'list' | 'cards'
  setPracticeView: (v: 'list' | 'cards') => void
}

const Ctx = createContext<UiShellValue>({
  density: false, navCollapsedPref: false, railCollapsed: false, forced: false,
  setNavCollapsed: () => {}, practiceView: 'list', setPracticeView: () => {},
})

export function UiShellProvider({ density, initialPrefs, children }: { density: boolean; initialPrefs?: UiPrefs | null; children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const [prefs, setPrefs] = useState<UiPrefs>(() => ({ ...(initialPrefs ?? {}) }))

  // Hydrate from the local mirror once so the very first paint after navigation matches.
  useEffect(() => { setPrefs(p => ({ ...readLocalUiPrefs(), ...p })) }, [])

  const forced = forcedRail(pathname)
  const setNavCollapsed = useCallback((collapsed: boolean) => {
    setPrefs(p => ({ ...p, nav_collapsed: collapsed }))
    void persistUiPrefs(prefs, { nav_collapsed: collapsed })
  }, [prefs])
  const setPracticeView = useCallback((v: 'list' | 'cards') => {
    setPrefs(p => ({ ...p, practice_view: v }))
    void persistUiPrefs(prefs, { practice_view: v })
  }, [prefs])

  const value = useMemo<UiShellValue>(() => ({
    density,
    navCollapsedPref: !!prefs.nav_collapsed,
    railCollapsed: forced || !!prefs.nav_collapsed,
    forced,
    setNavCollapsed,
    practiceView: prefs.practice_view ?? 'list',
    setPracticeView,
  }), [density, prefs, forced, setNavCollapsed, setPracticeView])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUiShell() { return useContext(Ctx) }
