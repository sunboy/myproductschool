import { AnalyticsSummary, ChallengeDiscussion, DiscussionReply } from '@/lib/types'
import { MOCK_ANALYTICS_SUMMARY, MOCK_DISCUSSIONS } from '@/lib/mock-data'
import { createClient } from '@supabase/supabase-js'
import { IS_MOCK } from '@/lib/mock'

const USE_MOCK = IS_MOCK

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function attemptScoreOutOfTen(attempt: { total_score: unknown; max_score: unknown }): number | null {
  const total = Number(attempt.total_score)
  const max = Number(attempt.max_score)
  if (!Number.isFinite(total) || !Number.isFinite(max) || max <= 0) return null
  return (total / max) * 10
}

export async function getUserAnalyticsSummary(userId: string): Promise<AnalyticsSummary> {
  if (USE_MOCK) return MOCK_ANALYTICS_SUMMARY

  const supabase = getAdminClient()

  // Fetch last 30 completed attempts from the live challenge_attempts schema.
  const { data: attempts } = await supabase
    .from('challenge_attempts')
    .select('id, total_score, max_score, completed_at, created_at, challenge_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('total_score', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(30)

  if (!attempts || attempts.length === 0) return MOCK_ANALYTICS_SUMMARY

  // Aggregate ProductIQ (last 30 attempts avg)
  const scores = attempts.map(attemptScoreOutOfTen).filter((score): score is number => score != null)
  const productiq_score = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0

  // ProductIQ delta: avg of last 7 days vs the 7 days before that
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(now.getDate() - 14)
  fourteenDaysAgo.setHours(0, 0, 0, 0)

  const recentScores = attempts
    .filter(a => new Date(a.completed_at ?? a.created_at) >= sevenDaysAgo)
    .map(attemptScoreOutOfTen)
    .filter((score): score is number => score != null)

  const prevScores = attempts
    .filter(a => {
      const d = new Date(a.completed_at ?? a.created_at)
      return d >= fourteenDaysAgo && d < sevenDaysAgo
    })
    .map(attemptScoreOutOfTen)
    .filter((score): score is number => score != null)

  const recentAvg = recentScores.length > 0
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : productiq_score
  const prevAvg = prevScores.length > 0
    ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length
    : recentAvg

  const productiq_delta = Math.round((recentAvg - prevAvg) * 10) / 10

  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(now.getDate() - 89)
  ninetyDaysAgo.setHours(0, 0, 0, 0)

  const [{ data: profile }, { data: streakRows }] = await Promise.all([
    supabase.from('profiles').select('streak_days').eq('id', userId).single(),
    supabase
      .from('user_streaks')
      .select('streak_date, completed')
      .eq('user_id', userId)
      .gte('streak_date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('streak_date', { ascending: true }),
  ])

  const streakMap = new Map<string, boolean>()
  for (const row of streakRows ?? []) {
    streakMap.set(row.streak_date, row.completed)
  }

  // Build weekly_activity from the heatmap (last 7 days count of completed)
  const weekly_activity = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now)
    dayStart.setDate(now.getDate() - (6 - i))
    const dateStr = dayStart.toISOString().split('T')[0]
    return streakMap.get(dateStr) ? 1 : attempts.filter(a => {
      const d = new Date(a.completed_at ?? a.created_at)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)
      dayStart.setHours(0, 0, 0, 0)
      return d >= dayStart && d <= dayEnd
    }).length
  })

  return {
    productiq_score,
    productiq_delta,
    streak_days: profile?.streak_days ?? 0,
    total_attempts: attempts.length,
    dimensions: MOCK_ANALYTICS_SUMMARY.dimensions, // real aggregation deferred
    weekly_activity,
    recent_attempts: MOCK_ANALYTICS_SUMMARY.recent_attempts,
  }
}

