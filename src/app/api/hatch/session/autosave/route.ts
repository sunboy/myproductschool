import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { attemptId, draftSnapshot, updatedAt } = body
  if (!attemptId || !draftSnapshot) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Last-write-wins: only update if incoming timestamp is newer
  const { data: existing } = await supabase
    .from('challenge_attempts')
    .select('draft_updated_at, user_id')
    .eq('id', attemptId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const incomingTs = updatedAt ? new Date(updatedAt).getTime() : Date.now()
  const existingTs = existing.draft_updated_at ? new Date(existing.draft_updated_at).getTime() : 0

  if (incomingTs <= existingTs) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await supabase
    .from('challenge_attempts')
    .update({
      draft_snapshot: draftSnapshot,
      draft_updated_at: new Date(incomingTs).toISOString(),
    })
    .eq('id', attemptId)

  return NextResponse.json({ ok: true })
}
