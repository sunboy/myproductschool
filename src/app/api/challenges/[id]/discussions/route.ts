import { NextRequest, NextResponse } from 'next/server'
import { getChallengeDiscussions, postDiscussion } from '@/lib/data/analytics'

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
  const body = await request.json()
  const { userId, content } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const resolvedUserId = userId ?? 'mock-user'

  try {
    const discussion = await postDiscussion(id, resolvedUserId, content.trim())
    return NextResponse.json(discussion, { status: 201 })
  } catch (err) {
    console.error('Discussion post error:', err)
    return NextResponse.json({ error: 'Failed to post discussion' }, { status: 500 })
  }
}
