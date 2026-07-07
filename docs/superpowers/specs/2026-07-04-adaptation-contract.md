# The Adaptation Contract — how every medium becomes adaptive

Extracted from the shipped Claude Code Analytics implementation (feat/adaptive-workspaces, 2026-07-04). This is the reusable pattern; the CC lab is the reference implementation.

## The contract

**Signals in → one guidance level → declarative surface effects → every decision logged into the attempt artifact.**

1. **Signals in.** Pre-session: `deriveGuidanceLevel(loadGuidanceInputs(admin, userId))` from `src/lib/adaptive/guidance.ts` — evidence-confident level (`src/lib/adaptive/confidence.ts`), archetype prior, prior sessions in this medium. In-session: verdict/score events feed the bounded state machine in `src/lib/adaptive/branching.ts` (`applyVerdict`: partial breaks streaks, one net movement per session).
2. **One guidance level.** `scaffolded | guided | open`. `guided` is always the compatibility default: a medium with no signal behaves exactly as it does today.
3. **Declarative effects.** Each medium maps the level to its own surfaces (hint density, teaching copy, coach register, structure shape). The Hatch register is shared: pass `guidance_level` in the interpret/nudge request body (already in the zod schemas) and the coach skill adapts tone.
4. **Logged, always.** Structure changes and level movements persist into the attempt/session artifact (CC: `final_artifact.adaptive` via `PATCH session/[id]/adaptive`) so grading and post-session reviews narrate the real path, and resume reconstructs it.

## Reference implementation (CC Analytics)

| Contract piece | File |
|---|---|
| Level + confidence | `src/lib/adaptive/confidence.ts`, `guidance.ts` |
| Structure shaping | `arcForLearner`/`mergeArc` in `src/components/v2/mediums/analyticsArc.ts` |
| In-session branching | `planBranch`/`applyBranch`/`applyVerdict` in `src/lib/adaptive/branching.ts` |
| Persistence | `src/app/api/claude-code/session/[id]/adaptive/route.ts`; `start`/`current`/`state` return the per-session arc |
| Hatch register | `guidance_level` in interpret/nudge/suggest-prompts + `hackproduct-analytics-coach` skill |
| Evidence loop | analyst_v1 dimensions → `updateCompetencies` in finalize |
| E2E pattern | `e2e/cc-analytics-adaptive.spec.ts` (real sessions, teardown-verified) |

## Per-medium adoption (the Linear issues)

- **flow_stepper**: level → hint ladder (scaffolded: framework_hint visible pre-answer; open: hints on request only), reveal depth, and a retry-with-less-help ladder on wrong answers. Verdict source: per-question correctness already computed deterministically.
- **monaco coding/SQL**: level → conceptual-hint eagerness, test-failure coaching depth, and "compare approaches" unlock for open learners. Verdict source: run/submit results.
- **excalidraw canvas**: level → requirement ambiguity (open gets conflicting stakeholder goals), readiness-meter strictness, canvas-coach register. Verdict source: interpret verdicts already flowing.
- **live interview**: level → interviewer follow-up difficulty and pacing. Verdict source: per-turn grades in interview_grades.

Each issue is: thread the existing `guidance_level` through the medium's request bodies, map effects, log to the attempt artifact, add an E2E case. No new derivation code needed — the `src/lib/adaptive/` core is medium-agnostic.
