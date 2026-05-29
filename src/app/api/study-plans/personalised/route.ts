import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  if (IS_MOCK) {
    // The 4 move-shell plans (frame-like-a-pm / the-list-move /
    // optimize-under-pressure / win-the-room) were retired in Phase 5.
    // Mock mode now returns null, consistent with the live "no enrollment"
    // case. The dashboard's "next challenge" card uses preferred_move from
    // profiles.interview_meta instead.
    return NextResponse.json({ plan: null })
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
