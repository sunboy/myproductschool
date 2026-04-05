import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { getLumaContext } from '@/lib/luma-context'

const BENCHMARK_LEVELS = [
  { title: 'Junior Engineer', percentile: 25 },
  { title: 'Mid-level Engineer', percentile: 50 },
  { title: 'Senior Engineer', percentile: 70 },
  { title: 'Staff Engineer', percentile: 85 },
  { title: 'Principal / Lead', percentile: 95 },
]

function buildLumaMessage(
  userPercentile: number,
  strongestCompetency: string | null,
  weakestCompetency: string | null,
): string {
  if (userPercentile === 0) {
    return 'Keep practising to build your benchmark.'
  }
  const topPct = 100 - userPercentile
  if (topPct <= 20 && strongestCompetency) {
    return `You're in the top ${topPct}% of product thinkers — your ${strongestCompetency} is your standout strength.`
  }
  if (weakestCompetency) {
    return `Solid foundation — you're ahead of ${userPercentile}% of learners. Push your ${weakestCompetency} to break into the top tier.`
  }
  return `You're ahead of ${userPercentile}% of learners — keep going to climb further.`
}

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json({
      levels: BENCHMARK_LEVELS,
      user_level: 'Senior Engineer',
      luma_message: "You're in the top 20% of product thinkers — strong work so far.",
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

  // Fetch luma context to derive strongest/weakest competency for message
  let lumaCtx: Awaited<ReturnType<typeof getLumaContext>> | null = null
  try {
    lumaCtx = await getLumaContext(user.id)
  } catch {
    // non-fatal — fall back to no-competency message
  }
  const competencies = lumaCtx?.competencies ?? []
  const strongestCompetency = competencies.length > 0
    ? [...competencies].sort((a, b) => b.score - a.score)[0].competency
    : null
  const lumaMessage = buildLumaMessage(userPercentile, strongestCompetency, lumaCtx?.weakestCompetency ?? null)

  return NextResponse.json({
    levels: BENCHMARK_LEVELS,
    user_level: userLevel,
    luma_message: lumaMessage,
  })
}
