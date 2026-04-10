import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FlowMove } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

// 100 XP per level: ~10 quality challenge completions to advance one level
const XP_PER_LEVEL = 100

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

  const adminClient = createAdminClient()
  const moves = Object.keys(scores) as FlowMove[]

  const { data: currentLevels, error: fetchError } = await adminClient
    .from('move_levels')
    .select('*')
    .eq('user_id', userId)
    .in('move', moves)

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  const level_ups: FlowMove[] = []

  for (const move of moves) {
    const xpDelta = Math.round(scores[move]) // scores are already 0–10
    const current = (currentLevels ?? []).find((l: { move: string }) => l.move === move)
    if (!current) continue

    const newXp = current.xp + xpDelta
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1
    const newProgressPct = Math.round((newXp % XP_PER_LEVEL) / XP_PER_LEVEL * 100)

    if (newLevel > current.level) level_ups.push(move)

    await Promise.all([
      adminClient
        .from('move_levels')
        .update({ xp: newXp, level: newLevel, progress_pct: newProgressPct, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('move', move),
      adminClient
        .from('move_level_history')
        .insert({ user_id: userId, move, xp_delta: xpDelta, source: 'challenge', source_id: null }),
    ])
  }

  return NextResponse.json({ updated: true, level_ups })
}
