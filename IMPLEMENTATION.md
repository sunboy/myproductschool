# HACKPRODUCT V2 IMPLEMENTATION GUIDE
## For Claude Code — One Phase Per Session

**Stack:** Next.js 16, React 19, Supabase (Postgres + pgvector), Anthropic TS SDK, Tailwind v4  
**Design:** Material 3 Terra — forest green `#4a7c59`, amber `#705c30`, warm cream `#faf6f0`  
**Existing patterns:** See `CLAUDE.md` for font, color token, LumaGlyph, and layout conventions

---

## PHASE 0: Run Migration (5 minutes, not a Claude Code task)

Run `supabase/migrations/024_flow_challenge_system.sql` via Supabase SQL Editor or `supabase db push`.

Verify:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename IN ('challenges','flow_steps','step_questions','flow_options',
'challenge_attempts_v2','step_attempts','learner_competencies','role_lenses',
'coaching_cache','luma_context_v2','plan_weeks','plan_challenges');
-- Should return 12 rows

SELECT role_id FROM role_lenses;
-- Should return 10 rows
```

---

## PHASE 1: Types + Deterministic Skills
**Goal:** Build the pure TypeScript foundation — zero API routes, zero components, zero AI calls. Just types and functions that take data in and return data out.

### 1A. Add types to `src/lib/types.ts`

Append these to the EXISTING file (don't overwrite):

```typescript
/* ── v2 FLOW Challenge System ───────────────────────────────── */

export type Paradigm = 'traditional' | 'ai_assisted' | 'agentic' | 'ai_native'
export type DifficultyV2 = 'warmup' | 'standard' | 'advanced' | 'staff_plus'
export type FlowStep = 'frame' | 'list' | 'optimize' | 'win'
export type OptionQuality = 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'
export type ResponseType = 'pure_mcq' | 'mcq_plus_elaboration' | 'modified_option' | 'freeform'
export type Competency = 'motivation_theory' | 'cognitive_empathy' | 'taste' | 'strategic_thinking' | 'creative_execution' | 'domain_expertise'
export type UserRoleV2 = 'swe' | 'data_eng' | 'ml_eng' | 'devops' | 'founding_eng' | 'em' | 'tech_lead' | 'pm' | 'designer' | 'data_scientist'

export interface Challenge {
  id: string; title: string
  scenario_role: string | null; scenario_context: string; scenario_trigger: string; scenario_question: string
  engineer_standout: string | null
  paradigm: Paradigm | null; industry: string | null; sub_vertical: string | null
  difficulty: DifficultyV2; estimated_minutes: number
  primary_competencies: string[]; secondary_competencies: string[]
  frameworks: string[]; relevant_roles: string[]; company_tags: string[]; tags: string[]
  is_published: boolean; is_calibration: boolean; is_premium: boolean; created_at: string
}

export interface FlowStepRecord {
  id: string; challenge_id: string; step: FlowStep; step_nudge: string | null
  grading_weight: number; step_order: number
}

export interface StepQuestion {
  id: string; flow_step_id: string; question_text: string; question_nudge: string | null
  sequence: number; grading_weight_within_step: number; target_competencies: string[]
}

export interface FlowOption {
  id: string; question_id: string; option_label: 'A' | 'B' | 'C' | 'D'
  option_text: string; quality: OptionQuality; points: number
  competencies: string[]; explanation: string
}

export interface ChallengeAttemptV2 {
  id: string; user_id: string; challenge_id: string; role_id: UserRoleV2
  total_score: number | null; max_score: number; grade_label: string | null
  status: 'in_progress' | 'completed' | 'abandoned'
  current_step: FlowStep | 'done'; current_question_sequence: number
  time_spent_seconds: number; is_replay: boolean
  started_at: string; completed_at: string | null
}

export interface StepAttemptRecord {
  id: string; attempt_id: string; question_id: string; step: FlowStep
  response_type: ResponseType; selected_option_id: string | null; user_text: string | null
  score: number | null; weighted_score: number | null; quality_label: string | null
  competencies_demonstrated: string[]; grading_explanation: string | null
  rubric_alignment: { closest_option: string; alignment_score: number; exceeds_option: boolean } | null
  grading_confidence: number | null
  role_context: string | null; career_signal: string | null
  time_spent_seconds: number
}

