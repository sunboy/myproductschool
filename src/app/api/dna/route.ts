import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { identifyWeakness } from '@/lib/v2/skills/weakness-identifier'
import type { LearnerCompetency, RoleLens } from '@/lib/types'

function computeOverallLevel(avgScore: number): string {
  if (avgScore >= 80) return 'Expert'
  if (avgScore >= 60) return 'Advanced'
  if (avgScore >= 40) return 'Developing'
  return 'Beginner'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Fetch all 6 competencies for this user
  const { data: competencies, error } = await admin
    .from('learner_competencies')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch competencies' }, { status: 500 })
  }

  const competencyList: LearnerCompetency[] = competencies ?? []

  // If no competencies exist yet, return empty state
  if (competencyList.length === 0) {
    return NextResponse.json({
      competencies: [],
      weakest_link: null,
      overall_level: 'Beginner',
    })
  }

  // Fetch the user's role lens for weakness identification
  const { data: profile } = await admin
    .from('profiles')
    .select('preferred_role')
    .eq('id', user.id)
    .single()

  // Default to 'swe' if no preferred role
  const roleId = profile?.preferred_role ?? 'swe'

  const { data: roleLens } = await admin
    .from('role_lenses')
    .select('*')
    .eq('role_id', roleId)
    .single()

  // If no role lens found, use a default lens with equal weights
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

  const { weakest } = identifyWeakness(competencyList, lens)

  const avgScore = competencyList.reduce((s, c) => s + c.score, 0) / competencyList.length
  const overall_level = computeOverallLevel(avgScore)

  return NextResponse.json({
    competencies: competencyList,
    weakest_link: weakest,
    overall_level,
  })
}
