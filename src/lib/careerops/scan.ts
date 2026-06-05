// Ingestion orchestration — shared by the cron route and the local script.
//
// Runs Tier 1 (JSearch over the bounded query set) then Tier 2 (curated companies
// × ATS providers), applies the baseline filter, dedups, and upserts into
// `job_listings`. Listings not seen this run (per provider) are marked inactive.

import type { SupabaseClient } from '@supabase/supabase-js'
import { createProviderContext } from './providers'
import { ATS_PROVIDERS } from './providers'
import { searchJSearch, jsearchConfigured } from './providers/jsearch'
import { CURATED_COMPANIES } from './companies'
import { JSEARCH_QUERIES, JSEARCH_NUM_PAGES } from './queries'
import { passesBaselineFilter } from './filters'
import type { RawListing } from './types'

export interface ScanResult {
  fetched: number
  kept: number
  upserted: number
  deactivated: number
  jsearchRequests: number
  jsearchEnabled: boolean
  errors: string[]
}

function maxJSearchRequests(): number {
  const raw = Number(process.env.CAREEROPS_JSEARCH_MAX_REQUESTS)
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 20
}

function dedupe(listings: RawListing[]): RawListing[] {
  const seen = new Set<string>()
  const out: RawListing[] = []
  for (const l of listings) {
    if (seen.has(l.external_id)) continue
    seen.add(l.external_id)
    out.push(l)
  }
  return out
}

async function runJSearch(ctx: ReturnType<typeof createProviderContext>, result: ScanResult): Promise<RawListing[]> {
  if (!jsearchConfigured()) {
    result.jsearchEnabled = false
    return []
  }
  result.jsearchEnabled = true
  const budget = maxJSearchRequests()
  const out: RawListing[] = []
  for (const q of JSEARCH_QUERIES) {
    if (result.jsearchRequests >= budget) break
    const pages = Math.min(JSEARCH_NUM_PAGES, budget - result.jsearchRequests)
    try {
      const listings = await searchJSearch(q, ctx, pages)
      result.jsearchRequests += pages
      out.push(...listings)
    } catch (err) {
      result.errors.push(`jsearch:${q.query}: ${(err as Error).message}`)
    }
  }
  return out
}

async function runAts(ctx: ReturnType<typeof createProviderContext>, result: ScanResult): Promise<RawListing[]> {
  const out: RawListing[] = []
  for (const company of CURATED_COMPANIES) {
    const provider = ATS_PROVIDERS[company.provider]
    if (!provider) continue
    try {
      const listings = await provider.fetch(company, ctx)
      out.push(...listings)
    } catch (err) {
      result.errors.push(`${company.provider}:${company.slug}: ${(err as Error).message}`)
    }
  }
  return out
}

export async function runCareerOpsScan(admin: SupabaseClient): Promise<ScanResult> {
  const result: ScanResult = {
    fetched: 0,
    kept: 0,
    upserted: 0,
    deactivated: 0,
    jsearchRequests: 0,
    jsearchEnabled: false,
    errors: [],
  }

  const ctx = createProviderContext()
  const runStartedAt = new Date().toISOString()

  const raw = dedupe([...(await runJSearch(ctx, result)), ...(await runAts(ctx, result))])
  result.fetched = raw.length

  const kept = raw.filter((l) => passesBaselineFilter(l))
  result.kept = kept.length

  if (kept.length === 0) return result

  // Upsert each kept listing. provider is derived from the external_id prefix.
  const rows = kept.map((l) => ({
    provider: l.external_id.split(':')[0],
    external_id: l.external_id,
    company: l.company,
    role_title: l.title,
    location: l.location,
    url: l.url,
    department: l.department ?? null,
    description: l.description ?? null,
    posted_at: l.posted_at ?? null,
    is_active: true,
    last_seen_at: runStartedAt,
    raw: l as unknown as Record<string, unknown>,
  }))

  const { error: upsertError, count } = await admin
    .from('job_listings')
    .upsert(rows, { onConflict: 'provider,external_id', count: 'exact' })
  if (upsertError) {
    result.errors.push(`upsert: ${upsertError.message}`)
    return result
  }
  result.upserted = count ?? rows.length

  // Mark stale: anything active not seen in this run.
  const { error: staleError, count: staleCount } = await admin
    .from('job_listings')
    .update({ is_active: false }, { count: 'exact' })
    .lt('last_seen_at', runStartedAt)
    .eq('is_active', true)
  if (staleError) {
    result.errors.push(`deactivate: ${staleError.message}`)
  } else {
    result.deactivated = staleCount ?? 0
  }

  return result
}
