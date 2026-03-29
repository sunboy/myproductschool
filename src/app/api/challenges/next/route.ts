import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FlowMove } from '@/lib/types'

const MOCK_NEXT = {
  challenge: {
    id: 'mock-c1',
    title: 'Improve Retention for a B2C App',
    prompt_text: 'Your B2C app has seen a 20% drop in 30-day retention. Diagnose the problem and propose a fix.',
    difficulty: 'intermediate',
    domain: { slug: 'retention', title: 'Retention', icon: 'trending_up' },
    move_tags: ['frame', 'list'],
  },
  reason: 'Targets your weakest move: Frame',
  targets_move: 'frame' as FlowMove,
  targets_dimension: 'diagnostic_accuracy',
}

export async function GET() {
  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json(MOCK_NEXT)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Get user profile for role matching
  const { data: profile } = await adminClient
    .from('profiles')
    .select('preferred_role')
    .eq('id', user.id)
    .single()

  // Get weakest move
  const { data: levels } = await adminClient
    .from('move_levels')
    .select('move, xp')
    .eq('user_id', user.id)
    .order('xp', { ascending: true })
    .limit(1)

  const weakestMove: FlowMove = (levels?.[0]?.move as FlowMove) ?? 'frame'

  // Get completed challenge IDs
  const { data: completedAttempts } = await adminClient
    .from('challenge_attempts')
    .select('prompt_id')
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null)

  const completedIds = (completedAttempts ?? []).map((a: { prompt_id: string }) => a.prompt_id)

  // Find next challenge targeting weakest move, optionally role-matched
  let query = adminClient
    .from('challenge_prompts')
    .select('id, title, prompt_text, difficulty, domain_id, move_tags, role_tags, paradigm')
    .eq('is_published', true)
    .contains('move_tags', [weakestMove])

  if (completedIds.length > 0) {
    query = query.not('id', 'in', `(${completedIds.join(',')})`)
  }

  // Role filter if user has a preferred role
  if (profile?.preferred_role) {
    query = query.or(`role_tags.cs.{"${profile.preferred_role}"},role_tags.eq.{}`)
  }

  const { data: challenge } = await query.limit(1).maybeSingle()

  if (!challenge) {
    // Fallback: any uncompleted challenge
    const fallbackQuery = adminClient
      .from('challenge_prompts')
      .select('id, title, prompt_text, difficulty, domain_id, move_tags, role_tags')
      .eq('is_published', true)

    const { data: fallback } = completedIds.length > 0
      ? await fallbackQuery.not('id', 'in', `(${completedIds.join(',')})`).limit(1).maybeSingle()
      : await fallbackQuery.limit(1).maybeSingle()

    if (!fallback) return NextResponse.json({ error: 'No challenges available' }, { status: 404 })

    return NextResponse.json({
      challenge: fallback,
      reason: 'Continue building your product thinking skills',
      targets_move: weakestMove,
      targets_dimension: 'diagnostic_accuracy',
    })
  }

  return NextResponse.json({
    challenge,
    reason: `Targets your weakest move: ${weakestMove.charAt(0).toUpperCase() + weakestMove.slice(1)}`,
    targets_move: weakestMove,
    targets_dimension: 'diagnostic_accuracy',
  })
}
