'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { ReaderFrame } from '@/components/density/ReaderFrame'
import { RightToc } from '@/components/density/RightToc'
import { useActiveHeading } from '@/components/density/useActiveHeading'
import { useReaderChrome } from '@/components/shell-v2/ReaderChromeContext'
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
  const activeId = useActiveHeading(sectionIds)
  const idx = Math.max(0, sectionIds.indexOf(activeId ?? ''))
  useReaderChrome({
    left: (
      <Link href={`/explore/autopsies/${story.companySlug}`} data-testid="reader-back" className="rounded-full border border-hairline bg-card-bright px-3 py-1 text-[12px] font-semibold">
        ← {companyName}
      </Link>
    ),
    right: <BookmarkToggle companySlug={story.companySlug} storySlug={story.slug} initialBookmarked={initialBookmarked} />,
  })
  useReadingProgressReporter({ contentType: 'autopsy_story', parentId: story.companySlug, contentId: story.slug, activeId, articleRef })
  return (
    <ReaderFrame
      toc={
        <RightToc
          progressPct={sectionIds.length ? (idx / (sectionIds.length - 1)) * 100 : 0}
          activeId={activeId}
          groups={[{ label: 'In this autopsy', items: tocItems.map((t, i) => ({ id: t.id, label: `${String(i + 1).padStart(2, '0')} ${t.label}` })) }]}
        />
      }
    >
      <div ref={articleRef as React.RefObject<HTMLDivElement>}>
        <ReaderHeader eyebrow={`Product autopsy · ${(story.tags ?? [])[0] ?? companyName} · ${story.estimatedReadTime}`} title={story.title} lede={story.dek} />
        <HeroImageSlot src={coverUrl} seed={`${story.companySlug}/${story.slug}`} height={150} />
        {children}
      </div>
    </ReaderFrame>
  )
}
