import { createAdminClient } from '@/lib/supabase/admin'

const XP_PER_LEVEL = 100

const FLOW_MOVES = ['frame', 'list', 'optimize', 'win']

async function initializeMoveLevels(
  userId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<Array<{ move: string; xp: number; level: number; progress_pct: number }>> {
  const rows = FLOW_MOVES.map((move) => ({
    user_id: userId,
    move,
    level: 1,
    progress_pct: 0,
    xp: 0,
  }))
  const { data, error } = await admin.from('move_levels').insert(rows).select()
  if (error) throw error
  return data as Array<{ move: string; xp: number; level: number; progress_pct: number }>
}

export async function applyMoveLevelXp(
  userId: string,
  scores: Record<string, number>,
  source: string = 'challenge',
): Promise<void> {
  try {
    const admin = createAdminClient()
    const moves = Object.keys(scores)
    if (!moves.length) return

    let { data: currentLevels, error } = await admin
      .from('move_levels')
      .select('move, xp, level, progress_pct')
      .eq('user_id', userId)
      .in('move', moves)

    if (error) {
      console.error('[applyMoveLevelXp] error fetching current levels:', error)
      return
    }

    if (!currentLevels?.length) {
      try {
        currentLevels = await initializeMoveLevels(userId, admin)
      } catch (initError) {
        console.error('[applyMoveLevelXp] Failed to initialize move levels:', initError)
        return
      }
    }

    await Promise.all(
      moves.map(async (move) => {
        const xpDelta = Math.round(scores[move])
        const current = currentLevels!.find((l) => l.move === move)
        if (!current) return

        const newXp = current.xp + xpDelta
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1
        const newProgressPct = Math.round((newXp % XP_PER_LEVEL) / XP_PER_LEVEL * 100)

        const [updateRes, histRes] = await Promise.all([
          admin
            .from('move_levels')
            .update({ xp: newXp, level: newLevel, progress_pct: newProgressPct, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('move', move),
          admin
            .from('move_level_history')
            .insert({ user_id: userId, move, xp_delta: xpDelta, source, source_id: null }),
        ])

        if (updateRes.error) console.error(`[applyMoveLevelXp] update error for ${move}:`, updateRes.error)
        if (histRes.error) console.error(`[applyMoveLevelXp] history error for ${move}:`, histRes.error)
      })
    )
  } catch (err) {
    console.error('[applyMoveLevelXp] unexpected error:', err)
  }
}