export interface LearnerCompetency {
  user_id: string; competency: Competency; score: number
  total_attempts: number; trend: 'improving' | 'declining' | 'steady' | 'insufficient_data'
  trend_slope: number; last_updated: string
}

export interface RoleLens {
  role_id: UserRoleV2; label: string; short_label: string
  frame_weight: number; list_weight: number; optimize_weight: number; win_weight: number
  competency_multipliers: Record<Competency, number>
  frame_nudge: string | null; list_nudge: string | null
  optimize_nudge: string | null; win_nudge: string | null
}

export const COMPETENCY_LABELS: Record<Competency, string> = {
  motivation_theory: 'Motivation Theory', cognitive_empathy: 'Cognitive Empathy',
  taste: 'Taste', strategic_thinking: 'Strategic Thinking',
  creative_execution: 'Creative Execution', domain_expertise: 'Domain Expertise',
}
export const DIFFICULTY_V2_LABELS: Record<DifficultyV2, string> = {
  warmup: 'Warm-up', standard: 'Standard', advanced: 'Advanced', staff_plus: 'Staff+',
}
export const PARADIGM_LABELS: Record<Paradigm, string> = {
  traditional: 'Traditional', ai_assisted: 'AI-Assisted', agentic: 'Agentic', ai_native: 'AI-Native',
}
export const QUALITY_POINTS: Record<OptionQuality, number> = {
  best: 3, good_but_incomplete: 2, surface: 1, plausible_wrong: 0,
}
```

### 1B. Create deterministic skill files

Create directory `src/lib/v2/skills/` and these files:

**`src/lib/v2/skills/option-scorer.ts`**
```typescript
import type { FlowOption, OptionQuality } from '@/lib/types'

const QUALITY_POINTS: Record<OptionQuality, number> = { best: 3, good_but_incomplete: 2, surface: 1, plausible_wrong: 0 }

export function scoreOption(selectedOptionId: string, options: FlowOption[]) {
  const option = options.find(o => o.id === selectedOptionId)
  if (!option) throw new Error(`Option ${selectedOptionId} not found`)
  return {
    score: QUALITY_POINTS[option.quality],
    quality_label: option.quality,
    competencies_demonstrated: option.competencies,
    grading_explanation: option.explanation,
    is_correct: option.quality === 'best',
  }
}
```

**`src/lib/v2/skills/step-score-calculator.ts`**
```typescript
import type { FlowStep, RoleLens } from '@/lib/types'

export function calculateStepScore(
  questionScores: Array<{ score: number; grading_weight_within_step: number }>,
  step: FlowStep,
  roleLens: RoleLens
): { step_score: number; weighted_step_score: number; step_weight: number } {
  // Aggregate question scores within a step
  const weightSum = questionScores.reduce((s, q) => s + q.grading_weight_within_step, 0)
  const step_score = questionScores.reduce((s, q) => s + (q.score * q.grading_weight_within_step / weightSum), 0)
  
  // Apply role-based step weight
  const stepWeightKey = `${step}_weight` as keyof Pick<RoleLens, 'frame_weight' | 'list_weight' | 'optimize_weight' | 'win_weight'>
  const step_weight = roleLens[stepWeightKey]
  
  return { step_score, weighted_step_score: step_score * step_weight, step_weight }
}
```

**`src/lib/v2/skills/score-aggregator.ts`**
```typescript
export function aggregateChallenge(
  stepResults: Array<{ step_score: number; weighted_step_score: number }>
): { total_score: number; grade_label: string } {
  const total_score = Math.round(stepResults.reduce((s, r) => s + r.weighted_step_score, 0) * 100) / 100
  const grade_label = total_score >= 2.5 ? 'Excellent' : total_score >= 1.8 ? 'Good' : total_score >= 1.0 ? 'Developing' : 'Needs work'
  return { total_score, grade_label }
}
```

**`src/lib/v2/skills/competency-updater.ts`**
```typescript
import type { Competency, LearnerCompetency, RoleLens } from '@/lib/types'

