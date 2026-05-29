import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { logEvent } from '@/lib/data/events'
import { z, ZodError } from 'zod'

const RequestSchema = z.object({
  role_context: z.string().trim().min(1).max(200).optional(),
  experience_level: z.string().trim().min(1).max(100).optional(),
  calibration_answers: z.array(z.unknown()).max(100).optional(),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof RequestSchema>
  try {
    const text = await request.text()
    const rawBody = text.trim() ? JSON.parse(text) : {}
    body = RequestSchema.parse(rawBody)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { role_context, experience_level, calibration_answers } = body

  const adminClient = createAdminClient()

  // Mark onboarding complete on profile
  const profileUpdate: Record<string, unknown> = {
    onboarding_completed_at: new Date().toISOString(),
  }
  if (role_context) profileUpdate.role_context = role_context

  await adminClient
    .from('profiles')
    .upsert({ id: user.id, ...profileUpdate }, { onConflict: 'id' })

  await adminClient
    .from('onboarding_state')
    .delete()
    .eq('user_id', user.id)

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
