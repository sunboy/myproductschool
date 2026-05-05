// src/app/api/admin/content/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import { generateChallenge } from '@/lib/content/generator'

export async function POST(req: NextRequest) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const body = await req.json() as {
    input_type: 'url' | 'text' | 'question'
    input_raw: string
    mode?: 'local' | 'api'
    created_by?: string
  }

  const supabase = createAdminClient()
  const mode = body.mode ?? (process.env.GENERATION_MODE === 'api' ? 'api' : 'local')

  const { data: job, error } = await supabase
    .from('generation_jobs')
    .insert({
      input_type: body.input_type,
      input_raw: body.input_raw,
      mode,
      created_by: null,
    })
    .select('id')
    .single()

  if (error || !job) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  // API mode: trigger generation inline (async, don't await)
  if (mode === 'api') {
    void runApiGeneration(job.id, body.input_type, body.input_raw)
  }

  return NextResponse.json({ job_id: job.id })
}

async function runApiGeneration(
  jobId: string,
  input_type: 'url' | 'text' | 'question',
  input_raw: string
) {
  const supabase = createAdminClient()
  try {
    await supabase.from('generation_jobs').update({ status: 'scraping' }).eq('id', jobId)
    const challengeJson = await generateChallenge({ input_type, input_raw })
    await supabase.from('generation_jobs').update({ status: 'generating' }).eq('id', jobId)

    await supabase
      .from('draft_challenges')
      .insert({ job_id: jobId, challenge_json: challengeJson })

    await supabase.from('generation_jobs').update({
      status: 'review',
      scraped_text: challengeJson.scenario.context,
    }).eq('id', jobId)
  } catch (err) {
    await supabase.from('generation_jobs').update({
      status: 'failed',
      error_message: String(err),
    }).eq('id', jobId)
  }
}

export async function GET(req: NextRequest) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data })
}
