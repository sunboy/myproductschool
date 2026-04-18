# Content Management Backend — Design Spec
**Date:** 2026-04-17
**Branch:** spec/content-management
**Authors:** Sandeep + cofounder (internal tool)

---

## Context

HackProduct challenges require careful authoring — each challenge is a rich learning artifact with a FLOW-structured scenario, 4 MCQ options per question grounded in 7 intellectual themes (T1–T7), and optional data points/SVG/table visuals. Currently challenges are seeded via manual TypeScript scripts (`scripts/seed-v2-challenges.ts`) with no admin UI or generation pipeline.

This design creates a content management backend that:
1. Accepts raw input (URL, pasted article, or plain question)
2. Scrapes + enriches via Haiku agents
3. Generates a full challenge (scenario + all FLOW steps + MCQs) grounded in the mental models framework
4. Surfaces it for human review in a single-page admin UI with inline editing and bulk approve
5. Publishes to the live DB by exploding the draft JSON into production tables

The system defaults to **local mode** (zero API cost — browser triggers Claude Code locally via localtunnel) with **API mode** as a flag-flip fallback.

---

## Architecture

### Mode Routing

```
GENERATION_MODE=local   → browser → Next.js admin API → generation_jobs row →
                          local job server (polls DB, runs Claude Code subprocess) →
                          writes result back to draft_challenges

GENERATION_MODE=api     → browser → Next.js admin API →
                          Anthropic SDK inline (Haiku scrape + Sonnet generate) →
                          writes result back to draft_challenges
```

Local mode uses localtunnel (`npx localtunnel --port 3000`) so the browser can reach the dev server. The local job server is a small Node script (`scripts/job-server.ts`) that polls `generation_jobs` every 2s and shells out to Claude Code.

---

## Data Model

### New table: `generation_jobs`

```sql
CREATE TABLE generation_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_type    text NOT NULL CHECK (input_type IN ('url', 'text', 'question')),
  input_raw     text NOT NULL,
  scraped_text  text,                    -- filled by scraper agent
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','scraping','generating','review','published','failed')),
  mode          text NOT NULL DEFAULT 'local' CHECK (mode IN ('local','api')),
  result_challenge_id text REFERENCES challenges(id),
  error_message text,
  created_by    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

### New table: `draft_challenges`

```sql
CREATE TABLE draft_challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid REFERENCES generation_jobs(id),
  challenge_json  jsonb NOT NULL,        -- full nested challenge tree (see shape below)
  review_status   text NOT NULL DEFAULT 'pending_review'
                  CHECK (review_status IN ('pending_review','approved','rejected')),
  reviewer_notes  text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

### `challenge_json` shape

```jsonc
{
  "scenario": {
    "role": "Senior PM at a B2B SaaS company",
    "context": "...",
    "trigger": "...",
    "question": "...",           // core PM question being explored
    "explanation": "...",        // why this question matters to product thinking
    "engineer_standout": "...",  // what separates an engineer's answer
    "data_points": [],           // optional — only populated when source has real metrics
    "visuals": []                // optional — SVG strings or markdown tables only, when genuinely clarifying
  },
  "flow_steps": [
    {
      "step": "frame",
      "theme": "T1",             // anchoring intellectual theme (T1–T7)
      "theme_name": "Upstream Before Downstream",
      "step_nudge": "...",       // ≤40 words, ends with "?"
      "grading_weight": 0.25,
      "questions": [
        {
          "question_text": "...",
          "question_nudge": "...",
          "sequence": 1,
          "grading_weight_within_step": 1.0,
          "target_competencies": ["motivation_theory", "strategic_thinking"],
          "options": [
            {
              "label": "A",
              "quality": "best",
              "text": "...",
              "explanation": "...",
              "competencies": ["motivation_theory"]
            },
            { "label": "B", "quality": "good_but_incomplete", "text": "...", "explanation": "...", "competencies": [...] },
            { "label": "C", "quality": "surface",             "text": "...", "explanation": "...", "competencies": [...] },
            { "label": "D", "quality": "plausible_wrong",     "text": "...", "explanation": "...", "competencies": [...] }
          ]
        }
      ]
    }
    // list (T2/T4), optimize (T5), win (T3/T7)
  ],
  "metadata": {
    "paradigm": "...",
    "industry": "...",
    "sub_vertical": "...",
    "difficulty": "standard",
    "estimated_minutes": 20,
    "primary_competencies": [...],
    "secondary_competencies": [...],
    "frameworks": [...],
    "relevant_roles": [...],
    "company_tags": [...],
    "tags": []
  }
}
```

### Existing tables — no schema changes

`challenges`, `flow_steps`, `step_questions`, `flow_options` are unchanged. Publishing explodes `challenge_json` into these tables following the existing insert order from the content-authoring skill.

---

## Generation Pipeline

### Step 1 — Job creation
`POST /api/admin/content/jobs`
- Body: `{ input_type, input_raw, mode }`
- Creates `generation_jobs` row, `status=pending`
- Returns `{ job_id }`
- In `api` mode: immediately triggers Steps 2–3 async
- In `local` mode: returns job_id; local job server picks it up

