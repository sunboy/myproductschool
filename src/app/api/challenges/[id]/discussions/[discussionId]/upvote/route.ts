import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { discussionId } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')

  const adminClient = createAdminClient()

  // Fetch current upvoted_by
  const { data: discussion, error } = await adminClient
    .from('challenge_discussions')
    .select('upvote_count, upvoted_by')
    .eq('id', discussionId)
    .single()

  if (error || !discussion) {
    return apiError(404, 'discussion_not_found', 'Discussion not found')
  }

  const upvotedBy: string[] = discussion.upvoted_by ?? []
  const alreadyUpvoted = upvotedBy.includes(user.id)

  const newUpvotedBy = alreadyUpvoted
    ? upvotedBy.filter(id => id !== user.id)
    : [...upvotedBy, user.id]

  const newCount = alreadyUpvoted
    ? Math.max(0, (discussion.upvote_count ?? 0) - 1)
    : (discussion.upvote_count ?? 0) + 1

  const { error: updateError } = await adminClient
    .from('challenge_discussions')
    .update({ upvoted_by: newUpvotedBy, upvote_count: newCount })
    .eq('id', discussionId)

  if (updateError) {
    return apiError(500, 'discussion_upvote_failed', 'Failed to update upvote')
  }

  return NextResponse.json({ upvote_count: newCount, upvoted: !alreadyUpvoted })
}
