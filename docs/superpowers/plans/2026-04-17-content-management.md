# Content Management Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI-powered content authoring pipeline that turns a URL/article/question into a fully structured HackProduct challenge (scenario + 4 FLOW steps × MCQs grounded in intellectual themes), with a human review UI and one-click publish to production tables.

**Architecture:** Browser admin UI → Next.js API routes → either (a) local job server polling DB and shelling out to Claude Code CLI, or (b) Anthropic SDK inline — controlled by `GENERATION_MODE` env var. Draft challenges stored as JSONB, exploded to production tables on publish.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (postgres + supabase-js), Anthropic SDK (`@anthropic-ai/sdk`), Playwright (E2E), Tailwind/Material3 Terra design system.

---

## File Map

| File | Role |
|------|------|
| `supabase/migrations/035_content_management.sql` | `generation_jobs` + `draft_challenges` tables |
| `src/lib/types.ts` | Add `GenerationJob`, `DraftChallenge`, `ChallengeJson` types |
| `src/lib/content/validator.ts` | Structural validation of `ChallengeJson` |
| `src/lib/content/scraper.ts` | URL → readable text via cheerio |
| `src/lib/content/prompts.ts` | All Claude prompt templates (scrape, generate, nudge, tag) |
| `src/lib/content/generator.ts` | Orchestrates Haiku scrape + Sonnet generation via Anthropic SDK |
| `src/lib/content/publisher.ts` | Explodes `ChallengeJson` → production DB rows |
| `src/app/api/admin/content/jobs/route.ts` | POST create job, GET list jobs |
| `src/app/api/admin/content/jobs/[id]/route.ts` | GET poll job + draft |
| `src/app/api/admin/content/drafts/[id]/route.ts` | PATCH inline edit |
| `src/app/api/admin/content/drafts/[id]/approve-step/route.ts` | POST approve one step |
| `src/app/api/admin/content/drafts/[id]/approve-all/route.ts` | POST bulk approve |
| `src/app/api/admin/content/drafts/[id]/publish/route.ts` | POST explode + publish |
| `src/app/api/admin/content/drafts/[id]/regenerate-step/route.ts` | POST re-gen one step |
| `scripts/job-server.ts` | Local polling job runner (shells out to `claude` CLI) |
| `src/app/(admin)/admin/content/page.tsx` | Extend with jobs list + authoring drawer |
| `src/app/(admin)/admin/content/review/[job_id]/page.tsx` | New review page |
| `e2e/content-management.spec.ts` | Playwright E2E tests |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/035_content_management.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/035_content_management.sql

CREATE TABLE generation_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_type    text NOT NULL CHECK (input_type IN ('url', 'text', 'question')),
  input_raw     text NOT NULL,
  scraped_text  text,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','scraping','generating','review','published','failed')),
  mode          text NOT NULL DEFAULT 'local' CHECK (mode IN ('local','api')),
  result_challenge_id text REFERENCES challenges(id),
  error_message text,
  created_by    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE draft_challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid REFERENCES generation_jobs(id),
  challenge_json  jsonb NOT NULL,
  review_status   text NOT NULL DEFAULT 'pending_review'
                  CHECK (review_status IN ('pending_review','approved','rejected')),
  step_approvals  jsonb NOT NULL DEFAULT '{}',
  reviewer_notes  text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX generation_jobs_status_idx ON generation_jobs(status);
CREATE INDEX draft_challenges_job_id_idx ON draft_challenges(job_id);
```

- [ ] **Step 2: Apply migration**

```bash
cd /Users/sandeep/Projects/myproductschool/.worktrees/content
npx supabase db push
```

Expected: `Applying migration 035_content_management.sql... done`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/035_content_management.sql
git commit -m "feat(content): add generation_jobs and draft_challenges tables"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/lib/types.ts` (append at end)

- [ ] **Step 1: Add types**

Open `src/lib/types.ts` and append:

```typescript
// ─── Content Management ───────────────────────────────────────────────────────

export type IntellectualTheme = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'

export type GenerationJobStatus =
  | 'pending' | 'scraping' | 'generating' | 'review' | 'published' | 'failed'

export type GenerationMode = 'local' | 'api'

export type ReviewStatus = 'pending_review' | 'approved' | 'rejected'

export interface DraftOption {
  label: 'A' | 'B' | 'C' | 'D'
  quality: OptionQuality
  text: string
  explanation: string
  competencies: string[]
}

export interface DraftQuestion {
  question_text: string
  question_nudge: string
  sequence: number
  grading_weight_within_step: number
  target_competencies: string[]
  options: DraftOption[]
}

export interface DraftFlowStep {
  step: FlowStep
  theme: IntellectualTheme
  theme_name: string
  step_nudge: string
  grading_weight: number
  questions: DraftQuestion[]
}

export interface ChallengeJsonScenario {
  role: string
  context: string
  trigger: string
  question: string
  explanation: string
  engineer_standout: string
  data_points?: string[]
  visuals?: string[]   // SVG strings or markdown tables
}

export interface ChallengeJsonMetadata {
  paradigm: string
  industry: string
  sub_vertical: string
  difficulty: DifficultyV2
  estimated_minutes: number
  primary_competencies: string[]
  secondary_competencies: string[]
  frameworks: string[]
  relevant_roles: string[]
  company_tags: string[]
  tags: string[]
}

export interface ChallengeJson {
  scenario: ChallengeJsonScenario
  flow_steps: DraftFlowStep[]
  metadata: ChallengeJsonMetadata
}

export interface GenerationJob {
  id: string
  input_type: 'url' | 'text' | 'question'
  input_raw: string
  scraped_text: string | null
  status: GenerationJobStatus
  mode: GenerationMode
  result_challenge_id: string | null
  error_message: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DraftChallenge {
  id: string
  job_id: string
  challenge_json: ChallengeJson
  review_status: ReviewStatus
  step_approvals: Record<FlowStep, boolean>
  reviewer_notes: string | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(content): add ChallengeJson, GenerationJob, DraftChallenge types"
```

---

## Task 3: Content Validator

**Files:**
- Create: `src/lib/content/validator.ts`

- [ ] **Step 1: Write the validator**

```typescript
// src/lib/content/validator.ts
import type { ChallengeJson, DraftFlowStep, DraftQuestion } from '@/lib/types'

export interface ValidationError {
  path: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

const FLOW_STEPS = ['frame', 'list', 'optimize', 'win'] as const
const QUALITIES = ['best', 'good_but_incomplete', 'surface', 'plausible_wrong'] as const
const COMPETENCIES = [
  'motivation_theory', 'cognitive_empathy', 'taste',
  'strategic_thinking', 'creative_execution', 'domain_expertise',
] as const

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function validateOptions(q: DraftQuestion, path: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (q.options.length !== 4) {
    errors.push({ path, message: `Expected 4 options, got ${q.options.length}` })
    return errors
  }

  const qualities = q.options.map(o => o.quality)
  for (const qual of QUALITIES) {
    const count = qualities.filter(q => q === qual).length
    if (count !== 1) {
      errors.push({ path, message: `Expected exactly 1 option with quality "${qual}", got ${count}` })
    }
  }

  const wordCounts = q.options.map(o => wordCount(o.text))
  const maxWords = Math.max(...wordCounts)
  const minWords = Math.min(...wordCounts)
  const variance = maxWords > 0 ? (maxWords - minWords) / maxWords : 0
  if (variance > 0.2) {
    errors.push({ path, message: `Option word count variance ${(variance * 100).toFixed(0)}% exceeds 20%` })
  }

  const bestOption = q.options.find(o => o.quality === 'best')
  if (bestOption) {
    const bestWords = wordCount(bestOption.text)
    if (bestWords === maxWords && q.options.filter(o => wordCount(o.text) === maxWords).length === 1) {
      errors.push({ path, message: 'The "best" option must not be the longest' })
    }
  }

  for (const option of q.options) {
    for (const comp of option.competencies) {
      if (!COMPETENCIES.includes(comp as typeof COMPETENCIES[number])) {
        errors.push({ path: `${path}.${option.label}`, message: `Unknown competency: ${comp}` })
      }
    }
  }

  return errors
}

function validateStep(step: DraftFlowStep, idx: number): ValidationError[] {
  const errors: ValidationError[] = []
  const path = `flow_steps[${idx}]`

  if (!FLOW_STEPS.includes(step.step as typeof FLOW_STEPS[number])) {
    errors.push({ path, message: `Unknown step: ${step.step}` })
  }

  const nudgeWords = wordCount(step.step_nudge)
  if (nudgeWords > 40) {
    errors.push({ path, message: `step_nudge is ${nudgeWords} words (max 40)` })
  }
  if (!step.step_nudge.trim().endsWith('?')) {
    errors.push({ path, message: 'step_nudge must end with "?"' })
  }

  if (step.questions.length === 0) {
    errors.push({ path, message: 'Must have at least 1 question' })
  }

  for (let qi = 0; qi < step.questions.length; qi++) {
    errors.push(...validateOptions(step.questions[qi], `${path}.questions[${qi}]`))
  }

  return errors
}

export function validateChallengeJson(json: ChallengeJson): ValidationResult {
  const errors: ValidationError[] = []

  if (!json.scenario?.role) errors.push({ path: 'scenario.role', message: 'Required' })
  if (!json.scenario?.context) errors.push({ path: 'scenario.context', message: 'Required' })
  if (!json.scenario?.trigger) errors.push({ path: 'scenario.trigger', message: 'Required' })
  if (!json.scenario?.question) errors.push({ path: 'scenario.question', message: 'Required' })
  if (!json.scenario?.explanation) errors.push({ path: 'scenario.explanation', message: 'Required' })

  if (json.flow_steps.length !== 4) {
    errors.push({ path: 'flow_steps', message: `Expected 4 FLOW steps, got ${json.flow_steps.length}` })
  }

  for (let i = 0; i < json.flow_steps.length; i++) {
    errors.push(...validateStep(json.flow_steps[i], i))
  }

  if (!json.metadata?.paradigm) errors.push({ path: 'metadata.paradigm', message: 'Required' })
  if (!json.metadata?.industry) errors.push({ path: 'metadata.industry', message: 'Required' })
  if (!json.metadata?.difficulty) errors.push({ path: 'metadata.difficulty', message: 'Required' })
  if (!json.metadata?.primary_competencies?.length) {
    errors.push({ path: 'metadata.primary_competencies', message: 'At least 1 required' })
  }

  return { valid: errors.length === 0, errors }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/content/validator.ts
git commit -m "feat(content): add ChallengeJson structural validator"
```

