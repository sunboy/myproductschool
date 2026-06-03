import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import {
  applyChallengeFilters,
  applyDisciplineFilter,
  getTagCounts,
  isCountDiscipline,
  type ChallengeListFilters,
} from '@/lib/data/challenges'

/**
 * Challenge counts for the Practice UI. Two modes:
 *  - default: a single `{ count }` for the active filters + optional discipline,
 *    via a HEAD `count: 'exact'` query (no row payload).
 *  - `groupBy=topic|technique`: `{ counts: Record<slug, number> }` via the
 *    challenge_tag_counts RPC (a real GROUP BY — no row transfer).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const groupBy = sp.get('groupBy') // 'topic' | 'technique' | null
  const disciplineParam = sp.get('discipline') ?? sp.get('type') ?? undefined
  const discipline = disciplineParam && isCountDiscipline(disciplineParam) ? disciplineParam : 'all'

  if (IS_MOCK) {
    return NextResponse.json(groupBy ? { counts: {} } : { count: 42 })
  }

  const multi = (key: string): string[] =>
    sp.getAll(key).flatMap(v => v.split(',')).map(s => s.trim()).filter(Boolean)

  const filters: ChallengeListFilters = {
    difficulty: multi('difficulty'),
    paradigm: multi('paradigm'),
    role: multi('role'),
    company: multi('company'),
    q: sp.get('q') ?? undefined,
    topic: multi('topic'),
    technique: multi('technique'),
    real_interview: sp.get('real_interview') === '1' || sp.get('real_interview') === 'true',
  }

  if (groupBy === 'topic' || groupBy === 'technique') {
    const counts = await getTagCounts(groupBy, discipline, filters)
    return NextResponse.json({ counts })
  }

  const adminClient = createAdminClient()
  let query = adminClient
    .from('challenges')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .neq('challenge_type', 'quick_take')
  query = applyChallengeFilters(query, filters)
  query = applyDisciplineFilter(query, discipline)

  const { count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ count: count ?? 0 })
}
