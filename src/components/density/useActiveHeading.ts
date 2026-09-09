'use client'
import { useEffect, useState } from 'react'

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

    const compute = () => {
      raf = 0
      if (!els.length) return
      const doc = document.documentElement
      const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2
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
      els = ids.map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
      if (!els.length) { if (attempt < 10) attachRaf = requestAnimationFrame(() => attach(attempt + 1)); return }
      compute()
    }
    attach()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      if (attachRaf) cancelAnimationFrame(attachRaf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset])
  return active
}
