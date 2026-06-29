import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'
import { getSolutionAccess } from '@/lib/solutions/access'
import { buildSolutionSystemPrompt } from '@/lib/solutions/prompt'
import { buildSolutionSourceContext } from '@/lib/solutions/source-context'
import { buildSteppedTraceFromMetadata } from '@/lib/solutions/trace'
import { SolutionContentSchema, type SolutionContentV1, type SolutionTabResponse } from '@/lib/solutions/schema'
import { MOCK_SOLUTION_CONTENT } from '@/lib/solutions/mock'
import { IS_MOCK } from '@/lib/mock'
import { createCachedMessage } from '@/lib/anthropic/cached-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { apiError } from '@/lib/api/error'
import { withRoute } from '@/lib/api/withRoute'
import { logger } from '@/lib/log'

const MODEL = 'claude-sonnet-4-6'
const STALE_LOCK_MS = 3 * 60 * 1000

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const unfenced = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
    : trimmed
  const start = unfenced.indexOf('{')
  const end = unfenced.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object in model output')
  return JSON.parse(unfenced.slice(start, end + 1))
}

function firstText(message: Awaited<ReturnType<typeof createCachedMessage>>): string {
  const block = message.content.find((b) => b.type === 'text')
  return block && 'text' in block ? block.text : ''
}

/**
 * POST /api/challenges/[id]/solution/generate
 *
 * Lazy generation fallback for challenges the backfill has not covered.
 * Generates the solution document once, stores it, and returns it; concurrent
 * requests are deduplicated with an atomic status-claim UPDATE so only one
 * request pays the AI call.
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
    .select('content, generation_status, generation_started_at')
    .eq('challenge_id', identity.id)
    .maybeSingle()

  if (existing?.generation_status === 'ready' && existing.content) {
    const body: SolutionTabResponse = { locked: false, status: 'ready', content: existing.content as SolutionContentV1 }
    return NextResponse.json(body)
  }

  // Ensure a row exists, then claim it atomically. Two claim passes: normal
  // (pending/failed) and stale-lock reclaim (generating but started > 3 min ago,
  // i.e. a crashed earlier attempt).
  await admin
    .from('challenge_solutions')
    .upsert({ challenge_id: identity.id }, { onConflict: 'challenge_id', ignoreDuplicates: true })

  const nowIso = new Date().toISOString()
  const { data: claimed } = await admin
    .from('challenge_solutions')
    .update({ generation_status: 'generating', generation_started_at: nowIso, generation_error: null, updated_at: nowIso })
    .eq('challenge_id', identity.id)
    .in('generation_status', ['pending', 'failed'])
    .select('challenge_id')

  let holdsClaim = Boolean(claimed && claimed.length > 0)
  if (!holdsClaim) {
    const staleBefore = new Date(Date.now() - STALE_LOCK_MS).toISOString()
    const { data: reclaimed } = await admin
      .from('challenge_solutions')
      .update({ generation_status: 'generating', generation_started_at: nowIso, generation_error: null, updated_at: nowIso })
      .eq('challenge_id', identity.id)
      .eq('generation_status', 'generating')
      .lt('generation_started_at', staleBefore)
      .select('challenge_id')
    holdsClaim = Boolean(reclaimed && reclaimed.length > 0)
  }

  if (!holdsClaim) {
    // Another request is generating right now; tell the client to keep polling.
    const body: SolutionTabResponse = { locked: false, status: 'generating' }
    return NextResponse.json(body, { status: 202 })
  }

  const source = await buildSolutionSourceContext(admin, identity.id)
  if (!source) {
    await admin
      .from('challenge_solutions')
      .update({ generation_status: 'failed', generation_error: 'No source context', updated_at: new Date().toISOString() })
      .eq('challenge_id', identity.id)
    return apiError(500, 'no_source_context', 'Could not assemble challenge source material')
  }

  // Stepped eligibility: only algorithm challenges, and only when a verified
  // trace can be built from the real reference + test case. If so, the model is
  // told the walkthrough is auto-attached and the server grafts the verified
  // diagram after validation, so the model never authors the step states.
  let steppedCandidate: ReturnType<typeof buildSteppedTraceFromMetadata> = null
  if (source.challengeType === 'algorithm') {
    const { data: meta } = await admin
      .from('challenges')
      .select('metadata, topic_tags, technique_tags')
      .eq('id', identity.id)
      .maybeSingle()
    if (meta) {
      const tags = [
        ...((meta.topic_tags as string[] | null) ?? []),
        ...((meta.technique_tags as string[] | null) ?? []),
      ]
      steppedCandidate = buildSteppedTraceFromMetadata(
        (meta.metadata as Record<string, unknown> | null) ?? {},
        tags,
      )
    }
  }

  const systemPrompt = buildSolutionSystemPrompt(source.challengeType, {
    hasVerifiedTrace: Boolean(steppedCandidate),
  })

  try {
    let content: SolutionContentV1 | null = null
    let lastIssues = ''

    for (let attempt = 0; attempt < 2 && !content; attempt++) {
      const userContent = attempt === 0
        ? source.userContent
        : `${source.userContent}\n\n# Previous attempt failed validation\nFix these issues and return the corrected JSON:\n${lastIssues}`

      const message = await createCachedMessage(systemPrompt, userContent, {
        model: MODEL,
        max_tokens: 8000,
      })

      try {
        const parsed = SolutionContentSchema.safeParse(extractJson(firstText(message)))
        if (parsed.success) {
          content = parsed.data
        } else {
          lastIssues = parsed.error.issues
            .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
            .join('\n')
        }
      } catch (parseError) {
        lastIssues = parseError instanceof Error ? parseError.message : 'JSON parse failure'
      }
    }

    if (!content) throw new Error(`Solution failed validation after retry: ${lastIssues.slice(0, 500)}`)

    // Attach the machine-verified walkthrough to the optimal approach (the last
    // one, by the brute-force -> optimal convention). The deltas are never the
    // model's; only the surrounding solution prose is. Re-validate so the
    // one-stepped-per-solution and verified-trace gates still hold.
    if (steppedCandidate) {
      const approaches = content.approaches.map((a) => ({ ...a }))
      const optimal = approaches[approaches.length - 1]
      if (optimal && optimal.diagram?.kind !== 'stepped') {
        optimal.diagram = steppedCandidate.diagram
        const grafted = { ...content, approaches }
        const recheck = SolutionContentSchema.safeParse(grafted)
        if (recheck.success) {
          content = recheck.data
        } else {
          logger.warn('[challenges.solution.generate] stepped graft failed revalidation, keeping static diagram', {
            challengeId: identity.id,
            issues: recheck.error.issues.map((i) => i.message).join('; ').slice(0, 300),
          })
        }
      }
    }

    await admin
      .from('challenge_solutions')
      .update({
        content,
        generation_status: 'ready',
        generation_error: null,
        generated_by: 'lazy',
        model: MODEL,
        updated_at: new Date().toISOString(),
      })
      .eq('challenge_id', identity.id)

    const body: SolutionTabResponse = { locked: false, status: 'ready', content }
    return NextResponse.json(body)
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Generation failed'
    logger.error('[challenges.solution.generate] generation failed', { challengeId: identity.id, error: messageText })
    await admin
      .from('challenge_solutions')
      .update({ generation_status: 'failed', generation_error: messageText.slice(0, 1000), updated_at: new Date().toISOString() })
      .eq('challenge_id', identity.id)
    return apiError(500, 'generation_failed', 'Solution generation failed. Try again in a moment.')
  }
}, { name: 'challenges.solution.generate' })
