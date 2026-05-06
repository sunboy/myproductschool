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

function runHaikuScraper(
  moduleSlug: string,
  chapterSlug: string,
  chapterTitle: string,
  objectives: string[]
): void {
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
      const brief = `Technical diagram for: "${chapterTitle}". Style: clean, minimal, dark background, labeled components and arrows. For a tech education platform.`
      console.log(`  [codex] generating image: ${moduleSlug}/${chapterSlug}`)
      try {
        callCodex(brief, imgPath)
        imageInstruction = `\nInclude this image in the body_mdx at the most relevant point: ![${chapterTitle}](/content-images/${moduleSlug}/${chapterSlug}.png)`
      } catch {
        console.warn(`  [codex] image generation failed for ${moduleSlug}/${chapterSlug}, continuing without image`)
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
