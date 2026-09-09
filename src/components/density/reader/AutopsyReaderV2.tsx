'use client'
import { useRef, useState } from 'react'
import { useReaderChrome } from '@/components/shell-v2/ReaderChromeContext'
import { BackLink, Reader } from '@/design'
import { BookmarkToggle } from '@/components/showcase/reader/BookmarkToggle'
import { ReaderHeader } from './ReaderHeader'
import { HeroImageSlot } from './HeroImageSlot'
import { useReadingProgressReporter } from './useReadingProgressReporter'

export function AutopsyReaderV2({ story, companyName, initialBookmarked, sectionIds, tocItems, coverUrl, children }: {
  story: { companySlug: string; slug: string; title: string; dek: string; estimatedReadTime: string; tags?: string[] }
  companyName: string
  initialBookmarked: boolean
  sectionIds: string[]
  tocItems: Array<{ id: string; label: string }>
  coverUrl?: string | null
  children: React.ReactNode
}) {
  const articleRef = useRef<HTMLElement>(null)
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null)
  useReaderChrome({
    left: (
      <BackLink href={`/explore/autopsies/${story.companySlug}`} label={companyName} testId="reader-back" />
    ),
    right: <BookmarkToggle companySlug={story.companySlug} storySlug={story.slug} initialBookmarked={initialBookmarked} />,
  }, [story.companySlug, story.slug, companyName, initialBookmarked])
  useReadingProgressReporter({ contentType: 'autopsy_story', parentId: story.companySlug, contentId: story.slug, activeId, articleRef })
  return (
    <Reader
      ids={sectionIds}
      onActiveChange={setActiveId}
      groups={[{ label: 'In this autopsy', items: tocItems.map((t, i) => ({ id: t.id, label: `${String(i + 1).padStart(2, '0')} ${t.label}` })) }]}
    >
      <div ref={articleRef as React.RefObject<HTMLDivElement>} className="reader-content" data-hatch-context-root data-hatch-context={`Reading "${story.title}"`}>
        <ReaderHeader eyebrow={`Product autopsy · ${(story.tags ?? [])[0] ?? companyName} · ${story.estimatedReadTime}`} title={story.title} lede={story.dek} />
        <HeroImageSlot src={coverUrl} seed={`${story.companySlug}/${story.slug}`} ratio="700/150" />
        {children}
      </div>
    </Reader>
  )
}
