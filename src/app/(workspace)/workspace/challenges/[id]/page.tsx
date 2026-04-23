import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FlowWorkspaceShell } from '@/components/v2/FlowWorkspaceShell'
import type { UserRoleV2 } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

async function getNextChallengeInPlan(
  planSlug: string,
  currentChallengeId: string,
): Promise<string | null> {
  try {
    const { createClient: createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Load plan chapters in order
    const { data: plan } = await supabase
      .from('study_plans')
      .select('id')
      .eq('slug', planSlug)
      .single()

    if (!plan) return null

    const { data: chapters } = await supabase
      .from('study_plan_chapters')
      .select('challenge_ids, order_index')
      .eq('plan_id', plan.id)
      .order('order_index')

    // Flatten challenge IDs in order
    const orderedIds: string[] = []
    for (const ch of chapters ?? []) {
      for (const cid of ch.challenge_ids ?? []) orderedIds.push(cid)
    }

    const currentIdx = orderedIds.indexOf(currentChallengeId)
    if (currentIdx === -1 || currentIdx === orderedIds.length - 1) return null

    const remainingIds = orderedIds.slice(currentIdx + 1)
    if (remainingIds.length === 0) return null

    // Get completed challenge IDs for this user
    let completedIds = new Set<string>()
    if (user) {
      const { data: attempts } = await supabase
        .from('challenge_attempts')
        .select('challenge_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .in('challenge_id', remainingIds)
      for (const a of attempts ?? []) completedIds.add(a.challenge_id)
    }

    // First incomplete challenge after current
    const nextId = remainingIds.find(id => !completedIds.has(id)) ?? remainingIds[0]

    // Resolve to slug
    const { data: ch } = await supabase
      .from('challenges')
      .select('slug')
      .eq('id', nextId)
      .single()

    return ch?.slug ?? null
  } catch {
    return null
  }
}

async function getNextChallengeInCategory(
  currentChallengeId: string,
  userId: string | undefined,
): Promise<string | null> {
  try {
    const admin = createAdminClient()

    // Get the current challenge's domain_id
    const { data: current } = await admin
      .from('challenges')
      .select('domain_id, slug')
      .eq('id', currentChallengeId)
      .single()

    if (!current?.domain_id) return null

    // Get completed challenge IDs for this user
    const completedIds = new Set<string>()
    if (userId) {
      const { data: attempts } = await admin
        .from('challenge_attempts')
        .select('challenge_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
      for (const a of attempts ?? []) completedIds.add(a.challenge_id)
    }

    // Find next unattempted challenge in same domain, excluding current
    const { data: candidates } = await admin
      .from('challenges')
      .select('id, slug')
      .eq('domain_id', current.domain_id)
      .neq('id', currentChallengeId)
      .eq('is_published', true)
      .order('created_at', { ascending: true })

    const next = (candidates ?? []).find(c => !completedIds.has(c.id))
    return next?.slug ?? (candidates?.[0]?.slug ?? null)
  } catch {
    return null
  }
}

export default async function ChallengeWorkspacePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: string; from_plan?: string }>
}) {
  const { id } = await params
  const { role, from_plan } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !IS_MOCK) redirect('/login')

  // Resolve slug → id: look up by slug first, fall back to raw param
  let challengeId = id
  let challengeSlug = id
  if (!IS_MOCK) {
    const admin = createAdminClient()
    const { data: ch } = await admin.from('challenges').select('id, slug, challenge_type').eq('slug', id).maybeSingle()
    if (ch?.id) {
      challengeId = ch.id
      challengeSlug = ch.slug
      // Quick takes don't have FLOW steps — send to challenges hub
      if (ch.challenge_type === 'quick_take') redirect('/challenges')
    } else {
      // Try by UUID
      const { data: chById } = await admin.from('challenges').select('id, slug, challenge_type').eq('id', id).maybeSingle()
      if (chById?.challenge_type === 'quick_take') redirect('/challenges')
    }
  }

  // Compute next challenge: prefer plan order, fall back to same-category
  let nextChallengeSlug: string | undefined
  if (!IS_MOCK) {
    if (from_plan) {
      const next = await getNextChallengeInPlan(from_plan, challengeId)
      nextChallengeSlug = next ?? undefined
    }
    if (!nextChallengeSlug) {
      const next = await getNextChallengeInCategory(challengeId, user?.id)
      nextChallengeSlug = next ?? undefined
    }
  }

  const roleId = (role as UserRoleV2) ?? 'swe'
  return (
    <FlowWorkspaceShell
      challengeId={challengeId}
      challengeSlug={challengeSlug}
      initialRoleId={roleId}
      fromPlan={from_plan}
      nextChallengeSlug={nextChallengeSlug}
    />
  )
}
