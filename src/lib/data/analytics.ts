import { AnalyticsSummary, ChallengeDiscussion } from '@/lib/types'
import { MOCK_ANALYTICS_SUMMARY, MOCK_DISCUSSIONS } from '@/lib/mock-data'
import { createClient } from '@supabase/supabase-js'

const USE_MOCK = process.env.USE_MOCK_DATA === 'true'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getUserAnalyticsSummary(userId: string): Promise<AnalyticsSummary> {
  if (USE_MOCK) return MOCK_ANALYTICS_SUMMARY

  const supabase = getAdminClient()

  // Fetch last 30 attempts with score_json
  const { data: attempts } = await supabase
    .from('challenge_attempts')
    .select('id, score_json, created_at, challenge_id')
    .eq('user_id', userId)
    .not('score_json', 'is', null)
    .order('created_at', { ascending: false })
    .limit(30)

  if (!attempts || attempts.length === 0) return MOCK_ANALYTICS_SUMMARY

  // Aggregate ProductIQ
  const scores = attempts.map(a => (a.score_json as Record<string,number>)?.overall ?? 0).filter(Boolean)
  const productiq_score = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0

  // Streak from user_streaks
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .single()

  // Weekly activity (last 7 days)
  const weekly_activity = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date()
    dayStart.setDate(dayStart.getDate() - (6 - i))
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    return attempts.filter(a => {
      const d = new Date(a.created_at)
      return d >= dayStart && d <= dayEnd
    }).length
  })

  return {
    productiq_score,
    productiq_delta: 0,
    streak_days: streak?.current_streak ?? 0,
    total_attempts: attempts.length,
    dimensions: MOCK_ANALYTICS_SUMMARY.dimensions, // real aggregation deferred
    weekly_activity,
    recent_attempts: MOCK_ANALYTICS_SUMMARY.recent_attempts,
  }
}

export async function getChallengeDiscussions(challengeId: string): Promise<ChallengeDiscussion[]> {
  if (USE_MOCK) return MOCK_DISCUSSIONS.filter(d => d.challenge_id === challengeId || true)

  const supabase = getAdminClient()
  const { data } = await supabase
    .from('challenge_discussions')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })

  return (data ?? []) as ChallengeDiscussion[]
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
