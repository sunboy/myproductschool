import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { logEvent } from '@/lib/data/events'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown> = {}
  try { body = await request.json() } catch { /* body is optional */ }
  const { role_context, experience_level, calibration_answers } = body as {
    role_context?: string
    experience_level?: string
    calibration_answers?: unknown[]
  }

  const adminClient = createAdminClient()

  // Mark onboarding complete on profile
  const profileUpdate: Record<string, unknown> = {
    onboarding_completed_at: new Date().toISOString(),
  }
  if (role_context) profileUpdate.role_context = role_context

  await adminClient
    .from('profiles')
    .update(profileUpdate)
    .eq('id', user.id)

  // Upsert onboarding response if context provided
  if (role_context && experience_level) {
    await adminClient
      .from('onboarding_responses')
      .upsert(
        {
          user_id: user.id,
          role_context,
          experience_level,
          calibration_answers: calibration_answers ?? [],
        },
        { onConflict: 'user_id' }
      )
  }

  logEvent(user.id, 'onboarding.completed', { role_context, experience_level })

  return NextResponse.json({ success: true, level: experience_level ?? null })
}
