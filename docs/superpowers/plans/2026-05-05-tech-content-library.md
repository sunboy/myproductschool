# Tech Content Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive tech content library (data modeling, system design, SQL, LLMs, agentic systems, Claude Code, Codex, etc.) using a sub-agent pipeline — Opus defines the catalog, Haiku scrapes authoritative sources, Sonnet writes chapters, Codex generates illustrations — all inserted into the existing `learn_modules` + `learn_chapters` tables, with catalog UI updated to show track-based grouping.

**Architecture:** Opus runs once to produce `scripts/content/catalog-manifest.json` and `scripts/content/style-guide.md`. An orchestrator script spawns parallel Haiku scraper agents (one per chapter) then parallel Sonnet writer agents (one per chapter), each writing research packs and MDX to disk before upserting to Supabase. The existing chapter reader UI is untouched; only the catalog page (track headers) and module detail page (hook_text per chapter) get minor updates.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (postgres + RLS), `claude` CLI sub-agents, Codex CLI (local), existing `scripts/job-server.ts` patterns for `callClaude` / `parseJson`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/066_learn_track.sql` | Create | Add `track` column to `learn_modules` |
| `src/lib/types.ts` | Modify | Add `track` field to `LearnModule` |
| `src/app/(app)/explore/modules/page.tsx` | Modify | Render track section headers |
| `src/app/(app)/explore/modules/[slug]/page.tsx` | Modify | Show `hook_text` per chapter in chapter list |
| `scripts/content/generate-catalog.ts` | Create | Opus agent → catalog-manifest.json + style-guide.md |
| `scripts/content/run-pipeline.ts` | Create | Orchestrator → spawns Haiku + Sonnet waves, DB upsert |

---

## Task 1: DB Migration — add `track` column

**Files:**
- Create: `supabase/migrations/066_learn_track.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/066_learn_track.sql
alter table public.learn_modules
  add column if not exists track text
  check (track in ('foundations', 'systems', 'ai-llms', 'new-era', 'product-thinking'));

-- Backfill all existing product-thinking modules
update public.learn_modules
  set track = 'product-thinking'
  where track is null;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applied, no errors.

- [ ] **Step 3: Verify column exists**

```bash
npx supabase db execute --sql "select slug, track from learn_modules order by sort_order limit 10;"
```

Expected: all existing rows show `track = 'product-thinking'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/066_learn_track.sql
git commit -m "feat(learn): add track column to learn_modules"
```

---

## Task 2: Add `track` to TypeScript types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add `track` to `LearnModule` interface**

In `src/lib/types.ts`, find the `LearnModule` interface and add `track` after `sort_order`:

```typescript
export interface LearnModule {
  id: string
  slug: string
  name: string
  tagline: string
  difficulty: LearnDifficulty
  chapter_count: number
  est_minutes: number
  cover_color: string
  accent_color: string
  sort_order: number
  track: string | null   // ← add this line
  created_at: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors (pre-existing errors in `supabase/functions/` are acceptable).

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(learn): add track field to LearnModule type"
```

---

## Task 3: Catalog page — track section headers

**Files:**
- Modify: `src/app/(app)/explore/modules/page.tsx`

- [ ] **Step 1: Add track config constant at top of file (after existing `DIFF_CONFIG`)**

```typescript
const TRACK_CONFIG: Record<string, { label: string; accent: string; description: string }> = {
  'foundations':      { label: 'Foundations',      accent: '#4a7c59', description: 'Data modeling, SQL, coding patterns' },
  'systems':          { label: 'Systems',           accent: '#4a4a9c', description: 'System design, distributed systems' },
  'ai-llms':          { label: 'AI & LLMs',         accent: '#c9933a', description: 'LLM internals, agentic systems, RAG' },
  'new-era':          { label: 'New Era',            accent: '#8b46d4', description: 'Claude Code, Codex, agentic workflows' },
  'product-thinking': { label: 'Product Thinking',  accent: '#2a7ab5', description: 'FLOW framework, user models, root cause' },
}

const TRACK_ORDER = ['foundations', 'systems', 'ai-llms', 'new-era', 'product-thinking']
```

- [ ] **Step 2: Replace the module grid rendering logic**

In the page component, after the existing filter state and filtered modules logic, replace the grid JSX with track-grouped rendering. Find the section that renders `filteredModules.map(...)` and replace it with:

