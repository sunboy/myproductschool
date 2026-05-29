import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth-helpers'
import { publishCommunitySubmission } from '@/lib/data/community'
import type { CommunityDisplayMode } from '@/lib/types'

export async function POST(request: Request) {
  const { user, error } = await requireAuth()
  if (error) return error

  const body = await request.json().catch(() => ({})) as {
    attempt_id?: string
    display_mode?: CommunityDisplayMode
  }

  if (!body.attempt_id) {
    return NextResponse.json({ error: 'attempt_id is required' }, { status: 400 })
  }

  const displayMode = body.display_mode === 'named' ? 'named' : 'anonymous'

  try {
    const submission = await publishCommunitySubmission({
      userId: user.id,
      attemptId: body.attempt_id,
      displayMode,
    })
    return NextResponse.json(submission, { status: 201 })
  } catch (err) {
    console.error('[community/submissions] failed', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to publish submission' }, { status: 500 })
  }
}
