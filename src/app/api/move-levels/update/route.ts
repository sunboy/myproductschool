import { NextRequest, NextResponse } from 'next/server'
import type { FlowMove } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'
import { applyMoveLevelXp } from '@/lib/data/move-levels-update'

interface UpdateBody {
  userId: string
  scores: Record<FlowMove, number>
}

export async function POST(req: NextRequest) {
  if (IS_MOCK) {
    return NextResponse.json({ updated: true, level_ups: [] })
  }

  const body: UpdateBody = await req.json()
  const { userId, scores } = body

  if (!userId || !scores) {
    return NextResponse.json({ error: 'Missing userId or scores' }, { status: 400 })
  }

  await applyMoveLevelXp(userId, scores, 'challenge')

  return NextResponse.json({ updated: true, level_ups: [] })
}