```tsx
{/* Group by track when no difficulty filter active, otherwise flat grid */}
{filter === 'all' ? (
  <div className="space-y-10">
    {TRACK_ORDER.map(trackKey => {
      const trackModules = modules.filter(m => (m.track ?? 'product-thinking') === trackKey)
      if (trackModules.length === 0) return null
      const cfg = TRACK_CONFIG[trackKey]
      return (
        <div key={trackKey}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-outline-variant" />
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: cfg.accent }}
              />
              <span className="font-label font-semibold text-sm text-on-surface-variant uppercase tracking-wide">
                {cfg.label}
              </span>
            </div>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trackModules.map((module, i) => (
              <ModuleCard key={module.id} module={module} index={i} />
            ))}
          </div>
        </div>
      )
    })}
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {filteredModules.map((module, i) => (
      <ModuleCard key={module.id} module={module} index={i} />
    ))}
  </div>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/explore/modules/page.tsx
git commit -m "feat(learn): group module catalog by track with section headers"
```

---

## Task 4: Module detail page — show hook_text per chapter

**Files:**
- Modify: `src/app/(app)/explore/modules/[slug]/page.tsx`

- [ ] **Step 1: Find the `ChapterList` sub-component**

Locate the `ChapterList` component inside `src/app/(app)/explore/modules/[slug]/page.tsx`. It renders a list of chapters with title and completion state.

- [ ] **Step 2: Add hook_text below each chapter title**

In the `ChapterList` component, find where `chapter.title` is rendered and add `hook_text` below it:

```tsx
{/* Inside the chapter list item, after the chapter title */}
{chapter.hook_text && (
  <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2 font-body">
    {chapter.hook_text}
  </p>
)}
```

The exact insertion point is within the `map` over chapters, adjacent to the title span. Do not change any other part of the component.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/explore/modules/[slug]/page.tsx
git commit -m "feat(learn): show hook_text per chapter in module detail"
```

---

## Task 5: Catalog generation script (Opus agent)

**Files:**
- Create: `scripts/content/generate-catalog.ts`

This script spawns one Opus sub-agent that reads the topic list and produces `scripts/content/catalog-manifest.json` + `scripts/content/style-guide.md`.

- [ ] **Step 1: Create the output directory**

```bash
mkdir -p scripts/content/research scripts/content/chapters scripts/content/images
```

- [ ] **Step 2: Create `scripts/content/generate-catalog.ts`**

```typescript
#!/usr/bin/env npx ts-node --esm
import { execFileSync, execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'scripts/content')
const MANIFEST_PATH = path.join(CONTENT_DIR, 'catalog-manifest.json')
const STYLE_GUIDE_PATH = path.join(CONTENT_DIR, 'style-guide.md')

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude'

function callClaude(prompt: string): string {
  const result = execFileSync(CLAUDE_BIN, ['-p', '--output-format', 'json'], {
    input: prompt,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  })
  const parsed = JSON.parse(result) as { result: string; is_error: boolean; subtype?: string }
  if (parsed.is_error || parsed.subtype === 'error') throw new Error(parsed.result)
  return parsed.result.trim()
}

function extractJson<T>(raw: string): T {
  const match = raw.match(/```json\n?([\s\S]*?)\n?```/) ?? raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[1] ?? match[0]) as T
}

const TOPICS = [
  'Data Modeling',
  'SQL Mastery',
  'Coding Patterns',
  'System Design',
  'Distributed Systems',
  'LLM Internals',
  'Agentic Systems',
  'RAG & Vector Search',
  'Claude Code',
  'Codex & AI Coding Assistants',
]

