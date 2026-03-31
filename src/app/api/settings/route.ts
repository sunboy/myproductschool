import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const MOCK_SETTINGS = {
  id: 'settings-1',
  user_id: 'mock-user',
  notifications: {
    weekly_summary: true,
    streak_reminder: true,
    new_challenges: false,
    cohort_updates: true,
  },
  daily_goal_count: 3,
  preferred_role: 'SWE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export async function GET() {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json(MOCK_SETTINGS)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return defaults if no settings row yet
  if (!data) {
    return NextResponse.json({
      id: null,
      user_id: user.id,
      notifications: { weekly_summary: true, streak_reminder: true, new_challenges: true, cohort_updates: true },
      daily_goal_count: 3,
      preferred_role: null,
      created_at: null,
      updated_at: null,
    })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json(MOCK_SETTINGS)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['notifications', 'daily_goal_count', 'preferred_role']
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('user_settings')
    .upsert(
      { user_id: user.id, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
