import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const [profileResult, subscriptionResult, attemptsResult] = await Promise.all([
    adminClient.from('profiles').select('id, display_name, avatar_url, plan, role, streak_days, xp_total, onboarding_completed_at, created_at, updated_at').eq('id', user.id).single(),
    adminClient.from('subscriptions').select('plan, status, current_period_end').eq('user_id', user.id).maybeSingle(),
    adminClient
      .from('challenge_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date().toISOString().split('T')[0]),
  ])

  if (profileResult.error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const plan = profileResult.data.plan || 'free'
  const dailyLimit = plan === 'pro' ? null : 3
  const dailyAttemptsToday = attemptsResult.count ?? 0

  return NextResponse.json({
    ...profileResult.data,
    subscription: subscriptionResult.data,
    daily_attempts_today: dailyAttemptsToday,
    daily_limit: dailyLimit,
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['display_name', 'avatar_url']
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.from('profiles').update(updates).eq('id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
