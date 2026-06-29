'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type Discipline } from '@/components/challenges/DisciplineTabStrip'
import { FilterDropdownBar, type FilterState } from '@/components/challenges/FilterDropdownBar'
import { ActiveFilterPills } from '@/components/challenges/ActiveFilterPills'
import { FilterBottomSheet } from '@/components/challenges/FilterBottomSheet'
import { MotionList } from '@/components/motion'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { EmptyState } from '@/components/ui/EmptyState'
import { TopicChipCloud } from '@/components/challenges/TopicChipCloud'
import { GroupedChallengeList } from '@/components/challenges/GroupedChallengeList'
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
  paradigm: [],
  difficulty: [],
  role: [],
  company: [],
  topic: [],
  technique: [],
  real_interview: false,
}

type FilterKey = keyof FilterState
type ArrayFilterKey = Exclude<FilterKey, 'real_interview'>
type SearchParamReader = Pick<URLSearchParams, 'get' | 'getAll'>
type SearchParamGetter = Pick<URLSearchParams, 'get'>

const ARRAY_FILTER_KEYS = (Object.keys(EMPTY_FILTERS) as FilterKey[]).filter(k => k !== 'real_interview') as ArrayFilterKey[]
const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as FilterKey[]

const DISCIPLINES: Array<{
  key: Discipline
  label: string
  description: string
  icon: string
  accent: string
}> = [
  {
    key: 'all',
    label: 'All practice',
    description: 'Every rep across product, data, systems, SQL, and coding.',
    icon: 'apps',
    accent: '#4a7c59',
  },
  {
    key: 'product_sense',
    label: 'Product sense',
    description: 'MCQs and judgment drills for product-quality thinking.',
    icon: 'psychology',
    accent: '#4a7c59',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Drive a live Claude Code agent against a real dataset to answer a business question.',
    icon: 'analytics',
    accent: '#1565c0',
  },
  {
    key: 'system_design',
    label: 'System design',
    description: 'Architecture prompts, tradeoffs, scale, and context.',
    icon: 'hub',
    accent: '#7a5c2e',
  },
  {
    key: 'data_modeling',
    label: 'Data modeling',
    description: 'Schema, entities, analytics thinking, and durable models.',
    icon: 'account_tree',
    accent: '#5b6f4d',
  },
  {
    key: 'sql',
    label: 'SQL',
    description: 'Live query execution with real interview-style datasets.',
    icon: 'database',
    accent: '#5a3a7c',
  },
  {
    key: 'algorithm',
    label: 'Coding',
    description: 'DSA practice for implementation speed and correctness.',
    icon: 'data_object',
    accent: '#3a5a7c',
  },
]

const ALL_VIEW_DISCIPLINES = ['product_sense', 'analytics', 'system_design', 'data_modeling', 'sql', 'algorithm'] as const
const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product Sense',
  analytics: 'Analytics',
  system_design: 'System Design',
  data_modeling: 'Data Modeling',
  sql: 'SQL',
  algorithm: 'Coding',
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
  return DISCIPLINES.some((discipline) => discipline.key === value)
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

function getDiscipline(searchParams: SearchParamGetter): Discipline {
  const discipline = searchParams.get('discipline')
  const legacyType = searchParams.get('type')
  if (isDiscipline(discipline)) return discipline
  if (isDiscipline(legacyType)) return legacyType
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
  if (discipline === 'analytics') return type === 'claude_code_analytics'
  if (discipline === 'product_sense') return ['flow', 'freeform', 'quick_take'].includes(type ?? '')
  return type === discipline
}

/** Build the /api/challenges query string from the active filters + discipline + page.
 *  Multi-select values are passed comma-joined; the API splits them and applies OR. */
