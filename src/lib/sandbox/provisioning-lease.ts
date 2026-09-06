import type { createAdminClient } from '@/lib/supabase/admin'

// Matches the existing SQL liveness grace. A cold provisioning request/poll has
// five minutes to become active before abandoned infrastructure is reclaimed.
export const PROVISIONING_LEASE_MS = 5 * 60 * 1000

/** A retry replaces the old session row, including its expired lease clock. */
export function freshProvisioningState(sessionId: string, now = new Date()) {
  return {
    id: sessionId,
    status: 'provisioning' as const,
    created_at: now.toISOString(),
    host_instance_id: null,
    wss_url: null,
    ended_at: null,
  }
}

export function provisioningLeaseCutoff(now: Date): string {
  return new Date(now.getTime() - PROVISIONING_LEASE_MS).toISOString()
}

/** Atomically claim expired starts before deleting any revision. Activation uses
 * the same status=provisioning predicate, so whichever transition wins protects
 * an already-active session from this cleanup. Failed teardown remains visible
 * to the orphan reconciliation sweep on this and subsequent cron runs.
 */
export async function claimExpiredProvisioning(
  admin: ReturnType<typeof createAdminClient>,
  now: Date,
) {
  const { data, error } = await admin
    .from('claude_code_sessions')
    .update({ status: 'failed', ended_at: now.toISOString() })
    .eq('status', 'provisioning')
    .lt('created_at', provisioningLeaseCutoff(now))
    .select('id, user_id, host_instance_id')
  if (error) throw new Error(`Could not claim expired provisioning: ${error.message}`)
  return data ?? []
}

/** Returns whether this worker won activation. Cleanup may already have claimed
 * the row; callers must not return a live URL or meter usage after losing CAS.
 */
export async function activateProvisioning(admin: ReturnType<typeof createAdminClient>, sessionId: string): Promise<boolean> {
  const { data, error } = await admin
    .from('claude_code_sessions')
    .update({ status: 'active', started_at: new Date().toISOString(), provision_phase: 'ready' })
    .eq('id', sessionId)
    .eq('status', 'provisioning')
    .select('id')
  if (error) throw new Error(`Could not activate provisioning: ${error.message}`)
  return Boolean(data?.length)
}

/** Unknown liveness is not proof of idleness: preserve the gateway on DB errors. */
export function canStopGatewaySql(activeCount: number | null, freshProvisioning: number | null): boolean {
  return activeCount === 0 && freshProvisioning === 0
}
