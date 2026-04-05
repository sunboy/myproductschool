# Mental Models Integration — Implementation Reference

## 1. Overview

The Mental Models integration wires HackProduct's 6 competency dimensions and 10 active competency-step mappings into the live product. Before this build, rubric files and framework content existed only as static content — grading used v1 dimensions (`diagnostic_accuracy`, etc.), nudges were step-unaware, option reveals had no framework hints, and there was no post-challenge mental models breakdown. This build connects every layer: schema, grading pipeline, Luma AI interactions, frontend components, token optimization via Anthropic prompt caching, and 4 Claude Code skills for deterministic AI behavior.

---

## 2. Schema Changes

Migration: `supabase/migrations/026_mental_models_v2.sql`

| Table | Column/Object | Type | Purpose |
|---|---|---|---|
| `flow_options` | `framework_hint` | `TEXT` | Mental model callout shown in option reveal (e.g. "Motivation Theory → Friction: ...") |
| `flow_options` | `precomputed_competency_signal` | `JSONB` | Pre-computed competency signal for MCQ options — zero AI calls for pure_mcq grading |
| `step_attempts` | `competency_signal` | `JSONB` | `{ primary, signal, framework_hint }` persisted from grading result |
| `challenge_attempts_v2` | `mental_models_breakdown` | `JSONB` | Array of `{ step, competency, reasoning_move, demonstrated, missed }` per FLOW step |
| `user_failure_patterns` | (index) | `INDEX` | `idx_user_failure_patterns_trend` on `(user_id, pattern_id)` for trend queries |
| `grading_prompt_cache` | (new table) | `TABLE` | Pre-computed grading prompt prefixes per `(challenge_id, step, question_sequence)` |

---

## 3. New Files

| Path | Purpose |
|---|---|
| `supabase/migrations/026_mental_models_v2.sql` | Schema migration: adds columns, index, and `grading_prompt_cache` table |
| `src/lib/v2/skills/rubric-loader.ts` | Loads rubric JSON files from `content/grading_rubrics/`, in-memory cache, exports `loadRubric`, `getCriteriaForStep`, `getCoachingMessage`, `getReasoningMove`, `getScoringWeights`, `getAntiPatterns` |
| `src/lib/anthropic/cached-client.ts` | Shared Anthropic client with prompt caching (`cache_control: { type: 'ephemeral' }`). Exports `createCachedMessage` and `createCachedMessageMultiSystem` |
| `src/components/challenge/MentalModelsBreakdown.tsx` | Client component rendering per-step competency breakdown with demonstrated/missed signals, weakest competency callout, and next-challenge link |
| `content/grading_rubrics/frame_rubric.json` | Frame step rubric: F1-F4 criteria with weights, signals, coaching messages |
| `content/grading_rubrics/list_rubric.json` | List step rubric: L1-L4 criteria |
| `content/grading_rubrics/optimize_rubric.json` | Optimize step rubric: O1-O4 criteria |
| `content/grading_rubrics/win_rubric.json` | Win step rubric: W1-W4 criteria |
| `content/MENTAL_MODELS_FRAMEWORK.md` | Full framework document: 7 thinkers, 6 competencies, 10 active mappings |
| `~/.claude/skills/hackproduct-grader/SKILL.md` | Claude Code skill for grading freeform/elaboration responses |
| `~/.claude/skills/hackproduct-enricher/SKILL.md` | Claude Code skill for generating MCQ options + framework_hints |
| `~/.claude/skills/hackproduct-coaching/SKILL.md` | Claude Code skill for role-specific coaching output |
| `~/.claude/skills/hackproduct-nudger/SKILL.md` | Claude Code skill for step-aware in-context nudges |

---

## 4. Modified Files

