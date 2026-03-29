import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.json({
      plan: {
        id: 'plan-1',
        title: 'PM Interview Foundations',
        slug,
        description: 'Master the core FLOW moves for PM interview success.',
        move_tag: 'frame',
        role_tags: ['SWE', 'EM'],
        challenge_count: 12,
        estimated_hours: 6,
        is_published: true,
        created_at: new Date().toISOString(),
      },
      chapters: [
        { id: 'ch-1', plan_id: 'plan-1', title: 'Introduction to Framing', order_index: 0, challenge_ids: ['c1', 'c2'], created_at: new Date().toISOString() },
        { id: 'ch-2', plan_id: 'plan-1', title: 'Listing What Matters', order_index: 1, challenge_ids: ['c3', 'c4'], created_at: new Date().toISOString() },
      ],
      user_progress: null,
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: plan, error: planError } = await adminClient
    .from('study_plans')
    .select('*')
    .eq('slug', slug)
    .single()

  if (planError || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const [chaptersResult, progressResult] = await Promise.all([
    adminClient
      .from('study_plan_chapters')
      .select('*')
      .eq('plan_id', plan.id)
      .order('order_index'),
    adminClient
      .from('user_study_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', plan.id)
      .maybeSingle(),
  ])

  const chapters = chaptersResult.data ?? []

  // Collect all challenge IDs across all chapters
  const allChallengeIds = chapters.flatMap((ch: { challenge_ids: string[] }) => ch.challenge_ids ?? [])

  let challengeMap: Record<string, { id: string; title: string; difficulty: string; paradigm?: string | null }> = {}
  if (allChallengeIds.length > 0) {
    const { data: challengeRows } = await adminClient
      .from('challenge_prompts')
      .select('id, title, difficulty, paradigm')
      .in('id', allChallengeIds)
    for (const row of challengeRows ?? []) {
      challengeMap[row.id] = row
    }
  }

  // Enrich chapters with challenge details
  const enrichedChapters = chapters.map((ch: { challenge_ids: string[]; [key: string]: unknown }) => ({
    ...ch,
    challenges: (ch.challenge_ids ?? []).map((id: string) => challengeMap[id] ?? { id, title: 'Unknown Challenge', difficulty: 'intermediate' }),
  }))

  return NextResponse.json({
    plan,
    chapters: enrichedChapters,
    user_progress: progressResult.data ?? null,
  })
}
