import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FlowMove } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const MOCK_NEXT = {
  challenge: {
    id: 'mock-c1',
    title: 'Improve Retention for a B2C App',
    prompt_text: 'Your B2C app has seen a 20% drop in 30-day retention. Diagnose the problem and propose a fix.',
    difficulty: 'intermediate',
    domain: { slug: 'retention', title: 'Retention', icon: 'trending_up' },
    move_tags: ['frame', 'list'],
  },
  reason: 'Targets your weakest move: Frame',
  targets_move: 'frame' as FlowMove,
  recommendation_type: 'weakest_move',
}

// Generate a topic-based tip from challenge data (used when user is uncalibrated)
function topicTip(challenge: { title?: string; move_tags?: string[]; prompt_text?: string }): string {
  const title = challenge.title ?? 'this challenge'
  const move = challenge.move_tags?.[0]
  const movePhrases: Record<string, string> = {
    frame: 'how to frame ambiguous problems',
    list: 'how to break down complex systems',
    weigh: 'how to evaluate trade-offs under uncertainty',
    sell: 'how to communicate decisions to stakeholders',
  }
  const movePhrase = move ? movePhrases[move] ?? 'product thinking' : 'product thinking'
  return `This challenge teaches you ${movePhrase}. Give it a try — no prior scores needed.`
}

// Generate a move-targeted tip (used when user is calibrated)
function moveTip(move: string, challengeTitle: string): string {
  const tips: Record<string, string> = {
    frame: `Practice defining the right problem before jumping to solutions.`,
    list: `Work on breaking "${challengeTitle}" into its core components — this sharpens your List move.`,
    weigh: `This is a great exercise in trade-off thinking — your Weigh move needs the most practice.`,
    sell: `Focus on how you'd explain your reasoning to a stakeholder — that's your growth area.`,
  }
  return tips[move] ?? `This challenge targets your weakest move. Give it a shot.`
}

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json(MOCK_NEXT)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Fetch profile, weakest move, and completed IDs in parallel
  const [{ data: profile }, { data: levels }, { data: completedAttempts }] = await Promise.all([
    adminClient.from('profiles').select('preferred_role').eq('id', user.id).single(),
    adminClient.from('move_levels').select('move, xp').eq('user_id', user.id).order('xp', { ascending: true }).limit(1),
    adminClient.from('challenge_attempts').select('prompt_id').eq('user_id', user.id).not('submitted_at', 'is', null),
  ])

  const isCalibrated = (levels ?? []).length > 0 && (completedAttempts ?? []).length > 0
  const weakestMove: FlowMove = (levels?.[0]?.move as FlowMove) ?? 'frame'
  const completedIds = (completedAttempts ?? []).map((a: { prompt_id: string }) => a.prompt_id)

  // Try semantic novelty path: get user's last 5 response embeddings and compute centroid
  const { data: recentEmbeddings } = await adminClient
    .from('challenge_attempts')
    .select('response_embedding')
    .eq('user_id', user.id)
    .not('response_embedding', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(5)

  if (recentEmbeddings && recentEmbeddings.length >= 3) {
    // Compute centroid of recent response embeddings
    const vecs = recentEmbeddings.map((r: { response_embedding: number[] }) => r.response_embedding)
    const dims = vecs[0].length
    const centroid = Array.from({ length: dims }, (_, i) =>
      vecs.reduce((sum, v) => sum + v[i], 0) / vecs.length
    )

    // Find semantically novel challenges (outside comfort zone)
    const { data: novelChallenges } = await adminClient.rpc('match_novel_challenges', {
      user_centroid: JSON.stringify(centroid),
      exclude_ids: completedIds.length > 0 ? completedIds : [],
      match_count: 5,
    })

    if (novelChallenges && novelChallenges.length > 0) {
      const weakestFirst = novelChallenges.find(
        (c: { move_tags: string[] }) => c.move_tags?.includes(weakestMove)
      ) ?? novelChallenges[0]

      return NextResponse.json({
        challenge: weakestFirst,
        reason: `Luma picked this to push you outside your thinking comfort zone`,
        tip: topicTip(weakestFirst),
        targets_move: weakestMove,
        recommendation_type: 'semantic_novelty',
        is_calibrated: isCalibrated,
      })
    }
  }

  // Fallback: weakest-move SQL filter (no embeddings yet)
  let query = adminClient
    .from('challenge_prompts')
    .select('id, title, prompt_text, difficulty, domain_id, move_tags, role_tags, paradigm')
    .eq('is_published', true)
    .contains('move_tags', [weakestMove])

  if (completedIds.length > 0) {
    query = query.not('id', 'in', `(${completedIds.join(',')})`)
  }

  if (profile?.preferred_role) {
    query = query.or(`role_tags.cs.{"${profile.preferred_role}"},role_tags.eq.{}`)
  }

  const { data: challenge } = await query.limit(1).maybeSingle()

  if (!challenge) {
    const fallbackQuery = adminClient
      .from('challenge_prompts')
      .select('id, title, prompt_text, difficulty, domain_id, move_tags, role_tags')
      .eq('is_published', true)

    const { data: fallback } = completedIds.length > 0
      ? await fallbackQuery.not('id', 'in', `(${completedIds.join(',')})`).limit(1).maybeSingle()
      : await fallbackQuery.limit(1).maybeSingle()

    if (!fallback) return NextResponse.json({ error: 'No challenges available' }, { status: 404 })

    return NextResponse.json({
      challenge: fallback,
      reason: 'A good place to start',
      tip: topicTip(fallback),
      targets_move: weakestMove,
      recommendation_type: 'fallback',
      is_calibrated: isCalibrated,
    })
  }

  return NextResponse.json({
    challenge,
    reason: isCalibrated
      ? `Targets your weakest move: ${weakestMove.charAt(0).toUpperCase() + weakestMove.slice(1)}`
      : 'A good place to start',
    tip: isCalibrated
      ? moveTip(weakestMove, challenge.title)
      : topicTip(challenge),
    targets_move: weakestMove,
    recommendation_type: 'weakest_move',
    is_calibrated: isCalibrated,
  })
}
