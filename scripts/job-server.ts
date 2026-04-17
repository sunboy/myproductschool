// scripts/job-server.ts
// Run with: npx ts-node scripts/job-server.ts
// Prerequisites: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set in environment

import { createClient } from '@supabase/supabase-js'
import { generateChallenge } from '../src/lib/content/generator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const POLL_INTERVAL_MS = 2000

async function processPendingJob() {
  const { data: jobs } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('status', 'pending')
    .eq('mode', 'local')
    .order('created_at', { ascending: true })
    .limit(1)

  const job = jobs?.[0]
  if (!job) return

  console.log(`[job-server] Processing job ${job.id} (${job.input_type})`)

  try {
    await supabase.from('generation_jobs').update({ status: 'scraping' }).eq('id', job.id)

    await supabase.from('generation_jobs').update({ status: 'generating' }).eq('id', job.id)

    const challengeJson = await generateChallenge({
      input_type: job.input_type,
      input_raw: job.input_raw,
    })

    await supabase
      .from('draft_challenges')
      .insert({ job_id: job.id, challenge_json: challengeJson })

    await supabase.from('generation_jobs').update({
      status: 'review',
      scraped_text: challengeJson.scenario.context,
    }).eq('id', job.id)

    console.log(`[job-server] Job ${job.id} complete → status=review`)
  } catch (err) {
    console.error(`[job-server] Job ${job.id} failed:`, err)
    await supabase.from('generation_jobs').update({
      status: 'failed',
      error_message: String(err),
    }).eq('id', job.id)
  }
}

console.log('[job-server] Starting — polling every 2s for pending jobs...')
setInterval(processPendingJob, POLL_INTERVAL_MS)
processPendingJob()
