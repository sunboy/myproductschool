# FLOW Module Content Plan

The plan for building out the FLOW course module at `/explore/modules/flow` (delivered via `learn_modules` + `learn_chapters`). Written 2026-04-20.

## What we have

### In-repo research material

| Source | What's in it | Shape |
|---|---|---|
| `content/CONTENT_PLANNING.md` (522 lines) | Full content inventory. 8 modules already written as FLOW JSON (segmentation, problem ID, success metrics, distribution vs novelty, tradeoffs, JTBD, strategy & moats, engineer-to-PM mindset). Each with FLOW step focus, key frameworks, anti-patterns, worked examples. | Structured markdown, ready to lift |
| `content/MENTAL_MODELS_FRAMEWORK.md` (290 lines) | Maps 6 expert thinking traditions (Rahul Pandey, Shreyas Doshi, April Dunford, Ben Erez, Gergely Orosz, Marty Cagan, Gibson Biddle) into FLOW rubric criteria and the 6 competency dimensions | Narrative + mapping tables |
| `content/CHALLENGE_SPEC.md` (176 lines) | Challenge data shape and generation spec | Schema spec |
| `content/GRADING_SYSTEM.md` (255 lines) | How rubric-anchored grading works | Explainer |
| `FLOW_Framework_IEEE.pdf` (7 pages) | IEEE-style paper defining the FLOW framework itself | Academic framing, citable |
| `backend_planning/hackproduct-v2-bundle/skills/*/SKILL.md` | 5 skill specs (content-authoring, grading, coaching, challenge delivery, learner DNA). Includes the 7 intellectual themes (T1-T7) with thinker attributions | Structured specs |
| `backend_planning/hackproduct-v2-bundle/skills/hackproduct-grading/references/freeform-grading-prompt.md` | Detailed theme → thinker → anti-pattern mapping | Reference prompts |
| `content/CONTENT_PLANNING.md` editorial section | 8 published Notion posts ("Stop Segmenting by Age", "The Bug You Shouldn't Fix", "All Your Metrics Are Green", "It Depends Is Not an Answer", "Engineers Don't Lack Intuition") | Narrative essays, already written |
| Seed data (`supabase/seed.sql`) | FLOW concepts scattered across rows. Not a module. | SQL inserts |

### Referenced but missing from repo

`flow_curriculum.json` (8 modules, 139 questions), `MASTER_CORPUS.md`, `PRODUCT_SENSE_INTERVIEW_CORPUS.md`, `PRODUCT_SENSE_EXAMPLE_ANSWERS.md`, `PRODUCT_TEARDOWN_RESEARCH.md`. Referenced as Source Files on line 512 of `CONTENT_PLANNING.md`. Likely in a sibling repo or folder. **Action: locate these before starting — they may already contain most of what we need to build.**

### DB shape

Migration `026_learn_tables.sql`:
- `learn_modules` — id, slug, name, tagline, difficulty, chapter_count, est_minutes, cover_color, accent_color
- `learn_chapters` — id, module_id, slug, title, subtitle, sort_order, `hook_text`, `body_mdx`
- `user_learn_progress` — per-chapter completion

So a chapter is: title + subtitle + 1 hook line + MDX body. MDX lets us embed interactive components.

### What's rendered

`src/app/(app)/learn/modules/page.tsx` lists modules as cards with a cover color and progress bar. The route the user cited, `/explore/modules/flow`, likely maps via rewrite to the `learn_modules` detail page (or is the new home for it).

**No FLOW module currently exists in the DB.** This plan builds it.

## Audience

Engineers first: staff engineers, tech leads, founding engineers, EMs, SWEs. PMs secondary. Module content explains WHY FLOW exists, teaches the reasoning moves behind each step, and grounds every idea in a named tradition (Doshi, Cagan, Dunford, Pandey, Orosz, Biddle, Erez). No "you are a tech lead" second-person framing in the chapter body (same voice rule as content-generation).

## Proposed module structure

