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

  // Also fetch draft if exists
  const { data: draft } = await supabase
    .from('draft_challenges')
    .select('*')
    .eq('job_id', id)
    .maybeSingle()

  return NextResponse.json({ job, draft: draft ?? null })
}
