'use client'

import posthog from 'posthog-js'

/**
 * Client-side analytics helpers that are safe to call from anywhere.
 *
 * PostHog is consent-gated: it only initializes (`posthog.__loaded`) after the
 * user accepts analytics cookies in PostHogProvider. These wrappers no-op until
 * then, so call sites never have to check consent themselves.
 */

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return
  posthog.capture(event, properties)
}

export function identifyUser(distinctId: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return
  posthog.identify(distinctId, properties)
}
