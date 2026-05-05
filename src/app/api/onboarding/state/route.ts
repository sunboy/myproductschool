import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { OnboardingStateSchema } from '@/lib/onboarding/state'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return error || !user ? null : user
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('onboarding_state')
    .select('step, data, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ state: data ?? null })
}

export async function PUT(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = OnboardingStateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid onboarding state',
        issues: parsed.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('onboarding_state')
    .upsert(
      {
        user_id: user.id,
        step: parsed.data.step,
        data: parsed.data.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('step, data, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ state: data })
}

export async function DELETE() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('onboarding_state')
    .delete()
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
