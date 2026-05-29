import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth-helpers'
import { submitFeedbackTrade } from '@/lib/data/community'

export async function POST(request: Request) {
  const { user, error } = await requireAuth()
  if (error) return error

  const body = await request.json().catch(() => ({})) as {
    submission_id?: string
    one_sharp_thing?: string
    one_question?: string
    suggested_rewrite?: string
  }

  if (!body.submission_id || !body.one_sharp_thing?.trim() || !body.one_question?.trim()) {
    return NextResponse.json(
      { error: 'submission_id, one_sharp_thing, and one_question are required' },
      { status: 400 }
    )
  }

  try {
    const feedback = await submitFeedbackTrade({
      reviewerUserId: user.id,
      submissionId: body.submission_id,
      oneSharpThing: body.one_sharp_thing,
      oneQuestion: body.one_question,
      suggestedRewrite: body.suggested_rewrite,
    })
    return NextResponse.json(feedback, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit feedback'
    return NextResponse.json({ error: message }, { status: message.includes('own answer') ? 400 : 500 })
  }
}
