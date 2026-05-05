import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { getUsageForUser } from '@/lib/usage/check-limit'

export async function GET() {
  // Mock mode: return a stub profile so the shell doesn't redirect to /login
  if (IS_MOCK) {
    return NextResponse.json({
      id: 'mock-user',
      display_name: 'Mock User',
      email: 'mock@hackproduct.local',
      avatar_url: null,
      plan: 'pro',
      role: 'SWE',
      preferred_role: 'SWE',
      streak_days: 0,
      xp_total: 0,
      onboarding_completed_at: new Date().toISOString(),
      archetype: null,
      archetype_description: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subscription: null,
      usage: {
        challenges: { used: 0, limit: 80, windowDays: 30, unit: 'count' },
        interviews: { used: 0, limit: 12, windowDays: 30, unit: 'count' },
        hatchAiCents: { used: 0, limit: 450, windowDays: 30, unit: 'cents' },
      },
      daily_limit: null,
      daily_attempts_today: 0,
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const [profileResult, subscriptionResult, attemptsResult] = await Promise.all([
    adminClient.from('profiles').select('id, display_name, avatar_url, plan, role, preferred_role, streak_days, xp_total, onboarding_completed_at, archetype, archetype_description, created_at, updated_at').eq('id', user.id).single(),
    adminClient
      .from('subscriptions')
      .select('plan, status, current_period_end, billing_interval, stripe_price_id, cancel_at_period_end, cancel_at, canceled_at')
      .eq('user_id', user.id)
      .maybeSingle(),
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
  const usage = await getUsageForUser(user.id, profileResult.data.role === 'admin' ? 'pro' : plan)

  return NextResponse.json({
    ...profileResult.data,
    email: user.email,
    subscription: subscriptionResult.data,
    usage,
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
