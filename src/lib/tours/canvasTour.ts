import type { TourConfig } from './types'

// First-entry tour for canvas challenges (system_design + data_modeling).
// Single-route (steps have no `route`), so the engine never navigates. Anchors
// that aren't present in the current layout are skipped by the engine.
//
// Mirrors interviewTour.ts: localStorage-gated, replayable via a window event.

const SEEN_KEY = 'canvas-tour:v1:done'

export function canvasTourSeen(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(SEEN_KEY) !== null
}

function markCanvasTourSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString())
  } catch {
    /* best effort */
  }
}

export const CANVAS_TOUR: TourConfig = {
  id: 'canvas-intro',
  onSeen: markCanvasTourSeen,
  steps: [
    {
      id: 'surface',
      anchor: '[data-tour-target="canvas-surface"]',
      title: 'Draw your thinking here',
      body: 'Sketch the design by hand, or tell Hatch what to draw. Boxes are components, arrows are how data moves between them.',
      on: 'right',
    },
    {
      id: 'notes',
      anchor: '[data-tour-target="canvas-notes"]',
      title: 'Make your case in notes',
      body: 'Notes hold your assumptions, constraints, and the tradeoff you picked. This is where you argue for the design, not just draw it.',
      on: 'bottom',
    },
    {
      id: 'context-loop',
      anchor: '[data-tour-target="canvas-context-loop"]',
      title: 'Run the context loop',
      body: 'Open this to point Hatch at your notes and canvas together. Ask it to find a gap, build the next piece, or stress-test what you have.',
      on: 'bottom',
    },
    {
      id: 'hatch',
      anchor: '[data-hatch-target="workspace-hatch-chat"]',
      title: 'Ask Hatch anything',
      body: 'Hatch reads the canvas and your notes on every message. Ask what is missing, or have it draw a component you describe.',
      on: 'left',
    },
    {
      id: 'submit',
      anchor: '[data-tour-target="canvas-submit"]',
      title: 'Submit when it holds up',
      body: 'The meter shows what Hatch can see now. A submission is strongest with a few connected components and a tradeoff you can defend.',
      on: 'top',
    },
  ],
}
