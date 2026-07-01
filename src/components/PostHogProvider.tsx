'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, useRef, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  COOKIE_CHOICE_EVENT,
  COOKIE_CHOICE_STORAGE_KEY,
  isCookieChoice,
  type CookieChoice,
} from '@/lib/privacy/cookies'

function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(COOKIE_CHOICE_STORAGE_KEY) === 'all'
}

function eventChoice(event: Event): CookieChoice | null {
  const detail = (event as CustomEvent<unknown>).detail
  return typeof detail === 'string' && isCookieChoice(detail) ? detail : null
}

// Tracks pageviews across BOTH path changes and query-string-only navigations (filter/
// search params on the same page). useSearchParams() is what makes the effect re-run on
// query changes, and it is safe here: this component always renders null (capture is
// deferred to an effect), so params never affect render output, and the Suspense boundary
// in the provider below contains useSearchParams()'s dynamic opt-in to this leaf. This is
// the standard App Router pattern and is NOT the source of the paid-traffic hydration
// crash (HACKPRODUCT-G) — that was a JSX-branching mismatch from useReducedMotion() in the
// landing tree, fixed via useReducedMotionSafe. Do not "optimize" this into reading
// window.location.search: that silently drops pageviews on query-only navigations.
function PostHogPageView({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthogClient = usePostHog()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const query = searchParams.toString()
    const url = pathname + (query ? `?${query}` : '')
    if (url === lastPath.current) return
    lastPath.current = url
    posthogClient.capture('$pageview', { $current_url: window.location.href })
  }, [enabled, pathname, searchParams, posthogClient])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    const syncConsent = (enabled: boolean) => {
      setAnalyticsEnabled(enabled)
      if (!enabled) return
      if (posthog.__loaded) return
      posthog.init('phc_kOGqJIy7F3yxPfI8w3WB89E5s4BJ364Qrq6X8HEK6LY', {
        api_host: 'https://us.i.posthog.com',
        defaults: '2026-01-30',
        person_profiles: 'identified_only',
        capture_pageview: false,
      })
    }

    queueMicrotask(() => syncConsent(hasAnalyticsConsent()))

    const onChoice = (event: Event) => {
      syncConsent(eventChoice(event) === 'all')
    }

    window.addEventListener(COOKIE_CHOICE_EVENT, onChoice)
    return () => window.removeEventListener(COOKIE_CHOICE_EVENT, onChoice)
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView enabled={analyticsEnabled} />
      </Suspense>
      {children}
    </PHProvider>
  )
}
