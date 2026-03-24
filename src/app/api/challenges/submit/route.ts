import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { challengeId, mode, response } = await req.json()

  if (!challengeId || !mode || !response?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json({ attemptId: 'mock' })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Check free tier daily limit
  const { data: profile } = await adminClient.from('profiles').select('plan').eq('id', user.id).single()
  if (profile?.plan !== 'pro') {
    const today = new Date().toISOString().split('T')[0]
    const { count } = await adminClient
      .from('challenge_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today)
    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Daily limit reached', upgrade_url: '/pricing' }, { status: 403 })
    }
  }

  const { data, error } = await supabase.from('challenge_attempts').insert({
    user_id: user.id,
    prompt_id: challengeId,
    mode,
    response_text: response,
    submitted_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })

  // Update streak (fire and forget)
  adminClient.rpc('update_user_streak', { p_user_id: user.id }).catch(() => {})

  // Trigger achievement check (fire and forget)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/achievements/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, event_type: 'challenge_count', event_value: 1 }),
  }).catch(() => {})

  return NextResponse.json({ attemptId: data.id })
}
