'use client'
import { useEffect, useState } from 'react'

/** Tracks which of `ids` is nearest the top of the viewport. */
export function useActiveHeading(ids: string[], offset = 96) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)
  useEffect(() => {
    if (!ids.length) return

    let obs: IntersectionObserver | null = null
    let raf = 0
    let cancelled = false

    // Ids may be assigned to their heading elements by a sibling layout
    // effect (e.g. ModuleReaderV2's DOM-scan for markdown headings) that
    // runs before this one, but on route/content changes rendering can
    // still lag a frame behind. Retry across a couple of animation frames
    // instead of bailing out permanently when the elements aren't found
    // yet — an empty `els` here previously meant the observer never
    // attached at all, so the active heading (and any consumer relying on
    // it) silently froze on the initial id.
    const attach = (attempt = 0) => {
      if (cancelled) return
      const els = ids.map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
      if (!els.length) {
        if (attempt < 5) raf = requestAnimationFrame(() => attach(attempt + 1))
        return
      }
      obs = new IntersectionObserver(() => {
        let best: { id: string; top: number } | null = null
        for (const el of els) {
          const top = el.getBoundingClientRect().top - offset
          if (top <= 0 && (!best || top > best.top)) best = { id: el.id, top }
        }
        setActive(best?.id ?? els[0].id)
      }, { rootMargin: `-${offset}px 0px -60% 0px`, threshold: [0, 1] })
      els.forEach(el => obs?.observe(el))
    }
    attach()

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      obs?.disconnect()
    }
  }, [ids.join('|'), offset])
  return active
}
