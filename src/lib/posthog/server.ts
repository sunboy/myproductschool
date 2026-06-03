import { PostHog } from 'posthog-node'
import { logger } from '@/lib/log'

// Same project key + host as the browser SDK in src/components/PostHogProvider.tsx,
// so server-side events land in the same project and unify with client events on
// the same distinctId (the user's id). The key is a public project key, not a secret.
const POSTHOG_KEY = 'phc_kOGqJIy7F3yxPfI8w3WB89E5s4BJ364Qrq6X8HEK6LY'
const POSTHOG_HOST = 'https://us.i.posthog.com'

let client: PostHog | null = null

function getClient(): PostHog {
  if (!client) {
    client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // In serverless we flush explicitly after each capture (see below), so keep
      // the batching window tight and don't rely on the background flush timer.
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}

interface ServerEvent {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
}

/**
 * Capture a server-side event and flush before returning.
 *
 * On Vercel the lambda can freeze the moment the response is sent, dropping any
 * un-flushed events. Awaiting flush() guarantees delivery at the cost of a small
 * network round-trip. Use this for authoritative funnel events (grade complete,
 * submit) that must not depend on the client staying alive.
 *
 * Never throws — analytics must not break a request. Failures are logged only.
 */
export async function captureServerImmediate({ distinctId, event, properties }: ServerEvent): Promise<void> {
  try {
    const ph = getClient()
    ph.capture({ distinctId, event, properties })
    await ph.flush()
  } catch (err) {
    logger.warn('[posthog.server] capture failed', {
      event,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
