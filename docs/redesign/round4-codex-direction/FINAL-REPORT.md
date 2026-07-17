# Stage B Redesign — Final Report to the Founder

**Branch:** `feature/redesign-options` (worktree `.worktrees/redesign-options`) · 19 commits ahead of `origin/main` · 326 files, +35,075 / −7,522
**Commission (2026-07-11):** feature parity with main, no stubs, no mock data, everything functional and tested, Hatch contextual and excellent across the app, all Hatch assets as real generated images (no SVG Hatch), every challenge type working. Sonnet/Opus built; Fable guided, reviewed, unblocked, grounded.

**Status: all 15 phases (B0–B14) complete with evidence.** The branch is merge-ready pending your visual sign-off and the caveats below.

## What shipped, phase by phase

- **B0 Hatch assets** — 12 character-consistent poses generated via gpt-image-1 (wave, idle, listening, reviewing, speaking, celebrating, thinking, reading, writing, presenting, pointing, avatar), optimized to 41–51KB each in `public/hatch/v2/`. `<HatchImage>` maps the old HatchGlyph states to images with a fallback chain.
- **B1 Foundation** — deep-forest/sticky-note/discipline/highlighter tokens added to `globals.css` (additive; Terra untouched); 10 shared primitives in `src/components/redesign/` (AppSidebar, TopUtilityBar, HatchSays, StatStrip, ProgressRing, FlowStepper, DisciplineTile, NoteCard, InkMark, ProTipStrip).
- **B2 Shell** — left sidebar + top utility bar replace TopNav on desktop app routes; BottomTabs on mobile **and now tablet** (was a nav dead-zone at 768–1023); providers/tours/widgets preserved.
- **B3 Dashboard** — dark dense hero (resume-first Daily Focus + weekly ring + HatchSays + mascot), KPI strip with real week-over-week trends, Picked-for-you row (reason text, not match-%), Today's path with working per-step actions, This week focus areas, Peers, FLOW rail, **Quick Take card wired to the real grading API** (was unreachable in UI), day-0 and pro states per previews.
- **B4 Practice catalog** — merged explore/practice: dark hero with real weekly-goal/weakest-move lead, discipline tabs with live counts, wired dropdown filters, Featured Practice grid, four content shelves — all real loaders.
- **B5 Workspaces** — FLOW, coding (Monaco/Judge0), and canvas (Excalidraw for system design + data modeling) chrome restyled; grading, submission, autosave, and interpret payloads byte-compatible (verified by read-only audit vs main).
- **B6 Feedback/debrief** — score-ring hero, FLOW breakdown, recommended-next-rep, grading interstitial with Hatch reviewing pose; all numbers from real grade data.
- **B7 Interviews** — hub (setup form, prep-check ring, recent sessions) + live room chrome; mic-optional chat path co-equal; tour anchors preserved. **Bonus fix:** Hatch's raw grading-signal JSON no longer leaks into the chat transcript (stripped on all render paths and server-side, signals persisted for the FLOW HUD).
- **B8 Progress** — dark hero + readiness ring, KPI strip, FLOW moves / competency radar / heatmap, reasoning-trajectory matrix, Hatch reflection footer.
- **B9 Library** — study plans hub/detail, autopsies hub/reader, guides hub/chapter reader, each with the approved compact dark hero + HatchSays + mascot; autopsy company accents render as text labels (letter-mark tiles are banned and gone).
- **B10 Onboarding/settings/billing** — restyled first-run quick-start (behavior unchanged), settings with loading-safe plan card, unified PaywallModal with **live plan_limits** (paywall numbers verified against `/api/billing/limits` on the free account; pro account sees zero upsell on app surfaces).
- **B11 Marketing home** — serif hero with the **live V3TryRep demo** (typed into it during the gate; it grades), deep-forest pricing band with real prices/limits; static Hatch images only.
- **B12 Hatch contextuality** — read-only audit vs main: all 7 surfaces' payloads INTACT (server-side context builders zero-diff); the FLOW rail "Hatch's read" now receives live nudges instead of permanently showing its static fallback; maximized coding chat regained multi-part context.
- **B13 Challenge-type matrix** — pro AND free accounts: flow, algorithm (Judge0), sql (sql.js), system_design, data_modeling, quick_take all PASS E2E; cc_analytics free-tier paywall GATED-OK, pro entry renders; claude_code_debugging admin render + non-admin locked redirect both correct.
- **B14 Parity audit** — 194/194 API route files identical to main (proxy zero-diff); 132 URL checks across all PARITY.md page rows (122×200, 10 expected redirects, 1 ruled exclusion, 12 GET-unverifiable noted); no-stub/no-mock sweep clean across the 290-file diff; visual QA 10 routes × 375/768/1440 all green after fixes; PostHog pageviews + challenge events fire, and autopsy tracking was **restored** in the new readers (it existed only in the legacy reader — the article-resume cron would have starved); tsc clean, production build green.

