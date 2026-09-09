'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
  /** On forced routes the full nav opens as an overlay instead of pushing content. */
  navOverlay: boolean
  setNavCollapsed: (collapsed: boolean) => void
  setNavOverlay: (open: boolean) => void
  practiceView: 'list' | 'cards'
  setPracticeView: (v: 'list' | 'cards') => void
}

const Ctx = createContext<UiShellValue>({
  density: false, navCollapsedPref: false, railCollapsed: false, forced: false, navOverlay: false,
  setNavCollapsed: () => {}, setNavOverlay: () => {}, practiceView: 'list', setPracticeView: () => {},
})

export function UiShellProvider({ density, initialPrefs, children }: { density: boolean; initialPrefs?: UiPrefs | null; children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const [prefs, setPrefs] = useState<UiPrefs>(() => ({ ...(initialPrefs ?? {}) }))
  const [navOverlay, setNavOverlay] = useState(false)
  const prefsRef = useRef(prefs)
  useEffect(() => { prefsRef.current = prefs }, [prefs])

  // Hydrate from the local mirror once so the very first paint after navigation matches.
  useEffect(() => { setPrefs(p => ({ ...readLocalUiPrefs(), ...p })) }, [])

  const forced = forcedRail(pathname)
  // The overlay never survives a route change.
  useEffect(() => { setNavOverlay(false) }, [pathname])

  // Persist against the latest prefs (ref) so rapid toggles never write a stale merge.
  const setNavCollapsed = useCallback((collapsed: boolean) => {
    setPrefs(p => ({ ...p, nav_collapsed: collapsed }))
    void persistUiPrefs(prefsRef.current, { nav_collapsed: collapsed })
  }, [])
  const setPracticeView = useCallback((v: 'list' | 'cards') => {
    setPrefs(p => ({ ...p, practice_view: v }))
    void persistUiPrefs(prefsRef.current, { practice_view: v })
  }, [])

  const value = useMemo<UiShellValue>(() => ({
    density,
    navCollapsedPref: !!prefs.nav_collapsed,
    railCollapsed: forced || !!prefs.nav_collapsed,
    forced,
    navOverlay: forced && navOverlay,
    setNavCollapsed,
    setNavOverlay,
    practiceView: prefs.practice_view ?? 'list',
    setPracticeView,
  }), [density, prefs, forced, navOverlay, setNavCollapsed, setPracticeView])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUiShell() { return useContext(Ctx) }
