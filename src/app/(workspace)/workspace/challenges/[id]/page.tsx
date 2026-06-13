import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'
import type { UserRoleV2 } from '@/lib/types'
import { FlowWorkspaceShellClient } from './FlowWorkspaceShellClient'
import { AnalyticsWorkspaceClient } from './AnalyticsWorkspaceClient'
import { IS_MOCK } from '@/lib/mock'
import { sanitizeReturnTo } from '@/lib/navigation/return-to'
import { getAnalyticsAccess } from '@/lib/flags/analytics'

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
    const completedIds = new Set<string>()
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
  searchParams: Promise<{ role?: string; from_plan?: string; returnTo?: string }>
}) {
  const { id } = await params
  const { role, from_plan, returnTo } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !IS_MOCK) redirect('/login')

  // Resolve number-slug / slug / id → canonical id. The resolver accepts a number
  // slug (e.g. "sql-2001"), the text slug, or the raw id, and returns challenge_type.
  let challengeId = id
  let challengeSlug = id
  let challengeType: string | undefined
  if (!IS_MOCK) {
    const identity = await resolveChallengeIdentity(id, createAdminClient())
    if (identity?.id) {
      challengeId = identity.id
      challengeSlug = identity.slug ?? identity.id
    }
    challengeType = identity?.challenge_type ?? undefined
    // Quick takes don't have FLOW steps - send to challenges hub
    if (challengeType === 'quick_take') redirect('/challenges')
  }

  // Claude Code Analytics challenges use a dedicated live-terminal medium, not
  // the FLOW MCQ workspace. Route them to the analytics shell with the full row.
  if (challengeType === 'claude_code_analytics') {
    // Entitlement + feature-flag gate. The feature ships dark. When it's still off
    // and the user isn't allowlisted, fully hide it (redirect to Practice). When
    // it's launched but the user lacks the tier, keep them in place and show the
    // upgrade modal over a blurred preview (`locked`) — never a full-page redirect
    // to the pricing page. Mock mode bypasses (no auth/admin client).
    let analyticsLocked = false
    if (!IS_MOCK && user) {
      const access = await getAnalyticsAccess(createAdminClient(), user.id)
      if (!access.hasAccess) {
        if (!access.enabled) redirect('/challenges')
        analyticsLocked = true
      }
    }
    const { data: challengeRow } = await createAdminClient()
      .from('challenges')
      .select('id, slug, title, prompt_text, difficulty, challenge_type, domain_id, estimated_minutes, is_published, created_at, scenario_context, scenario_trigger, scenario_question')
      .eq('id', challengeId)
      .maybeSingle()
    if (challengeRow) {
      // The analytics challenge's narrative lives in the scenario_* columns
      // (prompt_text is empty for this type). Compose them into the scenario the
      // left panel renders so the user actually sees the brief.
      const row = challengeRow as Record<string, unknown>
      const scenario = {
        context: (row.scenario_context as string) ?? '',
        trigger: (row.scenario_trigger as string) ?? '',
        question: (row.scenario_question as string) ?? '',
      }
      return (
        <AnalyticsWorkspaceClient
          challenge={challengeRow as never}
          scenario={scenario}
          returnTo={sanitizeReturnTo(returnTo)}
          locked={analyticsLocked}
        />
      )
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
    <FlowWorkspaceShellClient
      challengeId={challengeId}
      challengeSlug={challengeSlug}
      initialRoleId={roleId}
      fromPlan={from_plan}
      nextChallengeSlug={nextChallengeSlug}
      returnTo={sanitizeReturnTo(returnTo)}
    />
  )
}
