#!/usr/bin/env npx ts-node --esm
import { execFileSync, spawn } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

function spawnClaude(prompt: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(CLAUDE_BIN, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    const chunks: Buffer[] = []
    const errChunks: Buffer[] = []
    proc.stdout.on('data', (d: Buffer) => chunks.push(d))
    proc.stderr.on('data', (d: Buffer) => errChunks.push(d))
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error(`claude exited ${code}: ${Buffer.concat(errChunks).toString()}`))
      else resolve(Buffer.concat(chunks).toString('utf-8'))
    })
    proc.stdin.write(prompt, 'utf-8')
    proc.stdin.end()
  })
}

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

async function callClaude(prompt: string, model?: string, tools?: string[]): Promise<string> {
  const args = ['-p', '--output-format', 'json']
  if (model) args.push('--model', model)
  if (tools?.length) args.push('--allowedTools', tools.join(','))
  const raw = await spawnClaude(prompt, args)
  const parsed = JSON.parse(raw) as { result: string; is_error: boolean; subtype?: string }
  if (parsed.is_error || parsed.subtype === 'error') throw new Error(parsed.result)
  return parsed.result.trim()
}

async function callCodex(brief: string, outputPath: string): Promise<void> {
  execFileSync(CODEX_BIN, ['generate-image', brief, '--output', outputPath], {
    encoding: 'utf-8',
    maxBuffer: 5 * 1024 * 1024,
  })
}

function extractJson<T>(raw: string, context?: string): T {
  const match = raw.match(/```json\n?([\s\S]*?)\n?```/) ?? raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
  if (!match) throw new Error(`No JSON found in response${context ? ` (${context})` : ''}.\nRaw (first 500): ${raw.slice(0, 500)}`)
  return JSON.parse(match[1] ?? match[0]) as T
}

// Run promises with a max concurrency limit
async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let index = 0
  async function worker() {
    while (index < tasks.length) {
      const i = index++
      results[i] = await tasks[i]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker))
  return results
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

async function runHaikuScraper(
  moduleSlug: string,
  chapterSlug: string,
  chapterTitle: string,
  objectives: string[]
): Promise<void> {
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

For context engineering topics, cover: context window constraints, cache-aware prompt design, retrieval-augmented patterns, context poisoning risks.

For agent memory topics, cover: working memory patterns, episodic memory in agent systems, vector-based semantic memory, memory consolidation.

For sub-agents / orchestration topics, cover: spawning patterns, task decomposition strategies, parallel vs sequential execution tradeoffs, result synthesis, error propagation.

For harness engineering topics, cover: evaluation frameworks for LLMs, golden dataset construction, regression testing, prompt versioning systems.

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
  const raw = await callClaude(prompt, 'claude-haiku-4-5-20251001', ['WebSearch', 'WebFetch'])
  const research = extractJson<object>(raw, `${moduleSlug}/${chapterSlug}`)
  fs.writeFileSync(outPath, JSON.stringify(research, null, 2))
}

// ── Sonnet Writer Agent ───────────────────────────────────────────────────────

