'use client'

import { use, useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useLearnModule } from '@/hooks/useLearnModule'
import { useLearnChapter } from '@/hooks/useLearnChapter'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_CHAPTER_OPENED, EVENT_CHAPTER_COMPLETED } from '@/lib/posthog/events'
import { ChapterBody } from '@/components/learning/ChapterBody'
import { BackCrumb } from '@/components/navigation/BackButton'
import { ProgressRing } from '@/components/redesign/ProgressRing'
import { HatchImage } from '@/components/redesign/HatchImage'
import type { LearnModule, LearnChapterWithProgress } from '@/lib/types'

// Chapter body rendering stays in `src/components/learning/ChapterBody.tsx`
// (untouched) — figures render as typed React components.

function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(' ')
}

// ─── LEFT: module TOC rail (sticky, real chapters, current pill) ────────────

function TocRail({
  module,
  chapters,
  activeSlug,
  completedCount,
  onSelect,
  backHref,
}: {
  module: LearnModule
  chapters: LearnChapterWithProgress[]
  activeSlug: string | null
  completedCount: number
  onSelect: (slug: string) => void
  backHref: string
}) {
  const pct = module.chapter_count > 0 ? Math.round((completedCount / module.chapter_count) * 100) : 0
  const activeIdx = chapters.findIndex(c => c.slug === activeSlug)

  return (
    <aside
      className="hidden lg:flex shrink-0 flex-col gap-4"
      style={{ width: 220, position: 'sticky', top: 96 }}
    >
      <div className="flex items-center gap-3">
        <ProgressRing percent={pct} size={40} strokeWidth={4.5} trackColor="#eee9df" color="#266235">
          <span className="font-body text-xs font-extrabold tabular-nums text-ink-strong">
            {activeIdx >= 0 ? activeIdx + 1 : 1}/{module.chapter_count}
          </span>
        </ProgressRing>
        <div className="font-body text-xs font-bold uppercase tracking-[0.03em] leading-[1.35] text-ink-secondary">
          {module.name}
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {chapters.map((ch, i) => {
          const locked = !ch.is_unlocked && !ch.is_completed
          const isActive = ch.slug === activeSlug
          return (
            <button
              key={ch.id}
              disabled={locked}
              onClick={() => !locked && onSelect(ch.slug)}
              className={cn(
                'flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm leading-[1.4]',
                isActive ? 'bg-forest-800' : locked ? 'opacity-40 cursor-not-allowed' : 'text-ink-secondary hover:bg-surface-container',
              )}
            >
              <span
                className={cn(
                  'mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
                  ch.is_completed ? 'bg-forest-800 text-white' : isActive ? 'bg-white/20 text-white' : 'bg-[#eee9df] text-ink-muted',
                )}
              >
                {ch.is_completed ? <Check size={12} strokeWidth={2.4} /> : i + 1}
              </span>
              <span className={cn('font-body font-bold', isActive ? 'text-white' : locked ? 'text-ink-muted' : 'text-ink-strong')}>
                {ch.title}
              </span>
            </button>
          )
        })}
      </nav>

      <Link
        href={backHref}
        className="flex items-center gap-1.5 border-t border-hairline pt-3 font-body text-sm font-bold text-ink-secondary no-underline"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Module overview
      </Link>
    </aside>
  )
}

// ─── CENTER: Literata reading column ─────────────────────────────────────────

