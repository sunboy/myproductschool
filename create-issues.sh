#!/bin/bash
# ============================================================
# HackProduct v2 — Create GitHub Issues
# Run: chmod +x create-issues.sh && ./create-issues.sh
# Requires: gh CLI authenticated (gh auth login)
# ============================================================

REPO="sunboy/myproductschool"

echo "Creating HackProduct v2 implementation issues..."

# ── ISSUE 1 ──────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "V2-01: Run FLOW challenge system migration" \
  --label "v2,database,priority:critical" \
  --body '## Overview
Run the `024_flow_challenge_system.sql` migration to create the v2 schema.

## What this creates
- 12 new tables: `challenges`, `flow_steps`, `step_questions`, `flow_options`, `challenge_attempts_v2`, `step_attempts`, `learner_competencies`, `role_lenses`, `coaching_cache`, `luma_context_v2`, `plan_weeks`, `plan_challenges`
- Seeds 10 role lenses with FLOW step weights, competency multipliers, and nudge templates
- Backfills `learner_competencies` for all existing users (6 competencies each)
- Extends `profiles` with `active_role`, `paradigm_interests`, `industry_interests`, `active_plan_id`, `schema_version`
- Extends `study_plans` with v2 fields
- Creates `match_option_embeddings` RPC function for pgvector similarity search
- Full RLS policies on all tables

## Steps
1. Copy `024_flow_challenge_system.sql` to `supabase/migrations/`
2. Run via Supabase SQL Editor or `supabase db push`
3. Run verification queries:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = '\''public'\''
AND tablename IN ('\''challenges'\'','\''flow_steps'\'','\''step_questions'\'','\''flow_options'\'',
'\''challenge_attempts_v2'\'','\''step_attempts'\'','\''learner_competencies'\'','\''role_lenses'\'',
'\''coaching_cache'\'','\''luma_context_v2'\'','\''plan_weeks'\'','\''plan_challenges'\'');
-- Should return 12 rows

SELECT role_id FROM role_lenses;
-- Should return 10 rows

