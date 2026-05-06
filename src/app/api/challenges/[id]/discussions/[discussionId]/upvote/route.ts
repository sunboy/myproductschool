import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'

type ToggleDiscussionUpvoteResult = {
  upvote_count: number
  upvoted: boolean
}

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

  const { data, error } = await adminClient
    .rpc('toggle_discussion_upvote', {
      p_discussion_id: discussionId,
      p_challenge_id: identity.id,
      p_user_id: user.id,
    })
    .maybeSingle()

  if (error) {
    return apiError(500, 'discussion_upvote_failed', 'Failed to update upvote')
  }
  if (!data) {
    return apiError(404, 'discussion_not_found', 'Discussion not found')
  }

  const result = data as ToggleDiscussionUpvoteResult
  return NextResponse.json({
    upvote_count: result.upvote_count,
    upvoted: result.upvoted,
  })
}