const CATALOG_PROMPT = `
You are designing a tech content library for engineers looking to upskill, change roles, or prepare for interviews. The audience ranges from students to senior engineers. Casual newsletter readers are also a first-class audience.

Produce a JSON array of modules across these topics: ${TOPICS.join(', ')}.

Each module must have:
- slug: kebab-case unique identifier
- name: short, specific module name (not generic)
- tagline: one punchy sentence — the sharpest thing about this module
- track: one of "foundations" | "systems" | "ai-llms" | "new-era"
- difficulty: one of "foundation" | "beginner" | "intermediate" | "advanced" | "new-era"
- chapter_titles: array of 5-8 chapter titles — specific, not generic. Each title should make a reader want to click.
- chapter_hooks: array matching chapter_titles length — one sentence per chapter, the most surprising or useful thing in that chapter
- learning_objectives: array of 3-5 concrete things a reader will be able to do after the module
- est_minutes: estimated read time in minutes (800-1200 words per chapter × chapter count ÷ 200 wpm)
- cover_color: dark hex color matching the track
- accent_color: lighter hex accent color matching the track
- sort_order: 1-based integer within the track
- image_needed: array of booleans matching chapter_titles — true if this chapter benefits from a complex architectural illustration (Codex-generated), false if inline HTML/SVG is sufficient

Rules for chapter titles:
- Data Modeling: must include chapters on cardinality explosion, bridge tables, surrogate vs natural keys, slowly changing dimensions, schema evolution
- SQL: must include chapters on index internals, query plan reading, cardinality & join trap, window functions, bridge tables
- LLM Internals: cover attention mechanism, tokenization, RLHF, context windows, KV cache
- Agentic Systems: cover tool use, memory, planning loops, multi-agent coordination, failure modes
- Claude Code: cover slash commands, MCP servers, hooks, sub-agents, CLAUDE.md
- No "Introduction to X" titles — drop into the topic immediately
- Titles read like "Why your query plan lies" not "Understanding query plans"

Respond with ONLY a JSON array. No prose.
`

const STYLE_GUIDE_PROMPT = `
Write a writing style guide for technical chapter authors. This will be given verbatim to AI agents writing chapter content for a tech education platform.

The guide must cover:

1. Voice: Staff engineer thinking out loud. Confident, direct, occasionally opinionated. Never academic, never corporate. Like a great internal doc or a Shreyas Doshi tweet thread.

2. Hard rules (the agent must follow these without exception):
   - No em dashes. Use a comma, a period, or restructure.
   - No AI slop words: delve, leverage, utilize, robust, seamlessly, holistic, navigate, unlock, ensure, tailored, cutting-edge, revolutionary, game-changing, in order to, as well as
   - No padding sentences. Every sentence earns its place.
   - No "in this chapter we will learn..." intros
   - No bullet-point-everything. Use real paragraphs when the idea needs connective tissue.
   - No second-person role framing: never "you are a senior engineer", "as a tech lead", "imagine you work at X". Drop straight into the situation.
   - Coherent sentences. No fragment-style writing ("Four moves. Real problem is upstream.") except in UI chrome.

3. Structure per chapter:
   - hook_text: 1-2 sentences. The sharpest, most surprising thing about this topic. This is the pull quote.
   - Opening: drop straight into the problem or situation. No preamble, no context-setting.
   - Body: 3-5 sections with real examples, real numbers, real tradeoffs. Figures appear inline at the point of explanation.
   - Closing: what to remember, what to do next. One paragraph maximum.

4. Length: 800-1200 words. Dense, not padded. A reader finishes in 6-8 minutes and gets something concrete they can use.

5. Sources: always cite real examples — real company names, real metrics, real incidents. No "a large tech company" vagueness.

Write this as a crisp, usable guide. The agent reading it should be able to internalize it in 2 minutes and apply it immediately.
`

async function main() {
  console.log('Generating catalog manifest via Opus agent...')
  const catalogRaw = callClaude(CATALOG_PROMPT)
  const catalog = extractJson<object[]>(catalogRaw)
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(catalog, null, 2))
  console.log(`Catalog written: ${catalog.length} modules → ${MANIFEST_PATH}`)

  console.log('Generating style guide via Opus agent...')
  const styleGuide = callClaude(STYLE_GUIDE_PROMPT)
  fs.writeFileSync(STYLE_GUIDE_PATH, styleGuide)
  console.log(`Style guide written → ${STYLE_GUIDE_PATH}`)
}

main().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 3: Commit**

```bash
git add scripts/content/generate-catalog.ts
git commit -m "feat(content): add catalog generation script (Opus agent)"
```

---

## Task 6: Pipeline orchestrator script

**Files:**
- Create: `scripts/content/run-pipeline.ts`

This is the main script. It reads `catalog-manifest.json`, spawns Haiku scraper agents in parallel (one per chapter), then spawns Sonnet writer agents in parallel (one per chapter, blocked on Haiku), then upserts to Supabase.

- [ ] **Step 1: Create `scripts/content/run-pipeline.ts`**

