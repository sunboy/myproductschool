'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useHatchAnchor, getTopInset, getBottomInset } from './useHatchAnchor'
import { placeMarker } from './markerPlacement'

const MARKER_SIZE = 34
const IDLE_FRAME_COUNT = 5
const STABLE_THRESHOLD = 0.5

interface Props {
  targetId?: string
  highlightInset?: boolean
  /** True for tour cues — marker stays visible even when target scrolls off-screen edge. */
  keepVisible?: boolean
  onMissing?: () => void
}

interface RectSnapshot { left: number; top: number; width: number; height: number }

function rectsEqual(a: RectSnapshot | null, b: RectSnapshot): boolean {
  if (!a) return false
  return (
    Math.abs(a.left - b.left) < STABLE_THRESHOLD &&
    Math.abs(a.top - b.top) < STABLE_THRESHOLD &&
    Math.abs(a.width - b.width) < STABLE_THRESHOLD &&
    Math.abs(a.height - b.height) < STABLE_THRESHOLD
  )
}

export function HatchTargetPointer({ targetId, highlightInset, keepVisible = true, onMissing }: Props) {
  const { targetRef, missing, tick } = useHatchAnchor(targetId)
  const markerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const lastRectRef = useRef<RectSnapshot | null>(null)
  const stableFramesRef = useRef(0)
  const mountedRef = useRef(false)

  // Notify caller when target lookup gives up.
  useEffect(() => {
    if (missing && onMissing) onMissing()
  }, [missing, onMissing])

  // Continuous RAF tracking loop while active.
  useEffect(() => {
    mountedRef.current = true

    function applyRect(target: HTMLElement) {
      const marker = markerRef.current
      const overlay = overlayRef.current
      if (!marker || !overlay) return false

      const rect = target.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        marker.style.opacity = '0'
        overlay.style.opacity = '0'
        return false
      }

      let oLeft = rect.left
      let oTop = rect.top
      let oWidth = rect.width
      let oHeight = rect.height

      if (highlightInset) {
        const cs = window.getComputedStyle(target)
        const pl = parseFloat(cs.paddingLeft) || 0
        const pr = parseFloat(cs.paddingRight) || 0
        const pt = parseFloat(cs.paddingTop) || 0
        const pb = parseFloat(cs.paddingBottom) || 0
        oLeft += pl
        oTop += pt
        oWidth = Math.max(0, oWidth - pl - pr)
        oHeight = Math.max(0, oHeight - pt - pb)
      }

      const cs = window.getComputedStyle(target)
      overlay.style.borderRadius = cs.borderRadius || '12px'

      const topInset = getTopInset()
      const bottomInset = getBottomInset()
      const placement = placeMarker({
        rect,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        topInset,
        bottomInset,
        markerSize: MARKER_SIZE,
      })

      // Imperative writes — bypass React reconcile.
      marker.style.transform = `translate3d(${placement.left}px, ${placement.top}px, 0)`
      marker.style.opacity = placement.visible ? '1' : keepVisible ? '0.55' : '0'

      overlay.style.transform = `translate3d(${oLeft}px, ${oTop}px, 0)`
      overlay.style.width = `${oWidth}px`
      overlay.style.height = `${oHeight}px`
      overlay.style.opacity = '1'

      const snap: RectSnapshot = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      if (rectsEqual(lastRectRef.current, snap)) stableFramesRef.current += 1
      else stableFramesRef.current = 0
      lastRectRef.current = snap
      return true
    }

    function tick() {
      if (!mountedRef.current) return
      rafRef.current = 0

      const target = targetRef.current
      if (!target || document.hidden) return

      applyRect(target)
      // Idle optimization: stop the persistent RAF after N stable frames.
      // The tick counter from useHatchAnchor will kick us back to active on any layout event.
      if (stableFramesRef.current < IDLE_FRAME_COUNT) {
        rafRef.current = window.requestAnimationFrame(tick)
      }
    }

    // Reset settle state when target or tick changes (a kick).
    stableFramesRef.current = 0
    lastRectRef.current = null

    const target = targetRef.current
    if (target && markerRef.current && overlayRef.current) {
      applyRect(target)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = window.requestAnimationFrame(tick)
    } else {
      // No target yet — hide both, will be triggered by a tick once useHatchAnchor resolves.
      if (markerRef.current) markerRef.current.style.opacity = '0'
      if (overlayRef.current) overlayRef.current.style.opacity = '0'
    }

    return () => {
      mountedRef.current = false
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    // targetRef is a ref (stable), tick is the kick signal, highlightInset/keepVisible reset measurement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, highlightInset, keepVisible])

  // Portal hosts: marker and overlay live at document.body to escape any clipping ancestors.
  if (typeof document === 'undefined' || !targetId || missing) return null

  return createPortal(
    <>
      <div
        ref={overlayRef}
        data-testid="hatch-target-overlay"
        className="hatch-target-overlay"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: 'none',
          willChange: 'transform, width, height',
          zIndex: 49,
        }}
      />
      <div
        ref={markerRef}
        data-testid="hatch-target-marker"
        className="hatch-target-marker fixed flex h-[34px] w-[34px] items-center justify-center rounded-full pointer-events-none"
        aria-hidden="true"
        style={{
          left: 0,
          top: 0,
          opacity: 0,
          willChange: 'transform, opacity',
          zIndex: 50,
          transition: 'opacity 150ms ease-out',
        }}
      >
        <span className="material-symbols-outlined text-[18px] leading-none">ads_click</span>
      </div>
    </>,
    document.body
  )
}
