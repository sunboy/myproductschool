import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({
      user_plan: {
        id: 'up-1',
        user_id: 'mock-user',
        plan_id: 'plan-1',
        started_at: new Date().toISOString(),
        progress_pct: 0,
        is_active: true,
        completed_challenges: [],
      },
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: plan, error: planError } = await adminClient
    .from('study_plans')
    .select('id')
    .eq('slug', slug)
    .single()

  if (planError || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // Deactivate any current active plan
  await adminClient
    .from('user_study_plans')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true)

  const { data: userPlan, error } = await adminClient
    .from('user_study_plans')
    .upsert(
      {
        user_id: user.id,
        plan_id: plan.id,
        started_at: new Date().toISOString(),
        progress_pct: 0,
        is_active: true,
        completed_challenges: [],
      },
      { onConflict: 'user_id,plan_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ user_plan: userPlan })
}