---

## Task 4: Scraper

**Files:**
- Create: `src/lib/content/scraper.ts`

- [ ] **Step 1: Install cheerio**

```bash
npm install cheerio
```

- [ ] **Step 2: Write the scraper**

```typescript
// src/lib/content/scraper.ts
import * as cheerio from 'cheerio'

export interface ScrapeResult {
  title: string
  text: string
  dataPoints: string[]   // quantitative facts found in article
}

function extractDataPoints(text: string): string[] {
  // Match sentences with numbers, %, $, or stats
  const sentences = text.split(/[.!?]\s+/)
  return sentences
    .filter(s => /\d+(\.\d+)?[%$BMK]?|\b\d{4}\b/.test(s) && s.length > 20 && s.length < 200)
    .slice(0, 5)
    .map(s => s.trim())
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HackProduct/1.0)' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  // Remove nav, footer, scripts, ads
  $('nav, footer, script, style, aside, .ad, .advertisement, [aria-hidden="true"]').remove()

  const title = $('h1').first().text().trim() || $('title').text().trim()

  // Prefer article/main content
  const contentEl = $('article, main, [role="main"], .post-content, .article-body').first()
  const raw = contentEl.length ? contentEl.text() : $('body').text()

  // Normalise whitespace
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, 8000)
  const dataPoints = extractDataPoints(text)

  return { title, text, dataPoints }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/content/scraper.ts
git commit -m "feat(content): add URL scraper with data point extraction"
```

---

## Task 5: Prompt Templates

**Files:**
- Create: `src/lib/content/prompts.ts`

- [ ] **Step 1: Write prompts**

```typescript
// src/lib/content/prompts.ts

export const INTELLECTUAL_THEMES = {
  T1: { name: 'Upstream Before Downstream', step: 'frame', focus: 'Identify the root cause upstream of the stated problem. Ask: what systemic condition makes this problem inevitable? Exclude downstream symptoms.' },
  T2: { name: 'The Job Behind the Feature', step: 'list', focus: 'Surface the underlying job users are hiring the product to do. Options should differ in which job they address, not just how.' },
  T3: { name: 'Simulate the Other Side', step: 'win', focus: 'The recommendation must anticipate stakeholder objections and address the most hostile reading of the situation.' },
  T4: { name: 'Width Before Depth', step: 'list', focus: 'Options must be structurally distinct — different paradigms, not variations of the same approach. Avoid "option A but also B" framing.' },
  T5: { name: 'Name the Criterion, Name the Sacrifice', step: 'optimize', focus: 'Explicit tradeoff criterion must be named. The best answer states what it is optimizing FOR and what it is explicitly giving up.' },
  T6: { name: 'Exclusion Is Precision', step: 'frame', focus: 'The framing must state what is out of scope. Precision comes from what you exclude, not just what you include.' },
  T7: { name: 'A Recommendation Is a Falsifiable Hypothesis', step: 'win', focus: 'The winning answer makes a crisp recommendation that could be proven wrong. Vague consensus answers score lower.' },
} as const

const STEP_THEMES: Record<string, { primary: string; secondary?: string }> = {
  frame:    { primary: 'T1', secondary: 'T6' },
  list:     { primary: 'T4', secondary: 'T2' },
  optimize: { primary: 'T5' },
  win:      { primary: 'T7', secondary: 'T3' },
}

export function buildScrapePrompt(inputText: string): string {
  return `You are a research assistant preparing raw material for a product management challenge.

Given the following article or content, extract:
1. The core business/product situation in 2-3 sentences
2. Up to 3 specific quantitative data points (numbers, percentages, growth rates) — only if genuinely present in the text
3. Whether any tables or structured comparisons exist that would be clearer as a markdown table

Return ONLY valid JSON:
{
  "situation_summary": "...",
  "data_points": ["..."],   // empty array if none found
  "has_table_content": false
}

CONTENT:
${inputText.slice(0, 6000)}`
}

export function buildScenarioPrompt(inputText: string, situationSummary: string): string {
  return `You are an expert PM interviewer creating a scenario for HackProduct, a product thinking practice platform.

Context: ${situationSummary}

Source material:
${inputText.slice(0, 4000)}

Create a realistic PM interview scenario with these exact fields. Return ONLY valid JSON:
{
  "role": "...",            // e.g. "Senior PM at a fintech startup"
  "context": "...",         // 2-3 sentences: company, product, current situation
  "trigger": "...",         // 1 sentence: the specific event forcing a decision
  "question": "...",        // The core PM question being explored (what strategic question does this scenario test?)
  "explanation": "...",     // 2-3 sentences: why this question matters to product thinking
  "engineer_standout": "..." // 1-2 sentences: what makes an engineer's perspective valuable here
}

Rules:
- role is specific (company type, stage, domain)
- context gives enough detail to answer intelligently  
- trigger is a concrete event (board meeting, metric drop, competitor launch, etc.)
- question names the PM decision being tested, not just restates the trigger
- explanation connects to a broader product principle`
}

export function buildMcqPrompt(
  scenario: { role: string; context: string; trigger: string },
  step: string,
  themeKey: string,
  referenceAnswer?: string
): string {
  const themes = STEP_THEMES[step]
  const primaryTheme = INTELLECTUAL_THEMES[themes.primary as keyof typeof INTELLECTUAL_THEMES]
  const secondaryTheme = themes.secondary
    ? INTELLECTUAL_THEMES[themes.secondary as keyof typeof INTELLECTUAL_THEMES]
    : null

  const stepPurposes: Record<string, string> = {
    frame: 'Identify the root problem — what is really going on and why does it matter?',
    list: 'Generate structurally distinct options — what are the meaningfully different paths forward?',
    optimize: 'Evaluate tradeoffs — which option wins given explicit criteria, and what are you sacrificing?',
    win: 'Make a crisp recommendation — what exactly should be done and why will it work?',
  }

  return `You are writing MCQ options for a product thinking challenge on HackProduct.

SCENARIO:
Role: ${scenario.role}
Context: ${scenario.context}
Trigger: ${scenario.trigger}

FLOW STEP: ${step.toUpperCase()} — ${stepPurposes[step]}

