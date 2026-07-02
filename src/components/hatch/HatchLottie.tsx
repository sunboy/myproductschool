'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { AnimationItem } from 'lottie-web'

export type HatchLottieName = 'egg-idle' | 'egg-hatch' | 'egg-hatch-img'

export interface HatchLottieHandle {
  /**
   * Play a frame segment, e.g. [0, 22]. Fires onSegmentComplete when the
   * segment finishes. Returns false when the animation is not ready yet
   * (still loading) or motion is reduced.
   */
  playSegment: (segment: [number, number]) => boolean
}

interface HatchLottieProps {
  name: HatchLottieName
  size?: number
  loop?: boolean
  autoplay?: boolean
  /** Render the animation's final frame as a static image (no playback). */
  still?: boolean
  /** Fires once when a non-looping animation completes. */
  onComplete?: () => void
  /** Fires each time a playSegment() segment finishes. */
  onSegmentComplete?: () => void
  className?: string
}

/**
 * Plays a Hatch Lottie from /lottie/hatch/{name}.json.
 *
 * lottie-web is imported dynamically so it never lands in the initial bundle
 * of pages that do not mount this component. With prefers-reduced-motion the
 * animation renders its final frame as a still and onComplete fires
 * immediately (playSegment becomes a no-op returning false).
 */
export const HatchLottie = forwardRef<HatchLottieHandle, HatchLottieProps>(function HatchLottie(
  {
    name,
    size = 240,
    loop = false,
    autoplay = true,
    still = false,
    onComplete,
    onSegmentComplete,
    className = '',
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)
  const reducedRef = useRef(false)
  const segmentPlayingRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const onSegmentCompleteRef = useRef(onSegmentComplete)
  onSegmentCompleteRef.current = onSegmentComplete
  const [failed, setFailed] = useState(false)

  useImperativeHandle(ref, () => ({
    playSegment(segment: [number, number]) {
      const anim = animRef.current
      if (!anim || reducedRef.current) return false
      segmentPlayingRef.current = true
      anim.playSegments(segment, true)
      return true
    },
  }))

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!host) return

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    reducedRef.current = reducedMotion

    async function mount() {
      try {
        const [{ default: lottie }, res] = await Promise.all([
          import('lottie-web'),
          fetch(`/lottie/hatch/${name}.json`),
        ])
        if (cancelled || !host) return
        const animationData = await res.json()
        if (cancelled) return

        const showStill = still || reducedMotion
        const anim = lottie.loadAnimation({
          container: host,
          renderer: 'svg',
          loop: showStill ? false : loop,
          autoplay: showStill ? false : autoplay,
          animationData,
        })
        animRef.current = anim

        if (showStill) {
          anim.goToAndStop(Math.max(anim.totalFrames - 1, 0), true)
          onCompleteRef.current?.()
        } else if (!loop) {
          anim.addEventListener('complete', () => {
            if (segmentPlayingRef.current) {
              segmentPlayingRef.current = false
              onSegmentCompleteRef.current?.()
            } else {
              onCompleteRef.current?.()
            }
          })
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
  }, [name, loop, autoplay, still])

  if (failed) return null

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
})
