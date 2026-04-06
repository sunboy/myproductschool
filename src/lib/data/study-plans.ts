import { StudyPlanWithItems } from '@/lib/types'
import { MOCK_STUDY_PLANS, MOCK_STUDY_PLAN_ITEMS, MOCK_CHALLENGES, MOCK_DOMAINS } from '@/lib/mock-data'
import { IS_MOCK } from '@/lib/mock'

export async function getStudyPlans(): Promise<StudyPlanWithItems[]> {
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
      }
    })
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('study_plans')
    .select('*')
    .eq('is_published', true)
    .order('order_index')

  if (!plans) return []

  const { data: items } = await supabase
    .from('study_plan_items')
    .select('*')
    .in('plan_id', plans.map(p => p.id))
    .order('order_index')

  return plans.map(plan => {
    const planItems = (items ?? []).filter(i => i.plan_id === plan.id)
    const chapters = new Set(planItems.map(i => i.chapter_title).filter(Boolean))
    return {
      ...plan,
      items: planItems,
      item_count: planItems.length,
      chapter_count: chapters.size,
      completed_count: 0,
      progress_percentage: 0,
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

  const { data: items } = await supabase
    .from('study_plan_items')
    .select('*, challenges(*, domains(slug, title, icon))')
    .eq('plan_id', plan.id)
    .order('order_index')

  const enrichedItems = (items ?? []).map(item => ({
    ...item,
    challenge: item.challenges
      ? {
          ...item.challenges,
          domain: item.challenges.domains ?? { slug: '', title: '', icon: null },
          attempt_count: 0,
          best_score: null,
          is_completed: false,
        }
      : undefined,
  }))

  const chapters = new Set(enrichedItems.map(i => i.chapter_title).filter(Boolean))

  return {
    ...plan,
    items: enrichedItems,
    item_count: enrichedItems.length,
    chapter_count: chapters.size,
    completed_count: 0,
    progress_percentage: 0,
  }
}
