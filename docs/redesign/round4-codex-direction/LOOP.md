# Stage B Loop — Full Redesign Implementation Charter

Durable state for the autonomous redesign loop. Every iteration READS this first, works, then APPENDS to the Iteration Log. The founder's commission (2026-07-11):

> Feature parity with main. No stubbed buttons/elements, no mock data anywhere. Everything functional and tested. Hatch contextual and excellent across the app. All Hatch assets generated via Codex as real images — no SVG Hatch anywhere. Every challenge type works without errors. Sonnet/Opus build; Fable guides, reviews, unblocks, grounds.

## Hard requirements (acceptance = ALL true)
1. **Parity**: every route, button, and flow that works on `main` works in the redesign (PARITY.md is the checklist; generated from main, checked off with evidence).
2. **No stubs**: zero dead buttons, `href="#"`, empty onClick, disabled-without-reason, TODO-rendered UI.
3. **No mock data**: no `MOCK_*` constants rendered, `IS_MOCK` stays false-path, every number/list from real loaders.
4. **Hatch excellence**: every surface passes its state to Hatch endpoints (CLAUDE.md Hatch-awareness checklist); chat copy contextual per surface; graders aware. Probe test per surface: ask Hatch something answerable only from the new state.
5. **Hatch imagery**: ALL Hatch renders are real images from `public/hatch/v2/` (Codex/gpt-image-1 generated, consistent character). `HatchGlyph` SVG is fully retired from rendered UI (founder override of the old CLAUDE.md rule — documented here). A `<HatchImage state=... />` component maps the old states to images.
6. **Challenge types green**: flow, algorithm, sql, system_design, data_modeling, quick_take, cc_analytics (+ labs) each pass start → work → submit → grade → feedback E2E, on pro AND free accounts.
7. **Design law**: spec.md §1–§9 + writing-style-guide are binding on every built screen; approved previews in `previews/round4/` are the visual source of truth.

## Operating protocol
- **Fable (main loop)**: plans each iteration, dispatches, reviews diffs/proofs against spec+previews, unblocks stuck agents, grounds decisions, updates this file. Writes code only to unblock.
- **Sonnet agents**: all implementation (workflows/teams, one scoped task each).
- **Opus agent**: orchestrates multi-file phases when a team needs a standing reviewer.
- **Haiku agents**: Playwright visual probes + E2E walks.
- **Codex (gpt-image-1 via scripts/imagegen)**: all Hatch asset generation.
- Verification gates per iteration: `npx tsc --noEmit` clean → `npm run build` green → affected pages screenshot-compared to previews → no-stub grep → Hatch probe on touched surfaces. A phase is DONE only with evidence in the log.
- Commits: one per phase on `feature/redesign-options`, descriptive message, **no co-author lines**. Never commit .env*, never touch prod data destructively; test accounts per CLAUDE.md; delete throwaway accounts after E2E.

## Phases
- [ ] **B0. Hatch asset system** — character sheet + 12 poses via gpt-image-1 (transparent PNG → public/hatch/v2/), `<HatchImage>` component with state map, retire HatchGlyph renders app-wide.
- [ ] **B1. Foundation** — tokens (§spec palette: forest scale, sticky notes, highlighter) into globals.css additively; primitives: AppSidebar, TopUtilityBar, HatchSays, StatStrip, ProgressRing, FlowStepper, DisciplineTile, NoteCard, InkMark; icon usage = lucide-react per §9.
- [ ] **B2. Shell swap** — (app)/layout.tsx sidebar + top utility bar; BottomTabs mobile; marketing/admin untouched.
- [ ] **B3. Dashboard** (+ day-0 and pro states per previews).
- [ ] **B4. Practice catalog** (explore+challenges merged; filters live).
- [ ] **B5. Workspaces** — FLOW, coding, canvas overlay (system design + data modeling), per previews; graders untouched.
- [ ] **B6. Feedback/debrief** + grading interstitial.
- [ ] **B7. Interviews** — hub + live room + loops; mic-optional preserved.
- [ ] **B8. Progress** + history + profile.
- [ ] **B9. Library** — study plans hub/detail, autopsies hub/reader, guides hub/chapter reader.
- [ ] **B10. Onboarding + settings/billing + in-app pricing** (real plan_limits/Stripe values).
- [ ] **B11. Marketing home** (live V3TryRep demo slot).
- [ ] **B12. Hatch contextuality sweep** — per-surface state→endpoint audit + probes.
- [ ] **B13. Challenge-type parity matrix** — 7+ types × (pro, free) E2E green.
- [ ] **B14. Full parity audit** — PARITY.md 100% evidenced; no-stub/no-mock sweeps; final build+lint+tsc; visual QA 375/768/1440; PostHog events firing.

## Key paths
Worktree: `/Users/sandeep/Projects/myproductschool/.worktrees/redesign-options` (branch `feature/redesign-options`). Spec: `docs/redesign/round4-codex-direction/spec.md`. Previews: `docs/redesign/previews/round4/`. Icons kit: `round4-codex-direction/icons.html`. Parity: `round4-codex-direction/PARITY.md`. Asset gen: `round4-codex-direction/generate-hatch-assets.mjs`.

