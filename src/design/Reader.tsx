'use client'
import { useEffect, type ReactNode } from 'react'
import { Toc, type TocGroup } from './Toc'
import { useActiveHeading } from './reading'
import { cn } from '@/lib/utils'

/** Reading surface: one 720px column, a sticky right TOC, and scroll-tracked
 *  active section. Every long-form page (guides, autopsies, future readers)
 *  renders through this so they behave identically. `ids` are the trackable
 *  targets in document order (heading ids or data-section-id values). */
export function Reader({ ids, groups, progressPct, onActiveChange, onSelect, children, testId = 'reader-frame', className }: {
  ids: string[]
  groups: TocGroup[]
  /** Defaults to position within `ids`. */
  progressPct?: number
  onActiveChange?: (id: string | null) => void
  onSelect?: (id: string) => void
  children: ReactNode
  testId?: string
  className?: string
}) {
  const activeId = useActiveHeading(ids)
  useEffect(() => { onActiveChange?.(activeId) }, [activeId, onActiveChange])
  const idx = Math.max(0, ids.indexOf(activeId ?? ''))
  const pct = progressPct ?? (ids.length > 1 ? (idx / (ids.length - 1)) * 100 : 0)
  return (
    <div data-testid={testId} className={cn('mx-auto flex w-full max-w-[1100px] items-start gap-10 px-6 pb-24 pt-7 lg:px-10', className)}>
      <article className="w-full min-w-0 max-w-reader font-body text-body font-text leading-[1.65] text-ink-strong">{children}</article>
      <Toc groups={groups} activeId={activeId} progressPct={pct} onSelect={onSelect} />
    </div>
  )
}
