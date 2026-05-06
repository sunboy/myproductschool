import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { sendDiscussionReplyEmail } from '@/lib/email/transactional'
import { createUnsubscribeToken } from '@/lib/notifications/unsubscribe'

const RequestSchema = z.object({
  content: z.string().trim().min(1).max(10000),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

function appUrl(request: NextRequest, path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
  return new URL(path, base).toString()
}

function hourlyDedupeKey(discussionId: string, userId: string) {
  const hour = new Date()
  hour.setMinutes(0, 0, 0)
  return `discussion_reply:${discussionId}:${userId}:${hour.toISOString()}`
}

async function maybeSendReplyNotification({
  adminClient,
  request,
  challengeId,
  discussionId,
  discussionOwnerId,
  replyAuthorId,
  replyContent,
}: {
  adminClient: ReturnType<typeof createAdminClient>
  request: NextRequest
  challengeId: string
  discussionId: string
  discussionOwnerId: string | null
  replyAuthorId: string
  replyContent: string
}) {
  if (!discussionOwnerId || discussionOwnerId === replyAuthorId) return

  const dedupeKey = hourlyDedupeKey(discussionId, discussionOwnerId)
  const [prefsResult, logResult, profilesResult, challengeResult] = await Promise.all([
    adminClient
      .from('notification_prefs')
      .select('discussion_reply')
      .eq('user_id', discussionOwnerId)
      .maybeSingle(),
    adminClient
      .from('notification_log')
      .select('id')
      .eq('kind', 'discussion_reply')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle(),
    adminClient
      .from('profiles')
      .select('id, display_name')
      .in('id', [discussionOwnerId, replyAuthorId]),
    adminClient
      .from('challenges')
      .select('title, slug')
      .eq('id', challengeId)
      .maybeSingle(),
  ])

  if (prefsResult.error || logResult.error || profilesResult.error || challengeResult.error) return
  if (prefsResult.data?.discussion_reply === false || logResult.data) return

  const profiles = new Map((profilesResult.data ?? []).map(profile => [profile.id, profile.display_name]))
  const token = createUnsubscribeToken({ userId: discussionOwnerId, preference: 'discussion_reply' })
  const challengePath = `/challenges/${challengeResult.data?.slug ?? challengeId}/discussion`
  const unsubscribeUrl = token ? appUrl(request, `/api/notifications/unsubscribe?token=${token}`) : null

  await sendDiscussionReplyEmail(adminClient, {
    dedupeKey,
    userId: discussionOwnerId,
    name: profiles.get(discussionOwnerId),
    challengeTitle: challengeResult.data?.title ?? 'New discussion reply',
    replyAuthor: profiles.get(replyAuthorId) ?? 'Someone',
    excerpt: replyContent,
    url: appUrl(request, challengePath),
    unsubscribeUrl,
  })

  const { data: emailEvent } = await adminClient
    .from('email_dedupes')
    .select('status')
    .eq('dedupe_key', dedupeKey)
    .maybeSingle()

  if (emailEvent?.status === 'sent') {
    await adminClient.from('notification_log').upsert({
      user_id: discussionOwnerId,
      kind: 'discussion_reply',
      channel: 'email',
      dedupe_key: dedupeKey,
      metadata: {
        challenge_id: challengeId,
        discussion_id: discussionId,
        reply_author_id: replyAuthorId,
      },
      sent_at: new Date().toISOString(),
    }, { onConflict: 'dedupe_key' })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { id, discussionId } = await params
  const adminClient = createAdminClient()

  const { data: discussion, error: discussionError } = await adminClient
    .from('challenge_discussions')
    .select('id, user_id, hidden_at')
    .eq('id', discussionId)
    .eq('challenge_id', id)
    .maybeSingle()

  if (discussionError) {
    return apiError(500, 'discussion_lookup_failed', 'Failed to load discussion')
  }
  if (!discussion) {
    return apiError(404, 'discussion_not_found', 'Discussion not found')
  }
  if (discussion.hidden_at) {
    return apiError(404, 'discussion_not_found', 'Discussion not found')
  }

  const { data, error } = await adminClient
    .from('discussion_replies')
    .select('*, profiles(display_name)')
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true })

  if (error) {
    return apiError(500, 'discussion_replies_fetch_failed', 'Failed to fetch replies')
  }

  const replies = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    display_name: (r.display_name as string | null) ?? null,
    username: (r.profiles as { display_name?: string } | null)?.display_name
      ?? (r.display_name as string | null)
      ?? 'Anonymous',
  }))

  return NextResponse.json(replies)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { id, discussionId } = await params
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
  const { content } = body

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')

  const adminClient = createAdminClient()

  const { data: discussion, error: discussionError } = await adminClient
    .from('challenge_discussions')
    .select('id, user_id, hidden_at')
    .eq('id', discussionId)
    .eq('challenge_id', id)
    .maybeSingle()

  if (discussionError) {
    return apiError(500, 'discussion_lookup_failed', 'Failed to load discussion')
  }
  if (!discussion) {
    return apiError(404, 'discussion_not_found', 'Discussion not found')
  }
  if (discussion.hidden_at) {
    return apiError(404, 'discussion_not_found', 'Discussion not found')
  }

  const { data, error } = await adminClient
    .from('discussion_replies')
    .insert({ discussion_id: discussionId, user_id: user.id, content: content.trim() })
    .select('*, profiles(display_name)')
    .single()

  if (error) {
    return apiError(500, 'discussion_reply_post_failed', 'Failed to post reply')
  }

  const reply = {
    ...data,
    username: (data.profiles as { display_name?: string } | null)?.display_name
      ?? (data.display_name as string | null)
      ?? 'Anonymous',
  }

  await maybeSendReplyNotification({
    adminClient,
    request,
    challengeId: id,
    discussionId,
    discussionOwnerId: discussion.user_id,
    replyAuthorId: user.id,
    replyContent: content.trim(),
  })

  return NextResponse.json(reply, { status: 201 })
}
