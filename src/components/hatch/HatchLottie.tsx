'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnimationItem } from 'lottie-web'

export type HatchLottieName = 'egg-idle' | 'egg-hatch'

interface HatchLottieProps {
  name: HatchLottieName
  size?: number
  loop?: boolean
  autoplay?: boolean
  /** Fires once when a non-looping animation completes. */
  onComplete?: () => void
  className?: string
}

/**
 * Plays a Hatch Lottie from /lottie/hatch/{name}.json.
 *
 * lottie-web is imported dynamically so it never lands in the initial bundle
 * of pages that do not mount this component. With prefers-reduced-motion the
 * animation renders its final frame as a still and onComplete fires
 * immediately.
 */
export function HatchLottie({
  name,
  size = 240,
  loop = false,
  autoplay = true,
  onComplete,
  className = '',
}: HatchLottieProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!host) return

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    async function mount() {
      try {
        const [{ default: lottie }, res] = await Promise.all([
          import('lottie-web'),
          fetch(`/lottie/hatch/${name}.json`),
        ])
        if (cancelled || !host) return
        const animationData = await res.json()
        if (cancelled) return

        const anim = lottie.loadAnimation({
          container: host,
          renderer: 'svg',
          loop: reducedMotion ? false : loop,
          autoplay: reducedMotion ? false : autoplay,
          animationData,
        })
        animRef.current = anim

        if (reducedMotion) {
          anim.goToAndStop(Math.max(anim.totalFrames - 1, 0), true)
          onCompleteRef.current?.()
        } else if (!loop) {
          anim.addEventListener('complete', () => onCompleteRef.current?.())
        }
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void mount()
    return () => {
      cancelled = true
      animRef.current?.destroy()
      animRef.current = null
    }
  }, [name, loop, autoplay])

  if (failed) return null

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}