PRIMARY INTELLECTUAL THEME: ${primaryTheme.name}
Theme instruction: ${primaryTheme.focus}
${secondaryTheme ? `\nSECONDARY THEME: ${secondaryTheme.name}\n${secondaryTheme.focus}` : ''}
${referenceAnswer ? `\nREFERENCE ANSWER (use as basis for BEST option):\n${referenceAnswer}` : ''}

Generate a question and exactly 4 MCQ options. Return ONLY valid JSON:
{
  "question_text": "...",
  "question_nudge": "...",   // hint for the user, ≤40 words, ends with "?"
  "target_competencies": ["motivation_theory"],   // 2-3 from: motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise
  "options": [
    {
      "label": "A",
      "quality": "best",
      "text": "...",
      "explanation": "...",   // why this quality label — 1 sentence
      "competencies": ["motivation_theory"]
    },
    { "label": "B", "quality": "good_but_incomplete", "text": "...", "explanation": "...", "competencies": [...] },
    { "label": "C", "quality": "surface", "text": "...", "explanation": "...", "competencies": [...] },
    { "label": "D", "quality": "plausible_wrong", "text": "...", "explanation": "...", "competencies": [...] }
  ]
}

OPTION RULES:
- All 4 options must be within 20% word count of each other
- The BEST option must NOT be the longest
- No option may reference another option
- Each option must work as a standalone answer
- plausible_wrong sounds smart but misreads the situation
- surface restates the problem without insight
- good_but_incomplete is correct but misses one key dimension that best captures
- best applies the primary intellectual theme correctly`
}

export function buildNudgePrompt(
  scenario: { role: string; context: string; trigger: string },
  step: string,
  questionText: string
): string {
  return `Write a hint/nudge for a PM practice question. The nudge should guide the learner toward the right thinking without giving away the answer.

Scenario: ${scenario.role} — ${scenario.trigger}
Step: ${step}
Question: ${questionText}

Return ONLY valid JSON:
{ "nudge": "..." }

Rules: ≤40 words, ends with "?", references the specific scenario context, surfaces the right thinking dimension without naming the answer.`
}

export function buildTaxonomyPrompt(
  scenario: { role: string; context: string; trigger: string },
  flowStepsSummary: string
): string {
  return `Classify a HackProduct challenge for discovery and filtering.

Scenario: ${scenario.role} — ${scenario.context} — ${scenario.trigger}
Challenge content summary: ${flowStepsSummary}

Return ONLY valid JSON:
{
  "paradigm": "...",             // one of: B2B, B2C, Marketplace, Platform, Infrastructure, Consumer, Enterprise
  "industry": "...",             // e.g. Fintech, HealthTech, EdTech, SaaS, E-commerce, Gaming, Media
  "sub_vertical": "...",        // more specific, e.g. "Payments", "EHR", "LMS"
  "difficulty": "standard",     // one of: warmup, standard, advanced, staff_plus
  "estimated_minutes": 20,
  "primary_competencies": ["strategic_thinking"],   // 2-3 from the 6 axes
  "secondary_competencies": ["taste"],              // 1-2
  "frameworks": [],              // e.g. ["Jobs-to-be-Done", "RICE", "Kano"]
  "relevant_roles": ["swe", "em"],    // from: swe, data_eng, ml_eng, devops, founding_eng, em, tech_lead, pm, designer, data_scientist
  "company_tags": [],            // e.g. ["stripe", "netflix"] if clearly about those companies
  "tags": []                     // freeform tags
}`
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/content/prompts.ts
git commit -m "feat(content): add Claude prompt templates for scrape, MCQ generation, taxonomy"
```

---

## Task 6: Generator (API mode)

**Files:**
- Create: `src/lib/content/generator.ts`

- [ ] **Step 1: Install Anthropic SDK if not present**

```bash
npm list @anthropic-ai/sdk || npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Write generator**

```typescript
// src/lib/content/generator.ts
import Anthropic from '@anthropic-ai/sdk'
import { scrapeUrl } from './scraper'
import {
  buildScrapePrompt, buildScenarioPrompt, buildMcqPrompt,
  buildTaxonomyPrompt,
} from './prompts'
import { validateChallengeJson } from './validator'
import type { ChallengeJson, DraftFlowStep, FlowStep } from '@/lib/types'

const client = new Anthropic()

const FLOW_STEPS: FlowStep[] = ['frame', 'list', 'optimize', 'win']

async function callHaiku(prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Haiku returned non-text block')
  return block.text.trim()
}

async function callSonnet(prompt: string, maxTokens = 2000): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Sonnet returned non-text block')
  return block.text.trim()
}

function parseJson<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!match) throw new Error(`No JSON found in response: ${raw.slice(0, 200)}`)
  return JSON.parse(match[0]) as T
}

export interface GeneratorInput {
  input_type: 'url' | 'text' | 'question'
  input_raw: string
}

export async function generateChallenge(input: GeneratorInput): Promise<ChallengeJson> {
  // Step 1: Get raw text
  let rawText = input.input_raw
  if (input.input_type === 'url') {
    const scraped = await scrapeUrl(input.input_raw)
    rawText = scraped.text
  }

  // Step 2: Haiku scrape/enrich
  const scrapeRaw = await callHaiku(buildScrapePrompt(rawText))
  const scrapeResult = parseJson<{
    situation_summary: string
    data_points: string[]
    has_table_content: boolean
  }>(scrapeRaw)

  // Step 3: Sonnet scenario
  const scenarioRaw = await callSonnet(buildScenarioPrompt(rawText, scrapeResult.situation_summary))
  const scenario = parseJson<ChallengeJson['scenario']>(scenarioRaw)

  // Add data_points only if genuinely found
  if (scrapeResult.data_points.length > 0) {
    scenario.data_points = scrapeResult.data_points
  }

  // Step 4: MCQs for each FLOW step
  const flow_steps: DraftFlowStep[] = []
  const THEME_MAP: Record<FlowStep, { theme: string; theme_name: string }> = {
    frame:    { theme: 'T1', theme_name: 'Upstream Before Downstream' },
    list:     { theme: 'T4', theme_name: 'Width Before Depth' },
    optimize: { theme: 'T5', theme_name: 'Name the Criterion, Name the Sacrifice' },
    win:      { theme: 'T7', theme_name: 'A Recommendation Is a Falsifiable Hypothesis' },
  }
  const WEIGHTS: Record<FlowStep, number> = { frame: 0.25, list: 0.25, optimize: 0.25, win: 0.25 }

  for (const step of FLOW_STEPS) {
    const mcqRaw = await callSonnet(buildMcqPrompt(scenario, step, THEME_MAP[step].theme))
    const mcqData = parseJson<{
      question_text: string
      question_nudge: string
      target_competencies: string[]
      options: DraftFlowStep['questions'][0]['options']
    }>(mcqRaw)

    flow_steps.push({
      step,
      theme: THEME_MAP[step].theme as any,
      theme_name: THEME_MAP[step].theme_name,
      step_nudge: mcqData.question_nudge,
      grading_weight: WEIGHTS[step],
      questions: [{
        question_text: mcqData.question_text,
        question_nudge: mcqData.question_nudge,
        sequence: 1,
        grading_weight_within_step: 1.0,
        target_competencies: mcqData.target_competencies,
        options: mcqData.options,
      }],
    })
  }

  // Step 5: Taxonomy
  const stepSummary = flow_steps.map(s => s.questions[0].question_text).join(' | ')
  const taxRaw = await callSonnet(buildTaxonomyPrompt(scenario, stepSummary), 800)
  const metadata = parseJson<ChallengeJson['metadata']>(taxRaw)

  const challengeJson: ChallengeJson = { scenario, flow_steps, metadata }

  // Step 6: Validate
  const validation = validateChallengeJson(challengeJson)
  if (!validation.valid) {
    throw new Error(`Generated challenge failed validation: ${JSON.stringify(validation.errors)}`)
  }

  return challengeJson
}