### Step 2 — Scrape & enrich (Haiku)
- If `input_type=url`: fetch HTML, extract readable text (mozilla/readability or cheerio)
- Search for 2-3 supporting data points (quantitative, from source or first-order inference)
- Identify if any tables or structural content worth rendering as SVG/markdown table
- Update job: `scraped_text`, `status=generating`

### Step 3 — Challenge generation (Sonnet)

Runs sequentially, one FLOW step at a time. Each step is anchored to its primary intellectual theme:

| FLOW Step | Primary Theme | Secondary Theme | Generation Focus |
|-----------|--------------|-----------------|------------------|
| Frame     | T1 (Upstream Before Downstream) | T6 (Exclusion Is Precision) | Root cause identification, what to exclude |
| List      | T4 (Width Before Depth)         | T2 (Job Behind the Feature) | Structurally distinct options, jobs-to-be-done |
| Optimize  | T5 (Name the Criterion)         | —                           | Explicit tradeoff criteria, named sacrifice |
| Win       | T7 (Falsifiable Hypothesis)     | T3 (Simulate the Other Side)| Crisp recommendation, stakeholder simulation |

Generation sub-steps:
1. **Scenario extraction** — role, context, trigger, question, explanation, engineer_standout
2. **Data points + visuals** — only if source material has real quantitative or structural content; SVG/markdown table format
3. **MCQ generation per step** — 4 options with quality/competencies/explanation, validated: ±20% word count, no cross-references, longest ≠ best
4. **Nudge writer** — per step, ≤40 words, ends with "?", references scenario
5. **Competency tagger** — 2-3 primary + 1-2 secondary from the 6 competency axes
6. **Taxonomy tagger** — paradigm, industry, difficulty, frameworks, company_tags
7. **Content validator** — structural checks before saving draft

Output written to `draft_challenges.challenge_json`, job `status=review`.

### Step 4 — Local job server (`scripts/job-server.ts`)

```
poll generation_jobs WHERE status='pending' every 2s
→ set status='scraping'
→ spawn Claude Code subprocess: `claude -p "<scrape prompt>" --output-format json`
→ set status='generating'
→ spawn Claude Code subprocess: `claude -p "<generation prompt>" --output-format json`
→ write draft_challenges row
→ set status='review'
```

Runs via: `npx ts-node scripts/job-server.ts`
Expose dev server via: `npx localtunnel --port 3000`

