# Solution walkthroughs — operator runbook

How the platform generates the "official solution" + the interactive **Visual walkthrough**
for a coding challenge, and how to populate them for any new challenge you add. Nothing here
requires you to author a walkthrough by hand: every computed walkthrough is **machine-verified**
against the challenge's own expected output, so you cannot ship one that animates a wrong answer.

Read this alongside the content-authoring pipeline docs
([`content-authoring-architecture.md`](../notes/content-authoring-architecture.md)) — that covers
authoring the *challenge*; this covers its *solution + walkthrough*.

---

## 1. The two artifacts on a challenge

Each challenge can carry, in the `challenge_solutions` table (one row per challenge):

1. **The written solution** (`content`, a `SolutionContentV1`): overview, 1–4 approaches (each with
   prose, code, complexity, tradeoffs), AI-collaboration notes, key takeaways. Rendered by the
   `Solution` and `Code` tabs.
2. **The interactive walkthrough** (`content.walkthrough`, an `InteractiveStepDiagram`): a stepped,
   navigable animation of the algorithm running. Rendered by the `Visual walkthrough` tab.

The solution is written once (AI, prose). The walkthrough is **not authored** — it is grafted onto
the solution by a deterministic harness that runs the challenge's real reference solution.

---

## 2. How a walkthrough is chosen (the graft)

`graftSteppedTrace(content, metadata, tags)` in `src/lib/solutions/trace/graft.ts` is the single
seam. It picks a walkthrough by `challenge_type`, trying harnesses in order, first success wins:

