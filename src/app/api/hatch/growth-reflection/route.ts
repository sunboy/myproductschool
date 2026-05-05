import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { getHatchContext, buildHatchContextString } from '@/lib/hatch-context'
import { HATCH_VOICE } from '@/lib/hatch/system-prompt'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { guardedCachedMessage } from '@/lib/ai/guarded-client'
import { AiBudgetExceededError, getUserPlanForBudget } from '@/lib/usage/ai-budget'

const MOCK_REFLECTION =
  "You've been showing strong diagnostic precision, your frame move is your biggest strength right now. Keep pushing your weigh move next, that's where your next level is hiding."

const MOCK_USER_ID = 'mock-user-id'

export async function POST() {
  // ── Auth ──────────────────────────────────────────────────────
  let userId: string
  let budgetUserId: string | null = null

  if (IS_MOCK) {
    return NextResponse.json({ reflection: MOCK_REFLECTION })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      userId = MOCK_USER_ID
    } else {
      userId = user.id
      budgetUserId = user.id
    }
  } catch {
    userId = MOCK_USER_ID
  }

  // ── Hatch context ─────────────────────────────────────────────
  const hatchCtx = await getHatchContext(userId)

  // ── Rate-limit check (7-day window) ──────────────────────────
  const admin = createAdminClient()
  let withinRateLimit = false

  try {
    const { data: lastAlert } = await admin
      .from('hatch_context')
      .select('created_at')
      .eq('user_id', userId)
      .eq('context_type', 'weakness_alert')
      .order('created_at', { ascending: false })
      .limit(1)

    if (lastAlert && lastAlert.length > 0) {
      const lastInsertMs = new Date(lastAlert[0].created_at).getTime()
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      withinRateLimit = Date.now() - lastInsertMs < sevenDaysMs
    }
  } catch {
    // Non-fatal: proceed without rate-limit enforcement
  }

  // ── Generate reflection ───────────────────────────────────────
  let reflection: string

  if (!process.env.ANTHROPIC_API_KEY) {
    const weakest = hatchCtx.weakestCompetency ?? 'your product thinking'
    reflection = `You're making steady progress. Focus on ${weakest} as your next growth area, it's where consistent practice will pay off most.`
  } else {
    try {
      const contextString = buildHatchContextString(hatchCtx, 'coaching')
      const userPrompt =
        contextString +
        '\n\nWrite a growth reflection for this learner. Use 2 short paragraphs: one naming a specific strength, one naming the specific growth area and what to do next. Keep each paragraph to 2 sentences. Use the learner\'s first name if known. Be direct and specific. No filler. Return JSON: {"reflection": "..."}'
      const budget = budgetUserId
        ? { userId: budgetUserId, userPlan: await getUserPlanForBudget(budgetUserId), route: 'hatch_growth_reflection' }
        : undefined

      const message = await guardedCachedMessage(
        `You are Hatch, a product thinking coach at HackProduct.\n\n${HATCH_VOICE}\n\nRespond only with a JSON object like: {"reflection": "..."}, no markdown, no extra text. The reflection value must use "\\n\\n" between the two paragraphs.`,
        userPrompt,
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          budget,
        }
      )

      const rawText = message.sanitized
      const parsed = JSON.parse(rawText)
      if (typeof parsed.reflection !== 'string' || !parsed.reflection.trim()) {
        throw new Error('Missing reflection in Hatch response')
      }
      reflection = parsed.reflection
    } catch (error) {
      if (error instanceof AiBudgetExceededError) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            feature: 'hatch_ai_cents',
            used: error.used,
            limit: error.limit,
            windowDays: error.windowDays,
          },
          { status: 402 }
        )
      }

      const weakest = hatchCtx.weakestCompetency ?? 'your product thinking'
      reflection = `You're making steady progress. Focus on ${weakest} as your next growth area, it's where consistent practice will pay off most.`
    }
  }

  // ── Persist to hatch_context (if outside 7-day window) ───────
  if (!withinRateLimit) {
    try {
      await admin.from('hatch_context').insert({
        user_id: userId,
        context_type: 'weakness_alert',
        content: reflection,
        is_active: true,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Non-fatal: return reflection anyway
    }
  }

  return NextResponse.json({ reflection })
}
