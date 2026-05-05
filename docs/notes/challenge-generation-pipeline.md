# Challenge Generation Pipeline

How challenges get from an article URL (or a question) into the database and into users' hands.

## Overview

The pipeline has two execution environments with identical logic:

| Environment | Entry point | Runs via |
|---|---|---|
| Local / dev | `scripts/job-server.ts` | `claude` CLI subprocess (no API cost) |
| Production / API | `src/lib/content/generator.ts` | Anthropic SDK (`@anthropic-ai/sdk`) |

Both produce the same output shape and write to the same DB tables.

---

## Step-by-step

### Step 1 — Source ingestion

**What happens:** Raw input (URL, article text, or short question) is processed into structured source material.

**Code:** `scripts/job-server.ts` → `callClaude(extractionPrompt)`

**Output fields:**
- `title` — challenge display name
- `scenario_context` — 2–3 sentence setup (no role framing, no second person)
- `scenario_trigger` — the specific event or decision that drives the challenge
- `source_material` — cleaned article body
- `insights` — 5–8 extracted insights
- `data_points` — named metrics / thresholds referenced in the source

**Open-ended prompts** (short questions like "how do you improve ChatGPT") run an expansion step first: the LLM picks a concrete angle and writes source-like context, then a verifier step strips any fabricated claims before ingestion continues. Unsalvageable sources fail the job.

---

### Step 2 — FLOW step generation (4 steps × 1–3 questions each)

**What happens:** For each FLOW step (`frame`, `list`, `optimize`, `win`), the LLM generates 1–3 questions. Each question has a `focus` (what reasoning move it tests) and a `question_nudge` (shown before the user answers).

**Code:** `callClaude(stepPrompt with grounding pack)`

**Grounding pack** passed to each step prompt:
- `step` — which step (frame / list / optimize / win)
- `focus` — per-question angle (prevents sibling overlap)
- `source_excerpts` — filtered by step topic
- `real_data_points` — extracted from source
- `insights` — extracted from source
- `engineer_standout` — what separates an engineering-savvy answer
- `siblingFocuses` — foci of other questions in same step (prevents overlap)

**Output per question:**
- `question_text`
- `question_nudge`
- `question_focus`

---

### Step 3 — MCQ option generation (4 options per question)

**What happens:** For each question, the LLM generates exactly 4 options — one of each quality tier.

**Code:** `callClaude(optionPrompt with grounding pack + siblingFocuses)`

**Quality tiers:**

| Quality | Points | Grade |
|---|---|---|
| `best` | 3 | Sharp |
| `good_but_incomplete` | 2 | Solid |
| `surface` | 1 | Surface |
| `plausible_wrong` | 0 | Missed |

**Output per option:**
- `option_text`
- `quality`
- `explanation` — revealed after submission, reads like insight not instruction
- `framework_hint` — e.g. "🧠 Motivation Theory → Friction: ..."

**Grounding requirement:** The `best` option must reference a source-specific element (named entity, metric, or listed insight). If it doesn't, the validator flags it.

---

### Step 4 — Validation

**What happens:** Validator checks the complete generated challenge before it is saved.

**Code:** `src/lib/content/validator.ts`

**Hard errors** (block publish):
- Missing required fields (scenario_context, all 4 options per question, etc.)
- BEST option does not reference a grounded source element
- Options array does not have exactly one of each quality tier

**Warnings** (surfaced to reviewer, do not block):
- Sibling overlap — two questions in the same step share similar focus
- Voice violation — em dash, "you are a tech lead", AI slop words (`delve`, `leverage`, etc.)
- Role framing — second-person role framing in user-facing copy

---

### Step 5 — Draft saved to DB

**Tables written:**

| Table | Contents |
|---|---|
| `challenge_drafts` | Top-level draft record, `status: 'complete'` |
| `draft_flow_steps` | One row per FLOW step |
| `draft_questions` | One row per question |
| `draft_options` | One row per option |

**Status flow:** `pending` → (job-server picks up) → `generating` → `complete` (or `failed`)

---

### Step 6 — Admin review

**Where:** `/admin/content` lists all jobs with View / Review / Tags / Delete actions.