export async function regenerateStep(
  existing: ChallengeJson,
  step: FlowStep
): Promise<DraftFlowStep> {
  const THEME_MAP: Record<FlowStep, { theme: string; theme_name: string }> = {
    frame:    { theme: 'T1', theme_name: 'Upstream Before Downstream' },
    list:     { theme: 'T4', theme_name: 'Width Before Depth' },
    optimize: { theme: 'T5', theme_name: 'Name the Criterion, Name the Sacrifice' },
    win:      { theme: 'T7', theme_name: 'A Recommendation Is a Falsifiable Hypothesis' },
  }
  const WEIGHTS: Record<FlowStep, number> = { frame: 0.25, list: 0.25, optimize: 0.25, win: 0.25 }

  const mcqRaw = await callSonnet(buildMcqPrompt(existing.scenario, step, THEME_MAP[step].theme))
  const mcqData = parseJson<{
    question_text: string
    question_nudge: string
    target_competencies: string[]
    options: DraftFlowStep['questions'][0]['options']
  }>(mcqRaw)

  return {
    step,
    theme: THEME_MAP[step].theme as any,
    theme_name: THEME_MAP[step].theme_name,
    step_nudge: mcqData.question_nudge,
    grading_weight: WEIGHTS[step],
    questions: [{
      question_text: mcqData.question_text,
      question_nudge: mcqData.question_nudge,
      sequence: 1,
      grading_weight_within_step: 1.0,
      target_competencies: mcqData.target_competencies,
      options: mcqData.options,
    }],
  }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/content/generator.ts
git commit -m "feat(content): add API-mode challenge generator using Haiku + Sonnet"
```

---

## Task 7: Publisher

**Files:**
- Create: `src/lib/content/publisher.ts`

- [ ] **Step 1: Write publisher**

```typescript
// src/lib/content/publisher.ts
import { createAdminClient } from '@/lib/supabase/admin'
import type { ChallengeJson, FlowStep } from '@/lib/types'

function generateChallengeId(metadata: ChallengeJson['metadata']): string {
  const paradigm = (metadata.paradigm || 'GN').slice(0, 2).toUpperCase()
  const industry = (metadata.industry || 'GN').slice(0, 3).toUpperCase()
  const framework = metadata.frameworks?.[0]?.slice(0, 2).toUpperCase() || 'GM'
  const num = String(Math.floor(Math.random() * 900) + 100)
  return `HP-${paradigm}-${industry}-${framework}-${num}`
}

export async function publishDraft(draftId: string): Promise<string> {
  const supabase = createAdminClient()

  // Fetch draft
  const { data: draft, error: draftErr } = await supabase
    .from('draft_challenges')
    .select('*')
    .eq('id', draftId)
    .single()
  if (draftErr || !draft) throw new Error(`Draft not found: ${draftId}`)

  const json = draft.challenge_json as ChallengeJson
  const challengeId = generateChallengeId(json.metadata)

  // Insert challenge
  const { error: cErr } = await supabase.from('challenges').insert({
    id: challengeId,
    title: `${json.scenario.role}: ${json.scenario.trigger.slice(0, 60)}`,
    scenario_role: json.scenario.role,
    scenario_context: json.scenario.context,
    scenario_trigger: json.scenario.trigger,
    scenario_question: json.scenario.question,
    engineer_standout: json.scenario.engineer_standout,
    paradigm: json.metadata.paradigm,
    industry: json.metadata.industry,
    sub_vertical: json.metadata.sub_vertical,
    difficulty: json.metadata.difficulty,
    estimated_minutes: json.metadata.estimated_minutes,
    primary_competencies: json.metadata.primary_competencies,
    secondary_competencies: json.metadata.secondary_competencies,
    frameworks: json.metadata.frameworks,
    relevant_roles: json.metadata.relevant_roles,
    company_tags: json.metadata.company_tags,
    tags: json.metadata.tags,
    is_published: true,
    is_calibration: false,
    is_premium: false,
  })
  if (cErr) throw new Error(`Challenge insert failed: ${cErr.message}`)

  // Insert flow_steps + questions + options
  const STEP_ORDER: Record<FlowStep, number> = { frame: 1, list: 2, optimize: 3, win: 4 }

  for (const draftStep of json.flow_steps) {
    const { data: flowStep, error: fsErr } = await supabase
      .from('flow_steps')
      .insert({
        challenge_id: challengeId,
        step: draftStep.step,
        step_nudge: draftStep.step_nudge,
        grading_weight: draftStep.grading_weight,
        step_order: STEP_ORDER[draftStep.step as FlowStep],
      })
      .select('id')
      .single()
    if (fsErr || !flowStep) throw new Error(`flow_step insert failed: ${fsErr?.message}`)

    for (const draftQ of draftStep.questions) {
      const { data: stepQ, error: sqErr } = await supabase
        .from('step_questions')
        .insert({
          flow_step_id: flowStep.id,
          question_text: draftQ.question_text,
          question_nudge: draftQ.question_nudge,
          sequence: draftQ.sequence,
          grading_weight_within_step: draftQ.grading_weight_within_step,
          target_competencies: draftQ.target_competencies,
        })
        .select('id')
        .single()
      if (sqErr || !stepQ) throw new Error(`step_question insert failed: ${sqErr?.message}`)

      const optionRows = draftQ.options.map(opt => ({
        id: `${challengeId}-${draftStep.step}-Q${draftQ.sequence}-${opt.label}`,
        question_id: stepQ.id,
        option_label: opt.label,
        option_text: opt.text,
        quality: opt.quality,
        points: { best: 3, good_but_incomplete: 2, surface: 1, plausible_wrong: 0 }[opt.quality],
        competencies: opt.competencies,
        explanation: opt.explanation,
      }))

      const { error: optErr } = await supabase.from('flow_options').insert(optionRows)
      if (optErr) throw new Error(`flow_options insert failed: ${optErr.message}`)
    }
  }

  // Update draft + job
  await supabase.from('draft_challenges').update({ review_status: 'approved' }).eq('id', draftId)
  await supabase.from('generation_jobs')
    .update({ status: 'published', result_challenge_id: challengeId })
    .eq('id', draft.job_id)

  return challengeId
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/content/publisher.ts
git commit -m "feat(content): add publisher — explodes ChallengeJson to production tables"
```

---

## Task 8: Admin Auth Helper

**Files:**
- Create: `src/lib/content/admin-auth.ts`

- [ ] **Step 1: Write helper**

```typescript
// src/lib/content/admin-auth.ts
import { NextRequest, NextResponse } from 'next/server'

export function checkAdminSecret(req: NextRequest): NextResponse | null {
  const secret = req.headers.get('x-admin-secret')
  const expected = process.env.ADMIN_SECRET
  if (!expected) {
    console.warn('ADMIN_SECRET not set — admin routes are unprotected')
    return null
  }
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
```

- [ ] **Step 2: Add `ADMIN_SECRET` to `.env.local`**

```bash
echo 'ADMIN_SECRET=hackproduct-admin-dev' >> .env.local
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/content/admin-auth.ts
git commit -m "feat(content): add admin secret auth helper"
```

---

## Task 9: Jobs API Routes

**Files:**
- Create: `src/app/api/admin/content/jobs/route.ts`
- Create: `src/app/api/admin/content/jobs/[id]/route.ts`

- [ ] **Step 1: Write POST/GET jobs route**

```typescript
// src/app/api/admin/content/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import { generateChallenge } from '@/lib/content/generator'

export async function POST(req: NextRequest) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const body = await req.json() as {
    input_type: 'url' | 'text' | 'question'
    input_raw: string
    mode?: 'local' | 'api'
    created_by?: string
  }

  const supabase = createAdminClient()
  const mode = body.mode ?? (process.env.GENERATION_MODE === 'api' ? 'api' : 'local')

  const { data: job, error } = await supabase
    .from('generation_jobs')
    .insert({
      input_type: body.input_type,
      input_raw: body.input_raw,
      mode,
      created_by: body.created_by ?? 'admin',
    })
    .select('id')
    .single()

  if (error || !job) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  // API mode: trigger generation inline (async, don't await)
  if (mode === 'api') {
    void runApiGeneration(job.id, body.input_type, body.input_raw)
  }

  return NextResponse.json({ job_id: job.id })
}

async function runApiGeneration(
  jobId: string,
  input_type: 'url' | 'text' | 'question',
  input_raw: string
) {
  const supabase = createAdminClient()
  try {
    await supabase.from('generation_jobs').update({ status: 'scraping' }).eq('id', jobId)
    const challengeJson = await generateChallenge({ input_type, input_raw })
    await supabase.from('generation_jobs').update({ status: 'generating' }).eq('id', jobId)

    const { data: draft } = await supabase
      .from('draft_challenges')
      .insert({ job_id: jobId, challenge_json: challengeJson })
      .select('id')
      .single()

    await supabase.from('generation_jobs').update({
      status: 'review',
      scraped_text: challengeJson.scenario.context,
    }).eq('id', jobId)
  } catch (err) {
    await supabase.from('generation_jobs').update({
      status: 'failed',
      error_message: String(err),
    }).eq('id', jobId)
  }
}

export async function GET(req: NextRequest) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data })
}
```

- [ ] **Step 2: Write GET job/[id] route**

```typescript
// src/app/api/admin/content/jobs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const supabase = createAdminClient()

  const { data: job, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Also fetch draft if exists
  const { data: draft } = await supabase
    .from('draft_challenges')
    .select('*')
    .eq('job_id', id)
    .maybeSingle()

  return NextResponse.json({ job, draft: draft ?? null })
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/content/jobs/
git commit -m "feat(content): add jobs API routes (create, list, poll)"
```

---

## Task 10: Drafts API Routes

**Files:**
- Create: `src/app/api/admin/content/drafts/[id]/route.ts`
- Create: `src/app/api/admin/content/drafts/[id]/approve-step/route.ts`
- Create: `src/app/api/admin/content/drafts/[id]/approve-all/route.ts`
- Create: `src/app/api/admin/content/drafts/[id]/publish/route.ts`
- Create: `src/app/api/admin/content/drafts/[id]/regenerate-step/route.ts`

- [ ] **Step 1: Write PATCH draft (inline edit)**

```typescript
// src/app/api/admin/content/drafts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import type { ChallengeJson } from '@/lib/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const body = await req.json() as { challenge_json: ChallengeJson }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('draft_challenges')
    .update({ challenge_json: body.challenge_json, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Write approve-step route**

```typescript
// src/app/api/admin/content/drafts/[id]/approve-step/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const { step } = await req.json() as { step: string }

  const supabase = createAdminClient()
  const { data: draft, error: fetchErr } = await supabase
    .from('draft_challenges')
    .select('step_approvals')
    .eq('id', id)
    .single()

  if (fetchErr || !draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updatedApprovals = { ...((draft.step_approvals as Record<string, boolean>) ?? {}), [step]: true }

  const { error } = await supabase
    .from('draft_challenges')
    .update({ step_approvals: updatedApprovals, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, step_approvals: updatedApprovals })
}
```

- [ ] **Step 3: Write approve-all route**

```typescript
// src/app/api/admin/content/drafts/[id]/approve-all/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const supabase = createAdminClient()

  const allApproved = { frame: true, list: true, optimize: true, win: true }
  const { error } = await supabase
    .from('draft_challenges')
    .update({ step_approvals: allApproved, review_status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Write publish route**

```typescript
// src/app/api/admin/content/drafts/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import { publishDraft } from '@/lib/content/publisher'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params

  try {
    const challengeId = await publishDraft(id)
    return NextResponse.json({ ok: true, challenge_id: challengeId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 5: Write regenerate-step route**

```typescript
// src/app/api/admin/content/drafts/[id]/regenerate-step/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import { regenerateStep } from '@/lib/content/generator'
import type { ChallengeJson, FlowStep } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const { step } = await req.json() as { step: FlowStep }

  const supabase = createAdminClient()
  const { data: draft, error: fetchErr } = await supabase
    .from('draft_challenges')
    .select('challenge_json')
    .eq('id', id)
    .single()

  if (fetchErr || !draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = draft.challenge_json as ChallengeJson

  try {
    const newStep = await regenerateStep(existing, step)
    const updatedSteps = existing.flow_steps.map(s => s.step === step ? newStep : s)
    const updatedJson: ChallengeJson = { ...existing, flow_steps: updatedSteps }

    const { error } = await supabase
      .from('draft_challenges')
      .update({ challenge_json: updatedJson, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, step: newStep })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/admin/content/drafts/
git commit -m "feat(content): add drafts API routes (edit, approve, publish, regenerate)"
```

---

## Task 11: Local Job Server

**Files:**
- Create: `scripts/job-server.ts`

- [ ] **Step 1: Write job server**

```typescript
// scripts/job-server.ts
// Run with: npx ts-node scripts/job-server.ts
// Prerequisites: claude CLI in PATH, NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const POLL_INTERVAL_MS = 2000

async function processPendingJob() {
  const { data: jobs } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('status', 'pending')
    .eq('mode', 'local')
    .order('created_at', { ascending: true })
    .limit(1)

  const job = jobs?.[0]
  if (!job) return

  console.log(`[job-server] Processing job ${job.id} (${job.input_type})`)

  try {
    // Step 1: Scrape
    await supabase.from('generation_jobs').update({ status: 'scraping' }).eq('id', job.id)

    const scrapePrompt = job.input_type === 'url'
      ? `Fetch the URL ${job.input_raw} and extract the main article text. Return a JSON object with keys: situation_summary (string), data_points (string[]), has_table_content (boolean). Return ONLY valid JSON.`
      : `Summarise this content for a PM challenge: ${job.input_raw.slice(0, 3000)}. Return JSON: { situation_summary, data_points, has_table_content }. Return ONLY valid JSON.`

    const scrapeOut = execSync(
      `claude -p ${JSON.stringify(scrapePrompt)} --output-format json`,
      { encoding: 'utf8', timeout: 60_000 }
    )

    let scrapeResult: { situation_summary: string; data_points: string[] }
    try {
      const parsed = JSON.parse(scrapeOut)
      scrapeResult = parsed.result ? JSON.parse(parsed.result) : parsed
    } catch {
      scrapeResult = { situation_summary: job.input_raw.slice(0, 200), data_points: [] }
    }

    await supabase.from('generation_jobs').update({
      status: 'generating',
      scraped_text: scrapeResult.situation_summary,
    }).eq('id', job.id)

    // Step 2: Full challenge generation via API route
    const baseUrl = process.env.LOCAL_BASE_URL ?? 'http://localhost:3000'
    const adminSecret = process.env.ADMIN_SECRET ?? 'hackproduct-admin-dev'

    // Call the generator directly via dynamic import to share code
    const { generateChallenge } = await import('../src/lib/content/generator')
    const challengeJson = await generateChallenge({
      input_type: job.input_type,
      input_raw: job.input_raw,
    })

    const { data: draft } = await supabase
      .from('draft_challenges')
      .insert({ job_id: job.id, challenge_json: challengeJson })
      .select('id')
      .single()

    await supabase.from('generation_jobs').update({ status: 'review' }).eq('id', job.id)
    console.log(`[job-server] Job ${job.id} complete → draft ${draft?.id}`)
  } catch (err) {
    console.error(`[job-server] Job ${job.id} failed:`, err)
    await supabase.from('generation_jobs').update({
      status: 'failed',
      error_message: String(err),
    }).eq('id', job.id)
  }
}

console.log('[job-server] Starting — polling every 2s for pending jobs...')
setInterval(processPendingJob, POLL_INTERVAL_MS)
processPendingJob()
```

- [ ] **Step 2: Commit**

```bash
git add scripts/job-server.ts
git commit -m "feat(content): add local job server that polls DB and runs generation"
```

---

## Task 12: Admin Content Hub UI

**Files:**
- Modify: `src/app/(admin)/admin/content/page.tsx`

- [ ] **Step 1: Read existing page first**

Read `src/app/(admin)/admin/content/page.tsx` fully before editing.

- [ ] **Step 2: Replace with extended version**

The page needs to become a client component with a jobs list and authoring drawer. Replace the file content entirely:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GenerationJob } from '@/lib/types'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? 'hackproduct-admin-dev'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-secondary-container text-on-secondary-container',
  scraping: 'bg-tertiary-container text-on-surface',
  generating: 'bg-tertiary-container text-on-surface',
  review: 'bg-primary-container text-on-primary-container',
  published: 'bg-primary text-on-primary',
  failed: 'bg-surface-container-high text-error',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-label font-medium ${STATUS_COLORS[status] ?? 'bg-surface-container-high text-on-surface'}`}>
      {status}
    </span>
  )
}

function AuthoringDrawer({ open, onClose, onJobCreated }: {
  open: boolean
  onClose: () => void
  onJobCreated: (jobId: string) => void
}) {
  const [tab, setTab] = useState<'url' | 'text' | 'question'>('url')
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'local' | 'api'>('local')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/content/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
        body: JSON.stringify({ input_type: tab, input_raw: input.trim(), mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create job')
      onJobCreated(data.job_id)
      setInput('')
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-surface rounded-t-2xl p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-headline text-xl text-on-surface mb-4">New Challenge</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['url', 'text', 'question'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full font-label text-sm ${tab === t ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Input */}
        {tab === 'url' ? (
          <input
            type="url"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="https://stratechery.com/..."
            className="w-full bg-surface-container rounded-lg px-4 py-3 font-body text-on-surface border border-outline-variant outline-none focus:border-primary mb-4"
          />
        ) : (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={tab === 'text' ? 'Paste article text...' : 'Enter a PM question or scenario...'}
            rows={5}
            className="w-full bg-surface-container rounded-lg px-4 py-3 font-body text-on-surface border border-outline-variant outline-none focus:border-primary mb-4 resize-none"
          />
        )}

        {/* Mode toggle */}
        <div className="flex gap-3 mb-6">
          {(['local', 'api'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full font-label text-sm ${mode === m ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant'}`}
            >
              {m === 'local' ? 'Local (Claude Code)' : 'API'}
            </button>
          ))}
        </div>

        {error && <p className="text-error text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Generate Challenge'}
          </button>
          <button onClick={onClose} className="text-on-surface-variant font-label px-4">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminContentPage() {
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    const res = await fetch('/api/admin/content/jobs', {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    if (res.ok) {
      const data = await res.json()
      setJobs(data.jobs ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 3000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-2xl text-on-surface">Content</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-primary text-on-primary rounded-full px-5 py-2 font-label font-semibold text-sm"
        >
          + New Challenge
        </button>
      </div>

      {loading ? (
        <p className="text-on-surface-variant font-body">Loading...</p>
      ) : jobs.length === 0 ? (
        <div className="bg-surface-container rounded-xl p-8 text-center">
          <p className="text-on-surface-variant font-body">No jobs yet. Generate your first challenge.</p>
        </div>
      ) : (
        <div className="bg-surface-container rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Input</th>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Type</th>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Mode</th>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Status</th>
                <th className="text-left px-4 py-3 font-label text-on-surface-variant text-sm">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-t border-outline-variant">
                  <td className="px-4 py-3 font-body text-sm text-on-surface max-w-xs truncate">
                    {job.input_raw.slice(0, 60)}{job.input_raw.length > 60 ? '...' : ''}
                  </td>
                  <td className="px-4 py-3 font-label text-sm text-on-surface-variant">{job.input_type}</td>
                  <td className="px-4 py-3 font-label text-sm text-on-surface-variant">{job.mode}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3 font-label text-sm text-on-surface-variant">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {job.status === 'review' && (
                      <a
                        href={`/admin/content/review/${job.id}`}
                        className="text-primary font-label text-sm hover:underline"
                      >
                        Review →
                      </a>
                    )}
                    {job.status === 'failed' && (
                      <span className="text-error font-label text-xs" title={job.error_message ?? ''}>
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AuthoringDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onJobCreated={fetchJobs}
      />
    </div>
  )
}
```

Note: Add `NEXT_PUBLIC_ADMIN_SECRET=hackproduct-admin-dev` to `.env.local`.

- [ ] **Step 3: Add env var**

```bash
echo 'NEXT_PUBLIC_ADMIN_SECRET=hackproduct-admin-dev' >> .env.local
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(admin)/admin/content/page.tsx .env.local
git commit -m "feat(content): extend admin content hub with jobs list and authoring drawer"
```

---

## Task 13: Review Page

**Files:**
- Create: `src/app/(admin)/admin/content/review/[job_id]/page.tsx`

- [ ] **Step 1: Write review page**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { DraftChallenge, ChallengeJson, DraftFlowStep, FlowStep } from '@/lib/types'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? 'hackproduct-admin-dev'

const THEME_COLORS: Record<string, string> = {
  T1: 'bg-primary-container text-on-primary-container',
  T2: 'bg-secondary-container text-on-secondary-container',
  T3: 'bg-tertiary-container text-on-surface',
  T4: 'bg-primary-container text-on-primary-container',
  T5: 'bg-secondary-container text-on-secondary-container',
  T6: 'bg-tertiary-container text-on-surface',
  T7: 'bg-primary-container text-on-primary-container',
}

const QUALITY_LABELS: Record<string, { label: string; color: string }> = {
  best:                 { label: '3 · Best', color: 'text-primary' },
  good_but_incomplete:  { label: '2 · Good', color: 'text-tertiary' },
  surface:              { label: '1 · Surface', color: 'text-on-surface-variant' },
  plausible_wrong:      { label: '0 · Wrong', color: 'text-error' },
}

function EditableText({
  value, onChange, multiline = false, className = '',
}: { value: string; onChange: (v: string) => void; multiline?: boolean; className?: string }) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className={`w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary resize-none ${className}`}
      />
    )
  }
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full bg-surface-container-low rounded-lg px-3 py-2 font-body text-sm text-on-surface border border-outline-variant outline-none focus:border-primary ${className}`}
    />
  )
}

function OptionCard({
  option, onChange,
}: {
  option: DraftFlowStep['questions'][0]['options'][0]
  onChange: (updated: typeof option) => void
}) {
  const ql = QUALITY_LABELS[option.quality]
  return (
    <div className="bg-surface-container rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-label font-semibold text-on-surface">{option.label}</span>
        <span className={`font-label text-xs font-medium ${ql.color}`}>{ql.label}</span>
      </div>
      <EditableText
        value={option.text}
        onChange={v => onChange({ ...option, text: v })}
        multiline
      />
      <p className="font-label text-xs text-on-surface-variant">{option.explanation}</p>
    </div>
  )
}

function FlowStepPanel({
  draftStep, approved, onApprove, onRegenerate, onUpdate,
}: {
  draftStep: DraftFlowStep
  approved: boolean
  onApprove: () => void
  onRegenerate: () => void
  onUpdate: (updated: DraftFlowStep) => void
}) {
  return (
    <div className={`bg-surface-container-low rounded-2xl p-6 space-y-4 border-2 ${approved ? 'border-primary' : 'border-transparent'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full font-label text-xs font-semibold ${THEME_COLORS[draftStep.theme]}`}>
            {draftStep.theme} · {draftStep.theme_name}
          </span>
          <span className="font-headline text-base text-on-surface capitalize">{draftStep.step}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRegenerate}
            className="text-on-surface-variant font-label text-xs px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest"
          >
            Regenerate
          </button>
          <button
            onClick={onApprove}
            className={`font-label text-xs px-3 py-1.5 rounded-full ${approved ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}
          >
            {approved ? '✓ Approved' : 'Approve Step'}
          </button>
        </div>
      </div>

      <div>
        <p className="font-label text-xs text-on-surface-variant mb-1">Step nudge</p>
        <EditableText
          value={draftStep.step_nudge}
          onChange={v => onUpdate({ ...draftStep, step_nudge: v })}
        />
      </div>

      {draftStep.questions.map((q, qi) => (
        <div key={qi} className="space-y-3">
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Question</p>
            <EditableText
              value={q.question_text}
              onChange={v => {
                const updatedQs = [...draftStep.questions]
                updatedQs[qi] = { ...q, question_text: v }
                onUpdate({ ...draftStep, questions: updatedQs })
              }}
              multiline
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt, oi) => (
              <OptionCard
                key={opt.label}
                option={opt}
                onChange={updated => {
                  const updatedOpts = [...q.options]
                  updatedOpts[oi] = updated
                  const updatedQs = [...draftStep.questions]
                  updatedQs[qi] = { ...q, options: updatedOpts }
                  onUpdate({ ...draftStep, questions: updatedQs })
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ReviewPage() {
  const { job_id } = useParams<{ job_id: string }>()
  const router = useRouter()
  const [draft, setDraft] = useState<DraftChallenge | null>(null)
  const [json, setJson] = useState<ChallengeJson | null>(null)
  const [approvals, setApprovals] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDraft = useCallback(async () => {
    const res = await fetch(`/api/admin/content/jobs/${job_id}`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    if (!res.ok) return
    const data = await res.json()
    if (data.draft) {
      setDraft(data.draft)
      setJson(data.draft.challenge_json)
      setApprovals(data.draft.step_approvals ?? {})
    }
  }, [job_id])

  useEffect(() => { fetchDraft() }, [fetchDraft])

  async function saveEdits(updatedJson: ChallengeJson) {
    if (!draft) return
    setSaving(true)
    await fetch(`/api/admin/content/drafts/${draft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ challenge_json: updatedJson }),
    })
    setSaving(false)
  }

  function updateJson(updated: ChallengeJson) {
    setJson(updated)
    saveEdits(updated)
  }

  async function approveStep(step: string) {
    if (!draft) return
    const res = await fetch(`/api/admin/content/drafts/${draft.id}/approve-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ step }),
    })
    const data = await res.json()
    setApprovals(data.step_approvals ?? { ...approvals, [step]: true })
  }

  async function approveAll() {
    if (!draft) return
    await fetch(`/api/admin/content/drafts/${draft.id}/approve-all`, {
      method: 'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    setApprovals({ frame: true, list: true, optimize: true, win: true })
  }

  async function handlePublish() {
    if (!draft) return
    setPublishing(true)
    setError(null)
    const res = await fetch(`/api/admin/content/drafts/${draft.id}/publish`, {
      method: 'POST',
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    if (res.ok) {
      router.push('/admin/content')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Publish failed')
      setPublishing(false)
    }
  }

  async function handleRegenerate(step: FlowStep) {
    if (!draft || !json) return
    setRegenerating(step)
    const res = await fetch(`/api/admin/content/drafts/${draft.id}/regenerate-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ step }),
    })
    if (res.ok) {
      const data = await res.json()
      const updatedSteps = json.flow_steps.map(s => s.step === step ? data.step : s)
      const updatedJson = { ...json, flow_steps: updatedSteps }
      setJson(updatedJson)
      setApprovals(prev => ({ ...prev, [step]: false }))
    }
    setRegenerating(null)
  }

  if (!json) {
    return (
      <div className="p-6 text-on-surface-variant font-body">
        Loading draft...
      </div>
    )
  }

  const allApproved = ['frame', 'list', 'optimize', 'win'].every(s => approvals[s])

  return (
    <div className="p-6 max-w-4xl mx-auto pb-32">
      <h1 className="font-headline text-2xl text-on-surface mb-6">Review Challenge</h1>

      {/* Scenario */}
      <div className="bg-surface-container rounded-2xl p-6 space-y-4 mb-6">
        <h2 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wide">Scenario</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Role</p>
            <EditableText value={json.scenario.role} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, role: v } })} />
          </div>
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-1">Trigger</p>
            <EditableText value={json.scenario.trigger} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, trigger: v } })} />
          </div>
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Context</p>
          <EditableText value={json.scenario.context} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, context: v } })} multiline />
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Core Question</p>
          <EditableText value={json.scenario.question} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, question: v } })} multiline />
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Explanation (why this matters)</p>
          <EditableText value={json.scenario.explanation} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, explanation: v } })} multiline />
        </div>
        <div>
          <p className="font-label text-xs text-on-surface-variant mb-1">Engineer Standout</p>
          <EditableText value={json.scenario.engineer_standout} onChange={v => updateJson({ ...json, scenario: { ...json.scenario, engineer_standout: v } })} multiline />
        </div>

        {json.scenario.data_points && json.scenario.data_points.length > 0 && (
          <details>
            <summary className="font-label text-xs text-on-surface-variant cursor-pointer">Data Points ({json.scenario.data_points.length})</summary>
            <ul className="mt-2 space-y-1">
              {json.scenario.data_points.map((dp, i) => (
                <li key={i} className="font-body text-sm text-on-surface bg-surface-container-low rounded px-3 py-1">{dp}</li>
              ))}
            </ul>
          </details>
        )}

        {json.scenario.visuals && json.scenario.visuals.length > 0 && (
          <details>
            <summary className="font-label text-xs text-on-surface-variant cursor-pointer">Visuals ({json.scenario.visuals.length})</summary>
            <div className="mt-2 space-y-2">
              {json.scenario.visuals.map((v, i) => (
                <div key={i} className="bg-surface-container-low rounded p-3 font-body text-sm overflow-auto"
                  dangerouslySetInnerHTML={{ __html: v.startsWith('<') ? v : `<pre>${v}</pre>` }}
                />
              ))}
            </div>
          </details>
        )}
      </div>

      {/* FLOW Steps */}
      <div className="space-y-4 mb-6">
        {json.flow_steps.map(step => (
          <FlowStepPanel
            key={step.step}
            draftStep={step}
            approved={!!approvals[step.step]}
            onApprove={() => approveStep(step.step)}
            onRegenerate={() => handleRegenerate(step.step as FlowStep)}
            onUpdate={updated => {
              const updatedSteps = json.flow_steps.map(s => s.step === step.step ? updated : s)
              updateJson({ ...json, flow_steps: updatedSteps })
            }}
          />
        ))}
      </div>

      {error && <p className="text-error font-body text-sm mb-4">{error}</p>}
      {saving && <p className="text-on-surface-variant font-label text-xs mb-2">Saving...</p>}
      {regenerating && <p className="text-on-surface-variant font-label text-xs mb-2">Regenerating {regenerating} step...</p>}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant px-6 py-4 flex gap-3 justify-end">
        <button
          onClick={approveAll}
          className="bg-surface-container text-on-surface font-label font-semibold px-5 py-2 rounded-full text-sm"
        >
          Bulk Approve All
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="bg-primary text-on-primary font-label font-semibold px-6 py-2 rounded-full text-sm disabled:opacity-50"
        >
          {publishing ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(admin)/admin/content/review/
git commit -m "feat(content): add challenge review page with inline editing, step approval, publish"
```

---

## Task 14: Skill File Update

**Files:**
- Modify: `backend_planning/hackproduct-v2-bundle/skills/hackproduct-content-authoring/SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

Read the file fully first.

- [ ] **Step 2: Add scenario enrichment fields**

Find the scenario output spec section and add:

```markdown
### Scenario output fields (extended)

| Field | Required | Description |
|-------|----------|-------------|
| `role` | Yes | Specific role, company type, stage |
| `context` | Yes | 2-3 sentences: company, product, current situation |
| `trigger` | Yes | 1 sentence: concrete event forcing a decision |
| `question` | Yes | The core PM question being tested (not a restatement of trigger) |
| `explanation` | Yes | 2-3 sentences: why this question matters to product thinking |
| `engineer_standout` | Yes | 1-2 sentences: what makes an engineer's answer valuable here |
| `data_points` | No | String[]. Quantitative facts from source. Only populate when source contains real metrics. Leave empty otherwise. |
| `visuals` | No | String[]. SVG strings or markdown tables only. Use only when structural/tabular content from source genuinely aids comprehension. Never generate images. |
```

- [ ] **Step 3: Add per-step theme anchoring**

Add a new section:

```markdown
### FLOW Step → Intellectual Theme Mapping

Each FLOW step is anchored to a primary intellectual theme. MCQ options for that step must apply the theme's reasoning pattern:

| Step | Primary Theme | Secondary Theme | MCQ Generation Instruction |
|------|--------------|-----------------|----------------------------|
| Frame | T1: Upstream Before Downstream | T6: Exclusion Is Precision | Best option must identify root cause upstream of the stated problem. Plausible_wrong diagnoses a downstream symptom. |
| List | T4: Width Before Depth | T2: Job Behind the Feature | Options must represent structurally distinct paradigms, not variations of one approach. Best option addresses a distinct user job. |
| Optimize | T5: Name the Criterion, Name the Sacrifice | — | Best option explicitly names the optimization criterion AND the named sacrifice. Surface option gives vague tradeoffs. |
| Win | T7: Falsifiable Hypothesis | T3: Simulate the Other Side | Best option makes a crisp, testable recommendation. Plausible_wrong hedges or gives consensus non-answer. |

The `theme` and `theme_name` fields are now required in each `flow_step` in the JSON output.
```

- [ ] **Step 4: Commit**

```bash
git add backend_planning/hackproduct-v2-bundle/skills/hackproduct-content-authoring/SKILL.md
git commit -m "docs(skill): add question/explanation/visuals fields and theme anchoring to content-authoring skill"
```

---

## Task 15: Playwright E2E Tests

**Files:**
- Create: `e2e/content-management.spec.ts`

- [ ] **Step 1: Write E2E tests**

```typescript
// e2e/content-management.spec.ts
import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'hackproduct-admin-dev'

// Helper: create a job via API (bypasses UI for speed in non-UI tests)
async function createJob(page: Page, inputType: string, inputRaw: string, mode = 'api') {
  const res = await page.request.post(`${BASE_URL}/api/admin/content/jobs`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
    data: { input_type: inputType, input_raw: inputRaw, mode },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  return body.job_id as string
}

// Helper: poll job until status matches
async function waitForJobStatus(page: Page, jobId: string, targetStatus: string, maxWait = 120_000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const res = await page.request.get(`${BASE_URL}/api/admin/content/jobs/${jobId}`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    const data = await res.json()
    if (data.job?.status === targetStatus) return data
    if (data.job?.status === 'failed') throw new Error(`Job failed: ${data.job.error_message}`)
    await page.waitForTimeout(2000)
  }
  throw new Error(`Job did not reach ${targetStatus} within ${maxWait}ms`)
}

test.describe('Content Hub', () => {
  test('loads admin content page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/content`)
    await expect(page.getByRole('heading', { name: 'Content' })).toBeVisible()
    await expect(page.getByRole('button', { name: /New Challenge/i })).toBeVisible()
  })

  test('opens authoring drawer', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/content`)
    await page.getByRole('button', { name: /New Challenge/i }).click()
    await expect(page.getByRole('heading', { name: 'New Challenge' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Url' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Text' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Question' })).toBeVisible()
  })

  test('creates a job from text input', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/content`)
    await page.getByRole('button', { name: /New Challenge/i }).click()
    await page.getByRole('button', { name: 'Text' }).click()
    await page.locator('textarea').fill('A fintech startup is deciding whether to build a BNPL feature for their SMB expense management product. The CFO wants it to drive revenue but the engineering lead is worried about credit risk.')
    await page.getByRole('button', { name: 'API' }).click()
    await page.getByRole('button', { name: 'Generate Challenge' }).click()

    // Drawer closes after submission
    await expect(page.getByRole('heading', { name: 'New Challenge' })).not.toBeVisible({ timeout: 5000 })

    // Job appears in list
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Review Page', () => {
  test('renders scenario and all 4 FLOW step panels', async ({ page }) => {
    // Create a job via API and wait for review status
    const jobId = await createJob(
      page,
      'question',
      'Should Stripe build a crypto payment gateway in 2025?',
      'api'
    )
    const { draft } = await waitForJobStatus(page, jobId, 'review', 120_000)

    await page.goto(`${BASE_URL}/admin/content/review/${jobId}`)

    // Scenario card
    await expect(page.getByText('Scenario')).toBeVisible()
    await expect(page.locator('input[value]').first()).toBeVisible()

    // 4 FLOW steps
    for (const step of ['Frame', 'List', 'Optimize', 'Win']) {
      await expect(page.getByText(step, { exact: true })).toBeVisible()
    }

    // Theme badges
    await expect(page.getByText(/T1 · Upstream Before Downstream/)).toBeVisible()
    await expect(page.getByText(/T4 · Width Before Depth/)).toBeVisible()
    await expect(page.getByText(/T5 · Name the Criterion/)).toBeVisible()
    await expect(page.getByText(/T7 · A Recommendation Is/)).toBeVisible()
  })

  test('inline edit saves nudge', async ({ page }) => {
    const jobId = await createJob(page, 'question', 'Should Slack add AI-generated meeting recaps?', 'api')
    await waitForJobStatus(page, jobId, 'review', 120_000)

    await page.goto(`${BASE_URL}/admin/content/review/${jobId}`)

    // Edit the first nudge field
    const nudgeInput = page.locator('input').nth(2)
    await nudgeInput.clear()
    await nudgeInput.fill('What is the root cause behind this decision?')
    await page.waitForTimeout(1500)  // debounce save

    // Reload and verify persisted
    await page.reload()
    await expect(nudgeInput).toHaveValue('What is the root cause behind this decision?')
  })

  test('approve step sets badge', async ({ page }) => {
    const jobId = await createJob(page, 'question', 'Should Notion add a CRM feature?', 'api')
    await waitForJobStatus(page, jobId, 'review', 120_000)

    await page.goto(`${BASE_URL}/admin/content/review/${jobId}`)
    await page.getByRole('button', { name: 'Approve Step' }).first().click()
    await expect(page.getByText('✓ Approved').first()).toBeVisible()
  })

  test('bulk approve all steps', async ({ page }) => {
    const jobId = await createJob(page, 'question', 'Should Figma add version branching?', 'api')
    await waitForJobStatus(page, jobId, 'review', 120_000)

    await page.goto(`${BASE_URL}/admin/content/review/${jobId}`)
    await page.getByRole('button', { name: 'Bulk Approve All' }).click()
    const approvedBadges = page.getByText('✓ Approved')
    await expect(approvedBadges).toHaveCount(4)
  })

  test('publish creates live challenge and redirects', async ({ page }) => {
    const jobId = await createJob(page, 'question', 'Should Linear add a mobile app?', 'api')
    await waitForJobStatus(page, jobId, 'review', 120_000)

    await page.goto(`${BASE_URL}/admin/content/review/${jobId}`)
    await page.getByRole('button', { name: 'Bulk Approve All' }).click()
    await page.getByRole('button', { name: 'Publish' }).click()

    // Redirected to hub
    await expect(page).toHaveURL(`${BASE_URL}/admin/content`, { timeout: 15_000 })

    // Job shows published badge
    await expect(page.getByText('published').first()).toBeVisible()
  })
})

