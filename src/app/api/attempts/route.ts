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
    .select('id, challenge_id, grade_label, total_score, completed_at, challenges(title)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data ?? [] as any[]

  // Build attempt_id → challenge_id mapping from fetched rows
  // user_failure_patterns stores attempt_id, not challenge_id
  const attemptIdToChallengeId = new Map<string, string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows.map((row: any) => [row.id as string, row.challenge_id as string])
  )

  // Fetch most-recent pattern per challenge_id when requested
  const patternMap = new Map<string, string>() // challenge_id → pattern_name
  if (includePatterns && rows.length > 0) {
    const attemptIds = rows.map((r: any) => r.id as string) // eslint-disable-line @typescript-eslint/no-explicit-any
    const { data: patterns } = await admin
      .from('user_failure_patterns')
      .select('attempt_id, pattern_name, created_at')
      .eq('user_id', user.id)
      .in('attempt_id', attemptIds)
      .order('created_at', { ascending: false })

    // Keep only the most-recent pattern per challenge_id
    for (const p of patterns ?? []) {
      const challengeId = attemptIdToChallengeId.get(p.attempt_id as string)
      if (challengeId && !patternMap.has(challengeId)) {
        patternMap.set(challengeId, p.pattern_name as string)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attempts = rows.map((row: any) => ({
    challenge_id: row.challenge_id as string,
    challenge_title: (Array.isArray(row.challenges) ? row.challenges[0]?.title : row.challenges?.title) ?? row.challenge_id,
    grade_label: row.grade_label as string | null,
    score: row.total_score as number | null,
    submitted_at: row.completed_at as string | null,
    pattern_name: patternMap.get(row.challenge_id as string) ?? null,
  }))

  return NextResponse.json(attempts)
}