## HatchGlyph retirement
Zero rendered HatchGlyph SVGs remain outside the Shepherd tour engine internals (50 files swept; DOM-verified across dashboard, explore, workspaces, settings, marketing). The old CLAUDE.md "never replace HatchGlyph" rule is superseded by your commission — documented in LOOP.md.

## Caveats and judgment calls you should know about
1. **`/challenges/orientation` intentionally not restored** — main's page renders `MOCK_ORIENTATION_CHALLENGE` with HatchGlyph (violates two commission rules), has zero inbound links, and is superseded by `/first-run`. Recorded in PARITY.md.
2. **cc_analytics real provisioning untested locally** — dev defaults to the WebSocket stub (`USE_DEV_STUB`); no sandbox sessions were created (nothing to reap). The provisioning code path is unchanged by the redesign; verify once on a preview deploy.
3. **402→fall-open on coding/interview submit** — grading now falls open to a correctness/neutral fallback on plan-limit/AI-budget errors instead of stranding the attempt with a 402. This matches the completion-crisis fix pattern from the P0–P5 funnel work on this branch; flagged in PARITY.md in case you want the paywall modal on submit instead.
4. **Attempt-creation double-fire** — dev StrictMode creates two `in_progress` attempts on workspace open and resume can land on the ungraded twin. Likely dev-only, but worth an idempotency guard (unique upsert on user+challenge in_progress) before prod.
5. **`/pricing` is session-unaware** (pre-existing on main): a logged-in Pro user sees "Start Pro trial" CTAs. Recommend a session read post-merge.
6. **Lint**: repo is lint-red on main already; this branch adds no new logic-lint errors (the 3 react-hooks/refs hits are identical on main). The jsx-a11y backlog (108 errors repo-wide) is a good post-merge cleanup batch.
7. **Known dev-server noise** in gate logs: Excalidraw esm.sh font 403s, memory-threshold auto-restarts — environmental, not product bugs.
8. **Test-account state**: matrix runs left a handful of legitimate in-progress/completed attempts and small XP on both test accounts; no throwaway accounts were created. Free account has 14/20 challenge starts remaining this window.

## Recommended next steps
1. Walk the app yourself on the branch (`PORT=3110 npm run dev` in the worktree) — dashboard → explore → a FLOW rep → feedback → an interview → progress.
2. Decide on caveats #3 (fall-open grading) and #5 (pricing session-awareness).
3. Merge via PR to main; deploy to a Vercel preview first to check cc_analytics provisioning (caveat #2) and run `verify-prod-stripe-config.ts` unchanged-ness.
4. Post-merge batches: jsx-a11y cleanup, attempt idempotency guard, `/pricing` session read.

## Where everything lives
- Loop charter + full iteration log: `docs/redesign/round4-codex-direction/LOOP.md`
- Acceptance contract with evidence: `docs/redesign/round4-codex-direction/PARITY.md`
- Design law: `docs/redesign/round4-codex-direction/spec.md` (§1–§9, incl. in-flight founder rulings)
- Approved previews: `docs/redesign/previews/round4/` · Live-state screenshots: `docs/redesign/screenshots/stage-b/` (+ `qa/` for 375/768/1440)
