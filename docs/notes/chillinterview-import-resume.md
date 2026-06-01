# chillinterview import — resume guide

Pipeline that scrapes chillinterview.com, transforms content (nothing verbatim), and imports it as HackProduct challenges. Coding questions, system-design guides, and interview "experiences" (those naming a concrete question) are all converted.

## What's already shipped (live in Supabase)

221 unique challenges, all `is_real_interview = true`, domain-classified, deduped:

| Type | Count | Source |
|---|---|---|
| algorithm | 122 | 32 free coding questions + 90 from experiences |
| system_design (canvas) | 82 | 16 guides + 66 from experiences |
| data_modeling (canvas) | 11 | from experiences |
| flow (4-step product-sense) | 6 | from experiences |

Experience-derived challenges carry `metadata.is_expanded = true` and `metadata.source_fidelity = 'expanded'` (body authored from a thin question mention, not quoted). All `company_tags` are lowercase slugs.

## What remains

**253 more algorithm challenges** from experiences are detected, deduped, and briefed but NOT yet authored. They live in `seeds/chillinterview/exp-author/algorithm.json` (343 total briefs; author_idx 0-89 are done, 90-342 remain). This dir is gitignored (scratch).

If the scratch seeds were cleared, re-run the scrape + detection (steps 1-3 below) to regenerate them.

## How to resume the remaining algorithm authoring

1. Confirm briefs exist: `seeds/chillinterview/exp-author/algorithm.json` should have 343 entries; `seeds/chillinterview/exp-algo-out/` has the 90 already authored (0-89).
2. Dispatch Opus sub-agents over the remaining `author_idx` 90-342 in batches of ~30. Each agent reads `exp-author/algorithm.json`, writes `seeds/chillinterview/exp-algo-out/{author_idx}.json` with this shape:
   `{ key, title, rewritten_statement (## Examples), starter_code{python,javascript}, reference_solution{python,javascript}, test_cases[>=5, >=2 hidden], reference_approach }`.
   Rules: transform-not-copy (re-skin scenario, keep algorithm; if the summary names a LeetCode problem, rebuild THAT problem). Function name `solution`, same args in both languages. The agent MUST execute its solutions (python3 + node) against every test case under exact `JSON.stringify` comparison before writing. Voice rules: no em dashes, no AI slop, no "you are a [role]".
3. Build + verify + commit:
   ```bash
   npx tsx scripts/build-staged-exp-algo.ts            # merges agent-out -> staged
   # independent JS verify (production grader path):
   node -e '<JS harness that runs each reference_solution.javascript vs test_cases, see git history>'
   # approve new chillinterview:exp: entries (set approved:true), then:
   npx tsx --env-file=.env.local scripts/commit-interview-seeds.ts --source chillinterview
   npx tsx --env-file=.env.local scripts/classify-domains.ts --write
   ```
   The commit script dedups by `source_url` (chunked IN query) so re-runs are safe.

## Full pipeline reference (scripts)

- `scripts/scrape-chillinterview.ts` — scrape via public JSON APIs. `--type coding|experiences|system-design`, `--free-only` (coding catalog), `--resume`, `--shard i/n`. Experiences rate-limit hard: runs at concurrency 1, checkpoints every 25. Coding free-only yields 32; experiences ~955 of 983.
- `scripts/normalize-chillinterview.ts` — coding rows → `seeds/scraped-raw.json` (ScrapedEntry).
- `scripts/lib/chillinterview-map.ts` — company/tag → canonical taxonomy slugs.
- `scripts/prep-experience-briefs.ts` → `exp-briefs.json`; `build-experience-keepers.ts` → `experience-questions.json` (after detection agents write `exp-detect-out/`).
- `scripts/prep-system-design-briefs.ts` + `build-staged-sd-from-agent.ts` — the 16 guide-SD path.
- `scripts/build-staged-from-agent.ts` — free-coding algorithm path (reads `agent-out/` + `scraped-raw.json`).
- `scripts/build-staged-exp-algo.ts` — experience algorithm path (reads `exp-algo-out/` + `exp-author/algorithm.json`).
- `scripts/build-staged-exp-canvas.ts --type system_design|data_modeling` — experience canvas path.
- `scripts/commit-flow-from-agent.ts` — FLOW path (inserts challenges + flow_steps + step_questions + flow_options; the generic commit script can't do FLOW).
- `scripts/commit-interview-seeds.ts --source chillinterview` — commits algorithm/system_design/data_modeling staged entries (metadata-only for canvas; writes slug/company_tags/topic_tags/is_real_interview/source_url; dedups by source_url, chunked).
- `scripts/classify-domains.ts --write` — assigns domain_id.
- `scripts/normalize-company-tags.ts` — one-time data fix: lowercases all company_tags to slugs (already run).

## Detection routing

Experiences are kept only if they name a concrete, reconstructable question (~79% of judged). Routed by questionType + extracted text: Coding → algorithm, System Design → system_design, schema/SQL → data_modeling, product-sense → flow.

## Bug fixed this session

Company filter showed wrong/zero counts: `getChallenges` in `src/lib/data/challenges.ts` queried `company_tags` with the raw display label (e.g. "Meta") but data is lowercase slugs. Fixed to slugify the filter value; also normalized all existing `company_tags` to slugs. Verified live (Meta 0→129, Google 8→131).
