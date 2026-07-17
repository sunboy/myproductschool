// src/components/challenges/GroupedChallengeList.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, CheckCircle2, ChevronDown, ChevronUp, Circle, Lock, Tag, Timer } from 'lucide-react'
import { useIsAtLimit } from '@/context/UsageContext'
import { appendReturnTo } from '@/lib/navigation/return-to'
import { challengePath, formatChallengeNumber } from '@/lib/challenges/challengeNumber'
import { coerceDifficulty, type PracticeDifficulty } from '@/lib/practice/difficulty'
import { getTopicLabelAny, getTechniqueLabelAny } from '@/lib/data/taxonomy'
import { askedAtLabel } from '@/lib/format/company'
import { deriveChallengeStatus, type ChallengeStatus } from '@/lib/challenges/status'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ChallengeWithDomain } from '@/lib/types'
import type { Discipline } from './DisciplineTabStrip'
import type { FilterState } from './FilterDropdownBar'
import type { PracticeSort } from '@/components/redesign/practice/SortSegmented'

/**
 * Server mode (Practice): topic counts + lazy per-section row loading via the
 * API. Static mode (domain pages): a pre-fetched challenge array grouped in
 * memory, no server fetch. Discriminated by the presence of `discipline`.
 */
/**
 * Opens each challenge inside the 3-panel workspace shell with a persistent left
 * index (study plan or domain). Emits `?{key}={slug}&cid={challengeId}` on the
 * href, which `(workspace)/layout.tsx` reads to render the index panel. Distinct
 * from `returnHref` (a plain `?returnTo=` back button).
 */
export interface CollectionParam {
  key: 'from_plan' | 'from_domain'
  slug: string
}

interface ServerProps {
  discipline: Discipline
  filters: FilterState
  /** When set, appended to each challenge href as ?returnTo= so the workspace back button returns here. */
  returnHref?: string
  /** When set, opens challenges in the 3-panel shell with a persistent left index. */
  collectionParam?: CollectionParam
  /** Current URL query string — drives the server count/list fetches. */
  searchString: string
  /** Rows fetched per section page. */
  pageSize: number
  /** Active list ordering (defaults to 'recommended' = next best action). */
  sort?: PracticeSort
  /** Apply the challenges usage paywall (lock rows at limit). Default true. */
  enforceLimit?: boolean
}

interface StaticProps {
  /** Pre-fetched challenges grouped client-side (domain pages). */
  challenges: ChallengeWithDomain[]
  groupBy: 'primaryTopic' | 'none'
  /** Record<topicSlug, topicTitle>. */
  topicLabels: Record<string, string>
  returnHref?: string
  collectionParam?: CollectionParam
  enforceLimit?: boolean
}

type Props = ServerProps | StaticProps

function isStaticProps(p: Props): p is StaticProps {
  return 'challenges' in p
}

interface ListResponse {
  challenges: ChallengeWithDomain[]
  total: number
  has_more: boolean
}

function difficultyOrder(d: string | null | undefined): number {
  const c = coerceDifficulty(d)
  if (c === 'easy') return 0
  if (c === 'medium') return 1
  if (c === 'hard') return 2
  return 3
}

/** Recommended = next best action: paused reps first, fresh ones next, finished last. */
function statusOrder(c: ChallengeWithDomain): number {
  const status = deriveChallengeStatus(c)
  if (status === 'attempted') return 0
  if (status === 'not_started') return 1
  return 2
}

export function sortChallenges(list: ChallengeWithDomain[], sort: PracticeSort = 'recommended'): ChallengeWithDomain[] {
  if (sort === 'newest') return [...list] // server order is created_at desc
  return [...list].sort((a, b) => {
    if (sort === 'recommended') {
      const status = statusOrder(a) - statusOrder(b)
      if (status !== 0) return status
      const diff = difficultyOrder(a.difficulty) - difficultyOrder(b.difficulty)
      if (diff !== 0) return diff
    } else {
      // hardest
      const diff = difficultyOrder(b.difficulty) - difficultyOrder(a.difficulty)
      if (diff !== 0) return diff
    }
    return (a.title ?? '').localeCompare(b.title ?? '')
  })
}

