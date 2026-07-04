# Adaptive Workspaces — Design (2026-07-04)

Status: draft for Codex review. Scope: the AI Analyst (Claude Code + BigQuery) lab first; the final section defines the reusable contract other mediums adopt later.

## 1. Problem

HackProduct's challenge surfaces are structurally static. The CC Analytics arc is the same 8 steps for every learner at a given difficulty (`arcForDifficulty` in `src/components/v2/mediums/analyticsArc.ts`). Hint density, teaching notes, suggested prompts, and coach verbosity are constant. Meanwhile a real learner-level signal already exists (`HatchUserContext.overallLevel`, `weakestCompetency`, `moveLevels` in `src/lib/hatch-context.ts`) and is consumed only by recommendations, digests, and Hatch prompt flavor. The product should feel like a live analyst workspace that adapts to the person in it: more scaffolding for beginners, more ambiguity for experts, and in-session branching when someone is stuck or flying.

## 2. Structured vs open-ended map (CC lab)

| Layer | Structured (the product owns it) | Open-ended (the learner owns it) |
|---|---|---|
| Mission | Business question, dataset, success criteria | How to attack it |
| Milestones | Arc steps with objectives + success criteria | Order of exploration inside a step; extra questions asked |
| Execution | BigQuery via MCP, budgeted session | Any query, any prompt, any file in the workspace |
| Coaching | Hatch verdicts on marked findings, nudges | What to ask Hatch, when, and how deep |
| Outcome | analyst_v1 grading, report artifact | The analysis narrative, the skill file, the recommendation |

The adaptive layer changes how much of the structured column is visible and how eagerly it intervenes. It never restricts the open-ended column: the terminal and Hatch chat always accept anything.

## 3. Adaptation signal model

### 3.1 Inputs

Pre-session (from `HatchUserContext` / `learner_competencies`):
- `overallLevel`: Beginner | Developing | Advanced | Expert
- per-competency `score` (0-100) and evidence count (`total_attempts`)
- calibration archetype (prior only, see §6)
- prior CC sessions completed (from `challenge_attempts` where medium = claude_code)

In-session (already captured in `ClaudeCodeAnalyticsMedium` client state):
- verdict history per step (`pass | partial | retry` from `interpret`)
- retry count per step
- time on step, idle time (nudge timer already exists)
- markedFindings quality (verdict already grades them)
- pace vs arc position (steps completed per wall-clock)

### 3.2 Guidance level

One derived enum drives every surface effect:

```
type GuidanceLevel = 'scaffolded' | 'guided' | 'open'
```

Pre-session derivation (server, in `session/start`):
- `scaffolded`: overallLevel Beginner, OR total evidence < 3 attempts, OR zero prior CC sessions on a first analytics challenge
- `guided`: overallLevel Developing, or Advanced with low evidence
- `open`: overallLevel Advanced/Expert with evidence ≥ 3

In-session adjustment (client, a small explicit state machine — Codex finding 4):
- state: `{ passStreak, retryStreak, netMovement }`
- `pass` on a user-driven step increments `passStreak`, resets `retryStreak`. The auto-completed `mcp_setup` step (gated on `mcpConnected && replRunning`, no verdict) does NOT count toward `passStreak`.
- `retry` increments `retryStreak`, resets `passStreak`.
- `partial` is a streak breaker: resets BOTH streaks, moves nothing.
- downgrade one notch when `retryStreak === 2`; upgrade one notch when `passStreak === 2` with zero retries so far on those steps.
- **net movement is capped at one per session** (`netMovement ∈ {-1, 0, +1}`): after any movement, a further movement is allowed only if it returns net to 0; a second movement in the same direction is never allowed. This kills pass-pass-upgrade / retry-retry-downgrade churn.

### 3.3 Surface effects

| Surface | scaffolded | guided | open |
|---|---|---|---|
| Arc (see §4) | full arc + explainer scaffold steps | standard arc | compressed arc + stretch steps |
| `suggestedPrompts` shown | all (3) | 2 | collapsed behind "Need a starting point?" |
| `teachingNote` | always visible | visible | collapsed by default |
| Idle nudge threshold | short (existing timer, eager) | standard | only on explicit ask |
| Hatch verbosity (skill prompt) | explains reasoning steps | asks guiding questions | terse, critiques like a peer reviewer |
| Verdict tone | encouraging, names the next micro-move | balanced | direct, pushes on business impact |

## 4. Level-aware arc: `arcForLearner`

Replace the call site's `arcForDifficulty(difficulty)` with:

```
arcForLearner(difficulty, guidance: GuidanceLevel): AnalyticsSubProblem[]
```

Rule (Codex finding 5 — one consistent principle): **difficulty decides the step SET; guidance decides presentation and injection.**

