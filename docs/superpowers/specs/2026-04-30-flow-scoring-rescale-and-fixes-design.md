# FLOW scoring rescale to 0–5 + adjacent fixes

## Context

Today FLOW scoring runs on two incompatible scales:

- Challenges: per-step 0–3.0, total_score 0–3.0, max_score 3.0. Grade thresholds 2.5 / 2.0 / 1.5.
- Live interviews: per-move 0–100, overallScore 0–100. Grade thresholds 80 / 65 / 45.

XP for both uses `baseXp × (score / max_score)`, which is scale-invariant individually but means a "Strong" challenge and a "Strong" interview award different XP for nominally equivalent performance. There is no shared score → grade function. The dashboard shows neither score, so users complete an interview and the result vanishes.

Adjacent issues surfaced in the same audit:

- `flow_coverage` is +0.15 on every user turn from three different writers (`/analyze`, `/turn`, `/grade-turn`). When more than one fires for a turn, the move gets double-credited.
- `applyMoveLevelXp` is fire-and-forget on challenge complete, so move levels can race the response.
- Pause/resume restores `flow_coverage` and conversation memory but never rebuilds `system_prompt`. A long pause leaves the model with stale move levels.
- `competency_signal` has two shapes: an object (`primary, signal, framework_hint`) on `step_attempts` and an array of (`competency, signal, stepDetected`) on `debrief_json`. Any unified surface has to merge two schemas.

This spec standardizes scoring on 0–5, fixes the four adjacent issues, and adds a "Latest interview" dashboard tile so the new score actually shows up.

## Decisions

- **Single 0–5 scale** for per-step, total, per-move, and overall — across both pipelines.
- **Shared grade thresholds**: ≥4.0 Outstanding, ≥3.0 Strong, ≥2.0 Developing, <2.0 Needs Practice.
- **Migrate stored values + rescale in code.** No view-time conversion. Backfill past data so dashboard and debrief views stay correct for old sessions.
- **Competency signal**: shared per-item shape `{ competency, signal, framework_hint?, stepDetected? }`. `step_attempts.competency_signal` stays a single object per question with `primary` renamed to `competency`. `debrief_json.competencySignals` stays an array.
- **`flow_coverage` stays on its 0–1 scale.** It's an in-session coaching signal, not a grade. Only `overallScore` and `flowScores` get rescaled.

## Architecture

```
src/lib/scoring/                                  ← NEW shared module
  flow-scale.ts            FLOW_MAX_SCORE, GRADE_THRESHOLDS, scoreToGrade()
  competency-signal.ts     CompetencySignal type
  
Challenge pipeline
  option-scorer.ts         TIER_CAPS rewritten to 0–5
  step-score-calculator    unchanged (just emits a number; range follows TIER_CAPS)
  score-aggregator.ts      uses scoreToGrade(); max_score = FLOW_MAX_SCORE
  challenges/.../complete  XP unchanged (ratio); move XP multiplier *10 → *6
                           awaits applyMoveLevelXp (was fire-and-forget)

Interview pipeline
  debrief-generator.ts     prompt asks for 0–5 floats; defensive clamp on parse
  live-interview/.../end   XP factor /100 → /FLOW_MAX_SCORE
  live-interview/.../resume    rebuilds system_prompt from current move_levels
  live-interview/.../{analyze,turn,grade-turn}   skip if turn_index already credited

Dashboard
  src/lib/data/dashboard.ts                     getLatestInterview()
  src/components/dashboard/cards/LatestInterviewCard.tsx   NEW
  src/app/(app)/dashboard/page.tsx              wires the card

Migrations (new)
  078_flow_scoring_rescale_to_five.sql
  079_competency_signal_rename.sql
  080_flow_coverage_credits.sql
```

## New files

### `src/lib/scoring/flow-scale.ts`

