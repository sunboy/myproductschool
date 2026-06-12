import { NextResponse } from 'next/server'
import { getPublicPlanLimits } from '@/lib/usage/public-limits'

// Public, unauthenticated: these numbers appear verbatim on the pricing page.
// Served from a 60s in-memory cache over plan_limits, so edits made in
// /admin/paywall-config propagate to all copy within a minute.
export async function GET() {
  const limits = await getPublicPlanLimits()
  return NextResponse.json(limits, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  })
}
