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
  hatch: string
  options: CalibrationOption[]
}

// One AI-native incident thread — each question spans product, systems, data, SQL, and coding signals.
export const QUESTIONS: CalibrationQuestion[] = [
  {
    move: 'frame',
    scenario: 'You are on the team for an AI coding assistant. Free users are burning 40% more inference, paid upgrades are flat, SQL practice accuracy dropped, and support says users feel the product is "random." Leadership wants a fix by tomorrow.',
    q: "What's your first move?",
    hatch: "Frame move — I'm watching whether you separate product symptoms, system cost, data quality, and user trust before jumping to fixes.",
    options: [
      { id: 'A', text: 'Define the decision first: are we solving cost leakage, learning quality, conversion, or trust? Then pull evidence for each before picking a lever', quality: 'best' },
      { id: 'B', text: 'Segment by discipline, plan tier, model route, and recent release cohort to see where the signal concentrates', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Review the last deployments to see whether prompt routing, SQL grading, or auth limits changed', quality: 'good_but_incomplete' },
      { id: 'D', text: 'Immediately reduce the free token limit so spend stops growing while the team investigates', quality: 'surface' },
    ],
  },
  {
    move: 'list',
    scenario: 'The data shows three hotspots: SQL hints loop too long, system design users ask Hatch for full answers, and coding users rerun failing submissions without reading feedback.',
    q: 'What set of options do you explore?',
    hatch: "List move — I'm watching whether you generate structurally different product, system, data, and UX interventions.",
    options: [
      { id: 'A', text: 'List distinct levers: cap full-solution requests, change hint depth, add reflection checkpoints, route cheaper models for low-risk nudges, and fix SQL rubric loops separately', quality: 'best' },
      { id: 'B', text: 'Audit the prompt chain and logs for each discipline so you can see whether Hatch is over-answering or users are over-requesting', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Interview a few users from each discipline to understand when they ask for answers instead of hints', quality: 'good_but_incomplete' },
      { id: 'D', text: 'Make all free users wait 30 seconds between Hatch replies so they naturally ask fewer questions', quality: 'plausible_wrong' },
    ],
  },
  {
    move: 'optimize',
    scenario: 'You can ship one thing this sprint: a token-aware hint ladder that costs 32% less, or a new onboarding game that improves activation but may increase Hatch usage. Finance wants 80% gross margin at $30/mo; growth wants conversion.',
    q: "How do you choose?",
    hatch: "Optimize move — I'm watching whether you connect user value to cost, learning quality, and margin instead of picking the flashiest feature.",
    options: [
      { id: 'A', text: 'Ship the hint ladder first if it preserves learning quality and makes unit economics work; growth that breaks margin is not durable', quality: 'best' },
      { id: 'B', text: 'Run the decision as assumptions: onboarding must lift paid conversion enough to pay for extra tokens; hint ladder must not reduce challenge completion or perceived help', quality: 'best' },
      { id: 'C', text: 'Ship onboarding because first impressions matter most and cost can be optimized later', quality: 'surface' },
      { id: 'D', text: 'Split engineering between both so neither stakeholder feels ignored', quality: 'good_but_incomplete' },
    ],
  },
  {
    move: 'win',
    scenario: 'You recommend the hint ladder. A senior engineer worries it will make Hatch feel less magical; support worries free users will complain; the CEO wants the $30 plan to feel premium.',
    q: "What's your move?",
    hatch: "Win move — I'm watching whether you can land a crisp decision with measurement, empathy, and a reversible rollout.",
    options: [
      { id: 'A', text: 'Frame it as a learning-quality upgrade, not a cost cut: hints reveal progressively, full answers still exist when earned, and success is completion plus margin', quality: 'best' },
      { id: 'B', text: 'Propose a staged rollout by discipline with guardrails: complaint rate, paid conversion, completion, and cost per active learner', quality: 'best' },
      { id: 'C', text: 'Tell support that free users are not the target customer and the company cannot subsidize unlimited AI usage', quality: 'plausible_wrong' },
      { id: 'D', text: 'Ask the CEO to decide whether premium feel or gross margin matters more', quality: 'surface' },
    ],
  },
]

export const QUESTIONS_BY_MOVE = {
  frame:    QUESTIONS.filter(q => q.move === 'frame'),
  list:     QUESTIONS.filter(q => q.move === 'list'),
  optimize: QUESTIONS.filter(q => q.move === 'optimize'),
  win:      QUESTIONS.filter(q => q.move === 'win'),
}
