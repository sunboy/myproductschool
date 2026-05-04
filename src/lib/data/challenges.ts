import { Challenge, ChallengeWithDomain, ChallengeAttemptV2 } from '@/lib/types'
import { MOCK_CHALLENGES, MOCK_DOMAINS } from '@/lib/mock-data'
import { IS_MOCK } from '@/lib/mock'

type AttemptRow = Pick<ChallengeAttemptV2, 'challenge_id' | 'total_score' | 'status'>

interface ChallengeStats {
  attempt_count: number
  best_score: number | null
  is_completed: boolean
}

export function buildStatsMap(
  challengeIds: string[],
  attempts: AttemptRow[],
): Map<string, ChallengeStats> {
  const map = new Map<string, ChallengeStats>()
  for (const id of challengeIds) {
    map.set(id, { attempt_count: 0, best_score: null, is_completed: false })
  }
  for (const attempt of attempts) {
    const existing = map.get(attempt.challenge_id)
    if (!existing) continue
    existing.attempt_count += 1
    if (attempt.status === 'completed') {
      existing.is_completed = true
      if (attempt.total_score !== null) {
        existing.best_score =
          existing.best_score === null
            ? attempt.total_score
            : Math.max(existing.best_score, attempt.total_score)
      }
    }
  }
  return map
}

export async function getChallenges(filters?: {
  domainId?: string
  difficulty?: string
  paradigm?: string
  role?: string
  company?: string
  q?: string
  type?: string
  topic?: string
  technique?: string
  move_tag?: string
  real_interview?: boolean
}): Promise<ChallengeWithDomain[]> {
  if (IS_MOCK) {
    let challenges = MOCK_CHALLENGES
    if (filters?.domainId) challenges = challenges.filter(c => c.domain_id === filters.domainId)
    if (filters?.difficulty) challenges = challenges.filter(c => c.difficulty === filters.difficulty)

    return challenges.map(challenge => {
      const domain = MOCK_DOMAINS.find(d => d.id === challenge.domain_id)
      return {
        ...challenge,
        domain: { slug: domain?.slug ?? '', title: domain?.title ?? '', icon: domain?.icon ?? null },
        attempt_count: 0,
        best_score: null,
        is_completed: false,
      }
    })
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('challenges')
    .select('*, domains(slug, title, icon)')
    .eq('is_published', true)
    .neq('challenge_type', 'quick_take')

  if (filters?.domainId) query = query.eq('domain_id', filters.domainId)
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters?.paradigm && filters.paradigm !== 'all') query = query.eq('paradigm', filters.paradigm)
  if (filters?.role && filters.role !== 'all') query = query.contains('relevant_roles', [filters.role])
  if (filters?.company) query = query.contains('company_tags', [filters.company])
  if (filters?.q) query = query.ilike('title', `%${filters.q}%`)
  if (filters?.type && filters.type !== 'all') query = query.eq('challenge_type', filters.type)
  if (filters?.topic) query = query.contains('topic_tags', [filters.topic])
  if (filters?.technique) query = query.contains('technique_tags', [filters.technique])
  if (filters?.move_tag) query = query.contains('move_tags', [filters.move_tag])
  if (filters?.real_interview) query = query.eq('is_real_interview', true)
  const { data } = await query.order('created_at', { ascending: false })

  const challengeIds = (data ?? []).map(c => c.id)

  const { data: attempts } =
    user && challengeIds.length > 0
      ? await supabase
          .from('challenge_attempts')
          .select('challenge_id, total_score, status')
          .eq('user_id', user.id)
          .in('challenge_id', challengeIds)
      : { data: null }

  const statsMap = buildStatsMap(challengeIds, (attempts ?? []) as AttemptRow[])

  return (data ?? []).map(c => ({
    ...c,
    slug: c.slug ?? c.id.replace(/^c\d+-/, ''),
    domain: { slug: '', title: '', icon: null },
    ...(statsMap.get(c.id) ?? { attempt_count: 0, best_score: null, is_completed: false }),
  }))
}

export async function getFeaturedChallenges(): Promise<ChallengeWithDomain[]> {
  if (IS_MOCK) return []

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('challenges')
    .select('*, domains(slug, title, icon)')
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  const challengeIds = (data ?? []).map(c => c.id)

  const { data: attempts } =
    user && challengeIds.length > 0
      ? await supabase
          .from('challenge_attempts')
          .select('challenge_id, total_score, status')
          .eq('user_id', user.id)
          .in('challenge_id', challengeIds)
      : { data: null }

  const statsMap = buildStatsMap(challengeIds, (attempts ?? []) as AttemptRow[])

  return (data ?? []).map(c => ({
    ...c,
    slug: c.slug ?? c.id.replace(/^c\d+-/, ''),
    domain: { slug: '', title: '', icon: null },
    ...(statsMap.get(c.id) ?? { attempt_count: 0, best_score: null, is_completed: false }),
  }))
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
  if (IS_MOCK) {
    return (MOCK_CHALLENGES.find(c => c.id === id) ?? null) as unknown as Challenge | null
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('challenges').select('*').eq('id', id).single()
  return data
}
