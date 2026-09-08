'use client'
import { useEffect, useState } from 'react'

/** Tracks which of `ids` is nearest the top of the viewport. */
export function useActiveHeading(ids: string[], offset = 96) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)
  useEffect(() => {
    if (!ids.length) return
    const els = ids.map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    if (!els.length) return
    const obs = new IntersectionObserver(() => {
      let best: { id: string; top: number } | null = null
      for (const el of els) {
        const top = el.getBoundingClientRect().top - offset
        if (top <= 0 && (!best || top > best.top)) best = { id: el.id, top }
      }
      setActive(best?.id ?? els[0].id)
    }, { rootMargin: `-${offset}px 0px -60% 0px`, threshold: [0, 1] })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [ids.join('|'), offset])
  return active
}
