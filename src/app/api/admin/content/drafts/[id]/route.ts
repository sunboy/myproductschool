// src/app/api/admin/content/drafts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin/audit-log'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import type { ChallengeJson } from '@/lib/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const body = await req.json() as { challenge_json: ChallengeJson }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('draft_challenges')
    .update({ challenge_json: body.challenge_json, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAdminAction(supabase, {
    action: 'draft_challenge.update',
    targetType: 'draft_challenges',
    targetId: id,
    after: { challenge_json: body.challenge_json as unknown as Record<string, unknown> },
  })
  return NextResponse.json({ ok: true })
}
