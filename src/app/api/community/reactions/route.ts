import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth-helpers'
import { toggleReaction } from '@/lib/data/community'
import type { CommunityReactionTarget, CommunityReactionType } from '@/lib/types'

const TARGETS = new Set<CommunityReactionTarget>(['discussion', 'community_submission', 'feedback_trade'])
const REACTIONS = new Set<CommunityReactionType>([
  'upvote',
  'strong_win',
  'interesting_miss',
  'metric_hawk',
  'tradeoff_catcher',
  'clarity_builder',
])

export async function POST(request: Request) {
  const { user, error } = await requireAuth()
  if (error) return error

  const body = await request.json().catch(() => ({})) as {
    target_type?: CommunityReactionTarget
    target_id?: string
    reaction_type?: CommunityReactionType
  }

  if (!body.target_type || !TARGETS.has(body.target_type) || !body.target_id || !body.reaction_type || !REACTIONS.has(body.reaction_type)) {
    return NextResponse.json({ error: 'Invalid reaction payload' }, { status: 400 })
  }

  try {
    const result = await toggleReaction({
      userId: user.id,
      targetType: body.target_type,
      targetId: body.target_id,
      reactionType: body.reaction_type,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save reaction'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
