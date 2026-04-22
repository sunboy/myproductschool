import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5'), 20)
  const includePatterns = searchParams.get('include_patterns') === 'true'

  const admin = createAdminClient()
  const { data } = await admin
    .from('challenge_attempts')
    .select('id, challenge_id, grade_label, total_score, max_score, completed_at, feedback_json, challenges(title)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data ?? [] as any[]

  // For attempts missing feedback_json, reconstruct step_breakdown from step_attempts
  const missingFeedbackIds = rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((r: any) => !r.feedback_json)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => r.id as string)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attemptIds = rows.map((r: any) => r.id as string)
  const attemptIdToChallengeId = new Map<string, string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows.map((row: any) => [row.id as string, row.challenge_id as string])
  )

  const [stepAttemptRows, patternRows] = await Promise.all([
    missingFeedbackIds.length > 0
      ? admin.from('step_attempts').select('attempt_id, step, score').in('attempt_id', missingFeedbackIds).then(r => r.data ?? [])
      : Promise.resolve([]),
    includePatterns && rows.length > 0
      ? admin.from('user_failure_patterns').select('attempt_id, pattern_name, created_at').eq('user_id', user.id).in('attempt_id', attemptIds).order('created_at', { ascending: false }).then(r => r.data ?? [])
      : Promise.resolve([]),
  ])

  const stepScoreMap = new Map<string, Array<{ step: string; score: number; max_score: number }>>()
  if (stepAttemptRows.length > 0) {
    const rawMap = new Map<string, Map<string, number[]>>()
    for (const sa of stepAttemptRows) {
      const aId = sa.attempt_id as string
      if (!rawMap.has(aId)) rawMap.set(aId, new Map())
      const stepMap = rawMap.get(aId)!
      const existing = stepMap.get(sa.step as string) ?? []
      existing.push(sa.score as number ?? 0)
      stepMap.set(sa.step as string, existing)
    }
    for (const [aId, stepMap] of rawMap.entries()) {
      const breakdown: Array<{ step: string; score: number; max_score: number }> = []
      for (const [step, scores] of stepMap.entries()) {
        const avg = scores.reduce((s: number, v: number) => s + v, 0) / scores.length
        breakdown.push({ step, score: Math.round((avg / 3) * 100) / 100, max_score: 1.0 })
      }
      stepScoreMap.set(aId, breakdown)
    }
  }

  const patternMap = new Map<string, string>()
  for (const p of patternRows) {
    const challengeId = attemptIdToChallengeId.get(p.attempt_id as string)
    if (challengeId && !patternMap.has(challengeId)) {
      patternMap.set(challengeId, p.pattern_name as string)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attempts = rows.map((row: any) => {
    // Use stored feedback_json if present; otherwise synthesize from step_attempts
    const feedbackJson = row.feedback_json ?? (
      stepScoreMap.has(row.id as string) ? {
        step_breakdown: stepScoreMap.get(row.id as string),
        competency_deltas: [],
        total_score: row.total_score as number ?? 0,
        max_score: row.max_score as number ?? 3,
        xp_awarded: 0,
      } : null
    )
    return {
      id: row.id as string,
      challenge_id: row.challenge_id as string,
      challenge_title: (Array.isArray(row.challenges) ? row.challenges[0]?.title : row.challenges?.title) ?? row.challenge_id,
      grade_label: row.grade_label as string | null,
      score: row.total_score as number | null,
      max_score: row.max_score as number | null,
      submitted_at: row.completed_at as string | null,
      pattern_name: patternMap.get(row.challenge_id as string) ?? null,
      feedback_json: feedbackJson,
    }
  })

  return NextResponse.json(attempts)
}
