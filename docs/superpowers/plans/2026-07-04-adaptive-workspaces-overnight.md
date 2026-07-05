# Overnight Mission Brief: Adaptive Workspaces (2026-07-04)

Autonomous overnight `/loop` brief. Re-read this file at the start of every iteration, then read the checkpoint at the bottom of `docs/notes/overnight-adaptive-2026-07-04.md` (create it if missing) and continue from there.

## Product direction (why)

HackProduct should feel like an AI-native career simulator, not a static course. Challenge surfaces should be dynamic, adaptive, alive — "guided freedom": enough structure to teach, enough freedom to feel like a real environment. Flagship: the AI Analyst lab (Claude Code + BigQuery) should feel like a live analyst workspace, not a SQL worksheet. The key product feeling: "I'm inside a real AI-powered analyst environment. The product is guiding me, but not limiting me."

## Architectural ground truth (verified 2026-07-04)

- Learner-level inference EXISTS but no challenge surface consumes it: `src/lib/hatch-context.ts` (`overallLevel` Beginner→Expert, `weakestCompetency`, `moveLevels`), packaged by `buildSkillContextPack` in `src/lib/hatch/skill-context.ts`.
- CC lab arc is static per difficulty: `DEFAULT_ANALYTICS_ARC` + `arcForDifficulty()` + `mergeArc()` in `src/components/v2/mediums/analyticsArc.ts`. No per-user or in-session branching.
- Insertion seams: `sub_problems` payload in `src/app/api/claude-code/session/start/route.ts` (compute per-user server-side); `buildSkillContextPack` → thread level into `api/hatch/canvas/interpret`, nudges, `SuggestedPromptRail`; verdict handler `handleMark` in `src/components/v2/mediums/ClaudeCodeAnalyticsMedium.tsx` (pass/partial/retry).
- Calibration today: one-time quiz seeds `learner_competencies` at baseline 50 (`src/lib/v2/skills/competency-updater.ts`, `src/lib/calibration/`); `overallLevel` never updates from in-session behavior.
- Grading: `src/lib/coding-grading/analytics-grader.ts` (analyst_v1, 7 dimensions) writes `challenge_attempts` + `claude_code_sessions.final_artifact` via `finalize/route.ts`.
- E2E harness: `e2e/helpers.ts` (`createTestUser`, `loginAs`), Playwright baseURL localhost:3002, no auto webServer. No CC-session spec exists yet.
- `ClaudeCodeTerminal` props contract is FROZEN (`src/components/v2/mediums/types.ts`).

## Phases

### Phase A — Design doc + Codex review (first 1–2 iterations)

Write `docs/superpowers/specs/2026-07-04-adaptive-workspaces-design.md` answering, concretely against real files:

- Structured vs open-ended map for the CC lab (mission/milestones = structure; terminal + Hatch + branching = freedom).
- Adaptation signal model: inputs (`overallLevel`, `weakestCompetency`, calibration archetype; in-session: verdict history, retries, idle time, spend/pace, marked-finding quality) → guidance levels (scaffolded / guided / open) → surface effects (arc length & step kinds, suggested-prompt density, teaching notes on/off, hint eagerness, follow-up injection).
- In-session branching rules at the `handleMark` verdict seam: fast clean passes → inject harder follow-up; repeated retries → inject scaffold step / schema explainer; strong marked findings → deepen the case.
- Reusable "adaptation contract" other mediums adopt later: signals in → guidance level → surface effects, per medium.
- Calibration measurement model: calibration output is a PRIOR, continuously updated by observed evidence (per-step verdicts, retry counts, marked-finding quality, grader dimension scores, time-to-verdict), with per-competency confidence so low-evidence levels adapt cautiously. Specify the exact update rule for `learner_competencies` / `overallLevel`.
- State design: per-user arc computed server-side in `session/start`; in-session branch state client-side + persisted in `claude_code_sessions.final_artifact`. Prefer no schema change; additive migrations allowed if genuinely needed.

