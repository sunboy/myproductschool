// Shared types for the JS-driven Shepherd tour engine.
// A tour is a list of steps + a "seen" persistence hook. The same engine drives
// both the multi-screen main intro tour and the single-screen interview tour.

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TourStep {
  /** Stable id, used for cursor math and Shepherd step ids. */
  id: string
  /**
   * Route this step lives on. When set and the user is on a different route,
   * the engine navigates there before showing the step. When omitted, the step
   * shows on the current route (single-route tours never navigate).
   */
  route?: string
  /**
   * CSS selector for the element to attach to (e.g. `[data-tour-target="..."]`).
   * When omitted, the step renders centered on screen with no anchor (used by the
   * "Meet Hatch" intro step).
   */
  anchor?: string
  title: string
  body: string
  /** Popover placement relative to the anchor. Defaults to 'bottom'. */
  on?: TourPlacement
  /** Hatch glyph state shown in the popover header. Defaults to 'speaking'. */
  glyph?: 'speaking' | 'guide' | 'celebrating' | 'idle'
  /**
   * When true, renders the large waving MaskoAvatar mascot in the popover body
   * (the same animation as the dashboard hero). Used on the centered intro step.
   */
  mascot?: boolean
  /**
   * Optional primary action button (e.g. on the final step). Finishes the tour,
   * then navigates to `href`. Rendered as the prominent button.
   */
  primaryCta?: { label: string; href: string }
}

export interface TourConfig {
  /** Unique id, used to namespace the sessionStorage cursor. */
  id: string
  steps: TourStep[]
  /** Persist the "user has seen this tour" flag (POST endpoint or localStorage). */
  onSeen?: () => void
}