SELECT COUNT(DISTINCT user_id), COUNT(*)/NULLIF(COUNT(DISTINCT user_id),0) FROM learner_competencies;
-- competencies_per_user should be 6
```

## Complexity
**Manual task** — not a Claude Code issue. Just run the SQL.

## Acceptance criteria
- [ ] All 12 tables exist
- [ ] 10 role lenses seeded
- [ ] Existing users have 6 competency rows each
- [ ] `profiles` has new columns
- [ ] All RLS policies active'

echo "Created issue 1"

# ── ISSUE 2 ──────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "V2-02: Types + deterministic skill functions" \
  --label "v2,backend,priority:critical" \
  --body '## Overview
Add v2 TypeScript types and build the pure deterministic skill functions. These are the foundation — zero API routes, zero AI calls, just typed functions that take data in and return data out.

## Files to create/modify

**Modify:** `src/lib/types.ts` — append v2 types (do NOT overwrite existing types)

New types to add: `Paradigm`, `DifficultyV2`, `FlowStep`, `OptionQuality`, `ResponseType`, `Competency`, `UserRoleV2`, `Challenge`, `FlowStepRecord`, `StepQuestion`, `FlowOption`, `ChallengeAttemptV2`, `StepAttemptRecord`, `LearnerCompetency`, `RoleLens`

New constants: `COMPETENCY_LABELS`, `DIFFICULTY_V2_LABELS`, `PARADIGM_LABELS`, `QUALITY_POINTS`

**Create directory:** `src/lib/v2/skills/`

**Create files:**
1. `src/lib/v2/skills/option-scorer.ts` — pure MCQ scoring. Takes `selectedOptionId` + `options[]`, returns `{ score, quality_label, competencies, explanation, is_correct }`. Uses `QUALITY_POINTS` map: best=3, good=2, surface=1, wrong=0.

2. `src/lib/v2/skills/step-score-calculator.ts` — aggregates question scores within a step using `grading_weight_within_step`, then applies role-based step weight from `RoleLens`. Returns `{ step_score, weighted_step_score, step_weight }`.

3. `src/lib/v2/skills/score-aggregator.ts` — sums weighted step scores across 4 FLOW steps. Returns `{ total_score (0-3), grade_label }`. Labels: ≥2.5 Excellent, ≥1.8 Good, ≥1.0 Developing, <1.0 Needs work.

4. `src/lib/v2/skills/competency-updater.ts` — ELO-style update of learner competencies. Takes current scores + step results + role lens multipliers. K-factor starts at 30, decays to 10 after 20 attempts. Returns `{ updated competencies, deltas per competency }`.

5. `src/lib/v2/skills/nudge-resolver.ts` — combines base nudge from `flow_steps.step_nudge` with role-specific nudge from `role_lenses.{step}_nudge`. Template concatenation, no AI.

6. `src/lib/v2/skills/grading-router.ts` — routes response type to grading path. `pure_mcq` → deterministic, `mcq_plus_elaboration` → hybrid, `freeform`/`modified_option` → AI. Exports `routeResponse()` and `gradePureMCQ()`.

## Key patterns
- All functions are pure — no database calls, no side effects
- All use types from `@/lib/types`
- Each file exports named functions, not default exports

## Acceptance criteria
- [ ] `npx tsc --noEmit` compiles clean
- [ ] All 6 skill files created with correct signatures
- [ ] Types appended to types.ts without breaking existing code
- [ ] `QUALITY_POINTS` map: best→3, good_but_incomplete→2, surface→1, plausible_wrong→0

## Complexity: Simple
One Sonnet agent, ~20 minutes.'

echo "Created issue 2"

# ── ISSUE 3 ──────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "V2-03: Challenge delivery API routes" \
  --label "v2,backend,api,priority:critical" \
  --body '## Overview
Build the API routes that let users browse challenges, start attempts, and load FLOW step content. No grading in this issue — that is V2-04.

## Files to create

1. **`src/app/api/v2/challenges/route.ts`** — GET
   - Query params: `paradigm`, `industry`, `role`, `difficulty`, `framework`, `company`, `page`, `limit`
   - Query `challenges` table with filters, `WHERE is_published = true`
   - Left-join `challenge_attempts_v2` for user'\''s attempt_count, best_score, is_completed
   - Returns: `{ challenges[], total, has_more }`
   - Uses `createClient()` for user-scoped read

2. **`src/app/api/v2/challenges/[id]/route.ts`** — GET
   - Returns challenge detail + step metadata (step, question_count, step_order)
   - Joins `flow_steps` with COUNT of `step_questions`
   - Checks for user'\''s in-progress attempt
   - Returns: `{ challenge, steps[], user_state }`

3. **`src/app/api/v2/challenges/[id]/start/route.ts`** — POST
   - Body: `{ role_id?: UserRoleV2 }` — defaults to `profiles.active_role`
   - Check for existing in-progress attempt → return it if exists
   - Free tier daily limit check (3/day) — same pattern as existing `src/app/api/challenges/submit/route.ts`
   - Insert `challenge_attempts_v2` row
   - Returns: `{ attempt_id, role_id, first_step }`

4. **`src/app/api/v2/challenges/[id]/step/[step]/route.ts`** — GET
   - Load step'\''s `step_questions` with their `flow_options`
   - **CRITICAL:** Strip `quality`, `points`, `explanation`, `competencies` from options before returning
   - Shuffle options deterministically (seeded by user_id + challenge_id + step)
   - Resolve nudge via `nudge-resolver.ts` skill — combine base + role nudge
   - Check which questions already answered via `step_attempts`
   - Returns: `{ step, step_nudge, questions[{ id, text, nudge, options[{id, label, text}], already_answered }], progress }`

5. **`src/app/api/v2/roles/route.ts`** — GET
   - Simple: `SELECT * FROM role_lenses`
   - Public endpoint (no auth required)

## Key patterns from existing codebase
```typescript
// Auth check
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: '\''Unauthorized'\'' }, { status: 401 })