```typescript
#!/usr/bin/env npx ts-node --esm
import { execFileSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'scripts/content')
const MANIFEST_PATH = path.join(CONTENT_DIR, 'catalog-manifest.json')
const STYLE_GUIDE_PATH = path.join(CONTENT_DIR, 'style-guide.md')
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude'
const CODEX_BIN = process.env.CODEX_BIN ?? 'codex'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Helpers ──────────────────────────────────────────────────────────────────

function callClaude(prompt: string, model?: string): string {
  const args = ['-p', '--output-format', 'json']
  if (model) args.push('--model', model)
  const result = execFileSync(CLAUDE_BIN, args, {
    input: prompt,
    encoding: 'utf-8',
    maxBuffer: 20 * 1024 * 1024,
  })
  const parsed = JSON.parse(result) as { result: string; is_error: boolean; subtype?: string }
  if (parsed.is_error || parsed.subtype === 'error') throw new Error(parsed.result)
  return parsed.result.trim()
}

function callCodex(brief: string, outputPath: string): void {
  // Codex CLI generates an image from the brief and saves to outputPath
  // See: https://community.openai.com/t/introducing-codex-plugin-for-claude-code/1378186
  execFileSync(CODEX_BIN, ['generate-image', '--prompt', brief, '--output', outputPath], {
    encoding: 'utf-8',
    maxBuffer: 5 * 1024 * 1024,
  })
}

function extractJson<T>(raw: string): T {
  const match = raw.match(/```json\n?([\s\S]*?)\n?```/) ?? raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[1] ?? match[0]) as T
}

function researchPath(moduleSlug: string, chapterSlug: string): string {
  return path.join(CONTENT_DIR, 'research', moduleSlug, `${chapterSlug}.json`)
}

function chapterPath(moduleSlug: string, chapterSlug: string): string {
  return path.join(CONTENT_DIR, 'chapters', moduleSlug, `${chapterSlug}.mdx`)
}

function imagePath(moduleSlug: string, chapterSlug: string): string {
  return path.join(CONTENT_DIR, 'images', moduleSlug, `${chapterSlug}.png`)
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── Haiku Research Agent ──────────────────────────────────────────────────────

function runHaikuScraper(moduleSlug: string, chapterSlug: string, chapterTitle: string, objectives: string[]): void {
  const outPath = researchPath(moduleSlug, chapterSlug)
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] research exists: ${moduleSlug}/${chapterSlug}`)
    return
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true })

  const prompt = `
You are a research agent. Gather raw material for a tech education chapter.

Chapter: "${chapterTitle}"
Learning objectives: ${objectives.map(o => `- ${o}`).join('\n')}

Search the web and authoritative sources. Priority sources (in order):
1. Official docs: Anthropic docs, OpenAI docs, official GitHub repos
2. Engineering blogs: Netflix Tech Blog, Databricks Blog, Meta Engineering, Google Research, Cloudflare Blog, Stripe Engineering
3. Academic: Harvard CS, Stanford CS course materials
4. Recency: prefer content published in the last 18 months. Flag anything older than 2 years as potentially stale.

For data modeling / SQL topics, explicitly cover: cardinality explosion, bridge tables, surrogate vs natural keys, slowly changing dimensions, schema evolution, index internals, query plan reading.

Collect and return a JSON object with:
- facts: array of concrete, specific facts with source URLs and publication dates
- examples: array of real-world examples (real company names, real metrics, real incidents — no vague "a large tech company")
- analogies: array of analogies that make abstract concepts concrete
- key_numbers: array of specific metrics, benchmarks, thresholds that appear in authoritative sources
- common_misconceptions: array of things engineers commonly get wrong about this topic
- source_urls: array of URLs used (with recency notes)

Respond with ONLY the JSON object. No prose.
`

  console.log(`  [haiku] researching: ${moduleSlug}/${chapterSlug}`)
  const raw = callClaude(prompt, 'claude-haiku-4-5-20251001')
  const research = extractJson<object>(raw)
  fs.writeFileSync(outPath, JSON.stringify(research, null, 2))
}

// ── Sonnet Writer Agent ───────────────────────────────────────────────────────

