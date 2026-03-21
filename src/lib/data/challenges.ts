import { ChallengePrompt, ChallengeWithDomain } from '@/lib/types'
import { MOCK_CHALLENGES, MOCK_DOMAINS } from '@/lib/mock-data'

export async function getChallenges(filters?: { domainId?: string; difficulty?: string }): Promise<ChallengeWithDomain[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
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
  let query = supabase.from('challenge_prompts').select('*, domains(slug, title, icon)').eq('is_published', true)
  if (filters?.domainId) query = query.eq('domain_id', filters.domainId)
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty)
  const { data } = await query.order('created_at', { ascending: false })

  return (data ?? []).map(c => ({
    ...c,
    domain: c.domains ?? { slug: '', title: '', icon: null },
    attempt_count: 0,
    best_score: null,
    is_completed: false,
  }))
}

export async function getChallengeById(id: string): Promise<ChallengePrompt | null> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return MOCK_CHALLENGES.find(c => c.id === id) ?? null
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('challenge_prompts').select('*').eq('id', id).single()
  return data
}