function buildListQuery(opts: {
  discipline: Discipline
  filters: FilterState
  /** When set, overrides the topic filter (used by a topic-scoped section fetch). */
  topic?: string
  page: number
  limit: number
}): string {
  const p = new URLSearchParams()
  if (opts.discipline !== 'all') p.set('discipline', opts.discipline)
  const setMulti = (key: string, values: string[]) => { if (values.length > 0) p.set(key, values.join(',')) }
  setMulti('paradigm', opts.filters.paradigm)
  setMulti('difficulty', opts.filters.difficulty)
  setMulti('role', opts.filters.role)
  setMulti('company', opts.filters.company)
  setMulti('technique', opts.filters.technique)
  // A section fetch scopes to one topic; otherwise pass the selected topic(s).
  if (opts.topic) p.set('topic', opts.topic)
  else setMulti('topic', opts.filters.topic)
  if (opts.filters.real_interview) p.set('real_interview', '1')
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
      : seedChallenges.filter((c) => c.challenge_type !== 'claude_code_analytics'),
    [seedChallenges, analyticsEnabled],
  )

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const searchString = searchParams.toString()
  const parsedParams = useMemo(() => new URLSearchParams(searchString), [searchString])

  const discipline = getDiscipline(parsedParams)

  const filters = useMemo<FilterState>(() => ({
    paradigm: readFilterValues(parsedParams, 'paradigm'),
    difficulty: readFilterValues(parsedParams, 'difficulty'),
    role: readFilterValues(parsedParams, 'role'),
    company: readFilterValues(parsedParams, 'company'),
    topic: readFilterValues(parsedParams, 'topic'),
    technique: readFilterValues(parsedParams, 'technique'),
    real_interview: parsedParams.get('real_interview') === '1',
  }), [parsedParams])

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
      // Paradigm has no meaning on the pure coding tabs and its control is hidden
      // there - drop any active paradigm filter so results aren't silently scoped
      // by a filter the user can no longer see or remove.
      if (nextDiscipline === 'algorithm' || nextDiscipline === 'sql') params.delete('paradigm')
      if (nextDiscipline === 'all') params.delete('discipline')
      else params.set('discipline', nextDiscipline)
    })
  }

  function handleFilterChange(nextFilters: FilterState) {
    updateParams((params) => {
      ARRAY_FILTER_KEYS.forEach((key) => writeFilterValues(params, key, nextFilters[key] as string[]))
      if (nextFilters.real_interview) params.set('real_interview', '1')
      else params.delete('real_interview')
    })
  }

  function handleRemoveFilter(key: keyof FilterState, value: string) {
    if (key === 'real_interview') {
      handleFilterChange({ ...filters, real_interview: false })
    } else {
      const current = filters[key] as string[]
      handleFilterChange({ ...filters, [key]: current.filter((v) => v !== value) })
    }
  }

  function handleClearAll() {
    updateParams((params) => {
      FILTER_KEYS.forEach((key) => params.delete(key))
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

  // Hide the Analytics tab entirely while the feature is dark.
  const visibleDisciplines = analyticsEnabled
    ? DISCIPLINES
    : DISCIPLINES.filter((d) => d.key !== 'analytics')

  return (
    <div className="-mx-4 flex min-w-0 flex-col sm:-mx-6">
      <section data-tour-target="practice-filters" className="px-4 pb-4 sm:px-6">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {visibleDisciplines.map((entry) => {
            const active = discipline === entry.key
            const count = countFor(entry.key)

            return (
              <AppTooltip key={entry.key} label={entry.description} side="bottom" className="flex">
                <button
                  type="button"
                  onClick={() => handleDisciplineChange(entry.key)}
                  aria-pressed={active}
                  title={entry.description}
                  className={[
                    'group flex min-h-[88px] w-full flex-col justify-between rounded-lg border p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    active
                      ? 'border-primary bg-primary-fixed text-primary shadow-[0_10px_24px_-18px_rgba(51,82,58,0.75)]'
                      : 'border-outline-variant/55 bg-surface-container-low text-on-surface hover:-translate-y-0.5 hover:border-outline hover:bg-surface-container',
                  ].join(' ')}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span
                      className="material-symbols-outlined text-[19px] leading-none"
                      style={{
                        color: active ? 'var(--color-primary)' : entry.accent,
                        fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {entry.icon}
                    </span>
                    <span
                      className={[
                        'rounded-md px-1.5 py-0.5 text-[10px] font-bold font-label tabular-nums',
                        active ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant',
                      ].join(' ')}
                    >
                      {count}
                    </span>
                  </span>
                  <span className="space-y-0.5">
                    <span className="block truncate font-headline text-[13px] font-bold leading-tight text-current">
                      {entry.label}
                    </span>
                    <span className="line-clamp-2 block text-[10.5px] leading-tight text-on-surface-variant">
                      {entry.description}
                    </span>
                  </span>
                </button>
              </AppTooltip>
            )
          })}
        </div>
      </section>

      {/* Topic chip cloud — discipline-scoped topic/technique quick filters.
          Counts come from the server (groupBy=topic|technique). */}
      <TopicChipCloudLoader
        discipline={discipline}
        filters={filters}
        onChange={handleFilterChange}
        searchString={searchString}
      />

      {/* Secondary filter bar */}
      <FilterDropdownBar
        discipline={discipline}
        filters={filters}
        onChange={handleFilterChange}
        resultCount={totalForDiscipline}
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
      <div className="px-4 pt-4 sm:px-6">
        {discipline === 'all' ? (
          <AllPracticeView
            initialChallenges={initialChallenges}
            initialDiscipline={initialDiscipline}
            counts={counts}
            analyticsEnabled={analyticsEnabled}
            paradigms={paradigms}
            summaries={summaries}
            filters={filters}
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
            initialChallenges={initialDiscipline === discipline ? initialChallenges : []}
            initialTotal={totalForDiscipline}
            returnHref={returnHref}
            pageSize={pageSize}
            searchString={searchString}
          />
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Topic chip cloud loader — fetches topic/technique counts for the active
 * discipline from the server (no full-row payload) and feeds TopicChipCloud.
 * ────────────────────────────────────────────────────────────────────────── */
function TopicChipCloudLoader({
  discipline,
  filters,
  onChange,
  searchString,
}: {
  discipline: Discipline
  filters: FilterState
  onChange: (f: FilterState) => void
  searchString: string
}) {
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

  return (
    <TopicChipCloud
      discipline={discipline}
      filters={filters}
      onChange={onChange}
      topicCounts={topicCounts}
      techniqueCounts={techniqueCounts}
    />
  )
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
      const qs = buildListQuery({ discipline, filters, page: nextPage, limit: pageSize })
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
  }, [discipline, filters, page, pageSize])

  // Page 1 from the API holds `pageSize` rows; the seed only had
  // previewPerDiscipline. The first "load more" jumps to page 2 (offset
  // pageSize), which would skip rows between previewPerDiscipline and pageSize.
  // Guard: if still showing only the preview, the first expand fetches page 1.
  const expandToFull = useCallback(async () => {
    setLoading(true)
    try {
      const qs = buildListQuery({ discipline, filters, page: 1, limit: pageSize })
      const res = await fetch(`/api/challenges?${qs}`)
      if (res.ok) {
        const data: ListResponse = await res.json()
        setRows(data.challenges)
        setPage(1)
      }
    } finally {
      setLoading(false)
    }
  }, [discipline, filters, pageSize])

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
          className="font-label text-xs text-on-surface-variant font-normal hover:underline"
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
  initialChallenges,
  initialTotal,
  returnHref,
  pageSize,
  searchString,
}: {
  discipline: Discipline
  filters: FilterState
  initialChallenges: ChallengeWithDomain[]
  initialTotal: number
  returnHref: string
  pageSize: number
  searchString: string
}) {
  // Analytics challenges have no topic/technique taxonomy, so the topic-grouped
  // view would render empty. Always show them as a flat list (same as the
  // chip-filtered case). Otherwise group by topic when no chip filter is active.
  const flat = discipline === 'analytics' || filters.topic.length > 0 || filters.technique.length > 0

  if (flat) {
    return (
      <FlatDisciplineList
        discipline={discipline}
        filters={filters}
        initialChallenges={initialChallenges}
        initialTotal={initialTotal}
        returnHref={returnHref}
        pageSize={pageSize}
      />
    )
  }

  return (
    <GroupedChallengeList
      discipline={discipline}
      filters={filters}
      returnHref={returnHref}
      searchString={searchString}
      pageSize={pageSize}
    />
  )
}

/** Flat list (chip-filtered): seeded by SSR rows, "Load more" 30 at a time. */
function FlatDisciplineList({
  discipline,
  filters,
  initialChallenges,
  initialTotal,
  returnHref,
  pageSize,
}: {
  discipline: Discipline
  filters: FilterState
  initialChallenges: ChallengeWithDomain[]
  initialTotal: number
  returnHref: string
  pageSize: number
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
    const qs = buildListQuery({ discipline, filters, page: 1, limit: pageSize })
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
  }, [discipline, topicKey, techniqueKey])

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const qs = buildListQuery({ discipline, filters, page: nextPage, limit: pageSize })
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
      <GroupedChallengeList.FlatRows challenges={rows} returnHref={returnHref} />
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
