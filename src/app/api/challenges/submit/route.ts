import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/data/events'
import type { FlowMove } from '@/lib/types'

// XP per score (0-10 scale)
function xpForScore(score: number): number {
  if (score <= 2) return 5
  if (score === 3) return 10
  if (score <= 6) return 20
  return 30
}

// Map Luma 4 dimensions → FLOW move scores (0-10 scale)
function computeFlowScores(dimensions: Array<{ dimension: string; score: number }>): Record<FlowMove, number> {
  const get = (dim: string) => dimensions.find(d => d.dimension === dim)?.score ?? 0
  const framing    = get('framing_precision')
  const diagnostic = get('diagnostic_accuracy')
  const metric     = get('metric_fluency')
  const recommend  = get('recommendation_strength')

  return {
    frame:    framing,
    list:     Math.round(diagnostic * 0.7 + metric * 0.3),
    optimize: Math.round(recommend * 0.7 + metric * 0.3),
    win:      recommend,
  }
}

export async function POST(req: NextRequest) {
  const { challengeId, mode, response } = await req.json()

  if (!challengeId || !mode || !response?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json({ attemptId: 'mock' })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Check free tier daily limit — fetch plan and today's attempt count in parallel
  const today = new Date().toISOString().split('T')[0]
  const [{ data: profile }, { count }] = await Promise.all([
    adminClient.from('profiles').select('plan').eq('id', user.id).single(),
    adminClient.from('challenge_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today),
  ])
  if (profile?.plan !== 'pro' && (count ?? 0) >= 3) {
    return NextResponse.json({ error: 'Daily limit reached', upgrade_url: '/pricing' }, { status: 403 })
  }

  // Fetch challenge metadata for grading
  const { data: challenge } = await adminClient
    .from('challenge_prompts')
    .select('title, prompt_text')
    .eq('id', challengeId)
    .single()

  const { data, error } = await supabase.from('challenge_attempts').insert({
    user_id: user.id,
    prompt_id: challengeId,
    mode,
    response_text: response,
    submitted_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })

  const attemptId = data.id

  // Log session scored event
  logEvent(user.id, 'session.scored', { challenge_id: challengeId, mode, attempt_id: attemptId })

  // Update streak (fire and forget)
  adminClient.rpc('update_user_streak', { p_user_id: user.id }).then(() => {}, () => {})

  // Trigger achievement check (fire and forget)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/achievements/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, event_type: 'challenge_count', event_value: 1 }),
  }).catch(() => {})

  // Run Luma grading and persist results (async — grading page polls for completion)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ;(async () => {
    try {
      const feedbackRes = await fetch(`${appUrl}/api/luma/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          challengeTitle: challenge?.title ?? '',
          challengePrompt: challenge?.prompt_text ?? '',
          response,
          userId: user.id,
          attemptId,
        }),
      })

      if (!feedbackRes.ok) return

      const feedbackData = await feedbackRes.json()
      if (!feedbackData?.dimensions) return

      // Compute overall score (average of dimensions scaled to 0-100)
      const avgScore = feedbackData.dimensions.reduce((sum: number, d: { score: number }) => sum + d.score, 0) / feedbackData.dimensions.length
      const overallScore = Math.round(avgScore * 10) // 0-10 → 0-100

      // Compute XP from all 4 dimension scores
      const totalXp = feedbackData.dimensions.reduce((sum: number, d: { score: number }) => sum + xpForScore(d.score), 0)

      // Check if user dodged a previously-triggered pattern for bonus XP
      const detectedPatternIds = (feedbackData.detected_patterns ?? []).map((p: { pattern_id: string }) => p.pattern_id)
      let bonusXp = 0
      if (detectedPatternIds.length > 0) {
        const { data: priorPatterns } = await adminClient
          .from('user_failure_patterns')
          .select('pattern_id')
          .eq('user_id', user.id)
          .neq('attempt_id', attemptId)
          .in('pattern_id', detectedPatternIds)
        // Patterns previously triggered but NOT in current attempt = dodged
        const previousPatternIds = new Set((priorPatterns ?? []).map((p: { pattern_id: string }) => p.pattern_id))
        const dodgedCount = [...previousPatternIds].filter(id => !detectedPatternIds.includes(id)).length
        bonusXp = dodgedCount * 10
      }

      const xpEarned = totalXp + bonusXp

      // Persist feedback_json, score, and xp back to attempt
      await adminClient
        .from('challenge_attempts')
        .update({
          feedback_json: feedbackData,
          score: overallScore,
        })
        .eq('id', attemptId)

      // Update user XP (read-modify-write)
      const { data: currentProfile } = await adminClient.from('profiles').select('xp_total').eq('id', user.id).single()
      if (currentProfile) {
        await adminClient.from('profiles').update({ xp_total: (currentProfile.xp_total ?? 0) + xpEarned }).eq('id', user.id)
      }

      // Update FLOW move levels
      const flowScores = computeFlowScores(feedbackData.dimensions)
      fetch(`${appUrl}/api/move-levels/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, scores: flowScores }),
      }).catch(() => {})

      logEvent(user.id, 'session.graded', { attempt_id: attemptId, score: overallScore, xp_earned: xpEarned })
    } catch (err) {
      console.error('[submit] Grading pipeline error:', err)
    }
  })()

  return NextResponse.json({ attemptId })
}
