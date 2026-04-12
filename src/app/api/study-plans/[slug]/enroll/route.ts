import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ slug: string }> }

export async function POST(_request: Request, { params }: Params) {
  const { slug } = await params
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

  const { data, error } = await adminClient
    .from('user_study_plan_enrollments')
    .upsert({ user_id: user.id, plan_id: plan.id, last_active_at: new Date().toISOString() }, { onConflict: 'user_id,plan_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ enrollment: data })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { slug } = await params
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

  const { error } = await adminClient
    .from('user_study_plan_enrollments')
    .delete()
    .eq('user_id', user.id)
    .eq('plan_id', plan.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
