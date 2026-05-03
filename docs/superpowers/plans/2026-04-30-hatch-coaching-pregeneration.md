# Hatch Coaching Pre-generation & Nudge Warmup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 2–5 second coaching skeleton-loader delay for pure MCQ answers by pre-generating all Hatch coaching responses at challenge publish time, and reduce first-nudge latency by warming Anthropic's prompt cache on step entry.

**Architecture:** A new `coaching-warmer.ts` module runs fire-and-forget inside `publishDraft()` after `flow_options` are inserted. It iterates every `(step, question, option, role)` tuple (~480 per challenge) and stores responses in `coaching_cache` under a `global:` prefix key. The coaching route checks for a global hit before falling back to the per-user AI call. A separate nudge-warmup endpoint primes Anthropic's 5-minute prompt cache when the user enters each FLOW step.

**Tech Stack:** TypeScript, Next.js App Router, Supabase (service-role client), Anthropic SDK via `createCachedMessage`, `p-limit` for concurrency control.

---

## How challenge generation works (reference)

This section documents the end-to-end pipeline so you understand what exists before adding to it.

### 1. Start the local job server

The job server polls the database for pending generation jobs and processes them using the `claude` CLI (your Claude Code subscription — no API cost).

```bash
# Prerequisites: claude CLI in PATH and authenticated, .env.local with Supabase keys
npx tsx --tsconfig tsconfig.json scripts/job-server.ts
```

It polls every 2 seconds for rows in `generation_jobs` where `status='pending'` and `mode='local'`.

### 2. Create a generation job

Go to **http://localhost:3000/admin/content** → click **"+ New Challenge"**.

Choose one of three input modes:
- **URL** — paste an article URL; the scraper fetches and extracts text
- **Text** — paste raw article text directly
- **Question** — type a PM/engineering question; the system expands it into source material

Select **Local** mode. Click Generate. This inserts a row into `generation_jobs` with `status='pending'`.

### 3. What the job server does (7 steps)

The `generateChallengeLocally()` function in `scripts/job-server.ts` runs these steps in sequence:

**Step 1 — Raw text extraction** (`scrapeUrl` if URL input)
Fetches the URL and extracts readable text. For text/question inputs, uses the raw input directly.

**Step 2 — Open-ended expansion** (question input only)
Calls Claude with `buildExpandOpenEndedPrompt()` to turn a short question into source material. Then calls Claude again with `buildVerifierPrompt()` to strip fabricated claims. If the verifier rejects the source entirely, the job fails.

**Step 3 — Source enrichment**
Calls Claude with `buildScrapePrompt(rawText)` → returns a `ScrapeResult` with:
- `situation_summary` — 2–3 sentence context
- `data_points` — real numbers extracted from source
- `insights` — key observations
- `excerpts` — tagged quotes by topic (`framing`, `options`, `tradeoff`, `recommendation`, `context`)
- `source_richness` — `'normal'` | `'rich'` | `'sparse'` (controls question count)

**Step 4 — Scenario generation**
Calls Claude with `buildScenarioPrompt(rawText, situation_summary)` → returns:
- `role` — e.g. "Tech Lead at a fintech startup"
- `trigger` — the situation the user walks into
- `context` — background detail
- `question` — the core challenge question
- `engineer_standout` — what a strong engineering answer looks like

**Step 5 — FLOW step MCQ generation** (4 steps × 1–3 questions × 4 options)
For each step (`frame`, `list`, `optimize`, `win`):
1. Calls `buildStepQuestionPlanPrompt()` → decides how many questions (1–3) and their focus areas
2. For each question, selects relevant source excerpts via `selectExcerpts()`
3. Calls `buildMcqPrompt()` with a grounding pack (focus, excerpts, data_points, insights, siblingFocuses) → returns:
   - `question_text`
   - `question_nudge`
   - `target_competencies`
   - `options` — array of 4, each with `label` (A/B/C/D), `text`, `quality` (`best`/`good_but_incomplete`/`surface`/`plausible_wrong`), `competencies`, `explanation`