function runSonnetWriter(
  moduleSlug: string,
  chapterSlug: string,
  chapterTitle: string,
  chapterHook: string,
  imageNeeded: boolean,
  styleGuide: string
): { hook_text: string; body_mdx: string } {
  const mdxOut = chapterPath(moduleSlug, chapterSlug)
  if (fs.existsSync(mdxOut)) {
    console.log(`  [skip] chapter exists: ${moduleSlug}/${chapterSlug}`)
    const content = JSON.parse(fs.readFileSync(mdxOut, 'utf-8')) as { hook_text: string; body_mdx: string }
    return content
  }
  fs.mkdirSync(path.dirname(mdxOut), { recursive: true })

  const research = JSON.parse(fs.readFileSync(researchPath(moduleSlug, chapterSlug), 'utf-8'))

  let imageInstruction = ''
  if (imageNeeded) {
    const imgPath = imagePath(moduleSlug, chapterSlug)
    if (!fs.existsSync(imgPath)) {
      fs.mkdirSync(path.dirname(imgPath), { recursive: true })
      const brief = `Technical diagram for: "${chapterTitle}". Style: clean, minimal, dark background, with labeled components and arrows. For a tech education platform.`
      console.log(`  [codex] generating image: ${moduleSlug}/${chapterSlug}`)
      try {
        callCodex(brief, imgPath)
        imageInstruction = `\nInclude this image in the body_mdx at the most relevant point: ![${chapterTitle}](/content-images/${moduleSlug}/${chapterSlug}.png)`
      } catch (e) {
        console.warn(`  [codex] image generation failed, continuing without image: ${e}`)
      }
    } else {
      imageInstruction = `\nInclude this image in the body_mdx at the most relevant point: ![${chapterTitle}](/content-images/${moduleSlug}/${chapterSlug}.png)`
    }
  }

  const prompt = `
${styleGuide}

---

You are writing a chapter for a tech education platform. Write for engineers who want to upskill, find a job, or prepare for interviews. Casual readers who skim newsletters are also in the audience — earn their attention.

Chapter title: "${chapterTitle}"
Suggested hook: "${chapterHook}" (you can improve this, but keep the sharpness)

Research material:
${JSON.stringify(research, null, 2)}

${imageInstruction}

Write and return a JSON object with exactly these fields:
- hook_text: 1-2 sentences, the sharpest most surprising thing about this topic. This is the pull quote shown in the chapter list.
- body_mdx: the full chapter body in MDX/Markdown. 800-1200 words. Use real headings (##), real code blocks (\`\`\`sql, \`\`\`typescript, etc.), and inline figures where they help. No padding.

Respond with ONLY the JSON object. No prose before or after.
`

  console.log(`  [sonnet] writing: ${moduleSlug}/${chapterSlug}`)
  const raw = callClaude(prompt, 'claude-sonnet-4-6')
  const chapter = extractJson<{ hook_text: string; body_mdx: string }>(raw)
  fs.writeFileSync(mdxOut, JSON.stringify(chapter, null, 2))
  return chapter
}

// ── Supabase Upsert ───────────────────────────────────────────────────────────

