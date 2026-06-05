// Ashby job-board provider (Tier 2).
// GET https://api.ashbyhq.com/posting-api/job-board/{slug}
//   → jobs[].{ id, title, jobUrl, location }
// Mirrors career-ops' providers/ashby.mjs exactly.

import type { AtsProvider } from './context'
import type { RawListing } from '../types'

interface AshbyJob {
  id?: string
  title: string
  jobUrl: string
  location?: string | null
  department?: string | null
  publishedAt?: string | null
}

export const ashbyProvider: AtsProvider = {
  id: 'ashby',
  async fetch(company, ctx): Promise<RawListing[]> {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${company.slug}?includeCompensation=true`
    const data = await ctx.fetchJson<{ jobs?: AshbyJob[] }>(url)
    const jobs = data?.jobs ?? []
    return jobs
      .filter((j) => j?.title && j?.jobUrl)
      .map((j) => ({
        external_id: `ashby:${company.slug}:${j.id ?? j.jobUrl}`,
        title: j.title,
        url: j.jobUrl,
        company: company.name,
        location: j.location ?? null,
        department: j.department ?? null,
        posted_at: j.publishedAt ?? null,
      }))
  },
}
