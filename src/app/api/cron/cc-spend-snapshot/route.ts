// GET /api/cron/cc-spend-snapshot
//
// Backstop spend observability for Claude Code Analytics. Reads per-session Claude
// spend from the LiteLLM gateway (/key/list — which retains a key's spend past its
// TTL) and rolls any increase into each user's rolling-30d cc_claude_spend_cents
// total, then fires spend alerts. This catches spend that the teardown-time record
// missed (e.g. a session still running, or a teardown that errored), and keeps the
// admin spend view fresh for sessions in flight.
//
// Purely observational — never blocks or mutates sessions. Auth: CRON_SECRET.

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAllSessionKeySpendCents } from '@/lib/sandbox/llm-gateway'
import { recordSessionSpend } from '@/lib/sandbox/record-spend'
import { alertUserSpend, alertSessionRunaway } from '@/lib/sandbox/spend-alerts'
import { getUsedQuantity } from '@/lib/usage/check-limit'
import { isBetaOrAdminCohort } from '@/lib/sandbox/spend-cohort'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // 1. Bulk spend snapshot from the gateway: sessionId -> spentCents.
  const spendMap = await getAllSessionKeySpendCents()
  if (!spendMap || spendMap.size === 0) {
    return NextResponse.json({ scanned: 0, recorded: 0, note: spendMap ? 'no cc keys' : 'gateway unavailable' })
  }

  // 2. Resolve sessionId -> user_id for the sessions we have spend for. (Keys can
  //    outlive their session row only if the row was hard-deleted, which we don't
  //    do; unknown sessionIds are skipped.)
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
  // Keys with no resolvable session row (hard-deleted row, or a non-cc alias that
  // slipped the prefix filter). Tracked so a silent drift is visible.
  const unresolvedKeys = sessionIds.length - userBySession.size

  let recorded = 0
  let alerted = 0
  const usersTouched = new Set<string>()
  const start = Date.now()
  const BUDGET_MS = 45_000

  for (const [sessionId, spentCents] of spendMap) {
    if (Date.now() - start > BUDGET_MS) break // leave room under maxDuration
    const userId = userBySession.get(sessionId)
    if (!userId || spentCents <= 0) continue

    // Roll the delta into the user's 30-day total (idempotent / concurrency-safe).
    // Pass the already-observed spend from the bulk /key/list so record-spend does
    // NOT make a second per-session gateway call (avoids N+1 as keys accumulate).
    const { deltaCents } = await recordSessionSpend(admin, userId, sessionId, spentCents)
    if (deltaCents > 0) recorded++
    usersTouched.add(userId)

    // Runaway check per session (cheap, uses the observed snapshot value).
    await alertSessionRunaway({ userId, sessionId, spentCents }).catch(() => {})
  }

  // 3. Per-user threshold alerts, based on the freshly-updated rolling sum.
  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  for (const userId of usersTouched) {
    if (Date.now() - start > BUDGET_MS + 10_000) break
    try {
      const spent = await getUsedQuantity(userId, 'cc_claude_spend_cents', windowStart)
      const cohort = await isBetaOrAdminCohort(admin, userId)
      await alertUserSpend({ userId, spentCents: spent, cohort })
      alerted++
    } catch (err) {
      console.error('[cc-spend-snapshot] alert failed for', userId, err)
    }
  }

  return NextResponse.json({
    scanned: spendMap.size,
    resolved_users: usersTouched.size,
    unresolved_keys: unresolvedKeys,
    lookup_errors: lookupErrors,
    recorded,
    alerted,
  })
}
