import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrCreateAttemptShare } from '@/lib/share/attempt-scorecard'
import { SITE_URL } from '@/lib/seo/site'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (IS_MOCK) {
    return NextResponse.json({
      score: 84,
      challenge_title: 'Diagnose the Drop',
      move: 'frame',
      user_display_name: 'Alex K.',
      xp_earned: 240,
      percentile: 78,
      share_url: `${process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL}/workspace/challenges/mock/share/mock-share-token`,
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: attempt, error } = await adminClient
    .from('challenge_attempts')
    .select(`
      id,
      user_id,
      challenge_id,
      move_level_history(xp_delta)
    `)
    .eq('id', id)
    .single()

  if (error || !attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })

  if (attempt.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profile } = await adminClient
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const xpHistory = attempt.move_level_history as { xp_delta: number }[] | null
  const xpEarned = xpHistory?.reduce((sum, h) => sum + (h.xp_delta ?? 0), 0) ?? 0

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL
  const scorecard = await getOrCreateAttemptShare(adminClient, {
    attemptId: id,
    userId: user.id,
    challengeId: attempt.challenge_id as string,
  })

  if (!scorecard) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })

  return NextResponse.json({
    score: scorecard.scorePercent,
    challenge_title: scorecard.challengeTitle,
    move: scorecard.moveLevels[0]?.move ?? 'frame',
    user_display_name: profile?.display_name ?? 'Anonymous',
    xp_earned: xpEarned,
    percentile: scorecard.scorePercent ? Math.round(scorecard.scorePercent * 0.85) : 50,
    share_url: `${appUrl}/workspace/challenges/${attempt.challenge_id}/share/${scorecard.shareId}`,
  })
}
