import type { createAdminClient } from '@/lib/supabase/admin'

const PROCESSING_LEASE_SECONDS = 120

type AdminClient = ReturnType<typeof createAdminClient>
type DbError = {
  code?: string
  message: string
}

export class StripeWebhookProcessingError extends Error {
  constructor(
    message: string,
    readonly operation: string,
    readonly code?: string
  ) {
    super(message)
    this.name = 'StripeWebhookProcessingError'
  }
}

export function requireStripeDbResult<T>(
  operation: string,
  result: { data: T; error: DbError | null }
): T {
  if (result.error) {
    throw new StripeWebhookProcessingError(
      `${operation}: ${result.error.message}`,
      operation,
      result.error.code
    )
  }
  return result.data
}

export type StripeEventClaim =
  | { status: 'claimed'; token: string }
  | { status: 'processed' }
  | { status: 'in_progress' }

function parseClaim(value: unknown): StripeEventClaim {
  if (!value || typeof value !== 'object') {
    throw new StripeWebhookProcessingError(
      `stripe event claim returned an invalid value: ${String(value)}`,
      'claim_stripe_event'
    )
  }

  const claim = value as { status?: unknown; token?: unknown }
  if (claim.status === 'processed' || claim.status === 'in_progress') {
    return { status: claim.status }
  }
  if (claim.status === 'claimed' && typeof claim.token === 'string' && claim.token) {
    return { status: 'claimed', token: claim.token }
  }

  throw new StripeWebhookProcessingError(
    'stripe event claim returned an invalid state',
    'claim_stripe_event'
  )
}

export async function claimStripeEvent(
  admin: AdminClient,
  event: { id: string; type: string; payload: Record<string, unknown> }
) {
  const data = requireStripeDbResult(
    'claim_stripe_event',
    await admin.rpc('claim_stripe_event', {
      p_event_id: event.id,
      p_event_type: event.type,
      p_payload: event.payload,
      p_lease_seconds: PROCESSING_LEASE_SECONDS,
    })
  )
  return parseClaim(data)
}

export async function completeStripeEvent(
  admin: AdminClient,
  eventId: string,
  processingToken: string
) {
  requireStripeDbResult(
    'complete_stripe_event',
    await admin.rpc('complete_stripe_event', {
      p_event_id: eventId,
      p_processing_token: processingToken,
    })
  )
}

export async function releaseStripeEvent(
  admin: AdminClient,
  eventId: string,
  processingToken: string,
  error: unknown
) {
  const message = error instanceof Error ? error.message : String(error)
  const released = requireStripeDbResult(
    'release_stripe_event',
    await admin.rpc('release_stripe_event', {
      p_event_id: eventId,
      p_processing_token: processingToken,
      p_error: message,
    })
  )
  if (released !== true) {
    throw new StripeWebhookProcessingError(
      'release_stripe_event: processing lease is no longer owned',
      'release_stripe_event'
    )
  }
}

export async function recordStripePaymentFailure(
  admin: AdminClient,
  input: {
    eventId: string
    processingToken: string
    userId: string
    failedAt: string
  }
) {
  return requireStripeDbResult(
    'record_stripe_payment_failure',
    await admin.rpc('record_stripe_payment_failure', {
      p_event_id: input.eventId,
      p_processing_token: input.processingToken,
      p_user_id: input.userId,
      p_failed_at: input.failedAt,
    })
  )
}
