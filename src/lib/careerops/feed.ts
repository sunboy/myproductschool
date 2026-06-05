// Stage-A deterministic feed ranking — zero AI cost.
//
// Scores active `job_listings` against the user's `career_profiles` by keyword
// overlap (target role, skills, seniority, location). Produces `match_rank` in
// 0..1 and returns listings sorted best-first. The AI scorer (Stage B) only runs
// over the top of THIS ranking, so a good cheap sort keeps token spend on-target.

import { createHash } from 'crypto'
import type { CareerProfile, JobListing, FeedEntry } from './types'
import { SENIORITY_KEYWORDS } from './filters'

function tokenize(text: string | null | undefined): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values))
}

function overlapCount(a: Set<string>, b: string[]): number {
  let n = 0
  for (const t of b) if (a.has(t)) n++
  return n
}

// A stable hash of the profile inputs that affect scoring. Used to invalidate the
// per-(user,listing) score cache only when the profile actually changes.
export function profileFingerprint(profile: CareerProfile): string {
  const payload = JSON.stringify({
    role: profile.target_role ?? '',
    seniority: profile.seniority ?? '',
    skills: (profile.key_skills ?? []).map((s) => s.toLowerCase()).sort(),
    locations: (profile.locations ?? []).map((s) => s.toLowerCase()).sort(),
  })
  return createHash('sha1').update(payload).digest('hex').slice(0, 16)
}

interface RankWeights {
  role: number
  skills: number
  seniority: number
  location: number
}

const WEIGHTS: RankWeights = { role: 0.4, skills: 0.4, seniority: 0.1, location: 0.1 }

export function scoreListingMatch(profile: CareerProfile, listing: JobListing): number {
  const titleTokens = tokenize(listing.role_title)
  const titleSet = new Set(titleTokens)
  const haystack = new Set([...titleTokens, ...tokenize(listing.description)])

  // Role overlap: how many target-role words appear in the title.
  const roleTokens = uniq(tokenize(profile.target_role))
  const roleScore = roleTokens.length ? overlapCount(titleSet, roleTokens) / roleTokens.length : 0

  // Skill overlap: fraction of the user's skills mentioned anywhere in the listing.
  const skillTokens = uniq((profile.key_skills ?? []).flatMap(tokenize))
  const skillScore = skillTokens.length ? overlapCount(haystack, skillTokens) / skillTokens.length : 0

  // Seniority: does the title's seniority signal match the user's stated level?
  const wantedSeniority = tokenize(profile.seniority).find((t) => SENIORITY_KEYWORDS.includes(t))
  const seniorityScore = wantedSeniority
    ? titleSet.has(wantedSeniority)
      ? 1
      : SENIORITY_KEYWORDS.some((kw) => titleSet.has(kw))
        ? 0.3
        : 0
    : 0.5

  // Location: does the listing location intersect the user's preferred locations?
  const locTokens = tokenize(listing.location)
  const locSet = new Set(locTokens)
  const wanted = uniq((profile.locations ?? []).flatMap(tokenize))
  const isRemote = locSet.has('remote')
  const locationScore = wanted.length === 0
    ? 0.5
    : isRemote || overlapCount(locSet, wanted) > 0
      ? 1
      : 0

  return (
    WEIGHTS.role * roleScore +
    WEIGHTS.skills * skillScore +
    WEIGHTS.seniority * seniorityScore +
    WEIGHTS.location * locationScore
  )
}

// Rank active listings for a profile and return the top `limit` as FeedEntry
// shells (without AI scores; Stage B fills those in).
export function rankListings(
  profile: CareerProfile,
  listings: JobListing[],
  limit = 25,
): FeedEntry[] {
  return listings
    .filter((l) => l.is_active)
    .map((l) => ({ ...l, match_rank: scoreListingMatch(profile, l) }))
    .sort((a, b) => b.match_rank - a.match_rank)
    .slice(0, limit)
}
