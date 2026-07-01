import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildSkillContextPack, type SkillDiscipline } from '@/lib/hatch/skill-context'
import type { FlowMove } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

// Only recommend challenge types the FLOW workspace can actually render.
// quick_take has its own single-question surface (the workspace redirects it
// back to /challenges), freeform is unpublished, and claude_code_analytics is
// not in the workspace's rendered set. An allowlist (not a chain of .neq)
// keeps any future non-workspace type out of Hatch's Pick by default.
const WORKSPACE_TYPES = ['flow', 'system_design', 'data_modeling', 'sql', 'algorithm']

const MOCK_NEXT = {
  challenge: {
    id: 'mock-c1',
    slug: 'improve-retention-for-a-b2c-app',
    title: 'Improve Retention for a B2C App',
    prompt_text: 'Your B2C app has seen a 20% drop in 30-day retention. Diagnose the problem and propose a fix.',
    difficulty: 'intermediate',
    domain: { slug: 'retention', title: 'Retention', icon: 'trending_up' },
    move_tags: ['frame', 'list'],
  },
  reason: 'Targets your weakest move: Frame',
  targets_move: 'frame' as FlowMove,
  recommendation_type: 'weakest_move',
  hatch_insight: 'Your list move is at Level 1 - this challenge drills exactly that.',
}

// Generate a topic-based tip from challenge data (used when user is uncalibrated)
function topicTip(challenge: { title?: string; move_tags?: string[]; prompt_text?: string }, discipline: SkillDiscipline): string {
  const title = challenge.title ?? 'this challenge'
  const move = challenge.move_tags?.[0]
  const movePhrases: Record<string, string> = {
    frame: 'how to frame ambiguous problems',
    list: 'how to break down complex systems',
    optimize: 'how to evaluate trade-offs under uncertainty',
    win: 'how to communicate decisions to stakeholders',
  }
  const movePhrase = move ? movePhrases[move] ?? 'product thinking' : 'product thinking'
  return `Start with ${title}. It gives you a clean ${discipline} rep on ${movePhrase}.`
}

// Generate a move-targeted tip (used when user is calibrated)
function moveTip(move: string, challengeTitle: string, weakestCompetency: string | null): string {
  const tips: Record<string, string> = {
    frame: `Practice defining the right problem before jumping to solutions.`,
    list: `Work on breaking "${challengeTitle}" into its core components, this sharpens your List move.`,
    optimize: `This is a great exercise in trade-off thinking. Your Optimize move needs the most practice.`,
    win: `Focus on how you'd explain your reasoning to a stakeholder, then land a clear recommendation, success metric, and tradeoff.`,
  }
  if (weakestCompetency) {
    return `Use this next to work on ${weakestCompetency}. ${tips[move] ?? 'Keep the answer specific and action-oriented.'}`
  }
  return tips[move] ?? `This challenge targets your weakest move. Give it a shot.`
}

// Derive a 1-sentence Hatch insight based on the user's weakest FLOW move
function deriveHatchInsight(
  moveLevels: Array<{ move: string; level: number; progress_pct: number }>,
  weakestFlowMove: string | null
): string {
  if (!weakestFlowMove || !moveLevels.length) {
    return 'This challenge matches your current skill level.'
  }
  const moveEntry = moveLevels.find(m => m.move === weakestFlowMove)
  const level = moveEntry?.level ?? 1
  const moveLabels: Record<string, string> = {
    frame: 'Frame',
    list: 'List',
    optimize: 'Optimize',
    win: 'Win',
  }
  const label = moveLabels[weakestFlowMove] ?? weakestFlowMove
  return `Your ${label} move is at Level ${level}. This is the next useful rep.`
}

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json(MOCK_NEXT)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Fetch learner context alongside profile/levels/completions.
  const [{ data: profile }, { data: levels }, { data: completedAttempts }, skillPack] = await Promise.all([
    adminClient.from('profiles').select('preferred_role').eq('id', user.id).single(),
    adminClient.from('move_levels').select('move, xp').eq('user_id', user.id).order('xp', { ascending: true }).limit(1),
    adminClient.from('challenge_attempts').select('challenge_id').eq('user_id', user.id).eq('status', 'completed'),
    buildSkillContextPack({
      userId: user.id,
      surface: 'recommendation',
      includePracticeLink: false,
    }),
  ])

  const isCalibrated = (levels ?? []).length > 0 && (completedAttempts ?? []).length > 0
  const weakestMove: FlowMove = (levels?.[0]?.move as FlowMove) ?? 'frame'
  const completedIds = (completedAttempts ?? []).map((a: { challenge_id: string }) => a.challenge_id)

  // Derive weakest FLOW move from Hatch context move levels
  const hatchMoveLevels = skillPack.raw.moveLevels
  const weakestFlowMove = hatchMoveLevels.length > 0
    ? [...hatchMoveLevels].sort((a, b) => a.level - b.level)[0].move
    : null
  const hatch_insight = deriveHatchInsight(hatchMoveLevels, weakestFlowMove)

  // Fire-and-forget: persist the insight as a role_observation row
  adminClient.from('hatch_context').insert({
    user_id: user.id,
    context_type: 'role_observation',
    content: hatch_insight,
    is_active: true,
  }).then(() => {}, () => {})

  // Weakest-move SQL filter. Response embeddings are not part of the live launch schema.
  let query = adminClient
    .from('challenges')
    .select('id, slug, title, prompt_text, difficulty, domain_id, move_tags, relevant_roles, paradigm')
    .eq('is_published', true)
    .in('challenge_type', WORKSPACE_TYPES)
    .contains('move_tags', [weakestMove])

  if (completedIds.length > 0) {
    query = query.not('id', 'in', `(${completedIds.join(',')})`)
  }

  if (profile?.preferred_role) {
    query = query.or(`relevant_roles.cs.{"${profile.preferred_role}"},relevant_roles.eq.{}`)
  }

  const { data: challenge } = await query.limit(1).maybeSingle()

  if (!challenge) {
    const fallbackQuery = adminClient
      .from('challenges')
      .select('id, slug, title, prompt_text, difficulty, domain_id, move_tags, relevant_roles')
      .eq('is_published', true)
      .in('challenge_type', WORKSPACE_TYPES)

    const { data: fallback } = completedIds.length > 0
      ? await fallbackQuery.not('id', 'in', `(${completedIds.join(',')})`).limit(1).maybeSingle()
      : await fallbackQuery.limit(1).maybeSingle()

    if (!fallback) return NextResponse.json({ error: 'No challenges available' }, { status: 404 })

    return NextResponse.json({
      challenge: fallback,
      reason: 'A good place to start',
      tip: topicTip(fallback, skillPack.discipline),
      targets_move: weakestMove,
      recommendation_type: 'fallback',
      is_calibrated: isCalibrated,
      hatch_insight,
    })
  }

  return NextResponse.json({
    challenge,
    reason: isCalibrated
      ? `Targets ${skillPack.weakestCompetency ?? `${weakestMove.charAt(0).toUpperCase() + weakestMove.slice(1)} practice`}.`
      : `A good ${skillPack.discipline} place to start.`,
    tip: isCalibrated
      ? moveTip(weakestMove, challenge.title, skillPack.weakestCompetency)
      : topicTip(challenge, skillPack.discipline),
    targets_move: weakestMove,
    recommendation_type: 'weakest_move',
    is_calibrated: isCalibrated,
    hatch_insight,
  })
}
