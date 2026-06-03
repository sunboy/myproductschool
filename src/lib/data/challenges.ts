import { Challenge, ChallengeWithDomain } from '@/lib/types'
import { MOCK_CHALLENGES, MOCK_DOMAINS } from '@/lib/mock-data'
import { IS_MOCK } from '@/lib/mock'
import { coerceDifficulty, expandDifficultyForQuery } from '@/lib/practice/difficulty'
import { EMPTY_STATS, buildStatsMap, type AttemptRow, type ChallengeStats } from '@/lib/challenges/status'

// Pure status helpers live in a server-import-free module so client components
// (ChallengeCard, GroupedChallengeList) can use them without bundling
// next/headers. Re-export for existing call sites that import from here.
export { EMPTY_STATS, buildStatsMap, deriveChallengeStatus } from '@/lib/challenges/status'
export type { ChallengeStatus, ChallengeStats } from '@/lib/challenges/status'

// Columns the Practice list + filters actually read. Excludes the heavy text /
// JSONB columns (`metadata` ~3.5MB, `scenario_*`/`prompt_text` ~1MB,
// `scenario_embedding`) that the list view never renders. Selecting these 16
// columns instead of `*` cuts the payload from ~6.0MB to ~0.42MB across the full
// ~900-row catalog. The `domains(...)` join is intentionally dropped — the list
// `domain` field is overwritten to empty below and no card renders it. Detail /
// workspace paths still use `select('*')` via getChallengeById().
export const CHALLENGE_LIST_COLUMNS =
  'id, title, difficulty, challenge_type, display_number, slug, paradigm, ' +
  'estimated_minutes, topic_tags, technique_tags, is_real_interview, ' +
  'company_tags, relevant_roles, industry_tags, is_premium, domain_id'

/**
 * Practice filter set. Array-valued fields accept multi-select (OR semantics);
 * scalars are accepted too and treated as a single-element list. Values are the
 * UI labels (e.g. "AI-Assisted", "Tech Lead", "Google") — applyChallengeFilters
 * normalizes them to the DB representation, so callers pass labels verbatim.
 */
export interface ChallengeListFilters {
  domainId?: string
  difficulty?: string | string[]
  paradigm?: string | string[]
  role?: string | string[]
  company?: string | string[]
  q?: string
  type?: string
  topic?: string | string[]
  technique?: string | string[]
  real_interview?: boolean
}

/**
 * Coerce a scalar|array|undefined filter value to a clean string[] (drops
 * 'all'/empty). Splits comma-joined strings so SSR callers that pass a raw URL
 * param (e.g. "Easy,Medium") yield ["Easy","Medium"], matching the API routes.
 */
function toValues(v: string | string[] | undefined): string[] {
  if (v == null) return []
  const arr = Array.isArray(v) ? v : [v]
  return arr
    .flatMap(s => s.split(','))
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.toLowerCase() !== 'all')
}

/** UI label → DB snake_case (e.g. "AI-Assisted" → "ai_assisted", "Tech Lead" → "tech_lead"). */
function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[-\s]+/g, '_')
}

/** Disciplines map 1:1 to challenge_type except product_sense, which spans a set. */
const PRODUCT_SENSE_TYPES = ['flow', 'freeform', 'quick_take', 'claude_code_analytics'] as const
export type CountDiscipline = 'all' | 'product_sense' | 'system_design' | 'data_modeling' | 'sql' | 'algorithm'

const COUNT_DISCIPLINE_VALUES: readonly string[] = [
  'all', 'product_sense', 'system_design', 'data_modeling', 'sql', 'algorithm',
]
export function isCountDiscipline(value: string): value is CountDiscipline {
  return COUNT_DISCIPLINE_VALUES.includes(value)
}

export interface ChallengePage {
  challenges: ChallengeWithDomain[]
  total: number
  hasMore: boolean
}

