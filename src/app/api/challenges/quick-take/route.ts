import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FlowMove } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const MOCK_QUICK_TAKE = {
  id: 'mock-qt-1',
  prompt_text: "Your PM says DAU dropped 15% overnight. Walk me through how you would diagnose this.",
  move: 'frame' as FlowMove,
  time_limit_seconds: 90,
}

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json(MOCK_QUICK_TAKE)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Find weakest move for this user
  const { data: levels } = await adminClient
    .from('move_levels')
    .select('move, xp')
    .eq('user_id', user.id)
    .order('xp', { ascending: true })
    .limit(1)

  const weakestMove: FlowMove = (levels?.[0]?.move as FlowMove) ?? 'frame'

  // Try to get today's quick take first, then fall back to weakest move targeting
  const today = new Date().toISOString().split('T')[0]
  const { data: todayPrompt } = await adminClient
    .from('quick_take_prompts')
    .select('id, prompt_text, move')
    .gte('created_at', today)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()

  if (todayPrompt) {
    return NextResponse.json({ ...todayPrompt, time_limit_seconds: 90 })
  }

  // Fall back to a random prompt targeting weakest move
  const { data: prompt } = await adminClient
    .from('quick_take_prompts')
    .select('id, prompt_text, move')
    .eq('move', weakestMove)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()

  if (!prompt) {
    return NextResponse.json({ error: 'No quick take available' }, { status: 404 })
  }

  return NextResponse.json({ ...prompt, time_limit_seconds: 90 })
}
