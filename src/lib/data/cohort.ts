import { CohortChallenge, CohortSubmission } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const MOCK_COHORT_CHALLENGE: CohortChallenge = {
  id: 'mock-cc-1',
  title: 'Diagnose a DAU drop at a social app',
  prompt_text: 'Daily active users dropped 15% week-over-week. Walk through your diagnostic approach using the FLOW framework.',
  difficulty: 'intermediate',
  move_tag: 'frame',
  week_start: new Date(Date.now() - 2 * 86400000).toISOString(),
  week_end: new Date(Date.now() + 5 * 86400000).toISOString(),
  is_active: true,
  created_at: new Date().toISOString(),
}

export async function getCurrentCohortChallenge(): Promise<CohortChallenge | null> {
  if (IS_MOCK) return MOCK_COHORT_CHALLENGE

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('cohort_challenges')
    .select('*')
    .lte('week_start', now)
    .gte('week_end', now)
    .eq('is_active', true)
    .single()
  return data ?? null
}

export async function getCohortLeaderboard(
  challengeId: string
): Promise<(CohortSubmission & { display_name: string | null; avatar_url: string | null })[]> {
  if (IS_MOCK) return []

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('cohort_submissions')
    .select('*, profiles(display_name, avatar_url)')
    .eq('cohort_challenge_id', challengeId)
    .not('score', 'is', null)
    .order('score', { ascending: false })
    .limit(50)

  return (data ?? []).map(row => ({
    ...row,
    display_name: (row.profiles as { display_name: string | null } | null)?.display_name ?? null,
    avatar_url: (row.profiles as { avatar_url: string | null } | null)?.avatar_url ?? null,
  }))
}

export async function submitCohortResponse(
  userId: string,
  challengeId: string,
  text: string
): Promise<CohortSubmission | null> {
  if (IS_MOCK) return null

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('cohort_submissions')
    .insert({
      user_id: userId,
      cohort_challenge_id: challengeId,
      response_text: text,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()
  return data ?? null
}
