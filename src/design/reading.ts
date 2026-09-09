'use client'
import { useEffect, useState } from 'react'

/** Reading targets may be headings with an `id` (guides), sections tagged
 *  `data-section-id` (autopsies), or headings whose text slugifies to the id
 *  (markdown rendered without ids). One resolver for the TOC and the tracker. */
export const slugifyHeading = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')

export function resolveReadingTarget(id: string, root: ParentNode = document): HTMLElement | null {
  const byId = root.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`)
  if (byId) return byId
  const bySection = root.querySelector<HTMLElement>(`[data-section-id="${CSS.escape(id)}"]`)
  if (bySection) return bySection
  for (const h of Array.from(root.querySelectorAll<HTMLElement>('article h2, article h3'))) {
    if (slugifyHeading(h.textContent ?? '') === id) return h
  }
  return null
}

/** Nearest scrollable ancestor, or null when the window scrolls. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node
    node = node.parentElement
  }
  return null
}

/** Which of `ids` is nearest the top of the viewport. Recomputes on every
 *  scroll frame of any scroller (rAF-throttled) and on resize, re-resolves
 *  targets when the body re-renders, and clamps to the last target at the
 *  bottom of the document. */
export function useActiveHeading(ids: string[], offset = 96) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)
  const key = ids.join('|')
  useEffect(() => {
    if (!ids.length) return
    let raf = 0
    let attachRaf = 0
    let cancelled = false
    let els: HTMLElement[] = []

    const resolve = () => { els = ids.map(id => resolveReadingTarget(id)).filter((e): e is HTMLElement => !!e) }
    const compute = () => {
      raf = 0
      if (els.length < ids.length || els.some(e => !e.isConnected)) resolve()
      if (!els.length) return
      const scroller = scrollParent(els[0])
      const atBottom = scroller
        ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom) { setActive(els[els.length - 1].id || ids[ids.length - 1]); return }
      let best: { id: string; top: number } | null = null
      for (let i = 0; i < els.length; i++) {
        const el = els[i]
        const top = el.getBoundingClientRect().top - offset
        if (top <= 0 && (!best || top > best.top)) best = { id: el.id || el.dataset.sectionId || ids[i], top }
      }
      setActive(best?.id ?? (els[0].id || els[0].dataset.sectionId || ids[0]))
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(compute) }
    const attach = (attempt = 0) => {
      if (cancelled) return
      resolve()
      if (els.length < ids.length && attempt < 30) { attachRaf = requestAnimationFrame(() => attach(attempt + 1)) }
      if (els.length) compute()
    }
    attach()
    document.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      if (attachRaf) cancelAnimationFrame(attachRaf)
      document.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset])
  return active
}
