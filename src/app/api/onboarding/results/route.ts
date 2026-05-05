import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { ARCHETYPE_OBSERVATIONS } from '@/lib/calibration/archetypes'

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json({
      scores: { frame: 72, list: 65, optimize: 58, win: 81 },
      archetype: 'The Strategist',
      archetype_description: 'You frame problems sharply and land recommendations with conviction. Your instinct is to define the question before answering it.',
      starting_levels: { frame: 3, list: 2, optimize: 2, win: 3 },
      percentile: 78,
      hatch_observation: "You think in narratives and outcomes first. That's rare. Your blind spot: you may skip the diagnosis before declaring the answer.",
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const [profileResult, levelsResult, attemptResult] = await Promise.all([
    adminClient.from('profiles').select('archetype, archetype_description').eq('id', user.id).single(),
    adminClient.from('move_levels').select('move, level, xp').eq('user_id', user.id),
    adminClient
      .from('calibration_attempts')
      .select('scores_json, percentile')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const levels = levelsResult.data ?? []
  const startingLevels = Object.fromEntries(levels.map(l => [l.move, l.level]))
  const scores = attemptResult.data?.scores_json ?? { frame: 0, list: 0, optimize: 0, win: 0 }
  const archetype = profileResult.data?.archetype ?? 'The Emerging Thinker'
  const observation = ARCHETYPE_OBSERVATIONS[archetype] ?? ''

  return NextResponse.json({
    scores,
    archetype,
    archetype_description: profileResult.data?.archetype_description ?? '',
    starting_levels: startingLevels,
    percentile: attemptResult.data?.percentile ?? 50,
    hatch_observation: observation,
  })
}
