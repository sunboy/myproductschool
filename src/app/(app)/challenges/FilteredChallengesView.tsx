'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { isClaudeCodeLab } from '@/lib/labs/types'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type Discipline } from '@/components/challenges/DisciplineTabStrip'
import { FilterDropdownBar, type FilterState } from '@/components/challenges/FilterDropdownBar'
import { ActiveFilterPills } from '@/components/challenges/ActiveFilterPills'
import { FilterBottomSheet } from '@/components/challenges/FilterBottomSheet'
import { MotionList } from '@/components/motion'
import { EmptyState } from '@/components/ui/EmptyState'
import { GroupedChallengeList } from '@/components/challenges/GroupedChallengeList'
import { DisciplineChipRow } from '@/components/redesign/practice/DisciplineChipRow'
import { SortSegmented, isPracticeSort, type PracticeSort } from '@/components/redesign/practice/SortSegmented'
import { LockedChallengeGrid } from './LockedChallengeGrid'
import type { ChallengeWithDomain } from '@/lib/types'
import { isAnalyticsFeatureEnabled } from '@/lib/flags/analytics'

/** Discipline keys that have a per-discipline count. Mirrors CountDiscipline in challenges.ts. */
type CountDiscipline = 'all' | 'product_sense' | 'system_design' | 'data_modeling' | 'sql' | 'algorithm' | 'analytics'

interface Props {
  /** SSR seed: preview rows (all view) or first page (single discipline). */
  initialChallenges: ChallengeWithDomain[]
  /** Discipline the server rendered for (drives the seed shape). */
  initialDiscipline: CountDiscipline
  /** Per-discipline counts from the server (HEAD count queries). */
  counts: Record<CountDiscipline, number>
  paradigms: Record<string, string>
  /** Precomputed grid-blurb summaries keyed by challenge id (preview/featured rows). */
  summaries: Record<string, string>
  /** Preview cards per discipline in the "All practice" overview. */
  previewPerDiscipline: number
  /** Page size for single-discipline "load more". */
  pageSize: number
}

const EMPTY_FILTERS: FilterState = {
  difficulty: [],
  role: [],
  company: [],
  topic: [],
  technique: [],
  real_interview: false,
  resume: false,
}

type FilterKey = keyof FilterState
type ArrayFilterKey = Exclude<FilterKey, 'real_interview' | 'resume'>
type SearchParamReader = Pick<URLSearchParams, 'get' | 'getAll'>
type SearchParamGetter = Pick<URLSearchParams, 'get'>

const BOOLEAN_FILTER_KEYS: FilterKey[] = ['real_interview', 'resume']
const ARRAY_FILTER_KEYS = (Object.keys(EMPTY_FILTERS) as FilterKey[]).filter(k => !BOOLEAN_FILTER_KEYS.includes(k)) as ArrayFilterKey[]
const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as FilterKey[]

/** Order matters — mirrors the chip order in DisciplineChipRow ('all' last). */
const DISCIPLINE_KEYS: Discipline[] = ['algorithm', 'sql', 'system_design', 'analytics', 'data_modeling', 'product_sense', 'all']

const ALL_VIEW_DISCIPLINES = ['algorithm', 'sql', 'system_design', 'analytics', 'data_modeling', 'product_sense'] as const
const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product Sense',
  analytics: 'AI Analytics',
  system_design: 'System Design',
  data_modeling: 'Data Modeling',
  sql: 'SQL',
  algorithm: 'Coding/DSA',
}
const DISCIPLINE_COLORS: Record<string, string> = {
  product_sense: 'text-primary',
  analytics: 'text-[#1565c0]',
  system_design: 'text-tertiary',
  data_modeling: 'text-secondary',
  sql: 'text-[#5a3a7c]',
  algorithm: 'text-[#3a5a7c]',
}

function isDiscipline(value: string | null): value is Discipline {
  return DISCIPLINE_KEYS.includes(value as Discipline)
}

function readFilterValues(searchParams: SearchParamReader, key: FilterKey): string[] {
  const values = searchParams
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)

  return Array.from(new Set(values))
}

function writeFilterValues(params: URLSearchParams, key: FilterKey, values: string[]) {
  if (values.length === 0) {
    params.delete(key)
    return
  }
  params.set(key, values.join(','))
}

/** Stale/external links use aliases for coding; resolve them instead of
 *  silently degrading to 'all' (the DB challenge_type is `algorithm`). */
