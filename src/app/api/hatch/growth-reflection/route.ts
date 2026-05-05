import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { IS_MOCK } from '@/lib/mock'
import { getHatchContext, buildHatchContextString } from '@/lib/hatch-context'
import { HATCH_VOICE } from '@/lib/hatch/system-prompt'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MOCK_REFLECTION =
  "You've been showing strong diagnostic precision — your frame move is your biggest strength right now. Keep pushing your weigh move next: that's where your next level unlock is hiding."

const MOCK_USER_ID = 'mock-user-id'

export async function POST(_req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────
  let userId: string

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
    reflection = `You're making steady progress. Focus on ${weakest} as your next growth area — it's where consistent practice will pay off most.`
  } else {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const contextString = buildHatchContextString(hatchCtx, 'coaching')
      const userPrompt =
        contextString +
        '\n\nWrite a growth reflection for this learner. Use 2 short paragraphs: one naming a specific strength, one naming the specific growth area and what to do next. Keep each paragraph to 2 sentences. Use the learner\'s first name if known. Be direct and specific. No filler. Return JSON: {"reflection": "..."}'

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system:
          `You are Hatch, a product thinking coach at HackProduct.\n\n${HATCH_VOICE}\n\nRespond only with a JSON object like: {"reflection": "..."} — no markdown, no extra text. The reflection value must use "\\n\\n" between the two paragraphs.`,
        messages: [{ role: 'user', content: userPrompt }],
      })

      const rawText =
        message.content[0].type === 'text' ? message.content[0].text : ''
      const parsed = JSON.parse(rawText)
      if (typeof parsed.reflection !== 'string' || !parsed.reflection.trim()) {
        throw new Error('Missing reflection in Claude response')
      }
      reflection = parsed.reflection
    } catch {
      const weakest = hatchCtx.weakestCompetency ?? 'your product thinking'
      reflection = `You're making steady progress. Focus on ${weakest} as your next growth area — it's where consistent practice will pay off most.`
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
