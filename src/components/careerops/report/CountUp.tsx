'use client'

import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface CountUpProps {
  value: number
  durationMs?: number
  delayMs?: number
  format?: (n: number) => string
  className?: string
}

// RAF count-up with ease-out cubic, same engine family as the ScoreGauge so
// numbers and arcs stay in step. Renders the final value immediately under
// prefers-reduced-motion.
export function CountUp({ value, durationMs = 900, delayMs = 0, format, className }: CountUpProps) {
  // Always start at 0 so server and client render identically; the effect
  // snaps to the final value immediately under prefers-reduced-motion.
  const [displayed, setDisplayed] = useState(0)
  const frameRef = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayed(value)
      return
    }
    let start: number | null = null
    const tick = (now: number) => {
      if (start === null) start = now + delayMs
      const elapsed = now - start
      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(tick)
        return
      }
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(eased * value)
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, durationMs, delayMs])

  const rendered = format ? format(displayed) : String(Math.round(displayed))
  return <span className={className}>{rendered}</span>
}
