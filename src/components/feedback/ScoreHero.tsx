'use client'

// ScoreHero — the single score moment shared by every feedback surface.
// Animated ring (ported from InterviewFeedback's ScoreRing) counting up to
// the canonical /10 display, the grade lexicon chip, the raw scale as
// subtext, Hatch reacting by band, and a reduced-motion-aware celebration
// burst for top-band scores.

import { useEffect, useRef, useState } from 'react'
import { HatchImage } from '@/components/redesign/HatchImage'
import {
  normalizeToTen, gradeBand, bandClasses, bandHatchState,
  GRADE_LABELS, GRADE_DESCRIPTORS, type ScoreScale,
} from '@/lib/feedback/score'

interface ScoreHeroProps {
  raw: number
  scale: ScoreScale
  /** Headline sentence next to the ring (the grader's headline). */
  headline?: string | null
  /** Show the raw score as subtext, e.g. "42/100". Default true when scale ≠ 10. */
  showRaw?: boolean
  /** Static variant: no animation (share cards / OG-adjacent uses). */
  staticRender?: boolean
  /** Hide the mascot (tight layouts). */
  hideHatch?: boolean
  size?: 'md' | 'lg'
}

export function ScoreHero({ raw, scale, headline, showRaw, staticRender = false, hideHatch = false, size = 'lg' }: ScoreHeroProps) {
  const score = normalizeToTen(raw, scale)
  const band = gradeBand(score)
  const colors = bandClasses(band)
  const dims = size === 'lg' ? { box: 'w-40 h-40', num: 'text-4xl' } : { box: 'w-28 h-28', num: 'text-2xl' }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
      <div className="relative shrink-0">
        <Ring score={score} colors={colors} staticRender={staticRender} boxClass={dims.box} numClass={dims.num} />
        {band === 'sharp' && !staticRender && <CelebrationBurst />}
      </div>
      <div className="flex flex-col items-center sm:items-start gap-1.5 min-w-0">
        <span className={`font-label text-xs font-bold px-3 py-1 rounded-full ${colors.badge}`}>
          {GRADE_LABELS[band]}
        </span>
        {headline ? (
          <p className="font-headline text-lg sm:text-xl font-bold text-on-surface leading-snug text-center sm:text-left">
            {headline}
          </p>
        ) : (
          <p className="font-body text-sm text-on-surface-variant text-center sm:text-left">
            {GRADE_DESCRIPTORS[band]}
          </p>
        )}
        {(showRaw ?? scale !== 10) && (
          <span className="font-label text-[11px] text-on-surface-variant/70">
            raw score {raw}{scale === 1 ? '' : `/${scale}`}
          </span>
        )}
        {!hideHatch && (
          <div className="mt-1">
            <HatchImage size={28} state={bandHatchState(band)} />
          </div>
        )}
      </div>
    </div>
  )
}

function Ring({ score, colors, staticRender, boxClass, numClass }: {
  score: number
  colors: { ring: string }
  staticRender: boolean
  boxClass: string
  numClass: string
}) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference * (1 - score / 10)
  const [displayed, setDisplayed] = useState(staticRender ? score : 0)
  const [dashOffset, setDashOffset] = useState(staticRender ? targetOffset : circumference)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (staticRender) return
    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDisplayed(score)
      setDashOffset(targetOffset)
      return
    }
    startRef.current = null
    setDisplayed(0)
    setDashOffset(circumference)
    const duration = 700
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayed(parseFloat((eased * score).toFixed(1)))
      setDashOffset(circumference * (1 - eased * (score / 10)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [score, circumference, targetOffset, staticRender])

  return (
    <div className={`relative flex items-center justify-center ${boxClass}`}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" className="stroke-outline-variant/60" strokeWidth="9" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          className={`stroke-current ${colors.ring}`}
          strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          style={{ transition: 'none' }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center z-10">
        <span className={`font-headline ${numClass} font-bold text-on-surface leading-none`}>
          {displayed.toFixed(1)}
        </span>
        <span className="font-label text-xs text-on-surface-variant">/10</span>
      </div>
    </div>
  )
}

/** A small gsap-free particle burst (CSS keyframes) for sharp-band arrivals.
 *  12 dots fly out once on mount; reduced-motion renders nothing. */
function CelebrationBurst() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!reduced) setOn(true)
  }, [])
  if (!on) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const dist = 76 + (i % 3) * 10
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist
        const color = i % 3 === 0 ? 'var(--color-tertiary)' : i % 3 === 1 ? 'var(--color-primary)' : 'var(--color-primary-fixed-dim)'
        return (
          <span
            key={i}
            className="fb-burst-dot"
            style={{
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy}px`,
              background: color,
              animationDelay: `${(i % 4) * 45}ms`,
            }}
          />
        )
      })}
    </div>
  )
}
