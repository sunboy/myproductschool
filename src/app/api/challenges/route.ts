import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Challenge, ChallengeAttemptV2 } from '@/lib/types'
import { coerceDifficulty, expandDifficultyForQuery } from '@/lib/practice/difficulty'
import { slugifyIndustry } from '@/lib/practice/slugify'
import { buildStatsMap } from '@/lib/challenges/status'

interface ChallengeWithStats extends Challenge {
  attempt_count: number
  best_score: number | null
  is_completed: boolean
  is_in_progress: boolean
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
    .neq('challenge_type', 'freeform')
    .range(offset, offset + limit - 1)

  if (paradigm) query = query.eq('paradigm', paradigm)
  if (industry) {
    const slug = slugifyIndustry(industry)
    if (slug) query = query.contains('industry_tags', [slug])
  }
  if (difficulty) {
    // Accept legacy and canonical difficulty values. Coerce caller input to
    // the canonical bucket, then match every DB string that maps to it.
    const bucket = coerceDifficulty(difficulty)
    if (bucket) query = query.in('difficulty', expandDifficultyForQuery(bucket))
  }
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
    .from('challenge_attempts')
    .select('challenge_id, total_score, status')
    .eq('user_id', user.id)
    .in('challenge_id', challengeIds)

  // Build per-challenge stats map (shared derivation — keeps is_in_progress
  // consistent with getChallenges / ChallengeCard).
  const statsMap = buildStatsMap(
    challengeIds,
    (attempts ?? []) as Pick<ChallengeAttemptV2, 'challenge_id' | 'total_score' | 'status'>[],
  )

  const result: ChallengeWithStats[] = (challenges as Challenge[]).map(c => ({
    ...c,
    ...(statsMap.get(c.id) ?? { attempt_count: 0, best_score: null, is_completed: false, is_in_progress: false }),
  }))

  const total = count ?? 0
  return NextResponse.json({
    challenges: result,
    total,
    has_more: offset + limit < total,
  })
}