| Path | What Changed |
|---|---|
| `src/lib/types.ts` | Added `framework_hint?: string` to `FlowOption`, `competency_signal` to `StepAttemptRecord`, `mental_models_breakdown` to `ChallengeAttemptV2` |
| `src/lib/v2/skills/ai/freeform-grader.ts` | Imports `loadRubric`, injects rubric criteria into grading prompt, expanded `GradingResponseSchema` with `criteria_scores` and `competency_signal`, uses `createCachedMessage` |
| `src/app/api/v2/challenges/[id]/step/[step]/submit/route.ts` | Persists `competency_signal` on `step_attempts` insert, generates deterministic signal for `pure_mcq` via `STEP_PRIMARY_COMPETENCIES` + `getReasoningMove` |
| `src/app/api/v2/challenges/[id]/coaching/route.ts` | Selects `framework_hint` from `flow_options`, includes in response JSON and coaching prompt, uses `createCachedMessage` |
| `src/app/api/luma/nudge/route.ts` | Accepts `step` in request body, imports `getReasoningMove`, injects reasoning move into nudge prompt, uses `createCachedMessage` with haiku model |
| `src/app/api/luma/feedback/route.ts` | Dual-path: v1 (legacy) and v2 (FLOW-based). V2 fetches `step_attempts.competency_signal`, evaluates against rubrics, generates `mental_models_breakdown`, uses `createCachedMessage` |
| `src/lib/luma/system-prompt.ts` | Added `LUMA_CORE_IDENTITY`, `MENTAL_MODELS_CONTEXT`, `STEP_PRIMARY_COMPETENCIES`, `LUMA_FEEDBACK_SYSTEM_PROMPT_V2`, updated `buildNudgeUserPrompt` with step context |
| `src/lib/luma/feedback-schema.ts` | Added `V2FeedbackSchema` with per-step `CriterionScoreSchema`, `MentalModelBreakdownSchema`, `clampV2FeedbackScores` |
| `src/lib/v2/skills/nudge-resolver.ts` | Accepts `reasoningMove` parameter, prepends mental model context to nudge output |
| `src/app/(app)/challenges/[id]/feedback/page.tsx` | Imports `MentalModelsBreakdown`, detects v1 vs v2 feedback, renders per-step criteria and breakdown for v2 |
| `src/components/v2/FlowWorkspace.tsx` | Passes `step` to nudge API call |
| `src/components/v2/OptionCard.tsx` | Renders `framework_hint` in option reveal |
| `src/components/v2/StepQuestion.tsx` | Passes step context for competency signal display |
| `src/components/v2/StepReveal.tsx` | Shows competency signal card in step completion UI |
| `src/components/marketing/WaitlistForm.tsx` | Minor — unrelated to mental models |

---

## 5. API Changes

| Endpoint | Method | New Request Fields | New Response Fields |
|---|---|---|---|
| `/api/v2/challenges/[id]/step/[step]/submit` | POST | (none) | `competency_signal: { primary, signal, framework_hint }`, `framework_hint` on revealed options |
| `/api/v2/challenges/[id]/coaching` | POST | (none) | `framework_hint` in response JSON |
| `/api/luma/nudge` | POST | `step: FlowStep` | Nudge text now references reasoning move for current step |
| `/api/luma/feedback` | POST | `attempt_id: string` (triggers v2 path) | V2 response: `{ overall_score, overall, steps[], mental_models_breakdown[], weakest_competency, next_recommendation, detected_patterns[] }` |

---

## 6. Token Optimization

### Prompt Caching

All Luma AI interactions now use `src/lib/anthropic/cached-client.ts`. System prompts are marked with `cache_control: { type: 'ephemeral' }`, giving a ~90% input token discount on cache hits.

| System Prompt | Est. Tokens | Calls/Challenge | Cache Impact |
|---|---|---|---|
| Freeform grader (rubric + exemplars) | ~1500 | up to 12 per challenge | Very high — same rubric across users |
| `LUMA_FEEDBACK_SYSTEM_PROMPT_V2` + rubric | ~2000 | 1 per challenge completion | High |
| `LUMA_NUDGE_SYSTEM_PROMPT` + step context | ~300 | up to 12 per challenge | Moderate |
| Coaching system prompt | ~100 | up to 12 per challenge | Low (short prompt) |

### Model Downgrades

| Call Site | Previous Model | Current Model | Rationale |
|---|---|---|---|
| Freeform grading | claude-opus-4-6 | claude-opus-4-6 (kept) | Highest stakes — score accuracy |
| Elaboration grading | claude-opus-4-6 | claude-sonnet-4-6 | ±0.5 adjustment, lower stakes |
| Coaching (option) | claude-opus-4-6 | claude-sonnet-4-6 | Template-like output |
| Coaching (freeform) | claude-opus-4-6 | claude-opus-4-6 (kept) | Needs deep reasoning |
| Feedback | claude-sonnet-4-6 | claude-sonnet-4-6 (kept) | Already correct |
| Nudge | claude-sonnet-4-6 | claude-haiku-4-5-20251001 | 1-2 sentences, highly constrained |
| Chat / Simulation | claude-sonnet-4-6 | claude-sonnet-4-6 (kept) | Conversational quality |

### Additional Caching Layers

| Layer | Mechanism | Impact |
|---|---|---|
| Coaching cache | `coaching_cache` table keyed by `user:challenge:step:question:option:role` | Eliminates repeat coaching calls |
| Deterministic MCQ | Pure MCQ grading + competency signals require zero AI calls | 100% savings for most common response type |
| Rubric loader | In-memory cache via `rubricCache` map — rubric JSON loaded once per process | Zero FS reads after first load |
| Grading prompt cache | `grading_prompt_cache` table — pre-computed prompt prefixes per question | Maximizes Anthropic prompt cache hits |

---

## 7. Skills Created

4 Claude Code skills define deterministic behavior for all Luma AI interactions:

| Skill | Path | Trigger | Output Schema |
|---|---|---|---|
| `hackproduct-grader` | `~/.claude/skills/hackproduct-grader/SKILL.md` | Grading freeform/elaboration responses | `{ score, criteria_scores, competency_signal, coaching }` |
| `hackproduct-enricher` | `~/.claude/skills/hackproduct-enricher/SKILL.md` | Generating MCQ options + framework hints | `{ options[]: { text, quality, explanation, framework_hint } }` |
| `hackproduct-coaching` | `~/.claude/skills/hackproduct-coaching/SKILL.md` | Role-specific coaching output | `{ role_context, career_signal }` |
| `hackproduct-nudger` | `~/.claude/skills/hackproduct-nudger/SKILL.md` | Step-aware in-context nudges | `{ nudge: string }` (1-2 sentences) |

