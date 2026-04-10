import type { DomainWithProgress } from '@/lib/types'
import { MOCK_DOMAINS } from '@/lib/mock-data'
import { IS_MOCK } from '@/lib/mock'

export async function getDomainsWithProgress(): Promise<DomainWithProgress[]> {
  if (IS_MOCK) {
    return MOCK_DOMAINS.map(domain => ({
      ...domain,
      concept_count: 4,
      challenge_count: 2,
      completed_challenges: 0,
      progress_percentage: 0,
    }))
  }

  const { createClient } = await import('@/lib/supabase/server')
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [domainsResult, challengesResult, attemptsResult] = await Promise.all([
    adminClient.from('domains').select('*').eq('is_published', true).order('order_index'),
    adminClient.from('challenges').select('id, domain_id').eq('is_published', true),
    user
      ? adminClient.from('challenge_attempts').select('challenge_id').eq('user_id', user.id).not('submitted_at', 'is', null)
      : Promise.resolve({ data: [] as { challenge_id: string }[] }),
  ])

  if (domainsResult.error) throw domainsResult.error

  const challenges = challengesResult.data ?? []
  const completedIds = new Set(
    (attemptsResult.data ?? []).map((a: { challenge_id: string }) => a.challenge_id)
  )

  return (domainsResult.data ?? []).map(d => {
    const domainChallenges = challenges.filter(c => c.domain_id === d.id)
    const completed = domainChallenges.filter(c => completedIds.has(c.id)).length
    return {
      ...d,
      concept_count: 0,
      challenge_count: domainChallenges.length,
      completed_challenges: completed,
      progress_percentage: domainChallenges.length > 0
        ? Math.round((completed / domainChallenges.length) * 100)
        : 0,
    }
  })
}

export async function getDomains(): Promise<DomainWithProgress[]> {
  if (IS_MOCK) {
    return MOCK_DOMAINS.map(domain => ({
      ...domain,
      concept_count: 4,
      challenge_count: 2,
      completed_challenges: 0,
      progress_percentage: 0,
    }))
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('domains').select('*').eq('is_published', true).order('order_index')

  return (data ?? []).map(domain => ({
    ...domain,
    concept_count: 0,
    challenge_count: 0,
    completed_challenges: 0,
    progress_percentage: 0,
  }))
}

export async function getDomainBySlug(slug: string) {
  if (IS_MOCK) {
    return MOCK_DOMAINS.find(d => d.slug === slug) ?? null
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('domains').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