- `scaffolded`: same step set as `arcForDifficulty(difficulty)` — a beginner-difficulty challenge keeps its 4-step subset, an advanced challenge keeps 8. Guidance effects are presentational (teaching notes always on, all suggested prompts, eager nudges) plus scaffold injection via `planBranch` when stuck.
- `guided`: `arcForDifficulty` behavior today (unchanged default — zero regression risk).
- `open`: compress `explore_schema` + `data_layout` into one "Map the data" step, **unless the challenge's `metadata.sub_problems` overrides either of those ids — an override on either id disables compression for that challenge** so id-based overrides are never dropped. Append one stretch step after `answer`: kind `stakeholder_tension` or `metric_definition` when metadata requests it.

`mergeArc(difficulty, overrides)` becomes `mergeArc(difficulty, overrides, guidance)` with guidance defaulting to `'guided'` so existing call sites and tests are untouched. The per-challenge `metadata.sub_problems` override system is unchanged and still wins on id match.

New step kinds (`stakeholder_tension`, `metric_definition`, `scaffold_explainer`, `map_the_data`) extend the `kind` union in `src/components/v2/mediums/types.ts` (additive). Every non-terminal consumer of `kind` must be updated in the same increment: `SubProblemStepper` icon/color maps and any switch on kind (Codex finding 7). **No adaptation fields are ever added to `ClaudeCodeTerminalProps`** — the frozen terminal contract is untouched.

## 5. In-session branching at `handleMark`

`ClaudeCodeAnalyticsMedium.handleMark` receives the verdict today and advances linearly. Add a pure function:

```
planBranch(state: { verdictHistory, retriesByStep, arc, injectedCount, skippedCount })
  → { action: 'advance' | 'inject_scaffold' | 'inject_stretch' | 'none', step?: AnalyticsSubProblem }
```

