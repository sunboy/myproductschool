import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { createCachedMessage } from '@/lib/anthropic/cached-client'

// XP base for quick-takes (lower than full challenges)
const QUICK_TAKE_XP_BASE = 20

const MOCK_RESPONSE = {
  score: 0.75,
  xp_earned: 15,
  feedback_summary: 'Good framing — you identified the key diagnostic signals. Consider prioritizing metric breakdowns earlier.',
}

/**
 * Grade a quick-take response with Haiku.
 * Returns a quality score from 0.0 to 1.0.
 * Cached system prompt keeps cost minimal (~$0.001 per call on cache hit).
 */
async function gradeWithHaiku(responseText: string, challengeTitle: string): Promise<{ score: number; feedback: string }> {
  const systemPrompt = `You are a product sense grader. Given a short quick-take response to a product challenge, evaluate quality on a 0.0–1.0 scale.

Scoring rubric:
- 0.8–1.0 (Sharp): Clear problem framing, specific insight, actionable reasoning
- 0.5–0.79 (Solid): Reasonable response but generic or missing specificity
- 0.2–0.49 (Surface): Vague or mostly restates the question
- 0.0–0.19 (Weak): Off-topic, too short, or no real thinking shown

Respond with valid JSON only: { "score": <number 0.0–1.0>, "feedback": "<one sentence>" }`

  const userContent = `Challenge: "${challengeTitle}"\n\nResponse: "${responseText}"`

  try {
    const msg = await createCachedMessage(systemPrompt, userContent, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = JSON.parse(text)
    return {
      score: Math.max(0, Math.min(1, Number(parsed.score) || 0)),
      feedback: parsed.feedback ?? 'Keep practising.',
    }
  } catch {
    // Fallback: length heuristic if AI call fails
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
    .select('title, move_tags')
    .eq('id', challenge_id)
    .eq('challenge_type', 'quick_take')
    .single()

  if (!challenge) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })

  // Grade with Haiku — quality score 0.0–1.0
  const { score, feedback } = await gradeWithHaiku(response_text, challenge.title ?? challenge_id)

  // XP = base * quality score
  const xp_earned = Math.round(QUICK_TAKE_XP_BASE * score)

  const primaryMove = challenge.move_tags?.[0] ?? 'frame'

  // Log session event (fire and forget)
  adminClient.from('session_events').insert({
    user_id: user.id,
    event_type: 'quick_take_submit',
    event_data: { challenge_id, move: primaryMove, score, xp_earned },
  }).then(() => {}, () => {})

  // Update move level XP (fire and forget)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/move-levels/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, scores: { [primaryMove]: Math.round(score * 10) } }),
  }).catch(() => {})

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
