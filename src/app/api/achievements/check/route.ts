import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id } = body
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const adminClient = createAdminClient()

  const [definitionsResult, unlockedResult, profileResult] = await Promise.all([
    adminClient.from('achievement_definitions').select('*'),
    adminClient.from('user_achievements').select('achievement_id').eq('user_id', user_id),
    adminClient.from('profiles').select('streak_days').eq('id', user_id).single(),
  ])

  const definitions = definitionsResult.data ?? []
  const alreadyUnlocked = new Set((unlockedResult.data ?? []).map(a => a.achievement_id))
  const streakDays = profileResult.data?.streak_days ?? 0

  // Get challenge count
  const { count: challengeCount } = await adminClient
    .from('challenge_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user_id)

  // Get simulation count
  const { count: simulationCount } = await adminClient
    .from('simulation_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user_id)
    .eq('status', 'completed')

  const newlyUnlocked: string[] = []

  for (const def of definitions) {
    if (alreadyUnlocked.has(def.id)) continue
    let earned = false
    if (def.criteria_type === 'challenge_count') earned = (challengeCount ?? 0) >= def.criteria_value
    if (def.criteria_type === 'streak_days') earned = streakDays >= def.criteria_value
    if (def.criteria_type === 'simulation_complete') earned = (simulationCount ?? 0) >= def.criteria_value
    if (earned) newlyUnlocked.push(def.id)
  }

  if (newlyUnlocked.length > 0) {
    await adminClient.from('user_achievements').insert(
      newlyUnlocked.map(achievement_id => ({ user_id, achievement_id }))
    )
    // Award XP for each achievement
    const totalXP = definitions.filter(d => newlyUnlocked.includes(d.id)).reduce((sum, d) => sum + (d.xp_reward ?? 0), 0)
    if (totalXP > 0) await adminClient.from('profiles').update({ xp_total: adminClient.rpc('increment', { x: totalXP }) }).eq('id', user_id)
  }

  const newAchievements = definitions.filter(d => newlyUnlocked.includes(d.id))
  return NextResponse.json({ newly_unlocked: newAchievements })
}