**Step 6 — Taxonomy**
Calls `buildTaxonomyPrompt()` → returns `metadata`: paradigm, industry, sub_vertical, difficulty, estimated_minutes, frameworks, competencies, company_tags, tags.

**Step 7 — Validation**
`validateChallengeJson()` checks structural integrity. Hard errors throw (job fails). Warnings are logged only.

Result is stored in `draft_challenges` and `generation_jobs.status` becomes `'review'`.

### 4. Review and publish

Go to **http://localhost:3000/admin/content/review/{job_id}**. You can edit any field, regenerate individual steps, and approve each step. Click **Publish** when done.

Publish calls `publishDraft(draftId)` in `src/lib/content/publisher.ts`:
1. Inserts into `challenges` (with `is_published=true`)
2. For each FLOW step → inserts `flow_steps`
3. For each question → inserts `step_questions`
4. For each option → inserts `flow_options` (option_id format: `{challengeId}-{step}-Q{seq}-{label}`)
5. Updates `draft_challenges.review_status='approved'` and `generation_jobs.status='published'`
6. Returns `challengeId` (format: `HP-{paradigm}-{industry}-{framework}-{3digits}`)

### 5. What happens when a user answers an MCQ (current behaviour)

The `FlowWorkspace.tsx` component calls `POST /api/challenges/[id]/step/[step]/submit` to grade the answer, then calls `POST /api/challenges/[id]/coaching` (fire-and-forget) for role-specific coaching.

The coaching route (`src/app/api/challenges/[id]/coaching/route.ts`) checks `coaching_cache` for a hit keyed as `{userId}:{challengeId}:{step}:{questionId}:{optionId}:{roleId}`. On miss it calls Claude Sonnet (~2–5s) and stores the result. **The plan below changes this to check a global key first.**

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `src/lib/content/coaching-warmer.ts` | **Create** | `preGenerateCoaching(challengeId)` — iterates all combos, calls Claude, writes to `coaching_cache` |
| `src/lib/content/publisher.ts` | **Modify** (line 123) | Fire-and-forget `preGenerateCoaching()` after `flow_options` insert |
| `src/app/api/challenges/[id]/coaching/route.ts` | **Modify** (line 142) | Check global cache key before user-specific key in option-based path |
| `src/app/api/hatch/nudge-warmup/route.ts` | **Create** | Primes Anthropic prompt cache for nudge system prompt |
| `src/components/v2/FlowWorkspace.tsx` | **Modify** | Fire nudge-warmup fetch on step entry |

---

## Task 1: Install p-limit for concurrency control

`p-limit` caps how many Claude calls run in parallel so we don't hit Anthropic rate limits.

**Files:**
- Modify: `package.json` (adds dependency)

- [ ] **Step 1: Check if p-limit is already installed**

```bash
grep 'p-limit' /Users/sandeep/Projects/myproductschool/package.json
```

Expected: nothing printed (not installed). If it prints a version, skip Step 2.

- [ ] **Step 2: Install p-limit**

```bash
cd /Users/sandeep/Projects/myproductschool && npm install p-limit
```

Expected: `added 1 package` in output.

- [ ] **Step 3: Verify TypeScript can see the types**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep 'p-limit' | head -5
```

Expected: no lines (no errors about p-limit).

- [ ] **Step 4: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool && git add package.json package-lock.json && git commit -m "chore: add p-limit for coaching warmer concurrency"
```

---

## Task 2: Create the coaching-warmer module

This module is the core of the feature. It fetches all challenge data, then iterates every `(step, question, option, role)` combination and pre-populates `coaching_cache` with global keys.

**Files:**
- Create: `src/lib/content/coaching-warmer.ts`

- [ ] **Step 1: Read the coaching route to confirm prompt structure hasn't drifted**

