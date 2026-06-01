#!/usr/bin/env npx tsx
/**
 * Prepare per-guide briefs for converting scraped chillinterview system-design
 * guides into HackProduct system_design canvas challenges.
 *
 * Reads seeds/chillinterview/system-design.json and writes
 * seeds/chillinterview/sd-briefs.json — one brief per guide, with the source
 * preview as raw material (rewritten by the authoring sub-agents, not copied).
 *
 * Usage: npx tsx scripts/prep-system-design-briefs.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { resolveCompanies, kebab } from './lib/chillinterview-map'

const IN = path.join(process.cwd(), 'seeds', 'chillinterview', 'system-design.json')
const OUT = path.join(process.cwd(), 'seeds', 'chillinterview', 'sd-briefs.json')

interface SdRow {
  id: string
  source_url: string
  data: {
    title?: string
    topic?: string
    topics?: string[]
    askedByCompanies?: string[]
    level?: string
    difficulty?: number | string
    whyThisMatters?: string
    previewMarkdown?: string
  }
}

// chillinterview difficulty is a 1-10 int; map to easy/medium/hard.
function mapDifficulty(d: number | string | undefined): string {
  const n = typeof d === 'number' ? d : parseInt(String(d ?? ''), 10)
  if (Number.isNaN(n)) return 'medium'
  if (n <= 3) return 'easy'
  if (n <= 6) return 'medium'
  return 'hard'
}

function main() {
  if (!fs.existsSync(IN)) {
    console.error(`Missing ${path.relative(process.cwd(), IN)}. Run scrape-chillinterview.ts --type system-design first.`)
    process.exit(1)
  }
  const rows = JSON.parse(fs.readFileSync(IN, 'utf-8')) as SdRow[]
  const briefs = rows
    .filter((r) => r.data.title && r.data.previewMarkdown)
    .map((r, idx) => {
      const companies = resolveCompanies(r.data.askedByCompanies ?? [])
      return {
        idx,
        key: `chillinterview:sd:${kebab(r.data.title!)}`,
        title: r.data.title,
        difficulty: mapDifficulty(r.data.difficulty),
        topic: r.data.topic ?? null,
        topics: r.data.topics ?? [],
        company_tags: companies.filter((c) => c.known).map((c) => c.slug),
        company_tags_unknown: companies.filter((c) => !c.known).map((c) => c.slug),
        source_url: r.source_url,
        why_this_matters: r.data.whyThisMatters ?? '',
        source_preview: r.data.previewMarkdown ?? '',
      }
    })
  fs.writeFileSync(OUT, JSON.stringify(briefs, null, 2))
  console.log(`Wrote ${briefs.length} SD briefs → ${path.relative(process.cwd(), OUT)}`)
  console.log('titles:', briefs.map((b) => b.title).join(' | '))
}

main()
