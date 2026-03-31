import { getChallengeById } from '@/lib/data/challenges'
import { notFound, redirect } from 'next/navigation'
import { ChallengeWorkspace } from '@/components/challenge/ChallengeWorkspace'
import { MOCK_DOMAINS } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProPaywallGate } from '@/components/paywalls/ProPaywallGate'
import { FlowWorkspaceShell } from '@/components/v2/FlowWorkspaceShell'
import type { UserRoleV2 } from '@/lib/types'

export default async function ChallengeWorkspacePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: string }>
}) {
  const { id } = await params
  const { role } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true') redirect('/auth/login')
  const userId = user?.id ?? 'mock-user'

  // ── V2 FLOW challenge check ────────────────────────────────────
  const { data: v2Challenge } = await supabase
    .from('challenges')
    .select('id, is_published')
    .eq('id', id)
    .single()

  if (v2Challenge) {
    const roleId = (role as UserRoleV2) ?? 'swe'
    return <FlowWorkspaceShell challengeId={id} initialRoleId={roleId} />
  }

  // ── V1 challenge ───────────────────────────────────────────────
  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  // ── Paywall: first 3 challenges free ──────────────────────────
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    const isPro = profile?.plan === 'pro'

    if (!isPro) {
      const adminClient = createAdminClient()
      const { count } = await adminClient
        .from('challenge_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('submitted_at', 'is', null)

      if ((count ?? 0) >= 3) {
        return (
          <ProPaywallGate
            challengeTitle={challenge.title}
            challengeCategory={challenge.tags?.[0] ?? 'Strategy'}
            challengeDuration={`${challenge.estimated_minutes} mins`}
          />
        )
      }
    }
  }
  // ── End paywall check ─────────────────────────────────────────

  const domain = MOCK_DOMAINS.find(d => d.id === challenge.domain_id)

  return (
    <ChallengeWorkspace
      challenge={challenge}
      domainTitle={domain?.title ?? 'Product Thinking'}
      domainIcon={domain?.icon ?? 'fitness_center'}
    />
  )
}
