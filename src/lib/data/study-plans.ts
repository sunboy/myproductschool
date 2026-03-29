import { StudyPlan, StudyPlanChapter, UserStudyPlan } from '@/lib/types'

const MOCK_PLANS: StudyPlan[] = [
  {
    id: 'mock-sp-1',
    title: 'PM Interview Crash Course',
    slug: 'pm-interview-crash-course',
    description: 'Master the FLOW framework for PM interviews in 2 weeks',
    move_tag: 'frame',
    role_tags: ['SWE', 'EM'],
    challenge_count: 10,
    estimated_hours: 8,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-sp-2',
    title: 'Product Metrics Mastery',
    slug: 'product-metrics-mastery',
    description: 'Sharpen your metric instincts with structured practice',
    move_tag: 'optimize',
    role_tags: ['Data Eng', 'SWE'],
    challenge_count: 8,
    estimated_hours: 6,
    is_published: true,
    created_at: new Date().toISOString(),
  },
]

export async function getStudyPlans(): Promise<StudyPlan[]> {
  if (process.env.USE_MOCK_DATA === 'true') return MOCK_PLANS

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('study_plans').select('*').eq('is_published', true).order('created_at', { ascending: false })
  return data ?? []
}

export async function getStudyPlanBySlug(
  slug: string,
  userId?: string
): Promise<{ plan: StudyPlan; chapters: StudyPlanChapter[]; userPlan: UserStudyPlan | null } | null> {
  if (process.env.USE_MOCK_DATA === 'true') {
    const plan = MOCK_PLANS.find(p => p.slug === slug) ?? null
    if (!plan) return null
    return { plan, chapters: [], userPlan: null }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: plan } = await supabase.from('study_plans').select('*').eq('slug', slug).single()
  if (!plan) return null

  const { data: chapters } = await supabase
    .from('study_plan_chapters')
    .select('*')
    .eq('plan_id', plan.id)
    .order('order_index', { ascending: true })

  let userPlan: UserStudyPlan | null = null
  if (userId) {
    const { data } = await supabase
      .from('user_study_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_id', plan.id)
      .single()
    userPlan = data ?? null
  }

  return { plan, chapters: chapters ?? [], userPlan }
}

export async function activateStudyPlan(userId: string, planId: string): Promise<void> {
  if (process.env.USE_MOCK_DATA === 'true') return

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  await supabase.from('user_study_plans').upsert(
    {
      user_id: userId,
      plan_id: planId,
      started_at: new Date().toISOString(),
      progress_pct: 0,
      is_active: true,
      completed_challenges: [],
    },
    { onConflict: 'user_id,plan_id' }
  )
}
