import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

const BENCHMARK_LEVELS = [
  { title: 'Junior Engineer', percentile: 25 },
  { title: 'Mid-level Engineer', percentile: 50 },
  { title: 'Senior Engineer', percentile: 70 },
  { title: 'Staff Engineer', percentile: 85 },
  { title: 'Principal / Lead', percentile: 95 },
]

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json({
      levels: BENCHMARK_LEVELS,
      user_level: 'Senior Engineer',
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Get user's aggregate score across completed attempts
  const { data: attempts } = await adminClient
    .from('challenge_attempts')
    .select('score')
    .eq('user_id', user.id)
    .not('score', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(20)

  const scores = (attempts ?? []).map(a => a.score as number)
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  // Map avg score (0-100) to percentile range
  const userPercentile = Math.round(avgScore)
  const userLevel = [...BENCHMARK_LEVELS].reverse().find(l => userPercentile >= l.percentile)?.title
    ?? BENCHMARK_LEVELS[0].title

  return NextResponse.json({
    levels: BENCHMARK_LEVELS,
    user_level: userLevel,
  })
}
