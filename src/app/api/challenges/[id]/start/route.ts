import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { checkUsageLimit, recordUsageEvent } from '@/lib/usage/check-limit'
import type { UserRoleV2 } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isMock = IS_MOCK

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isMock) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user?.id ?? 'mock-user-00000000-0000-0000-0000-000000000000'

  const { id: challenge_id } = await params
  const body = await req.json().catch(() => ({})) as { role_id?: UserRoleV2 }
  const role_id: UserRoleV2 = body.role_id ?? 'swe'

  // In mock mode return a synthetic attempt — no DB write
  if (isMock) {
    return NextResponse.json({
      attempt: {
        id: 'mock-attempt-00000000-0000-0000-0000-000000000000',
        challenge_id,
        role_id,
        current_step: 'frame',
        current_question_sequence: 1,
        status: 'in_progress',
      },
      is_resume: false,
    })
  }

  const adminClient = createAdminClient()

  // Check for existing in-progress attempt — return it (resume)
  const { data: existing } = await adminClient
    .from('challenge_attempts')
    .select('id, challenge_id, role_id, current_step, current_question_sequence, status')
    .eq('user_id', userId)
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

  // Fetch profile to check plan + admin status
  const { data: profile } = await adminClient
    .from('profiles')
    .select('plan, role')
    .eq('id', userId)
    .single()

  const isAdmin = profile?.role === 'admin'
  const userPlan = profile?.plan ?? 'free'

  // Rolling-window usage limit (skip for admins)
  if (!isAdmin) {
    const limitResult = await checkUsageLimit(userId, 'challenges', userPlan)
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          used: limitResult.used,
          limit: limitResult.limit,
          feature: 'challenges',
          windowDays: limitResult.windowDays,
        },
        { status: 402 }
      )
    }
  }

  // Create new attempt
  const { data: attempt, error } = await adminClient
    .from('challenge_attempts')
    .insert({
      user_id: userId,
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

  // Record usage event (after successful attempt creation)
  if (!isAdmin) {
    await recordUsageEvent(userId, 'challenges')
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
