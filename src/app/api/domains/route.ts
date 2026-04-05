import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DomainWithProgress } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const MOCK_DOMAINS: DomainWithProgress[] = [
  {
    id: 'mock-d1',
    slug: 'retention',
    title: 'Retention',
    description: 'Diagnosing drop-off and improving user retention',
    icon: 'trending_up',
    order_index: 1,
    is_published: true,
    created_at: new Date().toISOString(),
    concept_count: 8,
    challenge_count: 12,
    completed_challenges: 3,
    progress_percentage: 25,
  },
  {
    id: 'mock-d2',
    slug: 'prioritization',
    title: 'Prioritization',
    description: 'Structured decision-making under constraints',
    icon: 'filter_list',
    order_index: 2,
    is_published: true,
    created_at: new Date().toISOString(),
    concept_count: 6,
    challenge_count: 10,
    completed_challenges: 0,
    progress_percentage: 0,
  },
]

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json({ domains: MOCK_DOMAINS })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const [domainsResult, challengesResult, attemptsResult] = await Promise.all([
    adminClient.from('domains').select('*').eq('is_published', true).order('order_index'),
    adminClient.from('challenge_prompts').select('id, domain_id').eq('is_published', true),
    adminClient.from('challenge_attempts').select('prompt_id').eq('user_id', user.id).not('submitted_at', 'is', null),
  ])

  if (domainsResult.error) return NextResponse.json({ error: domainsResult.error.message }, { status: 500 })

  const challenges = challengesResult.data ?? []
  const completedPromptIds = new Set((attemptsResult.data ?? []).map((a: { prompt_id: string }) => a.prompt_id))

  const domains: DomainWithProgress[] = (domainsResult.data ?? []).map((d: { id: string; slug: string; title: string; description: string | null; icon: string | null; order_index: number; is_published: boolean; created_at: string }) => {
    const domainChallenges = challenges.filter((c: { domain_id: string }) => c.domain_id === d.id)
    const completed = domainChallenges.filter((c: { id: string }) => completedPromptIds.has(c.id)).length
    return {
      ...d,
      concept_count: 0, // filled separately if needed
      challenge_count: domainChallenges.length,
      completed_challenges: completed,
      progress_percentage: domainChallenges.length > 0 ? Math.round((completed / domainChallenges.length) * 100) : 0,
    }
  })

  return NextResponse.json({ domains })
}
