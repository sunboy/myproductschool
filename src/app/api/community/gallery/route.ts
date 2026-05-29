import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth-helpers'
import { getCommunityGallery } from '@/lib/data/community'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  const challengeId = request.nextUrl.searchParams.get('challenge_id')
  const attemptId = request.nextUrl.searchParams.get('attempt_id')

  if (!challengeId) {
    return NextResponse.json({ error: 'challenge_id is required' }, { status: 400 })
  }

  try {
    const gallery = await getCommunityGallery({
      userId: user.id,
      challengeId,
      attemptId,
    })
    return NextResponse.json(gallery)
  } catch (err) {
    console.error('[community/gallery] failed', err)
    return NextResponse.json({ error: 'Failed to load community gallery' }, { status: 500 })
  }
}
