import { NextResponse } from 'next/server'
import { getAppFlag } from '@/lib/config/app-flags'

// Authenticated read of the small app_flags set client components need at
// runtime (currently just onboarding_value_first). Same shape as
// /api/billing/limits: short cache over a DB-backed config table so flipping
// a flag in app_flags takes effect within ~60s, no deploy.
export async function GET() {
  const onboardingValueFirst = await getAppFlag('onboarding_value_first', false)
  return NextResponse.json(
    { onboarding_value_first: onboardingValueFirst },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  )
}
