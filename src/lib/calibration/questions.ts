import type { OptionQuality } from '@/lib/types'

export interface CalibrationOption {
  id: 'A' | 'B' | 'C' | 'D'
  text: string
  quality: OptionQuality
}

export interface CalibrationQuestion {
  move: 'frame' | 'list' | 'optimize' | 'win'
  scenario: string
  q: string
  luma: string
  options: CalibrationOption[]
}

// Single Spotify narrative thread — each question builds on the last
export const QUESTIONS: CalibrationQuestion[] = [
  {
    move: 'frame',
    scenario: "You're a PM at Spotify. DAU dropped 15% overnight. Leadership wants a post-mortem in 24 hours.",
    q: "What's your first move?",
    luma: "Frame move — I'm watching how you define the problem before jumping to solutions.",
    options: [
      { id: 'A', text: 'Ask what changed in the last 48 hours — deployment, notification, content licensing, or external event? The cause shapes everything', quality: 'best' },
      { id: 'B', text: 'Segment the drop by platform, region, and user cohort to find where it\'s concentrated', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Pull the funnel — check whether it\'s a top-of-funnel (opens) or engagement (session length) problem', quality: 'good_but_incomplete' },
      { id: 'D', text: 'Draft a communication plan for affected users and notify the support team', quality: 'plausible_wrong' },
    ],
  },
  {
    move: 'list',
    scenario: "You dig in. The drop is concentrated in podcast listeners — they stop after one episode instead of continuing to the next.",
    q: "Head of Product wants options by EOD. What do you explore?",
    luma: "List move — I'm watching how you generate a range of distinct options, not just variations of one idea.",
    options: [
      { id: 'A', text: 'Map the full system: autoplay logic change, recommendation quality, content gap, notification suppression — check each independently', quality: 'best' },
      { id: 'B', text: 'Focus on the autoplay experience — if listeners aren\'t continuing, something in that moment broke', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Run a quick user session to watch what happens when someone finishes an episode', quality: 'good_but_incomplete' },
      { id: 'D', text: 'Check whether a recent A/B test touched the podcast experience and roll it back', quality: 'surface' },
    ],
  },
  {
    move: 'optimize',
    scenario: "You find two viable bets: fix cross-device resume playback (where podcasts restart instead of continuing), or launch collaborative playlists to drive social engagement. Engineering says 4 weeks for resume, 6 weeks for playlists. One team, one sprint.",
    q: "How do you choose?",
    luma: "Optimize move — I'm watching how you weigh tradeoffs under real constraints, not just list options.",
    options: [
      { id: 'A', text: 'Fix resume — it\'s directly tied to the DAU drop you\'re trying to fix. Collaborative playlists are a different bet entirely', quality: 'best' },
      { id: 'B', text: 'Map the key assumptions for each: resume assumes cross-device friction is the root cause; playlists assume social is a DAU driver. Pick the one with more validation', quality: 'best' },
      { id: 'C', text: 'Playlists — 6 weeks is worth it if the engagement upside is larger than a retention fix', quality: 'surface' },
      { id: 'D', text: 'Ask engineering if they can parallelize — split the team to hit both', quality: 'good_but_incomplete' },
    ],
  },
  {
    move: 'win',
    scenario: "You recommend the resume fix. Then engineering comes back: cross-device sync requires rewriting the playback state layer — 3 months, not 4 weeks. You have an exec approval meeting on Friday.",
    q: "What's your move?",
    luma: "Win move — I'm watching how you handle a hard constraint and still land the decision.",
    options: [
      { id: 'A', text: '"That constraint is real — let\'s scope a phase 1 that fixes resume within the same device first, validate the lift, then greenlight the full sync rewrite"', quality: 'best' },
      { id: 'B', text: 'Go to Friday\'s meeting with the new scope, a revised hypothesis, and a clear ask — don\'t hide the change, frame it as better information', quality: 'best' },
      { id: 'C', text: 'Push back on engineering — 3 months seems long, ask them to find a faster path', quality: 'surface' },
      { id: 'D', text: 'Delay Friday\'s meeting until engineering has a firmer estimate you can defend', quality: 'good_but_incomplete' },
    ],
  },
]

export const QUESTIONS_BY_MOVE = {
  frame:    QUESTIONS.filter(q => q.move === 'frame'),
  list:     QUESTIONS.filter(q => q.move === 'list'),
  optimize: QUESTIONS.filter(q => q.move === 'optimize'),
  win:      QUESTIONS.filter(q => q.move === 'win'),
}
