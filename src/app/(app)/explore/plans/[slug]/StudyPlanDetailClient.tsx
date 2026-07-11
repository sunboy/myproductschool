'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Check, Play, ChevronRight } from 'lucide-react'
import { ProgressRing } from '@/components/redesign/ProgressRing'
import { HatchSays } from '@/components/redesign/HatchSays'
import { InkMark } from '@/components/redesign/InkMark'
import { disciplineFor, disciplineLabelFor } from '@/components/redesign/dashboard/discipline'
import { DISCIPLINE_ICON, DISCIPLINE_FG_CLASS } from '@/components/redesign/DisciplineTile'
import { BackButton } from '@/components/navigation/BackButton'
import type { StudyPlanItem, StudyPlanWithItems } from '@/lib/types'
import { difficultyLabel } from '@/lib/utils'
import { trackEvent } from '@/lib/posthog/client'
import {
  EVENT_STUDY_PLAN_VIEWED,
  EVENT_STUDY_PLAN_ENROLLED,
  EVENT_STUDY_PLAN_CHAPTER_OPENED,
  EVENT_STUDY_PLAN_COMPLETED,
} from '@/lib/posthog/events'

// ─── helpers ──────────────────────────────────────────────────────────────────

interface Chapter {
  title: string
  items: StudyPlanItem[]
}

function groupByChapter(items: StudyPlanItem[]): Chapter[] {
  const chapters: Chapter[] = []
  const byTitle = new Map<string, Chapter>()
  for (const item of items) {
    const title = item.chapter_title ?? 'Uncategorized'
    let chapter = byTitle.get(title)
    if (!chapter) {
      chapter = { title, items: [] }
      byTitle.set(title, chapter)
      chapters.push(chapter)
    }
    chapter.items.push(item)
  }
  return chapters
}

function itemHref(item: StudyPlanItem, slug: string): string | null {
  if (item.item_type === 'challenge' && item.challenge_id) {
    return `/workspace/challenges/${item.challenge_id}?from_plan=${slug}`
  }
  if (item.lesson) {
    return `/explore/modules/${item.lesson.module_slug}?chapter=${item.lesson.slug}`
  }
  return null
}

function itemIsCompleted(item: StudyPlanItem): boolean {
  return item.challenge?.is_completed ?? item.lesson?.is_completed ?? false
}

function itemMeta(item: StudyPlanItem): string | null {
  if (item.challenge) {
    const bits = [difficultyLabel(item.challenge.difficulty)]
    if (item.challenge.estimated_minutes) bits.push(`~${item.challenge.estimated_minutes} min`)
    return bits.join(' · ')
  }
  return null
}

// ─── main export ──────────────────────────────────────────────────────────────