// Admin writes
const admin = createAdminClient()
```

## Acceptance criteria
- [ ] All 5 route files created
- [ ] `GET /api/v2/challenges` returns filtered list
- [ ] `GET /api/v2/challenges/[id]` returns challenge + step metadata
- [ ] `POST /api/v2/challenges/[id]/start` creates attempt, enforces daily limit
- [ ] `GET /api/v2/challenges/[id]/step/frame` returns questions with options (quality stripped)
- [ ] Options are shuffled but consistent across page refreshes
- [ ] `npx tsc --noEmit` clean

## Dependencies
- V2-01 (migration) must be complete
- V2-02 (types + skills) must be complete

## Complexity: Medium
One Sonnet agent, ~30 minutes.'

echo "Created issue 3"

# ── ISSUE 4 ──────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "V2-04: Grading pipeline + completion API routes" \
  --label "v2,backend,api,ai,priority:critical" \
  --body '## Overview
Build the grading pipeline — the most complex backend piece. Handles MCQ scoring (deterministic), freeform grading (AI), coaching generation, and challenge completion with competency updates.

## Files to create

### Grading

1. **`src/app/api/v2/challenges/[id]/step/[step]/submit/route.ts`** — POST
   Body: `{ attempt_id, question_id, selected_option_id?, user_text?, response_type, time_spent_seconds }`

   Logic:
   - Validate: attempt belongs to user, is in_progress, question belongs to step
   - Load rubric: all 4 `flow_options` for this question (with quality, points, explanation)
   - Route via `grading-router.ts`:
     - `pure_mcq` → call `gradePureMCQ()` from skills — **instant, no AI**
     - `mcq_plus_elaboration` → deterministic base + Claude API call for ±0.5 adjustment
     - `freeform` / `modified_option` → Claude API call with rubric-anchored prompt
   - Insert `step_attempts` row
   - Check if all questions in step answered → compute step score if so
   - Update `challenge_attempts_v2.current_step` / `current_question_sequence`
   - Returns: score, quality_label, explanation, correct_option_id, all 4 options revealed

   **AI grading prompt (for hybrid/freeform paths):**
   ```
   You are a product sense grading agent. Grade this response against 4 rubric exemplars.
   SCENARIO: {scenario}
   RUBRIC:
   Score 3 (BEST): "{best_option}"
   Score 2 (GOOD): "{good_option}"
   Score 1 (SURFACE): "{surface_option}"
   Score 0 (WRONG): "{wrong_option}"
   LEARNER'\''S RESPONSE: "{user_text}"
   Return ONLY valid JSON: {"score":<0-3>,"quality_label":"...","competencies_demonstrated":[...],"grading_explanation":"...","confidence":<0-1>}
   ```
   Use the existing Anthropic SDK pattern from `src/app/api/luma/feedback/route.ts`.

### Coaching

2. **`src/app/api/v2/challenges/[id]/coaching/route.ts`** — POST
   Body: `{ attempt_id, question_id, step }`
   - Fetch step_attempt to get selected_option_id
   - Cache key: `${challengeId}:${step}:${questionId}:${optionId}:${roleId}`
   - Check `coaching_cache` → return if hit
   - If miss: Claude API call with role context generation prompt
   - Store in cache, update step_attempt
   - Returns: `{ role_context, career_signal, cached }`

### Completion

3. **`src/app/api/v2/challenges/[id]/complete/route.ts`** — POST
   Body: `{ attempt_id }`
   - Verify all step_attempts exist
   - Aggregate via `step-score-calculator.ts` + `score-aggregator.ts`
   - Update learner DNA via `competency-updater.ts`
   - Update `challenge_attempts_v2` → completed
   - Award XP (existing pattern), update streak (existing RPC)
   - Returns: total_score, grade_label, per_step_breakdown, competency_deltas, xp_earned

### Learner DNA

4. **`src/app/api/v2/dna/route.ts`** — GET
   - Query `learner_competencies` for user
   - Compute weakest_link (lowest score × role multiplier)
   - Returns: all 6 competencies + trends + weakest_link

5. **`src/app/api/v2/dna/recommend/route.ts`** — GET
   - Find uncompleted challenge that targets weakest competency
   - Returns: `{ challenge, reason }`

### AI skill file

6. **`src/lib/v2/skills/ai/freeform-grader.ts`**
   - Exports `gradeFreeform(userText, rubricOptions, scenario)` → calls Claude, parses JSON
   - Exports `gradeElaboration(baseOption, elaborationText, rubricOptions)` → returns adjustment [-0.5, +0.5]
   - Exports `generateRoleCoaching(scenario, step, selectedOption, correctOption, role)` → returns { role_context, career_signal }
   - Uses Zod schema validation on Claude responses (existing pattern from `luma/feedback-schema.ts`)

## Acceptance criteria
- [ ] Pure MCQ submission returns score instantly (no AI call)
- [ ] Freeform submission calls Claude and returns rubric-anchored score
- [ ] Coaching endpoint returns role-contextualized text, caches results
- [ ] Complete endpoint aggregates scores, updates competencies, awards XP
- [ ] DNA endpoint returns 6 competency scores
- [ ] All routes handle errors gracefully (AI failures return partial results)
- [ ] `npx tsc --noEmit` clean

## Dependencies
- V2-03 (delivery routes) must be complete

## Complexity: Complex
Opus orchestrator + 2 Sonnet agents (one for grading routes, one for AI skills + coaching).'

echo "Created issue 4"

# ── ISSUE 5 ──────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "V2-05: FLOW stepper components" \
  --label "v2,frontend,components,priority:critical" \
  --body '## Overview
Build the core v2 UI components for the FLOW challenge experience. These are reusable components — the page-level wiring is V2-06.

## Files to create in `src/components/v2/`

1. **FlowStepper.tsx** — horizontal step indicator (F → L → O → W)
   Props: `steps: Array<{ step: FlowStep; status: '\''locked'\'' | '\''active'\'' | '\''completed'\''; score?: number }>`
   Visual: pills connected by lines. Completed = `bg-primary`. Active = `border-tertiary` pulsing. Locked = `bg-surface-dim`.
   Completed steps are clickable (to review previous answers).

2. **OptionCard.tsx** — single MCQ option as a selectable card
   Props: `{ label: '\''A'\''|'\''B'\''|'\''C'\''|'\''D'\'', text: string, isSelected: boolean, onSelect: () => void, disabled?: boolean }`
   Unselected: `bg-surface-container-low border-outline-variant`. Selected: `border-primary bg-primary-fixed`.
   Min height 48px for mobile tap targets.

3. **StepQuestion.tsx** — one question: nudge + 4 OptionCards + elaboration + override + submit
   Props: `{ question, stepNudge, isFirstQuestion, onSubmit, isSubmitting }`
   - Show nudge card with `LumaGlyph state="speaking"` only on first question of step
   - 4 OptionCards as radio group
   - "Add your reasoning" collapsible textarea below options
   - "Write my own response instead" checkbox toggles to full freeform mode
   - Submit button: `bg-primary text-on-primary`, disabled until option selected or freeform text entered

4. **StepReveal.tsx** — post-submit score reveal
   Props: `{ result: SubmitQuestionResponse, coaching: { role_context?, career_signal? } | null, onContinue }`
   - Score bar: `bg-primary` fill proportional to score/3
   - Quality badge: color-coded (green=best, amber=good, gray=surface, red=wrong)
   - Static explanation (instant)
   - Coaching card with `LumaGlyph state="reviewing"` — shows skeleton while loading, then content
   - "See all options" expandable section showing all 4 options with quality labels
   - "Continue" button

5. **ChallengeComplete.tsx** — end-of-challenge results
   Props: `{ result: CompleteResponse, challenge: Challenge, role: UserRoleV2 }`
   - `LumaGlyph state="celebrating"` at 48px
   - Large score display with grade label
   - Per-step breakdown bars (4 rows, each with step name + score bar + weight)
   - Competency delta pills (e.g., "↑ Cognitive Empathy +3.2")
   - "Try another role" row of role pills (uses `role_lenses.short_label`)
   - "Up next" card with recommended challenge
   - "Back to challenges" + "View detailed feedback" links

6. **CompetencyRadar.tsx** — 6-axis radar chart for Learner DNA
   Props: `{ competencies: LearnerCompetency[], size?: number }`
   Render as inline SVG. 6 axes at 60° intervals. Score 0-100 mapped to radius.
   Fill: `fill-primary/20 stroke-primary`. Labels outside hexagon. Animate on mount.

7. **CompetencyDelta.tsx** — small pill showing "+3.2 Cognitive Empathy"
   Props: `{ competency: Competency, delta: number }`
   Positive: green text + ↑. Negative: red text + ↓. Zero: gray text + →.

8. **TaxonomyFilters.tsx** — filter bar for challenge library
   Props: `{ values, onChange, availableOptions }`
   Dropdowns for: Paradigm, Industry, Role, Difficulty. Use shadcn `Select`.
   Active filters as dismissible pills below.

9. **ChallengeCardV2.tsx** — challenge card with taxonomy tags
   Props: `{ challenge, onClick }`
   Shows: difficulty badge, paradigm pill, industry pill, title, competency tags, meta row, company tags.

## Design tokens to use
- Primary: `bg-primary` / `text-primary` (forest green #4a7c59)
- Tertiary: `bg-tertiary` / `text-tertiary` (amber #705c30)
- Surface: `bg-surface-container-low`, `bg-surface-container`, `bg-surface-dim`
- Nudge card: `bg-secondary-container`
- Text: `text-on-surface`, `text-on-surface-variant`
- Fonts: `font-display` (Literata) for headings, `font-body` (Nunito Sans) for everything else

## Acceptance criteria
- [ ] All 9 component files created
- [ ] Components use correct design tokens (no raw hex in className)
- [ ] `LumaGlyph` used with correct state props
- [ ] `npx tsc --noEmit` clean
- [ ] Components are self-contained (no API calls — those go in hooks/pages)

## Dependencies
- V2-02 (types) must be complete

## Complexity: Complex
Opus orchestrator + 2-3 Sonnet agents (split: stepper+option+question | reveal+complete | radar+filters+card).'

echo "Created issue 5"

# ── ISSUE 6 ──────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "V2-06: Challenge workspace page + hooks" \
  --label "v2,frontend,page,priority:critical" \
  --body '## Overview
Wire the v2 components into the challenge workspace page. This is the core user experience — a state machine that drives the FLOW stepper through question → submit → reveal → continue for each question across 4 steps.

## Files to create

### Hooks

1. **`src/hooks/useChallengeV2.ts`**
   - Fetches challenge detail from `GET /api/v2/challenges/[id]`
   - Manages attempt lifecycle: start, track current step/question, complete
   - Returns: `{ challenge, attempt, currentStep, stepStates, startAttempt, completeChallenge, isLoading }`

2. **`src/hooks/useFlowStep.ts`**
   - Fetches step questions from `GET /api/v2/challenges/[id]/step/[step]`
   - Handles submit via `POST .../submit`
   - Fetches coaching async via `POST .../coaching` (after submit returns)
   - Returns: `{ questions, nudge, submitAnswer, coaching, currentQuestionIndex, stepComplete, isSubmitting }`

### Page rewrite

3. **`src/app/(workspace)/challenges/[id]/page.tsx`** — CONDITIONAL RENDER

   Check if challenge ID is a v2 TEXT id or v1 UUID. If v2, render the new FLOW workspace. If v1, render the existing `ChallengeWorkspace` component.

   ```tsx
   const isV2 = !isUUID(params.id)  // v2 IDs are TEXT like "HP-AG-FIN-GM-042"
   if (isV2) return <FlowWorkspace challengeId={params.id} />
   return <LegacyWorkspace challengeId={params.id} />  // existing component
   ```

4. **`src/components/v2/FlowWorkspace.tsx`** — the main state machine

   State machine phases:
   - `loading` → fetch challenge + create/resume attempt
   - `question` → render StepQuestion for current question
   - `question_reveal` → render StepReveal after submit
   - `step_summary` → after all questions in step, brief summary before next step
   - `complete` → render ChallengeComplete

   Layout:
   - Persistent ScenarioHeader at top (challenge context, always visible)
   - FlowStepper below header
   - Active content below stepper (changes based on state)

   Transitions:
   - Submit answer → `question` → `question_reveal`
   - Continue from reveal → if more questions in step → next `question`
   - Continue from reveal → if step done → `step_summary`
   - Continue from step_summary → next step'\''s first `question`
   - Continue from last step'\''s summary → call complete API → `complete`

   Resume: on page load, check `challenge_attempts_v2.current_step` + `current_question_sequence` to resume where the user left off.

## Acceptance criteria
- [ ] Opening a v2 challenge shows FlowStepper with Frame active
- [ ] Questions render with nudge, 4 option cards, elaboration field
- [ ] Submitting shows score instantly, coaching streams in after
- [ ] Can navigate through all questions in a step, then to next step
- [ ] After all 4 steps, ChallengeComplete shows with results
- [ ] Page refresh resumes from correct step/question
- [ ] v1 challenges still work (legacy workspace renders)
- [ ] `npx tsc --noEmit` clean

## Dependencies
- V2-04 (grading API) must be complete
- V2-05 (components) must be complete

## Complexity: Complex
Opus orchestrator + 2 Sonnet agents (one for hooks, one for page + FlowWorkspace).'

echo "Created issue 6"

# ── ISSUE 7 ──────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "V2-07: Challenge library filters + dashboard DNA + onboarding roles" \
  --label "v2,frontend,page,priority:high" \
  --body '## Overview
Update existing pages to use v2 data: add taxonomy filters to challenge library, replace ProductIQ radar with CompetencyRadar on progress page, expand onboarding role selection to 10 roles.

## Files to modify

1. **`src/app/(app)/challenges/page.tsx`** — UPDATE
   - Add `TaxonomyFilters` component above challenge grid
   - Fetch from `GET /api/v2/challenges` with filter params
   - Render mix of v1 (UUID) and v2 (TEXT id) challenge cards
   - v2 cards use `ChallengeCardV2`, v1 cards use existing card component

2. **`src/app/(app)/progress/page.tsx`** — UPDATE
   - Replace old ProductIQ radar with `CompetencyRadar` component
   - Fetch from `GET /api/v2/dna` for 6 competency scores
   - Show trend arrows (↑↓→) next to each competency
   - Highlight weakest_link
   - Keep existing submission history section below

3. **`src/app/(onboarding)/onboarding/role/page.tsx`** — UPDATE
   - Expand from 6 roles to 10 v2 roles
   - Role options: swe, data_eng, ml_eng, devops, founding_eng, em, tech_lead, pm, designer, data_scientist
   - On select: PATCH both `profiles.preferred_role` (old format) AND `profiles.active_role` (new format)

4. **`src/hooks/useLearnerDNA.ts`** — NEW
   - Fetches from `GET /api/v2/dna`
   - Returns: `{ competencies, weakestLink, isLoading }`

## Acceptance criteria
- [ ] Challenge library shows filter bar with paradigm/industry/role/difficulty dropdowns
- [ ] Filtering updates the challenge list
- [ ] Progress page shows 6-axis CompetencyRadar
- [ ] Onboarding role page shows 10 roles
- [ ] Selected role saves to both old and new profile columns
- [ ] `npx tsc --noEmit` clean

## Dependencies
- V2-05 (components — TaxonomyFilters, CompetencyRadar, ChallengeCardV2) must be complete
- V2-04 (DNA API route) must be complete

## Complexity: Medium
One Sonnet agent, ~30 minutes.'

echo "Created issue 7"

# ── ISSUE 8 ──────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "V2-08: Seed test challenges into database" \
  --label "v2,content,priority:high" \
  --body '## Overview
Create a seeding script that inserts 3-5 complete v2 challenges into the database for testing. Each challenge needs the full hierarchy: challenge → flow_steps → step_questions → flow_options.

## What to create

**`scripts/seed-v2-challenges.ts`** — a Node/TS script runnable via `npx tsx scripts/seed-v2-challenges.ts`

The script should:
1. Connect to Supabase using the service role key
2. Insert 3-5 challenges with realistic product sense scenarios
3. Each challenge has 4 flow_steps (frame, list, optimize, win)
4. Each step has 1-2 step_questions
5. Each question has 4 flow_options (one of each quality: best, good_but_incomplete, surface, plausible_wrong)
6. Use the challenge ID format: `HP-{PARADIGM}-{INDUSTRY}-{FRAMEWORK}-{NUMBER}`

### Example challenge to seed

```
Challenge: HP-TR-FIN-IO-001
Title: "The Recommendation Engine Blind Spot"
Paradigm: traditional
Industry: fintech
Difficulty: standard
Scenario: "You'\''re a backend engineer on a team that just launched a new recommendation engine for an e-commerce app. The PM is celebrating because revenue per session is up 8%. Your tech lead asks you to instrument some input metrics so the team can actually understand why revenue moved."

