import { VALID_ONBOARDING_ROLES } from '@/lib/onboarding/calibration-submit'

// Per-role "first rep" for the value-first onboarding path (onboarding_value_first
// flag). Each slug below was verified against the live `challenges` table:
// challenge_type = 'flow', is_published = true, and relevant_roles containing
// the mapped role (difficulty 'easy' where available — HackProduct's beginner
// tier for FLOW challenges; see difficultyLabel / expandDifficultiesForQuery).
//
// pm and data_scientist have no dedicated easy-tier challenge yet, so they
// fall back to the shared easy default (relevant_roles includes swe/em/tech_lead/pm,
// 5-minute estimate) rather than reaching for a harder challenge on a first rep.
//
// Do NOT invent slugs here — if a role's challenge is ever unpublished or
// renamed, getCuratedFirstRep degrades to DEFAULT_FIRST_REP_SLUG rather than
// throwing, and the workspace route itself 404s safely if a slug goes stale.
type OnboardingRole = (typeof VALID_ONBOARDING_ROLES)[number]

export const DEFAULT_FIRST_REP_SLUG = 'template-gallery-launch'

const ROLE_TO_FIRST_REP_SLUG: Record<OnboardingRole, string> = {
  swe: 'your-ai-agent-booked-the-wrong-meeting',
  ml_eng: 'your-ml-model-is-95-accurate-but-users-hate-it',
  data_eng: 'how-do-you-know-if-your-ai-native-product-is-working',
  devops: 'the-4-minute-deploy-nobody-uses',
  em: 'new-feature-vs-tech-debt-allocating-next-quarter',
  founding_eng: 'how-much-autonomy-should-your-ai-agent-have',
  tech_lead: 'hp-google-youtube-watch-time-drop',
  pm: DEFAULT_FIRST_REP_SLUG,
  designer: 'the-onboarding-vs-retention-paradox',
  data_scientist: DEFAULT_FIRST_REP_SLUG,
}

export function getCuratedFirstRepSlug(role: string | null | undefined): string {
  if (role && role in ROLE_TO_FIRST_REP_SLUG) {
    return ROLE_TO_FIRST_REP_SLUG[role as OnboardingRole]
  }
  return DEFAULT_FIRST_REP_SLUG
}

/** `/challenges` is the safe catch-all if a curated slug ever fails to resolve at runtime. */
export const FIRST_REP_FALLBACK_HREF = '/challenges'
