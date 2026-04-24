# Content Generation Runbook

Complete guide for generating FLOW challenges and inserting them into the HackProduct database.

---

## Prerequisites

### 1. Environment variables

Add to `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tikkhvxlclivixqqqjyb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
ADMIN_SECRET=hackproduct-admin-dev
NEXT_PUBLIC_ADMIN_SECRET=hackproduct-admin-dev
NEXT_PUBLIC_MOCK_MODE=true
```

`NEXT_PUBLIC_MOCK_MODE=true` bypasses auth middleware on `/admin/*` routes — required for local generation without a login session.

### 2. Claude Code CLI

The job server shells out to `claude -p` using your subscription. No `ANTHROPIC_API_KEY` needed.

```bash
claude --version      # confirm it's on PATH
claude               # confirm you're logged in (should show the REPL)
```

If not installed: `npm install -g @anthropic-ai/claude-code`

### 3. Install dependencies

```bash
npm install
```

---

## Start the supporting services

Every generation method below requires both services running.

**Terminal 1 — dev server:**
```bash
npm run dev
```
Wait for `▲ Next.js ready on http://localhost:3000`

**Terminal 2 — job server:**
```bash
npx tsx --tsconfig tsconfig.json scripts/job-server.ts
```

The job server polls Supabase every 2 seconds for `pending` jobs and processes them using the Claude CLI subprocess. It logs each step as it runs.

---

## Option A: Single challenge via the admin UI

1. Open `http://localhost:3000/admin/content`
2. Click **+ New Challenge**
3. Choose input type: **URL**, **Text**, or **Question**
4. Paste your content
5. Select **Local (Claude Code)** mode
6. Click **Generate Challenge**

The job appears in the table. Status cycles: `pending → generating → review`.

Once in `review`:

7. Click **Review →** to open the draft
8. Read through the scenario and each FLOW step
9. Approve or edit individual steps inline
10. Click **Publish** — the challenge is inserted into the `challenges` table with `is_published = true`

---

## Option B: Bulk generation via Notion

