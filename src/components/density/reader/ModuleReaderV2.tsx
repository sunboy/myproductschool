'use client'
import Link from 'next/link'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { ChapterBody } from '@/components/learning/ChapterBody'
import { useReaderChrome } from '@/components/shell-v2/ReaderChromeContext'
import { BackLink, Button, Reader } from '@/design'
import { extractHeadings, slugifyHeading } from '@/lib/reading/headings'
import { ReaderHeader } from './ReaderHeader'
import { HeroImageSlot } from './HeroImageSlot'
import { useReadingProgressReporter } from './useReadingProgressReporter'
import type { LearnChapter, LearnChapterWithProgress, LearnModule } from '@/lib/types'

export function ModuleReaderV2({ module, chapters, data, onSelectChapter, markComplete, completing }: {
  module: LearnModule
  chapters: LearnChapterWithProgress[]
  data: LearnChapter
  onSelectChapter: (slug: string) => void
  markComplete: () => Promise<void> | void
  completing?: boolean
}) {
  const articleRef = useRef<HTMLElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const headings = useMemo(() => extractHeadings(data.body_mdx ?? ''), [data.body_mdx])

  // ChapterBody's markdown renderer does not assign heading ids. Assign them
  // here, in document order, matching extractHeadings' slug rule, so anchor
  // links and IntersectionObserver-based active tracking work. This must run
  // as a layout effect (synchronously after DOM mutation, before paint and
  // before any passive `useEffect`) so that `useActiveHeading` below —
  // itself a `useEffect` — always observes elements that already carry
  // their ids. A plain `useEffect` here raced with useActiveHeading's
  // effect: on first mount neither is guaranteed to run first by
  // declaration order alone once concurrent features are involved, so the
  // observer could initialize against zero elements and never re-attach
  // (its deps are the id list, which doesn't change), and any click before
  // this ran would find no matching element for scrollIntoView.
  // ChapterBody renders its markdown client-side (dynamic import, ssr:false), so the
  // headings appear after mount. Assign ids now and again on every DOM mutation.
  useLayoutEffect(() => {
    const root = bodyRef.current
    if (!root) return
    const wanted = new Set(headings.map(h => h.id))
    const assign = () => {
      for (const el of Array.from(root.querySelectorAll('h2, h3'))) {
        const id = slugifyHeading((el.textContent ?? '').trim())
        if (wanted.has(id) && el.id !== id) el.id = id
      }
    }
    assign()
    const mo = new MutationObserver(assign)
    mo.observe(root, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [headings, data.slug])

  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)
  const completed = chapters.filter(c => c.is_completed).length
  const idx = chapters.findIndex(c => c.slug === data.slug)
  const next = chapters[idx + 1]
  const isCompleted = chapters[idx]?.is_completed ?? false

  useReaderChrome({
    left: (
      <BackLink href="/explore/modules" label="All guides" testId="reader-back" />
    ),
    right: (
      <button
        type="button"
        data-testid="reader-complete"
        disabled={isCompleted || completing}
        onClick={() => markComplete()}
        className="inline-flex h-control-md items-center gap-1.5 rounded-control border border-hairline bg-card-bright px-3 text-ui font-ui text-ink-strong hover:bg-surface-container-low disabled:opacity-60"
      >
        <Bookmark size={16} aria-hidden />
        {isCompleted ? 'Completed' : completing ? 'Saving…' : 'Mark complete'}
      </button>
    ),
  }, [data.slug, isCompleted, completing])

  useReadingProgressReporter({ contentType: 'module_chapter', parentId: module.slug, contentId: data.slug, activeId, articleRef })

  return (
    <Reader
      ids={headings.map(h => h.id)}
      onActiveChange={setActiveId}
      progressPct={module.chapter_count ? (completed / module.chapter_count) * 100 : 0}
      groups={[
        {
          label: `Chapter ${data.sort_order} of ${module.chapter_count}`,
          items: chapters.map(c => ({
            id: `ch-${c.slug}`,
            label: c.title,
            done: c.is_completed,
            href: c.is_unlocked || c.is_completed ? `/explore/modules/${module.slug}?chapter=${c.slug}` : undefined,
          })),
        },
        { label: 'On this page', items: headings.map(h => ({ id: h.id, label: h.label })) },
      ]}
    >
      <div ref={articleRef as React.RefObject<HTMLDivElement>} data-hatch-page-type="learning_module" data-hatch-entity-id={module.slug} data-hatch-active-chapter={data.slug}>
        <ReaderHeader eyebrow={`${module.name} · Chapter ${data.sort_order} of ${module.chapter_count}`} title={data.title} lede={data.hook_text || data.subtitle} />
        <HeroImageSlot src={data.hero_image_url ?? null} seed={`${module.slug}/${data.slug}`} />
        <ChapterBody ref={bodyRef} body_mdx={data.body_mdx} figures={data.figures ?? []} hatchContextLabel="Active chapter body" />
        <footer className="mt-8 flex items-center justify-between border-t border-hairline pt-4">
          <Link href="/explore/modules" className="text-ui font-ui text-ink-secondary hover:text-ink-strong">All guides</Link>
          {next && (next.is_unlocked || next.is_completed || isCompleted) ? (
            <Button data-testid="reader-next" onClick={() => onSelectChapter(next.slug)}>
              Next: {next.title} →
            </Button>
          ) : !isCompleted ? (
            <Button onClick={() => markComplete()}>
              Mark chapter complete
            </Button>
          ) : null}
        </footer>
      </div>
    </Reader>
  )
}
