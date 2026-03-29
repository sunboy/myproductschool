import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MOCK_RECOMMENDED = {
  challenge: {
    id: 'mock-c2',
    title: 'Prioritize Features for a New AI Assistant',
    prompt_text: 'You are the PM for an AI assistant app with 10 feature requests and limited eng bandwidth. How do you prioritize?',
    difficulty: 'intermediate',
    domain: { slug: 'prioritization', title: 'Prioritization', icon: 'filter_list' },
  },
  luma_reason: "This challenge covers a skill gap I noticed across your last 3 sessions - structured prioritization under constraints.",
}

export async function GET() {
  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json(MOCK_RECOMMENDED)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Get completed challenge IDs and move levels in parallel
  const [attemptsResult, levelsResult] = await Promise.all([
    adminClient.from('challenge_attempts').select('prompt_id, score').eq('user_id', user.id).not('submitted_at', 'is', null),
    adminClient.from('move_levels').select('move, xp').eq('user_id', user.id).order('xp', { ascending: true }),
  ])

  const completedIds = (attemptsResult.data ?? []).map((a: { prompt_id: string }) => a.prompt_id)
  const weakestMove = levelsResult.data?.[0]?.move ?? 'frame'

  // Select highest learning-impact challenge: uncompleted, targets weak move
  let query = adminClient
    .from('challenge_prompts')
    .select('id, title, prompt_text, difficulty, domain_id, move_tags')
    .eq('is_published', true)
    .contains('move_tags', [weakestMove])

  if (completedIds.length > 0) {
    query = query.not('id', 'in', `(${completedIds.join(',')})`)
  }

  const { data: challenge } = await query.limit(1).maybeSingle()

  if (!challenge) {
    return NextResponse.json({ error: 'No recommendation available' }, { status: 404 })
  }

  return NextResponse.json({
    challenge,
    luma_reason: `This challenge targets your ${weakestMove} skill, where I've seen the most room to grow based on your recent sessions.`,
  })
}