/**
 * The row shape returned by a CHALLENGE_LIST_COLUMNS select. Declared explicitly
 * because the column string is built by concatenation, so PostgREST can't infer
 * the result type statically. Mirrors the 16 selected columns. (Several of these
 * columns aren't declared on the canonical `Challenge` type, so this is a
 * standalone interface rather than a `Pick`.)
 */
interface ChallengeListRow {
  id: string
  title: string
  difficulty: string
  challenge_type: string | null
  display_number: number | null
  slug: string | null
  paradigm: string | null
  estimated_minutes: number | null
  topic_tags: string[] | null
  technique_tags: string[] | null
  is_real_interview: boolean | null
  company_tags: string[] | null
  relevant_roles: string[] | null
  industry_tags: string[] | null
  is_premium: boolean | null
  domain_id: string | null
}

function toChallengeWithDomain(
  rows: ChallengeListRow[],
  statsMap: Map<string, ChallengeStats>,
): ChallengeWithDomain[] {
  return rows.map(c => ({
    ...c,
    slug: c.slug ?? c.id.replace(/^c\d+-/, ''),
    domain: { slug: '', title: '', icon: null },
    ...(statsMap.get(c.id) ?? EMPTY_STATS),
  })) as unknown as ChallengeWithDomain[]
}

/**
 * Apply the shared Practice filter set to a challenges query. Used by
 * getChallenges, getChallengeCounts, and the /api/challenges list/count routes
 * so the filter semantics stay identical everywhere. `move_tag` is intentionally
 * NOT supported — the FLOW Move filter was removed from Practice.
 *
 * Typed generically over the PostgREST filter builder; each `.eq/.in/.contains`
 * returns the same builder type, so the chain stays type-safe for callers.
 */
export function applyChallengeFilters<
  Q extends {
    eq: (col: string, val: string | boolean) => Q
    in: (col: string, vals: readonly string[]) => Q
    contains: (col: string, val: readonly string[]) => Q
    overlaps: (col: string, val: readonly string[]) => Q
    ilike: (col: string, pattern: string) => Q
  },
>(query: Q, filters?: ChallengeListFilters): Q {
  if (!filters) return query
  if (filters.domainId) query = query.eq('domain_id', filters.domainId as string)

  // Difficulty: each UI label → canonical bucket → every DB string that maps to
  // it. Multi-select unions the accepted DB values (OR).
  const difficulties = toValues(filters.difficulty)
  if (difficulties.length > 0) {
    const accepted = new Set<string>()
    for (const d of difficulties) {
      const bucket = coerceDifficulty(d)
      if (bucket) for (const v of expandDifficultyForQuery(bucket)) accepted.add(v)
    }
    if (accepted.size > 0) query = query.in('difficulty', Array.from(accepted))
  }

  // Paradigm: UI label ("AI-Assisted") → DB snake_case ("ai_assisted"). OR across selections.
  const paradigms = toValues(filters.paradigm).map(normalizeToken)
  if (paradigms.length > 0) query = query.in('paradigm', paradigms)

  // Roles: relevant_roles is an array column with inconsistent casing/format in
  // the data (e.g. "SWE"/"swe", "tech_lead"/"tech lead", "founding_eng"/
  // "founding_engineer"/"founding engineer"). Expand each selection to its known
  // variants and match any (overlaps = OR).
  const roles = toValues(filters.role)
  if (roles.length > 0) {
    const variants = new Set<string>()
    for (const r of roles) for (const v of expandRoleVariants(r)) variants.add(v)
    query = query.overlaps('relevant_roles', Array.from(variants))
  }

  // Companies: stored as lowercase hyphen slugs ("meta"); UI sends labels ("Meta").
  const companies = toValues(filters.company).map(c => c.toLowerCase().replace(/\s+/g, '-'))
  if (companies.length > 0) query = query.overlaps('company_tags', companies)

  if (filters.q) query = query.ilike('title', `%${filters.q}%`)
  if (filters.type && filters.type !== 'all') query = query.eq('challenge_type', filters.type)

  // Topic / technique: controlled-vocabulary slugs, matched against array columns.
  const topics = toValues(filters.topic)
  if (topics.length > 0) query = query.overlaps('topic_tags', topics)
  const techniques = toValues(filters.technique)
  if (techniques.length > 0) query = query.overlaps('technique_tags', techniques)

  if (filters.real_interview) query = query.eq('is_real_interview', true)
  return query
}