```bash
grep -n 'systemPrompt\|userPrompt\|role_context\|career_signal' /Users/sandeep/Projects/myproductschool/src/app/api/challenges/\[id\]/coaching/route.ts
```

Expected: lines 81–98 (freeform path) and 210–230 (option-based path) showing the exact prompt strings.

- [ ] **Step 2: Create the warmer file**

Create `/Users/sandeep/Projects/myproductschool/src/lib/content/coaching-warmer.ts` with this content:

```typescript
import pLimit from 'p-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCachedMessage } from '@/lib/anthropic/cached-client'

// Global cache key prefix — no user ID, shared across all users
function globalCacheKey(challengeId: string, step: string, questionId: string, optionId: string, roleId: string): string {
  return `global:${challengeId}:${step}:${questionId}:${optionId}:${roleId}`
}

type RoleLens = {
  role_id: string
  label: string
}

type FlowOption = {
  id: string
  option_text: string
  quality: string
  explanation: string
}

type StepQuestion = {
  id: string
  question_text: string
  flow_step_id: string
}

type FlowStepRow = {
  id: string
  step: string
}

export async function preGenerateCoaching(challengeId: string): Promise<void> {
  const admin = createAdminClient()

  // Fetch all data needed for the challenge
  const [
    { data: flowSteps },
    { data: roleLenses },
    { data: challenge },
  ] = await Promise.all([
    admin.from('flow_steps').select('id, step').eq('challenge_id', challengeId),
    admin.from('role_lenses').select('role_id, label'),
    admin.from('challenges').select('scenario_context, scenario_trigger').eq('id', challengeId).single(),
  ])

  if (!flowSteps || !roleLenses || !challenge) {
    console.error(`[coaching-warmer] Missing data for challenge ${challengeId}`)
    return
  }

  const stepIds = flowSteps.map(s => s.id)

  const { data: questions } = await admin
    .from('step_questions')
    .select('id, question_text, flow_step_id')
    .in('flow_step_id', stepIds)

  if (!questions || questions.length === 0) {
    console.error(`[coaching-warmer] No questions found for challenge ${challengeId}`)
    return
  }

  const questionIds = questions.map(q => q.id)

  const { data: options } = await admin
    .from('flow_options')
    .select('id, option_text, quality, explanation')
    .in('question_id', questionIds)

  if (!options || options.length === 0) {
    console.error(`[coaching-warmer] No options found for challenge ${challengeId}`)
    return
  }

  // Build lookup maps for efficiency
  const stepById = new Map<string, FlowStepRow>(flowSteps.map(s => [s.id, s]))
  const questionsByStepId = new Map<string, StepQuestion[]>()
  for (const q of questions) {
    const existing = questionsByStepId.get(q.flow_step_id) ?? []
    existing.push(q)
    questionsByStepId.set(q.flow_step_id, existing)
  }
  const optionsByQuestionId = new Map<string, FlowOption[]>()
  for (const opt of options) {
    // option.id format: {challengeId}-{step}-Q{seq}-{label}
    // We need question_id — fetch it separately
  }

  // Re-fetch options with question_id included
  const { data: optionsWithQid } = await admin
    .from('flow_options')
    .select('id, question_id, option_text, quality, explanation')
    .in('question_id', questionIds)

  if (!optionsWithQid) return

  for (const opt of optionsWithQid) {
    const existing = optionsByQuestionId.get(opt.question_id) ?? []
    existing.push({ id: opt.id, option_text: opt.option_text, quality: opt.quality, explanation: opt.explanation })
    optionsByQuestionId.set(opt.question_id, existing)
  }

  // Build best-option lookup per question
  const bestOptionByQuestion = new Map<string, string>()
  for (const [qid, opts] of optionsByQuestionId) {
    const best = opts.find(o => o.quality === 'best')
    if (best) bestOptionByQuestion.set(qid, best.option_text)
  }

  const scenarioContext = challenge.scenario_context ?? ''
  const scenarioTrigger = challenge.scenario_trigger ?? ''

  // Cap concurrency to avoid rate limiting (5 parallel Claude calls)
  const limit = pLimit(5)
  const tasks: Promise<void>[] = []

  for (const flowStep of flowSteps) {
    const stepQuestions = questionsByStepId.get(flowStep.id) ?? []
    for (const question of stepQuestions) {
      const stepOptions = optionsByQuestionId.get(question.id) ?? []
      const bestText = bestOptionByQuestion.get(question.id) ?? ''

      for (const option of stepOptions) {
        for (const role of roleLenses) {
          const cacheKey = globalCacheKey(challengeId, flowStep.step, question.id, option.id, role.role_id)

          tasks.push(limit(async () => {
            // Skip if already generated (idempotent re-runs)
            const { data: existing } = await admin
              .from('coaching_cache')
              .select('cache_key')
              .eq('cache_key', cacheKey)
              .single()
            if (existing) return

            const systemPrompt = `You are Hatch, Hatch is an AI coach at HackProduct. You give personalized, career-relevant coaching to engineers practicing product thinking.`

            const userPrompt = `The learner is a ${role.label} who just answered the ${flowStep.step} step.
