# HACKPRODUCT V2 — MASTER BUILD PLAN

You are orchestrating the build of HackProduct's v2 FLOW challenge system. All specifications, skill definitions, migration SQL, and prompt templates are in the `hackproduct-v2-bundle/` directory that has been added to this repo.

## Bundle contents

```
hackproduct-v2-bundle/
├── IMPLEMENTATION.md                              ← Phased build guide (types, APIs, components)
├── supabase/migrations/024_flow_challenge_system.sql  ← Run first
└── skills/                                        ← 5 Claude skills with reference files
    ├── hackproduct-grading/
    │   ├── SKILL.md                               ← Grading pipeline: 4 paths, rubric-anchored
    │   └── references/
    │       ├── freeform-grading-prompt.md          ← Exact Claude prompt for AI grading
    │       └── elaboration-prompt.md               ← Exact Claude prompt for MCQ+text adjustment
    ├── hackproduct-content-authoring/
    │   ├── SKILL.md                               ← Content pipeline: markdown → challenge
    │   └── references/
    │       └── mcq-generation-prompt.md            ← Exact Claude prompt for MCQ option generation
    ├── hackproduct-coaching/
    │   └── SKILL.md                               ← Luma nudges, role coaching, caching
    ├── hackproduct-challenge-delivery/
    │   └── SKILL.md                               ← Challenge list, step loading, state machine
    └── hackproduct-learner-dna/
        └── SKILL.md                               ← 6 competencies, ELO update, recommendations
```

## Existing codebase context

- **Stack:** Next.js 16, React 19, Supabase (Postgres + pgvector), Anthropic TS SDK, Tailwind v4
- **Auth:** Supabase Auth (email/password)
- **Supabase clients:** `createClient()` from `src/lib/supabase/server.ts` (user-scoped), `createAdminClient()` from `src/lib/supabase/admin.ts` (service role)
- **Anthropic SDK:** Already used in `src/app/api/luma/feedback/route.ts` — follow that pattern
- **Design system:** Material 3 Terra theme. Read `CLAUDE.md` for tokens, LumaGlyph states, font rules
- **Existing FLOW framework:** `move_levels`, `challenge_steps`, `FlowMove` type already exist (v1). We're building v2 alongside, not replacing yet

## Build phases

Execute these in order. Each phase must pass `npx tsc --noEmit` before moving to the next.

---

### PHASE 1: Migration + Types + Deterministic Skills

**What to do:**

1. Copy `hackproduct-v2-bundle/supabase/migrations/024_flow_challenge_system.sql` to `supabase/migrations/`. Run it against the database. This creates 12 tables, seeds 10 role lenses, backfills learner competencies for existing users.

2. Read `hackproduct-v2-bundle/skills/hackproduct-grading/SKILL.md` and `hackproduct-v2-bundle/skills/hackproduct-learner-dna/SKILL.md`.

3. Append v2 types to `src/lib/types.ts` (do NOT modify existing types). The types are specified in `hackproduct-v2-bundle/IMPLEMENTATION.md` Phase 1 section "1A".

4. Create these deterministic skill files using the implementations from the skill definitions:

```
src/lib/v2/skills/option-scorer.ts         ← from hackproduct-grading SKILL.md "Path 1"
src/lib/v2/skills/step-score-calculator.ts  ← from hackproduct-grading SKILL.md "Step Score Aggregation"
src/lib/v2/skills/score-aggregator.ts       ← from hackproduct-grading SKILL.md
src/lib/v2/skills/grading-router.ts         ← from hackproduct-grading SKILL.md "Routing Logic"
src/lib/v2/skills/competency-updater.ts     ← from hackproduct-learner-dna SKILL.md "ELO-Inspired Update"
src/lib/v2/skills/trend-analyzer.ts         ← from hackproduct-learner-dna SKILL.md "Trend Analysis"
src/lib/v2/skills/weakness-identifier.ts    ← from hackproduct-learner-dna SKILL.md "Weakness Identification"
src/lib/v2/skills/nudge-resolver.ts         ← from hackproduct-coaching SKILL.md "Nudge Resolution"
```

All functions are pure — no DB calls, no side effects, no imports from `@/lib/supabase`. Named exports only.

**Verify:** `npx tsc --noEmit` — must compile clean (Deno errors in `supabase/functions/` are pre-existing, ignore).

---

### PHASE 2: Challenge Delivery API Routes

**What to do:**

Read `hackproduct-v2-bundle/skills/hackproduct-challenge-delivery/SKILL.md`. It has complete specs for each route.

Create these 5 routes:

```
src/app/api/v2/challenges/route.ts               ← GET: list with taxonomy filters
src/app/api/v2/challenges/[id]/route.ts           ← GET: challenge detail + step metadata
src/app/api/v2/challenges/[id]/start/route.ts     ← POST: create/resume attempt
src/app/api/v2/challenges/[id]/step/[step]/route.ts  ← GET: load step questions + nudge + shuffled options
src/app/api/v2/roles/route.ts                     ← GET: list role lenses
```