Rules:
- 2 retries on the same step → `inject_scaffold`: insert a `scaffold_explainer` step before the stuck step (schema walk-through / suggested first query for THAT step, generated from the step's own objective + suggestedPrompts, no AI call needed).
- 2 consecutive clean passes AND ahead of pace → `inject_stretch`: insert one harder follow-up after the current step (from a small static pool per kind; challenges can supply their own via `metadata.claude_code.stretch_steps`).
- Bounds: max 2 injections total, max 1 of each type, arc never shrinks below 3 remaining steps, never inject during the last step.

Persistence (Codex findings 1 + 3 — adaptive state must survive refresh AND finalize):
- **Live persistence, not finalize-only.** The session's adaptive state (`guidance`, `arcPlanned` as the full ordered step list, injected steps, adjustments) is persisted server-side as it changes — written into `claude_code_sessions.final_artifact.adaptive` via a small authed `PATCH session/[id]/adaptive` route (the column is unused until finalize, so progressive writes are safe). `start`, `current`, and `state` all return the persisted per-session arc when one exists, so a mid-session refresh reconstructs the exact adapted arc instead of rebuilding from challenge metadata.
- **Finalize merge semantics:** finalize validates an `adaptive` payload (zod) and writes `{ ...gradeResult.final_artifact, adaptive }` — grader output never clobbers the adaptive log, and the adaptive log is passed INTO `gradeAnalystSession` so the grader can narrate it.

Shape of `final_artifact.adaptive`:

```
{ guidanceLevel, initialGuidance, arcPlanned: string[], injected: [{id, kind, afterStepId, reason}], adjustments: [{from, to, trigger, atStepId}] }
```

The grader and `AnalyticsSessionMirror` read this to narrate the session honestly ("you hit a wall at segmentation, took the scaffold, then finished strong") rather than pretending the arc was fixed.

Because `planBranch` is pure, it gets exhaustive unit tests without any session infrastructure.

## 6. Calibration measurement model

### Today

- Calibration quiz seeds nothing durable per-competency; `updateCompetencies` (`src/lib/v2/skills/competency-updater.ts`) initializes unknown competencies at score 50, then applies `score += k * (actual − expected)` per attempt with role-lens multipliers.
- `deriveOverallLevel` (hatch-context.ts) maps mean score to a level with no notion of how much evidence backs it. One lucky challenge can move a level.

### Design: prior + evidence-weighted posterior

Keep the existing update shape (it is already an Elo-style bounded step) and add two things:

1. **Confidence** derived from evidence, no schema change:
   `conf(c) = n / (n + K_PRIOR)` where `n = total_attempts` for that competency and `K_PRIOR = 5`. Confidence 0 at cold start, ~0.5 at 5 attempts, →1 asymptotically.

2. **Level derivation uses confidence**, in `deriveOverallLevel`:
   - effective score per competency: `s_eff = conf * score + (1 − conf) * 50` (shrink toward the neutral prior when evidence is thin)
   - overall level thresholds unchanged, applied to the mean of `s_eff`
   - hard floor: with total evidence Σn < 3, level is `Beginner` unless the calibration archetype says otherwise (archetype maps to a starting level: explorer→Beginner, practitioner→Developing, operator→Advanced as prior only)

3. **CC sessions become evidence** (data contract per Codex finding 2). analyst_v1 dimension scores are **0 | 0.5 | 1** (not 0-100) — they feed `updateCompetencies` directly as `result.score` with `step_weight` scaled by session completeness (its `expected = score/100` internal contract already matches a 0..1 `actual`). Dimension → competency mapping: connection_setup/problem_framing → `domain_expertise`; query_rigor/segmentation → `strategic_thinking`; communication/evidence → `cognitive_empathy`; skill_construction → `creative_execution`; the mapping table lives beside `analyst-rubric.ts`. Implementation must also: (a) add `total_attempts` to the `learner_competencies` select in `getHatchContext` (it is not selected today) and extend the context type with per-competency evidence; (b) map the REAL calibration archetype names (read them from `src/lib/calibration/` at implementation time — the explorer/practitioner/operator names in an earlier draft were placeholders) to prior levels.

Properties (unit-tested): bounded per-update movement (existing k), monotone in evidence direction, cold-start returns the archetype prior, confidence strictly increases with attempts, `s_eff` → `score` as n grows.

The adaptive layer then consumes `overallLevel` + per-competency confidence via `buildSkillContextPack` — one source of truth, no new tables.

## 7. State design (no migration required)

- Per-user arc: computed server-side in `session/start` via `mergeArc(difficulty, overrides, guidance)`. **Do NOT load full `HatchUserContext` in `start`** (it is intentionally thin, `maxDuration = 15`, per the Vercel 60s provisioning split — Codex finding 6): add a lightweight `loadGuidanceInputs(userId)` that selects only `learner_competencies(competency, score, total_attempts)`, the profile's archetype/calibration fields, and the prior CC completion count. The computed arc is persisted per-session (see §5) and `current`/`state` return it on reconnect.
- Guidance level: included in the `session/start` response and in the interpret/nudge request bodies (Hatch-awareness rule: the coach skill prompt documents what each level means).
- Branch log: client state → merged into `final_artifact.adaptive` at finalize. `final_artifact` is already jsonb.
- Competency updates: existing `learner_competencies` columns; confidence is derived, never stored.

## 8. The adaptation contract (reusable pattern)

New module `src/lib/adaptive/` exports the medium-agnostic core:

```
deriveGuidanceLevel(ctx: HatchUserContext, mediumHistory: {attempts, evidence}): GuidanceLevel
adjustGuidance(current, signals: InSessionSignals): GuidanceLevel   // bounded ±1
type AdaptationEffects = { promptDensity, teachingNotesVisible, nudgeEagerness, coachRegister }
effectsFor(level: GuidanceLevel): AdaptationEffects
```

Each medium then supplies its own arc/branch logic (CC: `arcForLearner` + `planBranch`; later: flow_stepper hint ladders, monaco retry-with-less-help, canvas requirement ambiguity). The contract is: **signals in → guidance level → declarative effects; the medium renders effects; every adaptive decision is logged into the attempt artifact so grading and mirrors can narrate it.** Follow-up Linear issues (Phase C) specify per-medium adoption.

## 9. Rollout & risk

- Default guidance is `guided` = today's behavior; regression surface is opt-in by level.
- `interpret`/nudge/suggest-prompts receive `guidanceLevel` — added to each route's zod request schema explicitly (zod strips unknown fields, so schema changes are mandatory, not optional — Codex finding 7); missing field falls back to `guided` (old clients safe).
- No schema change in B0–B3; the only DB writes are existing tables via existing paths.
- E2E (real sandboxes) covers: beginner vs advanced arcs differ; retry-heavy path surfaces a scaffold step; teardown after every session.

## Codex review

**Verdict: APPROVE-WITH-CHANGES** (codex-cli 0.135.0, read-only, 2026-07-04 ~03:30). Seven findings, all incorporated above:
1. (High) Persist planned/adaptive arc live for resume — §5 Persistence, §7.
2. (High) Calibration data contract: `total_attempts` not selected today; real archetype names; analyst_v1 dims are 0|0.5|1 — §6.3.
3. (High) Finalize merge semantics `{ ...gradeResult.final_artifact, adaptive }` + pass adaptive log to grader — §5.
4. (Medium) Guidance adjustment as explicit state machine; `partial` breaks streaks; mcp_setup auto-complete excluded; net movement cap — §3.2.
5. (Medium) Difficulty decides step set, guidance decides presentation; overrides disable open-mode compression — §4.
6. (Medium) Lightweight `loadGuidanceInputs` instead of full HatchUserContext in `start` — §7.
7. (Medium) Update SubProblemStepper kind maps + zod schemas for guidanceLevel; never touch ClaudeCodeTerminalProps — §4, §9.

Codex: "No blocker to the overall direction."
