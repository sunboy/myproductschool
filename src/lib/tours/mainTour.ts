import type { TourConfig } from './types'

// Main intro tour: a multi-screen walk across the six areas a new user should
// understand. Copy is in Hatch's voice (it/its, no em dashes, no AI slop).
// Anchors: dashboard reuses existing data-hatch-target attributes; destination
// hubs use data-tour-target on their sharpest "look here" element.

function markMainTourSeen() {
  try {
    void fetch('/api/onboarding/hatch-intro', { method: 'POST', keepalive: true })
  } catch {
    /* best effort */
  }
}

export const MAIN_TOUR: TourConfig = {
  id: 'main-intro',
  onSeen: markMainTourSeen,
  steps: [
    {
      id: 'intro',
      route: '/dashboard',
      // No anchor: centered popover with the large waving Hatch mascot.
      title: "Hi, I'm Hatch",
      body: "I'm your learning companion. I'll help you choose useful challenges, explore your thinking, and see how your skills develop. Let me show you around.",
      mascot: true,
    },
    {
      id: 'welcome',
      route: '/dashboard',
      anchor: '[data-hatch-target="dashboard-hero"]',
      title: 'Welcome to your gym',
      body: 'This is home base. Hatch tracks where your thinking is sharp and where it slips, then points you at the next rep that matters.',
      on: 'bottom',
      glyph: 'speaking',
    },
    {
      id: 'session',
      route: '/dashboard',
      anchor: '[data-hatch-target="dashboard-session"]',
      title: 'Pick up where you left off',
      body: 'Start a session here and Hatch lines up challenges that build on your last few reps instead of random practice.',
      on: 'bottom',
      glyph: 'speaking',
    },
    {
      id: 'explore',
      route: '/explore',
      anchor: '[data-tour-target="explore-paths"]',
      title: 'The whole library',
      body: 'Plans, autopsies, domains, and guides live under Explore. This is where you go when you want to choose what to work on.',
      on: 'bottom',
      glyph: 'speaking',
    },
    {
      id: 'autopsies',
      route: '/explore/autopsies',
      anchor: '[data-tour-target="autopsies-hero"]',
      title: 'Learn from real launches',
      body: 'Autopsies break down how real products actually shipped: the mechanism, the decision, the evidence. Read these the way you read a good postmortem.',
      on: 'bottom',
      glyph: 'speaking',
    },
    {
      id: 'study-plans',
      route: '/explore/plans',
      anchor: '[data-tour-target="study-plans-hero"]',
      title: 'A path, not a pile',
      body: 'Study plans sequence reps into a track so you build one reasoning move at a time instead of grinding at random.',
      on: 'bottom',
      glyph: 'speaking',
    },
    {
      id: 'practice',
      route: '/challenges',
      anchor: '[data-tour-target="practice-filters"]',
      title: 'Where the reps live',
      body: 'Filter by discipline, role, company, or difficulty. Hatch grades how you reason, not just which option you click.',
      on: 'bottom',
      glyph: 'speaking',
    },
    {
      id: 'interviews',
      route: '/live-interviews',
      anchor: '[data-tour-target="interviews-hero"]',
      title: 'Run it under pressure',
      body: 'When you want the room to feel real, Hatch runs a full mock interview, probes your answers, and writes the debrief.',
      on: 'bottom',
      glyph: 'speaking',
    },
    {
      id: 'wrap',
      route: '/dashboard',
      anchor: '[data-hatch-target="dashboard-hero"]',
      title: 'Your move',
      body: 'That is the lay of the land. The fastest way to get sharper is a rep, so start one now. Hatch will meet you there.',
      on: 'bottom',
      glyph: 'celebrating',
      primaryCta: { label: 'Start a rep', href: '/challenges' },
    },
  ],
}