Challenge: ${scenarioContext} ${scenarioTrigger}
Question: ${question.question_text}
They selected: "${option.option_text}" (${option.quality})
Best answer: "${bestText}"
Static explanation: ${option.explanation}

Generate two short paragraphs:
1. "role_context" (2-3 sentences): Connect their choice to a real-world situation a ${role.label} faces.
2. "career_signal" (1 sentence): How this skill/gap affects their career. Be concrete.

Tone: Direct, warm. Senior ${role.label} mentoring a junior. No filler.
Return ONLY JSON: {"role_context":"...","career_signal":"..."}`

            try {
              const message = await createCachedMessage(systemPrompt, userPrompt, {
                model: 'claude-sonnet-4-6',
                max_tokens: 800,
                thinking: { type: 'adaptive' },
              })

              let rawText = ''
              for (const block of message.content) {
                if (block.type === 'text') { rawText = block.text; break }
              }

              let role_context = ''
              let career_signal = ''
              try {
                const parsed = JSON.parse(rawText)
                role_context = parsed.role_context ?? ''
                career_signal = parsed.career_signal ?? ''
              } catch {
                const rcMatch = rawText.match(/"role_context"\s*:\s*"([^"]+)"/)
                const csMatch = rawText.match(/"career_signal"\s*:\s*"([^"]+)"/)
                role_context = rcMatch?.[1] ?? ''
                career_signal = csMatch?.[1] ?? ''
              }

              await admin.from('coaching_cache').upsert({
                cache_key: cacheKey,
                role_context,
                career_signal,
                hit_count: 0,
                last_hit_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              })

              console.log(`[coaching-warmer] ✓ ${flowStep.step}/${question.id}/${option.id}/${role.role_id}`)
            } catch (err) {
              console.error(`[coaching-warmer] ✗ ${cacheKey}:`, err)
              // Do not throw — one failure should not abort the rest
            }
          }))
        }
      }
    }
  }

  await Promise.all(tasks)
  console.log(`[coaching-warmer] Done — pre-generated coaching for challenge ${challengeId}`)
}
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v 'supabase/functions' | head -20
```

Expected: no errors related to `coaching-warmer.ts`. Fix any type errors before proceeding.

