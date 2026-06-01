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

// Four short, role-agnostic product scenarios, one per FLOW move.
// No single incident thread. Each scenario is self-contained and solvable
// by any engineer or PM without domain-specific knowledge.
export const QUESTIONS: CalibrationQuestion[] = [
  {
    move: 'frame',
    scenario:
      'A B2B SaaS product has seen a 30% drop in weekly active users over two months. Support tickets mention that "the dashboard feels slow," but no performance regressions appear in engineering logs. Leadership wants a fix shipped this sprint.',
    q: "What is the right first move?",
    hatch:
      'Frame move: watching whether you separate the stated symptom (slowness perception) from possible root causes before committing to a solution direction.',
    options: [
      {
        id: 'A',
        text: 'Clarify the real problem first: perceived slowness and actual churn are different signals. Pull retention, task-completion, and session-depth data to see what users stopped doing before you decide what to fix.',
        quality: 'best',
      },
      {
        id: 'B',
        text: 'Run performance profiling on the dashboard and add a loading skeleton so users see progress feedback while data loads.',
        quality: 'good_but_incomplete',
      },
      {
        id: 'C',
        text: 'Send a survey to churned users asking why they left.',
        quality: 'surface',
      },
      {
        id: 'D',
        text: 'Escalate to engineering to fix the slowness so leadership sees action this sprint.',
        quality: 'plausible_wrong',
      },
    ],
  },
  {
    move: 'list',
    scenario:
      'A mobile app for tracking personal finances shows strong acquisition but most users stop logging transactions after two weeks. The core flow requires five taps to add an entry. Three engineers are available for the next sprint.',
    q: 'What options do you put on the table?',
    hatch:
      'List move: watching whether your options span structurally different mechanisms (habit formation, friction reduction, incentive, defaults) rather than variations on one theme.',
    options: [
      {
        id: 'A',
        text: 'Put genuinely different levers on the table: a one-tap quick-add widget, a recurring-transaction auto-suggestion that removes the need to log at all, a streak-with-recovery mechanic to rebuild the habit, and a baseline mode that imports bank data so zero-effort users still get value.',
        quality: 'best',
      },
      {
        id: 'B',
        text: 'Redesign the add-entry flow to cut it from five taps to two and run an A/B test against the current flow.',
        quality: 'good_but_incomplete',
      },
      {
        id: 'C',
        text: 'Add a daily push notification reminding users to log their spending.',
        quality: 'surface',
      },
      {
        id: 'D',
        text: 'Remove the transaction log entirely and replace it with a category-spend summary generated from bank-account read access.',
        quality: 'plausible_wrong',
      },
    ],
  },
  {
    move: 'optimize',
    scenario:
      'A checkout redesign test shows two variants performing differently: Variant A reduces cart abandonment by 18% but increases average checkout time by 40 seconds. Variant B cuts checkout time by 25 seconds but shows no statistically significant change in abandonment rate. The team must ship one.',
    q: 'How do you decide which variant to ship?',
    hatch:
      'Optimize move: watching whether you name the real criterion and the sacrifice, rather than defaulting to whichever metric sounds best in isolation.',
    options: [
      {
        id: 'A',
        text: 'Name the criterion explicitly: if the business goal is revenue per visitor, model whether 18% fewer abandoned carts outweighs the friction of 40 extra seconds for completers. Check that the time increase does not hurt mobile conversion separately, then ship the variant that wins on that metric.',
        quality: 'best',
      },
      {
        id: 'B',
        text: 'Ship Variant A because reducing abandonment directly increases revenue and the 40 seconds only affects people who complete the purchase anyway.',
        quality: 'good_but_incomplete',
      },
      {
        id: 'C',
        text: 'Ship Variant B because a faster checkout feels like a better user experience.',
        quality: 'surface',
      },
      {
        id: 'D',
        text: 'Run a third variant that combines the abandonment-reducing elements of A with the speed improvements of B before making a decision.',
        quality: 'plausible_wrong',
      },
    ],
  },
  {
    move: 'win',
    scenario:
      'A team is weighing whether to deprecate a legacy export format that 12% of users still request but costs disproportionate engineering time to maintain. The head of sales worries about enterprise churn, the VP of Engineering wants to cut the maintenance burden now, and the CEO is neutral but wants the decision made this week.',
    q: 'How does the team land this decision?',
    hatch:
      'Win move: watching whether the recommendation includes clear measurement, an empathetic read of each stakeholder, and a path that makes reversal visible if the bet is wrong.',
    options: [
      {
        id: 'A',
        text: 'Propose a 90-day sunset with migration tooling and direct outreach to the 12%: track which accounts convert to the new format vs. churn, set a cancellation-rate guardrail, and give sales a concrete offer to retain at-risk accounts. The decision is reversible up to the sunset date; the measurement makes the tradeoff visible to everyone.',
        quality: 'best',
      },
      {
        id: 'B',
        text: 'Agree to deprecate, announce a sunset date in the next release notes, and redirect support tickets to migration docs.',
        quality: 'good_but_incomplete',
      },
      {
        id: 'C',
        text: 'Tell sales that 12% of users does not represent 12% of revenue, so the churn risk is overstated.',
        quality: 'plausible_wrong',
      },
      {
        id: 'D',
        text: 'Ask the CEO to make the final call so the team has clear direction.',
        quality: 'surface',
      },
    ],
  },
]

export const QUESTIONS_BY_MOVE = {
  frame:    QUESTIONS.filter(q => q.move === 'frame'),
  list:     QUESTIONS.filter(q => q.move === 'list'),
  optimize: QUESTIONS.filter(q => q.move === 'optimize'),
  win:      QUESTIONS.filter(q => q.move === 'win'),
}

// One Hatch one-liner per quality tier, authored once and reused across all questions.
// Register: opinionated staff engineer thinking out loud. No em dashes. No second-person role framing.
export const FEEDBACK_BY_TIER: Record<OptionQuality, string> = {
  best:
    "That's the move. You named the real constraint before picking a direction.",
  good_but_incomplete:
    "Solid instinct, but the reasoning stops one step short of the full picture.",
  surface:
    "This treats a symptom. The question is what's driving it.",
  plausible_wrong:
    "Logical on the surface, but it skips the problem and optimizes for the wrong thing.",
}
