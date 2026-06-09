// Single source of truth for the /go/* lead-magnet pages.
//
// Each magnet has a stable `slug` (the URL segment + the `source_slug` stored on
// the lead row + the email dedupe key) and, for email-gated magnets, the unlock
// email copy. SIGNUP-mode magnets (the practice tools + live-analyst demo) send
// the visitor straight to account creation and have no unlock email.
//
// This module is import-safe on both server and client (no server-only deps) so
// pages and the API route can share one list of valid slugs.

export type LeadMagnetCapture = 'gate' | 'signup'

export interface LeadMagnetUnlockCopy {
  subject: string
  eyebrow: string
  heading: string
  body: string
  ctaLabel: string
  ctaUrl: string
  valueBullets?: string[]
}

export interface LeadMagnet {
  slug: string
  /** Short internal label for dashboards / analytics. */
  label: string
  capture: LeadMagnetCapture
  /** Present only for `gate` magnets. */
  unlockEmail?: LeadMagnetUnlockCopy
  /**
   * Gate magnets with a personal report page at /go/{slug}/r/{report_token}.
   * When true, the unlock email CTA and the inline unlocked state both link
   * the tokenized report (the printable deliverable).
   */
  hasReport?: boolean
  /**
   * Post-capture nurture copy (sent by the lead-nurture cron, deduped via
   * email_dedupes). d2 = day-2 value email, d5 = day-5 signup push. Both are
   * marketing emails and carry the unsubscribe link; the unlock email does
   * not. Copy is segmented per magnet.
   */
  nurture?: { d2: LeadMagnetUnlockCopy; d5?: LeadMagnetUnlockCopy }
}