**Critical for `step/[step]/route.ts`:**
- STRIP `quality`, `points`, `explanation`, `competencies` from options before returning
- Shuffle options using the `seededShuffle` function from the skill definition
- Call `nudge-resolver.ts` to combine base nudge + role nudge from `role_lenses` table
- Check `step_attempts` to mark already-answered questions

Follow auth patterns from existing `src/app/api/challenges/submit/route.ts`.

**Verify:** `npx tsc --noEmit`

---

### PHASE 3: Grading Pipeline + Coaching + DNA

**What to do:**

Read ALL of these:
- `hackproduct-v2-bundle/skills/hackproduct-grading/SKILL.md`
- `hackproduct-v2-bundle/skills/hackproduct-grading/references/freeform-grading-prompt.md`
- `hackproduct-v2-bundle/skills/hackproduct-grading/references/elaboration-prompt.md`
- `hackproduct-v2-bundle/skills/hackproduct-coaching/SKILL.md`
- `hackproduct-v2-bundle/skills/hackproduct-learner-dna/SKILL.md`

Create the AI grading skill:

```
src/lib/v2/skills/ai/freeform-grader.ts
```

This file exports:
- `gradeFreeform(userText, options, scenario, step, targetCompetencies)` — uses the EXACT prompt from `references/freeform-grading-prompt.md`. Validates with Zod. Applies confidence gating.
- `gradeElaboration(baseOption, elaborationText, allOptions)` — uses the EXACT prompt from `references/elaboration-prompt.md`. Returns adjustment ±0.5. Apply tier capping.

Then create 5 API routes:

```
src/app/api/v2/challenges/[id]/step/[step]/submit/route.ts  ← Grading (4 paths)
src/app/api/v2/challenges/[id]/coaching/route.ts             ← Role coaching (cached)
src/app/api/v2/challenges/[id]/complete/route.ts             ← Finalize + DNA update
src/app/api/v2/dna/route.ts                                  ← Learner competency profile
src/app/api/v2/dna/recommend/route.ts                        ← Next challenge recommendation
```

**Submit route grading logic (from hackproduct-grading SKILL.md):**
1. `pure_mcq` → call `scoreOption()` from option-scorer.ts — NO Claude API call
2. `mcq_plus_elaboration` → `scoreOption()` base + `gradeElaboration()` adjustment, apply `capElaborationScore()`
3. `freeform` or `modified_option` → call `gradeFreeform()`, apply `applyConfidenceGate()`

**Coaching route (from hackproduct-coaching SKILL.md):**
- Cache key: `${challengeId}:${step}:${questionId}:${optionId}:${roleId}`
- Check `coaching_cache` table first → return if hit, increment hit_count
- If miss: call Claude with the coaching prompt from the skill, store result

**Complete route:**
- Aggregate via `step-score-calculator` + `score-aggregator`
- Update competencies via `competency-updater` with role lens multipliers
- Award XP (follow pattern from `src/app/api/challenges/submit/route.ts`)
- Update streak (existing `update_user_streak` RPC)
- Insert `luma_context_v2` row

**Verify:** `npx tsc --noEmit`. Also verify: pure MCQ submit does NOT call Claude API.

---

### PHASE 4: Frontend Components

**What to do:**

Read:
- `hackproduct-v2-bundle/skills/hackproduct-challenge-delivery/SKILL.md` (state machine, FlowStepper)
- `hackproduct-v2-bundle/skills/hackproduct-coaching/SKILL.md` (LumaGlyph states)
- `hackproduct-v2-bundle/skills/hackproduct-learner-dna/SKILL.md` (CompetencyRadar)
- `CLAUDE.md` for design tokens and component conventions

Create in `src/components/v2/`:

```
FlowStepper.tsx        ← F/L/O/W step indicator (completed/active/locked)
OptionCard.tsx         ← Selectable MCQ card (bg-surface-container-low, selected: border-primary bg-primary-fixed)
StepQuestion.tsx       ← Question + nudge + 4 OptionCards + elaboration textarea + freeform override + submit
StepReveal.tsx         ← Post-submit: score bar + quality badge + explanation + coaching (async) + option reveal
ChallengeComplete.tsx  ← End results: total score, per-step breakdown, competency deltas, try-another-role
CompetencyRadar.tsx    ← 6-axis inline SVG radar chart (fill-primary/20, stroke-primary)
CompetencyDelta.tsx    ← "+3.2 Cognitive Empathy" pill with trend arrow
TaxonomyFilters.tsx    ← Filter bar: paradigm, industry, role, difficulty dropdowns (shadcn Select)
ChallengeCardV2.tsx    ← Challenge card with taxonomy pills, difficulty badge, meta row
```

**Rules:**
- All `'use client'`
- Components receive data via props — NO API calls inside components
- Tailwind token classes only — NO raw hex in className
- `LumaGlyph` states: `speaking` (nudges), `reviewing` (coaching loading), `celebrating` (results)
- OptionCard min-height: 48px (mobile tap targets)
- CompetencyRadar: inline SVG, NOT a chart library

