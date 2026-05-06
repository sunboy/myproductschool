import { NextRequest, NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { getHatchContext, buildHatchContextString } from '@/lib/hatch-context'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { PlanLimitExceeded, assertPlanLimit } from '@/lib/usage/assert-plan-limit'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'

const ROUTE_KEY = 'personalised_study_plan_generate'

function retryAfterSeconds(resetAt: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

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

interface ChallengeLite {
  id: string
  title: string
  tags: string[]
  challenge_type: string | null
  difficulty?: string | null
  relevant_roles?: string[] | null
}

// ── Mock data ─────────────────────────────────────────────────

const MOCK_PLAN = {
  id: 'mock-plan-001',
  title: '4-Week Builder Sprint',
  hatch_rationale:
    'Hatch is balancing your weakest FLOW move with a full-stack skill surface: product judgment, system design, data modeling, SQL, and coding.',
  move_sequence: [
    {
      week: 1,
      focus_move: 'frame',
      challenge_ids: ['c1-notification-fatigue', 'c2-spotify-podcasts'],
      theme: 'Product sense: frame the user and business problem',
    },
    {
      week: 2,
      focus_move: 'list',
      challenge_ids: ['c3-airbnb-trust', 'c4-uber-safety'],
      theme: 'Systems and data: enumerate components, grain, and edge cases',
    },
    {
      week: 3,
      focus_move: 'optimize',
      challenge_ids: ['c5-slack-threads', 'c6-netflix-discovery'],
      theme: 'SQL and coding: optimize for correctness, cost, and speed',
    },
    {
      week: 4,
      focus_move: 'win',
      challenge_ids: ['c7-twitter-retention'],
      theme: 'Interview pressure: explain decisions under follow-up',
    },
  ],
  status: 'active',
}

// ── Fallback plan builder ─────────────────────────────────────

function buildFallbackPlan(
  weakestMove: string,
  challenges: ChallengeLite[],
  preferredRole: string | null
): StudyPlanShape {
  const rolePriority: Record<string, string[]> = {
    swe: ['algorithm', 'system_design', 'product_sense', 'sql'],
    data_eng: ['sql', 'data_modeling', 'system_design', 'product_sense'],
    ml_eng: ['system_design', 'data_modeling', 'product_sense', 'sql'],
    devops: ['system_design', 'algorithm', 'product_sense', 'data_modeling'],
    em: ['product_sense', 'system_design', 'data_modeling', 'sql'],
    founding_eng: ['product_sense', 'algorithm', 'sql', 'system_design'],
    tech_lead: ['system_design', 'product_sense', 'data_modeling', 'algorithm'],
    pm: ['product_sense', 'sql', 'system_design', 'data_modeling'],
    designer: ['product_sense', 'data_modeling', 'sql', 'system_design'],
    data_scientist: ['sql', 'data_modeling', 'product_sense', 'algorithm'],
  }
  const productTypes = new Set(['flow', 'freeform', 'quick_take', 'product_sense'])
  const priority = rolePriority[preferredRole ?? ''] ?? ['product_sense', 'system_design', 'data_modeling', 'sql', 'algorithm']
  const disciplineOrder = Array.from(new Set([...priority, 'product_sense', 'system_design', 'data_modeling', 'sql', 'algorithm']))
  const moveOrder = Array.from(new Set([weakestMove, 'frame', 'list', 'optimize', 'win'])).filter(move => ['frame', 'list', 'optimize', 'win'].includes(move))
  const disciplineLabel: Record<string, string> = {
    product_sense: 'Product sense',
    system_design: 'System design',
    data_modeling: 'Data modeling',
    sql: 'SQL',
    algorithm: 'Coding',
  }

  function matchesDiscipline(challenge: ChallengeLite, discipline: string) {
    if (discipline === 'product_sense') return productTypes.has(challenge.challenge_type ?? '')
    return challenge.challenge_type === discipline
  }

  const used = new Set<string>()
  const fallbackIds = challenges.map(challenge => challenge.id)

  function pickForDiscipline(discipline: string) {
    const candidates = challenges.filter(challenge => matchesDiscipline(challenge, discipline) && !used.has(challenge.id))
    const picked: string[] = []
    for (const challenge of candidates) {
      picked.push(challenge.id)
      if (picked.length >= 2) break
    }
    if (picked.length < 2) {
      for (const id of fallbackIds) {
        if (!used.has(id)) {
          picked.push(id)
          if (picked.length >= 2) break
        }
      }
    }
    picked.forEach(id => used.add(id))
    return picked
  }

  return {
    title: '4-Week Builder Sprint',
    hatch_rationale: `Hatch is prioritizing your ${weakestMove} move while still rotating through the disciplines your role needs: product, systems, data, SQL, and coding. The goal is steady improvement without unfocused practice.`,
    move_sequence: disciplineOrder.slice(0, 4).map((discipline, i) => ({
      week: i + 1,
      focus_move: moveOrder[i % moveOrder.length] ?? weakestMove,
      challenge_ids: pickForDiscipline(discipline),
      theme: `${disciplineLabel[discipline] ?? 'Core skills'}: ${moveOrder[i % moveOrder.length] ?? weakestMove} under realistic constraints`,
    })),
  }
}

// ── Validate generated response shape ────────────────────────

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
      return apiError(401, 'auth_required', 'Unauthorized')
    }
    userId = user.id
  } catch {
    return apiError(401, 'auth_required', 'Unauthorized')
  }

  // ── Parse body ────────────────────────────────────────────
  let force = false
  try {
    const body = await req.json()
    force = Boolean(body?.force)
  } catch {
    // No body or invalid JSON; treat as force=false
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
      // No active plan found; proceed to generate
    }
  }

  const userPlan = await getUserPlanForBudget(userId)
  if (process.env.ANTHROPIC_API_KEY) {
    const throttle = await rateLimit({
      key: `ai:${userId}:${ROUTE_KEY}`,
      limit: userPlan === 'pro' ? 15 : 5,
      windowSec: 60,
    })

    if (!throttle.allowed) {
      const retryAfter = retryAfterSeconds(throttle.resetAt)
      const response = apiError(429, 'rate_limited', 'rate_limited', { retryAfter })
      response.headers.set('Retry-After', String(retryAfter))
      return response
    }

    try {
      await assertPlanLimit(userId, userPlan, 'hatch_chat_msgs')
    } catch (error) {
      if (error instanceof PlanLimitExceeded) {
        return apiError(402, 'limit_reached', 'limit_reached', {
          feature: error.feature,
          used: error.used,
          limit: error.limit,
          windowDays: error.windowDays,
        })
      }
      throw error
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
      // Non-fatal; proceed even if archiving fails
    }
  }

  // ── Fetch Hatch context + available challenges ────────────
  const [hatchCtx, challengesResult] = await Promise.all([
    getHatchContext(userId),
    admin
      .from('challenges')
      .select('id, title, tags, challenge_type, difficulty, relevant_roles')
      .eq('is_published', true)
      .limit(40),
  ])

  const availableChallenges = (challengesResult.data ?? []) as ChallengeLite[]

  // Derive weakest FLOW move
  const weakestFlowMove =
    hatchCtx.moveLevels.length > 0
      ? [...hatchCtx.moveLevels].sort((a, b) => a.level - b.level)[0].move
      : 'frame'

  // ── Generate plan via Hatch ───────────────────────────────
  let generatedPlan: StudyPlanShape | null = null

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const contextString = buildHatchContextString(hatchCtx, 'coaching')
      const challengeList = availableChallenges
        .map((c) => `${c.id} - "${c.title}" [type: ${c.challenge_type ?? 'unknown'}; difficulty: ${c.difficulty ?? 'unknown'}; roles: ${(c.relevant_roles ?? []).join(', ') || 'any'}; tags: ${(c.tags ?? []).join(', ')}]`)
        .join('\n')
      const preferredRole = hatchCtx.preferredRole ?? 'not specified'

      const userPrompt = [
        contextString,
        '',
        'Available challenges:',
        challengeList,
        '',
        `Preferred role: ${preferredRole}.`,
        'Generate a personalised 4-week HackProduct study plan for this learner based on their role, FLOW move levels, competency scores, and recent patterns.',
        'The plan must cover multiple disciplines, not only product sense. Rotate intelligently across product sense, system design, data modeling, SQL, and coding based on role fit and weak signals.',
        'For each week, choose 1-2 challenges. Prefer role-relevant challenges, but keep at least three distinct challenge_type families across the full plan when available.',
        'Use Hatch\'s product philosophy: maximize learning quality and career lift while avoiding unfocused practice.',
        'Return JSON only: { "title": string, "hatch_rationale": string, "move_sequence": [{ "week": number, "focus_move": string, "challenge_ids": string[], "theme": string }] }',
        'Use only challenge_ids from the list above. focus_move must be one of frame, list, optimize, win. Each week should have 1-2 challenge_ids.',
      ].join('\n')

      const message = await guardedCachedMessage(
        'You are Hatch. Respond only with a JSON object, no markdown.',
        userPrompt,
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          budget: { userId, userPlan, route: ROUTE_KEY },
        }
      )

      const rawText = message.sanitized
      const parsed: unknown = JSON.parse(rawText)
      if (isValidPlan(parsed)) {
        generatedPlan = parsed
      }
    } catch (error) {
      if (error instanceof AiBudgetExceededError) {
        return apiError(402, 'limit_reached', 'limit_reached', {
          feature: 'hatch_ai_cents',
          used: error.used,
          limit: error.limit,
          windowDays: error.windowDays,
        })
      }

      // Fall through to deterministic fallback
    }
  }

  // ── Deterministic fallback ────────────────────────────────
  if (!generatedPlan) {
    generatedPlan = buildFallbackPlan(weakestFlowMove, availableChallenges, hatchCtx.preferredRole)
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