const SORT_DESCRIPTOR: Record<PracticeSort, string> = {
  recommended: 'sorted by your next best action',
  newest: 'newest first',
  hardest: 'hardest first',
}

/** Build a /api/challenges query for a discipline section, optionally scoped to a topic. */
function sectionQuery(opts: { searchString: string; discipline: Discipline; topic?: string; page: number; limit: number }): string {
  const p = new URLSearchParams(opts.searchString)
  p.delete('view')
  p.delete('sort')
  if (opts.discipline !== 'all') p.set('discipline', opts.discipline)
  if (opts.topic) p.set('topic', opts.topic)
  p.set('page', String(opts.page))
  p.set('limit', String(opts.limit))
  return p.toString()
}

const STATUS_ICON: Record<ChallengeStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="size-[18px] shrink-0 text-forest-600" />,
  attempted: <Timer className="size-[18px] shrink-0 text-flame" />,
  not_started: <Circle className="size-[18px] shrink-0 text-ink-muted/60" />,
}

const ACTION_LABEL: Record<ChallengeStatus, string> = {
  completed: 'Review',
  attempted: 'Resume',
  not_started: 'Start',
}

const ACTION_CLASS: Record<ChallengeStatus, string> = {
  completed: 'text-ink-muted',
  attempted: 'text-flame',
  not_started: 'text-forest-700',
}

/** Stage B difficulty pill tints (Easy green, Medium amber, Hard red). */
const DIFFICULTY_PILL: Record<PracticeDifficulty, string> = {
  easy: 'bg-sd-bg text-sd-fg',
  medium: 'bg-sql-bg text-sql-fg',
  hard: 'bg-error/10 text-error',
}

