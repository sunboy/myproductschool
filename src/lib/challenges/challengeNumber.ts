import type { ChallengeType } from '@/lib/types'

/**
 * Per-type catalog number presentation.
 *
 * Each challenge carries a stable `display_number` assigned by the DB
 * (see migration `*_challenge_display_numbers.sql`). The integer is banded by
 * type in thousands ranges (algorithm 1xxx, sql 2xxx, flow 3xxx, …) so the
 * band is globally unique. This module only maps the type to a human prefix
 * and formats the label / URL slug — the band offsets live in SQL.
 */

const CHALLENGE_NUMBER_PREFIX: Record<ChallengeType, string> = {
  algorithm: 'ALGO',
  sql: 'SQL',
  flow: 'PS',
  freeform: 'PS',
  quick_take: 'QT',
  system_design: 'SD',
  data_modeling: 'DM',
  claude_code_analytics: 'CCA',
}

/** ("flow", 3001) -> "PS-3001". Null when inputs are missing so callers can conditionally render. */
export function formatChallengeNumber(
  challengeType: ChallengeType | string | null | undefined,
  displayNumber: number | null | undefined,
): string | null {
  if (displayNumber == null || !Number.isFinite(displayNumber)) return null
  const prefix = CHALLENGE_NUMBER_PREFIX[challengeType as ChallengeType] ?? 'CH'
  return `${prefix}-${displayNumber}`
}

/** URL-safe lowercase form of the catalog number, usable as a slug. ("flow", 3001) -> "ps-3001". */
export function challengeNumberSlug(
  challengeType: ChallengeType | string | null | undefined,
  displayNumber: number | null | undefined,
): string | null {
  const label = formatChallengeNumber(challengeType, displayNumber)
  return label ? label.toLowerCase() : null
}

/** Pattern a route param must match to be treated as a number slug (e.g. "sql-2001"). */
export const CHALLENGE_NUMBER_SLUG_RE = /^(?:algo|sql|ps|qt|sd|dm|cca)-(\d{4,})$/i

/** Extract the integer band number from a number slug. "sql-2001" -> 2001; null if it doesn't match. */
export function parseChallengeNumberSlug(rawId: string): number | null {
  const match = rawId.trim().match(CHALLENGE_NUMBER_SLUG_RE)
  if (!match) return null
  const n = Number.parseInt(match[1], 10)
  return Number.isFinite(n) ? n : null
}

interface ChallengePathInput {
  challenge_type?: ChallengeType | string | null
  display_number?: number | null
  slug?: string | null
  id: string
}

/**
 * The single builder for challenge workspace links. The fallback order below
 * is the one control over what the address bar shows app-wide:
 *   `slug ?? numberSlug ?? id`  -> prefer the text slug (/workspace/challenges/two-sum-variant)
 *   `numberSlug ?? slug ?? id`  -> prefer the number  (/workspace/challenges/sql-2001)
 * Both forms always resolve (the resolver accepts number, slug, and id), so
 * flipping this never breaks a link.
 *
 * We prefer the TEXT slug: it's the human-readable, SEO-descriptive canonical
 * URL, and the workspace route 301-redirects every other form (id, number slug)
 * onto it — so emitting the text slug here avoids a redirect hop on navigation.
 * The number slug stays a valid alias and lives on as the catalog badge.
 */
export function challengePath(c: ChallengePathInput): string {
  const numberSlug = challengeNumberSlug(c.challenge_type, c.display_number)
  return `/workspace/challenges/${c.slug ?? numberSlug ?? c.id}`
}
