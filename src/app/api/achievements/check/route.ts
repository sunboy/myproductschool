import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { checkAndGrantAchievements } from '@/lib/achievements/check'

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id } = body
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const adminClient = createAdminClient()
  const newAchievements = await checkAndGrantAchievements(user_id, adminClient)
  return NextResponse.json({ newly_unlocked: newAchievements })
}
