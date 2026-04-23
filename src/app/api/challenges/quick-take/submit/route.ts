import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import { applyMoveLevelXp } from '@/lib/data/move-levels-update'

// XP base for quick-takes (lower than full challenges)
const QUICK_TAKE_XP_BASE = 20

const MOCK_RESPONSE = {
  score: 0.75,
  xp_earned: 15,
  feedback_summary: 'Good framing — you identified the key diagnostic signals. Consider prioritizing metric breakdowns earlier.',
}

/**
 * Grade a quick-take response with Haiku.
 * Returns a quality score 0.0–1.0 and structured coaching feedback.
 */
async function gradeWithHaiku(responseText: string, promptText: string): Promise<{ score: number; feedback: string }> {
  const systemPrompt = `You are Luma, a product thinking coach. Grade a quick-take response and give direct, specific coaching.

Never use em dashes. Short sentences. No filler like "Great job" or "Certainly". Be honest — don't soften weak answers.

Scoring:
- 0.8–1.0 (Sharp): Frames the problem clearly, names a specific diagnosis or insight, shows reasoning not just description
- 0.5–0.79 (Solid): On track but generic — missing a specific metric, user segment, or concrete next step
- 0.2–0.49 (Surface): Restates the question or lists obvious things without real analysis
- 0.0–0.19 (Weak): Too short, off-topic, or shows no product reasoning

Return valid JSON only:
{
  "score": <0.0–1.0>,
  "what_worked": "<one sentence on the strongest part of their answer, or null if nothing worked>",
  "what_to_improve": "<one concrete, specific thing they should add or change>",
  "example_move": "<a short example of the sharper thinking move they should make>"
}`

  const userContent = `Challenge prompt: "${promptText}"\n\nUser's response: "${responseText}"`

  try {
    const msg = await createCachedMessage(systemPrompt, userContent, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    // Strip markdown code fences if model wraps output
    const text = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(text)
    const score = Math.max(0, Math.min(1, Number(parsed.score) || 0))

    // Build feedback string from structured fields
    const parts: string[] = []
    if (parsed.what_worked && parsed.what_worked !== 'null') parts.push(parsed.what_worked)
    if (parsed.what_to_improve) parts.push(parsed.what_to_improve)
    if (parsed.example_move) parts.push(`Try: ${parsed.example_move}`)

    return {
      score,
      feedback: parts.join('\n\n') || 'Keep practising.',
    }
  } catch (err) {
    console.error('[quick-take] grading error:', err)
    const wordCount = responseText.trim().split(/\s+/).length
    return {
      score: Math.min(1, wordCount / 100),
      feedback: 'Keep practising.',
    }
  }
}

export async function POST(req: NextRequest) {
  if (IS_MOCK) {
    return NextResponse.json(MOCK_RESPONSE)
  }

  const { challenge_id, response_text } = await req.json()

  if (!challenge_id || !response_text?.trim()) {
    return NextResponse.json({ error: 'Missing challenge_id or response_text' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Fetch challenge for move tags and title
  const { data: challenge } = await adminClient
    .from('challenges')
    .select('title, prompt_text, move_tags')
    .eq('id', challenge_id)
    .eq('challenge_type', 'quick_take')
    .single()

  if (!challenge) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })

  // Grade with Haiku — quality score 0.0–1.0
  const { score, feedback } = await gradeWithHaiku(response_text, challenge.prompt_text ?? challenge.title ?? challenge_id)

  // XP = base * quality score
  const xp_earned = Math.round(QUICK_TAKE_XP_BASE * score)

  const primaryMove = challenge.move_tags?.[0] ?? 'frame'

  // Record attempt so "unattempted" filtering works for next-question routing
  adminClient.from('challenge_attempts').insert({
    user_id: user.id,
    challenge_id,
    mode: 'quick-take',
    status: 'completed',
    completed_at: new Date().toISOString(),
    total_score: score,
    max_score: 1,
    grade_label: score >= 0.8 ? 'Sharp' : score >= 0.5 ? 'Solid' : score >= 0.2 ? 'Surface' : 'Weak',
    feedback_json: { feedback, xp_earned, move: primaryMove },
  }).then(() => {}, () => {})

  // Log session event (fire and forget)
  adminClient.from('session_events').insert({
    user_id: user.id,
    event_type: 'quick_take_submit',
    event_data: { challenge_id, move: primaryMove, score, xp_earned },
  }).then(() => {}, () => {})

  await applyMoveLevelXp(user.id, { [primaryMove]: Math.round(score * 10) }, 'quick-take')

  // Award XP to profile (fire and forget)
  adminClient
    .from('profiles')
    .select('xp_total')
    .eq('id', user.id)
    .single()
    .then(({ data }) => {
      if (data) {
        adminClient
          .from('profiles')
          .update({ xp_total: (data.xp_total ?? 0) + xp_earned })
          .eq('id', user.id)
          .then(() => {}, () => {})
      }
    })

  // Update streak (fire and forget)
  adminClient.rpc('update_user_streak', { p_user_id: user.id }).then(() => {}, () => {})

  return NextResponse.json({ score, xp_earned, feedback_summary: feedback })
}
