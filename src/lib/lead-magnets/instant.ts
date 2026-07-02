// Instant-mode (/go/{slug}/i) config for the 6 enabled lead magnets.
//
// Each magnet gets a hook that frames the story-player experience for
// Instagram/TikTok ad traffic: short headline, punchy sub, single CTA.
// No em dashes. No AI slop. Sentences where sentences appear; fragments
// only for labels and UI chrome.
//
// Import-safe on both server and client: pure data, no server-only deps.

export interface InstantHook {
  /** Short label above the headline, e.g. "90 seconds". */
  eyebrow: string
  /** Big display headline. Max ~8 words. */
  headline: string
  /** One short sentence. Value before the ask. */
  sub: string
  /** Single CTA that starts the quiz. */
  cta: string
}

export const INSTANT_HOOKS: Record<string, InstantHook> = {
  'failure-mode': {
    eyebrow: '4 questions',
    headline: 'Find the mistake that gets engineers rejected',
    sub: '4 taps. 90 seconds. No signup to see your result.',
    cta: 'Find my failure mode',
  },
  'ai-pm-readiness': {
    eyebrow: '5 questions',
    headline: 'Would you pass the 2026 AI product round?',
    sub: '5 scenarios. Your readiness band, free. No email required.',
    cta: 'Check my readiness',
  },
  'spot-the-flaw': {
    eyebrow: '3 questions',
    headline: 'Spot why this answer got rejected',
    sub: 'Real answers, real rejection reasons. Takes 60 seconds.',
    cta: 'Spot the flaw',
  },
  switch: {
    eyebrow: '5 questions',
    headline: 'Will your best story survive a PM screen?',
    sub: 'Audit your stories in 5 questions. See the gap before the interview does.',
    cta: 'Audit my stories',
  },
  salary: {
    eyebrow: '2 questions',
    headline: 'Should you push your offer?',
    sub: 'Two inputs. One clear signal. No guesswork.',
    cta: 'Check my offer',
  },
  teardown: {
    eyebrow: '2 decisions',
    headline: 'Call a real product decision',
    sub: 'Two real calls, graded the way interviewers grade them.',
    cta: 'Make the call',
  },
}

/** The 6 slugs enabled for the instant player. */
export const INSTANT_SLUGS: string[] = Object.keys(INSTANT_HOOKS)
