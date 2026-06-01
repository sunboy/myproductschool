// Centralized URL builders for Hatch-recommended content. Hatch replies must
// contain real, clickable paths drawn ONLY from these helpers — the model never
// constructs a route itself. Every path here is verified against the live route
// tree:
//   - Challenge start lives under (workspace)/workspace/challenges/[id]
//   - Quick-takes are NOT playable in the workspace (that route redirects them
//     to /challenges); they are taken inline on the dashboard Quick Take card.
//   - Feedback / discussion live under (app)/challenges/[id]/*
//   - Practice browse filters live on /challenges via ?discipline / ?topic / ?technique
//   - Study plans live under /prep/study-plans/[slug]
//   - Learn modules live under /explore/modules/[slug]

import { challengeNumberSlug } from '@/lib/challenges/challengeNumber'

interface ChallengeRef {
  id: string
  slug?: string | null
  challenge_type?: string | null
  display_number?: number | null
}

/**
 * Where a learner goes to *attempt* a challenge. This is the single control
 * point for the visible workspace URL — the fallback order below decides
 * whether the address bar shows the catalog number (sql-2001) or the text
 * slug. Both forms resolve (see resolveChallengeIdentity), so the order is
 * purely a presentation choice.
 *
 * Quick-takes are an exception: the workspace route redirects `quick_take`
 * challenges to `/challenges`, because they're answered inline on the dashboard
 * card, not in the full workspace. For a quick-take we point at the dashboard
 * Quick Take card anchor so the link actually lands somewhere usable.
 */
export function urlForChallenge(c: ChallengeRef): string {
  if (c.challenge_type === 'quick_take') return '/dashboard#quick-take'
  const numberSlug = challengeNumberSlug(c.challenge_type, c.display_number)
  return `/workspace/challenges/${numberSlug ?? c.slug ?? c.id}`
}

/** Where a learner reviews Hatch's feedback on a finished challenge. */
export function urlForChallengeFeedback(c: ChallengeRef): string {
  return `/challenges/${c.slug ?? c.id}/feedback`
}

/** Practice hub filtered to a topic, optionally scoped to a discipline. */
export function urlForTopic(slug: string, discipline?: string | null): string {
  const params = new URLSearchParams()
  if (discipline && discipline !== 'all') params.set('discipline', discipline)
  params.set('topic', slug)
  return `/challenges?${params.toString()}`
}

/** Practice hub filtered to a technique. */
export function urlForTechnique(slug: string): string {
  return `/challenges?technique=${encodeURIComponent(slug)}`
}

/** Study plan detail page. */
export function urlForStudyPlan(slug: string): string {
  return `/prep/study-plans/${slug}`
}

/** Learn module detail page. */
export function urlForModule(slug: string): string {
  return `/explore/modules/${slug}`
}
