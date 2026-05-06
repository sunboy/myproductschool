#!/usr/bin/env npx ts-node --esm
import { execFileSync } from 'child_process'
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
  // Foundations track
  'Data Modeling',
  'SQL Mastery',
  'Coding Patterns',
  // Systems track
  'System Design',
  'Distributed Systems',
  // AI & LLMs track
  'LLM Internals',
  'Agentic Systems',
  'RAG & Vector Search',
  'Context Engineering',
  'Agent Memory',
  // New Era track
  'Claude Code',
  'Codex & AI Coding Assistants',
  'Sub-agents & Orchestration',
  'Harness Engineering',
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
- image_needed: array of booleans matching chapter_titles — true if this chapter benefits from a complex architectural illustration, false if inline HTML/SVG is sufficient

Rules for chapter titles:
- Data Modeling: must include chapters on cardinality explosion, bridge tables, surrogate vs natural keys, slowly changing dimensions, schema evolution
- SQL: must include chapters on index internals, query plan reading, cardinality & join trap, window functions
- LLM Internals: cover attention mechanism, tokenization, RLHF, context windows, KV cache
- Agentic Systems: cover tool use, memory, planning loops, multi-agent coordination, failure modes
- Context Engineering: cover context window management, prompt structure, cache-aware design, retrieval patterns, context poisoning
- Agent Memory: cover short-term working memory, episodic memory, semantic memory (vector), procedural memory, memory consolidation patterns
- Sub-agents & Orchestration: cover spawning patterns, task decomposition, parallel vs sequential execution, result synthesis, error propagation
- Harness Engineering: cover evaluation frameworks, test harnesses for AI pipelines, golden datasets, regression testing for LLMs, prompt versioning
- Claude Code: cover slash commands, MCP servers, hooks, sub-agents, CLAUDE.md, permission modes
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
   - Coherent sentences. No fragment-style writing except in UI chrome.

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
  fs.mkdirSync(CONTENT_DIR, { recursive: true })

  if (fs.existsSync(MANIFEST_PATH)) {
    console.log(`Manifest already exists at ${MANIFEST_PATH} — delete it to regenerate`)
  } else {
    console.log('Generating catalog manifest via Opus agent...')
    const catalogRaw = callClaude(CATALOG_PROMPT)
    const catalog = extractJson<object[]>(catalogRaw)
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(catalog, null, 2))
    console.log(`Catalog written: ${catalog.length} modules → ${MANIFEST_PATH}`)
  }

  if (fs.existsSync(STYLE_GUIDE_PATH)) {
    console.log(`Style guide already exists at ${STYLE_GUIDE_PATH} — delete it to regenerate`)
  } else {
    console.log('Generating style guide via Opus agent...')
    const styleGuide = callClaude(STYLE_GUIDE_PROMPT)
    fs.writeFileSync(STYLE_GUIDE_PATH, styleGuide)
    console.log(`Style guide written → ${STYLE_GUIDE_PATH}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