export async function getChallengeDiscussions(challengeId: string, viewerId?: string | null): Promise<ChallengeDiscussion[]> {
  if (USE_MOCK) return MOCK_DISCUSSIONS.filter(d => d.challenge_id === challengeId)

  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('challenge_discussions')
    .select('*, profiles!challenge_discussions_user_id_fkey(display_name)')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as unknown as Array<Record<string, unknown> & { id: string }>
  const ids = rows.map(d => d.id)
  const reactionCounts = new Map<string, number>()
  const viewerUpvotedIds = new Set<string>()
  if (ids.length > 0) {
    const { data: reactions } = await supabase
      .from('community_reactions')
      .select('target_id, user_id')
      .eq('target_type', 'discussion')
      .eq('reaction_type', 'upvote')
      .in('target_id', ids)

    for (const reaction of reactions ?? []) {
      const targetId = reaction.target_id as string
      reactionCounts.set(targetId, (reactionCounts.get(targetId) ?? 0) + 1)
      if (viewerId && reaction.user_id === viewerId) {
        viewerUpvotedIds.add(targetId)
      }
    }
  }

  // Flatten profiles join
  const enriched = rows.map((d) => ({
    ...d,
    upvote_count: reactionCounts.get(d.id as string) ?? (d.upvote_count as number | null) ?? 0,
    viewer_has_upvoted: viewerUpvotedIds.has(d.id as string),
    upvoted_by: viewerUpvotedIds.has(d.id as string) && viewerId ? [viewerId] : [],
    username: (d.profiles as { display_name?: string } | null)?.display_name
      ?? (d.display_name as string | null)
      ?? 'Anonymous',
  })) as Array<Record<string, unknown> & { id: string; username: string }>

  const visibleDiscussions = enriched.flatMap(d => {
    if (!d.hidden_at) return [d]
    if (viewerId && d.user_id === viewerId) return []
    return [{
      ...d,
      content: '[Removed by moderator]',
      username: 'Removed',
      display_name: null,
      is_expert_pick: false,
      upvote_count: 0,
      reply_count: 0,
      viewer_has_upvoted: false,
      upvoted_by: [],
    }]
  }) as Array<Record<string, unknown> & { id: string; username: string }>

  const discussionIds = visibleDiscussions
    .filter(d => !d.hidden_at)
    .map(d => d.id)
  if (discussionIds.length === 0) {
    return visibleDiscussions.map(d => ({ ...d, replies: [] })) as unknown as ChallengeDiscussion[]
  }

  const { data: replies, error: repliesError } = await supabase
    .from('discussion_replies')
    .select('*, profiles(display_name)')
    .in('discussion_id', discussionIds)
    .order('created_at', { ascending: true })

  if (repliesError) throw repliesError

  const repliesByDiscussion = new Map<string, DiscussionReply[]>()
  for (const reply of replies ?? []) {
    const row = reply as Record<string, unknown>
    const discussionId = row.discussion_id as string
    const existing = repliesByDiscussion.get(discussionId) ?? []
    existing.push({
      ...(row as unknown as DiscussionReply),
      username: (row.profiles as { display_name?: string } | null)?.display_name
        ?? (row.display_name as string | null)
        ?? 'Anonymous',
    })
    repliesByDiscussion.set(discussionId, existing)
  }

  return visibleDiscussions.map(d => ({
    ...d,
    replies: d.hidden_at ? [] : (repliesByDiscussion.get(d.id) ?? []),
  })) as ChallengeDiscussion[]
}

export async function postDiscussion(
  challengeId: string,
  userId: string,
  content: string
): Promise<ChallengeDiscussion> {
  if (USE_MOCK) {
    return {
      id: `d-mock-${Date.now()}`,
      challenge_id: challengeId,
      user_id: userId,
      content,
      is_expert_pick: false,
      upvote_count: 0,
      created_at: new Date().toISOString(),
      username: 'You',
      reply_count: 0,
    }
  }

  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('challenge_discussions')
    .insert({ challenge_id: challengeId, user_id: userId, content })
    .select()
    .single()

  if (error) throw error
  return data as ChallengeDiscussion
}