function ReadingColumn({
  moduleSlug,
  module,
  chapterSlug,
  chapters,
  onNext,
  onComplete,
  bodyRef,
}: {
  moduleSlug: string
  module: LearnModule
  chapterSlug: string
  chapters: LearnChapterWithProgress[]
  onNext: (slug: string) => void
  onComplete: () => void
  bodyRef: React.RefObject<HTMLDivElement | null>
}) {
  const { data, isLoading, markComplete, isMarkingComplete } = useLearnChapter(moduleSlug, chapterSlug)
  const [markedDone, setMarkedDone] = useState(false)

  const currentIdx = chapters.findIndex(c => c.slug === chapterSlug)
  const nextChapter = chapters[currentIdx + 1]

  useEffect(() => {
    setMarkedDone(false)
  }, [chapterSlug])

  if (isLoading) {
    return (
      <div className="reading-col mx-auto w-full max-w-[760px] animate-pulse space-y-4">
        <div className="h-8 w-3/4 rounded bg-surface-container" />
        <div className="h-4 rounded bg-surface-container" />
        <div className="h-4 w-5/6 rounded bg-surface-container" />
        <div className="h-4 w-full rounded bg-surface-container" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="reading-col mx-auto w-full max-w-[760px] min-w-0" ref={bodyRef}>
      <div className="mb-3.5 flex items-center gap-2 font-body text-sm font-extrabold uppercase tracking-[0.08em] text-dm-fg">
        {module.name.toUpperCase()}
        <span className="size-1 shrink-0 rounded-full bg-ink-muted" />
        <span className="font-bold tracking-[0.06em] text-ink-muted">
          CHAPTER {data.sort_order} OF {module.chapter_count}
        </span>
      </div>

      <h1 className="mb-5 font-headline text-[clamp(2.5rem,6vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-forest-950">
        {data.title}
      </h1>

      {data.hook_text && (
        <p className="mb-9 border-b border-hairline pb-8 font-headline text-[21px] font-medium leading-[1.6] text-ink-strong">
          {data.hook_text}
        </p>
      )}

      <div className="[&_.prose]:!overflow-visible [&_.prose]:!px-0 [&_.prose]:!py-0 [&_.prose_h2]:!text-[28px] [&_.prose_h3]:!text-lg [&_.prose_p]:!text-base [&_.prose_ul]:!text-base [&_.prose_ol]:!text-base">
        <ChapterBody body_mdx={data.body_mdx} figures={data.figures ?? []} hatchContextLabel="Active chapter body" />
      </div>

      {/* Chapter footer nav — real prev/next titles. Per-chapter prev
          navigation lives in the left TOC rail (current pill), so the footer
          "back" affordance points at the module overview, matching the
          preview's footer-prev slot. */}
      <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
        <Link
          href="/explore/modules"
          className="flex items-center gap-1.5 font-body text-sm font-bold text-ink-secondary no-underline"
        >
          <ArrowLeft size={15} strokeWidth={1.9} />
          Module overview
        </Link>

        <div className="flex items-center gap-3">
          {!markedDone ? (
            <button
              onClick={async () => {
                await markComplete()
                setMarkedDone(true)
                trackEvent(EVENT_CHAPTER_COMPLETED, { module_slug: moduleSlug, chapter_slug: chapterSlug })
                onComplete()
              }}
              disabled={isMarkingComplete}
              className="inline-flex items-center gap-1.5 rounded-lg bg-forest-950 px-[18px] py-3 font-body text-sm font-bold text-white disabled:opacity-50"
            >
              <Check size={16} strokeWidth={2.2} />
              {isMarkingComplete ? 'Saving…' : 'Mark chapter complete'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 font-body text-sm font-bold text-forest-700">
              <Check size={16} strokeWidth={2.2} />
              Done
            </div>
          )}

          {nextChapter && (nextChapter.is_unlocked || nextChapter.is_completed) && (
            <button
              onClick={() => onNext(nextChapter.slug)}
              className="flex max-w-[420px] items-center gap-2.5 rounded-lg border border-forest-950 bg-forest-950 px-[18px] py-[13px] text-left text-white"
            >
              <span className="flex flex-col items-start leading-[1.3]">
                <span className="font-body text-xs font-bold uppercase tracking-[0.04em] text-white/65">Next chapter</span>
                <span className="font-body text-sm font-bold">{nextChapter.title}</span>
              </span>
              <ArrowRight size={16} strokeWidth={2} className="shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Inner page (needs searchParams, wrapped in Suspense) ─────────────────────

function ModulePageInner({ slug }: { slug: string }) {
  const router = useRouter()

  const searchParams = useSearchParams()
  const { data, isLoading, error, refetch } = useLearnModule(slug)
  const [activeChapterSlug, setActiveChapterSlug] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Sync active chapter from URL param or auto-select on data load
  useEffect(() => {
    if (!data) return
    const paramChapter = searchParams.get('chapter')
    if (paramChapter) {
      const exists = data.chapters.find(c => c.slug === paramChapter)
      if (exists) { setActiveChapterSlug(paramChapter); return }
    }
    // Auto-select first unlocked+incomplete chapter, or first chapter
    const next = data.chapters.find(c => (c.is_unlocked || c.sort_order === 1) && !c.is_completed)
      ?? data.chapters[0]
    if (next) setActiveChapterSlug(next.slug)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectChapter = (chSlug: string) => {
    setActiveChapterSlug(chSlug)
    router.replace(`/explore/modules/${slug}?chapter=${chSlug}`, { scroll: false })
    window.scrollTo({ top: 0 })
    const idx = data?.chapters.findIndex(c => c.slug === chSlug) ?? -1
    trackEvent(EVENT_CHAPTER_OPENED, { module_slug: slug, chapter_slug: chSlug, chapter_index: idx >= 0 ? idx : undefined })
  }

  const handleNext = (chSlug: string) => {
    handleSelectChapter(chSlug)
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1400px] animate-pulse gap-8 px-6 py-7">
        <div className="hidden lg:block w-[240px] shrink-0 space-y-2">
          <div className="h-10 rounded bg-surface-container" />
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-9 rounded-lg bg-surface-container" />)}
        </div>
        <div className="flex-1 max-w-[720px] mx-auto space-y-4">
          <div className="h-8 w-3/4 rounded bg-surface-container" />
          <div className="h-4 rounded bg-surface-container" />
          <div className="h-4 w-full rounded bg-surface-container" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <p className="text-error text-sm">{error ?? 'Module not found'}</p>
        <Link href="/explore/modules" className="text-primary text-sm mt-2 inline-block">← Back to Guides</Link>
      </div>
    )
  }

  const { module, chapters } = data
  const completedCount = chapters.filter(c => c.is_completed).length

  return (
    <div
      className="relative isolate min-h-screen overflow-hidden bg-[#fbf8f1] font-body"
      data-hatch-context-root
      data-hatch-page-type="learning_module"
      data-hatch-entity-id={slug}
      data-hatch-active-chapter={activeChapterSlug ?? undefined}
    >
      <div aria-hidden className="pointer-events-none absolute -right-24 top-20 -z-10 size-80 rotate-12 rounded-[50px] bg-[#e9e2d3]/45" />
      <div className="mx-auto flex max-w-[1040px] items-center px-4 pb-1 pt-4 sm:px-6 lg:hidden">
        <BackCrumb href="/explore/modules" label="All guides" />
      </div>

      <div className="mx-auto flex max-w-[1080px] items-start gap-10 px-4 pb-24 pt-7 sm:px-6 lg:gap-14">
        <TocRail
          module={module}
          chapters={chapters}
          activeSlug={activeChapterSlug}
          completedCount={completedCount}
          onSelect={handleSelectChapter}
          backHref="/explore/modules"
        />

        <div className="min-w-0 flex-1" data-hatch-page-title>
          {activeChapterSlug ? (
            <ReadingColumn
              moduleSlug={slug}
              module={module}
              chapterSlug={activeChapterSlug}
              chapters={chapters}
              onNext={handleNext}
              onComplete={refetch}
              bodyRef={bodyRef}
            />
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
              <HatchImage state="idle" size={56} />
              <p className="font-body text-sm font-bold text-ink-muted">Select a chapter to start reading</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page export ─────────────────────────────────────────────────────────────

export default function LearnModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-page-field" />}>
      <ModulePageInner slug={slug} />
    </Suspense>
  )
}
