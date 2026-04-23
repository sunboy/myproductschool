import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json({
      plan: {
        slug: 'optimize-under-pressure',
        title: 'Optimize Under Pressure',
        move_tag: 'optimize',
        description: 'Real trade-offs under real constraints.',
      },
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_study_plan_enrollments')
    .select('plan_id, enrolled_at, study_plans(id, slug, title, move_tag, description)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ plan: null })

  const plan = (data as { study_plans: unknown }).study_plans
  return NextResponse.json({ plan })
}
