import type { TourConfig } from './types'

// Live-interview workspace tour. Single-route (steps have no `route`), so the
// engine never navigates. The step list is a superset across all discipline
// modes; the engine drops any step whose anchor is not in the DOM, so:
//   - product_sense (orb): canvas + editor steps skip; transcript/flow skip < lg
//   - system_design / data_modeling: canvas step shows, editor skips
//   - coding / sql: editor step shows, canvas skips
// Panels (transcript, FLOW) are lg+ only and auto-skip on smaller screens.

const SEEN_KEY = 'interview-tour:v1:done'

export function interviewTourSeen(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(SEEN_KEY) !== null
}

function markInterviewTourSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString())
  } catch {
    /* best effort */
  }
}

export const INTERVIEW_TOUR: TourConfig = {
  id: 'interview-intro',
  onSeen: markInterviewTourSeen,
  steps: [
    {
      id: 'stage',
      anchor: '[data-tour-target="interview-stage"]',
      title: 'This is the room',
      body: 'Hatch listens, watches your work, and pushes back in real time. Think out loud the way you would in a real interview.',
      on: 'top',
      glyph: 'speaking',
    },
    {
      id: 'transcript',
      anchor: '[data-tour-target="interview-transcript"]',
      title: 'Everything is captured',
      body: 'The full transcript lives here, with a coaching signal on each exchange so you can see what landed.',
      on: 'right',
      glyph: 'speaking',
    },
    {
      id: 'flow',
      anchor: '[data-tour-target="interview-flow"]',
      title: 'FLOW coverage',
      body: 'This tracks how well you are covering Frame, List, Optimize, and Win as the conversation moves.',
      on: 'left',
      glyph: 'speaking',
    },
    {
      id: 'canvas',
      anchor: '[data-testid="live-interview-mode-canvas"]',
      title: 'Sketch your system',
      body: 'Open the canvas and draw. Hatch reads the diagram as you build it and asks about what is missing.',
      on: 'top',
      glyph: 'speaking',
    },
    {
      id: 'editor',
      anchor: '[data-testid="live-interview-mode-editor"]',
      title: 'Write your solution',
      body: 'Open the editor and code. Hatch watches the work and probes the tradeoffs behind your choices.',
      on: 'top',
      glyph: 'speaking',
    },
    {
      id: 'chat',
      anchor: '[data-testid="live-interview-mode-chat"]',
      title: 'Type instead of talk',
      body: 'Prefer to write? Open chat and answer in text any time.',
      on: 'top',
      glyph: 'speaking',
    },
    {
      id: 'end',
      anchor: '[data-testid="live-interview-end"]',
      title: 'Wrap up when ready',
      body: 'End here when you are done. Hatch scores the round and writes your debrief.',
      on: 'top',
      glyph: 'celebrating',
    },
  ],
}
