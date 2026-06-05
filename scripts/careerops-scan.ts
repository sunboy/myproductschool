// Local CareerOps ingestion — seeds `job_listings` in dev.
//
//   npx tsx scripts/careerops-scan.ts
//
// Reuses the same orchestration as the cron route. Tier 2 (ATS) needs no key;
// Tier 1 (JSearch) runs only when JSEARCH_RAPIDAPI_KEY is set. Requires
// NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment.

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { runCareerOpsScan } from '../src/lib/careerops/scan'

config({ path: '.env.local' })
config()

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const admin = createClient(url, key, { auth: { persistSession: false } })
  console.log('Starting CareerOps scan...')
  const result = await runCareerOpsScan(admin)
  console.log(JSON.stringify(result, null, 2))
  if (result.errors.length) {
    console.warn(`Completed with ${result.errors.length} provider error(s).`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
