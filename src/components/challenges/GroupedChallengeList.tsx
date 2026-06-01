// src/components/challenges/GroupedChallengeList.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useIsAtLimit } from '@/context/UsageContext'
import { appendReturnTo } from '@/lib/navigation/return-to'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { coerceDifficulty, DIFFICULTY_PILL_CLASSES } from '@/lib/practice/difficulty'
import { getTopicLabelAny, getTechniqueLabelAny } from '@/lib/data/taxonomy'
import type { ChallengeWithDomain } from '@/lib/types'

interface Props {
  challenges: ChallengeWithDomain[]
  groupBy: 'primaryTopic' | 'none'
  /** Record<topicSlug, topicTitle> — passed in from server; not fetched here. */
  topicLabels: Record<string, string>
  /** When set, appended to each challenge href as ?returnTo= so the workspace back button returns here. */
  returnHref?: string
  /** Apply the challenges usage paywall (lock rows at limit). Default true; domain browse pages pass false. */
  enforceLimit?: boolean
}

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'] as const

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

function ChallengeRow({ challenge, locked = false, returnHref }: { challenge: ChallengeWithDomain; locked?: boolean; returnHref?: string }) {
  const difficulty = coerceDifficulty(challenge.difficulty)
  const pillClass = difficulty ? DIFFICULTY_PILL_CLASSES[difficulty] : 'bg-surface-container text-on-surface-variant'
  const topicLabel = challenge.topic_tags?.[0] ? getTopicLabelAny(challenge.topic_tags[0]) : undefined
  const techLabel = challenge.technique_tags?.[0] ? getTechniqueLabelAny(challenge.technique_tags[0]) : undefined
  const isReal = challenge.is_real_interview && (challenge.company_tags ?? []).length > 0
  const href = appendReturnTo(challengePath(challenge), returnHref)

  const rowClass = 'flex items-center gap-3 px-4 py-3 group transition-colors'
  const inner = (
    <>
      {/* Completion state */}
      <span
        className={`material-symbols-outlined text-[20px] shrink-0 ${
          challenge.is_completed ? 'text-primary' : challenge.is_in_progress ? 'text-tertiary' : 'text-outline'
        }`}
        style={challenge.is_completed || challenge.is_in_progress ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {challenge.is_completed
          ? 'check_circle'
          : challenge.is_in_progress
          ? 'timelapse'
          : 'radio_button_unchecked'}
      </span>

      {/* Title + chips */}
      <div className="min-w-0 flex-1">
        <span
          className={`text-sm font-semibold truncate block ${
            challenge.is_completed ? 'text-on-surface' : 'text-on-surface-variant'
          }`}
        >
          {challenge.title}
        </span>
        {(topicLabel || techLabel || isReal) && (
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
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
            {challenge.is_in_progress ? 'Resume' : 'Start'}
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

interface TopicSectionProps {
  title: string
  challenges: ChallengeWithDomain[]
  defaultExpanded?: boolean
  locked?: boolean
  returnHref?: string
}

function TopicSection({ title, challenges, defaultExpanded = true, locked = false, returnHref }: TopicSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const completedCount = challenges.filter(c => c.is_completed).length
  const sorted = sortChallenges(challenges)

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden">
      {/* Section header — sticky within its container */}
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
              {completedCount}/{challenges.length} completed
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label text-[11px] font-semibold text-on-surface-variant tabular-nums">
            {challenges.length}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
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

export function GroupedChallengeList({ challenges, groupBy, topicLabels, returnHref, enforceLimit = true }: Props) {
  const atLimit = useIsAtLimit('challenges')
  const locked = enforceLimit && atLimit

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12 text-on-surface-variant font-label text-sm">
        No challenges to display.
      </div>
    )
  }

  // ── groupBy='none': flat sorted list ────────────────────────────────────────
  if (groupBy === 'none') {
    const sorted = sortChallenges(challenges)
    return (
      <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface divide-y divide-outline-variant/10">
        {sorted.map(c => (
          <ChallengeRow key={c.id} challenge={c} locked={locked} returnHref={returnHref} />
        ))}
      </div>
    )
  }

  // ── groupBy='primaryTopic': group by challenge.topic_tags[0] ───────────────
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

  // Order topics: by size descending, then alphabetically by resolved label
  const topicEntries = Array.from(grouped.entries()).sort((a, b) => {
    const sizeDiff = b[1].length - a[1].length
    if (sizeDiff !== 0) return sizeDiff
    const la = topicLabels[a[0]] ?? a[0]
    const lb = topicLabels[b[0]] ?? b[0]
    return la.localeCompare(lb)
  })

  return (
    <div className="space-y-3">
      {topicEntries.map(([slug, items], idx) => {
        const label = topicLabels[slug] ?? getTopicLabelAny(slug) ?? slug
        return (
          <TopicSection
            key={slug}
            title={label}
            challenges={items}
            defaultExpanded={idx === 0}
            locked={locked}
            returnHref={returnHref}
          />
        )
      })}

      {ungrouped.length > 0 && (
        <TopicSection
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
