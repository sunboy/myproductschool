import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({
      rankings: [
        { rank: 1, user_id: 'u1', display_name: 'Alex K.', score: 94, xp_earned: 320 },
        { rank: 2, user_id: 'u2', display_name: 'Jordan M.', score: 88, xp_earned: 280 },
        { rank: 3, user_id: 'mock-user', display_name: 'You', score: 82, xp_earned: 240 },
        { rank: 4, user_id: 'u4', display_name: 'Sam P.', score: 76, xp_earned: 200 },
      ],
      user_rank: 3,
      user_percentile: 72,
      total_participants: 48,
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Get active cohort challenge
  const { data: challenge } = await adminClient
    .from('cohort_challenges')
    .select('id')
    .eq('is_active', true)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!challenge) {
    return NextResponse.json({ rankings: [], user_rank: null, user_percentile: null, total_participants: 0 })
  }

  const { data: submissions, error } = await adminClient
    .from('cohort_submissions')
    .select('user_id, score, profiles(display_name)')
    .eq('cohort_challenge_id', challenge.id)
    .not('score', 'is', null)
    .order('score', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const totalParticipants = submissions?.length ?? 0
  const rankings = (submissions ?? []).map((s, i) => ({
    rank: i + 1,
    user_id: s.user_id,
    display_name: (s.profiles as unknown as { display_name: string } | null)?.display_name ?? 'Anonymous',
    score: s.score,
  }))

  const userRankEntry = rankings.find(r => r.user_id === user.id)
  const userRank = userRankEntry?.rank ?? null
  const userPercentile = userRank && totalParticipants > 0
    ? Math.round((1 - (userRank - 1) / totalParticipants) * 100)
    : null

  return NextResponse.json({ rankings, user_rank: userRank, user_percentile: userPercentile, total_participants: totalParticipants })
}
