import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FlowMove, MoveLevel, MoveLevelHistory } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const VALID_MOVES: FlowMove[] = ['frame', 'list', 'weigh', 'sell']

const XP_PER_LEVEL = 500

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ move: string }> }
) {
  const { move } = await params

  if (!VALID_MOVES.includes(move as FlowMove)) {
    return NextResponse.json({ error: 'Invalid move. Must be one of: frame, list, weigh, sell' }, { status: 400 })
  }

  if (IS_MOCK) {
    return NextResponse.json({
      move: move as FlowMove,
      level: 2,
      progress_pct: 60,
      xp: 300,
      xp_to_next: 200,
      history: [
        { id: 'mock-h1', user_id: 'mock', move, xp_delta: 50, source: 'challenge', source_id: null, created_at: new Date().toISOString() },
        { id: 'mock-h2', user_id: 'mock', move, xp_delta: 25, source: 'quick-take', source_id: null, created_at: new Date().toISOString() },
      ],
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const [levelResult, historyResult] = await Promise.all([
    adminClient.from('move_levels').select('*').eq('user_id', user.id).eq('move', move).single(),
    adminClient.from('move_level_history').select('*').eq('user_id', user.id).eq('move', move).order('created_at', { ascending: false }).limit(20),
  ])

  if (levelResult.error || !levelResult.data) {
    return NextResponse.json({ error: 'Move level not found' }, { status: 404 })
  }

  const ml = levelResult.data as MoveLevel
  const xp_to_next = XP_PER_LEVEL - (ml.xp % XP_PER_LEVEL)

  return NextResponse.json({
    move: ml.move,
    level: ml.level,
    progress_pct: ml.progress_pct,
    xp: ml.xp,
    xp_to_next,
    history: (historyResult.data ?? []) as MoveLevelHistory[],
  })
}
