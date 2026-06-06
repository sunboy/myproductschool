// GET /api/cron/cc-spend-snapshot
//
// Manual / on-demand trigger for the CC Analytics spend sweep. The sweep ALSO runs
// automatically as part of /api/cron/cc-reap (piggybacked there to stay under the
// Vercel cron-count limit), so this route is NOT on a cron schedule — it exists for
// manual runs and debugging. Reads gateway /key/list spend, rolls per-user deltas
// into usage_events, fires alerts. Purely observational. Auth: CRON_SECRET.

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runSpendSnapshot } from '@/lib/sandbox/spend-snapshot'

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
  const result = await runSpendSnapshot(createAdminClient(), 45_000)
  return NextResponse.json(result)
}
