import { Challenge, ChallengeWithDomain } from '@/lib/types'
import { MOCK_CHALLENGES, MOCK_DOMAINS } from '@/lib/mock-data'
import { IS_MOCK } from '@/lib/mock'

export async function getChallenges(filters?: { domainId?: string; difficulty?: string; paradigm?: string; role?: string }): Promise<ChallengeWithDomain[]> {
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
  let query = supabase.from('challenges').select('*, domains(slug, title, icon)').eq('is_published', true)
  if (filters?.domainId) query = query.eq('domain_id', filters.domainId)
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters?.paradigm && filters.paradigm !== 'all') query = query.eq('paradigm', filters.paradigm)
  if (filters?.role) query = query.contains('relevant_roles', [filters.role])
  const { data } = await query.order('created_at', { ascending: false })

  return (data ?? []).map(c => ({
    ...c,
    slug: c.slug ?? c.id.replace(/^c\d+-/, ''),
    domain: { slug: '', title: '', icon: null },
    attempt_count: 0,
    best_score: null,
    is_completed: false,
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
