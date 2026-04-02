import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { MoveLevel, FlowMove } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const FLOW_MOVES: FlowMove[] = ['frame', 'list', 'weigh', 'sell']

const MOCK_MOVES: MoveLevel[] = FLOW_MOVES.map((move, i) => ({
  id: `mock-${move}`,
  user_id: 'mock-user',
  move,
  level: i + 1,
  progress_pct: 25 * (i + 1),
  xp: 100 * (i + 1),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}))

async function initializeMoveLevels(userId: string, adminClient: ReturnType<typeof createAdminClient>): Promise<MoveLevel[]> {
  const rows = FLOW_MOVES.map(move => ({
    user_id: userId,
    move,
    level: 1,
    progress_pct: 0,
    xp: 0,
  }))
  const { data, error } = await adminClient.from('move_levels').insert(rows).select()
  if (error) throw error
  return data as MoveLevel[]
}

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json({ moves: MOCK_MOVES })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  let { data, error } = await adminClient
    .from('move_levels')
    .select('*')
    .eq('user_id', user.id)
    .order('move')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data || data.length === 0) {
    try {
      data = await initializeMoveLevels(user.id, adminClient)
    } catch (initError) {
      console.error('Failed to initialize move levels:', initError)
      return NextResponse.json({ error: 'Failed to initialize move levels' }, { status: 500 })
    }
  }

  return NextResponse.json({ moves: data as MoveLevel[] })
}
