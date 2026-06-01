import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DomainWithProgress } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

// Published domains + the (id, domain_id) map of published challenges are global
// and change only when content is published. Cache them for 5 minutes so each
// dashboard/explore visit doesn't re-scan them; the per-user attempts read below
// stays live. Invalidate with revalidateTag('domains') on content publish.
const getDomainsStatic = unstable_cache(
  async () => {
    const adminClient = createAdminClient()
    const [domainsResult, challengesResult] = await Promise.all([
      adminClient.from('domains').select('*').eq('is_published', true).order('order_index'),
      adminClient.from('challenges').select('id, domain_id').eq('is_published', true),
    ])
    return {
      domains: domainsResult.data ?? null,
      domainsError: domainsResult.error?.message ?? null,
      challenges: challengesResult.data ?? [],
    }
  },
  ['domains-static'],
  { revalidate: 300, tags: ['domains'] }
)

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

  const [staticData, attemptsResult] = await Promise.all([
    getDomainsStatic(),
    adminClient.from('challenge_attempts').select('challenge_id').eq('user_id', user.id).eq('status', 'completed'),
  ])

  if (staticData.domainsError) return NextResponse.json({ error: staticData.domainsError }, { status: 500 })

  const challenges = staticData.challenges
  const completedPromptIds = new Set((attemptsResult.data ?? []).map((a: { challenge_id: string }) => a.challenge_id))

  const domains: DomainWithProgress[] = (staticData.domains ?? []).map((d: { id: string; slug: string; title: string; description: string | null; icon: string | null; order_index: number; is_published: boolean; created_at: string }) => {
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