Use the [Challenge Pipeline](https://www.notion.so/fa3e6f7e-0fb3-4038-ab90-04b9a3039379) Notion database as a content queue.

### One-time setup

1. Create a Notion integration at `notion.so/my-integrations`
2. Copy the integration token (`secret_xxx...`)
3. Open the Challenge Pipeline database → Share → invite your integration

### Add rows to Notion

| Property | Value |
|---|---|
| **Topic** | Short label, e.g. "Pricing a B2B SaaS feature" |
| **Input Type** | `url`, `text`, or `question` |
| **Source** | URL or raw text. If blank, Topic is used as the question. |
| **Status** | Set to `Queued` |

### Run the ingest script

```bash
NOTION_TOKEN=secret_xxx npx tsx --tsconfig tsconfig.json scripts/bulk-ingest.ts
```

The script:
- Reads all rows where `Status = Queued`
- Calls `POST /api/admin/content/jobs` for each
- Updates each Notion row: `Status → Generating`, `Job ID → <uuid>`
- Marks failures as `Status → Failed` with a reason in the Notes field

The job server picks up the jobs automatically. Monitor progress at `http://localhost:3000/admin/content`.

---

## Option C: Directly from Claude Code (using the skill)

This is the fastest path for ad-hoc generation without opening a browser.

### Install the skill bundle (one-time)

```bash
# From the repo root
claude skills install backend_planning/hackproduct-v2-bundle
```

### Generate a challenge

With the dev server and job server running, open a Claude Code session in the project root and prompt:

```
Generate a challenge about pricing strategy for a B2B SaaS startup
```

```
Generate a challenge from this URL: https://stratechery.com/...
```

```
Generate a challenge from this question: "You're a PM at Stripe. Finance team wants 
to monetize failed payment retries. What do you do?"
```

Claude Code will:
1. Call `POST /api/admin/content/jobs` to create the job
2. Poll job status until it reaches `review`
3. Print the review URL: `http://localhost:3000/admin/content/review/<job_id>`

### Auto-publish without reviewing

```
Generate and auto-publish a challenge about activation metrics for consumer apps
```

Claude Code approves all steps and calls the publish endpoint directly. The row is inserted into `challenges` immediately.

---

## Managing tags after publish

Every published challenge has an **Edit Tags →** link in the admin content list. This opens a tag editor for:

- **Paradigm** — `traditional`, `ai_assisted`, `agentic`, `ai_native`
- **Difficulty** — `warmup`, `standard`, `advanced`, `staff_plus`
- **Industry** and **Sub-vertical** — free text
- **Estimated minutes**
- **Primary / Secondary competencies** — checkboxes from the 6-competency taxonomy
- **Relevant roles** — checkboxes (swe, pm, data_eng, etc.)
- **Frameworks, company tags, freeform tags** — chip editors

---

## What gets written to the database

On publish, these tables are written in order:

```
1. challenges         — scenario, paradigm, difficulty, all taxonomy fields
2. flow_steps ×4      — frame, list, optimize, win with theme + grading_weight
3. step_questions     — 1 per step (question_text, nudge, competencies)
4. flow_options ×4    — per question: best / good_but_incomplete / surface / plausible_wrong
```

The `generation_jobs` row updates to `status = published` with `result_challenge_id` pointing to the new challenge.

---

## Pipeline internals

Each job runs 6-10 Claude CLI calls depending on input type:

| Step | When | Claude call | Output |
|---|---|---|---|
| 0a | `input_type=question` && short open-ended prompt | Expand source | 600-1000 words of source-like material, chosen angle, grounding claims |
| 0b | After expansion | Verify | Corrected source with fabricated claims stripped. Fails job if unsalvageable. |
| 1 | Always | Scrape | `situation_summary`, `data_points`, **`insights`**, **`excerpts`**, `source_richness` |
| 2 | Always | Scenario | `role`, `context`, `trigger`, `question`, `explanation`, `engineer_standout`, **`specific_detail`** |
| 3 | Per FLOW step | Question plan | `question_count` (1-3), per-question `focus` and `grading_weight` |
| 4 | Per question | MCQ with grounding pack | `question_text`, `nudge`, 4 options. The prompt includes excerpts, data_points, insights, focus, siblingFocuses. |
| 5 | Always | Taxonomy | `paradigm`, `industry`, `difficulty`, engineering-leaning `relevant_roles`, etc. |

Bold fields are new grounding additions that thread source specificity into MCQ generation.

### Validator: hard errors vs warnings

**Hard errors** (block publish):
- Structural: 4 FLOW steps, 4 options each, one of each quality, valid competency enums
- Required scenario and metadata fields

**Warnings** (reviewer sees, doesn't block):
- Word count variance, best-not-longest, nudge length/formatting
- **Grounding**: No MCQ option in a question references any `data_points` / `specific_detail` / `insights` token — signals the question may be generic
- **Sibling overlap**: Two questions in the same step share ≥3 content words
- **Voice**: User-facing copy contains second-person role framing ("you are a…", "as a…", "imagine you"). Reviewer should rewrite before publish.

### FLOW step → intellectual theme mapping

| Step | Theme | Grading weight |
|---|---|---|
| Frame | T1: Upstream Before Downstream | 25% |
| List | T4: Width Before Depth | 25% |
| Optimize | T5: Name the Criterion, Name the Sacrifice | 25% |
| Win | T7: A Recommendation Is a Falsifiable Hypothesis | 25% |

### Open-ended prompts: expansion + verification

Short question inputs like "how do you improve ChatGPT" trigger two extra Claude calls before the main pipeline:

1. **Expand** — the model picks 2-3 concrete tensions in the product/company, chooses the most interesting, writes 600-1000 words of source-like material around it, and self-reports every factual claim with a confidence level.
2. **Verify** — a second call flags fabricated or unsubstantiated claims. Low-confidence metrics get stripped or converted to qualitative framing ("users have reported X"). If the source is unsalvageable, the job fails with a reason.

From that point the pipeline runs normally against the verified source. For URL or long-text inputs, both steps are skipped. Watch the job-server logs to see which path ran.

---

## Troubleshooting

**Admin page redirects to /login**
— Ensure `NEXT_PUBLIC_MOCK_MODE=true` is set in `.env.local` and restart the dev server.

**Job stays `pending` forever**
— Check that the job server (Terminal 2) is running. Check its logs for errors.

**`claude: command not found`**
— Install Claude Code: `npm install -g @anthropic-ai/claude-code` then `claude /login`.

**`SUPABASE_SERVICE_ROLE_KEY` missing**
— The job server connects directly to Supabase and needs the service role key, not just the anon key.

**Paradigm constraint violation**
— The validator normalizes LLM output to `traditional/ai_assisted/agentic/ai_native`. If you see this error, the taxonomy prompt may have been modified — check `src/lib/content/prompts.ts`.

**Notion ingest: `NOTION_TOKEN` not set**
— Export it in the same terminal session or add to `.env.local`.
