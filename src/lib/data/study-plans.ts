import type { StudyPlan, StudyPlanWithItems } from '@/lib/types'
import { MOCK_STUDY_PLANS, MOCK_STUDY_PLAN_ITEMS, MOCK_CHALLENGES, MOCK_DOMAINS } from '@/lib/mock-data'
import { IS_MOCK } from '@/lib/mock'

export async function getStudyPlanSummaries(limit?: number): Promise<StudyPlan[]> {
  if (IS_MOCK) {
    return limit ? MOCK_STUDY_PLANS.slice(0, limit) : MOCK_STUDY_PLANS
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  let query = supabase
    .from('study_plans')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: true })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getStudyPlans(userId?: string): Promise<StudyPlanWithItems[]> {
  if (IS_MOCK) {
    return MOCK_STUDY_PLANS.map(plan => {
      const items = MOCK_STUDY_PLAN_ITEMS.filter(i => i.plan_id === plan.id)
      const chapters = new Set(items.map(i => i.chapter_title).filter(Boolean))
      return {
        ...plan,
        items,
        item_count: items.length,
        chapter_count: chapters.size,
        completed_count: 0,
        progress_percentage: 0,
        is_enrolled: false,
      }
    })
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('study_plans')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: true })

  if (!plans) return []

  const { data: chapters } = await supabase
    .from('study_plan_chapters')
    .select('plan_id, id')
    .in('plan_id', plans.map(p => p.id))

  // Fetch enrollment state if user is provided
  let enrolledPlanIds = new Set<string>()
  if (userId) {
    const { data: enrollments } = await supabase
      .from('user_study_plan_enrollments')
      .select('plan_id')
      .eq('user_id', userId)
    for (const e of enrollments ?? []) enrolledPlanIds.add(e.plan_id)
  }

  // Group chapters by plan
  const chaptersByPlan = new Map<string, number>()
  for (const ch of chapters ?? []) {
    chaptersByPlan.set(ch.plan_id, (chaptersByPlan.get(ch.plan_id) ?? 0) + 1)
  }

  return plans.map(plan => ({
    ...plan,
    items: [],
    item_count: plan.challenge_count ?? 0,
    chapter_count: chaptersByPlan.get(plan.id) ?? 0,
    completed_count: 0,
    progress_percentage: 0,
    is_enrolled: enrolledPlanIds.has(plan.id),
  }))
}

export async function getEnrolledPlans(userId: string): Promise<StudyPlanWithItems[]> {
  if (IS_MOCK) return []

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: enrollments } = await supabase
    .from('user_study_plan_enrollments')
    .select('plan_id')
    .eq('user_id', userId)
    .order('last_active_at', { ascending: false })

  if (!enrollments || enrollments.length === 0) return []

  const planIds = enrollments.map(e => e.plan_id)

  const { data: plans } = await supabase
    .from('study_plans')
    .select('*')
    .in('id', planIds)
    .eq('is_published', true)

  if (!plans || plans.length === 0) return []

  // Fetch challenge counts per plan
  const { data: chapters } = await supabase
    .from('study_plan_chapters')
    .select('plan_id, challenge_ids')
    .in('plan_id', planIds)

  const allChallengeIds: string[] = []
  const chaptersByPlan = new Map<string, { count: number; challengeIds: string[] }>()
  for (const ch of chapters ?? []) {
    const ids = ch.challenge_ids ?? []
    const existing = chaptersByPlan.get(ch.plan_id) ?? { count: 0, challengeIds: [] }
    existing.count++
    existing.challengeIds.push(...ids)
    chaptersByPlan.set(ch.plan_id, existing)
    allChallengeIds.push(...ids)
  }

  // Fetch user's completed challenges
  let scoreMap: Record<string, number> = {}
  if (allChallengeIds.length > 0) {
    const { data: attempts } = await supabase
      .from('challenge_attempts')
      .select('challenge_id, total_score')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('challenge_id', allChallengeIds)
    for (const a of attempts ?? []) {
      if (!scoreMap[a.challenge_id] || a.total_score > scoreMap[a.challenge_id]) {
        scoreMap[a.challenge_id] = a.total_score
      }
    }
  }

  return plans.map(plan => {
    const planData = chaptersByPlan.get(plan.id)
    const challengeIds = planData?.challengeIds ?? []
    const completedCount = challengeIds.filter(id => id in scoreMap).length
    const itemCount = challengeIds.length
    return {
      ...plan,
      items: [],
      item_count: itemCount,
      chapter_count: planData?.count ?? 0,
      completed_count: completedCount,
      progress_percentage: itemCount > 0 ? Math.round((completedCount / itemCount) * 100) : 0,
      is_enrolled: true,
    }
  })
}

