'use client'

import { useEffect, useState } from 'react'

/**
 * SSR-safe prefers-reduced-motion detection.
 *
 * framer-motion's own useReducedMotion() can resolve the media query synchronously
 * on the client, so a visitor whose OS reports `prefers-reduced-motion: reduce`
 * renders a different branch on first client paint than the server produced (which
 * has no OS preference and renders the "false" branch) — a hydration mismatch in
 * the landing tree. This hook starts as `false` (matching SSR) and only applies the
 * real value in an effect after mount, mirroring useIsMobile.
 */
export function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return reduced
}
