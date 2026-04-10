import {
  IS_MOCK,
  MOCK_HOT_CHALLENGES,
  MOCK_DISCUSSIONS,
  MOCK_MOVE_LEVELS,
  MOCK_LEADERBOARD,
  MOCK_USER_NOTES,
  MOCK_DASHBOARD_PREFERENCES,
  type HotChallenge,
  type DiscussionPreview,
  type MoveLevel,
  type LeaderboardEntry,
  type UserNote,
  type DashboardPreferences,
} from '@/lib/mock'

export type { HotChallenge, DiscussionPreview, MoveLevel, LeaderboardEntry, UserNote, DashboardPreferences }

export interface UserInterview {
  id: string
  user_id: string
  company: string | null
  role: string | null
  round: string | null
  interview_date: string
  notes: string | null
  created_at: string
}

// ── Dashboard preferences ────────────────────────────────────

export async function getDashboardPreferences(userId: string): Promise<DashboardPreferences> {
  if (IS_MOCK) return MOCK_DASHBOARD_PREFERENCES

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('dashboard_cards, dismissed_cards, interview_date')
    .eq('id', userId)
    .single()

  return {
    dashboard_cards: (data?.dashboard_cards as string[]) ?? MOCK_DASHBOARD_PREFERENCES.dashboard_cards,
    dismissed_cards: (data?.dismissed_cards as string[]) ?? [],
    interview_date: data?.interview_date ?? null,
  }
}

// ── Hot challenges ───────────────────────────────────────────

export async function getHotChallenges(): Promise<HotChallenge[]> {
  if (IS_MOCK) return MOCK_HOT_CHALLENGES

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // Sample recent 500 attempts — bounded to avoid full-table scan at scale
  const { data: attemptData } = await supabase
    .from('challenge_attempts')
    .select('challenge_id')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(500)

  if (attemptData && attemptData.length > 0) {
    const counts: Record<string, number> = {}
    for (const row of attemptData) {
      if (row.challenge_id) counts[row.challenge_id] = (counts[row.challenge_id] ?? 0) + 1
    }
    const topIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, title, domains(title)')
      .in('id', topIds)
      .eq('is_published', true)

    if (challenges && challenges.length > 0) {
      return challenges.map(c => ({
        id: c.id,
        title: c.title,
        attempts: counts[c.id] ?? 0,
        avgScore: 0,
        domain: ((c.domains as unknown as { title: string } | null))?.title ?? 'General',
      })).sort((a, b) => b.attempts - a.attempts)
    }
  }

  // Fallback: 5 most recently inserted published challenges
  const { data } = await supabase
    .from('challenges')
    .select('id, title, domains(title)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!data || data.length === 0) return MOCK_HOT_CHALLENGES

  return data.map(c => ({
    id: c.id,
    title: c.title,
    attempts: 0,
    avgScore: 0,
    domain: ((c.domains as unknown as { title: string } | null))?.title ?? 'General',
  }))
}

// ── Latest discussions ───────────────────────────────────────

export async function getLatestDiscussions(): Promise<DiscussionPreview[]> {
  if (IS_MOCK) return MOCK_DISCUSSIONS

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data } = await supabase
    .from('challenge_discussions')
    .select('content, created_at, challenge_id, user_id, challenge_prompts(title)')
    .order('created_at', { ascending: false })
    .limit(3)

  if (!data || data.length === 0) return MOCK_DISCUSSIONS

  return data.map(d => ({
    challenge: ((d.challenge_prompts as unknown as { title: string } | null))?.title ?? 'Untitled',
    author: d.user_id.slice(0, 8),
    preview: d.content.slice(0, 80) + (d.content.length > 80 ? '...' : ''),
    time: formatRelativeTime(d.created_at),
  }))
}

// ── Leaderboard peek ─────────────────────────────────────────

export async function getLeaderboardPeek(userId: string): Promise<LeaderboardEntry[]> {
  if (IS_MOCK) return MOCK_LEADERBOARD

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: top3 } = await supabase
    .from('profiles')
    .select('id, display_name, xp_total')
    .order('xp_total', { ascending: false })
    .limit(3)

  const entries: LeaderboardEntry[] = (top3 ?? []).map((p, i) => ({
    rank: i + 1,
    name: p.display_name ?? 'Anonymous',
    xp: p.xp_total,
    isCurrentUser: p.id === userId,
  }))

  // Add current user if not in top 3
  const isInTop3 = entries.some(e => e.isCurrentUser)
  if (!isInTop3) {
    const { data: user } = await supabase
      .from('profiles')
      .select('display_name, xp_total')
      .eq('id', userId)
      .single()

    if (user) {
      // Approximate rank by counting users with more XP
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('xp_total', user.xp_total)

      entries.push({
        rank: (count ?? 0) + 1,
        name: user.display_name ?? 'You',
        xp: user.xp_total,
        isCurrentUser: true,
      })
    }
  }

  return entries
}

// ── User notes ───────────────────────────────────────────────

export async function getUserNotes(userId: string): Promise<UserNote[]> {
  if (IS_MOCK) return MOCK_USER_NOTES

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_notes')
    .select('id, content, color, pinned, created_at, updated_at')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  return (data ?? []) as UserNote[]
}

// ── Move levels (mock for now) ───────────────────────────────

export async function getMoveLevel(_userId: string): Promise<MoveLevel[]> {
  // Move levels are fully mock until scoring pipeline tracks per-move progression
  return MOCK_MOVE_LEVELS
}

// ── Helpers ──────────────────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
