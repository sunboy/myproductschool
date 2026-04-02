import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

const XP_COST_RECOVER = 50

export async function POST(request: Request) {
  if (IS_MOCK) {
    const body = await request.json()
    return NextResponse.json({
      recovered: true,
      new_streak: 8,
      xp_spent: body.method === 'xp' ? XP_COST_RECOVER : undefined,
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { method } = body as { method: 'shield' | 'xp' }

  if (method !== 'shield' && method !== 'xp') {
    return NextResponse.json({ error: 'method must be "shield" or "xp"' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('streak_days, streak_shield_count, xp_total')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (method === 'shield') {
    if ((profile.streak_shield_count ?? 0) < 1) {
      return NextResponse.json({ error: 'No streak shields available' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('profiles')
      .update({
        streak_days: (profile.streak_days ?? 0) + 1,
        streak_shield_count: (profile.streak_shield_count ?? 0) - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ recovered: true, new_streak: (profile.streak_days ?? 0) + 1 })
  }

  // xp method
  if ((profile.xp_total ?? 0) < XP_COST_RECOVER) {
    return NextResponse.json({ error: 'Insufficient XP' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('profiles')
    .update({
      streak_days: (profile.streak_days ?? 0) + 1,
      xp_total: (profile.xp_total ?? 0) - XP_COST_RECOVER,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    recovered: true,
    new_streak: (profile.streak_days ?? 0) + 1,
    xp_spent: XP_COST_RECOVER,
  })
}
