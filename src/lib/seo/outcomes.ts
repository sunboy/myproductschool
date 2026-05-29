export type OutcomeSlug =
  | 'interview-prep'
  | 'role-transitions'
  | 'uplevel'
  | 'salary-negotiation'

export interface OutcomePageEntry {
  slug: OutcomeSlug
  path: `/${string}`
  title: string
  shortTitle: string
  metaTitle: string
  metaDescription: string
  hero: string
  summary: string
  proofPoint: string
  ctaLabel: string
  ctaHref: string
  secondaryLabel: string
  secondaryHref: string
  tracks: string[]
  reps: Array<{
    title: string
    href: string
    discipline: string
    flowMove: string
  }>
  proofArtifacts: string[]
  hatchNudge: string
}

export const OUTCOME_PAGES: OutcomePageEntry[] = [
  {
    slug: 'interview-prep',
    path: '/interview-prep',
    title: 'Interview prep',
    shortTitle: 'Prepare for interviews',
    metaTitle: 'Product and Technical Interview Prep | HackProduct',
    metaDescription:
      'Prepare for product sense, system design, SQL, data modeling, coding, and live interview loops with Hatch coaching and FLOW-scored practice reps.',
    hero: 'Ace product and technical interviews with sharper judgment.',
    summary:
      'Train the exact moments interviews test: clarifying ambiguity, structuring options, defending trade-offs, and landing a recommendation under pressure.',
    proofPoint: 'Build a readiness trail across FLOW moves, disciplines, and live follow-up pressure.',
    ctaLabel: 'Start an interview rep',
    ctaHref: '/login?returnTo=/challenges',
    secondaryLabel: 'Browse practice previews',
    secondaryHref: '/practice',
    tracks: ['Product sense', 'System design', 'SQL', 'Data modeling', 'Coding', 'Live loops'],
    reps: [
      {
        title: 'Diagnose a Spotify session drop',
        href: '/practice/spotify-session-drop-product-sense',
        discipline: 'Product sense',
        flowMove: 'Frame',
      },
      {
        title: 'Design a realtime notification system',
        href: '/practice/realtime-notification-system',
        discipline: 'System design',
        flowMove: 'List',
      },
      {
        title: 'Query product retention cohorts',
        href: '/practice/sql-product-analytics-retention',
        discipline: 'SQL',
        flowMove: 'Optimize',
      },
    ],
    proofArtifacts: ['Interview readiness map', 'Weak-move drill queue', 'Recorded Hatch follow-ups', 'FLOW score receipts'],
    hatchNudge:
      'You do not need another list of questions. You need reps that expose where your answer loses signal.',
  },
  {
    slug: 'role-transitions',
    path: '/role-transitions',
    title: 'Role transitions',
    shortTitle: 'Transition into product',
    metaTitle: 'Engineer to Product Role Transition Practice | HackProduct',
    metaDescription:
      'Move from engineering into product-minded work with structured product sense, metrics, strategy, systems, and AI-native workflow practice.',
    hero: 'Move from engineer to product-minded builder.',
    summary:
      'Translate technical depth into product judgment: user framing, metric diagnosis, prioritization, stakeholder communication, and AI-era workflow design.',
    proofPoint: 'Show evidence that you can reason beyond implementation without losing technical credibility.',
    ctaLabel: 'Start the transition path',
    ctaHref: '/study-plans/engineer-to-product',
    secondaryLabel: 'Practice product sense',
    secondaryHref: '/skills/product-sense',
    tracks: ['Product sense', 'Metrics', 'Prioritization', 'Stakeholder trade-offs', 'AI products'],
    reps: [
      {
        title: 'Engineer to product-minded builder',
        href: '/study-plans/engineer-to-product',
        discipline: 'Study plan',
        flowMove: 'Frame',
      },
      {
        title: 'Diagnose a Spotify session drop',
        href: '/practice/spotify-session-drop-product-sense',
        discipline: 'Product sense',
        flowMove: 'Frame',
      },
      {
        title: 'Model a multi-tenant SaaS data layer',
        href: '/practice/multi-tenant-saas-data-model',
        discipline: 'Data modeling',
        flowMove: 'List',
      },
    ],
    proofArtifacts: ['Product framing samples', 'Metric diagnosis receipts', 'Decision memo drafts', 'Role-transition study path'],
    hatchNudge:
      'Your technical instincts are useful. The rep is learning when to translate them into user value, business impact, and a decision.',
  },
  {
    slug: 'uplevel',
    path: '/uplevel',
    title: 'Uplevel',
    shortTitle: 'Get promotion-ready',
    metaTitle: 'Promotion Readiness Practice for Senior and Staff Engineers | HackProduct',
    metaDescription:
      'Practice senior and staff-level product strategy, system trade-offs, executive communication, and operating judgment with Hatch and FLOW.',
    hero: 'Operate at senior and staff level before the room expects it.',
    summary:
      'Practice the judgment behind promotion: framing ambiguous bets, comparing options, connecting architecture to outcomes, and writing recommendations leaders can act on.',
    proofPoint: 'Turn repeated judgment reps into evidence of broader scope and stronger operating level.',
    ctaLabel: 'Get promotion-ready',
    ctaHref: '/study-plans/staff-engineer-product-strategy',
    secondaryLabel: 'Explore FLOW',
    secondaryHref: '/flow',
    tracks: ['Staff strategy', 'Architecture trade-offs', 'Executive narratives', 'Systems', 'Product metrics'],
    reps: [
      {
        title: 'Staff engineer product strategy',
        href: '/study-plans/staff-engineer-product-strategy',
        discipline: 'Study plan',
        flowMove: 'Win',
      },
      {
        title: 'Design a realtime notification system',
        href: '/practice/realtime-notification-system',
        discipline: 'System design',
        flowMove: 'Optimize',
      },
      {
        title: 'Debug an AI-generated coding solution',
        href: '/practice/ai-assisted-coding-debugging',
        discipline: 'Coding',
        flowMove: 'Win',
      },
    ],
    proofArtifacts: ['Staff-level recommendation drafts', 'Trade-off receipts', 'FLOW progression map', 'Leadership-ready practice history'],
    hatchNudge:
      'Promotion signal shows up when your answer makes the next decision easier for everyone else.',
  },
  {
    slug: 'salary-negotiation',
    path: '/salary-negotiation',
    title: 'Salary negotiation',
    shortTitle: 'Build salary negotiation proof',
    metaTitle: 'Salary Negotiation Proof for Product-Minded Tech Careers | HackProduct',
    metaDescription:
      'Build evidence of operating level for salary negotiation: FLOW receipts, practice history, decision artifacts, and proof of product-minded technical judgment.',
    hero: 'Negotiate with proof, not hope.',
    summary:
      'Salary leverage is strongest when you can show evidence of judgment: decisions you can frame, trade-offs you can defend, and artifacts that demonstrate operating level.',
    proofPoint: 'HackProduct does not guarantee compensation outcomes. It helps you build a stronger evidence trail.',
    ctaLabel: 'Build proof of level',
    ctaHref: '/login?returnTo=/progress',
    secondaryLabel: 'See progress proof',
    secondaryHref: '/uplevel',
    tracks: ['Readiness receipts', 'Learner DNA', 'Weak-move repair', 'Decision artifacts', 'Staff narratives'],
    reps: [
      {
        title: 'Staff engineer product strategy',
        href: '/study-plans/staff-engineer-product-strategy',
        discipline: 'Study plan',
        flowMove: 'Win',
      },
      {
        title: 'Model a multi-tenant SaaS data layer',
        href: '/practice/multi-tenant-saas-data-model',
        discipline: 'Data modeling',
        flowMove: 'Optimize',
      },
      {
        title: 'Debug an AI-generated coding solution',
        href: '/practice/ai-assisted-coding-debugging',
        discipline: 'Coding',
        flowMove: 'Frame',
      },
    ],
    proofArtifacts: ['FLOW receipts', 'Career-ready artifacts', 'Readiness deltas', 'Negotiation evidence notes'],
    hatchNudge:
      'Do not argue that you are ready. Bring evidence that makes your level easier to see.',
  },
]

export function getOutcome(slug: string) {
  return OUTCOME_PAGES.find((outcome) => outcome.slug === slug) ?? null
}