**Verify:** `npx tsc --noEmit`. No raw hex in className strings.

---

### PHASE 5: Workspace Page + Hooks

**What to do:**

Create hooks:

```
src/hooks/useChallengeV2.ts    ← Fetch challenge, manage attempt lifecycle (start/resume/complete)
src/hooks/useFlowStep.ts       ← Load step questions, handle submit, fetch coaching ASYNC after submit
src/hooks/useLearnerDNA.ts     ← Fetch GET /api/v2/dna
```

Create the workspace state machine:

```
src/components/v2/FlowWorkspace.tsx
```

States: `loading` → `question` → `question_reveal` → `step_summary` → `complete`

Transitions (from hackproduct-challenge-delivery SKILL.md "Workspace State Machine"):
- Submit answer → `question` → `question_reveal`
- Continue → more questions in step? → next `question`
- Continue → step done? → `step_summary`
- Continue from summary → next step's first `question`
- Last step done → call complete API → `complete`
- Resume on refresh: read `attempt.current_step` + `current_question_sequence`

Update the existing workspace page:

```
src/app/(workspace)/challenges/[id]/page.tsx
```

Add conditional rendering — if challenge ID is not a UUID (v2 TEXT id like "HP-AG-FIN-GM-042"), render `FlowWorkspace`. Otherwise render the existing `ChallengeWorkspace`.

**Critical behaviors:**
- Scenario header stays visible at ALL times
- Score appears INSTANTLY after submit (deterministic for MCQ)
- Coaching loads ASYNC — show skeleton, then content when ready
- v1 challenges (UUID ids) still render the old workspace

**Verify:** `npx tsc --noEmit`. Open a v2 challenge → full FLOW stepper works. v1 challenges still work.

---

### PHASE 6: Library, Dashboard, Onboarding Updates

**What to do:**

1. `src/app/(app)/challenges/page.tsx` — Add `TaxonomyFilters` above challenge grid. Fetch from `GET /api/v2/challenges` with filter params. Mix v1 (UUID) and v2 (TEXT) cards.

2. `src/app/(app)/progress/page.tsx` — Replace old ProductIQ radar with `CompetencyRadar`. Fetch from `GET /api/v2/dna`. Show 6 competency scores with `CompetencyDelta` pills.

3. `src/app/(onboarding)/onboarding/role/page.tsx` — Expand from 6 to 10 roles: swe, data_eng, ml_eng, devops, founding_eng, em, tech_lead, pm, designer, data_scientist. On select: PATCH both `profiles.preferred_role` (old) AND `profiles.active_role` (new).

**Verify:** `npx tsc --noEmit`. Filters work. Radar shows 6 competencies. 10 roles in onboarding.

---

### PHASE 7: Seed Test Challenges

**What to do:**

Read `hackproduct-v2-bundle/skills/hackproduct-content-authoring/SKILL.md` for data model and ID format.

Create `scripts/seed-v2-challenges.ts` — runnable via `npx tsx scripts/seed-v2-challenges.ts`.

Seed 3-5 challenges with full hierarchy:
- 1 challenge row with realistic product sense scenario
- 4 flow_steps (frame, list, optimize, win) with nudge text
- 1-2 step_questions per step
- 4 flow_options per question (one best, one good_but_incomplete, one surface, one plausible_wrong)

Cover at least 3 paradigms: traditional (e-commerce rec engine), ai_assisted (fraud detection), agentic (auto-investing agent).

ID format: `HP-{PARADIGM}-{INDUSTRY}-{FRAMEWORK}-{NUMBER}` (e.g., HP-TR-ECM-IO-001)
Option ID format: `{challenge_id}-{step}-Q{seq}-{label}` (e.g., HP-TR-ECM-IO-001-F-Q1-A)

Set `is_published = true`. Use Supabase admin client with `SUPABASE_SERVICE_ROLE_KEY`.

Follow "Database Insert Order" from content-authoring skill:
1. INSERT challenges
2. INSERT flow_steps ×4
3. INSERT step_questions
4. INSERT flow_options ×4 per question

**Verify:** Run the script. `GET /api/v2/challenges` returns seeded challenges. Opening one in the browser shows the FLOW stepper.

---

## How to execute this

For simple phases (1, 2, 6, 7): work directly, one phase at a time.

For complex phases (3, 4, 5): use the agent team pattern from CLAUDE.md if available:
- **Phase 3:** One agent for `freeform-grader.ts` + submit route. Another for coaching + complete + DNA routes.
- **Phase 4:** Split components across 2-3 agents (interaction components | post-answer components | visualization components).
- **Phase 5:** One agent for hooks, another for FlowWorkspace + page update.

Always read the relevant skill SKILL.md BEFORE implementing that phase. The skills contain the exact implementations, prompt templates, Zod schemas, and caching patterns.

Do NOT skip phases or parallelize across phases — each phase's `tsc` check must pass before the next begins.
