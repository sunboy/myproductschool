import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Challenge, ChallengeAttemptV2 } from '@/lib/types'

interface ChallengeWithStats extends Challenge {
  attempt_count: number
  best_score: number | null
  is_completed: boolean
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const paradigm = searchParams.get('paradigm')
  const industry = searchParams.get('industry')
  const role = searchParams.get('role')
  const difficulty = searchParams.get('difficulty')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const offset = (page - 1) * limit

  // Build challenge query with filters
  let query = supabase
    .from('challenges')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .range(offset, offset + limit - 1)

  if (paradigm) query = query.eq('paradigm', paradigm)
  if (industry) query = query.eq('industry', industry)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (role) query = query.contains('relevant_roles', [role])

  const { data: challenges, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }

  if (!challenges || challenges.length === 0) {
    return NextResponse.json({ challenges: [], total: 0, has_more: false })
  }

  // Fetch attempt stats for this user
  const challengeIds = (challenges as Challenge[]).map(c => c.id)
  const { data: attempts } = await supabase
    .from('challenge_attempts_v2')
    .select('challenge_id, total_score, status')
    .eq('user_id', user.id)
    .in('challenge_id', challengeIds)

  // Build per-challenge stats map
  const statsMap = new Map<string, { attempt_count: number; best_score: number | null; is_completed: boolean }>()
  for (const id of challengeIds) {
    statsMap.set(id, { attempt_count: 0, best_score: null, is_completed: false })
  }
  for (const attempt of (attempts ?? []) as Pick<ChallengeAttemptV2, 'challenge_id' | 'total_score' | 'status'>[]) {
    const existing = statsMap.get(attempt.challenge_id)
    if (!existing) continue
    existing.attempt_count += 1
    if (attempt.status === 'completed') {
      existing.is_completed = true
      if (attempt.total_score !== null) {
        existing.best_score = existing.best_score === null
          ? attempt.total_score
          : Math.max(existing.best_score, attempt.total_score)
      }
    }
  }

  const result: ChallengeWithStats[] = (challenges as Challenge[]).map(c => ({
    ...c,
    ...statsMap.get(c.id) ?? { attempt_count: 0, best_score: null, is_completed: false },
  }))

  const total = count ?? 0
  return NextResponse.json({
    challenges: result,
    total,
    has_more: offset + limit < total,
  })
}
