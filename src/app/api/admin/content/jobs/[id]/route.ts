// src/app/api/admin/content/jobs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const supabase = createAdminClient()

  const { data: job, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: draft } = await supabase
    .from('draft_challenges')
    .select('*')
    .eq('job_id', id)
    .maybeSingle()

  return NextResponse.json({ job, draft: draft ?? null })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const supabase = createAdminClient()

  // Fetch job first to get result_challenge_id
  const { data: job } = await supabase
    .from('generation_jobs')
    .select('result_challenge_id')
    .eq('id', id)
    .single()

  // Delete published challenge if present (cascades to flow_steps, questions, options)
  if (job?.result_challenge_id) {
    await supabase.from('challenges').delete().eq('id', job.result_challenge_id)
  }

  // Delete draft
  await supabase.from('draft_challenges').delete().eq('job_id', id)

  // Delete job
  const { error } = await supabase.from('generation_jobs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
