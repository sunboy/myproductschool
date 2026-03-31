import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { discussionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? 'mock-user'

  const adminClient = createAdminClient()

  // Fetch current upvoted_by
  const { data: discussion, error } = await adminClient
    .from('challenge_discussions')
    .select('upvote_count, upvoted_by')
    .eq('id', discussionId)
    .single()

  if (error || !discussion) {
    return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
  }

  const upvotedBy: string[] = discussion.upvoted_by ?? []
  const alreadyUpvoted = upvotedBy.includes(userId)

  const newUpvotedBy = alreadyUpvoted
    ? upvotedBy.filter(id => id !== userId)
    : [...upvotedBy, userId]

  const newCount = alreadyUpvoted
    ? Math.max(0, (discussion.upvote_count ?? 0) - 1)
    : (discussion.upvote_count ?? 0) + 1

  const { error: updateError } = await adminClient
    .from('challenge_discussions')
    .update({ upvoted_by: newUpvotedBy, upvote_count: newCount })
    .eq('id', discussionId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update upvote' }, { status: 500 })
  }

  return NextResponse.json({ upvote_count: newCount, upvoted: !alreadyUpvoted })
}