One module: `flow`. 8 chapters. ~10 minutes each. Written in `body_mdx` with inline examples and small interactive components (quiz-in-chapter, decision-tree picker).

### Chapter outline

| # | Chapter slug | Title | Core question answered |
|---|---|---|---|
| 1 | `why-flow` | Why FLOW (and why engineers fail product interviews) | What's the gap between technical reasoning and product reasoning? |
| 2 | `frame` | Frame — the real problem is never the stated one | How do you tell a symptom from a root cause? |
| 3 | `list` | List — options you missed are more interesting than options you found | Why do structurally distinct options matter more than many variations? |
| 4 | `optimize` | Optimize — a tradeoff you can't name isn't a tradeoff | Why does naming the criterion AND the sacrifice separate product thinking from preference? |
| 5 | `win` | Win — a recommendation is a falsifiable hypothesis | What makes a recommendation worth making versus hedging? |
| 6 | `seven-themes` | The 7 intellectual themes behind the rubric | Which reasoning move is each FLOW step training? |
| 7 | `engineer-to-product` | Engineer-to-product mindset shift | What do engineers already have, and what do they need to learn? |
| 8 | `using-flow-live` | Using FLOW live — on the job and in interviews | How do you apply FLOW when someone is watching and judging? |

### Per-chapter content shape

Every chapter has:

1. **Hook** (`hook_text`): 1-2 sentences. A specific observation that makes the reader want to click. Tone: Shreyas Doshi tweet.
2. **Cold open** (first MDX section, ~60 words): A concrete situation. Drops straight into the action. No role framing.
3. **The move** (~300 words): What reasoning move this chapter is teaching. What it corrects.
4. **Two examples** (~150 words each): One from a named company (grounded, citable). One from an engineering-adjacent situation (infra call, architecture review, build-vs-buy).
5. **The tradition** (~120 words): Which thinker's work this maps to, 1-2 named quotes or positions, an IEEE citation back to `FLOW_Framework_IEEE.pdf` where relevant.
6. **Anti-patterns to watch for** (~80 words): 3-4 bullets. Each is a specific wrong move, not a vague warning.
7. **Test yourself**: 1 inline MCQ (reuse the challenge schema) with the 4 quality archetypes. Answer reveals map to the chapter's main point.
8. **What's next**: 1-line pointer to the next chapter or a matching practice challenge.

Total per chapter: ~700-900 words of prose + 1 MCQ + 1-2 links. Fits the "10 minute" target.

## Source material strategy

### In-house (own before adding)

1. **Lift from `CONTENT_PLANNING.md` modules 1-8** — these already contain core concepts, frameworks, anti-patterns, and worked examples. Don't rewrite, adapt.
2. **Lift from `MENTAL_MODELS_FRAMEWORK.md`** for chapter 6 (seven themes) and chapter 7 (engineer-to-product) — the thinker mappings are already written.
3. **Lift from `FLOW_Framework_IEEE.pdf`** for chapter 1 (why FLOW) — this is the academic framing. Read and extract the motivating argument, then rewrite in the Shreyas Doshi voice.
4. **Lift from the 8 published Notion posts** (editorial layer) — these are the most polished prose we own. "Stop Segmenting by Age", "The Bug You Shouldn't Fix", "It Depends Is Not an Answer", "Engineers Don't Lack Intuition" all map to specific chapters.
5. **Locate the missing source files** referenced in `CONTENT_PLANNING.md:512` — `flow_curriculum.json`, `MASTER_CORPUS.md`, `PRODUCT_SENSE_INTERVIEW_CORPUS.md`, `PRODUCT_SENSE_EXAMPLE_ANSWERS.md`. These probably contain most of the worked examples we'd need.

### External (named books and essays, citable)

Each chapter names 1-2 external sources by author + work. We link to the original where possible, quote sparingly (fair use), and credit clearly.

**Core books, one per main reasoning theme:**

