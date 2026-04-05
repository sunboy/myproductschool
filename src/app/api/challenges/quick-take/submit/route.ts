import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'

const MOCK_RESPONSE = {
  score: 7.5,
  move_delta: 15,
  xp_earned: 25,
  feedback_summary: 'Good framing — you identified the key diagnostic signals. Consider prioritizing metric breakdowns earlier.',
}

export async function POST(req: NextRequest) {
  if (IS_MOCK) {
    return NextResponse.json(MOCK_RESPONSE)
  }

  const { prompt_id, response_text } = await req.json()

  if (!prompt_id || !response_text?.trim()) {
    return NextResponse.json({ error: 'Missing prompt_id or response_text' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Get prompt to know which move to score
  const { data: prompt } = await adminClient
    .from('quick_take_prompts')
    .select('move')
    .eq('id', prompt_id)
    .single()

  if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })

  // Lightweight grading: score based on response length and basic heuristics
  // Real implementation would call Luma AI grading
  const wordCount = response_text.trim().split(/\s+/).length
  const score = Math.min(10, Math.max(1, Math.round(wordCount / 15)))
  const xp_earned = Math.round(score * 3)
  const move_delta = Math.round(score * 2)

  // Log session event (fire and forget)
  adminClient.from('session_events').insert({
    user_id: user.id,
    event_type: 'quick_take_submit',
    event_data: { prompt_id, move: prompt.move, score, xp_earned },
  }).then(() => {}, () => {})

  // Update move level XP (fire and forget)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/move-levels/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, scores: { [prompt.move]: score } }),
  }).catch(() => {})

  // Update streak (fire and forget)
  adminClient.rpc('update_user_streak', { p_user_id: user.id }).then(() => {}, () => {})

  return NextResponse.json({
    score,
    move_delta,
    xp_earned,
    feedback_summary: `Score: ${score}/10 — Keep refining your ${prompt.move} skills.`,
  })
}