const ALL_COMPETENCIES: Competency[] = ['motivation_theory','cognitive_empathy','taste','strategic_thinking','creative_execution','domain_expertise']

export function updateCompetencies(
  current: LearnerCompetency[],
  stepResults: Array<{ score: number; competencies_demonstrated: string[]; step_weight: number }>,
  roleLens: RoleLens
): { updated: LearnerCompetency[]; deltas: Record<string, number> } {
  const multipliers = roleLens.competency_multipliers
  const deltas: Record<string, number> = {}

  for (const comp of ALL_COMPETENCIES) {
    let delta = 0
    for (const result of stepResults) {
      if (result.competencies_demonstrated.includes(comp)) {
        delta += result.score * result.step_weight * (multipliers[comp] ?? 1.0)
      }
    }
    deltas[comp] = Math.round(delta * 100) / 100
  }

  const updated = current.map(c => {
    const d = deltas[c.competency] ?? 0
    const attempts = c.total_attempts + 1
    const k = Math.max(10, 30 - attempts) // ELO-style K-factor
    const performance = d / 3 // Normalize to 0-1 range
    const expected = c.score / 100
    const newScore = Math.max(0, Math.min(100, c.score + k * (performance - expected)))
    return { ...c, score: Math.round(newScore * 100) / 100, total_attempts: attempts, last_updated: new Date().toISOString() }
  })

  return { updated, deltas }
}
```

**`src/lib/v2/skills/nudge-resolver.ts`**
```typescript
import type { FlowStep, RoleLens } from '@/lib/types'

export function resolveNudge(baseNudge: string | null, step: FlowStep, roleLens: RoleLens): string {
  const roleNudge = roleLens[`${step}_nudge` as keyof RoleLens] as string | null
  if (!baseNudge && !roleNudge) return ''
  if (!roleNudge) return baseNudge ?? ''
  if (!baseNudge) return `💡 ${roleNudge}`
  return `${baseNudge}\n\n💡 As a ${roleLens.short_label}: ${roleNudge}`
}
```

**`src/lib/v2/skills/grading-router.ts`**
```typescript
import type { ResponseType, FlowOption } from '@/lib/types'
import { scoreOption } from './option-scorer'

export type GradingResult = {
  score: number; quality_label: string; competencies_demonstrated: string[]
  grading_explanation: string; rubric_alignment: { closest_option: string; alignment_score: number; exceeds_option: boolean }
  confidence: number
}

export function routeResponse(responseType: ResponseType): 'deterministic' | 'hybrid' | 'ai' {
  switch (responseType) {
    case 'pure_mcq': return 'deterministic'
    case 'mcq_plus_elaboration': return 'hybrid'
    case 'modified_option': return 'ai'
    case 'freeform': return 'ai'
  }
}

