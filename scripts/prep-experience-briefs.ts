#!/usr/bin/env npx tsx
/**
 * Prepare briefs for the experience question-detection pass.
 *
 * Reads seeds/chillinterview/experiences.json and emits
 * seeds/chillinterview/exp-briefs.json — one brief per experience that carries
 * any text worth judging (a non-empty visible/detailsVisible). A pre-filter
 * drops experiences that obviously cannot name a question (no text at all),
 * keeping the sub-agent judgment pass focused.
 *
 * The sub-agent pass (its output assembled by build-experience-keepers.ts)
 * decides has_named_question + extracts the structured fields. We do NOT decide
 * that here; we only gather candidates and route an initial type hint.
 *
 * Usage: npx tsx scripts/prep-experience-briefs.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { resolveCompany, kebab } from './lib/chillinterview-map'

const IN = path.join(process.cwd(), 'seeds', 'chillinterview', 'experiences.json')
const OUT = path.join(process.cwd(), 'seeds', 'chillinterview', 'exp-briefs.json')

interface ExpRow {
  id: string
  source_url: string
  data: {
    company?: { name: string; slug: string } | null
    role?: string | null
    level?: string | null
    roundType?: string | null
    questionType?: string | null
    topics?: string[]
    difficulty?: number | null
    visible?: string | null
    detailsVisible?: string | null
  }
}

// Map the source questionType + roundType to an initial challenge-type hint.
// The sub-agent can override based on the actual extracted question.
function typeHint(qt: string | null | undefined, topics: string[]): string {
  const q = (qt ?? '').toLowerCase()
  if (q.includes('coding')) return 'algorithm'
  if (q.includes('system design')) return 'system_design'
  if (q.includes('data') && topics.some((t) => /sql|modeling|schema/i.test(t))) return 'data_modeling'
  // "Product", "Behavioral", "Multiple Types", "Technical Discussion" lean product-sense.
  return 'flow'
}

function mapDifficulty(d: number | null | undefined): string {
  if (d == null) return 'medium'
  if (d <= 3) return 'easy'
  if (d <= 6) return 'medium'
  return 'hard'
}

function main() {
  if (!fs.existsSync(IN)) {
    console.error(`Missing ${path.relative(process.cwd(), IN)}. Run scrape-chillinterview.ts --type experiences first.`)
    process.exit(1)
  }
  const rows = JSON.parse(fs.readFileSync(IN, 'utf-8')) as ExpRow[]
  const briefs = rows
    .filter((r) => {
      const txt = `${r.data.visible ?? ''} ${r.data.detailsVisible ?? ''}`.trim()
      return txt.length >= 40 // must carry some text to judge
    })
    .map((r, idx) => {
      const company = r.data.company?.name ? resolveCompany(r.data.company.name) : null
      const topics = r.data.topics ?? []
      return {
        idx,
        key: `chillinterview:exp:${r.id}`,
        source_url: r.source_url,
        company_tag: company?.known ? company.slug : null,
        company_unknown: company && !company.known ? company.slug : null,
        role: r.data.role ?? null,
        level: r.data.level ?? null,
        round_type: r.data.roundType ?? null,
        question_type: r.data.questionType ?? null,
        topics,
        difficulty: mapDifficulty(r.data.difficulty),
        type_hint: typeHint(r.data.questionType, topics),
        visible: r.data.visible ?? '',
        details: r.data.detailsVisible ?? '',
      }
    })
  fs.writeFileSync(OUT, JSON.stringify(briefs, null, 2))
  const byHint: Record<string, number> = {}
  for (const b of briefs) byHint[b.type_hint] = (byHint[b.type_hint] || 0) + 1
  console.log(`Wrote ${briefs.length} candidate briefs (of ${rows.length} scraped) → ${path.relative(process.cwd(), OUT)}`)
  console.log('type_hint distribution:', JSON.stringify(byHint))
}

main()
