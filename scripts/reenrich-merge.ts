/**
 * Merge per-shard reenrich output files into seeds/staged-interview-challenges.json.
 *
 * Reads:
 *   seeds/reenrich-shard-{0,1,2,3}.json
 *
 * For each entry in each shard file, finds the matching title in staged and replaces
 * the entry's metadata. Pre-existing entries (no metadata.source='notion-scraped' or
 * not is_sql=false) are left untouched.
 *
 * Run:
 *   npx tsx scripts/reenrich-merge.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const SEEDS_DIR = path.join(process.cwd(), 'seeds')
const STAGED_PATH = path.join(SEEDS_DIR, 'staged-interview-challenges.json')

async function main() {
  if (!fs.existsSync(STAGED_PATH)) {
    console.error(`missing ${STAGED_PATH}`)
    process.exit(1)
  }

  const staged = JSON.parse(fs.readFileSync(STAGED_PATH, 'utf-8')) as Array<{ title: string }>
  const stagedByTitle = new Map<string, number>()
  staged.forEach((e, i) => stagedByTitle.set(e.title, i))

  let totalMerged = 0
  let totalAdded = 0

  // Numbered shards (algo re-enrichment, both haiku and sonnet variants)
  const shardFiles: string[] = []
  for (let s = 0; s < 8; s++) {
    for (const stem of ['reenrich-shard', 'reenrich-sonnet-shard']) {
      const p = path.join(SEEDS_DIR, `${stem}-${s}.json`)
      if (fs.existsSync(p)) shardFiles.push(p)
    }
  }
  // Named shards (sql retry, etc.)
  for (const name of ['reenrich-shard-sql-retry.json']) {
    const p = path.join(SEEDS_DIR, name)
    if (fs.existsSync(p)) shardFiles.push(p)
  }

  for (const p of shardFiles) {
    const arr = JSON.parse(fs.readFileSync(p, 'utf-8')) as Array<{ title: string }>
    console.log(`${path.basename(p)}: ${arr.length} entries`)
    for (const e of arr) {
      const idx = stagedByTitle.get(e.title)
      if (idx !== undefined) {
        staged[idx] = e
        totalMerged++
      } else {
        staged.push(e)
        stagedByTitle.set(e.title, staged.length - 1)
        totalAdded++
      }
    }
  }

  fs.writeFileSync(STAGED_PATH, JSON.stringify(staged, null, 2))
  console.log(`\nMerged ${totalMerged} (replaced) + ${totalAdded} (added) = ${totalMerged + totalAdded} total entries into staged.`)
  console.log(`Staged file size: ${staged.length} entries`)
}

main().catch((err) => {
  console.error('fatal:', err)
  process.exit(1)
})
