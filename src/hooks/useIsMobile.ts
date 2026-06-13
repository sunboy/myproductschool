'use client'

import { useEffect, useState } from 'react'

/**
 * SSR-safe mobile detection via matchMedia.
 *
 * Starts as `false` (desktop) so the server render and the first client paint
 * agree — then flips to the real value in an effect after mount. This deferred
 * flip avoids hydration mismatches, mirroring the pattern already used elsewhere
 * in the workspace (the canvas tour mount).
 *
 * Default query is the Tailwind `md` boundary, so `true` means "phone".
 */
export function useIsMobile(query = '(max-width: 767px)'): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return isMobile
}
