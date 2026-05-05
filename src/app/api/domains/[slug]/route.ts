import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (IS_MOCK) {
    return NextResponse.json({
      domain: { id: 'mock-d1', slug, title: 'Retention', description: 'Diagnosing drop-off', icon: 'trending_up', order_index: 1, is_published: true, created_at: new Date().toISOString() },
      challenges: [],
      move_training: { frame: 4, list: 2, optimize: 3, win: 1 },
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: domain, error: domainError } = await adminClient
    .from('domains')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (domainError || !domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })

  const [challengesResult, attemptsResult] = await Promise.all([
    adminClient
      .from('challenges')
      .select('id, title, prompt_text, difficulty, tags, estimated_minutes, is_published, move_tags, paradigm, relevant_roles')
      .eq('domain_id', domain.id)
      .eq('is_published', true)
      .neq('challenge_type', 'freeform')
      .order('created_at'),
    adminClient
      .from('challenge_attempts')
      .select('challenge_id, score')
      .eq('user_id', user.id)
      .not('submitted_at', 'is', null),
  ])

  const completedMap = new Map<string, number | null>(
    (attemptsResult.data ?? []).map((a: { challenge_id: string; score: number | null }) => [a.challenge_id, a.score])
  )

  const challenges = (challengesResult.data ?? []).map((c: { id: string; [key: string]: unknown }) => ({
    ...c,
    is_completed: completedMap.has(c.id),
    best_score: completedMap.get(c.id) ?? null,
    attempt_count: completedMap.has(c.id) ? 1 : 0,
  }))

  // Aggregate move training data: count challenges by move tag
  const move_training: Record<string, number> = { frame: 0, list: 0, optimize: 0, win: 0 }
  for (const c of challengesResult.data ?? []) {
    for (const move of (c.move_tags ?? []) as string[]) {
      if (move in move_training) move_training[move]++
    }
  }

  return NextResponse.json({ domain, challenges, move_training })
}
