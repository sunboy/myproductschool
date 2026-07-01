#!/usr/bin/env npx tsx
/**
 * In-place backfill of the top-level `content.walkthrough` field on EXISTING
 * challenge_solutions rows. NO prose regeneration, NO AI calls.
 *
 * For each eligible challenge it reads the already-stored solution content, runs
 * graftSteppedTrace(content, metadata, tags) — which uses ONLY the stored content
 * + the challenge's metadata/tags to attach the server-owned verified/authored
 * stepped diagram to content.walkthrough — and reports what WOULD change. The
 * graft strips any legacy approach-level stepped diagram and migrates it up to the
 * top-level field, so this also normalises old rows to the new "Visual tab" home.
 *
 * Eligibility per challenge type (mirrors graft.ts's buildWalkthrough routing):
 *   - sql            : buildSteppedPipelineFromMetadata(metadata, tags) != null
 *   - system_design  : optimal approach has an architecture diagram with >= 2 nodes
 *   - data_modeling     so buildSteppedFlowFromContent(content) != null
 *   - algorithm      : buildSteppedTraceFromMetadata(metadata, tags) != null
 *                      (here we target the known verified-eligible families:
 *                       binary_search / fast_slow / kadane)
 *
 * DRY-RUN by default. Prints "would attach walkthrough to <id>" and a per-row
 * summary (id, title, type, walkthrough base.kind, step count, trace_verified).
 * Pass --write to upsert the grafted content back to challenge_solutions with
 * generation_status kept at 'ready' and generated_by left as 'backfill'.
 *
 * Reads the service key from the env file; never hardcode it.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/solutions/backfill-walkthroughs.ts
 *   npx tsx --env-file=.env.local scripts/solutions/backfill-walkthroughs.ts --write
 *
 * Flags:
 *   --write       Actually upsert (default is dry-run, zero writes).
 *   --limit N     Override the per-type cap (default 3).
 */

import { createClient } from '@supabase/supabase-js'
import { SolutionContentSchema, type SolutionContentV1 } from '../../src/lib/solutions/schema'
import { graftSteppedTrace } from '../../src/lib/solutions/trace/graft'
import { buildSteppedTraceFromMetadata } from '../../src/lib/solutions/trace'
import { buildSteppedGridFromMetadata } from '../../src/lib/solutions/trace/gridTrace'
import { buildSteppedSequenceFromMetadata } from '../../src/lib/solutions/trace/sequenceTrace'
import { buildSteppedPipelineFromMetadata } from '../../src/lib/solutions/trace/pipelineTrace'
import { buildSteppedFlowFromContent } from '../../src/lib/solutions/trace/flowWalkthrough'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local)')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const WRITE = process.argv.includes('--write')
function flagValue(name: string): string | null {
  const i = process.argv.indexOf(name)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null
}
const PER_TYPE_LIMIT = Number(flagValue('--limit') ?? '3')

interface ChallengeRow {
  id: string
  title: string | null
  challenge_type: string
  metadata: Record<string, unknown> | null
  topic_tags: string[] | null
  technique_tags: string[] | null
}

/** Pull the stored, ready solution content for a challenge, schema-validated. */
async function fetchStoredContent(challengeId: string): Promise<SolutionContentV1 | null> {
  const { data } = await supabase
    .from('challenge_solutions')
    .select('content, generation_status')
    .eq('challenge_id', challengeId)
    .eq('generation_status', 'ready')
    .maybeSingle()
  if (!data?.content) return null
  const parsed = SolutionContentSchema.safeParse(data.content)
  return parsed.success ? parsed.data : null
}

function tagsOf(c: ChallengeRow): string[] {
  return [...(c.topic_tags ?? []), ...(c.technique_tags ?? [])]
}

/**
 * Cheap gate for the generic execution fallback: does the metadata carry a Python
 * reference AND at least one test case? This mirrors what buildSteppedExecution*
 * needs to even attempt a trace, so the prefilter lets the row through and the
 * graft's single subprocess trace is the authoritative gate (no double-trace).
 */
function hasRunnableReference(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false
  const ref = metadata.reference_solution
  const hasPython =
    (typeof ref === 'string' && ref.trim().length > 0) ||
    (!!ref && typeof ref === 'object' &&
      (typeof (ref as Record<string, unknown>).python === 'string' ||
        typeof (ref as Record<string, unknown>).py === 'string'))
  const hasTests = Array.isArray(metadata.test_cases) && metadata.test_cases.length > 0
  return hasPython && hasTests
}

/**
 * Find up to `limit` challenges of `type` that already have a ready solution and
 * pass the type-appropriate eligibility check (the SAME inputs the runtime graft
 * uses). Returns the challenge rows alongside their stored content so we don't
 * re-fetch.
 */
