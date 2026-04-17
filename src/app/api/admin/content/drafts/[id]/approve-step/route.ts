// src/app/api/admin/content/drafts/[id]/approve-step/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const { step } = await req.json() as { step: string }

  const supabase = createAdminClient()
  const { data: draft, error: fetchErr } = await supabase
    .from('draft_challenges')
    .select('step_approvals')
    .eq('id', id)
    .single()

  if (fetchErr || !draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updatedApprovals = { ...((draft.step_approvals as Record<string, boolean>) ?? {}), [step]: true }

  const { error } = await supabase
    .from('draft_challenges')
    .update({ step_approvals: updatedApprovals, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, step_approvals: updatedApprovals })
}
