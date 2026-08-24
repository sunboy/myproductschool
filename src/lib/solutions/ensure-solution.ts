/**
 * Shared "generate the solution, attach the verified walkthrough, store it" core,
 * extracted from the lazy generation route so the lazy path (first Solutions-tab
 * view) and the eager path (publish/commit time) can NEVER drift.
 *
 * Two public entry points sit on top of the same core:
 *   - `generateAndStoreSolution` — the low-level core: it assumes the caller has
 *     already resolved identity/access and holds nothing; it does the atomic
 *     status-claim dedup, builds source context, generates via createCachedMessage
 *     (two-pass zod validation), grafts the walkthrough, and stores the row. The
 *     lazy API route calls this after its own auth + access-gate + rate-limit, so
 *     the route keeps its HTTP concerns and shares the generation core verbatim.
 *   - `ensureSolutionForChallenge(challengeId, opts)` — the eager, fail-soft entry
 *     for publish/commit time. It resolves the challenge, skips when a ready
 *     solution already exists (unless `force`), then calls the same core. It is
 *     FAIL-SOFT: any error returns { status: 'failed' } and logs; it NEVER throws.
 *
 * COST NOTE (per repo CLAUDE.md "Never use the Anthropic API key unless asked"):
 * this helper calls the Anthropic API (createCachedMessage), which bills tokens.
 * That is acceptable here because the eager path mirrors the EXISTING lazy route's
 * cost exactly (one Sonnet generation per challenge, deduped by the atomic claim).
 * Eager CALLERS at publish/commit time MUST invoke this opt-in and fire-and-forget
 * (do not await it as a hard dependency of the publish/commit), so a slow or failed
 * generation never blocks or breaks a publish. This helper enforces the fail-soft
 * contract; the caller enforces the fire-and-forget contract.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { resolveChallengeIdentity } from '@/lib/challenges/resolve'
import { buildSolutionSystemPrompt } from '@/lib/solutions/prompt'
import { buildSolutionSourceContext } from '@/lib/solutions/source-context'
import { buildSteppedTraceFromMetadata } from '@/lib/solutions/trace'
import { buildSteppedGridFromMetadata } from '@/lib/solutions/trace/gridTrace'
import { buildSteppedPipelineFromMetadata } from '@/lib/solutions/trace/pipelineTrace'
import { graftSteppedTrace } from '@/lib/solutions/trace/graft'
import { SolutionContentSchema, type SolutionContentV1 } from '@/lib/solutions/schema'
import { createCachedMessage, createCachedMessageViaStream } from '@/lib/anthropic/cached-client'
import { logger } from '@/lib/log'
import type { SupabaseClient } from '@supabase/supabase-js'

export const SOLUTION_MODEL = 'claude-sonnet-4-6'
const STALE_LOCK_MS = 3 * 60 * 1000

/** Who triggered the stored generation. Written to challenge_solutions.generated_by. */
export type SolutionGeneratedBy = 'lazy' | 'eager'

/**
 * The unit of work the core needs from the outside world. Defaults wire the real
 * implementations; tests inject fakes so no real Anthropic / Supabase call fires.
 */
export interface SolutionGenDeps {
  admin: SupabaseClient
  buildSourceContext: typeof buildSolutionSourceContext
  createMessage: typeof createCachedMessage
  graft: typeof graftSteppedTrace
}

function defaultDeps(admin?: SupabaseClient): SolutionGenDeps {
  return {
    admin: admin ?? (createAdminClient() as unknown as SupabaseClient),
    buildSourceContext: buildSolutionSourceContext,
    // Streaming keeps the connection alive past the single-request
    // ANTHROPIC_TIMEOUT_MS wall — solution generation is long-running (60-120s+)
    // and was hitting Anthropic.APIConnectionTimeoutError on the plain call.
    createMessage: createCachedMessageViaStream,
    graft: graftSteppedTrace,
  }
}

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
 * Result of the low-level core. `outcome`:
 *   - 'ready'      the solution was generated + stored (content returned)
 *   - 'contended'  another request holds the generation claim right now
 *   - 'no_source'  no source context could be assembled (row marked failed)
 *   - 'failed'     generation itself failed after retry (row marked failed)
 */
