'use client'

// Generic, config-driven tour orchestrator. Owns the cursor, drives cross-page
// navigation for multi-route tours, and rebuilds a fresh Shepherd instance on
// every route mount (Shepherd does not survive Next.js route changes).
//
// For single-route tours (interview tour: steps have no `route`), the engine
// simply never navigates — same code path.

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Shepherd from 'shepherd.js'
import type { TourConfig } from '@/lib/tours/types'
import {
  anchorExists,
  buildStepTour,
  clearCursor,
  getCursor,
  setCursor,
} from '@/lib/tours/shepherdEngine'

const MOUNT_SETTLE_MS = 350
const ANCHOR_POLL_MS = 200
// ~2s of polling after the initial settle before giving up on an anchor.
const ANCHOR_POLL_MAX = 10

interface TourRunnerProps {
  config: TourConfig
  /** Whether the tour should be running right now. */
  active: boolean
  /** Called when the tour ends (finish or cancel) so the parent can flip `active` off. */
  onFinish: () => void
}

export function TourRunner({ config, active, onFinish }: TourRunnerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const tourRef = useRef<InstanceType<typeof Shepherd.Tour> | null>(null)
  // Bumped to force the render effect to re-run after a cursor change that
  // doesn't change the route (e.g. same-page next/back, or activation).
  const [tick, setTick] = useState(0)

  const destroyTour = useCallback(() => {
    if (tourRef.current) {
      try {
        tourRef.current.complete()
      } catch {
        /* already gone */
      }
      tourRef.current = null
    }
  }, [])

  const endTour = useCallback(() => {
    clearCursor(config.id)
    destroyTour()
    config.onSeen?.()
    onFinish()
  }, [config, destroyTour, onFinish])

  // Advance the cursor; navigate if the next step is on another route.
  const goNext = useCallback(() => {
    const cursor = getCursor(config.id) ?? 0
    const next = cursor + 1
    if (next >= config.steps.length) {
      endTour()
      return
    }
    setCursor(config.id, next)
    const nextRoute = config.steps[next].route
    if (nextRoute && nextRoute !== pathname) {
      destroyTour()
      router.push(nextRoute)
      // The route change re-runs the render effect on the new page.
    } else {
      // Same route: rebuild in place (simplest + robust vs. partial-run indexing).
      destroyTour()
      setTick((t) => t + 1)
    }
  }, [config, pathname, router, destroyTour, endTour])

  const goBack = useCallback(() => {
    const cursor = getCursor(config.id) ?? 0
    const prev = cursor - 1
    if (prev < 0) return
    setCursor(config.id, prev)
    const prevRoute = config.steps[prev].route
    if (prevRoute && prevRoute !== pathname) {
      destroyTour()
      router.push(prevRoute)
    } else {
      destroyTour()
      setTick((t) => t + 1)
    }
  }, [config, pathname, router, destroyTour])

  // Render effect: decide what to show on this route at the current cursor.
  useEffect(() => {
    if (!active) {
      destroyTour()
      return
    }

    const cursor = getCursor(config.id)
    if (cursor === null) return

    const step = config.steps[cursor]
    if (!step) {
      endTour()
      return
    }

    // Navigate to the step's route if needed; the effect re-runs after nav.
    if (step.route && step.route !== pathname) {
      router.push(step.route)
      return
    }

    let cancelled = false
    let pollTimer: number | undefined

    const showWhenReady = (attemptsLeft: number) => {
      if (cancelled) return

      // A centered step (no anchor) is always ready. An anchored step's target
      // may mount late (cross-page nav, panel animating in): poll a few times
      // before giving up and skipping, so a slow mount doesn't drop the step.
      if (step.anchor && !anchorExists(step.anchor)) {
        if (attemptsLeft > 0) {
          pollTimer = window.setTimeout(() => showWhenReady(attemptsLeft - 1), ANCHOR_POLL_MS)
          return
        }
        // Genuinely absent (hidden mode / data-less card) — skip forward.
        goNext()
        return
      }

      destroyTour()
      const tour = buildStepTour(step, {
        isFirst: cursor === 0,
        isLast: cursor === config.steps.length - 1,
        progressLabel: `${cursor + 1} of ${config.steps.length}`,
        onNext: goNext,
        onBack: goBack,
        onDone: endTour,
        onCancel: endTour,
        onNavigate: (href: string) => router.push(href),
      })
      if (!tour) {
        goNext()
        return
      }
      tourRef.current = tour
      tour.start()
    }

    const timer = window.setTimeout(() => showWhenReady(ANCHOR_POLL_MAX), MOUNT_SETTLE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (pollTimer) window.clearTimeout(pollTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pathname, tick])

  // Clean up on unmount.
  useEffect(() => () => destroyTour(), [destroyTour])

  return null
}
