import { NextRequest, NextResponse } from 'next/server'
import { getUserAnalyticsSummary } from '@/lib/data/analytics'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  try {
    const summary = await getUserAnalyticsSummary(userId)
    return NextResponse.json(summary)
  } catch (err) {
    console.error('Analytics summary error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