export function StudyPlanDetailClient({ plan, slug }: { plan: StudyPlanWithItems; slug: string }) {
  const diff = plan.difficulty ?? 'intermediate'
  const difficultyText = difficultyLabel(diff)

  useEffect(() => {
    trackEvent(EVENT_STUDY_PLAN_VIEWED, { plan_slug: slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useEffect(() => {
    if (plan.progress_percentage >= 100) {
      trackEvent(EVENT_STUDY_PLAN_COMPLETED, { plan_slug: slug })
    }
    // Only fire once when progress first hits 100
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chapters = groupByChapter(plan.items)
  const allChallengeItems = plan.items.filter(i => i.item_type === 'challenge' && i.challenge_id)
  const firstIncompleteChapterIdx = chapters.findIndex(ch => ch.items.some(i => !itemIsCompleted(i)))
  const currentChapterIdx = firstIncompleteChapterIdx === -1 ? chapters.length - 1 : firstIncompleteChapterIdx
  const currentChapter = chapters[currentChapterIdx] as Chapter | undefined
  const firstIncompleteItem = currentChapter?.items.find(i => !itemIsCompleted(i))

  const ctaItem = firstIncompleteItem ?? allChallengeItems[0]
  const ctaHref = ctaItem ? itemHref(ctaItem, slug) : null

  const totalDone = plan.items.filter(itemIsCompleted).length
  const pct = plan.progress_percentage

  const totalMinutes = plan.items.reduce((sum, i) => sum + (i.challenge?.estimated_minutes ?? 0), 0)
  const totalTimeLabel = totalMinutes > 0
    ? totalMinutes >= 60
      ? `~${Math.round(totalMinutes / 60)}h`
      : `~${totalMinutes} min`
    : null

  // Hatch's message: grounded in the real current chapter and the item that
  // needs attention, not generic filler.
  const hatchMessage = currentChapter && firstIncompleteItem
    ? `${currentChapter.title} is next${firstIncompleteItem.challenge ? `. Start with ${firstIncompleteItem.challenge.title}` : ''}.`
    : pct >= 100
      ? `You finished every chapter in ${plan.title}. Nothing left queued here.`
      : `${plan.title} is ready whenever you are.`

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-5">
      <BackButton href="/explore/plans" label="Back to Study Plans" className="mb-3" />

      {/* ── Plan header card ── */}
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-hairline bg-card-bright p-5 shadow-[0_1px_2px_rgba(30,27,20,.04)]">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 font-label text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-ps-fg">
            Study Plan
          </div>
          <h1 className="mb-2.5 font-headline text-[27px] font-semibold leading-[1.2] text-ink-strong">
            {plan.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-hairline bg-page-field px-3 py-1 text-xs font-bold tabular-nums text-ink-secondary">
              {plan.chapter_count} {plan.chapter_count === 1 ? 'chapter' : 'chapters'}
            </span>
            <span className="rounded-full border border-hairline bg-page-field px-3 py-1 text-xs font-bold tabular-nums text-ink-secondary">
              {plan.item_count} {plan.item_count === 1 ? 'item' : 'items'}
            </span>
            <span className="rounded-full bg-sd-bg px-3 py-1 text-xs font-bold text-sd-fg">
              {difficultyText}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <ProgressRing
            percent={pct}
            size={64}
            strokeWidth={6}
            trackColor="var(--color-hairline)"
            color="var(--color-forest-600)"
          >
            <span className="relative inline-block font-headline text-[15px] font-bold tabular-nums text-ink-strong">
              {totalDone}/{plan.item_count}
              {pct > 0 && (
                <InkMark
                  variant="underline"
                  width={34}
                  height={8}
                  className="pointer-events-none absolute -left-[5px] top-[13px] z-[1]"
                />
              )}
            </span>
            <span className="mt-0.5 text-[9.5px] font-bold text-ink-muted">done</span>
          </ProgressRing>

          {ctaHref && (
            <Link
              href={ctaHref}
              onClick={() => {
                if (pct === 0) trackEvent(EVENT_STUDY_PLAN_ENROLLED, { plan_slug: slug })
              }}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-forest-950 px-5 py-3 font-body text-[13.5px] font-extrabold text-white no-underline"
            >
              <Play size={14} strokeWidth={0} fill="currentColor" />
              {pct > 0 ? `Continue ${currentChapter?.title ?? 'plan'}` : 'Start plan'}
            </Link>
          )}
        </div>
      </section>

      {/* ── Two-column body ── */}
      <div className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_320px]">

        {/* Left: chapter list */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-hairline bg-card-bright shadow-[0_1px_2px_rgba(30,27,20,.04)]">
          {chapters.map((chapter, idx) => {
            const completedInChapter = chapter.items.filter(itemIsCompleted).length
            const totalInChapter = chapter.items.length
            const isDone = completedInChapter === totalInChapter && totalInChapter > 0
            const isCurrent = idx === currentChapterIdx && !isDone
            const isUpcoming = !isDone && !isCurrent

            const markerClass = isDone
              ? 'size-[22px] bg-forest-600 text-white'
              : isCurrent
                ? 'size-[22px] border-2 border-forest-700 bg-sd-bg text-forest-700'
                : 'size-5 border-[1.4px] border-hairline text-ink-muted'

            const firstItemHref = chapter.items[0] ? itemHref(chapter.items[0], slug) : null

            return (
              <div
                key={chapter.title}
                className={
                  isCurrent
                    ? 'note-amber note-tilt relative z-[1] my-[3px] mx-1.5 rounded-[10px]'
                    : idx > 0
                      ? 'border-t border-hairline'
                      : undefined
                }
              >
                <div className="flex min-h-[48px] items-center gap-3 px-4 py-2.5">
                  <div className={`flex shrink-0 items-center justify-center rounded-full font-label text-[10.5px] font-extrabold tabular-nums ${markerClass}`}>
                    {isDone ? <Check size={13} strokeWidth={3.4} /> : idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`mb-px font-label text-[10.5px] font-extrabold uppercase tracking-[0.05em] ${isCurrent ? 'text-forest-700' : 'text-ink-muted'}`}>
                      Chapter {idx + 1}{isCurrent ? ' · In progress' : ''}
                    </div>
                    <div className={`font-body text-[14.5px] font-bold ${isUpcoming ? 'text-ink-secondary' : 'text-ink-strong'}`}>
                      {chapter.title}
                    </div>
                    <div className="mt-px text-[11.5px] font-semibold tabular-nums text-ink-muted">
                      {totalInChapter} {totalInChapter === 1 ? 'item' : 'items'}
                      {isDone && ' · completed'}
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="whitespace-nowrap rounded-full border-[1.5px] border-forest-700 bg-sd-bg px-2.5 py-[3.5px] font-label text-[10.5px] font-extrabold uppercase tracking-[0.03em] text-forest-700">
                      Current
                    </span>
                  )}
                  {isDone && firstItemHref && (
                    <Link
                      href={firstItemHref}
                      className="flex shrink-0 items-center gap-1 whitespace-nowrap font-body text-[12.5px] font-extrabold text-forest-700 no-underline"
                    >
                      Review
                      <ChevronRight size={14} strokeWidth={2} />
                    </Link>
                  )}
                </div>

                {isCurrent && (
                  <div className="mt-0.5 border-t border-[#ecd48a] px-4 pb-3">
                    {chapter.items.map((item, itemIdx) => {
                      const href = itemHref(item, slug)
                      const completed = itemIsCompleted(item)
                      const meta = itemMeta(item)
                      const title = item.challenge?.title ?? item.lesson?.title ?? 'Untitled'
                      const discipline = item.challenge
                        ? disciplineFor(item.challenge.challenge_type, item.challenge.domain?.title)
                        : null
                      const eyebrow = item.challenge
                        ? disciplineLabelFor(item.challenge.challenge_type, item.challenge.domain?.title)
                        : item.lesson
                          ? 'Lesson'
                          : null
                      const EyebrowIcon = discipline ? DISCIPLINE_ICON[discipline] : null
                      const actionLabel = completed
                        ? 'Review'
                        : item.challenge?.is_in_progress
                          ? 'Continue'
                          : item.lesson
                            ? 'Read'
                            : 'Start'

                      return (
                        <Link
                          key={item.id}
                          href={href ?? '#'}
                          onClick={() => {
                            trackEvent(EVENT_STUDY_PLAN_CHAPTER_OPENED, {
                              plan_slug: slug,
                              chapter_title: chapter.title,
                              item_id: item.id,
                            })
                          }}
                          className={`flex min-h-11 items-center gap-3 py-2.5 no-underline ${itemIdx > 0 ? 'border-t border-[#ecd48a]' : ''}`}
                        >
                          <div className="min-w-0 flex-1">
                            {eyebrow && (
                              <div className={`mb-0.5 flex items-center gap-1.5 font-label text-[10.5px] font-extrabold uppercase tracking-[0.05em] ${discipline ? DISCIPLINE_FG_CLASS[discipline] : 'text-ink-secondary'}`}>
                                {EyebrowIcon && <EyebrowIcon size={13} strokeWidth={1.8} />}
                                {eyebrow}
                              </div>
                            )}
                            <div className="font-body text-[13.5px] font-bold leading-[1.3] text-ink-strong">
                              {title}
                            </div>
                            {meta && (
                              <div className="mt-px text-[11.5px] font-semibold tabular-nums text-ink-muted">
                                {meta}
                              </div>
                            )}
                          </div>
                          <span className="shrink-0 whitespace-nowrap rounded-lg bg-forest-950 px-4 py-2 font-body text-xs font-extrabold text-white">
                            {actionLabel}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: rail */}
        <div className="flex flex-col gap-3">
          <HatchSays message={hatchMessage} tint="mint" />

          <div className="rounded-xl border border-hairline bg-card-bright p-4 shadow-[0_1px_2px_rgba(30,27,20,.04)]">
            <div className="mb-2.5 font-body text-[14.5px] font-bold text-ink-strong">Plan stats</div>
            <div className="flex flex-col">
              <div className="flex items-baseline justify-between gap-2.5 border-b border-hairline py-[7px]">
                <span className="font-body text-[12.5px] font-semibold text-ink-secondary">Items</span>
                <span className="font-headline text-base font-bold tabular-nums text-ink-strong">{plan.item_count}</span>
              </div>
              {totalTimeLabel && (
                <div className="flex items-baseline justify-between gap-2.5 border-b border-hairline py-[7px]">
                  <span className="font-body text-[12.5px] font-semibold text-ink-secondary">Total time</span>
                  <span className="font-headline text-base font-bold tabular-nums text-ink-strong">{totalTimeLabel}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-2.5 py-[7px]">
                <span className="font-body text-[12.5px] font-semibold text-ink-secondary">Chapters done</span>
                <span className="font-headline text-base font-bold tabular-nums text-ink-strong">
                  {chapters.filter(ch => ch.items.every(itemIsCompleted) && ch.items.length > 0).length} of {chapters.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
