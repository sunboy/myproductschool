import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  { params }: { params: Promise<{ discussionId: string }> }
) {
  const { discussionId } = await params
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('discussion_replies')
    .select('*, profiles(username)')
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
  }

  const replies = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    display_name: (r.display_name as string | null) ?? null,
    username: (r.profiles as { username?: string } | null)?.username
      ?? (r.display_name as string | null)
      ?? 'Anonymous',
  }))

  return NextResponse.json(replies)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  const { discussionId } = await params
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { content } = body

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? 'mock-user'

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('discussion_replies')
    .insert({ discussion_id: discussionId, user_id: userId, content: content.trim() })
    .select('*, profiles(username)')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 })
  }

  const reply = {
    ...data,
    username: (data.profiles as { username?: string } | null)?.username ?? 'Anonymous',
  }

  return NextResponse.json(reply, { status: 201 })
}