Then dispatch a Codex review (codex:rescue agent, read-only) of the design; incorporate feedback BEFORE writing code; record the Codex verdict in the doc.

### Phase B — Implement the AI Analyst adaptive slice (one increment per iteration, commit each green step)

- **B0 — Calibration measurement:** implement the level-measurement model: calibration as prior; update `learner_competencies` from CC session evidence (verdicts, retries, analyst_v1 dimension scores via `finalize`); per-competency confidence; `HatchUserContext.overallLevel` reflects the posterior. Prefer existing columns + jsonb metadata. Unit tests: monotonicity, bounded steps, cold-start.
- **B1 — Level-aware arc:** thread `HatchUserContext` into `session/start`; replace `arcForDifficulty(difficulty)` with `arcForLearner(difficulty, level)` in `analyticsArc.ts`. Beginners: scaffold steps + teaching notes. Advanced: compressed arc + ambiguity/stakeholder steps. Unit tests.
- **B2 — Level-aware coaching:** pass guidance level through `buildSkillContextPack` into `interpret` (verdicts + chat), nudges, and `SuggestedPromptRail` generation so hint density and coach verbosity titrate by level. Update the `hackproduct-analytics-coach` skill prompt (Hatch-awareness rule: Hatch must know the learner's guidance level and reference it).
- **B3 — In-session branching:** in `handleMark`, on verdict patterns inject/skip steps (bounded: max +2 injected, never below 3 remaining); persist branch decisions into `final_artifact` so the grader and `AnalyticsSessionMirror` can narrate them.
- **B4 — E2E (REAL sandboxes):** new `e2e/cc-analytics-adaptive.spec.ts` using `e2e/helpers.ts`, driving real sessions end-to-end: provision; assert beginner vs advanced test users see different arcs; drive a retry-heavy sequence and assert a scaffold step appears; ALWAYS finalize/teardown in `afterEach` (even on failure) and verify teardown (session status, no lingering `active` rows). If a session fails to tear down twice in a row, stop E2E work and record it as a blocker.

### Phase C — Extract the pattern (only if A+B green and time remains)

Write the adaptation-contract note + create Linear issues (one per medium: flow_stepper, monaco_coding/SQL, excalidraw canvas, live interview) describing how each adopts the pattern, referencing the shipped CC implementation. No breadth code tonight.

### Phase D — Vector database audit + fix (independent; run when the main track is blocked or done)

Verify the embedding/vector layer is used as designed; fix gaps:
- Map every embedding WRITE path (notes embeddings, `embedAndStoreContext` on submit/grading routes — must stay fire-and-forget, awaiting it hangs clients; CC transcript embed in `finalize`) and every READ path (`getHatchContextFromNotes`, any semantic retrieval feeding Hatch context).
- Check: embeddings actually written (row counts, recent timestamps)? Reads actually retrieved AND injected into Hatch prompts? Dimension/model consistency? Orphaned tables/columns? Missing vector indexes?
- Fix with tests; document findings in the notes file. Migrations allowed: additive only.

### Phase E — Fake social-proof sweep (independent, quick — good Sonnet subagent task)

- Grep marketing + app surfaces for fabricated numbers ("X,xxx engineers", "Trusted by", invented counts/testimonials/logos).
- Each instance: remove, or gate behind a real DB metric with a meaningful minimum threshold (render only when N ≥ floor). No hardcoded fake numbers survive the night. List every instance + action in the morning summary.

### Phase F — Visible adaptivity: UI improvements (added by user 2026-07-04 midday; do BEFORE Phase G)

The engine is invisible today. Make the adaptation something the user can see and feel, in the existing surfaces:

- **F1 — Stepper affordances**: injected steps get distinct visual treatment in `SubProblemStepper` (a "regroup" look for scaffold_explainer, a "stretch" badge for stakeholder_tension/metric_definition/injected steps), plus a smooth insertion animation (gsap is already used there) and a Hatch dock line announcing the branch ("Added a regroup step, the last two attempts told me the question got too big"). The product must visibly REACT.
- **F2 — Session Mirror narrates the adaptation**: `AnalyticsSessionMirror` reads `final_artifact.adaptive` and renders a compact "How this session adapted" strip: starting register, movements with triggers, injected steps. Honest narration, HackProduct voice, no internals jargon.
- **F3 — Coaching register indicator**: a subtle chip in the workspace header area showing the register in product language ("Coaching: hands-on" / "balanced" / "peer-level") with a one-line tooltip. NEVER expose internal enum names, model names, or mechanics (Hatch opacity). Also render it in the mirror.
- **Verification**: Playwright visual passes at 375/768/1440 authed (per standing preference), screenshots archived under docs/notes/adaptive-ui/; tsc + unit + the adaptive E2E must stay green. Writing-style rules apply to every user-facing string (no em dashes, no AI slop, no role framing).

### Phase G — Per-medium adoption (SUN-251..254), one issue per increment

Implement in this order, one commit per issue, updating each Linear issue to Done with a closing comment describing what shipped:
- G1 = SUN-251 FLOW stepper (hint ladder, retry-with-less-help)
- G2 = SUN-252 coding/SQL (hint eagerness, coach register, approach comparison for open)
- G3 = SUN-253 canvas (requirement ambiguity for open, readiness strictness, canvas-coach register)
- G4 = SUN-254 live interviews (follow-up difficulty + pacing by register)
Each: thread guidance_level through the medium's request bodies, map effects, log to the attempt artifact, unit tests for pure logic, E2E or Playwright check per surface. Same constraints as Phase B; guided stays the no-change default everywhere.

## Constraints (hard)

1. Work ONLY in `.worktrees/adaptive-workspaces` on branch `feat/adaptive-workspaces`. Never touch main; never push; never deploy.
2. Supabase migrations allowed but careful: additive only; dev+prod SHARE the DB — nothing destructive, nothing that breaks prod paths; call out each migration in the morning summary.
3. Real sandbox sessions allowed (no cap) but ALWAYS torn down after use; verify teardown after each; zero lingering cost by morning.
4. Never call the Anthropic API key directly; use Claude Code subagents. Delegate mechanical work (test writing, grep sweeps, doc drafting, bulk edits) to Sonnet 5 subagents (`model: "sonnet"`); keep design decisions, review, and integration in the main loop.
5. Do not modify the FROZEN `ClaudeCodeTerminal` props contract; `SubProblemStepper` changes must be additive.
6. Verification gate per increment: `npx tsc --noEmit` clean (pre-existing `supabase/functions/` Deno errors acceptable) + `npm run test:unit` + (B4 onward) the new Playwright spec against a dev server you start yourself on port 3002. Commit ONLY on green; one commit per increment; no co-author line in commit messages.
7. Lint: judge by whether the branch ADDS errors (main is already red).
8. No hardcoded limit numbers in user-facing copy; no AI-slop vocabulary; no second-person role framing (see repo CLAUDE.md writing rules).

## Stop rules

- Same failure 3 consecutive iterations → stop that increment, write findings to `docs/notes/overnight-adaptive-2026-07-04.md`, move to the next independent increment (D and E are always available).
- NO time cap (user directive 2026-07-04 ~2:30am): keep looping until the objectives are met — Phases A through E all complete and verified. When everything is done, write the final summary (what shipped, commit list, Codex verdict, migrations applied, sandbox spend + teardown confirmation, vector-DB findings, social-proof instance list, open questions, suggested next steps) to the notes file, send a push notification, and END the loop.

## Checkpoint protocol

At the end of every iteration, update the `## Checkpoint` section at the bottom of `docs/notes/overnight-adaptive-2026-07-04.md` with: timestamp, current phase/increment, what passed verification, what's next, blockers. The next iteration trusts this checkpoint over re-deriving state.
