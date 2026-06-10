// Baseline relevance filter, ported from career-ops' portals.yml semantics.
//
// Applied to BOTH sourcing tiers (JSearch + ATS) before a listing is written to
// `job_listings`. This is a coarse "is this an engineering/PM-relevant role"
// gate, not the per-user ranking (that lives in feed.ts). Keep it permissive:
// the deterministic ranker + AI scorer do the fine sorting downstream.

import type { RawListing } from './types'

// ≥1 must match for the title to pass. Biased to engineering, then PM.
const TITLE_POSITIVE = [
  'engineer', 'engineering', 'developer', 'swe', 'sde',
  'ai', 'ml', 'machine learning', 'llm', 'genai', 'nlp', 'mlops', 'data',
  'platform', 'infrastructure', 'backend', 'frontend', 'full stack', 'fullstack',
  'devops', 'sre', 'reliability', 'security', 'cloud',
  'architect', 'forward deployed', 'solutions',
  'product manager', 'technical product', 'product management',
  'staff', 'principal', 'tech lead', 'engineering manager',
]

// 0 must match. Filters out roles outside our audience.
const TITLE_NEGATIVE = [
  'intern', 'internship', 'apprentice', 'working student',
  'sales', 'account executive', 'recruiter', 'marketing', 'designer',
  'customer success', 'support agent', 'accountant', 'attorney', 'paralegal',
  'nurse', 'driver', 'warehouse', 'technician', 'mainframe', 'cobol',
]

// Optional relevance boost (does not gate; used by the ranker if desired).
export const SENIORITY_KEYWORDS = ['senior', 'staff', 'principal', 'lead', 'director']

export interface LocationFilter {
  allow?: string[]
  block?: string[]
  always_allow?: string[]
}

// Default location stance mirrors career-ops: US + Remote, block a few regions.
export const DEFAULT_LOCATION_FILTER: LocationFilter = {
  always_allow: ['remote'],
  block: [],
  allow: [],
}

function lc(s: string | null | undefined): string {
  return (s ?? '').toLowerCase()
}

export function titlePasses(title: string): boolean {
  const t = lc(title)
  if (!t) return false
  if (TITLE_NEGATIVE.some((kw) => t.includes(kw))) return false
  return TITLE_POSITIVE.some((kw) => t.includes(kw))
}

// Semantics applied in order (career-ops): empty → pass; always_allow → pass;
// block → reject; allow non-empty → must match ≥1.
export function locationPasses(location: string | null, filter: LocationFilter = DEFAULT_LOCATION_FILTER): boolean {
  const loc = lc(location)
  if (!loc) return true
  if ((filter.always_allow ?? []).some((kw) => loc.includes(kw.toLowerCase()))) return true
  if ((filter.block ?? []).some((kw) => loc.includes(kw.toLowerCase()))) return false
  const allow = filter.allow ?? []
  if (allow.length === 0) return true
  return allow.some((kw) => loc.includes(kw.toLowerCase()))
}

export function hasSenioritySignal(title: string): boolean {
  const t = lc(title)
  return SENIORITY_KEYWORDS.some((kw) => t.includes(kw))
}

// The single gate the ingestion layer calls per raw listing.
export function passesBaselineFilter(
  listing: RawListing,
  locationFilter: LocationFilter = DEFAULT_LOCATION_FILTER,
): boolean {
  return titlePasses(listing.title) && locationPasses(listing.location ?? null, locationFilter)
}
