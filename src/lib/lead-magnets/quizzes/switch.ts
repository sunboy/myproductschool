// Quiz config for the /go/switch lead magnet.
// Frame: story audit for engineers considering a PM transition.
// 2 picker steps (background + story type) + 3 scored MCQ steps (telling, decision, close).
// Silent scoring so the result reads as a diagnostic, not a test.
// Import-safe on both server and client: no server-only deps.

import type { MagnetQuizConfig, QuizAnswers } from '@/lib/lead-magnets/quiz-types'

// Scoring dimensions: customer lens (0-3), tradeoff lens (0-3), outcome lens (0-3).
// Each MCQ step contributes one point to one or two dimensions depending on the option.

export const switchQuizConfig: MagnetQuizConfig = {
  magnet: 'switch',
  version: 1,
  steps: [
    {
      kind: 'picker',
      id: 'background',
      prompt: 'Pick the background closest to yours.',
      options: [
        { id: 'backend', label: 'Backend', sub: 'APIs, services, data pipelines, infra at the code level' },
        { id: 'frontend', label: 'Frontend', sub: 'Product surfaces, UI, performance, the parts users see' },
        { id: 'data', label: 'Data', sub: 'Analytics, ML, experimentation, instrumentation' },
        { id: 'infra-platform', label: 'Infra / platform', sub: 'Reliability, developer tooling, internal systems' },
      ],
    },
    {
      kind: 'picker',
      id: 'storyType',
      prompt: 'Think of the project you would lead with in an interview. What kind is it?',
      options: [
        { id: 'rescue', label: 'Rescue', sub: 'Fixed something that was failing or on fire' },
        { id: 'scale', label: 'Scale', sub: 'Made something handle 10x the load or size' },
        { id: 'zero-to-one', label: 'Zero to one', sub: 'Built something that did not exist before' },
        { id: 'migration', label: 'Migration', sub: 'Moved something risky from one state to another' },
      ],
    },
    {
      kind: 'mcq',
      id: 'opening',
      prompt: 'The interviewer says: "Tell me about a project you led." What do you open with?',
      options: [
        {
          id: 'a',
          text: 'The tech stack and the architectural decisions the project required.',
          scores: { customer: 0, tradeoff: 0, outcome: 0 },
        },
        {
          id: 'b',
          text: 'The user pain the project was a response to, and how the team knew it was real.',
          scores: { customer: 3, tradeoff: 0, outcome: 0 },
        },
        {
          id: 'c',
          text: 'The metric that moved as a result of shipping it.',
          scores: { customer: 0, tradeoff: 0, outcome: 2 },
        },
        {
          id: 'd',
          text: 'What the team learned and how it changed the roadmap afterward.',
          scores: { customer: 1, tradeoff: 0, outcome: 1 },
        },
      ],
    },
    {
      kind: 'mcq',
      id: 'decision',
      prompt: 'They ask: "What was the hardest decision you had to make?" How do you describe it?',
      options: [
        {
          id: 'a',
          text: 'A technical constraint that forced the team toward one option over another.',
          scores: { customer: 0, tradeoff: 0, outcome: 0 },
        },
        {
          id: 'b',
          text: 'A choice between two things the team both wanted, where picking one meant giving up the other, and the reason the sacrifice was worth it.',
          scores: { customer: 1, tradeoff: 3, outcome: 1 },
        },
        {
          id: 'c',
          text: 'A disagreement with another engineer about the right approach, and how it got resolved.',
          scores: { customer: 0, tradeoff: 1, outcome: 0 },
        },
        {
          id: 'd',
          text: 'A scope cut that kept the project on track, without explaining what was weighed to make it.',
          scores: { customer: 0, tradeoff: 0, outcome: 0 },
        },
      ],
    },
    {
      kind: 'mcq',
      id: 'close',
      prompt: 'How do you close the story?',
      options: [
        {
          id: 'a',
          text: 'The team shipped on time and the project was well received.',
          scores: { customer: 0, tradeoff: 0, outcome: 0 },
        },
        {
          id: 'b',
          text: 'A specific metric reached a specific threshold within a named window, with one counter-signal that would have told us it failed.',
          scores: { customer: 0, tradeoff: 0, outcome: 3 },
        },
        {
          id: 'c',
          text: 'A qualitative summary of the team effort and what it meant for the product direction.',
          scores: { customer: 1, tradeoff: 0, outcome: 0 },
        },
        {
          id: 'd',
          text: 'The engineering work was completed and handed off to the business side to measure results.',
          scores: { customer: 0, tradeoff: 0, outcome: 0 },
        },
      ],
    },
  ],

  deriveResult(answers: QuizAnswers) {
    const background = typeof answers.background === 'string' ? answers.background : 'backend'
    const storyType = typeof answers.storyType === 'string' ? answers.storyType : 'rescue'

    // Tally scored dimensions across the three MCQ steps.
    let customer = 0
    let tradeoff = 0
    let outcome = 0

    for (const stepId of ['opening', 'decision', 'close']) {
      const picked = typeof answers[stepId] === 'string' ? (answers[stepId] as string) : ''
      const step = switchQuizConfig.steps.find((s) => s.id === stepId)
      if (!step || step.kind !== 'mcq') continue
      const opt = step.options.find((o) => o.id === picked)
      if (!opt?.scores) continue
      customer += opt.scores.customer ?? 0
      tradeoff += opt.scores.tradeoff ?? 0
      outcome += opt.scores.outcome ?? 0
    }

    const total = customer + tradeoff + outcome // max 9

    // Band by total.
    let band: { key: string; label: string; blurb: string }
    if (total >= 7) {
      band = {
        key: 'translates',
        label: 'Your story translates',
        blurb:
          'The engineering instincts are already there and the telling is mostly right. The gap is usually in how consistently you hit all three lenses when the question changes.',
      }
    } else if (total >= 4) {
      band = {
        key: 'half-translated',
        label: 'Half-translated',
        blurb:
          'The story has the right raw material but the telling leans on one lens and skips the other two. Interviewers notice the missing ones before they credit the present one.',
      }
    } else {
      band = {
        key: 'engineer-coded',
        label: 'Engineer-coded',
        blurb:
          'The story is good work, but the telling is optimised for a technical audience. A PM interviewer hears execution and craft, but not the product reasoning underneath it.',
      }
    }

    // Weakest lens.
    const lensScores = { customer, tradeoff, outcome }
    const weakestLens = (Object.entries(lensScores).sort((a, b) => a[1] - b[1])[0][0]) as
      | 'customer'
      | 'tradeoff'
      | 'outcome'

    // Per-background authored gaps and transfers.
    const gapsForBackground: Record<string, string[]> = {
      backend: [
        'Framing the project around system behaviour rather than who breaks when the system misbehaves.',
        'Describing latency or throughput targets without naming whose experience those numbers protect.',
        'Closing with reliability metrics without connecting them to a business outcome an interviewer can evaluate.',
      ],
      frontend: [
        'Treating performance wins as the story rather than the user action that became possible because of them.',
        'Describing design iteration without naming the signal that told the team which direction was right.',
        'Framing accessibility or polish work as craft without connecting it to retention or conversion data.',
      ],
      data: [
        'Describing the model or pipeline rather than the decision it was built to inform.',
        'Presenting accuracy metrics without naming who relied on those predictions and what they did with them.',
        'Framing an instrumentation project around coverage rather than the product questions it finally answered.',
      ],
      'infra-platform': [
        'Framing the story around the engineering team as the customer rather than the product teams whose velocity changed.',
        'Describing reliability improvements without connecting them to user-facing impact or business cost avoided.',
        'Presenting a migration as a technical achievement without naming the product bets it made possible.',
      ],
    }

    const transfersForBackground: Record<string, string[]> = {
      backend: [
        'Fluency with system constraints, which is what makes tradeoff reasoning credible rather than theoretical.',
        'A default instinct to ask what breaks and how, which maps directly to the PM move of naming failure modes.',
        'Ownership of complex projects end-to-end, which is the evidence interviewers look for when they ask about scope.',
      ],
      frontend: [
        'Proximity to real user behaviour, which means customer-lens reasoning comes naturally when the framing shifts.',
        'A habit of measuring change in terms of user actions, which is already close to the product outcome language interviewers want.',
        'Experience navigating stakeholder input on visible work, which transfers directly to the PM skill of holding a position under pressure.',
      ],
      data: [
        'Familiarity with causal reasoning under uncertainty, which is the core of falsifiable outcome framing.',
        'A default toward measurement, which means outcome-lens answers are usually already there and just need the business context added.',
        'Experience working across multiple teams as an internal supplier, which maps well to the PM skill of managing without authority.',
      ],
      'infra-platform': [
        'Deep experience with second-order effects, which is exactly what tradeoff reasoning requires.',
        'A track record of enabling others rather than building for end users, which translates to the PM move of optimising for the team rather than the artifact.',
        'Ownership of projects with no obvious user-visible outcome, which makes outcome framing harder and therefore the skill more meaningful when demonstrated.',
      ],
    }

    return {
      band,
      score: total,
      dimensions: [
        { key: 'customer', label: 'Customer lens', value: customer, max: 3 },
        { key: 'tradeoff', label: 'Tradeoff lens', value: tradeoff, max: 3 },
        { key: 'outcome', label: 'Outcome lens', value: outcome, max: 3 },
      ],
      recommendedNext: {
        label: 'Practice the PM telling',
        href: '/challenges',
      },
      detail: {
        background,
        storyType,
        weakestLens,
        gapsForBackground: gapsForBackground[background] ?? gapsForBackground.backend,
        transfersForBackground: transfersForBackground[background] ?? transfersForBackground.backend,
      },
    }
  },
}
