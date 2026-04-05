# Learn Section — Design Spec
*2026-03-31*

## What This Is

A new **Learn** section — pure reading/explainer content, separate from Practice challenges. Analogous to LeetCode's "Detailed Explanation of..." cards. Engineers read through modules to build mental models; they then apply those models in the Practice (challenges) section.

```
Learn (this section)       →    Practice (challenges)
───────────────────              ─────────────────────
FLOW                             FLOW-tagged challenges
User Models                      User Segmentation challenges
Product Debug                    INT-DIAG challenges
North Star                       Metrics challenges
...                              ...
```

---

## The 9 Modules

Each module is a standalone course — a brand name engineers can know by heart, like "Two Pointers" on LeetCode.

| # | Name | Tagline | Difficulty | Chapters | Est. Time | Color |
|---|---|---|---|---|---|---|
| 1 | **FLOW** | The 4-step framework behind every challenge on this platform | Foundation | 7 | ~45 min | `#1a3a2a` / green |
| 2 | **User Models** | Represent users the way you represent data structures | Beginner | 7 | ~40 min | `#1a2a3a` / blue |
| 3 | **Root Cause** | Engineers already debug systems. Now apply it to products. | Intermediate | 7 | ~40 min | `#2a1a1a` / red |
| 4 | **Product Debug** | DAU dropped 15%. Walk me through your diagnosis. | Intermediate | 7 | ~45 min | `#0f1a2e` / blue |
| 5 | **North Star** | One metric that captures the value you actually deliver | Intermediate | 7 | ~45 min | `#1a1a2e` / indigo |
| 6 | **Trade-offs** | "It depends" is not an answer. Name what you're optimizing for. | Advanced | 7 | ~50 min | `#1e1a0e` / amber |
| 7 | **Growth Loops** | Systems that compound. Engineers already think this way. | Intermediate | 7 | ~45 min | `#0e1a12` / emerald |
| 8 | **AI Products** | When execution is cheap, judgment is the differentiator | New Era | 8 | ~55 min | `#1a0e2a` / purple |
| 9 | **Product Sense** | The thing they say you need. Now defined, demystified, learnable. | Entry Point | 7 | ~40 min | `#1a2e1a` / light green |

Alternate names saved at `docs/notes/learn-module-name-alternates.md`.

---

## Module Chapter Breakdowns

### 1. FLOW
1. Why engineers think backwards (how before why)
2. F — Frame: Define before you solve
3. L — List: Map the full solution space
4. O — Optimize: Weigh, don't guess
5. W — Win: Make a specific, defensible call
6. Anti-patterns: what FLOW corrects
7. FLOW in a real interview (full walkthrough)

### 2. User Models
1. Why engineers design for themselves (and why it fails)
2. Segment by behavior, not demographics
3. Jobs to Be Done: functional, emotional, social
4. Multi-sided markets: the chicken-and-egg problem
5. The Reach × Underservedness matrix
6. Accessibility as product signal
7. Case: Spotify Wrapped — the social job nobody spec'd

### 3. Root Cause
1. The engineer's superpower: you already know how to debug
2. Symptoms vs. root causes (5 Whys, applied to products)
3. Frequency × Severity × Underservedness
4. Connecting problems to mission fit
5. The problems users stop complaining about (Gmail story)
6. Writing a crisp problem statement
7. Case: When the bug you fixed wasn't the real problem

### 4. Product Debug
1. DAU dropped 15%. Now what? (the diagnostic loop)
2. External vs. internal causes: seasonality, bugs, competitors
3. Funnel decomposition: where did users drop off?
4. Cohort analysis: is this new users or existing users?
5. Instrumentation gaps: the metric you can't see
6. Communicating findings without overclaiming
7. Case: Instagram feed change that tanked creator reach

