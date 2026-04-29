'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthogClient = usePostHog()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    if (url === lastPath.current) return
    lastPath.current = url
    posthogClient.capture('$pageview', { $current_url: window.location.href })
  }, [pathname, searchParams, posthogClient])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init('phc_kOGqJIy7F3yxPfI8w3WB89E5s4BJ364Qrq6X8HEK6LY', {
      api_host: 'https://us.i.posthog.com',
      defaults: '2026-01-30',
      person_profiles: 'identified_only',
      capture_pageview: false, // manual via PostHogPageView
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  )
}
