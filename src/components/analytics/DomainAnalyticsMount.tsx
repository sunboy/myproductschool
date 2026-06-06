'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_DOMAIN_VIEWED } from '@/lib/posthog/events'

/**
 * Mounts inside a server component (domain detail page) to fire a client-side
 * PostHog event when the page renders. Renders nothing visible.
 */
export function DomainAnalyticsMount({ slug, theme }: { slug: string; theme: string | null }) {
  useEffect(() => {
    trackEvent(EVENT_DOMAIN_VIEWED, { slug, theme })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return null
}