- [ ] **Step 4: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool && git add src/lib/content/coaching-warmer.ts && git commit -m "feat: add coaching-warmer module for pre-generating Hatch coaching at publish time"
```

---

## Task 3: Hook warmer into publishDraft

Wire `preGenerateCoaching` into `src/lib/content/publisher.ts` as a fire-and-forget call after `flow_options` is inserted. Publish response does not wait for warming to complete.

**Files:**
- Modify: `src/lib/content/publisher.ts` (after line 113, before the status updates at line 117)

- [ ] **Step 1: Read the current publisher to confirm line numbers haven't shifted**

```bash
grep -n 'flow_options\|Update draft\|return challengeId' /Users/sandeep/Projects/myproductschool/src/lib/content/publisher.ts
```

Expected output (approximate):
```
112:      const { error: optErr } = await supabase.from('flow_options').insert(optionRows)
117:  // Update draft + job
123:  return challengeId
```

- [ ] **Step 2: Add the import and fire-and-forget call**

In `src/lib/content/publisher.ts`, add the import at the top (after existing imports):

```typescript
import { preGenerateCoaching } from '@/lib/content/coaching-warmer'
```

Then, after the closing brace of the `for (const draftStep of json.flow_steps)` loop (just before `// Update draft + job` comment at line ~117), add:

```typescript
  // Pre-generate Hatch coaching for all MCQ options — fire-and-forget, publish does not wait
  preGenerateCoaching(challengeId).catch(err =>
    console.error('[coaching-warmer] pre-generation failed', err)
  )
```

The final structure of `publishDraft` around this area should look like:

```typescript
    // ... flow_options insert
    const { error: optErr } = await supabase.from('flow_options').insert(optionRows)
    if (optErr) throw new Error(`flow_options insert failed: ${optErr.message}`)
  }
}  // closes: for (const draftStep of json.flow_steps)

// Pre-generate Hatch coaching for all MCQ options — fire-and-forget, publish does not wait
preGenerateCoaching(challengeId).catch(err =>
  console.error('[coaching-warmer] pre-generation failed', err)
)

// Update draft + job
await supabase.from('draft_challenges').update({ review_status: 'approved' }).eq('id', draftId)
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v 'supabase/functions' | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool && git add src/lib/content/publisher.ts && git commit -m "feat: fire coaching warmer on challenge publish"
```

---

## Task 4: Add global cache lookup to the coaching route

Before the existing user-specific cache check (option-based path), add a lookup for the `global:` prefixed key. If found, return immediately — no AI call, no DB write, sub-100ms response.

**Files:**
- Modify: `src/app/api/challenges/[id]/coaching/route.ts` (option-based path, currently starting at line 142)

- [ ] **Step 1: Locate the exact insertion point**

```bash
grep -n 'Option-based path\|cacheKey\|user.id.*challengeId' /Users/sandeep/Projects/myproductschool/src/app/api/challenges/\[id\]/coaching/route.ts | head -10
```

Expected: line 142 shows `// Option-based path` comment, line 144 shows `const cacheKey = \`${user.id}...`.

- [ ] **Step 2: Insert the global cache lookup**

In `src/app/api/challenges/[id]/coaching/route.ts`, replace the block starting at line 142:

**Before (lines 142–160):**
```typescript
  // Option-based path
  // Cache key: userId:challengeId:step:questionId:optionId:roleId
  const cacheKey = `${user.id}:${challengeId}:${step}:${question_id}:${option_id}:${roleId}`

  // Check coaching_cache for hit
  const { data: cached } = await admin
    .from('coaching_cache')
    .select('role_context, career_signal, hit_count')
    .eq('cache_key', cacheKey)
    .single()

  if (cached) {
    // Increment hit_count, update last_hit_at
    await admin
      .from('coaching_cache')
      .update({ hit_count: cached.hit_count + 1, last_hit_at: new Date().toISOString() })
      .eq('cache_key', cacheKey)
    return NextResponse.json({ role_context: cached.role_context, career_signal: cached.career_signal, cached: true })
  }
```