| Theme / Chapter | Book | Author | Why it's the canonical source |
|---|---|---|---|
| Frame (root cause) | *The Mom Test* | Rob Fitzpatrick | How to frame what you're actually learning from a conversation |
| Frame (upstream) | *Upstream* | Dan Heath | The entire argument for upstream thinking |
| List (options) | *Obviously Awesome* | April Dunford | Positioning as option-space thinking |
| List (JTBD) | *Competing Against Luck* | Clayton Christensen | The canonical JTBD book |
| Optimize (tradeoffs) | *Inspired* | Marty Cagan | Product discovery and opportunity assessment |
| Optimize (taste) | *Hooked* | Nir Eyal | When to optimize for habit vs depth |
| Win (hypothesis) | *Empowered* | Marty Cagan + Chris Jones | Outcome-based product |
| Win (metrics) | *Measure What Matters* | John Doerr | OKRs as falsifiable outcome hypotheses |
| Cross-cutting | *Working Backwards* | Colin Bryar + Bill Carr | Amazon's PR/FAQ as a FLOW-in-practice artifact |
| Cross-cutting | *The Build Trap* | Melissa Perri | Outputs vs outcomes, directly reinforces the Win step |

**Essays, one or two per chapter, linkable:**

| Author | Essay / Talk | Chapter fit |
|---|---|---|
| Shreyas Doshi | "High-Agency vs. Low-Agency PMs" | Chapter 2 (Frame) and Chapter 7 (engineer-to-product) |
| Shreyas Doshi | "Leverage, Neutral, Overhead" | Chapter 6 (themes) and Chapter 8 (using FLOW live) |
| April Dunford | "The Questions You Should Be Asking When Positioning" | Chapter 4 (Optimize) and Chapter 6 (T6 Exclusion Is Precision) |
| Marty Cagan | "Outcomes Over Outputs" | Chapter 5 (Win) |
| Gibson Biddle | "Vision, Strategy, DHM model" | Chapter 5 (Win) and Chapter 4 (Optimize) |
| Gergely Orosz | "The Product Engineer" | Chapter 7 (engineer-to-product) — directly the audience fit |
| Rahul Pandey | Product Sense Course (6 competency model) | Chapter 6 (themes) |
| Ben Erez | "Stop Asking What Users Want" | Chapter 3 (List) — JTBD framing |
| Julie Zhuo | *The Making of a Manager*, ch. on product decisions | Chapter 8 |
| Teresa Torres | "Continuous Discovery Habits" | Chapter 2 (Frame) |