```ts
export const FLOW_MAX_SCORE = 5
export const GRADE_THRESHOLDS = { outstanding: 4.0, strong: 3.0, developing: 2.0 } as const

export type GradeLabel = 'Outstanding' | 'Strong' | 'Developing' | 'Needs Practice'

export function scoreToGrade(score: number, max: number = FLOW_MAX_SCORE): GradeLabel {
  // Always grade against a 0–FLOW_MAX_SCORE scale.
  const normalized = max === FLOW_MAX_SCORE ? score : (score / max) * FLOW_MAX_SCORE
  if (normalized >= GRADE_THRESHOLDS.outstanding) return 'Outstanding'
  if (normalized >= GRADE_THRESHOLDS.strong) return 'Strong'
  if (normalized >= GRADE_THRESHOLDS.developing) return 'Developing'
  return 'Needs Practice'
}

// Per-question option tier caps on the 0–5 scale.
// Old (3.0 max): plausible_wrong 0.5 / surface 1.75 / good_but_incomplete 2.75 / best 3.0
// New (5.0 max): preserves rank distance with cleaner numbers.
export const TIER_CAPS_FIVE: Record<number, number> = {
  0: 0.5,   // plausible_wrong
  1: 2.5,   // surface
  2: 4.25,  // good_but_incomplete
  3: 5.0,   // best
}

// Per-step score → per-move XP delta. Old: *10 (0–30 per step). New: *6 (0–30 per step at 5.0 max).
// Keeps total per-challenge move XP in the same ballpark for level progression.
export const MOVE_XP_MULTIPLIER = 6
```

### `src/lib/scoring/competency-signal.ts`

```ts
export interface CompetencySignal {
  competency: string
  signal: string
  framework_hint?: string
  stepDetected?: 'frame' | 'list' | 'optimize' | 'win'
}
```

### `src/components/dashboard/cards/LatestInterviewCard.tsx`

Material 3 Terra tokens, `font-headline` for the score number, `font-label` for the grade chip, Material Symbols Outlined for the company icon. Renders:

- Top line: company name chip + scenario title
- Hero number: `{score}` `/ 5` with the grade label as a colored chip beside it
- One-line top strength + one-line top growth from `debrief_json.strengths[0]` / `improvements[0]`
- "Open debrief" link to `/live-interviews/{id}/debrief`
- Hidden when there is no completed interview with `debrief_json`

### `src/lib/data/dashboard.ts` — new export `getLatestInterview(userId)`

Returns the most recent `live_interview_sessions` row where `status = 'completed'` and `debrief_json IS NOT NULL`, joined with `company_profiles` for the name. Shape:

```ts
{
  sessionId: string
  companyName: string | null
  scenarioTitle: string | null
  overallScore: number   // 0–5 after migration
  grade: GradeLabel
  completedAt: string
  topStrength: string | null
  topGrowth: string | null
}
```

## Edits

### Challenge pipeline

