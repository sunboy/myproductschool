import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth-helpers'
import { getWeeklyRoom } from '@/lib/data/community'

export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const room = await getWeeklyRoom(user.id)
    return NextResponse.json(room)
  } catch (err) {
    console.error('[community/weekly-room] failed', err)
    return NextResponse.json({ error: 'Failed to load weekly room' }, { status: 500 })
  }
}