export function gradePureMCQ(selectedOptionId: string, options: FlowOption[]): GradingResult {
  const result = scoreOption(selectedOptionId, options)
  return {
    ...result,
    score: result.score,
    rubric_alignment: { closest_option: selectedOptionId, alignment_score: 1.0, exceeds_option: false },
    confidence: 1.0,
  }
}
```

### Verify Phase 1

```bash
npx tsc --noEmit 2>&1 | head -20
# Should compile clean (pre-existing Deno errors in supabase/functions/ are OK)
```

**STOP HERE. Phase 1 is complete.**

---

## PHASE 2: Challenge Delivery API Routes
**Goal:** Users can browse challenges, start an attempt, and load FLOW steps with nudges. No grading yet.

### 2A. Create `src/app/api/v2/challenges/route.ts`
GET — list challenges with taxonomy filters.

Query params: `paradigm`, `industry`, `role`, `difficulty`, `framework`, `company`, `page` (default 1), `limit` (default 20).

Returns: `{ challenges: Challenge[], total: number, has_more: boolean }`

Implementation: query `challenges` table with filters. Left-join `challenge_attempts_v2` for current user's `attempt_count`, `best_score`, `is_completed`. Use `createClient()` for user-scoped read, filter `is_published = true`.

### 2B. Create `src/app/api/v2/challenges/[id]/route.ts`
GET — challenge detail + step metadata.

Returns: challenge object + array of `{ step, question_count, step_order }` from `flow_steps` joined with count of `step_questions`. Also returns user's in-progress attempt if any.

### 2C. Create `src/app/api/v2/challenges/[id]/start/route.ts`
POST — create or resume an attempt.

Body: `{ role_id?: UserRoleV2 }` — defaults to `profiles.active_role`.

Logic: check for existing `in_progress` attempt for this user+challenge. If exists, return it. Otherwise insert new `challenge_attempts_v2` row. Check free tier daily limit (3/day) — same pattern as existing `src/app/api/challenges/submit/route.ts`.

Returns: `{ attempt_id, role_id, first_step: 'frame' }`

### 2D. Create `src/app/api/v2/challenges/[id]/step/[step]/route.ts`
GET — load a FLOW step's questions, options, and nudge.

Query the step's `step_questions` with their `flow_options`. Strip `quality`, `points`, `explanation`, `competencies` from options before returning (these are revealed after submission). Shuffle option order using `shuffle_seed(user_id, challenge_id, step)` — just use the DB function or implement a seeded shuffle in TS.

Call `resolveNudge()` to combine base nudge + role nudge.

Returns:
```typescript
{
  step: FlowStep,
  step_nudge: string,     // resolved with role context
  questions: Array<{
    id: string, question_text: string, question_nudge: string | null, sequence: number,
    options: Array<{ id: string, label: string, text: string }>,  // NO quality/points
    already_answered: boolean
  }>,
  progress: { current_step: number, total_steps: 4 }
}
```

### 2E. Create `src/app/api/v2/roles/route.ts`
GET — list all role lenses. Public. Simple `SELECT * FROM role_lenses`.

### Verify Phase 2

With the migration run and some test data seeded (you can manually insert a challenge + steps + questions + options), hit:
- `GET /api/v2/challenges` → returns list
- `GET /api/v2/challenges/TEST-001` → returns detail
- `POST /api/v2/challenges/TEST-001/start` → returns attempt_id
- `GET /api/v2/challenges/TEST-001/step/frame` → returns questions with shuffled options, nudge

**STOP HERE. Phase 2 is complete.**

---

## PHASE 3: Grading + Completion API Routes
**Goal:** Users can submit answers and get scored. MCQ scoring is deterministic. Freeform uses Claude.

### 3A. Create `src/app/api/v2/challenges/[id]/step/[step]/submit/route.ts`
POST — grade one question answer.

Body:
```typescript
{ attempt_id: string, question_id: string, selected_option_id: string | null,
  user_text: string | null, response_type: ResponseType, time_spent_seconds: number }
