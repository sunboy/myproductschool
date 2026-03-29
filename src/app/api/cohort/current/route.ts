import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({
      challenge: {
        id: 'cohort-1',
        title: 'Diagnose the Drop',
        prompt_text: 'Daily active users for a social app dropped 15% last Tuesday. Walk us through how you would diagnose this.',
        difficulty: 'intermediate',
        move_tag: 'frame',
        week_start: new Date().toISOString(),
        week_end: new Date(Date.now() + 7 * 86400000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      },
      submission: null,
      days_remaining: 4,
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: challenge, error: challengeError } = await adminClient
    .from('cohort_challenges')
    .select('*')
    .eq('is_active', true)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 500 })
  if (!challenge) return NextResponse.json({ challenge: null, submission: null, days_remaining: 0 })

  const { data: submission } = await adminClient
    .from('cohort_submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('cohort_challenge_id', challenge.id)
    .maybeSingle()

  const weekEnd = new Date(challenge.week_end)
  const daysRemaining = Math.max(0, Math.ceil((weekEnd.getTime() - Date.now()) / 86400000))

  return NextResponse.json({ challenge, submission: submission ?? null, days_remaining: daysRemaining })
}
