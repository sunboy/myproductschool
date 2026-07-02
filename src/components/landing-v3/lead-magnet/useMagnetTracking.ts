'use client'

import { useEffect, useRef, useCallback } from 'react'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_MAGNET_VIEWED } from '@/lib/posthog/events'
import { captureUtmFromLocation, getStoredUtm, rememberMagnetSource } from '@/lib/lead-magnets/utm'

/**
 * Tracking hook for /go/* lead-magnet pages.
 *
 * On mount:
 * - Captures UTM params from the URL into sessionStorage (first-touch-wins).
 * - Remembers the source_slug in localStorage for signup attribution.
 * - Fires EVENT_MAGNET_VIEWED exactly once per mount (ref guard prevents
 *   double-fires under React Strict Mode).
 *
 * Returns:
 * - `track` — fire any lead-magnet event; source_slug and all stored UTM
 *   params are automatically merged into every call's properties.
 * - `utm` — the current UTM params (stable after mount).
 */
export function useMagnetTracking(sourceSlug: string): {
  track: (event: string, props?: Record<string, unknown>) => void
  utm: Record<string, string>
} {
  const viewedRef = useRef(false)
  const utmRef = useRef<Record<string, string>>({})

  useEffect(() => {
    // Capture + persist UTMs from the current URL on first render.
    utmRef.current = captureUtmFromLocation()

    // Remember this magnet so signup can attribute the new account.
    rememberMagnetSource(sourceSlug)

    // Fire the page-view event once per mount.
    if (!viewedRef.current) {
      viewedRef.current = true
      trackEvent(EVENT_MAGNET_VIEWED, {
        source_slug: sourceSlug,
        ...utmRef.current,
      })
    }
    // sourceSlug is intentionally omitted from the dep array — it is stable for
    // the lifetime of a given /go/* page and we never want to re-fire on a
    // hypothetical slug change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const track = useCallback(
    (event: string, props?: Record<string, unknown>) => {
      trackEvent(event, {
        source_slug: sourceSlug,
        ...getStoredUtm(),
        ...props,
      })
    },
    [sourceSlug],
  )

  return { track, utm: utmRef.current }
}