- **`src/lib/v2/skills/option-scorer.ts`**: replace `TIER_CAPS` with `TIER_CAPS_FIVE` from `flow-scale.ts`. Elaboration adjustment ±0.5 stays the same (it's small relative to the 0–5 scale and changing it changes grading semantics).
- **`src/lib/v2/skills/step-score-calculator.ts`**: no logic change. The function emits a weighted average and follows the input scale.
- **`src/lib/v2/skills/score-aggregator.ts`**: import `scoreToGrade` and `FLOW_MAX_SCORE` from `flow-scale.ts`. Replace the inline grade ladder (line ~18). `max_score` becomes `FLOW_MAX_SCORE` (was the sum of `3.0 × step_weight` which equaled 3.0 when weights summed to 1).
- **`src/app/api/challenges/[id]/complete/route.ts`**:
  - Line ~186 (XP): no change. The `total_score / max_score` ratio is scale-invariant.
  - Line ~209 (move XP): `Math.round(s.step_score * 10)` → `Math.round(s.step_score * MOVE_XP_MULTIPLIER)` from `flow-scale.ts`.
  - Line ~211: change `applyMoveLevelXp(...)` from fire-and-forget to `await applyMoveLevelXp(...)`.
- **`src/app/api/challenges/[id]/step/[step]/submit/route.ts`** (lines 137-141, 173-178, 193): emit `competency` instead of `primary` in the `competency_signal` object. The framework_hint, signal, and storage shape stay the same.

### Interview pipeline

- **`src/lib/live-interview/debrief-generator.ts`**:
  - System prompt: change "overallScore: 0-100 integer" to "overallScore: 0–5 float, one decimal" and "flowScores: {frame: 0-100, ...}" to "flowScores: {frame: 0–5, ...}". Update the per-criterion strong/partial/needs_work mapping copy if it references the 0–100 scale.
  - `scoreToGrade()` (lines 46-51): replace inline implementation with import from `flow-scale.ts`.
  - On parse: clamp `overallScore` to `[0, FLOW_MAX_SCORE]`. Defensive: if Claude returns a value `> 5` (likely an old prompt slipping through), divide by 20 with a `console.warn`. Same clamp on each `flowScores` move.
- **`src/app/api/live-interview/[id]/end/route.ts`**:
  - Line 152-155 (XP): `overallScore / 100` → `overallScore / FLOW_MAX_SCORE`.
  - The artifact-grader integration writes flow_signal_boosts to `flow_coverage` (0–1 scale, unchanged).
- **`src/app/api/live-interview/[id]/resume/route.ts`**:
  - After restoring snapshot, re-fetch profile / move_levels / competencies / failure_patterns / hatch context / challenge / flow_steps / role_lens (mirroring `start/route.ts`).
  - Call `buildLiveInterviewSystemPrompt(...)` and persist to `live_interview_sessions.system_prompt`.
  - Return `systemPrompt` in the response JSON.
  - Optional refactor: extract the prompt-build path from `start/route.ts` into `src/lib/live-interview/build-prompt-from-session.ts` and call it from both. Recommended — avoids drift.
- **`src/app/(app)/live-interviews/[id]/page.tsx`**:
  - On mount, if URL carries `loop_id` and the loop round status is `paused`, hit `POST /api/live-interview/[id]/resume` first and seed `sessionStorage.hatch_prompt_${sessionId}` from the response. Today the client uses the cached prompt from sessionStorage; that's stale across sessions.

### `flow_coverage` dedup

- New column on `live_interview_sessions`: `flow_coverage_credits JSONB DEFAULT '{"frame":[],"list":[],"optimize":[],"win":[]}'`. Each move maps to an array of `turn_index`es already credited.
- Three writers must check before incrementing:
  - **`/api/live-interview/[id]/turn/route.ts`** (line 71): already knows `nextIndex`. Check `credits[move]?.includes(nextIndex)`; if yes, skip increment.
  - **`/api/live-interview/[id]/grade-turn/route.ts`** (line 186): accept `turnIndex` in the request body (chat route already knows it when dispatching). Skip if already credited.
  - **`/api/live-interview/[id]/analyze/route.ts`** (line 95): accept `turnIndex` in the request body too. The client knows it when invoking analyze.
- All three writers, when they DO increment, also push `turn_index` onto `credits[move]` in the same UPDATE.
- Bonus: the credits column is also a useful audit trail for grading the interview later.

### Competency signal

- **Migration** `079_competency_signal_rename.sql` renames the JSONB key for past rows.
- **Writers** in `submit/route.ts` (3 paths) emit `competency` instead of `primary`.
- **Readers**:
  - `src/components/v2/StepDetailModal.tsx` line 48 already reads `framework_hint` only — no change.
  - `src/components/v2/PostSessionMirror.tsx` lines 143-149 reads `signal.competency || signal.primary` during the migration window, then drops `primary` after the migration ships. Optionally just read `competency` and rely on the migration backfilling old rows.
  - `src/components/live-interviews/PriorRoundRecap.tsx` already uses `competency` from the array form — no change.
- **Type**: `freeform-grader.ts` and the relevant Zod schemas update `primary` → `competency`. Any TS type for `competency_signal` (search `types.ts:619` per the plan agent) updates likewise.

## Migrations

### `supabase/migrations/078_flow_scoring_rescale_to_five.sql`

```sql
BEGIN;

-- Challenge attempts: per-attempt totals
UPDATE challenge_attempts
SET total_score = ROUND((total_score * 5.0 / 3.0)::numeric, 2),
    max_score = 5.0
WHERE max_score IS NOT NULL AND max_score > 0;

-- Challenge attempts: feedback_json.step_breakdown[].score and .max_score
UPDATE challenge_attempts
SET feedback_json = jsonb_set(
  jsonb_set(
    feedback_json,
    '{step_breakdown}',
    (
      SELECT jsonb_agg(
        jsonb_set(
          jsonb_set(elem, '{score}', to_jsonb(ROUND((COALESCE((elem->>'score')::numeric, 0) * 5.0 / 3.0)::numeric, 2))),
          '{max_score}', to_jsonb(5.0)
        )
      )
      FROM jsonb_array_elements(feedback_json->'step_breakdown') elem
    )
  ),
  '{max_score}', to_jsonb(5.0)
)
WHERE feedback_json ? 'step_breakdown';

-- Also rescale feedback_json.total_score if present
UPDATE challenge_attempts
SET feedback_json = jsonb_set(
  feedback_json,
  '{total_score}',
  to_jsonb(ROUND((COALESCE((feedback_json->>'total_score')::numeric, 0) * 5.0 / 3.0)::numeric, 2))
)
WHERE feedback_json ? 'total_score';

-- Step attempts: per-question score
UPDATE step_attempts
SET score = ROUND((score * 5.0 / 3.0)::numeric, 2)
WHERE score IS NOT NULL;

-- Live interview debriefs
UPDATE live_interview_sessions
SET debrief_json = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          debrief_json,
          '{overallScore}',
          to_jsonb(ROUND((COALESCE((debrief_json->>'overallScore')::numeric, 0) / 20.0)::numeric, 2))
        ),
        '{flowScores,frame}', to_jsonb(ROUND((COALESCE((debrief_json#>>'{flowScores,frame}')::numeric, 0) / 20.0)::numeric, 2))
      ),
      '{flowScores,list}', to_jsonb(ROUND((COALESCE((debrief_json#>>'{flowScores,list}')::numeric, 0) / 20.0)::numeric, 2))
    ),
    '{flowScores,optimize}', to_jsonb(ROUND((COALESCE((debrief_json#>>'{flowScores,optimize}')::numeric, 0) / 20.0)::numeric, 2))
  ),
  '{flowScores,win}', to_jsonb(ROUND((COALESCE((debrief_json#>>'{flowScores,win}')::numeric, 0) / 20.0)::numeric, 2))
)
WHERE debrief_json IS NOT NULL AND debrief_json ? 'overallScore';

-- Loop rounds: round_debrief_json mirrors debrief_json shape
UPDATE loop_rounds
SET round_debrief_json = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          round_debrief_json,
          '{overallScore}',
          to_jsonb(ROUND((COALESCE((round_debrief_json->>'overallScore')::numeric, 0) / 20.0)::numeric, 2))
        ),
        '{flowScores,frame}', to_jsonb(ROUND((COALESCE((round_debrief_json#>>'{flowScores,frame}')::numeric, 0) / 20.0)::numeric, 2))
      ),
      '{flowScores,list}', to_jsonb(ROUND((COALESCE((round_debrief_json#>>'{flowScores,list}')::numeric, 0) / 20.0)::numeric, 2))
    ),
    '{flowScores,optimize}', to_jsonb(ROUND((COALESCE((round_debrief_json#>>'{flowScores,optimize}')::numeric, 0) / 20.0)::numeric, 2))
  ),
  '{flowScores,win}', to_jsonb(ROUND((COALESCE((round_debrief_json#>>'{flowScores,win}')::numeric, 0) / 20.0)::numeric, 2))
)
WHERE round_debrief_json IS NOT NULL AND round_debrief_json ? 'overallScore';

-- Loop rounds: round_score column was INTEGER 0–100; widen + rescale
ALTER TABLE loop_rounds ALTER COLUMN round_score TYPE NUMERIC(4,2) USING round_score / 20.0;

COMMIT;
```

Reversible: a 078_down.sql multiplies all the numbers by `3.0/5.0` (challenges) or `20.0` (interviews) and reverts the ALTER to `INTEGER USING round(round_score * 20)::int`.

### `supabase/migrations/079_competency_signal_rename.sql`

```sql
UPDATE step_attempts
SET competency_signal =
  (competency_signal - 'primary') || jsonb_build_object('competency', competency_signal->'primary')
WHERE competency_signal ? 'primary'
  AND NOT (competency_signal ? 'competency');
```

### `supabase/migrations/080_flow_coverage_credits.sql`

```sql
ALTER TABLE live_interview_sessions
  ADD COLUMN flow_coverage_credits JSONB NOT NULL
  DEFAULT '{"frame":[],"list":[],"optimize":[],"win":[]}';
```

## Order of operations

1. **Code-side prep PR**: ship `flow-scale.ts` and `competency-signal.ts` with no behavioral change. Readers add a transitional fallback (`signal.competency ?? signal.primary`). Deploy.
2. **Migrations**: run 078, 079, 080 in a single transaction window. Single-digit seconds for any realistic dataset. Brief read-only window is acceptable but not required since each statement is self-contained.
3. **Cutover PR**: ship rescaled writers (option scorer caps, debrief prompt, XP factor, await fix), prompt rebuild on resume, dedup logic, dashboard tile. Drop the transitional fallback.
4. **Verify** (see below).

If the team prefers a single-PR approach, ship steps 1+3 together gated behind a `FLOW_SCALE_FIVE` env flag, run the migrations, then flip the flag. The transitional fallback in readers makes either path safe.

## Verification

1. **TypeScript**: `npx tsc --noEmit` from repo root, clean except pre-existing `supabase/functions/` Deno noise.
2. **Migration spot-check** (psql / supabase studio):
   - `SELECT id, total_score, max_score FROM challenge_attempts ORDER BY completed_at DESC LIMIT 5;` — every `max_score` is `5.0`, every `total_score` is `≤ 5.0`.
   - `SELECT id, debrief_json->>'overallScore' AS score FROM live_interview_sessions WHERE status='completed' ORDER BY ended_at DESC LIMIT 5;` — every value is `≤ 5.0`.
   - `SELECT competency_signal FROM step_attempts WHERE competency_signal IS NOT NULL LIMIT 5;` — every row has a `competency` key, no row has a `primary` key.
3. **Synthetic challenge run**: complete a published challenge end-to-end, observe `total_score` is 0–5 and `grade_label` matches `scoreToGrade()`. Confirm move XP is in the same ballpark as before by reading `move_levels.xp` delta.
4. **Synthetic interview run**: start a Product Sense interview, exchange ~6 turns, end. Inspect `live_interview_sessions.debrief_json.overallScore` is a 0–5 float and `flowScores` are 0–5. Verify the debrief page renders the new score correctly.
5. **Dedup verification**: during the synthetic interview, manually invoke `/analyze` twice for the same `turnIndex` (curl). Confirm `flow_coverage[frame]` only increments once. Confirm `flow_coverage_credits.frame` contains the turn index.
6. **Resume verification**: pause the interview, wait 30 seconds, resume. Confirm response JSON includes a `systemPrompt`, that `live_interview_sessions.system_prompt` was updated, and that the next chat turn references current move levels (drop a level via SQL, then ask Hatch about it).
7. **Dashboard tile**: load `/dashboard` after a completed interview. Verify the "Latest interview" tile shows the company, score `{X.X} / 5`, grade chip, one strength, one growth, and "Open debrief" link.
8. **Playwright spot-check**: a Sonnet agent walks through challenge → dashboard → interview → dashboard. Screenshot the new tile.

## Risks

- **Claude returns scores in the old 0–100 scale post-deploy** if the prompt change doesn't take effect (prompt caching). The defensive `clamp + divide` in the parser softens this, but worth a one-time `aidefence` cache flush after the cutover deploy.
- **In-flight interviews at deploy time**: if a session was active before the migration, its `flow_coverage` is already 0–1 (unchanged) and the prompt was already built (unchanged). The next debrief will be on the new scale. No mid-session breakage expected, but flag for QA.
- **Move-level XP recalibration is approximate.** The new `*6` multiplier produces 0–30 per step (unchanged), but any user mid-progression toward a level cap will see a tiny shift. Acceptable.
- **`loop_rounds.round_score` ALTER** is the only schema-changing statement. If it fails (e.g. existing NULLs with `USING` expression), the whole transaction rolls back. Mitigation: include `WHERE round_score IS NOT NULL` guard.

## Out of scope

- Surfacing competency_signals as their own dashboard surface. The data is unified now; visual rollup is a follow-up.
- Showing `flow_coverage` (0–1 in-session) somewhere on the active interview UI. Today it lives only in the SSE feed.
- Re-running grading on past sessions with the new prompt. Backfill is a math rescale, not a re-grade.
