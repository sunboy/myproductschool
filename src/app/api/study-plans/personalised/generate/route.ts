import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { IS_MOCK } from '@/lib/mock'
import { getHatchContext, buildHatchContextString } from '@/lib/hatch-context'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Types ─────────────────────────────────────────────────────

interface MoveWeek {
  week: number
  focus_move: string
  challenge_ids: string[]
  theme: string
}

interface StudyPlanShape {
  title: string
  hatch_rationale: string
  move_sequence: MoveWeek[]
}

// ── Mock data ─────────────────────────────────────────────────

const MOCK_PLAN = {
  id: 'mock-plan-001',
  title: '4-Week List Move Bootcamp',
  hatch_rationale:
    'Your list move is at Level 1 — the weakest in your FLOW. This plan sequences 4 challenges that drill breakdown thinking, from structured decomposition to user segmentation.',
  move_sequence: [
    {
      week: 1,
      focus_move: 'list',
      challenge_ids: ['c1-notification-fatigue', 'c2-spotify-podcasts'],
      theme: 'Problem decomposition',
    },
    {
      week: 2,
      focus_move: 'list',
      challenge_ids: ['c3-airbnb-trust', 'c4-uber-safety'],
      theme: 'User segmentation',
    },
    {
      week: 3,
      focus_move: 'weigh',
      challenge_ids: ['c5-slack-threads', 'c6-netflix-discovery'],
      theme: 'Trade-off analysis',
    },
    {
      week: 4,
      focus_move: 'sell',
      challenge_ids: ['c7-twitter-retention'],
      theme: 'Stakeholder communication',
    },
  ],
  status: 'active',
}

// ── Fallback plan builder ─────────────────────────────────────

function buildFallbackPlan(
  weakestMove: string,
  challengeIds: string[]
): StudyPlanShape {
  const moveThemes: Record<string, string[]> = {
    frame: ['Problem framing', 'Root cause analysis', 'Opportunity sizing', 'North star clarity'],
    list: ['Problem decomposition', 'User segmentation', 'Feature breakdown', 'System mapping'],
    weigh: ['Trade-off analysis', 'Prioritisation frameworks', 'Risk evaluation', 'Stakeholder impact'],
    sell: ['Stakeholder communication', 'Narrative building', 'Exec alignment', 'Influence without authority'],
  }
  const themes = moveThemes[weakestMove] ?? ['Core skills', 'Applied thinking', 'Advanced framing', 'Synthesis']
  const chunks = [0, 2, 4, 6].map((start) => challengeIds.slice(start, start + 2))

  return {
    title: `4-Week ${weakestMove.charAt(0).toUpperCase() + weakestMove.slice(1)} Move Bootcamp`,
    hatch_rationale: `Your ${weakestMove} move needs the most work right now. This plan sequences challenges to build that specific skill progressively.`,
    move_sequence: themes.slice(0, 4).map((theme, i) => ({
      week: i + 1,
      focus_move: weakestMove,
      challenge_ids: chunks[i] ?? [],
      theme,
    })),
  }
}

// ── Validate Claude response shape ───────────────────────────

