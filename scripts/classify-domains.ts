#!/usr/bin/env npx tsx
/**
 * Classify published challenges into a theme-based domain and backfill
 * challenges.domain_id.
 *
 * Domains are the theme axis defined in src/lib/data/taxonomy.ts (DOMAINS),
 * distinct from challenge_type. As of the 20260601 seed there are 8:
 *   product-strategy, metrics-analytics, ai-agents, llms, conversions-growth,
 *   system-design, databases-data, algorithms.
 *
 * Classification is deterministic and content-aware. The catalog has clear
 * signals (verified during planning):
 *   - AI/LLM themes are detectable from scenario text, NOT from topic_tags
 *     (zero flow/quick_take carry AI topic tags, but ~39 challenges mention
 *     LLMs/agents/RAG/embeddings in their scenario). So AI detection reads the
 *     scenario blob and OVERRIDES the type-based default — a "Vector & Embedding
 *     Store" data_modeling challenge belongs to LLMs, not generic Databases.
 *   - flow/quick_take product themes route by topic_tags (growth/retention/
 *     monetization/conversion -> conversions-growth; metrics/north-star ->
 *     metrics-analytics; else -> product-strategy).
 *   - algorithm -> algorithms; sql/data_modeling -> databases-data;
 *     system_design -> system-design.
 *
 * Idempotent: only touches rows where domain_id IS NULL (so the 55 already-
 * domained challenges and anything assigned at publish time are left alone).
 *
 * Flags:
 *   --dry-run     Print the would-be assignment + distribution, write nothing.
 *   --limit <n>   Process at most n challenges.
 *   --reclassify  Also re-evaluate rows that already have a domain_id (use with
 *                 care; default is NULL-only).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/classify-domains.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/classify-domains.ts --limit 50
 *   npx tsx --env-file=.env.local scripts/classify-domains.ts        # writes ALL null
 */

import { createClient } from '@supabase/supabase-js'
import { DOMAIN_SLUGS, DEFAULT_DOMAIN_SLUG, isValidDomain } from '../src/lib/data/taxonomy'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const RECLASSIFY = args.includes('--reclassify')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined

interface ChallengeRow {
  id: string
  challenge_type: string | null
  title: string | null
  scenario_context: string | null
  scenario_trigger: string | null
  scenario_question: string | null
  topic_tags: string[] | null
  industry_tags: string[] | null
  paradigm: string | null
  domain_id: string | null
}

// Scenario-text signal for AI/LLM/agent themes (topic_tags don't carry these).
const AI_RE =
  /\b(llm|gpt|chatgpt|claude|gemini|prompt(ing|s)?|rag\b|retrieval[- ]augmented|embedding|vector (db|database|search|store)|fine[- ]?tun|inference|hallucinat|copilot|generative ai|genai|ai[- ]native|transformer|attention head|tokeniz|context window|rlhf|knowledge graph|feature store)\b/i
// Agent-specific signal -> ai-agents, otherwise llms.
const AGENT_RE =
  /\b(agent|agentic|tool[- ]use|tool calling|orchestrat|autonomous|multi[- ]agent|mcp\b|workflow automat)\b/i

const GROWTH_TOPICS = new Set([
  'growth', 'retention', 'churn', 'monetization', 'acquisition', 'onboarding',
  'pricing', 'conversion', 'activation', 'engagement', 'virality', 'referral',
  'paywall', 'subscription', 'ltv', 'cac',
])
const METRICS_TOPICS = new Set([
  'north-star', 'metrics', 'analytics', 'experimentation', 'ab-testing',
  'funnel', 'cohort', 'kpi', 'instrumentation',
])

function blobOf(c: ChallengeRow): string {
  return [c.title, c.scenario_context, c.scenario_trigger, c.scenario_question]
    .filter(Boolean)
    .join(' ')
}

