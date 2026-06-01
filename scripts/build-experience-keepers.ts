#!/usr/bin/env npx tsx
/**
 * Assemble the experience question-detection results into the keepers list.
 *
 * Sub-agents write one JSON per brief into seeds/chillinterview/exp-detect-out/,
 * matching DetectResult below. This script keeps only has_named_question=true,
 * validates the extraction, routes by final_type, and writes
 * seeds/chillinterview/experience-questions.json (the input to authoring).
 *
 * Usage:
 *   npx tsx scripts/build-experience-keepers.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const SEEDS = path.join(process.cwd(), 'seeds')
const BRIEFS = path.join(SEEDS, 'chillinterview', 'exp-briefs.json')
const DETECT_OUT = path.join(SEEDS, 'chillinterview', 'exp-detect-out')
const KEEPERS = path.join(SEEDS, 'chillinterview', 'experience-questions.json')

interface DetectResult {
  key: string
  has_named_question: boolean
  // present only when has_named_question
  final_type?: 'algorithm' | 'system_design' | 'data_modeling' | 'flow'
  question_summary?: string
  topics?: string[]
}

interface Brief {
  key: string
  source_url: string
  company_tag: string | null
  role: string | null
  difficulty: string
  topics: string[]
  type_hint: string
}

const VALID_TYPES = new Set(['algorithm', 'system_design', 'data_modeling', 'flow'])

function main() {
  const briefs = JSON.parse(fs.readFileSync(BRIEFS, 'utf-8')) as Brief[]
  const byKey = new Map(briefs.map((b) => [b.key, b]))

  if (!fs.existsSync(DETECT_OUT)) {
    console.error(`Missing ${path.relative(process.cwd(), DETECT_OUT)} — detection agents have not run.`)
    process.exit(1)
  }
  const files = fs.readdirSync(DETECT_OUT).filter((f) => f.endsWith('.json'))

  let kept = 0
  let rejected = 0
  let invalid = 0
  const keepers: Array<Record<string, unknown>> = []
  const byType: Record<string, number> = {}

  for (const f of files) {
    const r = JSON.parse(fs.readFileSync(path.join(DETECT_OUT, f), 'utf-8')) as DetectResult
    const brief = byKey.get(r.key)
    if (!brief) continue
    if (!r.has_named_question) {
      rejected++
      continue
    }
    const type = r.final_type ?? (brief.type_hint as DetectResult['final_type'])
    if (!type || !VALID_TYPES.has(type) || !r.question_summary || r.question_summary.length < 30) {
      invalid++
      continue
    }
    kept++
    byType[type] = (byType[type] || 0) + 1
    keepers.push({
      key: r.key,
      final_type: type,
      question_summary: r.question_summary,
      topics: r.topics ?? brief.topics,
      company_tag: brief.company_tag,
      role: brief.role,
      difficulty: brief.difficulty,
      source_url: brief.source_url,
    })
  }

  fs.writeFileSync(KEEPERS, JSON.stringify(keepers, null, 2))
  console.log(`Detection: ${kept} kept, ${rejected} rejected, ${invalid} invalid (of ${files.length} judged)`)
  console.log('keepers by type:', JSON.stringify(byType))
  console.log(`Wrote → ${path.relative(process.cwd(), KEEPERS)}`)
}

main()