const DISCIPLINE_ALIASES: Record<string, Discipline> = {
  coding: 'algorithm',
  dsa: 'algorithm',
  'coding-dsa': 'algorithm',
}

function getDiscipline(searchParams: SearchParamGetter): Discipline {
  const discipline = searchParams.get('discipline')
  const legacyType = searchParams.get('type')
  for (const raw of [discipline, legacyType]) {
    if (!raw) continue
    if (isDiscipline(raw)) return raw
    const alias = DISCIPLINE_ALIASES[raw.toLowerCase()]
    if (alias) return alias
  }
  return 'all'
}

/**
 * Whether `challenge_type` belongs to a discipline. product_sense spans a set;
 * the others map 1:1. Mirrors applyDisciplineFilter on the server.
 *
 * Claude Code Analytics is its OWN discipline (`analytics` → claude_code_analytics)
 * and is NOT folded into product_sense here, so the All-view overview groups it
 * under its own section rather than under Product Sense.
 */
function challengeMatchesDiscipline(type: string | null | undefined, discipline: Discipline) {
  if (discipline === 'all') return true
  if (discipline === 'analytics') return isClaudeCodeLab(type)
  if (discipline === 'product_sense') return ['flow', 'freeform', 'quick_take'].includes(type ?? '')
  return type === discipline
}

/** Build the /api/challenges query string from the active filters + discipline + page.
 *  Multi-select values are passed comma-joined; the API splits them and applies OR. */
function buildListQuery(opts: {
  discipline: Discipline
  filters: FilterState
  /** Active search query — without this, paging/section fetches silently drop the search. */
  q?: string
  /** When set, overrides the topic filter (used by a topic-scoped section fetch). */
  topic?: string
  page: number
  limit: number
}): string {
  const p = new URLSearchParams()
  if (opts.discipline !== 'all') p.set('discipline', opts.discipline)
  if (opts.q) p.set('q', opts.q)
  const setMulti = (key: string, values: string[]) => { if (values.length > 0) p.set(key, values.join(',')) }
  setMulti('difficulty', opts.filters.difficulty)
  setMulti('role', opts.filters.role)
  setMulti('company', opts.filters.company)
  setMulti('technique', opts.filters.technique)
  // A section fetch scopes to one topic; otherwise pass the selected topic(s).
  if (opts.topic) p.set('topic', opts.topic)
  else setMulti('topic', opts.filters.topic)
  if (opts.filters.real_interview) p.set('real_interview', '1')
  if (opts.filters.resume) p.set('resume', '1')
  p.set('page', String(opts.page))
  p.set('limit', String(opts.limit))
  return p.toString()
}

interface ListResponse {
  challenges: ChallengeWithDomain[]
  total: number
  has_more: boolean
}

