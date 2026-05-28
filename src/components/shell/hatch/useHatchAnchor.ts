'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Resolves a [data-hatch-target="id"] element and notifies the caller of layout-change events.
 *
 * The hook does NOT measure or position anything — it just hands the target ref to the caller's
 * imperative RAF tracking loop and exposes a `tick` counter that increments whenever the layout
 * may have changed (resize, font load, image load, mutation, scroll-into-view completion).
 *
 * Idempotent across React 19 strict-mode double-invoke.
 */
export interface UseHatchAnchorResult {
  targetRef: React.MutableRefObject<HTMLElement | null>
  missing: boolean
  /** Increments whenever a layout-change signal fires. Caller uses it to kick the RAF loop. */
  tick: number
}

const RESOLVE_MAX_RETRIES = 10 // ~700ms at 60fps
const TOP_INSET_FALLBACK = 76
const BOTTOM_INSET_FALLBACK = 24

export function useHatchAnchor(targetId: string | undefined): UseHatchAnchorResult {
  const targetRef = useRef<HTMLElement | null>(null)
  const [missing, setMissing] = useState(false)
  const [tick, setTick] = useState(0)

  const bump = useCallback(() => setTick((t) => (t + 1) % 1_000_000), [])

  useEffect(() => {
    targetRef.current = null
    setMissing(false)

    if (!targetId || typeof window === 'undefined') return

    let cancelled = false
    let rafId = 0
    let retries = 0
    let resizeObs: ResizeObserver | null = null
    let parentMutObs: MutationObserver | null = null
    let scrollMutObs: MutationObserver | null = null
    const imgListeners: Array<{ img: HTMLImageElement; handler: () => void }> = []

    function findScrollable(el: HTMLElement | null): HTMLElement {
      let node: HTMLElement | null = el?.parentElement ?? null
      while (node) {
        const style = window.getComputedStyle(node)
        const oy = style.overflowY
        if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') return node
        node = node.parentElement
      }
      return document.documentElement
    }

    function attachObservers(target: HTMLElement) {
      if (typeof ResizeObserver !== 'undefined') {
        resizeObs = new ResizeObserver(() => { if (!cancelled) bump() })
        resizeObs.observe(target)
        resizeObs.observe(document.documentElement)
      }
      if (typeof MutationObserver !== 'undefined') {
        if (target.parentElement) {
          parentMutObs = new MutationObserver(() => { if (!cancelled) bump() })
          parentMutObs.observe(target.parentElement, { childList: true })
        }
        const scroller = findScrollable(target)
        scrollMutObs = new MutationObserver(() => { if (!cancelled) bump() })
        scrollMutObs.observe(scroller, { childList: true, subtree: false })
      }
      // Image load → re-measure once each.
      const imgs = Array.from(target.querySelectorAll('img'))
      imgs.forEach((img) => {
        if (img.complete) return
        const handler = () => { if (!cancelled) bump() }
        img.addEventListener('load', handler, { once: true })
        img.addEventListener('error', handler, { once: true })
        imgListeners.push({ img, handler })
      })
    }

    function scrollIntoViewIfNeeded(target: HTMLElement) {
      const rect = target.getBoundingClientRect()
      const topInset =
        document.querySelector<HTMLElement>('[data-topnav]')?.getBoundingClientRect().bottom ??
        TOP_INSET_FALLBACK
      const bottomInset = BOTTOM_INSET_FALLBACK
      const outOfView =
        rect.bottom < topInset + 12 ||
        rect.top > window.innerHeight - bottomInset - 12 ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      if (outOfView) {
        const prefersReducedMotion =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        target.scrollIntoView({
          block: 'center',
          inline: 'nearest',
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        })
      }
    }

    function tryResolve() {
      if (cancelled) return
      const el = document.querySelector<HTMLElement>(`[data-hatch-target="${CSS.escape(targetId!)}"]`)
      if (el) {
        targetRef.current = el
        setMissing(false)
        attachObservers(el)
        scrollIntoViewIfNeeded(el)
        bump()
        return
      }
      retries += 1
      if (retries >= RESOLVE_MAX_RETRIES) {
        setMissing(true)
        return
      }
      rafId = window.requestAnimationFrame(tryResolve)
    }

    // Kick resolve.
    rafId = window.requestAnimationFrame(tryResolve)

    // Layout-change signals at window level.
    const onWindowChange = () => { if (!cancelled) bump() }
    window.addEventListener('resize', onWindowChange)
    window.addEventListener('scroll', onWindowChange, { passive: true, capture: true })
    window.visualViewport?.addEventListener('resize', onWindowChange)
    window.visualViewport?.addEventListener('scroll', onWindowChange)
    document.addEventListener('animationend', onWindowChange, true)
    document.addEventListener('transitionend', onWindowChange, true)
    document.addEventListener('visibilitychange', onWindowChange)

    // Font readiness — one-shot.
    const fontsApi = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts
    if (fontsApi?.ready) {
      fontsApi.ready.then(() => {
        if (!cancelled) bump()
      })
    }

    return () => {
      cancelled = true
      if (rafId) window.cancelAnimationFrame(rafId)
      resizeObs?.disconnect()
      parentMutObs?.disconnect()
      scrollMutObs?.disconnect()
      imgListeners.forEach(({ img, handler }) => {
        img.removeEventListener('load', handler)
        img.removeEventListener('error', handler)
      })
      window.removeEventListener('resize', onWindowChange)
      window.removeEventListener('scroll', onWindowChange, true)
      window.visualViewport?.removeEventListener('resize', onWindowChange)
      window.visualViewport?.removeEventListener('scroll', onWindowChange)
      document.removeEventListener('animationend', onWindowChange, true)
      document.removeEventListener('transitionend', onWindowChange, true)
      document.removeEventListener('visibilitychange', onWindowChange)
      targetRef.current = null
    }
  }, [targetId, bump])

  return { targetRef, missing, tick }
}

export function getTopInset(): number {
  if (typeof document === 'undefined') return TOP_INSET_FALLBACK
  const el = document.querySelector<HTMLElement>('[data-topnav]')
  if (!el) return TOP_INSET_FALLBACK
  const rect = el.getBoundingClientRect()
  return Math.max(0, rect.bottom)
}

export function getBottomInset(): number {
  return BOTTOM_INSET_FALLBACK
}
