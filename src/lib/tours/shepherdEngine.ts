// Generic Shepherd engine. Framework-agnostic of *which* tour is running.
//
// Shepherd's Tour instance does not survive a Next.js route change, so the
// orchestrator (TourRunner) keeps a step cursor in sessionStorage and asks this
// engine to build a fresh single-route Tour for the contiguous run of steps on
// the current page. Navigation between pages is the runner's job; the engine
// only deals with the steps that resolve on the page it's handed.

import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import Shepherd from 'shepherd.js'
import { HatchGlyph, type HatchState } from '@/components/shell/HatchGlyph'
import { MaskoAvatar } from '@/components/shell/MaskoAvatar'
import type { TourStep } from './types'

const CURSOR_PREFIX = 'tour:cursor:'

export function cursorKey(tourId: string) {
  return `${CURSOR_PREFIX}${tourId}`
}

export function getCursor(tourId: string): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(cursorKey(tourId))
  if (raw === null) return null
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

export function setCursor(tourId: string, index: number) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(cursorKey(tourId), String(index))
}

export function clearCursor(tourId: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(cursorKey(tourId))
}

export function anchorExists(selector: string): boolean {
  if (typeof document === 'undefined') return false
  try {
    return Boolean(document.querySelector(selector))
  } catch {
    return false
  }
}

export interface EngineHandlers {
  /** True when this is the first step of the whole tour (hides Back). */
  isFirst: boolean
  /** True when this is the last step of the whole tour (Next → Finish). */
  isLast: boolean
  /** Position label, e.g. "2 of 8", rendered in the step footer. */
  progressLabel: string
  /** Advance: cursor++. Runner decides whether to navigate or rebuild. */
  onNext: () => void
  /** Go back: cursor--. Runner decides whether to navigate or rebuild. */
  onBack: () => void
  /** Finish the whole tour. */
  onDone: () => void
  /** User cancelled (X / Esc). */
  onCancel: () => void
  /** Navigate to a route (used by a step's primaryCta after finishing). */
  onNavigate: (href: string) => void
}

const GLYPH_TO_STATE: Record<NonNullable<TourStep['glyph']>, HatchState> = {
  speaking: 'speaking',
  guide: 'speaking', // HatchGlyph has no 'guide' state; 'speaking' reads as coaching
  celebrating: 'celebrating',
  idle: 'idle',
}

// Mounts the real HatchGlyph into the step header so the coach is present in the
// popover. Shepherd renders raw DOM, so we mount a React root into the header node
// on `show` and unmount it on `hide`/`destroy`.
function attachGlyph(stepEl: HTMLElement | null | undefined, glyph: TourStep['glyph']): Root | null {
  if (!stepEl) return null
  const header = stepEl.querySelector('.shepherd-header')
  if (!header) return null
  const mount = document.createElement('span')
  mount.className = 'hatch-tour-glyph'
  header.insertBefore(mount, header.firstChild)
  const root = createRoot(mount)
  root.render(createElement(HatchGlyph, { size: 26, state: GLYPH_TO_STATE[glyph ?? 'speaking'], className: 'text-primary' }))
  return root
}

// Mounts the large waving MaskoAvatar (the dashboard-hero mascot) at the top of
// the popover body. Used on the centered intro step instead of the header glyph.
function mountMascot(stepEl: HTMLElement | null | undefined): Root | null {
  if (!stepEl) return null
  const content = stepEl.querySelector('.shepherd-content')
  if (!content) return null
  const mount = document.createElement('div')
  mount.className = 'hatch-tour-mascot'
  content.insertBefore(mount, content.firstChild)
  const root = createRoot(mount)
  root.render(createElement(MaskoAvatar, { size: 132, animation: 'wave' }))
  return root
}

/**
 * Build a single-step Shepherd Tour for `step`. The runner shows exactly one
 * step at a time and routes every Next/Back through its own handlers, which
 * keeps cursor math trivial and uniform across same-route and cross-route hops.
 * Returns null when the step's anchor does not resolve in the DOM.
 */
export function buildStepTour(
  step: TourStep,
  handlers: EngineHandlers,
): InstanceType<typeof Shepherd.Tour> | null {
  // Anchored steps require their target in the DOM; a centered step (no anchor)
  // always builds.
  const centered = !step.anchor
  if (!centered && !anchorExists(step.anchor!)) return null

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const tour = new Shepherd.Tour({
    // No dimming modal overlay: its rectangular cutout clashes with rounded
    // cards (ugly light corners). We highlight the target with a pulsing border
    // instead (see .shepherd-target styles in shepherd-theme.css).
    useModalOverlay: false,
    exitOnEsc: true,
    keyboardNavigation: false, // we own Next/Back via buttons + cursor
    defaultStepOptions: {
      scrollTo: centered ? false : { behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' },
      cancelIcon: { enabled: true },
      classes: centered ? 'hatch-tour-step hatch-tour-centered' : 'hatch-tour-step',
      arrow: !centered,
    },
  })

  tour.on('cancel', () => handlers.onCancel())

  const buttons: Array<{ text: string; action: () => void; secondary?: boolean; classes?: string }> = []
  if (!handlers.isFirst) {
    buttons.push({ text: 'Back', secondary: true, action: () => handlers.onBack() })
  }
  if (step.primaryCta) {
    // A primary CTA replaces the default Finish/Next: it ends the tour, then navigates.
    buttons.push({
      text: step.primaryCta.label,
      classes: 'hatch-tour-cta',
      action: () => {
        const href = step.primaryCta!.href
        handlers.onDone()
        handlers.onNavigate(href)
      },
    })
    // Keep a quiet way out alongside the CTA on the final step.
    if (handlers.isLast) {
      buttons.unshift({ text: 'Done', secondary: true, action: () => handlers.onDone() })
    }
  } else {
    buttons.push({
      text: handlers.isLast ? 'Finish' : 'Next',
      action: () => (handlers.isLast ? handlers.onDone() : handlers.onNext()),
    })
  }

  // Footer progress label lives inside the text body as a small muted line so we
  // don't depend on a Shepherd progress plugin.
  const text = `${step.body}<span class="hatch-tour-progress">${handlers.progressLabel}</span>`

  // React roots injected into the popover (glyph in the header, or the large
  // mascot in the body), cleaned up when the step leaves.
  const roots: Root[] = []
  const unmountRoots = () => {
    if (roots.length === 0) return
    const pending = roots.splice(0, roots.length)
    // Defer so we never unmount synchronously during React's render phase.
    setTimeout(() => pending.forEach((r) => r.unmount()), 0)
  }

  tour.addStep({
    id: step.id,
    title: step.title,
    text,
    // Centered step: omit attachTo so Shepherd renders it in the middle of the screen.
    attachTo: centered ? undefined : { element: step.anchor!, on: step.on ?? 'bottom' },
    buttons,
    when: {
      show() {
        // `this` is the Shepherd Step; its element is the popover root.
        const stepEl = (this as unknown as { el?: HTMLElement }).el
        if (step.mascot) {
          // The big mascot replaces the small header glyph on the intro step.
          const mascotRoot = mountMascot(stepEl)
          if (mascotRoot) roots.push(mascotRoot)
        } else {
          const glyphRoot = attachGlyph(stepEl, step.glyph)
          if (glyphRoot) roots.push(glyphRoot)
        }
      },
      hide() {
        unmountRoots()
      },
      destroy() {
        unmountRoots()
      },
    },
  })

  return tour
}
