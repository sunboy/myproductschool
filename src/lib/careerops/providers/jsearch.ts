// JSearch (RapidAPI) provider (Tier 1, whole-market breadth).
//
// Indexes Google-for-Jobs (LinkedIn / Indeed / Glassdoor / company sites), so the
// pool is "any job posting." Metered/paid, so it is ONLY called by the scheduled
// scan over a bounded query set — never live per page view. No-ops without a key.
//
// GET https://jsearch.p.rapidapi.com/search?query={q}&country={c}&page={n}&num_pages={k}&date_posted={d}
//   headers: x-rapidapi-key, x-rapidapi-host
//   → data[].{ job_id, job_title, employer_name, job_city/job_state/job_country,
//              job_is_remote, job_apply_link, job_description, job_posted_at_datetime_utc }

import type { ProviderContext } from './context'
import type { RawListing } from '../types'
import type { JSearchQuery } from '../queries'

const HOST = process.env.JSEARCH_RAPIDAPI_HOST || 'jsearch.p.rapidapi.com'

export function jsearchConfigured(): boolean {
  return Boolean(process.env.JSEARCH_RAPIDAPI_KEY)
}

function headers(): Record<string, string> {
  return {
    'x-rapidapi-key': process.env.JSEARCH_RAPIDAPI_KEY ?? '',
    'x-rapidapi-host': HOST,
  }
}

interface JSearchJob {
  job_id: string
  job_title: string
  employer_name?: string | null
  job_city?: string | null
  job_state?: string | null
  job_country?: string | null
  job_is_remote?: boolean | null
  job_apply_link?: string | null
  job_description?: string | null
  job_posted_at_datetime_utc?: string | null
  job_publisher?: string | null
}

function formatLocation(j: JSearchJob): string | null {
  if (j.job_is_remote) return 'Remote'
  const parts = [j.job_city, j.job_state, j.job_country].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

function mapJob(j: JSearchJob): RawListing | null {
  if (!j?.job_id || !j?.job_title || !j?.job_apply_link) return null
  return {
    external_id: `jsearch:${j.job_id}`,
    title: j.job_title,
    url: j.job_apply_link,
    company: j.employer_name ?? 'Unknown',
    location: formatLocation(j),
    description: j.job_description ?? null,
    department: null,
    posted_at: j.job_posted_at_datetime_utc ?? null,
  }
}

// One query → up to `numPages` pages of listings.
export async function searchJSearch(
  q: JSearchQuery,
  ctx: ProviderContext,
  numPages = 1,
): Promise<RawListing[]> {
  if (!jsearchConfigured()) return []
  const out: RawListing[] = []
  for (let page = 1; page <= numPages; page++) {
    const params = new URLSearchParams({
      query: q.query,
      country: q.country,
      page: String(page),
      num_pages: '1',
      date_posted: q.date_posted ?? 'all',
    })
    const url = `https://${HOST}/search?${params.toString()}`
    const data = await ctx.fetchJson<{ data?: JSearchJob[] }>(url, { headers: headers() })
    const jobs = data?.data ?? []
    for (const job of jobs) {
      const mapped = mapJob(job)
      if (mapped) out.push(mapped)
    }
    if (jobs.length === 0) break
  }
  return out
}

// On-demand full-description enrichment for a listing the user opens.
export async function fetchJSearchDetails(
  jobId: string,
  ctx: ProviderContext,
  country = 'us',
): Promise<{ description: string | null } | null> {
  if (!jsearchConfigured()) return null
  const params = new URLSearchParams({ job_id: jobId, country })
  const url = `https://${HOST}/job-details?${params.toString()}`
  const data = await ctx.fetchJson<{ data?: JSearchJob[] }>(url, { headers: headers() })
  const job = data?.data?.[0]
  if (!job) return null
  return { description: job.job_description ?? null }
}
