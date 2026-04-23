import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const excludeId = searchParams.get('exclude')
  const preferMove = searchParams.get('move')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  const completedIds = new Set<string>()
  if (user) {
    const { data: attempts } = await admin
      .from('challenge_attempts')
      .select('challenge_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
    for (const a of attempts ?? []) {
      if (a.challenge_id) completedIds.add(a.challenge_id)
    }
  }

  const { data: all } = await admin
    .from('challenges')
    .select('id, title, prompt_text, move_tags')
    .eq('challenge_type', 'quick_take')
    .eq('is_published', true)
    .order('created_at', { ascending: true })

  if (!all?.length) {
    return NextResponse.json({ error: 'No quick-takes available' }, { status: 404 })
  }

  const candidates = all.filter(c => c.id !== excludeId && !completedIds.has(c.id))

  if (!candidates.length) {
    const any = all.find(c => c.id !== excludeId) ?? all[0]
    return NextResponse.json(any)
  }

  const sameMoveFirst = preferMove
    ? [
        ...candidates.filter(c => c.move_tags?.includes(preferMove)),
        ...candidates.filter(c => !c.move_tags?.includes(preferMove)),
      ]
    : candidates

  return NextResponse.json(sameMoveFirst[0])
}
