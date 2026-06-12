import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'
import { getSolutionAccess } from '@/lib/solutions/access'
import { MOCK_SOLUTION_CONTENT } from '@/lib/solutions/mock'
import { IS_MOCK } from '@/lib/mock'
import { apiError } from '@/lib/api/error'
import { withRoute } from '@/lib/api/withRoute'
import type { ChallengeSolutionRow, SolutionTabResponse } from '@/lib/solutions/schema'

/**
 * GET /api/challenges/[id]/solution
 *
 * Returns the solution document for a challenge, gated attempt-or-Pro.
 * The gate is enforced here, before the content column is ever selected,
 * and challenge_solutions has no RLS policies, so locked content cannot
 * reach a client by any path.
 */
export const GET = withRoute(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  if (IS_MOCK) {
    const body: SolutionTabResponse = { locked: false, status: 'ready', content: MOCK_SOLUTION_CONTENT }
    return NextResponse.json(body)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'unauthorized', 'Sign in required')

  const admin = createAdminClient()
  const identity = await resolveChallengeIdentity(id, admin)
  if (!identity) return apiError(404, 'not_found', 'Challenge not found')

  const access = await getSolutionAccess(admin, user.id, identity.id)
  if (!access.unlocked) {
    const body: SolutionTabResponse = {
      locked: true,
      unlock: { needs_attempt: true, pro_available: !access.isPro },
    }
    return NextResponse.json(body)
  }

  const { data: row } = await admin
    .from('challenge_solutions')
    .select('content, generation_status, generation_started_at')
    .eq('challenge_id', identity.id)
    .maybeSingle()

  const solution = row as Pick<ChallengeSolutionRow, 'content' | 'generation_status' | 'generation_started_at'> | null

  if (solution?.generation_status === 'ready' && solution.content) {
    const body: SolutionTabResponse = { locked: false, status: 'ready', content: solution.content }
    return NextResponse.json(body)
  }

  if (solution?.generation_status === 'generating') {
    // Treat stale locks (crashed generation) as absent so the client re-triggers.
    const startedAt = solution.generation_started_at ? new Date(solution.generation_started_at).getTime() : 0
    const stale = Date.now() - startedAt > 3 * 60 * 1000
    const body: SolutionTabResponse = { locked: false, status: stale ? 'none' : 'generating' }
    return NextResponse.json(body)
  }

  if (solution?.generation_status === 'failed') {
    const body: SolutionTabResponse = { locked: false, status: 'failed' }
    return NextResponse.json(body)
  }

  const body: SolutionTabResponse = { locked: false, status: 'none' }
  return NextResponse.json(body)
}, { name: 'challenges.solution.get' })
