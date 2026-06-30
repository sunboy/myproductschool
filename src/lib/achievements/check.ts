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
    // Idempotent insert: a concurrent run that computed the same newlyUnlocked set
    // must not insert a duplicate row (and thus must not double-award its XP). We
    // upsert ignoring conflicts on the (user_id, achievement_id) pair, then award
    // XP only for the rows THIS call actually inserted.
    const { data: inserted } = await admin
      .from('user_achievements')
      .upsert(
        newlyUnlocked.map((achievement_id: string) => ({ user_id: userId, achievement_id })),
        { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
      )
      .select('achievement_id')
    const grantedIds = new Set((inserted ?? []).map((r: { achievement_id: string }) => r.achievement_id))
    const totalXP = definitions
      .filter((d) => grantedIds.has(d.id))
      .reduce((sum: number, d) => sum + (d.xp_reward ?? 0), 0)
    if (totalXP > 0) {
      // Atomic increment (no read-then-write race against the completion XP award).
      const { error: xpErr } = await admin.rpc('increment_user_xp', { p_user_id: userId, p_amount: totalXP })
      if (xpErr) console.error('[achievements] increment_user_xp failed:', xpErr.message)
    }
    return definitions.filter((d) => grantedIds.has(d.id))
  }

  return []
}
