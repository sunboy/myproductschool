import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FlowMove } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'
import { computeNextChallenge } from './logic'

const MOCK_NEXT = {
  challenge: {
    id: 'mock-c1',
    slug: 'improve-retention-for-a-b2c-app',
    title: 'Improve Retention for a B2C App',
    prompt_text: 'Your B2C app has seen a 20% drop in 30-day retention. Diagnose the problem and propose a fix.',
    difficulty: 'intermediate',
    domain: { slug: 'retention', title: 'Retention', icon: 'trending_up' },
    move_tags: ['frame', 'list'],
  },
  reason: 'Targets your weakest move: Frame',
  targets_move: 'frame' as FlowMove,
  recommendation_type: 'weakest_move',
  hatch_insight: 'Your List move is at Level 1. This challenge focuses on that skill.',
}

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json(MOCK_NEXT)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await computeNextChallenge(user.id)
  if (!result) return NextResponse.json({ error: 'No challenges available' }, { status: 404 })

  return NextResponse.json(result)
}
