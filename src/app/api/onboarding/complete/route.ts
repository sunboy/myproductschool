import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { role_context, experience_level, calibration_answers } = body

  if (!role_context || !experience_level) {
    return NextResponse.json({ error: 'role_context and experience_level are required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Upsert onboarding response
  const { error: onboardingError } = await adminClient
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

  if (onboardingError) return NextResponse.json({ error: onboardingError.message }, { status: 500 })

  // Mark onboarding complete on profile
  await adminClient
    .from('profiles')
    .update({
      onboarding_completed_at: new Date().toISOString(),
      role_context,
    })
    .eq('id', user.id)

  return NextResponse.json({ success: true, level: experience_level })
}