/** Known stored variants per role selection (data has mixed casing/format). */
function expandRoleVariants(role: string): string[] {
  const norm = normalizeToken(role) // e.g. "tech_lead", "swe", "founding_eng"
  const out = new Set<string>([norm, role, role.toLowerCase(), role.toUpperCase(), norm.replace(/_/g, ' ')])
  // Founding engineer is stored three ways; treat them as equivalent.
  if (norm === 'founding_eng' || norm === 'founding_engineer') {
    out.add('founding_eng'); out.add('founding_engineer'); out.add('founding engineer')
  }
  return Array.from(out)
}

export async function getChallenges(
  filters?: ChallengeListFilters & { move_tag?: string },
  pagination?: { limit?: number; offset?: number },
): Promise<ChallengeWithDomain[]> {
  if (IS_MOCK) {
    let challenges = MOCK_CHALLENGES
    if (filters?.domainId) challenges = challenges.filter(c => c.domain_id === filters.domainId)
    const mockDifficulties = toValues(filters?.difficulty)
    if (mockDifficulties.length > 0) {
      const accepted = new Set<string>()
      for (const d of mockDifficulties) {
        const bucket = coerceDifficulty(d)
        if (bucket) for (const v of expandDifficultyForQuery(bucket)) accepted.add(v)
      }
      if (accepted.size > 0) challenges = challenges.filter(c => accepted.has(c.difficulty))
    }

    return challenges.map(challenge => {
      const domain = MOCK_DOMAINS.find(d => d.id === challenge.domain_id)
      return {
        ...challenge,
        domain: { slug: domain?.slug ?? '', title: domain?.title ?? '', icon: domain?.icon ?? null },
        ...EMPTY_STATS,
      }
    })
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('challenges')
    .select(CHALLENGE_LIST_COLUMNS)
    .eq('is_published', true)
    .neq('challenge_type', 'quick_take')

  query = applyChallengeFilters(query, filters)
  query = query.order('created_at', { ascending: false })

  if (pagination) {
    const limit = pagination.limit ?? 30
    const offset = pagination.offset ?? 0
    query = query.range(offset, offset + limit - 1)
  }

  const { data } = await query
  const rows = (data ?? []) as unknown as ChallengeListRow[]

  const challengeIds = rows.map(c => c.id)

  const { data: attempts } =
    user && challengeIds.length > 0
      ? await supabase
          .from('challenge_attempts')
          .select('challenge_id, total_score, status')
          .eq('user_id', user.id)
          .in('challenge_id', challengeIds)
      : { data: null }

  const statsMap = buildStatsMap(challengeIds, (attempts ?? []) as AttemptRow[])

  return toChallengeWithDomain(rows, statsMap)
}

export async function getFeaturedChallenges(): Promise<ChallengeWithDomain[]> {
  if (IS_MOCK) return []

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('challenges')
    .select(CHALLENGE_LIST_COLUMNS)
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  const rows = (data ?? []) as unknown as ChallengeListRow[]
  const challengeIds = rows.map(c => c.id)

  const { data: attempts } =
    user && challengeIds.length > 0
      ? await supabase
          .from('challenge_attempts')
          .select('challenge_id, total_score, status')
          .eq('user_id', user.id)
          .in('challenge_id', challengeIds)
      : { data: null }

  const statsMap = buildStatsMap(challengeIds, (attempts ?? []) as AttemptRow[])

  return toChallengeWithDomain(rows, statsMap)
}

/** Add the discipline → challenge_type constraint to a query. */
export function applyDisciplineFilter<
  Q extends { eq: (c: string, v: string) => Q; in: (c: string, v: readonly string[]) => Q },
>(query: Q, discipline: CountDiscipline): Q {
  if (discipline === 'all') return query
  if (discipline === 'product_sense') return query.in('challenge_type', PRODUCT_SENSE_TYPES)
  return query.eq('challenge_type', discipline)
}

/** The challenge_type list a discipline expands to ('all' → [] = no constraint). */
function disciplineToTypes(discipline: CountDiscipline): string[] {
  if (discipline === 'all') return []
  if (discipline === 'product_sense') return [...PRODUCT_SENSE_TYPES]
  return [discipline]
}

/**
 * Normalize the UI filter labels to the DB-value arrays the SQL layer matches
 * against — the same transforms applyChallengeFilters uses, factored out so the
 * challenge_tag_counts RPC receives identical semantics. Returns plain arrays.
 */
export function normalizeFilterArrays(filters?: ChallengeListFilters) {
  const difficulties = new Set<string>()
  for (const d of toValues(filters?.difficulty)) {
    const bucket = coerceDifficulty(d)
    if (bucket) for (const v of expandDifficultyForQuery(bucket)) difficulties.add(v)
  }
  const roles = new Set<string>()
  for (const r of toValues(filters?.role)) for (const v of expandRoleVariants(r)) roles.add(v)
  return {
    difficulties: Array.from(difficulties),
    paradigms: toValues(filters?.paradigm).map(normalizeToken),
    roles: Array.from(roles),
    companies: toValues(filters?.company).map(c => c.toLowerCase().replace(/\s+/g, '-')),
    topics: toValues(filters?.topic),
    techniques: toValues(filters?.technique),
    q: filters?.q?.trim() || null,
    realInterview: filters?.real_interview === true,
  }
}

const COUNT_DISCIPLINES: CountDiscipline[] = [
  'product_sense', 'system_design', 'data_modeling', 'sql', 'algorithm',
]

/**
 * Per-discipline challenge counts for the Practice discipline tabs, computed via
 * HEAD `count: 'exact'` queries (no row payload). `all` is the sum of the
 * categorised disciplines, matching the old client behaviour. Filters are the
 * active secondary filters (difficulty, role, company, topic, technique, etc.).
 */
export async function getChallengeCounts(
  filters?: ChallengeListFilters,
): Promise<Record<CountDiscipline, number>> {
  const empty: Record<CountDiscipline, number> = {
    all: 0, product_sense: 0, system_design: 0, data_modeling: 0, sql: 0, algorithm: 0,
  }
  if (IS_MOCK) return empty

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const results = await Promise.all(
    COUNT_DISCIPLINES.map(async (discipline) => {
      let q = supabase
        .from('challenges')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .neq('challenge_type', 'quick_take')
      q = applyChallengeFilters(q, filters)
      q = applyDisciplineFilter(q, discipline)
      const { count } = await q
      return [discipline, count ?? 0] as const
    }),
  )

  const counts = { ...empty }
  for (const [discipline, count] of results) counts[discipline] = count
  counts.all = COUNT_DISCIPLINES.reduce((sum, d) => sum + counts[d], 0)
  return counts
}

/**
 * A bounded preview slice per discipline for the "All practice" overview.
 * Fetches `perDiscipline` rows for EACH discipline independently (the global
 * newest-N would skew to whichever disciplines were authored most recently and
 * leave others empty). Returns a flat array; the client groups by challenge_type.
 */
export async function getChallengePreviews(
  filters: ChallengeListFilters,
  perDiscipline: number,
): Promise<ChallengeWithDomain[]> {
  if (IS_MOCK) return getChallenges(filters, { limit: perDiscipline * 5 })

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const slices = await Promise.all(
    COUNT_DISCIPLINES.map(async (discipline) => {
      let q = supabase
        .from('challenges')
        .select(CHALLENGE_LIST_COLUMNS)
        .eq('is_published', true)
        .neq('challenge_type', 'quick_take')
      q = applyChallengeFilters(q, filters)
      q = applyDisciplineFilter(q, discipline)
      q = q.order('created_at', { ascending: false }).range(0, perDiscipline - 1)
      const { data } = await q
      return (data ?? []) as unknown as ChallengeListRow[]
    }),
  )

  const rows = slices.flat()
  const challengeIds = rows.map(c => c.id)

  const { data: attempts } =
    user && challengeIds.length > 0
      ? await supabase
          .from('challenge_attempts')
          .select('challenge_id, total_score, status')
          .eq('user_id', user.id)
          .in('challenge_id', challengeIds)
      : { data: null }

  const statsMap = buildStatsMap(challengeIds, (attempts ?? []) as AttemptRow[])
  return toChallengeWithDomain(rows, statsMap)
}

/**
 * Per-topic and per-technique tag counts for the chip cloud + grouped section
 * headers, scoped to a discipline + active filters. Fetches only the two array
 * columns (a few KB total) and tallies — PostgREST can't COUNT-group an array
 * column, and this keeps the payload tiny vs. shipping full rows.
 */
export async function getChallengeTagCounts(
  discipline: CountDiscipline,
  filters?: ChallengeListFilters,
): Promise<{ topics: Record<string, number>; techniques: Record<string, number> }> {
  if (IS_MOCK) return { topics: {}, techniques: {} }
  const [topics, techniques] = await Promise.all([
    getTagCounts('topic', discipline, filters),
    getTagCounts('technique', discipline, filters),
  ])
  return { topics, techniques }
}

/**
 * Single tag dimension's counts via the challenge_tag_counts RPC — a real
 * GROUP BY (unnest + group) on the server, returning only {tag, count} rows
 * instead of transferring every challenge's tag arrays to tally in JS.
 */
export async function getTagCounts(
  groupCol: 'topic' | 'technique',
  discipline: CountDiscipline,
  filters?: ChallengeListFilters,
): Promise<Record<string, number>> {
  if (IS_MOCK) return {}

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const f = normalizeFilterArrays(filters)

  const { data, error } = await supabase.rpc('challenge_tag_counts', {
    p_group_col: groupCol,
    p_types: disciplineToTypes(discipline),
    p_difficulties: f.difficulties,
    p_paradigms: f.paradigms,
    p_roles: f.roles,
    p_companies: f.companies,
    p_topics: f.topics,
    p_techniques: f.techniques,
    p_real_interview: f.realInterview,
    p_q: f.q,
  })
  if (error || !data) return {}

  const out: Record<string, number> = {}
  for (const row of data as { tag: string; count: number }[]) out[row.tag] = Number(row.count)
  return out
}

/**
 * Description fields for a small set of preview-card ids (grid view shows a
 * 2-line blurb via challengeTaskSummary). Kept out of the main list query so the
 * ~1MB of scenario_* text isn't shipped for the whole catalog. Returns a map of
 * id → the fields challengeTaskSummary reads.
 */
export interface ChallengeDescription {
  prompt_text: string | null
  scenario_context: string | null
  scenario_trigger: string | null
  scenario_question: string | null
  metadata: Record<string, unknown> | null
}

export async function getChallengeDescriptions(
  ids: string[],
): Promise<Record<string, ChallengeDescription>> {
  const out: Record<string, ChallengeDescription> = {}
  if (IS_MOCK || ids.length === 0) return out

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('challenges')
    .select('id, prompt_text, scenario_context, scenario_trigger, scenario_question, metadata')
    .in('id', ids)

  for (const row of (data ?? []) as ({ id: string } & ChallengeDescription)[]) {
    out[row.id] = {
      prompt_text: row.prompt_text,
      scenario_context: row.scenario_context,
      scenario_trigger: row.scenario_trigger,
      scenario_question: row.scenario_question,
      metadata: row.metadata,
    }
  }
  return out
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
  if (IS_MOCK) {
    return (MOCK_CHALLENGES.find(c => c.id === id) ?? null) as unknown as Challenge | null
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('challenges').select('*').eq('id', id).single()
  return data
}
