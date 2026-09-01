'use client'

import { useEffect, useRef, useState } from 'react'

import { reveal } from './revealSequence'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface ScoreGaugeProps {
  score: number // 0..100
  size?: number
  strokeWidth?: number
  delayMs?: number
  durationMs?: number
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

// Radial score gauge for the dark ink hero card. One RAF loop drives both the
// arc sweep (stroke-dashoffset) and the count-up number so they never desync.
// Track uses the ink hairline tone; the arc is the electric lime accent.
export function ScoreGauge({
  score,
  size = 180,
  strokeWidth = 12,
  delayMs = reveal.gaugeDelayMs,
  durationMs = reveal.gaugeDurationMs,
  onProgress,
  onComplete,
}: ScoreGaugeProps) {
  const target = Math.max(0, Math.min(100, score))
  // Always start at 0 so server and client render identically; the effect
  // snaps to 1 immediately under prefers-reduced-motion.
  const [progress, setProgress] = useState(0)
  const frameRef = useRef(0)
  const doneRef = useRef(false)
  const onProgressRef = useRef(onProgress)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onProgressRef.current = onProgress
    onCompleteRef.current = onComplete
  }, [onProgress, onComplete])

  useEffect(() => {
    if (prefersReducedMotion()) {
      setProgress(1)
      onProgressRef.current?.(1)
      if (!doneRef.current) {
        doneRef.current = true
        onCompleteRef.current?.()
      }
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
      const linear = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - linear, 3)
      setProgress(eased)
      onProgressRef.current?.(eased)
      if (linear < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else if (!doneRef.current) {
        doneRef.current = true
        onCompleteRef.current?.()
      }
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, delayMs, durationMs])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const sweep = circumference * (1 - progress * (target / 100))
  const displayed = Math.round(progress * target)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-ink-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={sweep}
          className="stroke-accent-lime"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline text-5xl font-bold text-on-ink tabular-nums">{displayed}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-on-ink-muted">/100 fit</span>
      </div>
    </div>
  )
}
