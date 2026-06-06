// lib/sandbox/spend-snapshot.ts — server-side only.
//
// The bulk CC Analytics spend sweep: read every per-session key's spend from the
// LiteLLM gateway (/key/list, which retains spend past key TTL), roll any increase
// into each user's rolling-30d cc_claude_spend_cents total, and fire spend alerts.
// Extracted into a function so it can run from the cc-reap cron (piggybacked — we
// stay under the Vercel cron-count limit) AND from the standalone manual route.
// Purely observational — never blocks or mutates sessions.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getAllSessionKeySpendCents } from './llm-gateway'
import { recordSessionSpend } from './record-spend'
import { alertUserSpend, alertSessionRunaway } from './spend-alerts'
import { getUsedQuantity } from '@/lib/usage/check-limit'
import { isBetaOrAdminCohort } from './spend-cohort'

export interface SpendSnapshotResult {
  scanned: number
  resolvedUsers: number
  unresolvedKeys: number
  lookupErrors: number
  recorded: number
  alerted: number
  note?: string
}

export async function runSpendSnapshot(
  admin: SupabaseClient,
  budgetMs = 30_000,
): Promise<SpendSnapshotResult> {
  const empty = (note: string): SpendSnapshotResult => ({
    scanned: 0, resolvedUsers: 0, unresolvedKeys: 0, lookupErrors: 0, recorded: 0, alerted: 0, note,
  })

  // 1. Bulk spend snapshot from the gateway: sessionId -> spentCents.
  const spendMap = await getAllSessionKeySpendCents()
  if (!spendMap || spendMap.size === 0) {
    return empty(spendMap ? 'no cc keys' : 'gateway unavailable')
  }

  // 2. Resolve sessionId -> user_id (batched; logs errors instead of failing open).
  const sessionIds = [...spendMap.keys()]
  const userBySession = new Map<string, string>()
  const BATCH = 100
  let lookupErrors = 0
  for (let i = 0; i < sessionIds.length; i += BATCH) {
    const batch = sessionIds.slice(i, i + BATCH)
    const { data, error } = await admin
      .from('claude_code_sessions')
      .select('id, user_id')
      .in('id', batch)
    if (error) {
      lookupErrors++
      console.error('[cc-spend-snapshot] session lookup batch failed:', error.message)
      continue
    }
    for (const r of data ?? []) {
      if (r.user_id) userBySession.set(r.id as string, r.user_id as string)
    }
  }
  const unresolvedKeys = sessionIds.length - userBySession.size

  let recorded = 0
  let alerted = 0
  const usersTouched = new Set<string>()
  const start = Date.now()

  for (const [sessionId, spentCents] of spendMap) {
    if (Date.now() - start > budgetMs) break
    const userId = userBySession.get(sessionId)
    if (!userId || spentCents <= 0) continue

    // Idempotent / concurrency-safe; pass observed spend to avoid an N+1 gateway call.
    const { deltaCents } = await recordSessionSpend(admin, userId, sessionId, spentCents)
    if (deltaCents > 0) recorded++
    usersTouched.add(userId)

    await alertSessionRunaway({ userId, sessionId, spentCents }).catch(() => {})
  }

  // 3. Per-user threshold alerts on the freshly-updated rolling sum.
  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  for (const userId of usersTouched) {
    if (Date.now() - start > budgetMs + 10_000) break
    try {
      const spent = await getUsedQuantity(userId, 'cc_claude_spend_cents', windowStart)
      const cohort = await isBetaOrAdminCohort(admin, userId)
      await alertUserSpend({ userId, spentCents: spent, cohort })
      alerted++
    } catch (err) {
      console.error('[cc-spend-snapshot] alert failed for', userId, err)
    }
  }

  return {
    scanned: spendMap.size,
    resolvedUsers: usersTouched.size,
    unresolvedKeys,
    lookupErrors,
    recorded,
    alerted,
  }
}
