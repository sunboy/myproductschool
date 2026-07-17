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
      style={{ width: 240, position: 'sticky', top: 24 }}
    >
      <div className="flex items-center gap-3">
        <ProgressRing percent={pct} size={40} strokeWidth={4.5} trackColor="#eee9df" color="#266235">
          <span className="font-body text-[10.5px] font-extrabold tabular-nums text-ink-strong">
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
                'flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] leading-[1.4]',
                isActive ? 'bg-forest-800' : locked ? 'opacity-40 cursor-not-allowed' : 'text-ink-secondary hover:bg-surface-container',
              )}
            >
              <span
                className={cn(
                  'mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-extrabold',
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
        className="flex items-center gap-1.5 border-t border-hairline pt-3 font-body text-[12.5px] font-bold text-ink-secondary no-underline"
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
  headingsRef,
}: {
  moduleSlug: string
  module: LearnModule
  chapterSlug: string
  chapters: LearnChapterWithProgress[]
  onNext: (slug: string) => void
  onComplete: () => void
  bodyRef: React.RefObject<HTMLDivElement | null>
  headingsRef: React.MutableRefObject<{ text: string; el: HTMLElement }[]>
}) {
  const { data, isLoading, markComplete, isMarkingComplete } = useLearnChapter(moduleSlug, chapterSlug)
  const [markedDone, setMarkedDone] = useState(false)

  const currentIdx = chapters.findIndex(c => c.slug === chapterSlug)
  const nextChapter = chapters[currentIdx + 1]

  useEffect(() => {
    setMarkedDone(false)
  }, [chapterSlug])

  // Collect in-body headings for the right-rail mini-TOC, once content mounts.
  useEffect(() => {
    if (!data) return
    const container = bodyRef.current
    if (!container) return
    const nodes = Array.from(container.querySelectorAll('h2, h3')) as HTMLElement[]
    headingsRef.current = nodes.map(el => ({ text: el.textContent ?? '', el }))
  }, [data, bodyRef, headingsRef])

  if (isLoading) {
    return (
      <div className="reading-col mx-auto w-full max-w-[720px] animate-pulse space-y-4">
        <div className="h-8 w-3/4 rounded bg-surface-container" />
        <div className="h-4 rounded bg-surface-container" />
        <div className="h-4 w-5/6 rounded bg-surface-container" />
        <div className="h-4 w-full rounded bg-surface-container" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="reading-col mx-auto w-full max-w-[720px] min-w-0" ref={bodyRef}>
      <div className="mb-3.5 flex items-center gap-2 font-body text-[11px] font-extrabold uppercase tracking-[0.08em] text-dm-fg">
        {module.name.toUpperCase()}
        <span className="size-1 shrink-0 rounded-full bg-ink-muted" />
        <span className="font-bold tracking-[0.06em] text-ink-muted">
          CHAPTER {data.sort_order} OF {module.chapter_count}
        </span>
      </div>

      <h1 className="mb-5 font-headline text-[38px] font-bold leading-[1.18] tracking-[-0.015em] text-ink-strong">
        {data.title}
      </h1>

      {data.hook_text && (
        <p className="mb-8 border-b border-hairline pb-8 font-headline text-xl font-medium leading-[1.55] text-ink-strong">
          {data.hook_text}
        </p>
      )}

      <ChapterBody body_mdx={data.body_mdx} figures={data.figures ?? []} hatchContextLabel="Active chapter body" />

      {/* Chapter footer nav — real prev/next titles. Per-chapter prev
          navigation lives in the left TOC rail (current pill), so the footer
          "back" affordance points at the module overview, matching the
          preview's footer-prev slot. */}
      <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
        <Link
          href="/explore/modules"
          className="flex items-center gap-1.5 font-body text-[13.5px] font-bold text-ink-secondary no-underline"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-forest-950 px-[18px] py-3 font-body text-[13.5px] font-bold text-white disabled:opacity-50"
            >
              <Check size={16} strokeWidth={2.2} />
              {isMarkingComplete ? 'Saving…' : 'Mark chapter complete'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 font-body text-[13.5px] font-bold text-forest-700">
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
                <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.04em] text-white/65">Next chapter</span>
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

// ─── RIGHT: mini-TOC + reading progress rail ─────────────────────────────────

function ReaderRail({
  module,
  chapters,
  activeChapterSlug,
  headings,
}: {
  module: LearnModule
  chapters: LearnChapterWithProgress[]
  activeChapterSlug: string | null
  headings: { text: string; el: HTMLElement }[]
}) {
  const [activeHeadingIdx, setActiveHeadingIdx] = useState(0)

  useEffect(() => {
    setActiveHeadingIdx(0)
    if (headings.length === 0) return
    const onScroll = () => {
      let idx = 0
      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].el.getBoundingClientRect()
        if (rect.top <= 120) idx = i
      }
      setActiveHeadingIdx(idx)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  const currentIdx = chapters.findIndex(c => c.slug === activeChapterSlug)
  const pct = chapters.length > 0 ? Math.round(((currentIdx + 1) / chapters.length) * 100) : 0

  return (
    <aside
      className="hidden lg:flex shrink-0 flex-col gap-3"
      style={{ width: 280, position: 'sticky', top: 24 }}
    >
      {headings.length > 0 && (
        <div className="rounded-xl border border-hairline bg-card-bright p-4">
          <h3 className="m-0 mb-2.5 font-body text-xs font-bold uppercase tracking-[0.04em] text-ink-secondary">
            In this chapter
          </h3>
          <div className="flex flex-col">
            {headings.map((h, i) => (
              <button
                key={i}
                onClick={() => h.el.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className={cn(
                  'flex items-center gap-2.5 py-1.5 text-left font-body text-[13px]',
                  i === activeHeadingIdx ? 'font-bold text-forest-800' : 'text-ink-secondary',
                )}
              >
                <span className={cn('size-1.5 shrink-0 rounded-full', i === activeHeadingIdx ? 'bg-forest-700' : 'bg-ink-muted')} />
                {h.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-hairline bg-card-bright p-4">
        <h3 className="m-0 mb-2.5 font-body text-xs font-bold uppercase tracking-[0.04em] text-ink-secondary">
          Reading progress
        </h3>
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-hairline">
          <div className="h-full rounded-full bg-forest-600" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between font-body text-xs tabular-nums text-ink-muted">
          <span>
            Chapter {currentIdx >= 0 ? currentIdx + 1 : 1} of {module.chapter_count}
          </span>
          <b className="font-bold text-ink-strong">{pct}%</b>
        </div>
      </div>
    </aside>
  )
}

// ─── Inner page (needs searchParams, wrapped in Suspense) ─────────────────────

function ModulePageInner({ slug }: { slug: string }) {
  const router = useRouter()

  const searchParams = useSearchParams()
  const { data, isLoading, error, refetch } = useLearnModule(slug)
  const [activeChapterSlug, setActiveChapterSlug] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const headingsRef = useRef<{ text: string; el: HTMLElement }[]>([])
  const [headings, setHeadings] = useState<{ text: string; el: HTMLElement }[]>([])

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

  // Poll the collected heading refs into state once per chapter render pass
  // so the right-rail mini-TOC picks them up after ChapterBody mounts.
  useEffect(() => {
    const t = setTimeout(() => setHeadings(headingsRef.current), 50)
    return () => clearTimeout(t)
  }, [activeChapterSlug, data])

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
      className="min-h-screen bg-page-field font-body"
      data-hatch-context-root
      data-hatch-page-type="learning_module"
      data-hatch-entity-id={slug}
      data-hatch-active-chapter={activeChapterSlug ?? undefined}
    >
      <div className="hidden items-center gap-2 border-b border-hairline bg-surface-container-low px-4 py-2 lg:flex">
        <BackCrumb href="/explore/modules" label="Guides" />
      </div>

      <div className="mx-auto flex max-w-[1400px] items-start gap-8 px-6 pb-24 pt-6">
        <TocRail
          module={module}
          chapters={chapters}
          activeSlug={activeChapterSlug}
          completedCount={completedCount}
          onSelect={handleSelectChapter}
          backHref="/explore/modules"
        />

        <main className="min-w-0 flex-1" data-hatch-page-title>
          {activeChapterSlug ? (
            <ReadingColumn
              moduleSlug={slug}
              module={module}
              chapterSlug={activeChapterSlug}
              chapters={chapters}
              onNext={handleNext}
              onComplete={refetch}
              bodyRef={bodyRef}
              headingsRef={headingsRef}
            />
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
              <HatchImage state="idle" size={56} />
              <p className="font-body text-sm font-bold text-ink-muted">Select a chapter to start reading</p>
            </div>
          )}
        </main>

        <ReaderRail module={module} chapters={chapters} activeChapterSlug={activeChapterSlug} headings={headings} />
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
