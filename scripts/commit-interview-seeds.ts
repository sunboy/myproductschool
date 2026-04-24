/**
 * Commit approved interview challenges from seeds/staged-interview-challenges.json
 * to the Supabase challenges table.
 *
 * Run with: npx tsx scripts/commit-interview-seeds.ts
 *
 * Prerequisites:
 *   1. Run seed-interview-challenges.ts to generate seeds/staged-interview-challenges.json
 *   2. Review the file and set approved: true on challenges you want to publish
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function normalizeDifficulty(raw: unknown): string {
  if (raw === 'easy') return 'warmup'
  if (raw === 'hard') return 'advanced'
  if (raw === 'advanced') return 'advanced'
  if (raw === 'warmup') return 'warmup'
  return 'standard'
}

async function main() {
  const stagedPath = path.join(process.cwd(), 'seeds', 'staged-interview-challenges.json')

  if (!fs.existsSync(stagedPath)) {
    console.log('No staged challenges found. Run seed-interview-challenges.ts first.')
    process.exit(1)
  }

  const staged = JSON.parse(fs.readFileSync(stagedPath, 'utf-8')) as Array<Record<string, unknown>>
  const approved = staged.filter((c) => c.approved === true)

  if (approved.length === 0) {
    console.log(
      'No approved challenges. Edit seeds/staged-interview-challenges.json and set approved: true.'
    )
    process.exit(0)
  }

  console.log(`Committing ${approved.length} approved challenges...`)

  for (const c of approved) {
    const { error } = await supabase.from('challenges').insert({
      id: randomUUID(),
      title: c.title,
      challenge_type: c.challenge_type,
      difficulty: normalizeDifficulty(c.difficulty),
      estimated_minutes: (c.estimated_minutes as number) ?? 30,
      industry: (c.industry as string) ?? null,
      scenario_context: c.problem_statement_markdown,
      scenario_trigger: 'You have 30 minutes.',
      scenario_question: 'Design your solution on the canvas. Use Hatch for coaching.',
      metadata: (c.metadata as object) ?? {},
      is_published: true,
      paradigm: 'traditional',
    })

    if (error) {
      console.error(`  Failed: ${c.title}: ${error.message}`)
    } else {
      console.log(`  Inserted: ${c.title}`)
    }
  }

  console.log('\nDone. Check /challenges or /explore to see the new challenges.')
}

main().catch(console.error)
