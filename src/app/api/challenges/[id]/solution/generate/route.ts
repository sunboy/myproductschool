import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'
import { getSolutionAccess } from '@/lib/solutions/access'
import { generateAndStoreSolution } from '@/lib/solutions/ensure-solution'
import { type SolutionContentV1, type SolutionTabResponse } from '@/lib/solutions/schema'
import { MOCK_SOLUTION_CONTENT } from '@/lib/solutions/mock'
import { IS_MOCK } from '@/lib/mock'
import { createCachedMessageViaStream } from '@/lib/anthropic/cached-client'
import { buildSolutionSourceContext } from '@/lib/solutions/source-context'
import { graftSteppedTrace } from '@/lib/solutions/trace/graft'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'
import { withRoute } from '@/lib/api/withRoute'
import { logger } from '@/lib/log'

// Generation (auth + DB reads + the streamed Anthropic call + graft + store)
// runs 10-90s+ end to end, well past Vercel's unset default. Fluid Compute
// bills Active CPU time, not wall-clock, so raising this ceiling doesn't add
// cost — it only prevents the route being killed mid-generation.
export const maxDuration = 300

/**
 * POST /api/challenges/[id]/solution/generate
 *
 * Lazy generation fallback for challenges the backfill has not covered.
 * Generates the solution document once, stores it, and returns it; concurrent
 * requests are deduplicated with an atomic status-claim UPDATE so only one
 * request pays the AI call.
 *
 * The generate → graft → store core lives in generateAndStoreSolution
 * (src/lib/solutions/ensure-solution.ts), shared verbatim with the eager
 * publish/commit-time path so the two can never drift. This route keeps only its
 * HTTP concerns: the IS_MOCK short-circuit, auth, the attempt-or-Pro access gate,
 * the rate limit, and the already-generated fast path.
 */
export const POST = withRoute(async (
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
  if (!access.unlocked) return apiError(403, 'solution_locked', 'Complete an attempt or upgrade to Pro to view solutions')

  const limit = await rateLimit({ key: `ai:${user.id}:solution_generate`, limit: 3, windowSec: 300 })
  if (!limit.allowed) return apiError(429, 'rate_limited', 'Too many generation requests. Try again shortly.')

  // Already generated? Serve it without claiming.
  const { data: existing } = await admin
    .from('challenge_solutions')
    .select('content, generation_status')
    .eq('challenge_id', identity.id)
    .maybeSingle()

  if (existing?.generation_status === 'ready' && existing.content) {
    const body: SolutionTabResponse = { locked: false, status: 'ready', content: existing.content as SolutionContentV1 }
    return NextResponse.json(body)
  }

  try {
    const result = await generateAndStoreSolution(identity.id, 'lazy', {
      admin: admin as never,
      buildSourceContext: buildSolutionSourceContext,
      // Streaming keeps the connection alive past the single-request
      // ANTHROPIC_TIMEOUT_MS wall — solution generation is long-running
      // (10-90s+) and was hitting Anthropic.APIConnectionTimeoutError on the
      // plain call. Must match ensure-solution.ts's own defaultDeps.
      createMessage: createCachedMessageViaStream,
      graft: graftSteppedTrace,
    })

    switch (result.outcome) {
      case 'ready': {
        const body: SolutionTabResponse = { locked: false, status: 'ready', content: result.content }
        return NextResponse.json(body)
      }
      case 'contended': {
        // Another request is generating right now; tell the client to keep polling.
        const body: SolutionTabResponse = { locked: false, status: 'generating' }
        return NextResponse.json(body, { status: 202 })
      }
      case 'no_source':
        return apiError(500, 'no_source_context', 'Could not assemble challenge source material')
      case 'failed':
        return apiError(500, 'generation_failed', 'Solution generation failed. Try again in a moment.')
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Generation failed'
    logger.error('[challenges.solution.generate] generation failed', { challengeId: identity.id, error: messageText })
    return apiError(500, 'generation_failed', 'Solution generation failed. Try again in a moment.')
  }
}, { name: 'challenges.solution.generate' })
