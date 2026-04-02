import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { StudyPlan } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const MOCK_PLANS: StudyPlan[] = [
  {
    id: 'plan-1',
    title: 'PM Interview Foundations',
    slug: 'pm-interview-foundations',
    description: 'Master the core FLOW moves for PM interview success.',
    move_tag: 'frame',
    role_tags: ['SWE', 'EM'],
    challenge_count: 12,
    estimated_hours: 6,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'plan-2',
    title: 'Metric Deep Dive',
    slug: 'metric-deep-dive',
    description: 'Build fluency with product metrics and data storytelling.',
    move_tag: 'list',
    role_tags: ['Data Eng', 'SWE'],
    challenge_count: 8,
    estimated_hours: 4,
    is_published: true,
    created_at: new Date().toISOString(),
  },
]

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json({ plans: MOCK_PLANS })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('study_plans')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ plans: data ?? [] })
}