test.describe('Learner Playback after Publish', () => {
  test('published challenge appears in challenges list and is playable', async ({ page }) => {
    // Create and publish via API
    const jobId = await createJob(page, 'question', 'Should GitHub add an AI code reviewer?', 'api')
    const { draft } = await waitForJobStatus(page, jobId, 'review', 120_000)

    const publishRes = await page.request.post(`${BASE_URL}/api/admin/content/drafts/${draft.id}/publish`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
    })
    expect(publishRes.ok()).toBeTruthy()
    const { challenge_id } = await publishRes.json()

    // Learner navigates to challenges
    await page.goto(`${BASE_URL}/challenges`)
    // The new challenge should appear (assuming public listing)
    await expect(page.locator(`[data-challenge-id="${challenge_id}"], [href*="${challenge_id}"]`).first()).toBeVisible({ timeout: 10_000 })
  })
})
```

- [ ] **Step 2: Run Playwright to verify no syntax errors**

```bash
npx playwright test e2e/content-management.spec.ts --list
```

Expected: Lists all 8 test names without parse errors.

- [ ] **Step 3: Commit**

```bash
git add e2e/content-management.spec.ts
git commit -m "test(e2e): add Playwright tests for content management authoring, review, and publish flows"
```

---

## Task 16: Smoke Test + Final Verify

- [ ] **Step 1: Full type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "supabase/functions"
```

