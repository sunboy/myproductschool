// src/components/challenges/GroupedChallengeList.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useIsAtLimit } from '@/context/UsageContext'
import { appendReturnTo } from '@/lib/navigation/return-to'
import { challengePath, formatChallengeNumber } from '@/lib/challenges/challengeNumber'
import { coerceDifficulty, DIFFICULTY_PILL_CLASSES } from '@/lib/practice/difficulty'
import { getTopicLabelAny, getTechniqueLabelAny } from '@/lib/data/taxonomy'
import { deriveChallengeStatus } from '@/lib/challenges/status'
import type { ChallengeWithDomain } from '@/lib/types'
import type { Discipline } from './DisciplineTabStrip'
import type { FilterState } from './FilterDropdownBar'

/**
 * Server mode (Practice): topic counts + lazy per-section row loading via the
 * API. Static mode (domain pages): a pre-fetched challenge array grouped in
 * memory, no server fetch. Discriminated by the presence of `discipline`.
 */
interface ServerProps {
  discipline: Discipline
  filters: FilterState
  /** When set, appended to each challenge href as ?returnTo= so the workspace back button returns here. */
  returnHref?: string
  /** Current URL query string — drives the server count/list fetches. */
  searchString: string
  /** Rows fetched per section page. */
  pageSize: number
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

function sortChallenges(list: ChallengeWithDomain[]): ChallengeWithDomain[] {
  return [...list].sort((a, b) => {
    const diff = difficultyOrder(a.difficulty) - difficultyOrder(b.difficulty)
    if (diff !== 0) return diff
    return (a.title ?? '').localeCompare(b.title ?? '')
  })
}

/** Build a /api/challenges query for a discipline section, optionally scoped to a topic. */
function sectionQuery(opts: { searchString: string; discipline: Discipline; topic?: string; page: number; limit: number }): string {
  const p = new URLSearchParams(opts.searchString)
  p.delete('view')
  if (opts.discipline !== 'all') p.set('discipline', opts.discipline)
  if (opts.topic) p.set('topic', opts.topic)
  p.set('page', String(opts.page))
  p.set('limit', String(opts.limit))
  return p.toString()
}

function ChallengeRow({ challenge, locked = false, returnHref }: { challenge: ChallengeWithDomain; locked?: boolean; returnHref?: string }) {
  const difficulty = coerceDifficulty(challenge.difficulty)
  const pillClass = difficulty ? DIFFICULTY_PILL_CLASSES[difficulty] : 'bg-surface-container text-on-surface-variant'
  const topicLabel = challenge.topic_tags?.[0] ? getTopicLabelAny(challenge.topic_tags[0]) : undefined
  const techLabel = challenge.technique_tags?.[0] ? getTechniqueLabelAny(challenge.technique_tags[0]) : undefined
  const isReal = challenge.is_real_interview && (challenge.company_tags ?? []).length > 0
  const numberLabel = formatChallengeNumber(challenge.challenge_type, challenge.display_number)
  const href = appendReturnTo(challengePath(challenge), returnHref)
  const status = deriveChallengeStatus(challenge)

  const rowClass = 'flex items-center gap-3 px-4 py-3 group transition-colors'
  const inner = (
    <>
      {/* Completion state */}
      <span
        className={`material-symbols-outlined text-[20px] shrink-0 ${
          status === 'completed' ? 'text-primary' : status === 'attempted' ? 'text-tertiary' : 'text-outline'
        }`}
        style={status !== 'not_started' ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {status === 'completed'
          ? 'check_circle'
          : status === 'attempted'
          ? 'timelapse'
          : 'radio_button_unchecked'}
      </span>

      {/* Title + chips */}
      <div className="min-w-0 flex-1">
        <span
          className={`text-sm font-semibold truncate block ${
            status === 'completed' ? 'text-on-surface' : 'text-on-surface-variant'
          }`}
        >
          {challenge.title}
        </span>
        {(numberLabel || topicLabel || techLabel || isReal) && (
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {numberLabel && (
              <span className="font-mono text-[10px] px-1.5 py-px rounded-full bg-surface-container-highest text-on-surface-variant">
                {numberLabel}
              </span>
            )}
            {topicLabel && (
              <span className="text-[10px] font-label font-semibold px-1.5 py-px rounded-full bg-primary-fixed text-primary">
                {topicLabel}
              </span>
            )}
            {techLabel && (
              <span className="text-[10px] font-label font-semibold px-1.5 py-px rounded-full bg-surface-container-highest text-on-surface-variant">
                {techLabel}
              </span>
            )}
            {isReal && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-label font-bold px-1.5 py-px rounded-full bg-tertiary-container text-on-secondary-container">
                <span
                  className="material-symbols-outlined text-[10px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                {challenge.company_tags![0]}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: difficulty + score */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {difficulty && (
          <span className={`text-[10px] font-label font-bold px-2 py-0.5 rounded-full capitalize ${pillClass}`}>
            {difficulty}
          </span>
        )}
        {challenge.best_score != null ? (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
              challenge.best_score >= 70
                ? 'text-primary bg-primary-fixed'
                : 'text-amber-700 bg-tertiary-container'
            }`}
          >
            {challenge.best_score}/100
          </span>
        ) : (
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-tight font-label">
            {status === 'attempted' ? 'Resume' : 'Start'}
          </span>
        )}
        {locked ? (
          <span className="material-symbols-outlined text-on-surface-variant text-sm">lock</span>
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        )}
      </div>
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
    <Link href={href} className={`${rowClass} hover:bg-surface-container`}>
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

  const sorted = sortChallenges(rows)

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 bg-surface-container-high/30 hover:bg-surface-container-high/50 transition-colors sticky top-0 z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-primary text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              label
            </span>
          </div>
          <div className="text-left">
            <div className="font-label font-bold text-sm text-on-surface">{title}</div>
            <div className="text-[11px] text-on-surface-variant font-label mt-0.5 tabular-nums">
              {total} challenge{total !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label text-[11px] font-semibold text-on-surface-variant tabular-nums">
            {total}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="bg-surface divide-y divide-outline-variant/10">
          {loading && rows.length === 0 ? (
            <div className="px-5 py-6 text-center text-on-surface-variant font-label text-xs">Loading…</div>
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
                  className="w-full px-5 py-3 text-center font-label text-xs font-semibold text-primary hover:bg-surface-container-low disabled:opacity-50"
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
}: {
  title: string
  challenges: ChallengeWithDomain[]
  defaultExpanded?: boolean
  locked?: boolean
  returnHref?: string
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const completedCount = challenges.filter(c => c.is_completed).length
  const sorted = sortChallenges(challenges)

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 bg-surface-container-high/30 hover:bg-surface-container-high/50 transition-colors sticky top-0 z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>label</span>
          </div>
          <div className="text-left">
            <div className="font-label font-bold text-sm text-on-surface">{title}</div>
            <div className="text-[11px] text-on-surface-variant font-label mt-0.5 tabular-nums">
              {completedCount}/{challenges.length} completed
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label text-[11px] font-semibold text-on-surface-variant tabular-nums">{challenges.length}</span>
          <span className="material-symbols-outlined text-on-surface-variant">{expanded ? 'expand_less' : 'expand_more'}</span>
        </div>
      </button>
      {expanded && (
        <div className="bg-surface divide-y divide-outline-variant/10">
          {sorted.map(c => (
            <ChallengeRow key={c.id} challenge={c} locked={locked} returnHref={returnHref} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Static client-side grouping for domain pages (small, pre-fetched lists). */
function StaticGroupedList({ challenges, groupBy, topicLabels, returnHref, enforceLimit = true }: StaticProps) {
  const atLimit = useIsAtLimit('challenges')
  const locked = enforceLimit && atLimit

  if (challenges.length === 0) {
    return <div className="text-center py-12 text-on-surface-variant font-label text-sm">No challenges to display.</div>
  }

  if (groupBy === 'none') {
    const sorted = sortChallenges(challenges)
    return (
      <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface divide-y divide-outline-variant/10">
        {sorted.map(c => <ChallengeRow key={c.id} challenge={c} locked={locked} returnHref={returnHref} />)}
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
        />
      ))}
      {ungrouped.length > 0 && (
        <StaticTopicSection
          title="Other"
          challenges={ungrouped}
          defaultExpanded={topicEntries.length === 0}
          locked={locked}
          returnHref={returnHref}
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

function ServerGroupedList({ discipline, returnHref, searchString, pageSize, enforceLimit = true }: ServerProps) {
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
    return <div className="text-center py-12 text-on-surface-variant font-label text-sm">Loading…</div>
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
      <div className="text-center py-12 text-on-surface-variant font-label text-sm">
        No challenges to display.
      </div>
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
function FlatRows({ challenges, returnHref }: { challenges: ChallengeWithDomain[]; returnHref?: string }) {
  const atLimit = useIsAtLimit('challenges')
  if (challenges.length === 0) return null
  const sorted = sortChallenges(challenges)
  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface divide-y divide-outline-variant/10">
      {sorted.map(c => (
        <ChallengeRow key={c.id} challenge={c} locked={atLimit} returnHref={returnHref} />
      ))}
    </div>
  )
}

GroupedChallengeList.FlatRows = FlatRows
