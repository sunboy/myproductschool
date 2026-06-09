'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, useRef, Suspense, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  COOKIE_CHOICE_EVENT,
  COOKIE_CHOICE_STORAGE_KEY,
  isCookieChoice,
  type CookieChoice,
} from '@/lib/privacy/cookies'

const POSTHOG_KEY = 'phc_kOGqJIy7F3yxPfI8w3WB89E5s4BJ364Qrq6X8HEK6LY'
const POSTHOG_HOST = 'https://us.i.posthog.com'

/** Returns true when the current path is a /go/* lead-magnet page. */
function isMagnetRoute(pathname: string): boolean {
  return pathname.startsWith('/go')
}

function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(COOKIE_CHOICE_STORAGE_KEY) === 'all'
}

function eventChoice(event: Event): CookieChoice | null {
  const detail = (event as CustomEvent<unknown>).detail
  return typeof detail === 'string' && isCookieChoice(detail) ? detail : null
}

function PostHogPageView({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthogClient = usePostHog()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    if (url === lastPath.current) return
    lastPath.current = url
    posthogClient.capture('$pageview', { $current_url: window.location.href })
  }, [enabled, pathname, searchParams, posthogClient])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    const onMagnetRoute = isMagnetRoute(pathname)

    const syncConsent = (hasConsent: boolean) => {
      if (posthog.__loaded) {
        // PostHog is already initialised. If consent was just granted on a
        // magnet route (where it started in memory-only mode), switch to the
        // normal durable persistence so future events use cookies/localStorage.
        if (hasConsent) {
          posthog.set_config({ persistence: 'localStorage+cookie' })
        }
        setAnalyticsEnabled(hasConsent || onMagnetRoute)
        return
      }

      if (onMagnetRoute) {
        // On /go/* routes we always initialise pre-consent, but we use
        // in-memory persistence only so no cookie or localStorage is written
        // until the user explicitly grants consent.
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          defaults: '2026-01-30',
          person_profiles: 'identified_only',
          capture_pageview: false,
          persistence: 'memory',
        })
        setAnalyticsEnabled(true)
        // If the visitor already consented in a previous session, upgrade now.
        if (hasConsent) {
          posthog.set_config({ persistence: 'localStorage+cookie' })
        }
        return
      }

      if (!hasConsent) return

      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        defaults: '2026-01-30',
        person_profiles: 'identified_only',
        capture_pageview: false,
      })
      setAnalyticsEnabled(true)
    }

    queueMicrotask(() => syncConsent(hasAnalyticsConsent()))

    const onChoice = (event: Event) => {
      syncConsent(eventChoice(event) === 'all')
    }

    window.addEventListener(COOKIE_CHOICE_EVENT, onChoice)
    return () => window.removeEventListener(COOKIE_CHOICE_EVENT, onChoice)
    // pathname is included so that navigating from a non-/go route to a /go
    // route within the same SPA session triggers the memory-mode init.
  }, [pathname])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView enabled={analyticsEnabled} />
      </Suspense>
      {children}
    </PHProvider>
  )
}