Expected: 0 errors.

- [ ] **Step 2: Lint**

```bash
npm run lint 2>&1 | tail -20
```

Expected: 0 errors (warnings OK).

- [ ] **Step 3: Start dev server and verify admin hub loads**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000/admin/content | grep -q "Content" && echo "PASS" || echo "FAIL"
```

Expected: `PASS`

- [ ] **Step 4: Create a test job via API**

```bash
curl -s -X POST http://localhost:3000/api/admin/content/jobs \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: hackproduct-admin-dev" \
  -d '{"input_type":"question","input_raw":"Should Figma add a no-code mobile builder?","mode":"api"}'
```

Expected: `{"job_id":"<uuid>"}`

- [ ] **Step 5: Poll until review status**

```bash
JOB_ID=<uuid from step 4>
for i in {1..60}; do
  STATUS=$(curl -s http://localhost:3000/api/admin/content/jobs/$JOB_ID -H "x-admin-secret: hackproduct-admin-dev" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['job']['status'])")
  echo "Status: $STATUS"
  [ "$STATUS" = "review" ] && break || sleep 3
done
```

Expected: eventually prints `Status: review`

- [ ] **Step 6: Open review page in browser and verify**

Navigate to `http://localhost:3000/admin/content/review/<job_id>`. Verify:
- Scenario card renders with all fields editable
- 4 FLOW step panels with theme badges (T1, T4, T5, T7)
- Each step has MCQ options with quality labels

- [ ] **Step 7: Bulk approve and publish**

Click "Bulk Approve All" → click "Publish" → verify redirect to `/admin/content` with `published` badge.

- [ ] **Step 8: Run E2E tests (skipping playback test which requires auth)**

```bash
npx playwright test e2e/content-management.spec.ts --grep "Content Hub|Review Page" --reporter=list
```

Expected: All tests pass.

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "feat(content): content management backend complete — generation, review, publish"
```
