/**
 * Step template model for the structured SD/DM workspace.
 *
 * Pure data module. No 'use client', no React imports: it is imported by
 * client components AND by the server grader
 * (src/lib/v2/skills/interview-grading/index.ts). Only type import allowed is
 * CanvasChallengeType from @/lib/hatch/canvasGuidance.
 *
 * The section id `tradeoffs` is load-bearing: detectTradeoffs in
 * src/lib/hatch/canvasGuidance.ts special-cases `f.id === 'tradeoffs'`, so the
 * guidance phase machine advances to `ready` off this section with zero
 * changes. Do not rename it.
 */

import type { CanvasChallengeType } from '@/lib/hatch/canvasGuidance'

export type DesignStepId = 'frame' | 'list' | 'optimize' | 'win'

export interface DesignSection {
  /** snake_case, unique across ALL steps (used as jsonb key + guidance field id) */
  id: string
  label: string
  /** 1-2 sentence brief under the label */
  prompt: string
  placeholder: string
  kind: 'textarea' | 'diagram'
  /** textarea only; enforced + live counter */
  maxChars?: number
  /** progress-ring threshold; default 80 */
  minCharsDone?: number
}

export interface DesignStep {
  id: DesignStepId
  /** stepper label: Frame / List / Optimize / Win */
  label: string
  /** form heading (Nunito Sans 700 per spec, NOT serif) */
  title: string
  intro: string
  sections: DesignSection[]
}

export function isDesignStepId(value: unknown): value is DesignStepId {
  return value === 'frame' || value === 'list' || value === 'optimize' || value === 'win'
}

const SYSTEM_DESIGN_STEPS: DesignStep[] = [
  {
    id: 'frame',
    label: 'Frame',
    title: 'Frame the problem',
    intro: 'Before any boxes: what is actually being asked, and for whom.',
    sections: [
      {
        id: 'problem_statement',
        label: 'Problem and users',
        prompt:
          'Name the core job, the user who feels it, and the one constraint that makes this system hard to build.',
        placeholder:
          'Restaurants push live menu and price changes while thousands of carts are open against them…',
        kind: 'textarea',
        maxChars: 900,
      },
      {
        id: 'scope_boundary',
        label: 'Scope',
        prompt:
          'What this session covers and what it deliberately leaves out. A sharp out-of-scope list buys depth where it counts.',
        placeholder: 'In: cart state, pricing consistency. Out: payments, fraud, recommendations.',
        kind: 'textarea',
        maxChars: 600,
      },
    ],
  },
  {
    id: 'list',
    label: 'List',
    title: 'List requirements and constraints',
    intro: 'The checklist an interviewer would test your design against.',
    sections: [
      {
        id: 'functional_requirements',
        label: 'Functional requirements',
        prompt:
          'The operations the system must support, written as verbs. Lead with the ones that break first under load.',
        placeholder: 'Update a menu item. Read an open cart. Reprice a cart when the menu changes…',
        kind: 'textarea',
        maxChars: 900,
      },
      {
        id: 'scale_constraints',
        label: 'Scale and constraints',
        prompt:
          'Real numbers: users, requests per second, data size, latency budget. Where the brief is silent, estimate and say which estimate you would defend.',
        placeholder: '2M daily carts, 500 menu writes/s at dinner peak, cart reads must stay under 100ms…',
        kind: 'textarea',
        maxChars: 900,
      },
    ],
  },
  {
    id: 'optimize',
    label: 'Optimize',
    title: 'Design and defend',
    intro: 'The core of the session: your approach, the diagram, and the decision you are betting on.',
    sections: [
      {
        id: 'approach',
        label: 'High-level approach',
        prompt:
          'The shape of the solution in plain words before any boxes. Name the moving parts and why this decomposition over the obvious alternative.',
        placeholder:
          'A menu service owns writes, carts subscribe to a change feed, and repricing happens at read time…',
        kind: 'textarea',
        maxChars: 1000,
      },
      {
        id: 'architecture',
        label: 'System design diagram',
        prompt:
          'Draw the components and how requests flow between them. Hatch reads this diagram alongside your write-up.',
        placeholder: '',
        kind: 'diagram',
      },
      {
        id: 'deep_dive',
        label: 'Deep dive',
        prompt:
          'Pick the hardest component in your diagram and go one level down: its data model, its API, and what happens when it fails.',
        placeholder:
          'The change feed: ordered per restaurant, at-least-once delivery, consumers dedupe on version…',
        kind: 'textarea',
        maxChars: 1500,
      },
      {
        id: 'tradeoffs',
        label: 'Trade-offs',
        prompt:
          'The decision you are betting on. What you gained, what you gave up, and why the sacrifice is acceptable.',
        placeholder:
          'Repricing at read time keeps writes cheap. We give up a stable cart total between refreshes…',
        kind: 'textarea',
        maxChars: 1000,
      },
    ],
  },
  {
    id: 'win',
    label: 'Win',
    title: 'Prove it works',
    intro: 'A design is a hypothesis. Say how you would find out it is wrong.',
    sections: [
      {
        id: 'validation',
        label: 'How you would validate',
        prompt:
          'The load test, shadow read, or migration dry run that would expose the weak point before real traffic does.',
        placeholder:
          'Replay a dinner-peak write trace against a shadow cart store and diff the repriced totals…',
        kind: 'textarea',
        maxChars: 800,
      },
      {
        id: 'metrics',
        label: 'Metrics and failure signals',
        prompt:
          'The number that says this works, its threshold, and the counter-signal that says it failed.',
        placeholder:
          'p99 cart read under 100ms at peak. Failure signal: stale-price complaints above 0.1% of orders…',
        kind: 'textarea',
        maxChars: 700,
      },
    ],
  },
]

