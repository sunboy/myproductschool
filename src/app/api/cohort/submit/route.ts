import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

export async function POST(request: Request) {
  if (IS_MOCK) {
    return NextResponse.json({ submission_id: 'mock-sub-1', score: 78 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { cohort_challenge_id, response_text } = body

  if (!cohort_challenge_id || !response_text) {
    return NextResponse.json({ error: 'cohort_challenge_id and response_text are required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Verify challenge is still active
  const { data: challenge } = await adminClient
    .from('cohort_challenges')
    .select('id, is_active')
    .eq('id', cohort_challenge_id)
    .single()

  if (!challenge?.is_active) {
    return NextResponse.json({ error: 'Challenge is no longer active' }, { status: 400 })
  }

  const { data: submission, error } = await adminClient
    .from('cohort_submissions')
    .upsert(
      {
        user_id: user.id,
        cohort_challenge_id,
        response_text,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,cohort_challenge_id' }
    )
    .select('id, score')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ submission_id: submission.id, score: submission.score })
}
