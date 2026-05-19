import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-helpers'
import { curateCommunitySubmission } from '@/lib/data/community'
import type { CommunityLensTag } from '@/lib/types'

export async function POST(request: Request) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const body = await request.json().catch(() => ({})) as {
    submission_id?: string
    action?: 'feature' | 'hide' | 'publish' | 'retag'
    lens_tag?: CommunityLensTag
    hatch_summary?: string | null
  }

  if (!body.submission_id || !body.action) {
    return NextResponse.json({ error: 'submission_id and action are required' }, { status: 400 })
  }

  try {
    const submission = await curateCommunitySubmission({
      adminUserId: user.id,
      submissionId: body.submission_id,
      action: body.action,
      lensTag: body.lens_tag,
      hatchSummary: body.hatch_summary,
    })
    return NextResponse.json(submission)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to curate submission'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