async function runSonnetWriter(
  moduleSlug: string,
  chapterSlug: string,
  chapterTitle: string,
  chapterHook: string,
  imageNeeded: boolean,
  styleGuide: string
): Promise<{ hook_text: string; body_mdx: string }> {
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
      const brief = `Technical diagram for: "${chapterTitle}". Style: clean, minimal, dark background, labeled components and arrows. For a tech education platform.`
      console.log(`  [codex] generating image: ${moduleSlug}/${chapterSlug}`)
      try {
        await callCodex(brief, imgPath)
        imageInstruction = `\nInclude this image in the body_mdx at the most relevant point: ![${chapterTitle}](/content-images/${moduleSlug}/${chapterSlug}.png)`
      } catch {
        console.warn(`  [codex] image generation failed for ${moduleSlug}/${chapterSlug}, continuing without image`)
      }
    } else {
      imageInstruction = `\nInclude this image in the body_mdx at the most relevant point: ![${chapterTitle}](/content-images/${moduleSlug}/${chapterSlug}.png)`
    }
  }

  const diagramInstruction = imageInstruction
    ? imageInstruction
    : `
When a concept benefits from a visual (architecture flow, decision tree, data shape), include a Mermaid diagram in a \`\`\`mermaid code block or a plain ASCII diagram. Do not describe diagrams in prose — render them inline at the point of explanation. At least one diagram per chapter if the topic is architectural.`

  const prompt = `
${styleGuide}

---

CRITICAL RULES (repeat from the guide above — these are enforced mechanically after you write):
1. Em dashes (—) are BANNED. Zero exceptions. Use a comma, a period, or rewrite the sentence. If you write an em dash, the chapter will be rejected.
2. No AI slop words.
3. No second-person role framing.

---

You are writing a chapter for a tech education platform. Write for engineers who want to upskill, find a job, or prepare for interviews. Casual readers who skim newsletters are also in the audience — earn their attention.

Chapter title: "${chapterTitle}"
Suggested hook: "${chapterHook}" (you can improve this, but keep the sharpness)

Research material:
${JSON.stringify(research, null, 2)}

${diagramInstruction}

Output your response in this EXACT format with these two delimiters on their own lines:

===HOOK===
<1-2 sentences: the sharpest most surprising thing about this topic. This is the pull quote shown in the chapter list.>
===BODY===
<full chapter body in Markdown. 800-1200 words. Use real headings (##), real code blocks, inline diagrams where they help. No padding.>
===END===
`

  console.log(`  [sonnet] writing: ${moduleSlug}/${chapterSlug}`)
  const raw = await callClaude(prompt, 'claude-sonnet-4-6')

  const hookMatch = raw.match(/===HOOK===\n([\s\S]*?)\n===BODY===/)
  const bodyMatch = raw.match(/===BODY===\n([\s\S]*?)\n===END===/)
  if (!hookMatch || !bodyMatch) {
    throw new Error(`Sonnet output missing delimiters for ${moduleSlug}/${chapterSlug}.\nRaw (first 300): ${raw.slice(0, 300)}`)
  }

  // Strip any em dashes the model produced despite the ban
  const sanitize = (s: string) => s.replace(/—/g, ',').replace(/ , /g, ', ')

  const chapter = {
    hook_text: sanitize(hookMatch[1].trim()),
    body_mdx: sanitize(bodyMatch[1].trim()),
  }
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
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Manifest not found at ${MANIFEST_PATH}. Run generate-catalog.ts first.`)
    process.exit(1)
  }
  if (!fs.existsSync(STYLE_GUIDE_PATH)) {
    console.error(`Style guide not found at ${STYLE_GUIDE_PATH}. Run generate-catalog.ts first.`)
    process.exit(1)
  }

  const manifest: ManifestModule[] = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  const styleGuide = fs.readFileSync(STYLE_GUIDE_PATH, 'utf-8')

  // Filter to only run specific modules if MODULE_SLUG env var is set
  const targetSlug = process.env.MODULE_SLUG
  const modules = targetSlug ? manifest.filter(m => m.slug === targetSlug) : manifest

  console.log(`Running pipeline for ${modules.length} module(s)...`)

  for (const mod of modules) {
    console.log(`\n[module] ${mod.slug}`)
    const chapterSlugs = mod.chapter_titles.map(slugify)

    const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '3', 10)

    // Wave 1: Haiku scrapers in parallel (capped at CONCURRENCY)
    console.log(`  Launching ${chapterSlugs.length} Haiku scraper agents (concurrency=${CONCURRENCY})...`)
    await pLimit(
      chapterSlugs.map((cs, i) => () =>
        runHaikuScraper(mod.slug, cs, mod.chapter_titles[i], mod.learning_objectives)
      ),
      CONCURRENCY
    )

    // Wave 2: Sonnet writers in parallel (research packs now exist)
    console.log(`  Launching ${chapterSlugs.length} Sonnet writer agents (concurrency=${CONCURRENCY})...`)
    const chapters = await pLimit(
      chapterSlugs.map((cs, i) => () =>
        runSonnetWriter(
          mod.slug, cs,
          mod.chapter_titles[i],
          mod.chapter_hooks[i] ?? '',
          mod.image_needed[i] ?? false,
          styleGuide
        )
      ),
      CONCURRENCY
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