**After:**
```typescript
  // Option-based path
  // Check global pre-generated cache first (populated at publish time, shared across all users)
  const globalKey = `global:${challengeId}:${step}:${question_id}:${option_id}:${roleId}`
  const { data: globalHit } = await admin
    .from('coaching_cache')
    .select('role_context, career_signal')
    .eq('cache_key', globalKey)
    .single()

  if (globalHit) {
    return NextResponse.json({ role_context: globalHit.role_context, career_signal: globalHit.career_signal, cached: true })
  }

  // Fall back to user-specific cache (populated lazily on first user hit)
  // Cache key: userId:challengeId:step:questionId:optionId:roleId
  const cacheKey = `${user.id}:${challengeId}:${step}:${question_id}:${option_id}:${roleId}`

  const { data: cached } = await admin
    .from('coaching_cache')
    .select('role_context, career_signal, hit_count')
    .eq('cache_key', cacheKey)
    .single()

  if (cached) {
    await admin
      .from('coaching_cache')
      .update({ hit_count: cached.hit_count + 1, last_hit_at: new Date().toISOString() })
      .eq('cache_key', cacheKey)
    return NextResponse.json({ role_context: cached.role_context, career_signal: cached.career_signal, cached: true })
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v 'supabase/functions' | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool && git add 'src/app/api/challenges/[id]/coaching/route.ts' && git commit -m "feat: check global coaching cache before user-specific cache in option-based path"
```

---

## Task 5: Create the nudge-warmup endpoint

This endpoint primes Anthropic's 5-minute prompt cache for the nudge system prompt. Calling it with `max_tokens: 1` costs almost nothing but ensures the next real nudge call hits the cached path (~300ms instead of ~1s).

**Files:**
- Create: `src/app/api/hatch/nudge-warmup/route.ts`

- [ ] **Step 1: Read the nudge system prompt imports to confirm they are stable**

```bash
grep -n 'HATCH_NUDGE_SYSTEM_PROMPT\|MENTAL_MODELS_CONTEXT\|buildNudgeUserPrompt' /Users/sandeep/Projects/myproductschool/src/app/api/hatch/nudge/route.ts
```

Expected: lines 2 and 69–71 showing the exact imports and usage.

- [ ] **Step 2: Create the warmup route**

Create `/Users/sandeep/Projects/myproductschool/src/app/api/hatch/nudge-warmup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { HATCH_NUDGE_SYSTEM_PROMPT, MENTAL_MODELS_CONTEXT } from '@/lib/hatch/system-prompt'
import { createCachedMessage } from '@/lib/anthropic/cached-client'

// Primes Anthropic's 5-minute prompt cache for the nudge system prompt.
// Called on step entry so the first real nudge is a cache hit.
export async function POST(req: NextRequest) {
  const { step } = await req.json().catch(() => ({})) as { step?: string }

  const systemPrompt = HATCH_NUDGE_SYSTEM_PROMPT + '\n\n' + MENTAL_MODELS_CONTEXT
  const userPrompt = `Warming cache for step: ${step ?? 'unknown'}. No output needed.`

  try {
    await createCachedMessage(systemPrompt, userPrompt, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
    })
  } catch {
    // Warmup failure is silent — the real nudge call will just pay the cold-start cost
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v 'supabase/functions' | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool && git add src/app/api/hatch/nudge-warmup/route.ts && git commit -m "feat: add nudge-warmup endpoint to prime Anthropic prompt cache"
```

---

## Task 6: Fire nudge warmup on step entry in FlowWorkspace

Add a `useEffect` in `FlowWorkspace.tsx` that fires the warmup call each time the user enters a new FLOW step. The call is completely fire-and-forget — no state, no error handling in the UI.

**Files:**
- Modify: `src/components/v2/FlowWorkspace.tsx`

- [ ] **Step 1: Find the current step state variable in FlowWorkspace**

```bash
grep -n 'currentStep\|activeStep\|step.*useState' /Users/sandeep/Projects/myproductschool/src/components/v2/FlowWorkspace.tsx | head -10
```

Note the exact variable name used for the current FLOW step (likely `currentStep` or the step field from `useChallengeV2`).

