import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ChallengeAttemptV2 } from '@/lib/types'
import { slugifyIndustry } from '@/lib/practice/slugify'
import { buildStatsMap } from '@/lib/challenges/status'
import {
  CHALLENGE_LIST_COLUMNS,
  applyChallengeFilters,
  applyDisciplineFilter,
  isCountDiscipline,
  type ChallengeListFilters,
} from '@/lib/data/challenges'

/**
 * Paginated, filtered challenge list — the client lazy-load endpoint for
 * Practice section expansion and "load more". Selects the lean column set
 * (no metadata / scenario_* text) so each page is a few KB, and reuses the
 * same filter semantics as the server-rendered list via applyChallengeFilters.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const industry = searchParams.get('industry')
  const discipline = searchParams.get('discipline') ?? searchParams.get('type') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '30', 10)))
  const offset = (page - 1) * limit

  // company_tags / industry are slugs in the DB; the industry param historically
  // arrived as a display label, so keep the slugify shim for it.
  const industrySlug = industry ? slugifyIndustry(industry) : undefined

  // Multi-select filters arrive comma-joined (and may repeat). Split into arrays
  // so OR semantics apply (e.g. difficulty=Easy,Medium → either).
  const multi = (key: string): string[] =>
    searchParams.getAll(key).flatMap(v => v.split(',')).map(s => s.trim()).filter(Boolean)

  const filters: ChallengeListFilters = {
    difficulty: multi('difficulty'),
    paradigm: multi('paradigm'),
    role: multi('role'),
    company: multi('company'),
    q: searchParams.get('q') ?? undefined,
    topic: multi('topic'),
    technique: multi('technique'),
    real_interview: searchParams.get('real_interview') === '1' || searchParams.get('real_interview') === 'true',
  }

  let query = supabase
    .from('challenges')
    .select(CHALLENGE_LIST_COLUMNS, { count: 'exact' })
    .eq('is_published', true)
    .neq('challenge_type', 'quick_take')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  query = applyChallengeFilters(query, filters)
  if (industrySlug) query = query.contains('industry_tags', [industrySlug])
  // Discipline maps to challenge_type(s); product_sense spans a set.
  if (discipline && isCountDiscipline(discipline)) query = applyDisciplineFilter(query, discipline)

  const { data: challenges, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }

  const rows = (challenges ?? []) as unknown as { id: string }[]
  if (rows.length === 0) {
    return NextResponse.json({ challenges: [], total: count ?? 0, has_more: false })
  }

  // Fetch attempt stats for this user
  const challengeIds = rows.map(c => c.id)
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

  const result = rows.map(c => ({
    ...c,
    domain: { slug: '', title: '', icon: null },
    ...(statsMap.get(c.id) ?? { attempt_count: 0, best_score: null, is_completed: false, is_in_progress: false }),
  }))

  const total = count ?? 0
  return NextResponse.json({
    challenges: result,
    total,
    has_more: offset + limit < total,
  })
}
