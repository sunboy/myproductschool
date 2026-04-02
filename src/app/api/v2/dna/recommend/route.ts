import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { identifyWeakness } from '@/lib/v2/skills/weakness-identifier'
import type { LearnerCompetency, RoleLens } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Fetch competencies
  const { data: competencies, error: compError } = await admin
    .from('learner_competencies')
    .select('*')
    .eq('user_id', user.id)

  if (compError) {
    return NextResponse.json({ error: 'Failed to fetch competencies' }, { status: 500 })
  }

  const competencyList: LearnerCompetency[] = competencies ?? []

  // Fetch the user's role lens
  const { data: profile } = await admin
    .from('profiles')
    .select('preferred_role')
    .eq('id', user.id)
    .single()

  const roleId = profile?.preferred_role ?? 'swe'

  const { data: roleLens } = await admin
    .from('role_lenses')
    .select('*')
    .eq('role_id', roleId)
    .single()

  const lens: RoleLens = roleLens ?? {
    role_id: roleId,
    label: roleId,
    short_label: roleId,
    frame_weight: 1.0,
    list_weight: 1.0,
    optimize_weight: 1.0,
    win_weight: 1.0,
    competency_multipliers: {
      motivation_theory: 1.0,
      cognitive_empathy: 1.0,
      taste: 1.0,
      strategic_thinking: 1.0,
      creative_execution: 1.0,
      domain_expertise: 1.0,
    },
    frame_nudge: null,
    list_nudge: null,
    optimize_nudge: null,
    win_nudge: null,
  }

  // Find weakest competency — if no competencies, pick a default
  let weakestCompetency: string
  if (competencyList.length > 0) {
    const { weakest } = identifyWeakness(competencyList, lens)
    weakestCompetency = weakest
  } else {
    weakestCompetency = 'motivation_theory'
  }

  // Fetch completed challenge IDs for this user
  const { data: completedAttempts } = await admin
    .from('challenge_attempts')
    .select('challenge_id')
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const completedIds = (completedAttempts ?? []).map((a: { challenge_id: string }) => a.challenge_id)

  // Query challenges targeting the weakest competency, excluding already completed
  let query = admin
    .from('challenges')
    .select('id, title, primary_competencies')
    .eq('is_published', true)
    .contains('primary_competencies', [weakestCompetency])
    .limit(10)

  if (completedIds.length > 0) {
    query = query.not('id', 'in', `(${completedIds.join(',')})`)
  }

  const { data: candidates, error: challengeError } = await query

  if (challengeError) {
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }

  const challengeList = candidates ?? []

  if (challengeList.length === 0) {
    return NextResponse.json({ challenge_id: null, title: null, reason: `No uncompleted challenges found targeting ${weakestCompetency}` })
  }

  const pick = challengeList[0]

  return NextResponse.json({
    challenge_id: pick.id,
    title: pick.title,
    reason: `Targets your weakest competency: ${weakestCompetency}`,
  })
}
