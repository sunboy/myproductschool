import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'
import { toggleReaction } from '@/lib/data/community'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { id, discussionId } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')

  const adminClient = createAdminClient()
  const identity = await resolveChallengeIdentity(id, adminClient)
  if (!identity) return apiError(404, 'challenge_not_found', 'Challenge not found')

  try {
    const { data: discussion, error: discussionError } = await adminClient
      .from('challenge_discussions')
      .select('id, hidden_at')
      .eq('id', discussionId)
      .eq('challenge_id', identity.id)
      .maybeSingle()

    if (discussionError) {
      return apiError(500, 'discussion_lookup_failed', 'Failed to load discussion')
    }
    if (!discussion || discussion.hidden_at) {
      return apiError(404, 'discussion_not_found', 'Discussion not found')
    }

    const result = await toggleReaction({
      userId: user.id,
      targetType: 'discussion',
      targetId: discussionId,
      reactionType: 'upvote',
    })

    return NextResponse.json({ upvote_count: result.count, upvoted: result.reacted })
  } catch (error) {
    console.error('[discussion/upvote] failed', error)
    return apiError(500, 'discussion_upvote_failed', 'Failed to update upvote')
  }
}
