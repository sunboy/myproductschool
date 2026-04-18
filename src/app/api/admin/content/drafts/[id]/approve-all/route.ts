// src/app/api/admin/content/drafts/[id]/approve-all/route.ts
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
  const supabase = createAdminClient()

  const allApproved = { frame: true, list: true, optimize: true, win: true }
  const { error } = await supabase
    .from('draft_challenges')
    .update({ step_approvals: allApproved, review_status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
