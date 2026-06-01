import { Challenge, ChallengeWithDomain } from '@/lib/types'
import { MOCK_CHALLENGES, MOCK_DOMAINS } from '@/lib/mock-data'
import { IS_MOCK } from '@/lib/mock'
import { coerceDifficulty, expandDifficultyForQuery } from '@/lib/practice/difficulty'
import { EMPTY_STATS, buildStatsMap, type AttemptRow } from '@/lib/challenges/status'

// Pure status helpers live in a server-import-free module so client components
// (ChallengeCard, GroupedChallengeList) can use them without bundling
// next/headers. Re-export for existing call sites that import from here.
export { EMPTY_STATS, buildStatsMap, deriveChallengeStatus } from '@/lib/challenges/status'
export type { ChallengeStatus, ChallengeStats } from '@/lib/challenges/status'

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
    if (filters?.difficulty) {
      const bucket = coerceDifficulty(filters.difficulty)
      if (bucket) {
        const accepted = new Set(expandDifficultyForQuery(bucket))
        challenges = challenges.filter(c => accepted.has(c.difficulty))
      }
    }

    return challenges.map(challenge => {
      const domain = MOCK_DOMAINS.find(d => d.id === challenge.domain_id)
      return {
        ...challenge,
        domain: { slug: domain?.slug ?? '', title: domain?.title ?? '', icon: domain?.icon ?? null },
        ...EMPTY_STATS,
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
  if (filters?.difficulty) {
    const bucket = coerceDifficulty(filters.difficulty)
    if (bucket) query = query.in('difficulty', expandDifficultyForQuery(bucket))
  }
  if (filters?.paradigm && filters.paradigm !== 'all') query = query.eq('paradigm', filters.paradigm)
  if (filters?.role && filters.role !== 'all') query = query.contains('relevant_roles', [filters.role])
  // company_tags are stored as lowercase slugs (e.g. "meta", "google"); the
  // filter UI sends display labels (e.g. "Meta", "Google"). Match on the slug.
  if (filters?.company) {
    const companySlug = filters.company.toLowerCase().replace(/[\s]+/g, '-')
    query = query.contains('company_tags', [companySlug])
  }
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
    ...(statsMap.get(c.id) ?? EMPTY_STATS),
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
    ...(statsMap.get(c.id) ?? EMPTY_STATS),
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
