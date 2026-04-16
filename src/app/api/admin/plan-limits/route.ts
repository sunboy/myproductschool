import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('plan_limits')
    .select('*')
    .order('plan')
    .order('feature')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ limits: data })
}

export async function PUT(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as {
    plan?: string
    feature?: string
    limit_value?: number
    window_days?: number
  }

  if (!body.plan || !body.feature || body.limit_value == null) {
    return NextResponse.json({ error: 'plan, feature, limit_value required' }, { status: 400 })
  }

  if (!['free', 'pro'].includes(body.plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (!['challenges', 'interviews'].includes(body.feature)) {
    return NextResponse.json({ error: 'Invalid feature' }, { status: 400 })
  }

  if (body.limit_value < 0 || !Number.isInteger(body.limit_value)) {
    return NextResponse.json({ error: 'limit_value must be a non-negative integer' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('plan_limits')
    .upsert({
      plan: body.plan,
      feature: body.feature,
      limit_value: body.limit_value,
      window_days: body.window_days ?? 30,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'plan,feature' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ limit: data })
}