---

## 8. Grading Flow

How a freeform response flows through the system:

1. User submits freeform text via `POST /api/v2/challenges/[id]/step/[step]/submit` with `response_type: 'freeform'`
2. `grading-router.ts` routes to `freeform-grader.ts`
3. `freeform-grader.ts` calls `loadRubric(step)` to get step-specific criteria (F1-F4, L1-L4, etc.)
4. Builds grading prompt with rubric criteria, exemplar options, scenario context, and `MENTAL_MODELS_CONTEXT`
5. Calls `createCachedMessage` with `claude-opus-4-6` — system prompt is cached via `cache_control: ephemeral`
6. Parses response against `GradingResponseSchema` (includes `criteria_scores` and `competency_signal`)
7. Maps rubric weighted score to 0-3 scale: ≥0.75 → 2.5-3.0, 0.45-0.74 → 1.5-2.4, <0.45 → 0-1.4
8. If confidence < threshold, triggers elaboration follow-up with `claude-sonnet-4-6`
9. Submit route persists `competency_signal` to `step_attempts` table
10. Returns grading result + `competency_signal` + revealed options with `framework_hint` to client

---

## 9. Competency Signal Flow

How `competency_signal` propagates through the system:

```
Grading (freeform-grader.ts)
  → competency_signal: { primary, signal, framework_hint }
    ↓
Step Submit (submit/route.ts)
  → INSERT into step_attempts.competency_signal
    ↓
Frontend (StepReveal.tsx)
  → Displays "Reasoning Move" card with competency name + signal
    ↓
Challenge Completion
  → Fetches all step_attempts.competency_signal for this attempt
  → Builds mental_models_breakdown array
  → Persists to challenge_attempts_v2.mental_models_breakdown
    ↓
Feedback Endpoint (feedback/route.ts, v2 path)
  → Reads step_attempts with competency_signal
  → Evaluates against rubric criteria via loadRubric
  → Generates per-step coaching using luma_coaching_weak/failure
  → Returns V2FeedbackSchema with steps[], mental_models_breakdown[], weakest_competency
    ↓
Feedback Page (feedback/page.tsx)
  → Detects v2 format (presence of attempt_id / steps array)
  → Renders per-step criteria scores
  → Renders MentalModelsBreakdown component
  → Shows weakest competency + next challenge recommendation
```

For **deterministic MCQ** responses, `competency_signal` is generated without AI:
- Uses `STEP_PRIMARY_COMPETENCIES` mapping + `getReasoningMove(step)` from rubric-loader
- Quality level derived from selected option's `quality` field
- No Anthropic API call needed

---

## 10. How to Test

### Submit a step (freeform)
```bash
curl -X POST http://localhost:3000/api/v2/challenges/{challengeId}/step/frame/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{
    "attempt_id": "<attempt-id>",
    "question_id": "<question-id>",
    "response_type": "freeform",
    "user_text": "The core problem is that drivers cannot trust their earnings data..."
  }'
```
Expected: Response includes `competency_signal` with `primary`, `signal`, `framework_hint`.

### Get coaching with framework_hint
```bash
curl -X POST http://localhost:3000/api/v2/challenges/{challengeId}/coaching \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{
    "attempt_id": "<attempt-id>",
    "question_id": "<question-id>",
    "option_id": "<option-id>",
    "step": "frame"
  }'
```
Expected: Response includes `framework_hint` field.

### Request a step-aware nudge
```bash
curl -X POST http://localhost:3000/api/luma/nudge \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{
    "challengeId": "<challenge-id>",
    "challengePrompt": "Uber drivers are complaining...",
    "draft": "I think the problem is...",
    "attemptId": "<attempt-id>",
    "step": "frame"
  }'
```
Expected: Nudge references reasoning move ("finding the problem behind the problem").

### Get v2 feedback (FLOW-based)
```bash
curl -X POST http://localhost:3000/api/luma/feedback \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{
    "attempt_id": "<attempt-id>",
    "userId": "<user-id>",
    "challengeId": "<challenge-id>"
  }'
```
Expected: V2 response with `steps[]`, `mental_models_breakdown[]`, `weakest_competency`, `next_recommendation`.

### Verify schema
```sql
-- Check framework_hints are populated
SELECT id, framework_hint FROM flow_options WHERE framework_hint IS NOT NULL LIMIT 5;

-- Check competency_signal on step_attempts
SELECT id, competency_signal FROM step_attempts WHERE competency_signal IS NOT NULL LIMIT 5;

-- Check mental_models_breakdown on challenge_attempts_v2
SELECT id, mental_models_breakdown FROM challenge_attempts_v2 WHERE mental_models_breakdown IS NOT NULL LIMIT 5;
```
