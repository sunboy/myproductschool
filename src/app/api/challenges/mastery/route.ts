import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { buildMasteryEntries, collectPages, collectPublishedChallengeIds, type MasteryAttempt } from '@/lib/progress/mastery'

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

  let publishedChallengeIds: string[]
  let attempts: MasteryAttempt[]
  try {
    ;[publishedChallengeIds, attempts] = await Promise.all([
      collectPublishedChallengeIds(async (from, to) => {
        const { data, error } = await admin
          .from('challenges')
          .select('id')
          .eq('is_published', true)
          .order('id', { ascending: true })
          .range(from, to)
        if (error) throw error
        return data ?? []
      }),
      collectPages(async (from, to) => {
        const { data, error } = await admin
          .from('challenge_attempts')
          .select('challenge_id, total_score, max_score')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('id', { ascending: true })
          .range(from, to)
        if (error) throw error
        return (data ?? []) as MasteryAttempt[]
      }),
    ])
  } catch {
    return NextResponse.json({ error: 'Mastery could not be loaded.' }, { status: 503 })
  }

  const result = buildMasteryEntries(publishedChallengeIds, attempts)

  return NextResponse.json(result)
}
