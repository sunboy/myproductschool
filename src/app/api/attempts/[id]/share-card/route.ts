import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({
      score: 84,
      challenge_title: 'Diagnose the Drop',
      move: 'frame',
      user_display_name: 'Alex K.',
      xp_earned: 240,
      percentile: 78,
      share_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hackproduct.io'}/challenges/${id}/share`,
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
      score,
      user_id,
      prompt_id,
      challenge_prompts(title, move_tags),
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

  const prompt = attempt.challenge_prompts as unknown as { title: string; move_tags: string[] } | null
  const xpHistory = attempt.move_level_history as { xp_delta: number }[] | null
  const xpEarned = xpHistory?.reduce((sum, h) => sum + (h.xp_delta ?? 0), 0) ?? 0

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hackproduct.io'

  return NextResponse.json({
    score: attempt.score ?? 0,
    challenge_title: prompt?.title ?? 'Challenge',
    move: prompt?.move_tags?.[0] ?? 'frame',
    user_display_name: profile?.display_name ?? 'Anonymous',
    xp_earned: xpEarned,
    percentile: attempt.score ? Math.round(attempt.score * 0.85) : 50,
    share_url: `${appUrl}/challenges/${id}/share`,
  })
}