Frame step (1 question):
  Q: "What'\''s the real problem with only tracking revenue per session?"
  Options:
    A (best): "Revenue per session is an output metric — it tells you WHAT happened but not WHY..."
    B (good): "The PM is looking at the wrong metric. Revenue doesn'\''t capture full user experience..."
    C (surface): "We need more metrics to understand the recommendation engine'\''s performance..."
    D (wrong): "Revenue spiked 8% which could be a fluke. We should A/B test first..."
```

Provide at least one challenge per paradigm (traditional, ai_assisted, agentic).

### Set `is_published = true` so the challenges appear in the library.

## Acceptance criteria
- [ ] Script runs without errors
- [ ] 3-5 challenges visible in `GET /api/v2/challenges`
- [ ] Each challenge loads properly in `GET /api/v2/challenges/[id]/step/frame`
- [ ] Options render correctly (4 per question, quality stripped in API response)

## Complexity: Medium
One Sonnet agent — write the seed script with hardcoded challenge data.'

echo "Created issue 8"

echo ""
echo "✅ All 8 issues created!"
echo ""
echo "Implementation order:"
echo "  V2-01 → V2-02 → V2-03 → V2-04 → V2-05 → V2-06 → V2-07 → V2-08"
echo "  (01 is manual, 02-04 are backend, 05-07 are frontend, 08 is content)"
