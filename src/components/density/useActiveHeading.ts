'use client'
import { useEffect, useState } from 'react'

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

/** Tracks which of `ids` is nearest the top of the viewport. Recomputes on
 *  every scroll frame (rAF-throttled) and on resize, and clamps to the last
 *  heading when the page is scrolled to the bottom, so the TOC never stalls
 *  between headings or near the end of a document. */
export function useActiveHeading(ids: string[], offset = 96) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)
  const key = ids.join('|')
  useEffect(() => {
    if (!ids.length) return
    let raf = 0
    let attachRaf = 0
    let cancelled = false
    let els: HTMLElement[] = []

    const resolve = () => { els = ids.map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e) }
    const compute = () => {
      raf = 0
      // Markdown headings get their ids after mount; keep resolving until all are present.
      if (els.length < ids.length) resolve()
      if (!els.length) return
      // Clamp to the last heading once the scrolling element is at its end
      // (window or an inner scroll container: the reader lives in one).
      const scroller = scrollParent(els[0])
      const atBottom = scroller
        ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom) { setActive(els[els.length - 1].id); return }
      let best: { id: string; top: number } | null = null
      for (const el of els) {
        const top = el.getBoundingClientRect().top - offset
        if (top <= 0 && (!best || top > best.top)) best = { id: el.id, top }
      }
      setActive(best?.id ?? els[0].id)
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(compute) }

    // Heading ids may be assigned by a sibling layout effect a frame later
    // (markdown renders client-side); retry across a few frames.
    const attach = (attempt = 0) => {
      if (cancelled) return
      resolve()
      if (els.length < ids.length && attempt < 30) { attachRaf = requestAnimationFrame(() => attach(attempt + 1)) }
      if (els.length) compute()
    }
    attach()
    // Capture-phase listener sees scrolls of any element, not only the window.
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
