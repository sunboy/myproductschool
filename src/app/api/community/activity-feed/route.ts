import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth-helpers'
import { getCommunityActivityFeed } from '@/lib/data/community'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const events = await getCommunityActivityFeed(12)
    return NextResponse.json({ events })
  } catch (err) {
    console.error('[community/activity-feed] failed', err)
    return NextResponse.json({ error: 'Failed to load activity feed' }, { status: 500 })
  }
}