```

Logic:
1. Validate: attempt belongs to user, attempt is in_progress, question belongs to this step
2. Route via `routeResponse(response_type)`:
   - `deterministic` → `gradePureMCQ()` — instant, no AI
   - `hybrid` → deterministic base + call Claude for elaboration adjustment (±0.5, capped)
   - `ai` → call Claude with rubric-anchored prompt (the 4 options as exemplars)
3. Insert `step_attempts` row with results
4. Check if all questions in this step are answered → if so, compute step score via `calculateStepScore()`
5. Update `challenge_attempts_v2.current_step` / `current_question_sequence`

Returns: score, quality_label, explanation, correct_option_id, all 4 options revealed with quality labels, whether step is complete.

**AI grading prompt** (for `hybrid` and `ai` paths — use the existing Anthropic client pattern from `src/app/api/luma/feedback/route.ts`):

```typescript
const RUBRIC_GRADING_PROMPT = `You are a product sense grading agent. Grade this response against 4 rubric exemplars.

SCENARIO: {scenario}
FLOW STEP: {step} — {step_purpose}

RUBRIC:
Score 3 (BEST): "{best_option_text}"
Score 2 (GOOD): "{good_option_text}"  
Score 1 (SURFACE): "{surface_option_text}"
Score 0 (WRONG): "{wrong_option_text}"

LEARNER'S RESPONSE: "{user_text}"

Return ONLY valid JSON:
{"score":<0.0-3.0>,"quality_label":"<best|good_but_incomplete|surface|plausible_wrong>","competencies_demonstrated":[<from list>],"grading_explanation":"<2 sentences>","confidence":<0.0-1.0>}`
```

### 3B. Create `src/app/api/v2/challenges/[id]/complete/route.ts`
POST — finalize challenge after all 4 steps done.

Body: `{ attempt_id: string }`

Logic:
1. Verify all step_attempts exist for all questions
2. Aggregate step scores via `calculateStepScore()` for each step
3. Compute total via `aggregateChallenge()`
4. Update learner DNA via `updateCompetencies()`
5. Update `challenge_attempts_v2` → status='completed', total_score, grade_label
6. Award XP (follow existing pattern: read profile.xp_total, add earned, write back)
7. Update streak (call existing `update_user_streak` RPC)

Returns: total_score, grade_label, per_step_breakdown, competency_deltas, xp_earned.

### 3C. Create `src/app/api/v2/challenges/[id]/coaching/route.ts`
POST — get role-contextualized coaching for a submitted answer. Called AFTER submit returns.

Body: `{ attempt_id, question_id, step }`

Logic:
1. Fetch step_attempt to get selected_option_id, score, quality
2. Build cache key: `${challengeId}:${step}:${questionId}:${optionId}:${role}`
3. Check coaching_cache → if hit, return cached + increment hit_count
4. If miss: call Claude with role context generation prompt
5. Store in coaching_cache
6. Update step_attempt with role_context and career_signal

Returns: `{ role_context, career_signal, cached: boolean }`

### 3D. Create `src/app/api/v2/dna/route.ts`
GET — learner competency profile.

Query `learner_competencies` for user. Compute `weakest_link` (lowest score × role multiplier). Return all 6 competencies with scores and trends.

### Verify Phase 3

Using the test challenge from Phase 2:
- `POST .../step/frame/submit` with `response_type: 'pure_mcq'` → instant score
- `POST .../step/frame/submit` with `response_type: 'freeform'` → AI-graded score
- Complete all 4 steps → `POST .../complete` → total score + competency deltas
- `POST .../coaching` → role-contextualized coaching text
- `GET /api/v2/dna` → 6 competency scores updated from attempt

**STOP HERE. Phase 3 is complete.**

---

## PHASE 4: Challenge Workspace Frontend
**Goal:** The core user experience — a FLOW stepper that loads questions, accepts answers, shows scores, streams coaching.

### 4A. Create components in `src/components/v2/`

**FlowStepper.tsx** — step indicator bar showing F/L/O/W with active/completed/locked states.
Props: `steps: Array<{ step: FlowStep; status: 'locked' | 'active' | 'completed'; score?: number }>`.
Visual: horizontal pills connected by lines. Completed = `bg-primary` green with score. Active = `border-tertiary` amber pulsing. Locked = `bg-surface-dim` muted.

**OptionCard.tsx** — single MCQ option as a selectable card.
Props: `{ label, text, isSelected, onSelect }`. Unselected: `bg-surface-container-low`. Selected: `border-primary bg-primary-fixed`.

**StepQuestion.tsx** — renders one question: nudge card + 4 OptionCards + optional elaboration textarea + freeform override toggle + submit button.
Props: `{ question, stepNudge, isFirstQuestion, onSubmit, isSubmitting }`.
Nudge card uses `LumaGlyph state="speaking"` at 32px with `bg-secondary-container`.

**StepReveal.tsx** — post-submit reveal: score bar + quality badge + explanation + coaching (async) + expandable option list.
Props: `{ result, role, onContinue, coaching }`.
Score bar: `bg-primary` fill. Coaching loads as skeleton → content from the coaching API.

**ChallengeComplete.tsx** — end-of-challenge results: total score, per-step breakdown, competency deltas, "try another role" pills, next challenge recommendation.
Props: `{ result, challenge, role }`.

### 4B. Create hooks in `src/hooks/`

**useChallengeV2.ts** — manages attempt lifecycle. Calls start, tracks current step/question, calls complete.

**useFlowStep.ts** — loads step questions from API, handles submit, fetches coaching async after submit.

### 4C. Rewrite `src/app/(workspace)/challenges/[id]/page.tsx`

State machine with these phases:
- `loading` → fetch challenge + create/resume attempt
- `question` → show StepQuestion for current question
- `question_reveal` → show StepReveal after submit
- `step_summary` → after all questions in step, show step score
- `complete` → show ChallengeComplete

Use conditional rendering: if `challenge.id` looks like a UUID (v1), render the old `ChallengeWorkspace`. If TEXT id (v2), render the new FLOW stepper. Or check `profiles.schema_version`.

The scenario stays visible as a persistent header above the stepper.

### Verify Phase 4

Open a v2 challenge in the browser:
- FlowStepper shows F active, L/O/W locked
- Questions render with nudge, 4 option cards, elaboration field
- Submit → score appears instantly, coaching streams in
- Continue through all questions → step summary → next step
- After W step → ChallengeComplete shows total score + competency deltas

**STOP HERE. Phase 4 is complete.**

---

## PHASE 5: Challenge Library + Dashboard Updates
**Goal:** Users can discover challenges via filtered browse and see their Learner DNA profile.

### 5A. Update `src/app/(app)/challenges/page.tsx`

Add a `TaxonomyFilters` component above the existing challenge grid. Filter bar with dropdowns for: Paradigm, Industry, Role, Difficulty. Use shadcn `Select` components. Active filters shown as dismissible pills.

Fetch from `GET /api/v2/challenges` with filter params. Render `ChallengeCardV2` cards showing taxonomy pills (paradigm, industry), difficulty badge, competency tags, meta row (time estimate, attempt count, score).

Mix v1 and v2 challenges in the grid — v1 cards link to existing workspace, v2 cards link to new FLOW workspace.

### 5B. Create `src/components/v2/CompetencyRadar.tsx`

Inline SVG, 6-axis radar chart. Plot learner's 6 competency scores (0-100) as a filled polygon on a hexagonal grid.
- Fill: `fill-primary/20 stroke-primary`
- Axis labels: competency short names outside the hexagon
- Size: 280px default, 200px on mobile
- Animate on mount: area grows from center

### 5C. Update `src/app/(app)/progress/page.tsx`

Replace the old ProductIQ radar card with CompetencyRadar using data from `GET /api/v2/dna`. Show 6 competency scores with trend arrows (↑↓→). Show weakest link highlighted. Keep existing submission history below.

### 5D. Update `src/app/(onboarding)/onboarding/role/page.tsx`

Expand role options from 6 to 10. Map old role format ('SWE') to new ('swe'). On select, PATCH both `profiles.preferred_role` AND `profiles.active_role`.

### Verify Phase 5

- Challenge library page shows taxonomy filter bar
- Filtering by paradigm/industry returns matching challenges
- Progress page shows 6-axis CompetencyRadar
- Onboarding role page shows 10 roles
- Dashboard loads without errors

**STOP HERE. Phase 5 is complete.**

---

## AFTER ALL PHASES: Content Seeding

Challenges need to be populated. Two options:

**Option A: Manual SQL insert** — use Claude Code to write INSERT statements for 3-5 test challenges with full FLOW structure (steps → questions → options).

**Option B: Admin script** — create `scripts/seed-challenge.ts` that reads a markdown file (cofounder's format) and calls the Anthropic API to generate MCQ options, then inserts into Supabase.

Either way, each challenge needs: 1 challenge row, 4 flow_steps, 1-3 step_questions per step, 4 flow_options per question. That's ~20-50 rows per challenge.

---

## KEY PATTERNS FROM EXISTING CODEBASE

**Supabase client (user-scoped):**
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

**Supabase admin client (service role, bypasses RLS):**
```typescript
import { createAdminClient } from '@/lib/supabase/admin'
const admin = createAdminClient()
```

**Anthropic API call:**
```typescript
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const msg = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1500,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userPrompt }],
})
const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
const parsed = JSON.parse(text)
```

**Auth guard pattern:**
```typescript
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**Admin guard pattern:**
```typescript
const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

**LumaGlyph usage:**
```tsx
import { LumaGlyph } from '@/components/shell/LumaGlyph'
<LumaGlyph size={32} state="speaking" />  // nudges
<LumaGlyph size={48} state="reviewing" /> // grading
<LumaGlyph size={48} state="celebrating" /> // results
```
