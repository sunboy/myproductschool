// Seed the "Learn Claude Code" study plan (the third artifact).
//
// 1. Upsert all claude-code-mastery chapter mdx files into learn_chapters under
//    the existing 'claude-code-mastery' learn_module (creating the module if
//    absent).
// 2. Create/refresh a 'learn-claude-code' study_plans row.
// 3. Create study_plan_chapters that reference each learn_chapter via
//    learn_chapter_id (lesson chapters, not challenge chapters), in course order.
//
// Idempotent: re-running upserts by slug/order. Uses supabase-js (no DDL — the
// learn_chapter_id column comes from migration 20260602140000).
//
// Run: npx tsx scripts/content/seed-learn-claude-code.ts   (loads .env.local)

import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

const CHAPTERS_DIR = join(process.cwd(), 'scripts/content/chapters/claude-code-mastery')
const MODULE_SLUG = 'claude-code-mastery'
const PLAN_SLUG = 'learn-claude-code'

// Course order + display titles, keyed by mdx filename slug. Order reflects the
// learning path: basics → skills → subagents → MCP intro → MCP advanced →
// plugins → harness/permissions → context → planning → hooks → (+ CLAUDE.md,
// worktrees as applied practice).
const ORDER: { slug: string; title: string }[] = [
  { slug: 'getting-started-with-claude-code-driving-an-agent-not-writing-code', title: 'Getting Started: Driving an Agent, Not Writing Code' },
  { slug: 'claude-md-as-a-behavioral-contract-writing-instructions-that-stick', title: 'CLAUDE.md as a Behavioral Contract' },
  { slug: 'slash-commands-and-skills-extending-claude-code-with-custom-workflows', title: 'Agent Skills and Slash Commands' },
  { slug: 'sub-agents-in-claude-code-spawning-parallel-workers-from-the-orchestrator', title: 'Subagents: Parallel Workers From the Orchestrator' },
  { slug: 'mcp-servers-giving-claude-code-eyes-and-hands-beyond-the-filesystem', title: 'MCP: Giving Claude Tools Beyond the Filesystem' },
  { slug: 'mcp-advanced-tools-resources-prompts-transports-and-sampling', title: 'MCP Advanced: Tools, Resources, Transports, Sampling' },
  { slug: 'plugins-packaging-skills-commands-and-mcp-into-installable-units', title: 'Plugins: Packaging Skills, Commands, and MCP' },
  { slug: 'permission-modes-and-trust-levels-what-bypasspermissions-actually-means', title: 'The Harness: Permission Modes and Trust Levels' },
  { slug: 'context-management-keeping-the-window-lean-for-better-output', title: 'Context Management: Keeping the Window Lean' },
  { slug: 'planning-and-plan-mode-think-before-you-edit', title: 'Planning and Plan Mode: Think Before You Edit' },
  { slug: 'hooks-pre-task-post-task-and-the-self-learning-loop', title: 'Hooks and Automation: The Self-Learning Loop' },
  { slug: 'worktrees-for-isolation-why-parallel-agents-need-separate-git-contexts', title: 'Worktrees: Isolation for Parallel Agents' },
]

async function main() {
  // ── 1. Module ──
  let { data: mod } = await sb.from('learn_modules').select('id').eq('slug', MODULE_SLUG).maybeSingle()
  if (!mod) {
    const { data, error } = await sb.from('learn_modules').insert({
      slug: MODULE_SLUG,
      name: 'Claude Code: From Zero to Autonomous Development Workflows',
      tagline: 'Drive an AI coding agent like a senior engineer',
      difficulty: 'intermediate',
      est_minutes: 12 * 9,
      track: 'new-era',
      sort_order: 1,
    }).select('id').single()
    if (error) throw error
    mod = data
  }
  const moduleId = mod!.id

  // ── 2. Upsert chapters from mdx ──
  const files = new Set(readdirSync(CHAPTERS_DIR).filter((f) => f.endsWith('.mdx')))
  const chapterIdBySlug: Record<string, string> = {}
  let order = 0
  for (const { slug, title } of ORDER) {
    const file = `${slug}.mdx`
    if (!files.has(file)) {
      console.warn(`[seed] missing mdx for ${slug}, skipping`)
      continue
    }
    const raw = JSON.parse(readFileSync(join(CHAPTERS_DIR, file), 'utf8')) as {
      hook_text?: string
      body_mdx: string
    }
    const { data: existing } = await sb
      .from('learn_chapters')
      .select('id')
      .eq('module_id', moduleId)
      .eq('slug', slug)
      .maybeSingle()

    const row = {
      module_id: moduleId,
      slug,
      title,
      sort_order: order,
      hook_text: raw.hook_text ?? '',
      body_mdx: raw.body_mdx,
    }
    if (existing) {
      await sb.from('learn_chapters').update(row).eq('id', existing.id)
      chapterIdBySlug[slug] = existing.id
    } else {
      const { data, error } = await sb.from('learn_chapters').insert(row).select('id').single()
      if (error) throw error
      chapterIdBySlug[slug] = data.id
    }
    order++
  }
  await sb.from('learn_modules').update({ chapter_count: order }).eq('id', moduleId)
  console.log(`[seed] upserted ${order} chapters`)

  // ── 3. Study plan ──
  let { data: plan } = await sb.from('study_plans').select('id').eq('slug', PLAN_SLUG).maybeSingle()
  if (!plan) {
    const { data, error } = await sb.from('study_plans').insert({
      slug: PLAN_SLUG,
      title: 'Learn Claude Code',
      description: 'A guided path through driving an AI coding agent: skills, subagents, MCP, the harness, context, planning, and automation.',
      estimated_hours: 3,
      is_published: true,
    }).select('id').single()
    if (error) throw error
    plan = data
  }
  const planId = plan!.id

  // Refresh the plan's lesson chapters (delete + reinsert for idempotency).
  await sb.from('study_plan_chapters').delete().eq('plan_id', planId)
  let chOrder = 0
  for (const { slug, title } of ORDER) {
    const learnChapterId = chapterIdBySlug[slug]
    if (!learnChapterId) continue
    const { error } = await sb.from('study_plan_chapters').insert({
      plan_id: planId,
      title,
      order_index: chOrder,
      learn_chapter_id: learnChapterId,
      challenge_ids: [],
    })
    if (error) throw error
    chOrder++
  }
  console.log(`[seed] study plan '${PLAN_SLUG}' with ${chOrder} lesson chapters`)
  console.log('[seed] done')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