**Prerequisites:** Claude Code CLI must be installed and authenticated (`claude` in PATH). Both founders already have Claude subscriptions — this is the zero-cost local path.

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/content/jobs` | Create generation job |
| `GET`  | `/api/admin/content/jobs` | List all jobs with status |
| `GET`  | `/api/admin/content/jobs/[id]` | Poll job status + draft |
| `PATCH`| `/api/admin/content/drafts/[id]` | Save inline edits to challenge_json |
| `POST` | `/api/admin/content/drafts/[id]/approve-step` | Approve a single FLOW step |
| `POST` | `/api/admin/content/drafts/[id]/approve-all` | Bulk approve all steps |
| `POST` | `/api/admin/content/drafts/[id]/publish` | Explode JSON → production tables |
| `POST` | `/api/admin/content/drafts/[id]/regenerate-step` | Re-run generation for one step |

All routes require `ADMIN_SECRET` header (simple shared secret, not full auth).

---

## Admin UI

### `/admin/content` — Hub (extend existing page)
- Jobs list: status badge, input preview, created_at, mode (local/api)
- "New Challenge" button → opens authoring drawer

### Authoring Drawer
- Tab: **URL** | **Text** | **Question**
- Mode toggle: `Local (Claude Code)` / `API`
- Submit → creates job, drawer shows live status (polls every 2s)
- On `status=review`: "Open Review" link

### `/admin/content/review/[job_id]` — Review Page
- **Scenario card** (top): role, context, trigger, question, explanation, engineer_standout — all editable inline
- **Data points** (collapsed by default, shown only if populated): list of bullet stats
- **Visuals** (collapsed by default, shown only if populated): rendered SVG or markdown table
- **4 FLOW step panels** (stacked, full width):
  - Theme badge (e.g. "T1 · Upstream Before Downstream")
  - Step nudge (editable)
  - Per question: question text + 4 option cards with quality label, text, explanation, competencies — all editable
  - Step action: **Approve Step** / **Regenerate Step**
- **Sticky footer**: `Bulk Approve All` · `Publish` · `Reject`
- Publish: explodes JSON → live tables, redirects to hub

---

## Skill Updates

### `hackproduct-content-authoring/SKILL.md`
Add:
- `question`, `explanation`, `data_points` (optional), `visuals` (optional — SVG/markdown table only, use judiciously) to scenario output spec
- Per-step `theme` field: which of T1–T7 anchors this step, with generation instructions to apply that theme's reasoning pattern when writing MCQ options
- Content validator: check `data_points` and `visuals` are absent unless genuinely grounded in source

### `src/lib/v2/skills/ai/mcq-option-gen.ts` (when built)
- Accept `anchoring_theme` param
- System prompt includes the theme's reasoning tradition and what applying it looks like vs. the anti-pattern

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `supabase/migrations/025_content_management.sql` | New — `generation_jobs` + `draft_challenges` tables |
| `src/app/api/admin/content/jobs/route.ts` | New — POST (create), GET (list) |
| `src/app/api/admin/content/jobs/[id]/route.ts` | New — GET (poll status) |
| `src/app/api/admin/content/drafts/[id]/route.ts` | New — PATCH (inline edit) |
| `src/app/api/admin/content/drafts/[id]/approve-step/route.ts` | New |
| `src/app/api/admin/content/drafts/[id]/approve-all/route.ts` | New |
| `src/app/api/admin/content/drafts/[id]/publish/route.ts` | New — explode JSON → production tables |
| `src/app/api/admin/content/drafts/[id]/regenerate-step/route.ts` | New |
| `src/lib/content/scraper.ts` | New — URL fetch + readability extraction |
| `src/lib/content/generator.ts` | New — orchestrates Haiku scrape + Sonnet generation |
| `src/lib/content/publisher.ts` | New — explodes challenge_json → DB inserts |
| `src/lib/content/validator.ts` | New — structural validation (reuses content-validator skill logic) |
| `scripts/job-server.ts` | New — local polling job runner |
| `src/app/(admin)/admin/content/page.tsx` | Modify — add jobs list + authoring drawer |
| `src/app/(admin)/admin/content/review/[job_id]/page.tsx` | New — review page |
| `backend_planning/hackproduct-v2-bundle/skills/hackproduct-content-authoring/SKILL.md` | Modify — add question/explanation/visuals/theme fields |

---

## Verification & Testing

### Unit Tests

- **`src/lib/content/validator.ts`** — test all structural constraints:
  - Exactly 4 options per question, exactly one of each quality
  - Option word count variance ≤20%, longest ≠ best
  - Step nudge ≤40 words, ends with "?"
  - `data_points` and `visuals` absent unless explicitly populated
- **`src/lib/content/publisher.ts`** — test JSON → DB row mapping with fixture challenge_json
- **`src/lib/content/scraper.ts`** — test URL extraction with mocked HTML responses

### Integration Tests (API routes against real DB)

- `POST /api/admin/content/jobs` → confirm `generation_jobs` row created, `status=pending`
- `GET /api/admin/content/jobs/[id]` → confirm status polling returns current state
- `PATCH /api/admin/content/drafts/[id]` → confirm inline edit saves to `challenge_json`
- `POST /api/admin/content/drafts/[id]/approve-step` → confirm per-step approval flag set
- `POST /api/admin/content/drafts/[id]/approve-all` → confirm all steps flagged
- `POST /api/admin/content/drafts/[id]/publish` → confirm rows inserted in `challenges`, `flow_steps`, `step_questions`, `flow_options`; `is_published=true`
- `POST /api/admin/content/drafts/[id]/regenerate-step` → confirm specific step overwritten, others unchanged

### End-to-End Tests (Playwright)

**Authoring flow — local mode:**
1. Navigate to `/admin/content`
2. Click "New Challenge" → drawer opens
3. Select URL tab, paste a PM article URL, set mode=Local, submit
4. Assert job status badge progresses: `pending → scraping → generating → review`
5. Click "Open Review" → `/admin/content/review/[job_id]`
6. Assert scenario card renders: role, context, trigger, question, explanation visible
7. Assert 4 FLOW step panels render, each with theme badge (e.g. "T1 · Upstream Before Downstream")
8. Assert each step has ≥1 question with 4 option cards showing quality labels
9. Edit a nudge inline → assert save persists on refresh
10. Click "Approve Step" on Frame → badge turns green
11. Click "Bulk Approve All" → all steps green
12. Click "Publish" → redirected to `/admin/content`, job `status=published`
13. Assert new challenge row appears in hub with published badge

**Learner playback — golden path:**
14. Navigate to `/challenges` as a learner user
15. Assert newly published challenge appears in list
16. Start the challenge → confirm FLOW workspace loads
17. Answer all 4 FLOW steps (pure MCQ path)
18. Assert grading interstitial appears, score computed
19. Assert challenge feedback page renders with Luma coaching

**API mode fallback:**
20. Set `GENERATION_MODE=api` in env
21. Repeat steps 2–13 above
22. Assert same end state — challenge published and playable

**Regenerate step:**
23. On a `pending_review` draft, click "Regenerate Step" on List step
24. Assert status briefly shows `generating` for that step
25. Assert List step options replaced, Frame/Optimize/Win unchanged

### Manual Smoke (run after each deploy)
1. Generate one challenge from a real PM article URL (local mode)
2. Review, bulk approve, publish
3. Play the challenge end-to-end as a learner
4. Confirm score and Luma feedback render correctly