const DATA_MODELING_STEPS: DesignStep[] = [
  {
    id: 'frame',
    label: 'Frame',
    title: 'Frame the problem',
    intro: 'Before any tables: what the data must answer, and for whom.',
    sections: [
      {
        id: 'problem_statement',
        label: 'Problem and access patterns',
        prompt:
          'Name what the data must answer: the queries that run constantly, and the write pattern that shapes everything else.',
        placeholder:
          'Every page load asks for a member and their active subscriptions. Writes are rare but must never double-bill…',
        kind: 'textarea',
        maxChars: 900,
      },
      {
        id: 'scope_boundary',
        label: 'Scope',
        prompt:
          'What this session covers and what it deliberately leaves out. A sharp out-of-scope list buys depth where it counts.',
        placeholder: 'In: members, plans, billing state. Out: invoicing, dunning emails, analytics rollups.',
        kind: 'textarea',
        maxChars: 600,
      },
    ],
  },
  {
    id: 'list',
    label: 'List',
    title: 'List requirements and constraints',
    intro: 'The checklist an interviewer would test your model against.',
    sections: [
      {
        id: 'functional_requirements',
        label: 'Entities and relationships',
        prompt: 'The things the business talks about and how they relate. Plural nouns, real cardinalities.',
        placeholder: 'members, plans, subscriptions. A member holds many subscriptions; a plan has many members…',
        kind: 'textarea',
        maxChars: 900,
      },
      {
        id: 'scale_constraints',
        label: 'Volume and access',
        prompt: 'Row counts, write rates, the hot queries, and how stale a read is allowed to be.',
        placeholder: '10M members, 40M subscription rows, 2k reads/s on the member lookup, reads can lag writes by a minute…',
        kind: 'textarea',
        maxChars: 900,
      },
    ],
  },
  {
    id: 'optimize',
    label: 'Optimize',
    title: 'Design and defend',
    intro: 'The core of the session: your approach, the schema, and the decision you are betting on.',
    sections: [
      {
        id: 'approach',
        label: 'Modeling approach',
        prompt:
          'The shape of the solution in plain words before any boxes. Name the moving parts and why this decomposition over the obvious alternative.',
        placeholder:
          'Subscriptions as a state-carrying join between members and plans, with billing events appended, never updated…',
        kind: 'textarea',
        maxChars: 1000,
      },
      {
        id: 'architecture',
        label: 'Schema diagram',
        prompt:
          'Draw the tables, their columns, and how they relate. Hatch reads this diagram alongside your write-up.',
        placeholder: '',
        kind: 'diagram',
      },
      {
        id: 'deep_dive',
        label: 'Deep dive',
        prompt:
          'Take the trickiest relationship or the hottest table one level down: keys, indexes, and what a migration does to it.',
        placeholder:
          'subscriptions: composite index on (member_id, status), unique partial index guarding one active row per plan…',
        kind: 'textarea',
        maxChars: 1500,
      },
      {
        id: 'tradeoffs',
        label: 'Trade-offs',
        prompt:
          'Usually normalization against read speed. Name the denormalization you accepted, or the joins you chose to keep, and why.',
        placeholder:
          'Kept plan price normalized so a price change is one write. The member page pays for it with one extra join…',
        kind: 'textarea',
        maxChars: 1000,
      },
    ],
  },
  {
    id: 'win',
    label: 'Win',
    title: 'Prove it works',
    intro: 'A model is a hypothesis. Say how you would find out it is wrong.',
    sections: [
      {
        id: 'validation',
        label: 'How you would validate',
        prompt: 'The queries that must stay fast and the dataset size you would prove them at.',
        placeholder:
          'Load 40M subscription rows and run the member lookup and the renewal sweep against production-shaped data…',
        kind: 'textarea',
        maxChars: 800,
      },
      {
        id: 'metrics',
        label: 'Metrics and failure signals',
        prompt:
          'The number that says this works, its threshold, and the counter-signal that says it failed.',
        placeholder:
          'Member lookup p99 under 20ms at 2k reads/s. Failure signal: any double-active subscription row…',
        kind: 'textarea',
        maxChars: 700,
      },
    ],
  },
]

export function designStepsFor(challengeType: CanvasChallengeType): DesignStep[] {
  return challengeType === 'data_modeling' ? DATA_MODELING_STEPS : SYSTEM_DESIGN_STEPS
}

export function allDesignSections(
  challengeType: CanvasChallengeType
): Array<DesignSection & { stepId: DesignStepId }> {
  return designStepsFor(challengeType).flatMap((step) =>
    step.sections.map((section) => ({ ...section, stepId: step.id }))
  )
}
