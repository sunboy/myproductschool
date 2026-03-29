import { getChallengeById } from '@/lib/data/challenges'
import { notFound, redirect } from 'next/navigation'
import { ChallengeWorkspace } from '@/components/challenge/ChallengeWorkspace'
import { MOCK_DOMAINS } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProPaywallGate } from '@/components/paywalls/ProPaywallGate'

export default async function ChallengeWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  // ── Paywall: first 3 challenges free ──────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Unauthenticated — redirect to login
    redirect('/auth/login')
  }

  // Check profile plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan === 'pro'

  if (!isPro) {
    // Count completed attempts (submitted_at is not null)
    const adminClient = createAdminClient()
    const { count } = await adminClient
      .from('challenge_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
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