function classify(c: ChallengeRow): string {
  const blob = blobOf(c)
  const topics = (c.topic_tags ?? []).map(t => t.toLowerCase())
  const isAgentic = c.paradigm === 'agentic'
  const isAiNative = c.paradigm === 'ai_native'
  const aiText = AI_RE.test(blob)
  const agentText = AGENT_RE.test(blob)

  // 1. AI/LLM is a theme that wins across all types (it's about content, not
  //    format). Signal = agentic/ai_native paradigm OR AI terms in the scenario.
  //    Agent-flavored -> ai-agents; otherwise -> llms.
  if (isAgentic || isAiNative || aiText) {
    if (isAgentic || agentText) return 'ai-agents'
    return 'llms'
  }

  // 2. Format-driven defaults for the technical types.
  switch (c.challenge_type) {
    case 'algorithm':
      return 'algorithms'
    case 'sql':
    case 'data_modeling':
      return 'databases-data'
    case 'system_design':
      return 'system-design'
  }

  // 3. Product types (flow / quick_take / anything else) route by topic theme.
  if (topics.some(t => GROWTH_TOPICS.has(t))) return 'conversions-growth'
  if (topics.some(t => METRICS_TOPICS.has(t))) return 'metrics-analytics'

  // 4. Fallback.
  return DEFAULT_DOMAIN_SLUG
}

async function main() {
  // Resolve slug -> id.
  const { data: domains, error: dErr } = await supabase
    .from('domains')
    .select('id, slug')
    .in('slug', DOMAIN_SLUGS as string[])
  if (dErr) throw dErr
  const slugToId = new Map((domains ?? []).map(d => [d.slug, d.id]))
  for (const slug of DOMAIN_SLUGS) {
    if (!slugToId.has(slug)) {
      console.error(`Domain slug "${slug}" not found in DB. Run the seed migration first.`)
      process.exit(1)
    }
  }

  let query = supabase
    .from('challenges')
    .select('id, challenge_type, title, scenario_context, scenario_trigger, scenario_question, topic_tags, industry_tags, paradigm, domain_id')
    .eq('is_published', true)
  if (!RECLASSIFY) query = query.is('domain_id', null)
  if (LIMIT) query = query.limit(LIMIT)

  const { data: rows, error } = await query
  if (error) throw error
  const challenges = (rows ?? []) as ChallengeRow[]
  console.log(`${DRY_RUN ? '[dry-run] ' : ''}classifying ${challenges.length} challenge(s)${RECLASSIFY ? ' (reclassify mode)' : ' (domain_id IS NULL)'}\n`)

  const dist = new Map<string, number>()
  const updates: { id: string; domain_id: string }[] = []
  for (const c of challenges) {
    const slug = classify(c)
    if (!isValidDomain(slug)) {
      console.error(`  ! classifier produced invalid slug "${slug}" for ${c.id}; using default`)
    }
    const finalSlug = isValidDomain(slug) ? slug : DEFAULT_DOMAIN_SLUG
    dist.set(finalSlug, (dist.get(finalSlug) ?? 0) + 1)
    updates.push({ id: c.id, domain_id: slugToId.get(finalSlug)! })
  }

  console.log('=== assignment distribution ===')
  for (const slug of DOMAIN_SLUGS) {
    console.log(`  ${String(dist.get(slug) ?? 0).padStart(4)}  ${slug}`)
  }
  console.log('')

  if (DRY_RUN) {
    console.log('[dry-run] no writes performed.')
    // Show a sample for spot-checking.
    console.log('\nsample assignments:')
    challenges.slice(0, 15).forEach(c => {
      console.log(`  ${classify(c).padEnd(20)} [${c.challenge_type}] ${(c.title ?? '').slice(0, 70)}`)
    })
    return
  }

  // Write in batches.
  const BATCH = 100
  let written = 0
  for (let i = 0; i < updates.length; i += BATCH) {
    const slice = updates.slice(i, i + BATCH)
    // Per-row update (domain_id only) keyed on id; supabase has no bulk-update-by-id
    // so issue them in parallel within the batch.
    const results = await Promise.all(
      slice.map(u => supabase.from('challenges').update({ domain_id: u.domain_id }).eq('id', u.id))
    )
    for (const r of results) {
      if (r.error) console.error('  update error:', r.error.message)
      else written++
    }
    console.log(`  wrote ${Math.min(i + BATCH, updates.length)}/${updates.length}`)
  }
  console.log(`\nDone. Updated ${written} challenge(s).`)

  // Verify no published challenge remains NULL.
  const { count } = await supabase
    .from('challenges')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .is('domain_id', null)
  console.log(`published challenges still NULL domain_id: ${count ?? 0}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
