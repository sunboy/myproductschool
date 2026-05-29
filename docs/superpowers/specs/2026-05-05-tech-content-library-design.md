# Tech Content Library — Design Spec

**Date:** 2026-05-05
**Status:** Approved

## Context

HackProduct's existing learn modules cover product thinking (FLOW, User Models, Root Cause, etc.). The platform needs a comprehensive tech content library — data modeling, system design, coding, SQL, agentic systems, LLMs, LLM internals, Claude Code, Codex — targeted at any tech worker looking to upskill, find a job, transition roles, or prepare for interviews. Casual newsletter-style readers are also a first-class audience.

The chapter-based content is the source of truth. Everything else — newsletters, blog posts, short-form — is derived from it without extra generation.

---

## Catalog Structure

One unified modules catalog. Track headers break the grid visually. The difficulty filter still works across all tracks.

### Tracks

| Track key | Label | Accent | Modules |
|---|---|---|---|
| `foundations` | Foundations | Green | Data Modeling, SQL, Coding Patterns |
| `systems` | Systems | Indigo | System Design, Distributed Systems |
| `ai-llms` | AI & LLMs | Amber | LLM Internals, Agentic Systems, RAG |
| `new-era` | New Era | Purple | Claude Code, Codex, Agentic Workflows |
| `product-thinking` | Product Thinking | Teal | FLOW, User Models, Root Cause (existing) |

### Difficulty mapping (existing enum, unchanged)

| Level | Who |
|---|---|
| `foundation` | Career switchers, students |
| `beginner` | 0-2 yrs, junior devs |
| `intermediate` | 2-5 yrs, mid-level |
| `advanced` | Senior engineers |
| `new-era` | AI-native tooling, no baseline assumed |

### Initial catalog

Opus produces a `catalog-manifest.json` upfront covering ~40-50 modules across all tracks. Each entry includes: `name`, `tagline`, `difficulty`, `track`, `chapter_titles[]`, `learning_objectives[]`, `est_minutes`, `cover_color`, `accent_color`, and `image_needed` per chapter.

---

## Content Generation Pipeline

No API calls. All generation runs as Claude Code sub-agents using the subscription.

### Agent roles

**Opus — Catalog Architect (runs once)**
Reads the full topic list. Produces `scripts/content/catalog-manifest.json` and `scripts/content/style-guide.md`. The style guide is inherited by every Sonnet agent — this is how consistent voice is enforced without repeating instructions per agent.

**Haiku × N — Research Scrapers (parallel wave)**
One Haiku agent per chapter. Given a chapter title + learning objectives, it web-searches and reads docs, collecting raw facts, examples, analogies, and real numbers. Writes `scripts/content/research/[module-slug]/[chapter-slug].json`. No writing — just raw signal.

Sourcing rules Haiku follows:
- Priority sources: Anthropic docs, OpenAI docs, Netflix Tech Blog, Databricks Blog, Meta Engineering, Google Research, Harvard/Stanford course materials, official GitHub repos
- Recency: prefer content from the last 18 months; flag anything older than 2 years
- Data modeling / SQL: explicitly cover cardinality explosion, bridge tables, surrogate vs natural keys, slowly changing dimensions, schema evolution, index internals, query plan reading

**Sonnet × N — Chapter Writers (parallel wave, blocked on Haiku)**
One Sonnet agent per chapter. Reads the research pack + style guide. Writes `hook_text`, `body_mdx` (with inline SVG/HTML figures), and figure specs. Calls Codex when `image_needed: true`. Inserts completed chapter to Supabase.

**Codex — Illustrator (on demand)**
Called by Sonnet when a chapter needs a complex architectural diagram or conceptual visual. Receives a precise illustration brief. Codex runs locally on the user's laptop — the orchestrator spawns a Codex sub-agent via the Claude Code Agent tool (referencing https://community.openai.com/t/introducing-codex-plugin-for-claude-code/1378186 for the invocation pattern). Returns an image stored at `scripts/content/images/[module-slug]/[chapter-slug]-*.png` and referenced in the chapter MDX. Not every chapter — hybrid approach: Codex for complex visuals, inline HTML/SVG for simple diagrams and comparisons.

### Execution flow

