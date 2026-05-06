import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { getChallengeDiscussions, postDiscussion } from '@/lib/data/analytics'
import { createClient } from '@/lib/supabase/server'
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  try {
    const discussions = await getChallengeDiscussions(id, user?.id ?? null)
    return NextResponse.json(discussions)
  } catch (err) {
    console.error('Discussions fetch error:', err)
    return apiError(500, 'discussion_fetch_failed', 'Failed to fetch discussions')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  try {
    const discussion = await postDiscussion(id, user.id, content.trim())
    return NextResponse.json(discussion, { status: 201 })
  } catch (err) {
    console.error('Discussion post error:', err)
    return apiError(500, 'discussion_post_failed', 'Failed to post discussion')
  }
}
