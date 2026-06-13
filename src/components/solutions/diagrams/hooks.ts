'use client'

import { useEffect, useRef, useState } from 'react'

/** True when the user has requested reduced motion; diagrams render their final state. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/** Fires once when the element scrolls into view, so diagrams animate on reveal. */
export function useInView<T extends HTMLElement>(): { ref: React.RefObject<T | null>; inView: boolean } {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true)
        observer.disconnect()
      }
    }, { threshold: 0.25 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView])
  return { ref, inView }
}

export const DIAGRAM_COLOR_VAR: Record<'primary' | 'secondary' | 'tertiary', string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  tertiary: 'var(--color-tertiary)',
}

export function truncateLabel(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}