export function FilteredChallengesView({
  initialChallenges: seedChallenges,
  initialDiscipline,
  counts,
  paradigms,
  summaries,
  previewPerDiscipline,
  pageSize,
}: Props) {
  // Claude Code Analytics ships dark behind the feature flag. When off, drop
  // analytics challenges entirely (so they never appear in "All" or the seed)
  // and hide the Analytics discipline tab below. NEXT_PUBLIC_* is inlined
  // client-side. When on, analytics rows + tab show normally.
  const analyticsEnabled = isAnalyticsFeatureEnabled()
  const initialChallenges = useMemo(
    () => analyticsEnabled
      ? seedChallenges
      : seedChallenges.filter((c) => !isClaudeCodeLab(c.challenge_type)),
    [seedChallenges, analyticsEnabled],
  )

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const searchString = searchParams.toString()
  const parsedParams = useMemo(() => new URLSearchParams(searchString), [searchString])

  const discipline = getDiscipline(parsedParams)

  // Live topic/technique counts for the active discipline (drives the count-aware
  // Topic/Technique dropdowns in the filter bar). Skipped for 'all'.
  const { topicCounts, techniqueCounts } = useTopicTechniqueCounts(discipline, searchString)

  const filters = useMemo<FilterState>(() => ({
    difficulty: readFilterValues(parsedParams, 'difficulty'),
    role: readFilterValues(parsedParams, 'role'),
    company: readFilterValues(parsedParams, 'company'),
    topic: readFilterValues(parsedParams, 'topic'),
    technique: readFilterValues(parsedParams, 'technique'),
    real_interview: parsedParams.get('real_interview') === '1',
    resume: parsedParams.get('resume') === '1',
  }), [parsedParams])

  const searchQuery = parsedParams.get('q') ?? ''

  const sortParam = parsedParams.get('sort')
  const sort: PracticeSort = isPracticeSort(sortParam) ? sortParam : 'recommended'

  const listView = parsedParams.get('view') !== 'grid'
  const returnHref = `${pathname}${searchString ? `?${searchString}` : ''}`

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchString)
    mutator(params)
    const nextSearch = params.toString()
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false })
  }

  function handleDisciplineChange(nextDiscipline: Discipline) {
    updateParams((params) => {
      params.delete('type')
      params.delete('topic')
      params.delete('technique')
      // The Paradigm filter control was removed; drop any legacy param so results
      // aren't silently scoped by a filter the user can't see or clear.
      params.delete('paradigm')
      if (nextDiscipline === 'all') params.delete('discipline')
      else params.set('discipline', nextDiscipline)
    })
  }

  function handleSortChange(nextSort: PracticeSort) {
    updateParams((params) => {
      if (nextSort === 'recommended') params.delete('sort')
      else params.set('sort', nextSort)
    })
  }

  function handleFilterChange(nextFilters: FilterState) {
    updateParams((params) => {
      ARRAY_FILTER_KEYS.forEach((key) => writeFilterValues(params, key, nextFilters[key] as string[]))
      if (nextFilters.real_interview) params.set('real_interview', '1')
      else params.delete('real_interview')
      if (nextFilters.resume) params.set('resume', '1')
      else params.delete('resume')
    })
  }

  function handleRemoveFilter(key: keyof FilterState, value: string) {
    if (key === 'real_interview' || key === 'resume') {
      handleFilterChange({ ...filters, [key]: false })
    } else {
      const current = filters[key] as string[]
      handleFilterChange({ ...filters, [key]: current.filter((v) => v !== value) })
    }
  }

  function handleClearAll() {
    updateParams((params) => {
      FILTER_KEYS.forEach((key) => params.delete(key))
      params.delete('paradigm')
    })
  }

  function handleToggleView() {
    const params = new URLSearchParams(searchString)
    if (listView) params.set('view', 'grid')
    else params.delete('view')
    const nextSearch = params.toString()
    window.history.replaceState(null, '', nextSearch ? `${pathname}?${nextSearch}` : pathname)
  }

  // Resolve a discipline's count badge from the server counts (analytics is now a
  // real CountDiscipline key, returned only when the feature flag is enabled).
  const countFor = (key: Discipline): number => counts[key as CountDiscipline] ?? 0

  const totalForDiscipline = countFor(discipline)

  // Hide the Analytics chip entirely while the feature is dark.
  const visibleDisciplines = analyticsEnabled
    ? DISCIPLINE_KEYS
    : DISCIPLINE_KEYS.filter((key) => key !== 'analytics')

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <section data-tour-target="practice-filters">
        <DisciplineChipRow
          active={discipline}
          counts={countFor}
          onChange={handleDisciplineChange}
          visible={visibleDisciplines}
        />
      </section>

      {/* Secondary filter bar — includes count-aware Topic/Technique dropdowns
          (discipline-scoped; counts from groupBy=topic|technique). */}
      <FilterDropdownBar
        discipline={discipline}
        filters={filters}
        onChange={handleFilterChange}
        resultCount={totalForDiscipline}
        topicCounts={topicCounts}
        techniqueCounts={techniqueCounts}
        onOpenMobileSheet={() => setMobileSheetOpen(true)}
        listView={listView}
        onToggleView={handleToggleView}
        showViewToggle={discipline === 'all'}
      />

      {/* Active filter pills */}
      <ActiveFilterPills
        filters={filters}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      {/* Mobile bottom sheet */}
      <FilterBottomSheet
        open={mobileSheetOpen}
        discipline={discipline}
        filters={filters}
        resultCount={totalForDiscipline}
        onChange={handleFilterChange}
        onClose={() => setMobileSheetOpen(false)}
        onClearAll={handleClearAll}
        onDisciplineChange={handleDisciplineChange}
      />

      {/* Results */}
      <div className="pt-1">
        {discipline === 'all' ? (
          <AllPracticeView
            initialChallenges={initialChallenges}
            initialDiscipline={initialDiscipline}
            counts={counts}
            analyticsEnabled={analyticsEnabled}
            paradigms={paradigms}
            summaries={summaries}
            filters={filters}
            q={searchQuery}
            listView={listView}
            returnHref={returnHref}
            previewPerDiscipline={previewPerDiscipline}
            pageSize={pageSize}
            onSeeAll={handleDisciplineChange}
          />
        ) : (
          <DisciplineView
            key={`${discipline}-${searchString}`}
            discipline={discipline}
            filters={filters}
            q={searchQuery}
            initialChallenges={initialDiscipline === discipline ? initialChallenges : []}
            initialTotal={totalForDiscipline}
            returnHref={returnHref}
            pageSize={pageSize}
            searchString={searchString}
            sort={sort}
            onSortChange={handleSortChange}
          />
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Topic/technique count loader — fetches per-topic and per-technique live
 * counts for the active discipline from the server (no full-row payload). These
 * feed the count-aware Topic/Technique dropdowns in the filter bar: counts are
 * shown per option and zero-count options are hidden. Skipped for 'all'.
 * ────────────────────────────────────────────────────────────────────────── */
function useTopicTechniqueCounts(discipline: Discipline, searchString: string) {
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({})
  const [techniqueCounts, setTechniqueCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (discipline === 'all') {
      setTopicCounts({})
      setTechniqueCounts({})
      return
    }
    let cancelled = false
    const base = new URLSearchParams(searchString)
    base.set('discipline', discipline)
    const topicQs = new URLSearchParams(base); topicQs.set('groupBy', 'topic')
    const techQs = new URLSearchParams(base); techQs.set('groupBy', 'technique')
    Promise.all([
      fetch(`/api/challenges/count?${topicQs.toString()}`).then(r => r.ok ? r.json() : { counts: {} }),
      fetch(`/api/challenges/count?${techQs.toString()}`).then(r => r.ok ? r.json() : { counts: {} }),
    ]).then(([t, k]) => {
      if (cancelled) return
      setTopicCounts(t.counts ?? {})
      setTechniqueCounts(k.counts ?? {})
    }).catch(() => { if (!cancelled) { setTopicCounts({}); setTechniqueCounts({}) } })
    return () => { cancelled = true }
  }, [discipline, searchString])

  return { topicCounts, techniqueCounts }
}

/* ──────────────────────────────────────────────────────────────────────────
 * "All practice" overview — discipline preview sections (capped), each with a
 * "see all N" link. Preview rows come from the SSR seed; each section can
 * "load more" via /api/challenges without leaving the overview.
 * ────────────────────────────────────────────────────────────────────────── */
function AllPracticeView({
  initialChallenges,
  counts,
  analyticsEnabled,
  paradigms,
  summaries,
  filters,
  q,
  listView,
  returnHref,
  previewPerDiscipline,
  pageSize,
  onSeeAll,
}: {
  initialChallenges: ChallengeWithDomain[]
  initialDiscipline: CountDiscipline
  counts: Record<CountDiscipline, number>
  analyticsEnabled: boolean
  paradigms: Record<string, string>
  summaries: Record<string, string>
  filters: FilterState
  q?: string
  listView: boolean
  returnHref: string
  previewPerDiscipline: number
  pageSize: number
  onSeeAll: (d: Discipline) => void
}) {
  const resultsLayoutClass = listView
    ? 'grid grid-cols-1 gap-2'
    : 'grid grid-cols-1 sm:grid-cols-3 gap-3'

  // Seed each section from the SSR preview rows grouped by their discipline.
  const seeded = useMemo(() => {
    const map: Record<string, ChallengeWithDomain[]> = {}
    for (const disc of ALL_VIEW_DISCIPLINES) {
      map[disc] = initialChallenges
        .filter((c) => challengeMatchesDiscipline(c.challenge_type, disc as Discipline))
        .slice(0, previewPerDiscipline)
    }
    return map
  }, [initialChallenges, previewPerDiscipline])

  // Per-section total from the server counts (analytics is a real key now, and is
  // 0 / absent when the feature is dark, so it's dropped by the >0 filter below).
  const totalFor = (disc: (typeof ALL_VIEW_DISCIPLINES)[number]): number =>
    counts[disc as CountDiscipline] ?? 0

  const visibleDisciplines = ALL_VIEW_DISCIPLINES
    .filter((d) => analyticsEnabled || d !== 'analytics')
    .filter((d) => totalFor(d) > 0)

  if (visibleDisciplines.length === 0) {
    return (
      <EmptyState
        title="No challenges match those filters"
        hint="Loosen a filter or two and more reps will show up."
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {visibleDisciplines.map((disc) => (
        <AllPracticeSection
          key={disc}
          discipline={disc as Discipline}
          total={totalFor(disc)}
          seed={seeded[disc] ?? []}
          filters={filters}
          q={q}
          paradigms={paradigms}
          summaries={summaries}
          listView={listView}
          returnHref={returnHref}
          resultsLayoutClass={resultsLayoutClass}
          previewPerDiscipline={previewPerDiscipline}
          pageSize={pageSize}
          onSeeAll={() => onSeeAll(disc as Discipline)}
        />
      ))}
    </div>
  )
}

function AllPracticeSection({
  discipline,
  total,
  seed,
  filters,
  q,
  paradigms,
  summaries,
  listView,
  returnHref,
  resultsLayoutClass,
  previewPerDiscipline,
  pageSize,
  onSeeAll,
}: {
  discipline: Discipline
  total: number
  seed: ChallengeWithDomain[]
  filters: FilterState
  q?: string
  paradigms: Record<string, string>
  summaries: Record<string, string>
  listView: boolean
  returnHref: string
  resultsLayoutClass: string
  previewPerDiscipline: number
  pageSize: number
  onSeeAll: () => void
}) {
  const [rows, setRows] = useState<ChallengeWithDomain[]>(seed)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Keep rows in sync with the seed when filters change.
  useEffect(() => {
    setRows(seed)
    setPage(1)
  }, [seed])

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const qs = buildListQuery({ discipline, filters, q, page: nextPage, limit: pageSize })
      const res = await fetch(`/api/challenges?${qs}`)
      if (res.ok) {
        const data: ListResponse = await res.json()
        setRows((prev) => {
          const seen = new Set(prev.map((c) => c.id))
          return [...prev, ...data.challenges.filter((c) => !seen.has(c.id))]
        })
        setPage(nextPage)
      }
    } finally {
      setLoading(false)
    }
  }, [discipline, filters, q, page, pageSize])

  // Page 1 from the API holds `pageSize` rows; the seed only had
  // previewPerDiscipline. The first "load more" jumps to page 2 (offset
  // pageSize), which would skip rows between previewPerDiscipline and pageSize.
  // Guard: if still showing only the preview, the first expand fetches page 1.
  const expandToFull = useCallback(async () => {
    setLoading(true)
    try {
      const qs = buildListQuery({ discipline, filters, q, page: 1, limit: pageSize })
      const res = await fetch(`/api/challenges?${qs}`)
      if (res.ok) {
        const data: ListResponse = await res.json()
        setRows(data.challenges)
        setPage(1)
      }
    } finally {
      setLoading(false)
    }
  }, [discipline, filters, q, pageSize])

  // The SSR seed can't apply the resume filter (it's attempt-scoped, resolved by
  // the API); refetch page 1 whenever it's active so the preview rows match.
  useEffect(() => {
    if (filters.resume) void expandToFull()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.resume])

  const showingPreview = rows.length <= previewPerDiscipline

  const previewParadigms: Record<string, string> = {}
  rows.forEach((c) => { previewParadigms[c.id] = paradigms[c.id] ?? 'Traditional' })

  return (
    <section className="flex flex-col gap-3">
      <div className={`font-label font-bold text-sm flex items-center gap-2 ${DISCIPLINE_COLORS[discipline] ?? 'text-primary'}`}>
        {DISCIPLINE_LABELS[discipline] ?? discipline}
        <button
          type="button"
          onClick={onSeeAll}
          className="font-label text-xs text-ink-secondary font-normal hover:underline"
        >
          see all {total} →
        </button>
      </div>
      <MotionList layoutKey={`practice-${discipline}`} className={resultsLayoutClass}>
        <LockedChallengeGrid
          challenges={rows}
          paradigms={previewParadigms}
          listView={listView}
          returnHref={returnHref}
          summaries={summaries}
        />
      </MotionList>
      {total > rows.length && (
        <button
          type="button"
          onClick={showingPreview ? expandToFull : loadMore}
          disabled={loading}
          className="self-start font-label text-xs font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {loading ? 'Loading…' : `Load more (${total - rows.length} more)`}
        </button>
      )}
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Single-discipline view. Two sub-modes:
 *  - chip-filtered (topic/technique selected): flat list, "Load more" 30/page.
 *  - grouped (no topic): topic sections from server tag-counts; rows lazy-load
 *    on expand (handled inside GroupedChallengeList).
 * ────────────────────────────────────────────────────────────────────────── */
function DisciplineView({
  discipline,
  filters,
  q,
  initialChallenges,
  initialTotal,
  returnHref,
  pageSize,
  searchString,
  sort,
  onSortChange,
}: {
  discipline: Discipline
  filters: FilterState
  q?: string
  initialChallenges: ChallengeWithDomain[]
  initialTotal: number
  returnHref: string
  pageSize: number
  searchString: string
  sort: PracticeSort
  onSortChange: (s: PracticeSort) => void
}) {
  // Analytics challenges have no topic/technique taxonomy, so the topic-grouped
  // view would render empty. Always show them as a flat list (same as the
  // chip-filtered case). The resume filter is attempt-scoped, which the grouped
  // topic counts don't know about, so it also forces the flat list. Otherwise
  // group by topic when no chip filter is active.
  const flat = discipline === 'analytics' || filters.resume || filters.topic.length > 0 || filters.technique.length > 0

  return (
    <div className="flex flex-col gap-3">
      {/* Sort control — Recommended (next best action) / Newest / Hardest */}
      <div className="flex items-center justify-end">
        <SortSegmented value={sort} onChange={onSortChange} />
      </div>

      {flat ? (
        <FlatDisciplineList
          discipline={discipline}
          filters={filters}
          initialChallenges={initialChallenges}
          initialTotal={initialTotal}
          returnHref={returnHref}
          pageSize={pageSize}
          sort={sort}
        />
      ) : (
        <GroupedChallengeList
          discipline={discipline}
          filters={filters}
          returnHref={returnHref}
          searchString={searchString}
          pageSize={pageSize}
          sort={sort}
        />
      )}
    </div>
  )
}

/** Flat list (chip-filtered): seeded by SSR rows, "Load more" 30 at a time. */
function FlatDisciplineList({
  discipline,
  filters,
  q,
  initialChallenges,
  initialTotal,
  returnHref,
  pageSize,
  sort,
}: {
  discipline: Discipline
  filters: FilterState
  q?: string
  initialChallenges: ChallengeWithDomain[]
  initialTotal: number
  returnHref: string
  pageSize: number
  sort: PracticeSort
}) {
  const [rows, setRows] = useState<ChallengeWithDomain[]>(initialChallenges)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialTotal > initialChallenges.length)
  const [loading, setLoading] = useState(false)

  // Stable string keys so the refetch effect fires when ANY selected topic/
  // technique changes (not just the first). buildListQuery passes the full
  // arrays, so multi-topic selections are all applied (OR).
  const topicKey = filters.topic.join(',')
  const techniqueKey = filters.technique.join(',')

  // The SSR seed is filtered only on the primary filters; for a chip-filtered
  // view we (re)fetch page 1 with the topic/technique applied to be exact.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const qs = buildListQuery({ discipline, filters, q, page: 1, limit: pageSize })
    fetch(`/api/challenges?${qs}`)
      .then((r) => (r.ok ? r.json() : { challenges: [], total: 0, has_more: false }))
      .then((data: ListResponse) => {
        if (cancelled) return
        setRows(data.challenges)
        setTotal(data.total)
        setPage(1)
        setHasMore(data.has_more)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discipline, topicKey, techniqueKey, q])

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const qs = buildListQuery({ discipline, filters, q, page: nextPage, limit: pageSize })
      const res = await fetch(`/api/challenges?${qs}`)
      if (res.ok) {
        const data: ListResponse = await res.json()
        setRows((prev) => {
          const seen = new Set(prev.map((c) => c.id))
          return [...prev, ...data.challenges.filter((c) => !seen.has(c.id))]
        })
        setPage(nextPage)
        setHasMore(data.has_more)
      }
    } finally {
      setLoading(false)
    }
  }, [discipline, filters, page, pageSize])

  if (!loading && rows.length === 0) {
    return (
      <EmptyState
        title="No challenges match those filters"
        hint="Loosen a filter or two and more reps will show up."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <GroupedChallengeList.FlatRows challenges={rows} returnHref={returnHref} sort={sort} />
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="self-center font-label text-xs font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {loading ? 'Loading…' : `Load more (${total - rows.length} more)`}
        </button>
      )}
    </div>
  )
}