- [ ] **Step 2: Find where to place the useEffect**

```bash
grep -n 'useEffect' /Users/sandeep/Projects/myproductschool/src/components/v2/FlowWorkspace.tsx | head -10
```

Note the line numbers of existing `useEffect` calls to place the new one nearby.

- [ ] **Step 3: Add the warmup useEffect**

In `src/components/v2/FlowWorkspace.tsx`, after the existing `useEffect` blocks (and before the return statement), add:

```typescript
// Prime Anthropic prompt cache for nudges when entering each FLOW step
useEffect(() => {
  if (!challengeData?.id || !currentStep) return
  fetch('/api/hatch/nudge-warmup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step: currentStep }),
  }).catch(() => {}) // silent — warmup failure does not affect UX
}, [challengeData?.id, currentStep])
```

Replace `challengeData?.id` and `currentStep` with the exact variable names you found in Step 1. The dependency array must use the challenge ID and the current step so it fires once per step transition.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/sandeep/Projects/myproductschool && npx tsc --noEmit 2>&1 | grep -v 'supabase/functions' | head -20
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/sandeep/Projects/myproductschool && git add src/components/v2/FlowWorkspace.tsx && git commit -m "feat: fire nudge prompt cache warmup on FLOW step entry"
```

---

## Task 7: End-to-end verification

Verify the complete flow works: publish warms the cache, users get instant coaching, nudges are faster.

**Files:**
- No file changes — this is a verification-only task

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/sandeep/Projects/myproductschool && npm run dev
```

Leave this running in a separate terminal.

- [ ] **Step 2: Generate and publish a test challenge**

1. Start the job server: `npx tsx --tsconfig tsconfig.json scripts/job-server.ts`
2. Go to http://localhost:3000/admin/content → create a new challenge (URL or question input, Local mode)
3. Wait for generation to complete (watch job-server logs)
4. Go to http://localhost:3000/admin/content/review/{job_id} → approve all steps → click Publish
5. Note the `challengeId` printed in the publish response

- [ ] **Step 3: Confirm coaching was pre-generated**

Run this query in Supabase SQL editor (or via any Postgres client):

```sql
SELECT count(*) FROM coaching_cache WHERE cache_key LIKE 'global:{YOUR_CHALLENGE_ID}%';
```

Replace `{YOUR_CHALLENGE_ID}` with the actual ID (e.g. `HP-TR-FIN-PM-427`).

Expected: count of ~120–480 rows depending on how many questions/roles the challenge has. If 0, check the job-server terminal for `[coaching-warmer]` log lines — look for any errors.

- [ ] **Step 4: Verify fast coaching as a user**

1. Open http://localhost:3000/challenges/{challengeId} and start the challenge
2. Open browser DevTools → Network tab → filter by `/coaching`
3. Answer the first MCQ option
4. Watch the `/coaching` request: it should complete in under 200ms (was 2–5s)
5. Confirm `cached: true` in the response JSON

- [ ] **Step 5: Verify elaboration path still works (fallback)**

1. On the same challenge, find a question with a free-text elaboration box
2. Type some elaboration text and submit
3. Watch the `/coaching` request — it should take 2–5s (AI call) because elaboration is always dynamic
4. Confirm `cached: false` in the response JSON

- [ ] **Step 6: Verify nudge warmup fires**

1. Open a challenge workspace
2. In DevTools → Network, filter by `nudge-warmup`
3. Enter a FLOW step — confirm a POST to `/api/hatch/nudge-warmup` fires immediately
4. Trigger a nudge (click hint button or trigger canvas nudge)
5. The nudge response should arrive noticeably faster than before (hard to measure exactly, but subjectively faster)

- [ ] **Step 7: Final commit if any fixes were needed**

```bash
cd /Users/sandeep/Projects/myproductschool && git add -A && git commit -m "fix: coaching warmer verification fixes"
```

Only run this if you made additional fixes during verification.