| Type | Harness order |
|---|---|
| `algorithm` | array → grid (DP) → sequence (list/tree) → **generic execution** |
| `sql` | pipeline (CTE chain) → **generic execution** (only if a Python reference exists) |
| `system_design`, `data_modeling` | authored request-flow (from the optimal approach's architecture diagram) |

**The pattern-tracers** (array/grid/sequence/pipeline) recognize a specific algorithm family and
reimplement its canonical form to produce the animation deltas. They only fire when they both
recognize the pattern AND their answer agrees with **every** extractable test case's `expected`.

**The generic execution tracer** (`buildSteppedExecutionFromMetadata`, the ceiling-remover) is the
last fallback. It runs the challenge's **real** `reference_solution` under a Python `sys.settrace`
tracer (`scripts/solutions/trace/generic_tracer.py`) on the visible test cases, reduces the raw
timeline to ≤8 deterministic steps, detects a viz mode from the shape of the locals (matrix / array
/ ribbon / table — callstack is deliberately disabled), and emits the walkthrough. It is **correct
by construction**: the state shown is what the reference actually computed, and it only certifies
when the traced answer matches the challenge's own `expected` on **every** extractable, oracle'd
visible case.

If nothing certifies, the challenge keeps its static diagram. No unverified computed trace ever
ships. `trace_verified: true` on a stored walkthrough means it came from a real execution.

**Eligibility for the generic path is just:** the challenge's `metadata` has a Python
`reference_solution` and at least one `test_cases[]` entry with an `expected`. Almost every
imported coding challenge already has this.

---

## 3. Adding a new challenge — what happens automatically

Coding challenges are committed with `scripts/commit-interview-seeds.ts`. Two things fire per row:

1. **Auto-tagging** (`detectTechniqueTags`, `src/lib/content/auto-tag-technique.ts`): probes the
   verified pattern-detectors and adds a `technique_tag` **only** when adding it genuinely makes a
   pattern-tracer certify the challenge. Additive, conservative — never removes or overwrites.
2. **Eager solution + walkthrough** (`ensureSolutionForChallenge`,
   `src/lib/solutions/ensure-solution.ts`): after insert, generates the written solution (AI) and
   grafts the walkthrough, storing both with `generated_by: 'eager'`. Fire-and-forget.

```bash
# Normal commit — auto-tags + eagerly generates solution & walkthrough:
npx tsx --env-file=.env.local scripts/commit-interview-seeds.ts <staged-file>

# Fast/offline commit (skip eager generation; solution fills in lazily on first view):
npx tsx --env-file=.env.local scripts/commit-interview-seeds.ts <staged-file> --no-solution
```

**Lazy path (the safety net):** if a challenge has no solution yet, the first time a user opens the
Solutions tab, `POST /api/challenges/[id]/solution/generate` runs the same
`ensureSolutionForChallenge` → generate → graft → store core (`generated_by: 'lazy'`). It is atomic
(status-claim dedup), so concurrent opens don't double-generate.

So: **add a challenge the normal way and its solution + verified walkthrough appear on their own** —
eagerly at commit, or lazily on first view. You do not touch the walkthrough by hand.

---

## 4. Manual population (backfill + force)

### Attach walkthroughs to challenges that already have a solution

`scripts/solutions/backfill-walkthroughs.ts` grafts the walkthrough onto **existing ready**
solutions in place (no AI, no prose regen — it only computes and attaches `.walkthrough`).

```bash
# DRY RUN first — always. Prints per-challenge base.kind/steps + a summary, writes nothing:
npx tsx --env-file=.env.local scripts/solutions/backfill-walkthroughs.ts --type algorithm --limit 1000

# Write for real (upserts content back with generated_by='backfill'):
npx tsx --env-file=.env.local scripts/solutions/backfill-walkthroughs.ts --type algorithm --limit 1000 --write

# Other types (SQL is slower — sql.js boots per challenge; run in the background):
npx tsx --env-file=.env.local scripts/solutions/backfill-walkthroughs.ts --type sql --limit 1000 --write
```

Flags: `--type` (comma-separated: `algorithm,sql,system_design,data_modeling`; omit for all),
`--limit N` (per-type cap, default 3 — set high for a full sweep), `--write` (without it = dry run).

### Force a single challenge's solution to (re)generate

```bash
# Regenerate the solution + walkthrough for one challenge (AI prose + graft):
curl -X POST "$APP_URL/api/challenges/<challengeId>/solution/generate"
# or in code: await ensureSolutionForChallenge(challengeId, { force: true })
```

### Regenerate a walkthrough only (no AI) after a harness change

Re-run the backfill with `--write` scoped to the type. It re-grafts the current stored content, so a
tracer/reducer improvement propagates to every eligible challenge without re-billing any AI tokens.

---

## 5. Verifying

- **Unit tests** (all fail-soft, deterministic, machine-verified):
  ```bash
  npx tsx --test tests/lib/solutions/executionReduce.test.ts \
    tests/lib/solutions/executionTrace.test.ts \
    tests/lib/solutions/schema.test.ts \
    tests/lib/solutions/arrayTrace.test.ts tests/lib/solutions/gridTrace.test.ts \
    tests/lib/solutions/sequenceTrace.test.ts tests/lib/solutions/pipelineTrace.test.ts
  ```
- **Dry-run the backfill** and read the `base.kind` split + `Would attach / not grafted` summary
  before any `--write`.
- **In-app:** open a challenge's Solutions tab → `Visual walkthrough`. Step through prev/next; the
  diagram, explanation, and pills must stay in lockstep. If the challenge is ineligible you see the
  static diagram, never a broken animation.

---

## 6. Guarantees & limits (why you can trust this unattended)

- **Never animates a wrong answer.** A computed walkthrough is emitted only when the reference's
  traced answer matches the challenge's own `expected` on **every** extractable visible case. A
  disagreement, a missing oracle, or a non-Python reference means no walkthrough — the static
  diagram stands.
- **Deterministic.** The same challenge always produces the same walkthrough (no wall-clock, no RNG;
  Python set members are sorted before serialization).
- **Fail-soft everywhere.** Any tracer/reduce failure returns null and keeps the static diagram; one
  pathological challenge can never crash a batch.
- **Callstack viz is off** on purpose: a line-event tracer cannot recover true recursion depth, so
  recursive challenges fall to the accurate value-table viz rather than a fabricated depth.
- **Cost.** Pattern-tracers are free (synchronous). The generic tracer spawns one short Python
  subprocess per certified visible case (capped at 5). No AI tokens are used for the walkthrough —
  only for the written solution prose.

---

## 7. Where things live

| Piece | Path |
|---|---|
| Graft seam (chooses the walkthrough) | `src/lib/solutions/trace/graft.ts` |
| Generic execution builder + cross-check | `src/lib/solutions/trace/executionTrace.ts` |
| Trace reducer + viz detection | `src/lib/solutions/trace/executionReduce.ts` |
| Python settrace tracer | `scripts/solutions/trace/generic_tracer.py` (wrapper `genericTrace.ts`) |
| Pattern tracers | `index.ts` (array), `gridTrace.ts`, `sequenceTrace.ts`, `pipelineTrace.ts` |
| Schema (stepped bases) | `src/lib/solutions/schema.ts` |
| Renderers | `src/components/solutions/diagrams/InteractiveStepDiagram.tsx` + `stages/*.tsx` |
| Auto-tag on commit | `src/lib/content/auto-tag-technique.ts` |
| Eager/lazy generate | `src/lib/solutions/ensure-solution.ts` |
| Backfill | `scripts/solutions/backfill-walkthroughs.ts` |
