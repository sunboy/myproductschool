import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'

const RequestSchema = z.object({
  content: z.string().trim().min(1).max(10000),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  const { id, discussionId } = await params
  const adminClient = createAdminClient()

  const { data: discussion, error: discussionError } = await adminClient
    .from('challenge_discussions')
    .select('id')
    .eq('id', discussionId)
    .eq('challenge_id', id)
    .maybeSingle()

  if (discussionError) {
    return apiError(500, 'discussion_lookup_failed', 'Failed to load discussion')
  }
  if (!discussion) {
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
    .select('id')
    .eq('id', discussionId)
    .eq('challenge_id', id)
    .maybeSingle()

  if (discussionError) {
    return apiError(500, 'discussion_lookup_failed', 'Failed to load discussion')
  }
  if (!discussion) {
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

  return NextResponse.json(reply, { status: 201 })
}
