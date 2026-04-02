import { DomainWithProgress } from '@/lib/types'
import { MOCK_DOMAINS } from '@/lib/mock-data'
import { IS_MOCK } from '@/lib/mock'

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