export const LEAD_MAGNETS: Record<string, LeadMagnet> = {
  'failure-mode': {
    slug: 'failure-mode',
    label: 'Product-sense failure mode',
    capture: 'gate',
    unlockEmail: {
      subject: 'Your product-sense failure mode, unlocked',
      eyebrow: 'Your result',
      heading: 'Here is the full read on your product thinking.',
      body: 'You saw the headline. This is the rest: your competency profile across all six dimensions, how you stack up, and the three reps that close your weakest move first.',
      ctaLabel: 'See your full profile',
      ctaUrl: '/go/failure-mode',
      valueBullets: [
        'Your six-competency profile, not just the one-line read',
        'The exact move you skip under interview pressure',
        'Three reps that fix it, in order',
      ],
    },
  },
  'ai-pm-readiness': {
    slug: 'ai-pm-readiness',
    label: 'AI product-sense readiness',
    capture: 'gate',
    unlockEmail: {
      subject: 'Your 2026 AI product-sense gap report',
      eyebrow: 'Your readiness',
      heading: 'Where you stand on the round that now decides AI-PM offers.',
      body: 'The score was the surface. Inside: your gap on each of the five dimensions an AI product-sense round tests, with the model-layer versus app-layer breakdown most candidates miss.',
      ctaLabel: 'Open your gap report',
      ctaUrl: '/go/ai-pm-readiness',
      valueBullets: [
        'A per-dimension read, not a single band',
        'The model-layer vs app-layer distinction that separates passes from rejects',
        'A safety-woven answer template you can reuse',
      ],
    },
  },
  'answer-fix': {
    slug: 'answer-fix',
    label: 'Answer repair',
    capture: 'gate',
    unlockEmail: {
      subject: 'Your interview-answer structure, ready to print',
      eyebrow: 'Your toolkit',
      heading: 'The four-move structure that turns rambling into a hire.',
      body: 'You watched one answer get rebuilt. This is the reusable version: the move-by-move structure plus the three reasoning templates strong candidates run without thinking.',
      ctaLabel: 'Get the structure',
      ctaUrl: '/go/answer-fix',
      valueBullets: [
        'The printable four-move answer structure',
        'Three reasoning templates for the hardest moments',
        'Before-and-after examples you can study',
      ],
    },
  },
  'ai-pm-questions': {
    slug: 'ai-pm-questions',
    label: 'AI-PM question bank',
    capture: 'gate',
    unlockEmail: {
      subject: 'The full AI-PM question set, with what each one tests',
      eyebrow: 'Your question bank',
      heading: 'The questions exposing unready candidates, all of them.',
      body: 'You saw the first ten. Here is the full set, each tagged with the reasoning move it tests, plus the answer skeletons and rubrics interviewers actually score against.',
      ctaLabel: 'Open the full set',
      ctaUrl: '/go/ai-pm-questions',
      valueBullets: [
        'Every question, ranked by rejection risk',
        'The hidden evaluation signal behind each one',
        'Answer skeletons and the rubric they are scored on',
      ],
    },
  },
  'spot-the-flaw': {
    slug: 'spot-the-flaw',
    label: 'Spot the flaw',
    capture: 'gate',
    unlockEmail: {
      subject: 'The rejection-reason taxonomy, unlocked',
      eyebrow: 'Your set',
      heading: 'Train the eye interviewers use to reject answers.',
      body: 'One was a warm-up. Here is the full flaw-spotting set and the taxonomy of rejection reasons, so you can catch the flaw in your own answers before someone else does.',
      ctaLabel: 'Open the full set',
      ctaUrl: '/go/spot-the-flaw',
      valueBullets: [
        'Ten answers to dissect, not one',
        'The full taxonomy of why answers get rejected',
        'The strong-answer move for each flaw',
      ],
    },
  },
  salary: {
    slug: 'salary',
    label: 'Comp + negotiation',
    capture: 'gate',
    unlockEmail: {
      subject: 'Your negotiation playbook is ready',
      eyebrow: 'Your playbook',
      heading: 'The band was step one. This is how you move it.',
      body: 'You have the market band. Now the part that changes the number: a one-page negotiation script, a counter-offer template, and the four questions that tell you whether to push.',
      ctaLabel: 'Get the playbook',
      ctaUrl: '/go/salary',
      valueBullets: [
        'A one-page negotiation script',
        'A counter-offer template you can adapt',
        'The four-question "should I push" framework',
      ],
    },
  },
  switch: {
    slug: 'switch',
    label: 'Engineer to PM',
    capture: 'gate',
    unlockEmail: {
      subject: 'Your engineer-to-PM transition plan',
      eyebrow: 'Your plan',
      heading: 'The stories that transfer, and the ones to rebuild.',
      body: 'You saw the gaps. Here is the fix: one of your engineering stories reframed into product language, a 30-day transition plan, and the five stories you need ready before the first screen.',
      ctaLabel: 'Open your plan',
      ctaUrl: '/go/switch',
      valueBullets: [
        'One story reframed into customer, tradeoff, metric, judgment',
        'A 30-day transition plan',
        'The five stories every PM screen expects',
      ],
    },
  },
  // SIGNUP-mode magnets — surface value then straight to account creation.
  teardown: {
    slug: 'teardown',
    label: 'Product teardown',
    capture: 'signup',
  },
  'analyst-instinct': {
    slug: 'analyst-instinct',
    label: 'Live AI analyst',
    capture: 'signup',
  },
  mock: {
    slug: 'mock',
    label: 'Grade my answer',
    capture: 'signup',
  },
}

export const LEAD_MAGNET_SLUGS = Object.keys(LEAD_MAGNETS)

export function getLeadMagnet(slug: string): LeadMagnet | undefined {
  return LEAD_MAGNETS[slug]
}

// The single line of breadth copy threaded onto every page (the "one connected
// gym" positioning). Claim matches disciplines.ts + V3FeatureGrid real/active
// surfaces — deliberately excludes coming-soon items.
export const BREADTH_DISCIPLINES = [
  'Product sense',
  'System design',
  'SQL',
  'Coding',
  'Data modeling',
  'Live interviews',
  'Live AI analyst',
] as const

export const BREADTH_HEADLINE = 'Everything you practice in one place.'
export const BREADTH_SUBLINE =
  'One connected gym for product sense, system design, SQL, coding, data modeling, live interviews, and a live AI analyst.'
