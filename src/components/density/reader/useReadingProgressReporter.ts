'use client'
import { useEffect, useMemo } from 'react'
import { createProgressReporter, type ReadingContentType } from '@/lib/reading/progress-client'

/** Reports scroll progress (0..1 over the article) and the active heading id, debounced, to /api/reading-progress + localStorage. */
export function useReadingProgressReporter(opts: {
  contentType: ReadingContentType
  parentId: string
  contentId: string
  activeId: string | null
  articleRef: React.RefObject<HTMLElement | null>
}) {
  const report = useMemo(
    () => createProgressReporter({ contentType: opts.contentType, parentId: opts.parentId, contentId: opts.contentId }),
    [opts.contentType, opts.parentId, opts.contentId],
  )
  useEffect(() => {
    const onScroll = () => {
      const el = opts.articleRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const pct = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total))
      report(pct, opts.activeId)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [report, opts.activeId, opts.articleRef])
}