```
① Opus agent
   → reads topic list
   → writes catalog-manifest.json
   → writes style-guide.md

② Haiku × N (parallel)
   → each reads 1 chapter spec
   → web search + doc scrape
   → writes research-pack.json

③ Sonnet × N (parallel, after Haiku)
   → reads research-pack + style guide
   → writes chapter MDX
   → calls Codex if image_needed
   → inserts to Supabase

④ Done — modules appear in admin UI and reader
```

### Files on disk

```
scripts/content/
  catalog-manifest.json
  style-guide.md
  research/[module-slug]/[chapter-slug].json
  chapters/[module-slug]/[chapter-slug].mdx
  images/[module-slug]/[chapter-slug]-*.png
```

**Resumable:** Each step checks if its output file already exists before running. Kill and restart — completed chapters are skipped automatically.

---

## UI Changes

### What stays unchanged
- Chapter reader (`src/app/(app)/explore/modules/[slug]/[chapter]/page.tsx`) — existing left nav with chapter list + progress and right sidebar. No changes.

### What changes

**1. Catalog page (`src/app/(app)/explore/modules/page.tsx`)**
Add track section headers to break the module grid by category. Each header shows the track label and accent color. The difficulty filter continues to work across all tracks.

**2. Module detail page (`src/app/(app)/explore/modules/[slug]/page.tsx`)**
Show `hook_text` as a one-liner below each chapter title in the chapter list. This field already exists in the `LearnChapter` schema. Readers know what they're clicking into before committing.

---

## DB Changes

One migration — add a `track` column to `learn_modules`:

```sql
ALTER TABLE learn_modules
  ADD COLUMN track TEXT
  CHECK (track IN ('foundations', 'systems', 'ai-llms', 'new-era', 'product-thinking'));

-- Backfill existing modules
UPDATE learn_modules SET track = 'product-thinking';
```

No other schema changes. `hook_text`, `body_mdx`, and `figures` on `learn_chapters` already support everything needed.

---

## Writing Style

Sonnet agents inherit this from `style-guide.md` produced by Opus.

**Voice:** Staff engineer thinking out loud. Confident, direct, occasionally opinionated. Never academic, never corporate. Reads like a great internal doc.

**Hard rules:**
- No em dashes
- No AI slop: delve, leverage, robust, seamlessly, holistic, navigate, unlock, ensure, tailored, cutting-edge, revolutionary
- No padding sentences — every sentence earns its place
- No "in this chapter we will learn" intros
- No bullet-point-everything — real paragraphs when the idea needs it

**Structure per chapter:**
- `hook_text`: 1-2 sentences. The sharpest, most surprising thing about this topic
- Opening: drop straight into the problem or situation. No preamble
- Body: 3-5 sections with real examples, real numbers, real tradeoffs. Inline figures at the point of explanation
- Closing: what to remember, what to do next. One paragraph max

**Length:** 800-1200 words per chapter. Dense, not padded. A reader finishes in 6-8 minutes and gets something real.

---

## Repurposing (no extra generation needed)

Each chapter's `hook_text` + `body_mdx` already contains everything needed:

| Format | Source |
|---|---|
| Newsletter | `hook_text` + first 2 sections + CTA link |
| Blog post | Full `body_mdx` → HTML with Codex image as og:image |
| Short form | `hook_text` + 3 key bullets extracted from body |

Export endpoints can be added later. The content structure is already right.

---

## Build List

1. **Migration** — add `track` column to `learn_modules`, backfill existing rows
2. **Opus catalog script** (`scripts/content/generate-catalog.ts`) — produces manifest + style guide
3. **Orchestrator script** (`scripts/content/run-pipeline.ts`) — spawns Haiku + Sonnet waves, handles Codex calls, inserts to DB. Resumable.
4. **Catalog UI** (`src/app/(app)/explore/modules/page.tsx`) — add track section headers
5. **Module detail UI** (`src/app/(app)/explore/modules/[slug]/page.tsx`) — show `hook_text` per chapter in the list

---

## Verification

1. Run `npx tsc --noEmit` — clean
2. Run Opus catalog script — inspect `catalog-manifest.json` for completeness and quality
3. Run orchestrator on 2 pilot modules (one from `foundations`, one from `ai-llms`)
4. Check Supabase — `learn_modules` and `learn_chapters` rows inserted correctly
5. Open `/explore/modules` — track headers render, modules appear under correct tracks
6. Open a module detail — `hook_text` visible per chapter
7. Open a chapter — existing reader renders the new content correctly
8. For a Codex-illustrated chapter — confirm image renders inline at the right point
