'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
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

// Reads the query string from window.location inside the client-only effect rather than
// via useSearchParams(). useSearchParams() forces the consuming subtree to reconcile
// server-committed params against the live URL; on the statically-prerendered "/" route
// the build-time HTML carries no query string, so a paid-traffic click landing on
// /?gad_source=…&gclid=… hydrated against non-empty params and crashed first paint
// (Sentry HACKPRODUCT-G). location.search is only touched post-hydration, so there is
// nothing to reconcile and "/" stays statically generated.
function PostHogPageView({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  const posthogClient = usePostHog()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const url = pathname + window.location.search
    if (url === lastPath.current) return
    lastPath.current = url
    posthogClient.capture('$pageview', { $current_url: window.location.href })
  }, [enabled, pathname, posthogClient])

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
      <PostHogPageView enabled={analyticsEnabled} />
      {children}
    </PHProvider>
  )
}