**Review page** (`/admin/content/challenges/{draftId}`):
- Inline editing of scenario, question text, option text, explanations
- Step-by-step approval (reviewer marks each step approved before final publish)
- Tag editor for taxonomy

---

### Step 7 — Publish

**Triggered by:** "Publish" button on the review page.

**Code:** `src/lib/content/publisher.ts` → `publishDraft(draftId: string)`

**Atomic insertion sequence:**
1. `INSERT INTO challenges` — top-level record with scenario, difficulty, is_published=true
2. `INSERT INTO flow_steps` — one per step
3. `INSERT INTO step_questions` — one per question per step
4. `INSERT INTO flow_options` — one per option per question (option IDs: `{challengeId}-{step}-Q{sequence}-{label}`)
5. Returns `challengeId`

**After publish — coaching pre-generation (fire-and-forget):**
```
preGenerateCoaching(challengeId).catch(err => console.error('[coaching-warmer] failed', err))
```
See "Coaching pre-generation" section below — this runs async, publish does not wait.

---

## Running the job server locally

```bash
# Start the job server (polls DB every 2s for pending local jobs)
npx tsx --tsconfig tsconfig.json scripts/job-server.ts

# Create a job via admin UI:
# /admin/content → "New Challenge" → paste URL or question → Submit

# Bulk ingest from Notion "Challenge Pipeline" database:
npx tsx scripts/bulk-ingest.ts   # reads rows where Status=Queued, updates Notion on completion
```

The job server uses `execFileSync` to call the `claude` CLI:
```
claude -p --output-format json --max-budget-usd 0.5
```
This bills your Claude Code subscription (not the Anthropic API key), so bulk generation is low-cost.

---

## Coaching pre-generation

After `flow_options` are inserted, `preGenerateCoaching(challengeId)` fires asynchronously from `publishDraft()`.

**What it does:**
1. Reads all steps / questions / options for the challenge from DB
2. Reads all `role_lenses` (id, label)
3. For each `(step, question, option, role)` tuple:
   - Skips if a `coaching_cache` row already exists for this key (idempotent)
   - Constructs the same system + user prompt as the coaching route option-based path
   - Calls `createCachedMessage` (claude-sonnet-4-6, max_tokens: 800)
   - Parses `role_context` and `career_signal` from the JSON response
   - Upserts to `coaching_cache` with key: `global:{challengeId}:{step}:{questionId}:{optionId}:{roleId}`
4. Concurrency cap: `pLimit(5)` — avoids Anthropic rate limits
5. Errors are logged but never thrown — publish never fails due to warming

**Scale:**
- 4 steps × ~3 questions × 4 options × 10 roles = ~480 calls per challenge
- One-time cost: ~$1.44 per challenge (amortized across all future users)

**Runtime effect:**
- Coaching route checks `global:` key first — serves in ~50 ms instead of 2–5 s
- Falls through to AI path only for freeform / elaboration (genuinely dynamic)

**Verify after publish:**
```sql
SELECT count(*) FROM coaching_cache WHERE cache_key LIKE 'global:{challengeId}%';
-- expect ~480 rows
```

---

## DB table reference

| Table | Key columns | Notes |
|---|---|---|
| `challenges` | `id`, `scenario_context`, `scenario_trigger`, `is_published` | Published challenges |
| `flow_steps` | `challenge_id`, `step` | One per step (frame/list/optimize/win) |
| `step_questions` | `flow_step_id`, `question_text`, `question_nudge`, `sequence` | 1–3 per step |
| `flow_options` | `question_id`, `option_text`, `quality`, `explanation`, `framework_hint` | 4 per question |
| `coaching_cache` | `cache_key`, `role_context`, `career_signal` | Pre-generated + user-specific |
| `role_lenses` | `id`, `label` | ~10 engineering roles |
| `challenge_drafts` | `id`, `status`, `mode` | `mode='local'` for job-server |
| `draft_flow_steps` | `draft_id`, `step` | Draft version of flow_steps |
| `draft_questions` | `draft_step_id`, `question_text` | Draft version of step_questions |
| `draft_options` | `draft_question_id`, `option_text`, `quality` | Draft version of flow_options |
