import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'

const RequestSchema = z.object({
  content: z.string().trim().min(1).max(10000),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

async function getDiscussionForMutation(
  adminClient: ReturnType<typeof createAdminClient>,
  challengeId: string,
  discussionId: string
) {
  return adminClient
    .from('challenge_discussions')
    .select('id, user_id, hidden_at')
    .eq('id', discussionId)
    .eq('challenge_id', challengeId)
    .maybeSingle()
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { id, discussionId } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const adminClient = createAdminClient()
  const identity = await resolveChallengeIdentity(id, adminClient)
  if (!identity) return apiError(404, 'challenge_not_found', 'Challenge not found')

  const { data: discussion, error: lookupError } = await getDiscussionForMutation(
    adminClient,
    identity.id,
    discussionId
  )

  if (lookupError) {
    return apiError(500, 'discussion_lookup_failed', 'Failed to load discussion')
  }
  if (!discussion || discussion.hidden_at) {
    return apiError(404, 'discussion_not_found', 'Discussion not found')
  }
  if (discussion.user_id !== user.id) {
    return apiError(403, 'discussion_forbidden', 'You can only edit your own discussion.')
  }

  const { data, error } = await adminClient
    .from('challenge_discussions')
    .update({ content: body.content.trim(), updated_at: new Date().toISOString() })
    .eq('id', discussionId)
    .eq('challenge_id', identity.id)
    .select('*, profiles!challenge_discussions_user_id_fkey(display_name)')
    .single()

  if (error) {
    return apiError(500, 'discussion_update_failed', 'Failed to update discussion')
  }

  return NextResponse.json({
    ...data,
    username: (data.profiles as { display_name?: string } | null)?.display_name
      ?? (data.display_name as string | null)
      ?? 'Anonymous',
  })
}

export async function DELETE(
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

  const { data: discussion, error: lookupError } = await getDiscussionForMutation(
    adminClient,
    identity.id,
    discussionId
  )

  if (lookupError) {
    return apiError(500, 'discussion_lookup_failed', 'Failed to load discussion')
  }
  if (!discussion || discussion.hidden_at) {
    return apiError(404, 'discussion_not_found', 'Discussion not found')
  }
  if (discussion.user_id !== user.id) {
    return apiError(403, 'discussion_forbidden', 'You can only delete your own discussion.')
  }

  const { error } = await adminClient
    .from('challenge_discussions')
    .delete()
    .eq('id', discussionId)
    .eq('challenge_id', identity.id)

  if (error) {
    return apiError(500, 'discussion_delete_failed', 'Failed to delete discussion')
  }

  return NextResponse.json({ ok: true })
}
