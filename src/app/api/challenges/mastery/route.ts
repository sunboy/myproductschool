import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'

export async function GET() {
  // Mock mode
  if (IS_MOCK) {
    return NextResponse.json([
      { challenge_id: 'mock-1', score: 87, is_completed: true },
      { challenge_id: 'mock-2', score: 52, is_completed: true },
      { challenge_id: 'mock-3', score: null, is_completed: false },
      { challenge_id: 'mock-4', score: null, is_completed: false },
      { challenge_id: 'mock-5', score: 91, is_completed: true },
      { challenge_id: 'mock-6', score: null, is_completed: false },
    ])
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const [{ data: challenges }, { data: attempts }] = await Promise.all([
    admin.from('challenges').select('id').eq('is_published', true),
    admin.from('challenge_attempts')
      .select('challenge_id, total_score')
      .eq('user_id', user.id)
      .eq('status', 'completed'),
  ])

  const completedMap = new Map(
    (attempts ?? []).map(a => [a.challenge_id, a.total_score])
  )

  const result = (challenges ?? []).map(c => ({
    challenge_id: c.id,
    score: completedMap.has(c.id) ? (completedMap.get(c.id) ?? null) : null,
    is_completed: completedMap.has(c.id),
  }))

  return NextResponse.json(result)
}
