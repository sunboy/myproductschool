import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRoleV2 } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: challenge_id } = await params
  const body = await req.json().catch(() => ({})) as { role_id?: UserRoleV2 }
  const role_id: UserRoleV2 = body.role_id ?? 'swe'

  const adminClient = createAdminClient()

  // Check for existing in-progress attempt — return it (resume)
  const { data: existing } = await adminClient
    .from('challenge_attempts_v2')
    .select('id, challenge_id, role_id, current_step, current_question_sequence, status')
    .eq('user_id', user.id)
    .eq('challenge_id', challenge_id)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      attempt: {
        id: existing.id,
        challenge_id: existing.challenge_id,
        role_id: existing.role_id,
        current_step: existing.current_step,
        current_question_sequence: existing.current_question_sequence,
        status: existing.status,
      },
      is_resume: true,
    })
  }

  // Free tier daily limit — count today's attempts for this user
  const today = new Date().toISOString().split('T')[0]
  const [{ data: subscription }, { count: todayCount }] = await Promise.all([
    adminClient
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    adminClient
      .from('challenge_attempts_v2')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('started_at', today),
  ])

  const isFreeTier = !subscription || subscription.plan === 'free'
  if (isFreeTier && (todayCount ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'Daily limit reached', limit: 3 },
      { status: 403 }
    )
  }

  // Create new attempt
  const { data: attempt, error } = await adminClient
    .from('challenge_attempts_v2')
    .insert({
      user_id: user.id,
      challenge_id,
      role_id,
      status: 'in_progress',
      current_step: 'frame',
      current_question_sequence: 1,
    })
    .select('id, challenge_id, role_id, current_step, current_question_sequence')
    .single()

  if (error || !attempt) {
    return NextResponse.json({ error: 'Failed to create attempt' }, { status: 500 })
  }

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      challenge_id: attempt.challenge_id,
      role_id: attempt.role_id,
      current_step: attempt.current_step,
      current_question_sequence: attempt.current_question_sequence,
      status: 'in_progress',
    },
    is_resume: false,
  })
}