### 5. North Star
1. Output metrics vs. outcome metrics (latency ≠ user value)
2. The North Star Metric framework
3. AARRR: Pirate metrics for the real world
4. Guardrail metrics — preventing dark patterns
5. When metrics lie (Goodhart's Law)
6. Case: Netflix — $1B saved with one metric change
7. Picking metrics in a PM interview (what they score)

### 6. Trade-offs
1. "It depends" is not an answer — name what you're optimizing for
2. RICE scoring: Reach × Impact × Confidence ÷ Effort
3. The 2×2 impact-effort matrix
4. The Naming Move: "We get X, we sacrifice Y, because Z"
5. Tech debt as a product decision (not just an eng one)
6. Brand, trust, and regulatory constraints engineers miss
7. Case: Spotify Wrapped — zero revenue, 100M shares, right call

### 7. Growth Loops
1. Funnels vs. loops: why engineers get this intuitively
2. Acquisition loops, engagement loops, monetization loops
3. Viral coefficient: what makes a loop compound
4. Retention curves: the "smile" vs. the flatline
5. Network effects as compounding loops
6. When growth hacks kill the product (dark patterns)
7. Case: TikTok's algorithm as a growth loop

### 8. AI Products
1. The spectrum: AI-assisted → AI-native
2. When execution is cheap, judgment is expensive (Shreyas Doshi)
3. Designing for agents: new UX primitives
4. Trust, safety, and the agentic loop
5. Accuracy vs. latency: the MLE trade-off as product decision
6. What makes an AI feature defensible?
7. Shadow mode, A/B, and eval design for AI features
8. Case: when agentic went wrong

### 9. Product Sense
1. Engineers don't lack intuition — they lack vocabulary
2. The "how" vs. "why" mindset shift
3. The 9 traits of a product-minded engineer (Gergely Orosz)
4. Why-First Check: user impact, business viability, eng sense
5. The 4 common failure modes in PM interviews
6. Framework recitation vs. actual thinking
7. How to build product reps without switching roles

---

## Card Design (Module Grid)

**Approach: Option A — Colored cover band with geometric SVG art**

Each card has:
- **Cover area** (~100px tall): dark background + unique abstract geometric SVG pattern. Module name renders over the art in white bold text.
- **Body**: difficulty chip + chapter count chip, tagline, progress bar, stats row (N/M done · ~X min), CTA (Start → / Continue →)

Each module has a distinct color identity:

| Module | Background | Accent | Geometric motif |
|---|---|---|---|
| FLOW | `#1a3a2a` | `#4a7c59` / `#8ecf9e` | Three linked circles with arrows (F·L → O → W) |
| User Models | `#1a2a3a` | `#3b5bdb` / `#5c7cfa` | Central node with orbiting spokes |
| Root Cause | `#2a1a1a` | `#ef4444` / `#fca5a5` | Inverted tree (symptom at top → root at bottom) |
| Product Debug | `#0f1a2e` | `#3b82f6` / `#ef4444` | Bar chart with drop indicator line |
| North Star | `#1a1a2e` | `#fbbf24` | Star polygon with glow rings |
| Trade-offs | `#1e1a0e` | `#f59e0b` | Balance beam, tilted |
| Growth Loops | `#0e1a12` | `#10b981` / `#34d399` | Elliptical loop with four nodes |
| AI Products | `#1a0e2a` | `#a855f7` / `#7c3aed` | Neural network (3 layers → output node) |
| Product Sense | `#1a2e1a` | `#4a7c59` / `#8ecf9e` | Hexagon grid with center highlight |

Cards fit within the existing `bg-surface-container rounded-xl` card pattern. Cover art replaces the colored top border currently used on study plan cards.

---

## Chapter Format (Hybrid)

Each chapter inside a module uses a hybrid format:

```
┌─────────────────────────────────────┐
│  HOOK CARD (intro)                  │
│  Short provocative statement        │
│  1–3 sentences that reframe the     │
│  engineer's existing mental model   │
└─────────────────────────────────────┘
         ↓ scroll
┌─────────────────────────────────────┐
│  ARTICLE BODY                       │
│  Long-form explainer with:          │
│  - Section anchors (H3 headings)    │
│  - Inline illustrations/diagrams    │
│  - Real product case examples       │
│  - Key callout blocks               │
└─────────────────────────────────────┘
```

Not slides. Not just a wall of text. Hook card at top creates entry momentum; scrollable article builds depth.

---

## Detail Page (Module View)

Reuses the existing `src/app/(app)/prep/study-plans/[slug]/page.tsx` layout with these changes:

**Header section** (replaces the white card):
- Geometric hero banner (~110–130px tall) using the module's dark background + SVG pattern
- Gradient overlay on right side for text legibility
- Module name (large, white, Literata font) and tagline over the art
- Difficulty label + chapter count in small uppercase text above the name

**Chapter accordion** (mostly unchanged):
- Sequential unlock — chapter N unlocks after completing chapter N-1
- Each chapter row shows: number circle, title, subtitle, status badge (Done / Reading / locked)
- When a chapter is active/reading: inline article preview block appears below the row (the hook card text)

**Sidebar** (mostly unchanged):
- Progress ring (N/M chapters done)
- Skills in this module (chip tags)
- "After this module" — suggested next 2 modules

---

## Routes

| Route | File | Notes |
|---|---|---|
| `/learn` | `src/app/(app)/learn/page.tsx` | New page — module grid |
| `/learn/[slug]` | `src/app/(app)/learn/[slug]/page.tsx` | New page — module detail + chapters |
| `/learn/[slug]/[chapter]` | `src/app/(app)/learn/[slug]/[chapter]/page.tsx` | New page — chapter reading view (hook card + article) |

Nav item: Add **Learn** to the left nav rail between Explore and Practice.

---

## Data Model

### `learn_modules` table
```sql
id          uuid
slug        text unique         -- 'flow', 'user-models', 'root-cause', etc.
name        text                -- 'FLOW', 'User Models', etc.
tagline     text
difficulty  text                -- 'foundation', 'beginner', 'intermediate', 'advanced', 'new-era', 'entry-point'
chapter_count int
est_minutes int
cover_color text                -- dark background hex e.g. '#1a3a2a'
accent_color text               -- primary accent hex e.g. '#4a7c59'
sort_order  int
created_at  timestamptz
```

### `learn_chapters` table
```sql
id            uuid
module_id     uuid references learn_modules(id)
slug          text
title         text
subtitle      text
sort_order    int
hook_text     text              -- the intro card statement
body_mdx      text              -- full article markdown/MDX content
created_at    timestamptz
```

### `user_learn_progress` table
```sql
id                uuid
user_id           uuid
module_id         uuid
chapter_id        uuid
completed_at      timestamptz
```

---

## Nav Integration

Add **Learn** as a nav rail item between Explore and Practice:
- Icon: `auto_stories` (Material Symbols Outlined)
- Route: `/learn`
- Active state: filled icon variant

---

## Out of Scope

- Challenge integration from Learn chapters (Learn is read-only; Practice is separate)
- Search within Learn
- Comments or community notes on chapters
- Mobile-optimized reading layout (desktop-first for now)
- Content authoring CMS — content is seeded from `flow_curriculum.json` and `MASTER_CORPUS.md`
