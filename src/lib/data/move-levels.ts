import { FlowMove, MoveLevel, MoveLevelHistory } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500]

function xpForScore(score: number, dodgedTrap: boolean): number {
  let xp = score <= 2 ? 5 : score === 3 ? 10 : score === 4 ? 20 : 30
  if (dodgedTrap) xp += 10
  return xp
}

function levelFromXp(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function progressPct(xp: number): number {
  const level = levelFromXp(xp)
  const lo = XP_THRESHOLDS[level - 1] ?? 0
  const hi = XP_THRESHOLDS[level] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1]
  if (hi === lo) return 100
  return Math.round(((xp - lo) / (hi - lo)) * 100)
}

const MOCK_MOVE_LEVELS: MoveLevel[] = (['frame', 'list', 'optimize', 'win'] as FlowMove[]).map((move, i) => ({
  id: `mock-ml-${i}`,
  user_id: 'mock-user',
  move,
  level: 1,
  progress_pct: 0,
  xp: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}))

export async function getMoveLevels(userId: string): Promise<MoveLevel[]> {
  if (IS_MOCK) return MOCK_MOVE_LEVELS

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('move_levels').select('*').eq('user_id', userId)
  return data ?? []
}

export async function getMoveLevelDetail(
  userId: string,
  move: FlowMove
): Promise<{ level: MoveLevel | null; history: MoveLevelHistory[] }> {
  if (IS_MOCK) {
    return { level: MOCK_MOVE_LEVELS.find(m => m.move === move) ?? null, history: [] }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const [{ data: level }, { data: history }] = await Promise.all([
    supabase.from('move_levels').select('*').eq('user_id', userId).eq('move', move).single(),
    supabase
      .from('move_level_history')
      .select('*')
      .eq('user_id', userId)
      .eq('move', move)
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  return { level: level ?? null, history: history ?? [] }
}

export async function updateMoveLevels(
  userId: string,
  scores: Record<FlowMove, number>,
  dodgedTrap = false,
  source: MoveLevelHistory['source'] = 'challenge',
  sourceId: string | null = null
): Promise<void> {
  if (IS_MOCK) return

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: existing } = await supabase.from('move_levels').select('*').eq('user_id', userId)
  const existingMap: Record<string, MoveLevel> = {}
  for (const row of existing ?? []) existingMap[row.move] = row

  const moves: FlowMove[] = ['frame', 'list', 'optimize', 'win']
  const historyRows: Omit<MoveLevelHistory, 'id' | 'created_at'>[] = []
  const upsertRows: Omit<MoveLevel, 'id' | 'created_at'>[] = []

  for (const move of moves) {
    const score = scores[move]
    if (score == null) continue
    const xpDelta = xpForScore(score, dodgedTrap)
    const currentXp = existingMap[move]?.xp ?? 0
    const newXp = currentXp + xpDelta
    const newLevel = levelFromXp(newXp)
    const newProgress = progressPct(newXp)

    historyRows.push({ user_id: userId, move, xp_delta: xpDelta, source, source_id: sourceId })
    upsertRows.push({ user_id: userId, move, level: newLevel, progress_pct: newProgress, xp: newXp, updated_at: new Date().toISOString() })
  }

  await Promise.all([
    supabase.from('move_level_history').insert(historyRows),
    supabase.from('move_levels').upsert(upsertRows, { onConflict: 'user_id,move' }),
  ])
}
