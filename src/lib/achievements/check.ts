import type { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export interface AchievementDefinition {
  id: string
  criteria_type: string
  criteria_value: number
  xp_reward?: number
}

export async function checkAndGrantAchievements(
  userId: string,
  admin: AdminClient
): Promise<AchievementDefinition[]> {
  const [definitionsResult, unlockedResult, profileResult, challengeCountResult, simulationCountResult] = await Promise.all([
    admin.from('achievement_definitions').select('*'),
    admin.from('user_achievements').select('achievement_id').eq('user_id', userId),
    admin.from('profiles').select('streak_days, xp_total').eq('id', userId).single(),
    admin.from('challenge_attempts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    admin.from('simulation_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
  ])

  const definitions = (definitionsResult.data ?? []) as AchievementDefinition[]
  const alreadyUnlocked = new Set(
    (unlockedResult.data ?? []).map((a: { achievement_id: string }) => a.achievement_id)
  )
  const streakDays = profileResult.data?.streak_days ?? 0
  const challengeCount = challengeCountResult.count
  const simulationCount = simulationCountResult.count

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
    await admin.from('user_achievements').insert(
      newlyUnlocked.map((achievement_id: string) => ({ user_id: userId, achievement_id }))
    )
    const totalXP = definitions
      .filter((d) => newlyUnlocked.includes(d.id))
      .reduce((sum: number, d) => sum + (d.xp_reward ?? 0), 0)
    if (totalXP > 0) {
      const currentXp = profileResult.data?.xp_total ?? 0
      await admin
        .from('profiles')
        .update({ xp_total: currentXp + totalXP })
        .eq('id', userId)
    }
  }

  return definitions.filter((d) => newlyUnlocked.includes(d.id))
}
