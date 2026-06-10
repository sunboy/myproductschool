// Lever postings provider (Tier 2).
// GET https://api.lever.co/v0/postings/{slug}?mode=json
//   → [].{ id, text, hostedUrl, categories.location }
// Mirrors career-ops' providers/lever.mjs exactly.

import type { AtsProvider } from './context'
import type { RawListing } from '../types'

interface LeverPosting {
  id: string
  text: string
  hostedUrl: string
  createdAt?: number
  categories?: { location?: string; team?: string } | null
}

export const leverProvider: AtsProvider = {
  id: 'lever',
  async fetch(company, ctx): Promise<RawListing[]> {
    const url = `https://api.lever.co/v0/postings/${company.slug}?mode=json`
    const data = await ctx.fetchJson<LeverPosting[]>(url)
    const postings = Array.isArray(data) ? data : []
    return postings
      .filter((p) => p?.text && p?.hostedUrl)
      .map((p) => ({
        external_id: `lever:${company.slug}:${p.id}`,
        title: p.text,
        url: p.hostedUrl,
        company: company.name,
        location: p.categories?.location ?? null,
        department: p.categories?.team ?? null,
        posted_at: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      }))
  },
}