## Iteration Log
(append: date · iteration # · dispatched · landed · evidence · next)

### 2026-07-11 · Iteration 1 (kickoff)
- Dispatched: [A] Hatch asset gen — 12 poses via gpt-image-1 → public/hatch/v2/ (background). [B] B1 foundation workflow — globals.css tokens (additive), src/components/redesign/ primitives (AppSidebar, TopUtilityBar, HatchSays, StatStrip, ProgressRing, FlowStepper, DisciplineTile, NoteCard, InkMark), HatchImage w/ v2→static fallback chain. [C] Parity inventory agent reading MAIN → PARITY.md (acceptance contract).
- Also landed before kickoff: all 15 approved previews final (incl. canvas overlay + day-0 + pro variants); spec.md §1–§9 complete; icons.html canonical kit.
- Next on wake: review B1 diffs vs spec, verify tsc, check asset gen quality (character consistency), review PARITY.md completeness, then dispatch B2 (shell swap) + B3 (dashboard) with sonnet team.

### 2026-07-11 ~00:50 · Iteration 1 results + limit event
- LANDED: [A] Hatch assets 12/12 generated → public/hatch/v2/ (wave, idle, listening, reviewing, speaking, celebrating, thinking, reading, writing, presenting, pointing, avatar — ~1.5MB each, OPTIMIZE LATER: compress/resize before shipping). [B] B1 effectively complete despite one builder dying on session limits: all 10 primitives in src/components/redesign/ + globals.css +88 lines tokens. tsc = 0 errors. [C] Parity agent DIED on session limit before writing PARITY.md — MUST RE-RUN first thing next iteration.
- LIMIT EVENT: Claude session limit hit ~00:45, resets 1:50am CT. Resurrection cron active: hourly at :52 (job de1bf77c, session-only — terminal must stay open), guarded against duplicate loop instances (25-min freshness check) and self-deletes when loop completes. In-session wakeup for 01:13 will fire during the limit window: it must NO-OP (limits active) per this note.
- NEXT ITERATION (first post-reset): (1) re-dispatch parity inventory agent → PARITY.md; (2) Fable spec-review of B1 primitives + tokens (diff vs previews); (3) image-optimize hatch/v2 (sharp/squoosh to ~150-250KB, keep originals in round4-codex-direction/hatch-src/); (4) dispatch B2 shell swap + B3 dashboard (sonnet team, opus orchestrator per CLAUDE.md team pattern); (5) commit B0+B1 as phase commits (no co-author lines).

### 2026-07-11 ~01:55 · Iteration 2 (post-reset kickoff, founder-triggered)
- Fable review: B1 PASSED (HatchImage exports HATCH_STATE_MAP w/ v2→static fallback; 46 token additions verified; tsc 0). Hatch v2 images optimized 1.5MB→41-51KB each (sharp, 512px palette PNG); 18MB originals in hatch-src/ (gitignored).
- COMMITTED: 414ff79c docs(redesign) round-4 system · e8f63c94 B0 assets+HatchImage · 9b001c5d B1 tokens+primitives · 27688637 P0-P5 funnel work. Tree clean. Secret scans passed.
- DISPATCHED: [C-retry] parity inventory agent → PARITY.md (sonnet). [B2] shell swap in (app)/layout.tsx (AppSidebar+TopUtilityBar, providers/tours/mobile preserved) → [B3] dashboard rebuild on existing loaders w/ day-0 + pro states → [gate] tsc/build/authed-curl/no-stub verification, sequenced in one workflow.
- Next on wake: review gate report; if green → commit B2+B3, dispatch B4 (catalog) + B9 (library) in parallel; if red → unblock. Then B5 workspaces (biggest phase — needs opus orchestrator).

### 2026-07-11 ~02:05 · Grounding correction (parity agent finding)
- The PRIMARY checkout (/Users/sandeep/Projects/myproductschool) is on fix/cc-reap-health-alert, NOT main — 242 files stale vs origin/main. Parity target is ORIGIN/MAIN (byte-identical stand-in: .worktrees/adaptive-workspaces). Parity agent self-corrected and is re-researching against it; PARITY.md must cover the adaptive-workspaces additions (labs registry, claude_code_debugging challenge type, feedback design system, canvasTour).
- OUR branch check: feature/redesign-options is only 5 commits behind origin/main (833 ins / 20 files: cc cold-start UX PR#19, sentry PR#18, migration, tests — no redesign-surface overlap) and already contains the adaptive-workspaces merge. REQUIRED STEP after B2/B3 commit: `git merge origin/main` + resolve + re-verify gates. Challenge-type matrix (B13) must include claude_code_debugging lab.

### 2026-07-11 ~08:55 · Iteration 3 (cron-resumed)
- LANDED + VERIFIED: B2 shell swap + B3 dashboard — ALL GATES GREEN (tsc 0; build pass; authed /dashboard 200 with all 5 sidebar nav items; 'Calibrate to personalize FLOW' absent; no-stub grep clean across 20 changed files). Committed 2369ccb3. origin/main merged (d12b97ef, no conflicts, tsc 0 post-merge) — branch now current. Phases B0 ✓ B1 ✓ B2 ✓ B3 ✓ (visual probe vs preview queued in current gate).
- PARITY.md STILL MISSING — parity agent resumed via SendMessage with a write-now-improve-later directive (its research: 142 pages, 194 APIs, 9 challenge types incl. claude_code_debugging).
- DISPATCHED: B4 catalog + B9a-f library (plans hub/detail, autopsies hub/reader, guides hub/chapter reader) — 7 sonnet builders + a gate agent (tsc/build/authed curls/Playwright screenshots vs previews/no-stub/no-HatchGlyph/no-MOCK greps) in one workflow (wf_50d4c968-704).
- Next on wake: review B4/B9 gate + visual mismatch report; commit if green; confirm PARITY.md landed; then dispatch B5 workspaces (opus orchestrator — biggest phase) + B6 feedback, and B7 interviews + B8 progress as the following wave.

### 2026-07-11 · Iteration 4 (new session — previous Claude process exited mid-wave)
- Process exit killed the B4/B9 workflow mid-run + both safety nets (session-scoped). Durable state held: 6/7 builders had landed edits (catalog, plans hub+detail, autopsies hub+reader client, guides hub) with tsc 0; chapter reader (B9f) + verification gate unfinished.
- RESUMED workflow wf_50d4c968-704 from cache (completed builders replay; B9f + gate re-run). Re-armed resurrection cron (7d3e089b, hourly :52) — reminder: cron/wakeups are session-only; if the terminal closes, reopen and say "resume work".
- Next on wake: review resumed gate (tsc/build/authed curls/Playwright vs previews/no-stub/no-HatchGlyph greps), commit B4+B9 if green, then dispatch B5 workspaces (opus orchestrator) + B6 feedback.

### 2026-07-11 ~12:20 · Iteration 5 (gate review + build fix + visual-fix wave)
- Gate wf_50d4c968-704 completed: tsc PASS, auth+5 routes 200 PASS, no-stub PASS, redesign files clean of HatchGlyph/MOCK. BUILD FAIL — AutopsyReaderClient (client) imported getChallengeById → supabase/server. Fable fixed: new server helper src/lib/autopsies/practice-links.ts (resolvePracticeCards), practiceCards now a prop from the 3 server mount points. Build GREEN after fix.
- Playwright diff found real B9 quality gaps: /explore/autopsies SEVERELY broken (collapsed ~264px column, flat 90-row list, no shell/hero); /explore/plans missing dark hero + Hatch + continue-plan card; /explore/modules dumping 50+ raw chapter cards, no hero, no curation; TopUtilityBar chips wrong shape + name fallback "You"; dashboard hero missing mascot art. Cookie banner overlap = pre-existing product behavior, not a defect.
- COMMITTED c3f4de3d (B4+B9 first pass + build fix + gate screenshots — durability commit; secret-scan of committed HTML clean).
- DISPATCHED wf_d167b44e-b8e: 4 sonnet fix builders (autopsies-hub rebuild, plans-hub hero/resume, guides-hub curation — letter-tiles explicitly banned per §8, topbar pills + dashboard hero mascot) + full gate re-run (tsc/build/authed curls/Playwright re-diff/greps).
- FOLLOW-UP noted: AutopsyReaderClient uses content-semantic raw hex tints (reader section palettes per approved preview) — extract to tokens later, non-blocking.
- Next on wake: review wf_d167b44e-b8e gate; commit B4+B9 final if structurally matching previews; then dispatch B5 workspaces (opus orchestrator, biggest phase) + B6 feedback/debrief.

### 2026-07-11 ~12:45 · Iteration 5b (fix-wave gate reviewed, polish wave dispatched)
- wf_d167b44e-b8e gate: tsc PASS, build PASS, 5/5 authed routes 200, greps PASS. Visual: dashboard + guides-hub CLOSE MATCH; remaining structural gaps = missing dark heroes on 3 library hubs, missing bottom Pro tip strips platform-wide, missing Featured Practice grid + dropdown filters on /explore, dashboard hero composition (Daily Focus card + mascot right), This week focus-area chips.
- Fable precedence rulings recorded (spec postdates previews): letter avatars/initial tiles stay BANNED even where previews show them; match-% bars stay banned (reason text is correct); Claude Code Lab card stays (parity content); tabs/dropdowns must be backed by real data — comps never justify stubs.
- DISPATCHED wf_a107da2a-8a8 (polish): [A] hub heroes + shared ProTipStrip + autopsies card treatments, [B] explore Featured Practice grid + wired dropdown filters + data-backed tabs, [C] dashboard hero composition + focus-area chips + bookmark-only-if-backend, then full gate re-run with intentional-deviation list.
- Next on wake: review polish gate; if structurally matching → commit B4+B9 FINAL, mark phases done, dispatch B5 workspaces (opus orchestrator: FLOW/coding/canvas-overlay chrome per flow-workspace.html + canvas-workspace.html previews, graders untouched) + B6 feedback/debrief (feedback-debrief.html preview).
