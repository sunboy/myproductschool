// Tier 1 (JSearch breadth) query set, mirroring career-ops' search-query list.
//
// JSearch is metered/paid, so we never crawl the whole index. We run a finite,
// on-target set of role/skill queries; each query fetches a bounded number of
// pages. The ingestion run also enforces a hard request ceiling
// (CAREEROPS_JSEARCH_MAX_REQUESTS) on top of this list.

export interface JSearchQuery {
  query: string
  country: string
  // How recent: 'all' | 'today' | '3days' | 'week' | 'month'
  date_posted?: 'all' | 'today' | '3days' | 'week' | 'month'
}

export const JSEARCH_QUERIES: JSearchQuery[] = [
  { query: 'AI engineer', country: 'us', date_posted: 'week' },
  { query: 'machine learning engineer', country: 'us', date_posted: 'week' },
  { query: 'staff software engineer', country: 'us', date_posted: 'week' },
  { query: 'senior backend engineer', country: 'us', date_posted: 'week' },
  { query: 'platform engineer', country: 'us', date_posted: 'week' },
  { query: 'founding engineer', country: 'us', date_posted: 'week' },
  { query: 'engineering manager', country: 'us', date_posted: 'week' },
  { query: 'technical product manager', country: 'us', date_posted: 'week' },
  { query: 'forward deployed engineer', country: 'us', date_posted: 'week' },
  { query: 'infrastructure engineer remote', country: 'us', date_posted: 'week' },
]

// Pages to pull per query (JSearch returns ~10 results/page). Kept small to bound
// paid-API spend; the per-run ceiling can cut this list short.
export const JSEARCH_NUM_PAGES = 1