function ChallengeRow({ challenge, locked = false, returnHref, collectionParam }: { challenge: ChallengeWithDomain; locked?: boolean; returnHref?: string; collectionParam?: CollectionParam }) {
  const difficulty = coerceDifficulty(challenge.difficulty)
  const topicLabel = challenge.topic_tags?.[0] ? getTopicLabelAny(challenge.topic_tags[0]) : undefined
  const techLabel = challenge.technique_tags?.[0] ? getTechniqueLabelAny(challenge.technique_tags[0]) : undefined
  const isReal = challenge.is_real_interview && (challenge.company_tags ?? []).length > 0
  const numberLabel = formatChallengeNumber(challenge.challenge_type, challenge.display_number)
  // collectionParam opens the 3-panel shell (left index); otherwise fall back to
  // a plain returnTo back-button.
  const basePath = challengePath(challenge)
  const href = collectionParam
    ? `${basePath}${basePath.includes('?') ? '&' : '?'}${collectionParam.key}=${encodeURIComponent(collectionParam.slug)}&cid=${encodeURIComponent(challenge.id)}`
    : appendReturnTo(basePath, returnHref)
  const status = deriveChallengeStatus(challenge)

  const rowClass = 'flex items-center gap-3 px-4 py-2.5 group transition-colors'
  const inner = (
    <>
      {/* Completion state */}
      {STATUS_ICON[status]}

      {/* Title + chips */}
      <div className="min-w-0 flex-1">
        <span className={`block truncate text-[13.5px] font-bold ${status === 'not_started' ? 'text-ink-strong' : 'text-ink-strong/90'}`}>
          {challenge.title}
        </span>
        {(numberLabel || topicLabel || techLabel || isReal) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {numberLabel && (
              <span className="rounded-full bg-page-field px-1.5 py-px font-mono text-[10px] text-ink-secondary">
                {numberLabel}
              </span>
            )}
            {topicLabel && (
              <span className="rounded-full bg-sd-bg px-1.5 py-px font-label text-[10px] font-semibold text-sd-fg">
                {topicLabel}
              </span>
            )}
            {techLabel && (
              <span className="rounded-full bg-page-field px-1.5 py-px font-label text-[10px] font-semibold text-ink-secondary">
                {techLabel}
              </span>
            )}
            {isReal && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-note-amber px-1.5 py-px font-label text-[10px] font-bold text-ink-strong/80">
                <BadgeCheck className="size-2.5" />
                {askedAtLabel(challenge.company_tags![0])}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Fixed columns: score · difficulty · action · arrow */}
      <span className="hidden w-14 shrink-0 text-right text-[11.5px] font-bold tabular-nums sm:block">
        {challenge.best_score != null ? (
          <span className={challenge.best_score >= 70 ? 'text-forest-700' : 'text-flame'}>
            {challenge.best_score}/100
          </span>
        ) : null}
      </span>
      {difficulty && (
        <span className={`w-[62px] shrink-0 rounded-full px-2 py-0.5 text-center font-label text-[10px] font-bold capitalize ${DIFFICULTY_PILL[difficulty]}`}>
          {difficulty}
        </span>
      )}
      <span className={`w-[54px] shrink-0 text-right font-label text-[10.5px] font-extrabold uppercase tracking-wide ${ACTION_CLASS[status]}`}>
        {ACTION_LABEL[status]}
      </span>
      {locked ? (
        <Lock className="size-3.5 shrink-0 text-ink-muted" />
      ) : (
        <ArrowRight className="size-3.5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  )

  if (locked) {
    return (
      <div className={`${rowClass} opacity-70 cursor-not-allowed select-none`} aria-disabled>
        {inner}
      </div>
    )
  }

  return (
    <Link href={href} className={`${rowClass} hover:bg-page-field`}>
      {inner}
    </Link>
  )
}

/**
 * A topic section. The header + count render immediately (count from server);
 * the challenge rows are fetched lazily on first expand, then paginated with an
 * in-section "load more". Nothing for this section loads until the user opens it.
 */
function TopicSection({
  title,
  topicSlug,
  total,
  defaultExpanded = false,
  locked = false,
  returnHref,
  discipline,
  searchString,
  pageSize,
  sort = 'recommended',
}: {
  title: string
  topicSlug: string
  total: number
  defaultExpanded?: boolean
  locked?: boolean
  returnHref?: string
  discipline: Discipline
  searchString: string
  pageSize: number
  sort?: PracticeSort
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [rows, setRows] = useState<ChallengeWithDomain[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(total > 0)
  const [loading, setLoading] = useState(false)
  const loadedOnce = useRef(false)

  const fetchPage = useCallback(async (nextPage: number, replace: boolean) => {
    setLoading(true)
    try {
      const qs = sectionQuery({ searchString, discipline, topic: topicSlug, page: nextPage, limit: pageSize })
      const res = await fetch(`/api/challenges?${qs}`)
      if (res.ok) {
        const data: ListResponse = await res.json()
        setRows((prev) => {
          if (replace) return data.challenges
          const seen = new Set(prev.map((c) => c.id))
          return [...prev, ...data.challenges.filter((c) => !seen.has(c.id))]
        })
        setPage(nextPage)
        setHasMore(data.has_more)
      }
    } finally {
      setLoading(false)
    }
  }, [searchString, discipline, topicSlug, pageSize])

  // Load the first page the first time the section opens.
  useEffect(() => {
    if (expanded && !loadedOnce.current) {
      loadedOnce.current = true
      void fetchPage(1, true)
    }
  }, [expanded, fetchPage])

  const sorted = sortChallenges(rows, sort)

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-card-bright">
      <button
        onClick={() => setExpanded(e => !e)}
        className="sticky top-0 z-10 flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-page-field"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sd-bg">
            <Tag className="size-4 text-sd-fg" />
          </div>
          <div className="text-left">
            <div className="font-label text-sm font-bold text-ink-strong">{title}</div>
            <div className="mt-0.5 font-label text-[11px] tabular-nums text-ink-secondary">
              {total} challenge{total !== 1 ? 's' : ''} · {SORT_DESCRIPTOR[sort]}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label text-[11px] font-semibold tabular-nums text-ink-secondary">
            {total}
          </span>
          {expanded ? <ChevronUp className="size-4 text-ink-secondary" /> : <ChevronDown className="size-4 text-ink-secondary" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-hairline/60 border-t border-hairline">
          {loading && rows.length === 0 ? (
            <div className="px-5 py-6 text-center font-label text-xs text-ink-secondary">Loading…</div>
          ) : (
            <>
              {sorted.map(c => (
                <ChallengeRow key={c.id} challenge={c} locked={locked} returnHref={returnHref} />
              ))}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => fetchPage(page + 1, false)}
                  disabled={loading}
                  className="w-full px-5 py-3 text-center font-label text-xs font-semibold text-forest-700 hover:bg-page-field disabled:opacity-50"
                >
                  {loading ? 'Loading…' : `Load more (${total - rows.length} more)`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Static topic section (domain pages): rows are already in memory, grouped and
 * sorted client-side. No server fetch.
 */
function StaticTopicSection({
  title,
  challenges,
  defaultExpanded = false,
  locked = false,
  returnHref,
  collectionParam,
}: {
  title: string
  challenges: ChallengeWithDomain[]
  defaultExpanded?: boolean
  locked?: boolean
  returnHref?: string
  collectionParam?: CollectionParam
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const completedCount = challenges.filter(c => c.is_completed).length
  const sorted = sortChallenges(challenges)

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-card-bright">
      <button
        onClick={() => setExpanded(e => !e)}
        className="sticky top-0 z-10 flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-page-field"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sd-bg">
            <Tag className="size-4 text-sd-fg" />
          </div>
          <div className="text-left">
            <div className="font-label text-sm font-bold text-ink-strong">{title}</div>
            <div className="mt-0.5 font-label text-[11px] tabular-nums text-ink-secondary">
              {completedCount}/{challenges.length} completed
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label text-[11px] font-semibold tabular-nums text-ink-secondary">{challenges.length}</span>
          {expanded ? <ChevronUp className="size-4 text-ink-secondary" /> : <ChevronDown className="size-4 text-ink-secondary" />}
        </div>
      </button>
      {expanded && (
        <div className="divide-y divide-hairline/60 border-t border-hairline">
          {sorted.map(c => (
            <ChallengeRow key={c.id} challenge={c} locked={locked} returnHref={returnHref} collectionParam={collectionParam} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Static client-side grouping for domain pages (small, pre-fetched lists). */
function StaticGroupedList({ challenges, groupBy, topicLabels, returnHref, collectionParam, enforceLimit = true }: StaticProps) {
  const atLimit = useIsAtLimit('challenges')
  const locked = enforceLimit && atLimit

  if (challenges.length === 0) {
    return <EmptyState compact title="No challenges to display" hint="Adjust your filters to see more reps." />
  }

  if (groupBy === 'none') {
    const sorted = sortChallenges(challenges)
    return (
      <div className="divide-y divide-hairline/60 overflow-hidden rounded-xl border border-hairline bg-card-bright">
        {sorted.map(c => <ChallengeRow key={c.id} challenge={c} locked={locked} returnHref={returnHref} collectionParam={collectionParam} />)}
      </div>
    )
  }

  const grouped = new Map<string, ChallengeWithDomain[]>()
  const ungrouped: ChallengeWithDomain[] = []
  for (const c of challenges) {
    const primary = c.topic_tags?.[0]
    if (primary) {
      const bucket = grouped.get(primary) ?? []
      bucket.push(c)
      grouped.set(primary, bucket)
    } else {
      ungrouped.push(c)
    }
  }

  const topicEntries = Array.from(grouped.entries()).sort((a, b) => {
    const sizeDiff = b[1].length - a[1].length
    if (sizeDiff !== 0) return sizeDiff
    const la = topicLabels[a[0]] ?? a[0]
    const lb = topicLabels[b[0]] ?? b[0]
    return la.localeCompare(lb)
  })

  return (
    <div className="space-y-3">
      {topicEntries.map(([slug, items], idx) => (
        <StaticTopicSection
          key={slug}
          title={topicLabels[slug] ?? getTopicLabelAny(slug) ?? slug}
          challenges={items}
          defaultExpanded={idx === 0}
          locked={locked}
          returnHref={returnHref}
          collectionParam={collectionParam}
        />
      ))}
      {ungrouped.length > 0 && (
        <StaticTopicSection
          title="Other"
          challenges={ungrouped}
          defaultExpanded={topicEntries.length === 0}
          locked={locked}
          returnHref={returnHref}
          collectionParam={collectionParam}
        />
      )}
    </div>
  )
}

/**
 * Grouped challenge list. In server mode (Practice) fetches topic counts from
 * the server (groupBy=topic) and lazy-loads each section's rows on expand. In
 * static mode (domain pages) groups a pre-fetched array client-side.
 */
export function GroupedChallengeList(props: Props) {
  if (isStaticProps(props)) {
    return <StaticGroupedList {...props} />
  }
  return <ServerGroupedList {...props} />
}

function ServerGroupedList({ discipline, returnHref, searchString, pageSize, sort = 'recommended', enforceLimit = true }: ServerProps) {
  const atLimit = useIsAtLimit('challenges')
  const locked = enforceLimit && atLimit

  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const p = new URLSearchParams(searchString)
    p.set('discipline', discipline)
    p.set('groupBy', 'topic')
    fetch(`/api/challenges/count?${p.toString()}`)
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((data) => { if (!cancelled) setTopicCounts(data.counts ?? {}) })
      .catch(() => { if (!cancelled) setTopicCounts({}) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [discipline, searchString])

  if (loading) {
    return <div className="py-12 text-center font-label text-sm text-ink-secondary">Loading…</div>
  }

  const topicEntries = Object.entries(topicCounts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => {
      const sizeDiff = b[1] - a[1]
      if (sizeDiff !== 0) return sizeDiff
      const la = getTopicLabelAny(a[0]) ?? a[0]
      const lb = getTopicLabelAny(b[0]) ?? b[0]
      return la.localeCompare(lb)
    })

  if (topicEntries.length === 0) {
    return (
      <EmptyState compact title="No challenges to display" hint="Adjust your filters to see more reps." />
    )
  }

  return (
    <div className="space-y-3">
      {topicEntries.map(([slug, total], idx) => (
        <TopicSection
          key={slug}
          title={getTopicLabelAny(slug) ?? slug}
          topicSlug={slug}
          total={total}
          defaultExpanded={idx === 0}
          locked={locked}
          returnHref={returnHref}
          discipline={discipline}
          searchString={searchString}
          pageSize={pageSize}
          sort={sort}
        />
      ))}
    </div>
  )
}

/**
 * Flat rows variant — used by the chip-filtered discipline view, which already
 * holds the rows in state (paginated by its parent). Renders a single bordered
 * list with no topic grouping.
 */
function FlatRows({ challenges, returnHref, sort = 'recommended' }: { challenges: ChallengeWithDomain[]; returnHref?: string; sort?: PracticeSort }) {
  const atLimit = useIsAtLimit('challenges')
  if (challenges.length === 0) return null
  const sorted = sortChallenges(challenges, sort)
  return (
    <div className="divide-y divide-hairline/60 overflow-hidden rounded-xl border border-hairline bg-card-bright">
      {sorted.map(c => (
        <ChallengeRow key={c.id} challenge={c} locked={atLimit} returnHref={returnHref} />
      ))}
    </div>
  )
}

GroupedChallengeList.FlatRows = FlatRows
