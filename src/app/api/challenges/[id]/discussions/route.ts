import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { getChallengeDiscussions, postDiscussion } from '@/lib/data/analytics'
import { createClient } from '@/lib/supabase/server'

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
  try {
    const discussions = await getChallengeDiscussions(id)
    return NextResponse.json(discussions)
  } catch (err) {
    console.error('Discussions fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 })
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
  const resolvedUserId = user?.id ?? 'mock-user'

  try {
    const discussion = await postDiscussion(id, resolvedUserId, content.trim())
    return NextResponse.json(discussion, { status: 201 })
  } catch (err) {
    console.error('Discussion post error:', err)
    return NextResponse.json({ error: 'Failed to post discussion' }, { status: 500 })
  }
}
