// Greenhouse board provider (Tier 2).
// GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
//   → jobs[].{ id, title, absolute_url, location.name }
// Mirrors career-ops' providers/greenhouse.mjs exactly.

import type { AtsProvider } from './context'
import type { RawListing } from '../types'

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location?: { name?: string } | null
  updated_at?: string
  departments?: Array<{ name?: string }>
}

export const greenhouseProvider: AtsProvider = {
  id: 'greenhouse',
  async fetch(company, ctx): Promise<RawListing[]> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=false`
    const data = await ctx.fetchJson<{ jobs?: GreenhouseJob[] }>(url)
    const jobs = data?.jobs ?? []
    return jobs
      .filter((j) => j?.title && j?.absolute_url)
      .map((j) => ({
        external_id: `greenhouse:${company.slug}:${j.id}`,
        title: j.title,
        url: j.absolute_url,
        company: company.name,
        location: j.location?.name ?? null,
        department: j.departments?.[0]?.name ?? null,
        posted_at: j.updated_at ?? null,
      }))
  },
}