export async function getStudyPlanBySlug(slug: string): Promise<StudyPlanWithItems | null> {
  if (IS_MOCK) {
    const plan = MOCK_STUDY_PLANS.find(p => p.slug === slug) ?? null
    if (!plan) return null

    const items = MOCK_STUDY_PLAN_ITEMS
      .filter(i => i.plan_id === plan.id)
      .map(item => {
        if (item.item_type === 'challenge' && item.challenge_id) {
          const challenge = MOCK_CHALLENGES.find(c => c.id === item.challenge_id)
          if (challenge) {
            const domain = MOCK_DOMAINS.find(d => d.id === challenge.domain_id)
            return {
              ...item,
              challenge: {
                ...challenge,
                domain: { slug: domain?.slug ?? '', title: domain?.title ?? '', icon: domain?.icon ?? null },
                attempt_count: 0,
                best_score: null,
                is_completed: false,
              },
            }
          }
        }
        return item
      })

    const chapters = new Set(items.map(i => i.chapter_title).filter(Boolean))

    return {
      ...plan,
      items,
      item_count: items.length,
      chapter_count: chapters.size,
      completed_count: 0,
      progress_percentage: 0,
    }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('study_plans')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!plan) return null

  // study_plan_chapters stores challenge_ids as an array per chapter
  const { data: chapters } = await supabase
    .from('study_plan_chapters')
    .select('id, title, order_index, challenge_ids')
    .eq('plan_id', plan.id)
    .order('order_index')

  // Collect all challenge IDs across chapters
  const allChallengeIds: string[] = []
  for (const ch of chapters ?? []) {
    for (const cid of ch.challenge_ids ?? []) allChallengeIds.push(cid)
  }

  // Fetch challenge details
  const { data: challenges } = allChallengeIds.length > 0
    ? await supabase
        .from('challenges')
        .select('id, slug, title, difficulty, domain_id, domains(slug, title, icon)')
        .in('id', allChallengeIds)
    : { data: [] }

  const challengeMap = Object.fromEntries((challenges ?? []).map(c => [c.id, c]))

  // Fetch user progress
  let scoreMap: Record<string, number> = {}
  let inProgressSet = new Set<string>()
  if (allChallengeIds.length > 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const [{ data: completedAttempts }, { data: inProgressAttempts }] = await Promise.all([
        supabase
          .from('challenge_attempts')
          .select('challenge_id, total_score')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .in('challenge_id', allChallengeIds)
          .order('total_score', { ascending: false }),
        supabase
          .from('challenge_attempts')
          .select('challenge_id')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .in('challenge_id', allChallengeIds),
      ])

      for (const a of completedAttempts ?? []) {
        if (!scoreMap[a.challenge_id] || a.total_score > scoreMap[a.challenge_id]) {
          scoreMap[a.challenge_id] = a.total_score
        }
      }
      for (const a of inProgressAttempts ?? []) {
        inProgressSet.add(a.challenge_id)
      }
    }
  }

  // Build StudyPlanItem rows from chapters
  let orderIndex = 0
  const enrichedItems = (chapters ?? []).flatMap(ch =>
    (ch.challenge_ids ?? []).map((cid: string) => {
      const c = challengeMap[cid]
      orderIndex++
      return {
        id: `${ch.id}-${cid}`,
        plan_id: plan.id,
        item_type: 'challenge' as const,
        challenge_id: cid,
        concept_id: null,
        chapter_title: ch.title,
        order_index: orderIndex,
        challenge: c ? {
          ...c,
          domain: (c as { domains?: { slug: string; title: string; icon: string | null } }).domains ?? { slug: '', title: '', icon: null },
          attempt_count: 0,
          best_score: scoreMap[cid] ?? null,
          is_completed: cid in scoreMap,
          is_in_progress: inProgressSet.has(cid) && !(cid in scoreMap),
        } : undefined,
      }
    })
  )

  const completedCount = enrichedItems.filter(i => i.challenge?.is_completed).length

  return {
    ...plan,
    items: enrichedItems,
    item_count: enrichedItems.length,
    chapter_count: (chapters ?? []).length,
    completed_count: completedCount,
    progress_percentage: enrichedItems.length > 0 ? Math.round((completedCount / enrichedItems.length) * 100) : 0,
  }
}