async function upsertModule(mod: {
  slug: string; name: string; tagline: string; track: string; difficulty: string;
  est_minutes: number; cover_color: string; accent_color: string; sort_order: number;
  chapter_count: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from('learn_modules')
    .upsert(mod, { onConflict: 'slug' })
    .select('id')
    .single()
  if (error) throw new Error(`upsert module ${mod.slug}: ${error.message}`)
  return data.id
}

async function upsertChapter(chapter: {
  module_id: string; slug: string; title: string; subtitle: string;
  sort_order: number; hook_text: string; body_mdx: string;
}): Promise<void> {
  const { error } = await supabase
    .from('learn_chapters')
    .upsert(chapter, { onConflict: 'module_id,slug' })
  if (error) throw new Error(`upsert chapter ${chapter.slug}: ${error.message}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface ManifestModule {
  slug: string
  name: string
  tagline: string
  track: string
  difficulty: string
  chapter_titles: string[]
  chapter_hooks: string[]
  learning_objectives: string[]
  est_minutes: number
  cover_color: string
  accent_color: string
  sort_order: number
  image_needed: boolean[]
}

async function main() {
  const manifest: ManifestModule[] = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  const styleGuide = fs.readFileSync(STYLE_GUIDE_PATH, 'utf-8')

  // Filter to only run specific modules if MODULE_SLUG env var is set (useful for pilots)
  const targetSlug = process.env.MODULE_SLUG
  const modules = targetSlug ? manifest.filter(m => m.slug === targetSlug) : manifest

  console.log(`Running pipeline for ${modules.length} module(s)...`)

  for (const mod of modules) {
    console.log(`\n[module] ${mod.slug}`)
    const chapterSlugs = mod.chapter_titles.map(slugify)

    // Wave 1: Haiku scrapers in parallel
    console.log(`  Launching ${chapterSlugs.length} Haiku scraper agents...`)
    await Promise.all(
      chapterSlugs.map((cs, i) =>
        Promise.resolve().then(() =>
          runHaikuScraper(mod.slug, cs, mod.chapter_titles[i], mod.learning_objectives)
        )
      )
    )

    // Wave 2: Sonnet writers in parallel (research packs now exist)
    console.log(`  Launching ${chapterSlugs.length} Sonnet writer agents...`)
    const chapters = await Promise.all(
      chapterSlugs.map((cs, i) =>
        Promise.resolve().then(() =>
          runSonnetWriter(
            mod.slug, cs,
            mod.chapter_titles[i],
            mod.chapter_hooks[i] ?? '',
            mod.image_needed[i] ?? false,
            styleGuide
          )
        )
      )
    )

    // DB upsert
    console.log(`  Upserting to Supabase...`)
    const moduleId = await upsertModule({
      slug: mod.slug,
      name: mod.name,
      tagline: mod.tagline,
      track: mod.track,
      difficulty: mod.difficulty,
      est_minutes: mod.est_minutes,
      cover_color: mod.cover_color,
      accent_color: mod.accent_color,
      sort_order: mod.sort_order,
      chapter_count: chapterSlugs.length,
    })

    for (let i = 0; i < chapterSlugs.length; i++) {
      await upsertChapter({
        module_id: moduleId,
        slug: chapterSlugs[i],
        title: mod.chapter_titles[i],
        subtitle: mod.chapter_hooks[i] ?? '',
        sort_order: i + 1,
        hook_text: chapters[i].hook_text,
        body_mdx: chapters[i].body_mdx,
      })
    }

    console.log(`  [done] ${mod.slug} — ${chapterSlugs.length} chapters inserted`)
  }

  console.log('\nPipeline complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: Commit**

```bash
git add scripts/content/run-pipeline.ts
git commit -m "feat(content): add pipeline orchestrator (Haiku scrape + Sonnet write + Codex + DB upsert)"
```

---

## Task 7: End-to-end verification

- [ ] **Step 1: Generate the catalog**

```bash
npx ts-node --esm scripts/content/generate-catalog.ts
```

Expected: `scripts/content/catalog-manifest.json` and `scripts/content/style-guide.md` created. Inspect manifest — should have 8-12 modules with specific chapter titles.

- [ ] **Step 2: Run a pilot — one Foundations module**

```bash
MODULE_SLUG=data-modeling npx ts-node --esm scripts/content/run-pipeline.ts
```

(Use whichever slug Opus assigned to the data modeling module.)

Expected: research JSON files in `scripts/content/research/data-modeling/`, MDX files in `scripts/content/chapters/data-modeling/`, rows in Supabase `learn_modules` and `learn_chapters`.

- [ ] **Step 3: Run a pilot — one AI module**

```bash
MODULE_SLUG=llm-internals npx ts-node --esm scripts/content/run-pipeline.ts
```

Expected: same pattern for the LLM internals module.

- [ ] **Step 4: Check Supabase rows**

```bash
npx supabase db execute --sql "select slug, track, chapter_count from learn_modules order by sort_order;"
```

Expected: existing product-thinking modules with `track = 'product-thinking'`, plus new modules with correct tracks.

- [ ] **Step 5: Start dev server and check catalog page**

```bash
npm run dev
```

Open `http://localhost:3000/explore/modules`. Expected: track section headers visible — "Foundations", "AI & LLMs" etc. Modules grouped under correct tracks. Difficulty filter still works across all tracks.

- [ ] **Step 6: Check module detail page**

Click into a newly generated module. Expected: chapter list shows `hook_text` as a subtitle line below each chapter title.

- [ ] **Step 7: Check chapter reader**

Click into a chapter. Expected: existing reader renders the new `body_mdx` content correctly (headings, code blocks, markdown).

- [ ] **Step 8: Run full pipeline**

```bash
npx ts-node --esm scripts/content/run-pipeline.ts
```

Expected: all modules in the manifest processed. Already-completed chapters skipped (resumable). Final Supabase state: all modules and chapters inserted.

- [ ] **Step 9: TypeScript clean**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

Expected: no errors outside `supabase/functions/`.

- [ ] **Step 10: Final commit**

```bash
git add .
git commit -m "feat(learn): tech content library — catalog, pipeline, UI"
```