**Real product teardowns, one per chapter:**
- Ch 1: Google+ shutdown (why mass activation isn't product-market fit)
- Ch 2: Gmail's "users have stopped complaining about storage" moment
- Ch 3: Instagram Stories launch (option someone else found)
- Ch 4: Shopify's fulfillment decision (named sacrifice)
- Ch 5: Netflix's quality-over-quantity pivot (falsifiable hypothesis)
- Ch 6: Adobe's $20B Figma bid (what it would take to be wrong)
- Ch 7: Stripe's API-first approach (engineer-led product)
- Ch 8: TikTok's algorithm-choice-is-a-values-decision

Several of these are already covered in existing Notion posts we can lift from.

## What to do with the generated challenges

Each chapter ends with an MCQ. The MCQ generation pipeline is already built and grounded. Feed each chapter's hook + examples + "the move" section into the content authoring pipeline as the `input_raw` for 1-2 challenges tagged to that chapter. The chapter-end MCQ is hand-picked from the generated set or hand-written as a simpler one.

Over time, the "practice challenges" linked from each chapter become the bridge between the learning module and the challenge system.

## Implementation sequence

Broken into small independently-shippable steps. Each produces something usable.

### Step 1: Find the missing source files (blocker check)
Action: locate `flow_curriculum.json`, `MASTER_CORPUS.md`, `PRODUCT_SENSE_*.md`. These may already be in a sibling directory, a separate repo, or Notion. Ask, don't write.

If they exist: reuse heavily, cut chapter-writing time by 60-80%.
If they don't exist: proceed with the in-repo research only and cite external books.

### Step 2: Write chapter 1 as the reference chapter
Pick the best-understood chapter (`why-flow`) and write it end-to-end following the per-chapter shape above. Establish the voice, the MDX component set, the citation style. This becomes the template.

Source mix for this chapter:
- Cold open: a real moment from `MENTAL_MODELS_FRAMEWORK.md` (Rahul Pandey's "six competencies") or a fresh engineer-interview anecdote
- The move: distilled from `FLOW_Framework_IEEE.pdf`
- Examples: Google+ shutdown, one engineering-adjacent situation
- The tradition: IEEE paper + Rahul Pandey's course + Shreyas Doshi's leverage taxonomy
- MCQ: generate via the content pipeline using the chapter's hook + move as source

### Step 3: Build the `learn_modules` + `learn_chapters` seed for FLOW
SQL insert or a seed script that creates the module row + 8 chapter rows. `body_mdx` starts with chapter 1's content, placeholder text for chapters 2-8 that says "in draft".

This unlocks: the `/explore/modules/flow` route renders. All 8 chapter tiles visible. Only chapter 1 has real content.

### Step 4: Write chapters 2-5 (the four FLOW steps)
Each follows chapter 1's template. Lift heavily from `CONTENT_PLANNING.md` modules 1-8 and the published Notion posts. Each chapter's MCQ comes from the content pipeline.

### Step 5: Write chapter 6 (seven themes)
Lift from `MENTAL_MODELS_FRAMEWORK.md` and `freeform-grading-prompt.md`. This chapter ties the rubric back to named traditions. Every theme gets 1 book, 1 essay, 1 real product moment. This is the most "encyclopedic" chapter and the most citation-heavy.

### Step 6: Write chapters 7-8
Chapter 7 (engineer-to-product): the emotional and practical pitch. Why engineers already have the raw material. Gergely Orosz's "product engineer" essay is the core citation. Lift from `MENTAL_MODELS_FRAMEWORK.md` Shreyas Doshi section.
Chapter 8 (using FLOW live): practical playbook. How to run FLOW in a decision meeting, in an architecture review, in a product interview. Applies FLOW to FLOW: how do you know you're framing the meeting right?

### Step 7: Connect chapter MCQs to the challenge system
Each chapter's test-yourself question writes a reference into a mapping table (or uses tags) so completing a chapter offers "practice this in a full challenge" links.

### Step 8: Review voice, citations, run the validator
Same validator used for challenge generation flags role-framing, AI slop, em dashes in chapter body text. Reviewer walks every chapter once.

## Open questions for Sandeep

Things I need input on before starting step 2:

1. **The missing source files.** Do `flow_curriculum.json`, `MASTER_CORPUS.md`, `PRODUCT_SENSE_INTERVIEW_CORPUS.md` exist somewhere I should look? A sibling repo, a Notion export, a zip I haven't seen? This changes the effort by a lot.

2. **Book citation policy.** Can we quote 1-2 short passages per book under fair use, or do we avoid direct quotes entirely and only paraphrase / link? I'd default to paraphrase + link unless you want to do the legwork on permissions.

3. **MDX component set.** What lives in the chapter body beyond prose? I'd suggest: `<ChapterQuote>`, `<AntiPatternList>`, `<ThinkerCard>`, `<PracticeLink>` (links to a matching challenge), `<InlineMcq>` (reuses the challenge MCQ shape). Any existing components I should reuse instead?

4. **Mapping between chapters and challenges.** When a user finishes a chapter, what do we show as the practice challenge? A single hand-picked one, a set tagged with this chapter's FLOW step, or the user's personalized-next-challenge recommendation? I'd default to personalized-next-challenge with a fallback to a hand-picked one.

5. **Chapter 1 as the pilot.** Should I draft chapter 1 in the next session before doing the seed migration, so you can read the voice and tell me "keep going" or "redo"? That avoids wasting work if the voice is off.

## Out of scope for this plan

- Rebuilding the challenge generation pipeline (already done)
- Designing the `/explore/modules/flow` page UI (exists, just needs data)
- Video production or recorded explainers (text-first for v1)
- Paywalls or free-vs-pro gating (decide after content lands)