async function selectEligible(
  type: 'sql' | 'system_design' | 'data_modeling' | 'algorithm',
  limit: number,
): Promise<Array<{ challenge: ChallengeRow; content: SolutionContentV1 }>> {
  // Pull the ready solutions of this type, then test eligibility per row. We scan
  // a generous window because not every row is eligible.
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('id, title, challenge_type, metadata, topic_tags, technique_tags')
    .eq('challenge_type', type)
    .eq('is_published', true)
    .limit(400)
  if (error) {
    console.error(`  query error for ${type}: ${error.message}`)
    return []
  }

  const out: Array<{ challenge: ChallengeRow; content: SolutionContentV1 }> = []
  for (const row of (challenges ?? []) as ChallengeRow[]) {
    if (out.length >= limit) break
    const content = await fetchStoredContent(row.id)
    if (!content) continue // no ready stored solution to graft into
    if (content.challenge_type !== type) continue
    const tags = tagsOf(row)

    // Prefilter mirrors graft.ts's buildWalkthrough routing EXACTLY so the
    // prefilter never disagrees with the graft's actual outcome. The graft is the
    // authoritative gate in the main loop; here we only avoid fetching content for
    // rows that obviously cannot graft.
    let eligible = false
    if (type === 'sql') {
      // Pipeline base floor is 2 (single-CTE = intermediate + result), set in the
      // schema. The graft revalidates; do not impose a stricter floor here. A SQL
      // challenge with a Python reference can also reach the execution fallback, so
      // let a runnable reference through even when the pipeline harness misses.
      eligible =
        (await buildSteppedPipelineFromMetadata(row.metadata ?? {}, tags)) != null ||
        hasRunnableReference(row.metadata)
    } else if (type === 'system_design' || type === 'data_modeling') {
      // Reads the optimal approach's architecture diagram from the stored content.
      eligible = buildSteppedFlowFromContent(content, row.metadata ?? null) != null
    } else if (type === 'algorithm') {
      // The graft tries array -> grid (DP) -> sequence -> generic execution. The
      // first three are cheap synchronous detectors; the execution fallback is an
      // async subprocess we do NOT want to run twice (prefilter + graft), so for the
      // execution path we let any challenge with a runnable Python reference + test
      // cases through and let the graft's single trace be the authoritative gate.
      const meta = row.metadata ?? {}
      eligible =
        buildSteppedTraceFromMetadata(meta, tags) != null ||
        buildSteppedGridFromMetadata(meta, tags) != null ||
        buildSteppedSequenceFromMetadata(meta, tags) != null ||
        hasRunnableReference(meta)
    }
    if (eligible) out.push({ challenge: row, content })
  }
  return out
}

async function main() {
  // --type sql|system_design|data_modeling|algorithm restricts the sweep to one
  // type (comma-separated for several). Default keeps the original mixed batch.
  const typeFlag = flagValue('--type')
  const onlyTypes = typeFlag ? new Set(typeFlag.split(',').map((t) => t.trim())) : null
  const want = (t: string) => !onlyTypes || onlyTypes.has(t)
  console.log(`Mode: ${WRITE ? 'WRITE (will upsert)' : 'DRY-RUN (no writes)'} | per-type cap: ${PER_TYPE_LIMIT}${onlyTypes ? ` | types: ${[...onlyTypes].join(',')}` : ''}\n`)

  // SQL + design (system_design + data_modeling) + algorithm, each gated by --type.
  const sql = want('sql') ? await selectEligible('sql', PER_TYPE_LIMIT) : []
  const sysd = want('system_design') ? await selectEligible('system_design', PER_TYPE_LIMIT) : []
  const dataM = want('data_modeling') ? await selectEligible('data_modeling', PER_TYPE_LIMIT) : []
  const design = [...sysd, ...dataM]
  const algo = want('algorithm') ? await selectEligible('algorithm', PER_TYPE_LIMIT) : []

  const candidates = [...sql, ...design, ...algo]

  let wouldAttach = 0
  let writes = 0
  let notGrafted = 0

  for (const { challenge, content } of candidates) {
    const tags = tagsOf(challenge)
    // IN PLACE: graft against the EXISTING stored content. No AI, no prose regen.
    const { content: grafted, grafted: didGraft } = await graftSteppedTrace(
      content,
      challenge.metadata ?? null,
      tags,
    )

    if (!didGraft || !grafted.walkthrough) {
      notGrafted++
      console.log(`· skip ${challenge.id} (${challenge.challenge_type}) — graft produced no walkthrough`)
      continue
    }

    const w = grafted.walkthrough
    wouldAttach++
    const summary =
      `id=${challenge.id} | "${challenge.title ?? '(untitled)'}" | type=${challenge.challenge_type} | ` +
      `base.kind=${w.base.kind} | steps=${w.steps.length} | trace_verified=${w.trace_verified ?? false}`

    if (WRITE) {
      const { error } = await supabase
        .from('challenge_solutions')
        .update({
          content: grafted,
          generation_status: 'ready',
          generated_by: 'backfill',
          updated_at: new Date().toISOString(),
        })
        .eq('challenge_id', challenge.id)
      if (error) {
        console.error(`✗ ${challenge.id}: update failed: ${error.message}`)
        continue
      }
      writes++
      console.log(`✓ attached walkthrough to ${challenge.id}`)
      console.log(`    ${summary}`)
    } else {
      console.log(`· would attach walkthrough to ${challenge.id}`)
      console.log(`    ${summary}`)
    }
  }

  console.log(
    `\nCandidates: ${candidates.length} (sql=${sql.length}, design=${design.length}, algorithm=${algo.length})`,
  )
  console.log(`Would attach: ${wouldAttach} | not grafted: ${notGrafted} | writes performed: ${writes}`)
  if (!WRITE) console.log('DRY-RUN: 0 writes. Pass --write to upsert.')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
