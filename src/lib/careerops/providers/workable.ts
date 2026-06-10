// Workable provider (Tier 2, optional).
// GET https://apply.workable.com/{slug}/jobs.md — a markdown table, not JSON.
// Mirrors career-ops' providers/workable.mjs: columns Title | Department |
// Location | Type | Salary | Posted | Details, where Details holds a [View](url).

import type { AtsProvider } from './context'
import type { RawListing } from '../types'

function parseMarkdownTable(md: string): string[][] {
  const rows: string[][] = []
  for (const line of md.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    // Skip the header separator row (|---|---|).
    if (/^\|[\s:|-]+\|$/.test(trimmed)) continue
    const cols = trimmed.slice(1, -1).split('|').map((c) => c.trim())
    rows.push(cols)
  }
  return rows
}

function extractLink(cell: string): string | null {
  const match = cell.match(/\((https?:\/\/[^)]+)\)/)
  return match ? match[1] : null
}

export const workableProvider: AtsProvider = {
  id: 'workable',
  async fetch(company, ctx): Promise<RawListing[]> {
    const url = `https://apply.workable.com/${company.slug}/jobs.md`
    const text = await ctx.fetchText(url)
    if (!text) return []

    const rows = parseMarkdownTable(text)
    const listings: RawListing[] = []
    let index = 0
    for (const cols of rows) {
      const title = cols[0]?.replace(/[[\]]/g, '').trim()
      if (!title || title.toLowerCase() === 'title') continue
      const detailsCell = cols[cols.length - 1] ?? ''
      const link = extractLink(detailsCell) ?? extractLink(cols[0] ?? '')
      if (!link) continue
      listings.push({
        external_id: `workable:${company.slug}:${index++}:${title}`,
        title,
        url: link,
        company: company.name,
        location: cols[2] ?? null,
        department: cols[1] ?? null,
        posted_at: null,
      })
    }
    return listings
  },
}