export type CoreOutcome =
  | { outcome: 'ready'; content: SolutionContentV1; grafted: boolean }
  | { outcome: 'contended' }
  | { outcome: 'no_source' }
  | { outcome: 'failed'; error: string }

/**
 * Core generate → graft → store used by BOTH the lazy route and the eager helper.
 *
 * Preconditions: the caller has resolved `challengeId` to the canonical challenge
 * id and enforced any auth/access/rate-limit concerns. This function owns the
 * atomic status-claim dedup (so a concurrent lazy view and an eager call never
 * double-generate), source assembly, generation, graft, and store.
 *
 * It DOES throw on an unexpected generation error so the lazy route can map it to
 * a 500 the way it always has. The eager wrapper catches instead. The 'contended'
 * / 'no_source' / 'failed' outcomes are returned, not thrown.
 */
export async function generateAndStoreSolution(
  challengeId: string,
  generatedBy: SolutionGeneratedBy,
  deps: SolutionGenDeps,
): Promise<CoreOutcome> {
  const { admin, buildSourceContext, createMessage, graft } = deps

  // Ensure a row exists, then claim it atomically. Two claim passes: normal
  // (pending/failed) and stale-lock reclaim (generating but started > 3 min ago,
  // i.e. a crashed earlier attempt). Identical to the original lazy-route logic.
  await admin
    .from('challenge_solutions')
    .upsert({ challenge_id: challengeId }, { onConflict: 'challenge_id', ignoreDuplicates: true })

  const nowIso = new Date().toISOString()
  const { data: claimed } = await admin
    .from('challenge_solutions')
    .update({ generation_status: 'generating', generation_started_at: nowIso, generation_error: null, updated_at: nowIso })
    .eq('challenge_id', challengeId)
    .in('generation_status', ['pending', 'failed'])
    .select('challenge_id')

  let holdsClaim = Boolean(claimed && claimed.length > 0)
  if (!holdsClaim) {
    const staleBefore = new Date(Date.now() - STALE_LOCK_MS).toISOString()
    const { data: reclaimed } = await admin
      .from('challenge_solutions')
      .update({ generation_status: 'generating', generation_started_at: nowIso, generation_error: null, updated_at: nowIso })
      .eq('challenge_id', challengeId)
      .eq('generation_status', 'generating')
      .lt('generation_started_at', staleBefore)
      .select('challenge_id')
    holdsClaim = Boolean(reclaimed && reclaimed.length > 0)
  }

  if (!holdsClaim) return { outcome: 'contended' }

  const source = await buildSourceContext(admin, challengeId)
  if (!source) {
    await admin
      .from('challenge_solutions')
      .update({ generation_status: 'failed', generation_error: 'No source context', updated_at: new Date().toISOString() })
      .eq('challenge_id', challengeId)
    return { outcome: 'no_source' }
  }

  // Stepped eligibility decides the hasVerifiedTrace prompt flag (so the model
  // knows NOT to author a stepped diagram, because the server will attach one).
  // The metadata/tags fetched here are reused by the post-validation graft so the
  // work is done once. Matches the lazy route's type-aware logic exactly.
  let steppedMetadata: Record<string, unknown> | null = null
  let steppedTags: string[] = []
  let steppedEligible = false
  if (source.challengeType === 'algorithm' || source.challengeType === 'sql') {
    const { data: meta } = await admin
      .from('challenges')
      .select('metadata, topic_tags, technique_tags')
      .eq('id', challengeId)
      .maybeSingle()
    if (meta) {
      steppedMetadata = (meta.metadata as Record<string, unknown> | null) ?? {}
      steppedTags = [
        ...((meta.topic_tags as string[] | null) ?? []),
        ...((meta.technique_tags as string[] | null) ?? []),
      ]
      if (source.challengeType === 'algorithm') {
        steppedEligible =
          Boolean(buildSteppedTraceFromMetadata(steppedMetadata, steppedTags)) ||
          Boolean(buildSteppedGridFromMetadata(steppedMetadata, steppedTags))
      } else {
        steppedEligible = Boolean(await buildSteppedPipelineFromMetadata(steppedMetadata, steppedTags))
      }
    }
  } else if (source.challengeType === 'system_design' || source.challengeType === 'data_modeling') {
    steppedEligible = true
  }

  const systemPrompt = buildSolutionSystemPrompt(source.challengeType, {
    hasVerifiedTrace: steppedEligible,
  })

  try {
    let content: SolutionContentV1 | null = null
    let lastIssues = ''

    for (let attempt = 0; attempt < 2 && !content; attempt++) {
      const userContent = attempt === 0
        ? source.userContent
        : `${source.userContent}\n\n# Previous attempt failed validation\nFix these issues and return the corrected JSON:\n${lastIssues}`

      const message = await createMessage(systemPrompt, userContent, {
        model: SOLUTION_MODEL,
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

    // Strip any model-authored stepped diagram and attach only the machine-
    // verified walkthrough (graftSteppedTrace enforces this). The deltas are
    // never the model's; trace_verified cannot be self-asserted by the model.
    const { content: finalContent, grafted } = await graft(content, steppedMetadata, steppedTags)
    content = finalContent

    await admin
      .from('challenge_solutions')
      .update({
        content,
        generation_status: 'ready',
        generation_error: null,
        generated_by: generatedBy,
        model: SOLUTION_MODEL,
        updated_at: new Date().toISOString(),
      })
      .eq('challenge_id', challengeId)

    return { outcome: 'ready', content, grafted }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Generation failed'
    await admin
      .from('challenge_solutions')
      .update({ generation_status: 'failed', generation_error: messageText.slice(0, 1000), updated_at: new Date().toISOString() })
      .eq('challenge_id', challengeId)
    throw error
  }
}

export interface EnsureSolutionResult {
  status: 'ready' | 'skipped' | 'failed'
  grafted?: boolean
}

/**
 * Eager, fail-soft "make sure this challenge has a generated solution" entry.
 *
 * - Resolves the challenge; returns { status: 'skipped' } when it cannot be found.
 * - Returns { status: 'skipped' } when a ready solution already exists, unless
 *   `opts.force` is set.
 * - Otherwise runs the SAME generate → graft → store core the lazy route runs,
 *   with the SAME atomic status-claim dedup, storing generation_status: 'ready'
 *   and generated_by: 'eager'.
 * - 'contended' (another request already holds the claim) is treated as
 *   { status: 'skipped' }: the other worker will finish it, so this call is a
 *   no-op rather than a failure.
 * - FAIL-SOFT: any thrown error is caught and returned as { status: 'failed' }
 *   with a log line. This function NEVER throws, so eager callers can safely
 *   fire-and-forget it at publish/commit time.
 *
 * COST: this generates via the Anthropic API (see the file-level doc comment).
 * Eager callers must treat it as opt-in and fire-and-forget, never a hard
 * dependency of the publish/commit.
 */
export async function ensureSolutionForChallenge(
  challengeId: string,
  opts: { force?: boolean; deps?: Partial<SolutionGenDeps> } = {},
): Promise<EnsureSolutionResult> {
  try {
    const deps: SolutionGenDeps = { ...defaultDeps(opts.deps?.admin), ...opts.deps }
    const { admin } = deps

    const identity = await resolveChallengeIdentity(challengeId, admin as never)
    if (!identity) {
      logger.info('[solutions.ensure] challenge not found; skipping', { challengeId })
      return { status: 'skipped' }
    }

    if (!opts.force) {
      const { data: existing } = await admin
        .from('challenge_solutions')
        .select('generation_status, content')
        .eq('challenge_id', identity.id)
        .maybeSingle()
      if (existing?.generation_status === 'ready' && existing.content) {
        return { status: 'skipped' }
      }
    }

    const result = await generateAndStoreSolution(identity.id, 'eager', deps)
    switch (result.outcome) {
      case 'ready':
        return { status: 'ready', grafted: result.grafted }
      case 'contended':
        // Another worker holds the claim; it will finish. No-op, not a failure.
        return { status: 'skipped' }
      case 'no_source':
        logger.warn('[solutions.ensure] no source context; skipping', { challengeId: identity.id })
        return { status: 'failed' }
      case 'failed':
        return { status: 'failed' }
    }
  } catch (error) {
    logger.error('[solutions.ensure] eager generation failed', {
      challengeId,
      error: error instanceof Error ? error.message : String(error),
    })
    return { status: 'failed' }
  }
}