function isValidPlan(obj: unknown): obj is StudyPlanShape {
  if (!obj || typeof obj !== 'object') return false
  const p = obj as Record<string, unknown>
  return (
    typeof p.title === 'string' &&
    typeof p.hatch_rationale === 'string' &&
    Array.isArray(p.move_sequence) &&
    p.move_sequence.every(
      (w: unknown) =>
        w &&
        typeof w === 'object' &&
        typeof (w as Record<string, unknown>).week === 'number' &&
        typeof (w as Record<string, unknown>).focus_move === 'string' &&
        Array.isArray((w as Record<string, unknown>).challenge_ids) &&
        typeof (w as Record<string, unknown>).theme === 'string'
    )
  )
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Mock short-circuit ────────────────────────────────────
  if (IS_MOCK) {
    return NextResponse.json({ plan: MOCK_PLAN })
  }

  // ── Auth ──────────────────────────────────────────────────
  let userId: string
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = user.id
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ────────────────────────────────────────────
  let force = false
  try {
    const body = await req.json()
    force = Boolean(body?.force)
  } catch {
    // No body or invalid JSON — treat as force=false
  }

  const admin = createAdminClient()

  // ── Check for existing active plan (unless force=true) ────
  if (!force) {
    try {
      const { data: existing } = await admin
        .from('user_study_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (existing) {
        return NextResponse.json({ plan: existing })
      }
    } catch {
      // No active plan found — proceed to generate
    }
  }

  // ── Archive existing active plan if force=true ────────────
  if (force) {
    try {
      await admin
        .from('user_study_plans')
        .update({ status: 'archived' })
        .eq('user_id', userId)
        .eq('status', 'active')
    } catch {
      // Non-fatal — proceed even if archiving fails
    }
  }

  // ── Fetch Hatch context + available challenges ────────────
  const [hatchCtx, challengesResult] = await Promise.all([
    getHatchContext(userId),
    admin
      .from('challenges')
      .select('id, title, tags')
      .eq('is_published', true)
      .limit(20),
  ])

  const availableChallenges = (challengesResult.data ?? []) as Array<{
    id: string
    title: string
    tags: string[]
  }>
  const challengeIds = availableChallenges.map((c) => c.id)

  // Derive weakest FLOW move
  const weakestFlowMove =
    hatchCtx.moveLevels.length > 0
      ? [...hatchCtx.moveLevels].sort((a, b) => a.level - b.level)[0].move
      : 'frame'

  // ── Generate plan via Claude ──────────────────────────────
  let generatedPlan: StudyPlanShape | null = null

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const contextString = buildHatchContextString(hatchCtx, 'coaching')
      const challengeList = availableChallenges
        .map((c) => `${c.id} — "${c.title}" [tags: ${(c.tags ?? []).join(', ')}]`)
        .join('\n')

      const userPrompt = [
        contextString,
        '',
        'Available challenges:',
        challengeList,
        '',
        'Generate a personalised 4-week study plan for this learner based on their FLOW move levels and competency scores.',
        'Return JSON only: { "title": string, "hatch_rationale": string, "move_sequence": [{ "week": number, "focus_move": string, "challenge_ids": string[], "theme": string }] }',
        'Use only challenge_ids from the list above. Each week should have 1-2 challenge_ids.',
      ].join('\n')

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: 'You are Hatch. Respond only with a JSON object, no markdown.',
        messages: [{ role: 'user', content: userPrompt }],
      })

      const rawText =
        message.content[0].type === 'text' ? message.content[0].text : ''
      const parsed: unknown = JSON.parse(rawText)
      if (isValidPlan(parsed)) {
        generatedPlan = parsed
      }
    } catch {
      // Fall through to deterministic fallback
    }
  }

  // ── Deterministic fallback ────────────────────────────────
  if (!generatedPlan) {
    generatedPlan = buildFallbackPlan(weakestFlowMove, challengeIds)
  }

  // ── Insert into user_study_plans ──────────────────────────
  const contextSnapshot = {
    overallLevel: hatchCtx.overallLevel,
    weakestCompetency: hatchCtx.weakestCompetency,
    moveLevels: hatchCtx.moveLevels,
    preferredRole: hatchCtx.preferredRole,
  }

  const { data: inserted, error: insertError } = await admin
    .from('user_study_plans')
    .insert({
      user_id: userId,
      title: generatedPlan.title,
      hatch_rationale: generatedPlan.hatch_rationale,
      move_sequence: generatedPlan.move_sequence,
      status: 'active',
      context_snapshot: contextSnapshot,
    })
    .select()
    .single()

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: 'Failed to save plan', detail: insertError?.message },
      { status: 500 }
    )
  }

  // ── Persist plan_progress to hatch_context (fire-and-forget) ──
  admin
    .from('hatch_context')
    .insert({
      user_id: userId,
      context_type: 'plan_progress',
      content: `Generated personalised plan: ${generatedPlan.title}`,
      is_active: true,
    })
    .then(() => {}, () => {})

  return NextResponse.json({ plan: inserted })
}
