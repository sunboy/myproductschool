import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import { runCareerOpsScan } from '@/lib/careerops/scan'

// Longer budget: a scan iterates many providers + bounded JSearch pages.
export const maxDuration = 300

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // No-op when discovery is off, so the cron can stay registered while dark.
  if (!isCareerOpsFeatureEnabled('discovery')) {
    return NextResponse.json({ skipped: true, reason: 'discovery_disabled' })
  }

  const admin = createAdminClient()
  const result = await runCareerOpsScan(admin)
  return NextResponse.json({ ok: true, ...result })
}
