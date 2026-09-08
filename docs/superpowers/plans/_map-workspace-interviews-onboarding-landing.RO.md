# Code Map Report

Repo: `/Users/sandeep/Projects/myproductschool` @ `feat/platform-rebuild-20260905`

---

## 1. WORKSPACE

### Shell
**`src/app/(workspace)/layout.tsx`** (55 lines) — client component, wrapped in `<Suspense>`.
- Tree: `HatchProvider` → `SessionProvider` → `div.flex.h-screen` → `TopNav` / (optional `StudyPlanIndexPanel` | `DomainIndexPanel`) / `main` / `BottomTabs` / `FloatingHatch` / `UpgradeModalHost` (L26–43).
- Share routes short-circuit to bare `{children}`: regex `/^\/workspace\/challenges\/[^/]+\/share(?:\/[^/]+)?$/` (L21–23).
- Reads searchParams `from_plan`, `from_domain`, `cid` (L17–19).

**Centred pill nav = `TopNav`, `src/components/shell/TopNav.tsx`** (not a separate component).
- `NAV_ITEMS` (L15–20): `home → /dashboard` (icon `home`), `practice → /challenges` (`track_changes`), `library → /explore` (`menu_book`), `progress → /progress` (`bar_chart`).
- Pill container: `<nav className="flex min-w-0 gap-1 rounded-full border p-1">` (L127–128); items `rounded-full px-2.5 lg:px-4 py-2` (L155). Anchors `data-hatch-target="nav-dashboard"` / `nav-{id}` (L152).
- No fixed `h-*` class; header is `sticky top-0 z-40 w-full max-w-full border-b` (L108–110) with inline style. Measured height ≈67px (per project memory `project_workspace_layout_session_provider`).
- Right side: 8×8 rounded-full icon buttons (L195, L208), upgrade pill (L226), 9×9 avatar (L243).
- `isActive('practice')` matches `/challenges`, `/workspace/challenges`, `/live-interviews` (L79).
- Logout: `supabase.auth.signOut()` → `router.push('/login')` (L62–67). Upgrade: dispatches `open-upgrade-modal` (L70).

### Page / routing
**`src/app/(workspace)/workspace/challenges/[id]/page.tsx`** (243 lines), server component.
- Params `{id}`; searchParams read at L129–133: `role`, `from_plan`, `from_domain`, `returnTo`, `attempt`.
- Auth: `createClient()` + `getUser()`; unauth → `/login?returnTo=...` via `workspaceLocation(id, query)` (L135–137).
- Identity resolution: `resolveChallengeIdentity(id, createAdminClient())` (`src/lib/challenges/resolve.ts`) — accepts number-slug (`sql-2001`), text slug, or raw id. Canonical redirect to slug URL preserving query (L152–154).
- `quick_take` type → redirect `/challenges` (L157).
- Claude-Code labs (`isClaudeCodeLab`) → `AnalyticsWorkspaceClient` after `canAccessLab()` + `getAnalyticsAccess()` gates (L161–208). Columns selected L192: `id, slug, title, prompt_text, difficulty, challenge_type, domain_id, estimated_minutes, is_published, created_at, scenario_context, scenario_trigger, scenario_question`.
- Next-challenge computation: `getNextChallengeInPlan` (L16–74, tables `study_plans`, `study_plan_chapters.challenge_ids/order_index`, `challenge_attempts`, `challenges.slug`) then `getNextChallengeInCategory` (L76–120, `challenges.domain_id`).
- Renders `FlowWorkspaceShellClient` (L227–237) with `challengeId, challengeSlug, initialRoleId (default 'swe'), initialAttemptId, fromPlan, fromDomain, nextChallengeSlug, returnTo`.

**`FlowWorkspaceShellClient.tsx`** (15 lines) — `next/dynamic` with `ssr: false`, skeleton `div.flex-1.bg-surface-container.animate-pulse.rounded-xl`.

**`src/components/v2/FlowWorkspaceShell.tsx`** (52 lines) — `FlowWorkspaceShellProps` (L10–19). Computes `exitHref = workspaceExitHref({fromPlan, fromDomain}, returnTo)` (L23). Renders `<FlowWorkspace mode="api" key={challengeId}:{attemptId ?? 'practice'} …>` + `PaywallModal feature="challenges"` with secondary action "Keep reading this challenge" (L41–48).

**`src/components/v2/FlowWorkspace.tsx`** — 6484 lines, the monolith. Export at L563.

### returnTo & back link
- `sanitizeReturnTo` — `src/lib/navigation/return-to.ts`. `SAFE_RETURN_PREFIXES` = `/autopsies, /challenges, /dashboard, /domains, /explore, /interview-prep, /learn, /live-interviews, /progress, /vocabulary`. Rejects `//`, control chars, `/\`, `javascript:`. Also exports `appendReturnTo(href, returnTo)`.
- `workspaceExitHref` — `src/lib/workspace/breadcrumbs.ts`. Precedence: `returnTo` (must start `/`) → `/explore/plans/{fromPlan}` → `/explore/domains/{fromDomain}` → `/challenges`.
- Back link component: `topChrome` at FlowWorkspace L5306 — `<header className="workspace-focus-header"><button onClick={props.onExit ?? window.history.back} aria-label="Back to practice">← Practice</button><h1>{challengeTitle}</h1></header>`.

### Title row / command row
- `data-testid="workspace-command-row"`, class `workspace-specialist-actions` — FlowWorkspace L5765.
- FLOW stepper strip (L5310–5330): full-width card, label "FLOW Method", renders `<FlowStepper currentStep completedSteps questionIdx questionCount>` from `src/components/v2/FlowStepper.tsx`. `onStepClick={undefined}` — completed steps locked (commit-forward). Suppressed for `isInterviewChallenge`.
- Coding Run/Submit cluster `codingActions` (L5139–5228):
  - Autosave indicator `data-testid="autosave-indicator"` (L5154), `cloud_done` / spinning `progress_activity`.
  - **Run** `data-testid="run-button"` (L5170), `onClick={handleCodingRun}` (defined L2891), kbd `⌘'`, style const `WORKSPACE_BTN_TONAL` (L561).
  - **Submit** `data-testid="submit-button"` (L5211), `onClick={handleCodingSubmit}` (L2926), kbd `⌘⏎`, style `WORKSPACE_BTN_PRIMARY` (L560).
  - **Submit Part** `data-testid="submit-part-button"` (L5191), `onClick={handleSubmitPart}` (L3000) — only when active part `response_type === 'coding_subtask'`.
  - SQL hydration states: `codeRunner.status === 'hydrating'` → "Setting up database…"; `codeRunner.sqlError` → "DB error: …".

### Run / Submit API routes
| Action | Handler (line) | Route |
|---|---|---|
| Run (Judge0) | `handleCodingRun` L2891 → `useCodeRunner` | `POST /api/code/run` (`src/hooks/useCodeRunner.ts` L298, comment "Internal run via Judge0" L277) |
| Coding submit | `handleCodingSubmit` L2926 | `POST /api/challenges/{id}/coding-submit` (L3021, retry L3215); snapshot `POST /api/challenges/{id}/coding-snapshot` L2975 |
| Submit part | `handleSubmitPart` L3000 | `POST /api/challenges/{id}/step/coding/submit` (L4589) |
| Finalize all parts | `data-testid="submit-all-parts-button"` L4703 | `POST /api/challenges/{id}/finalize` (L4710) |
| FLOW step complete | `handleNextStep` L3317 | `POST /api/challenges/{id}/complete` (L3429) |
| Interview submit | `handleInterviewSubmit` L2820 | `POST /api/challenges/{id}/interview-submit` (L2829) |
| Autosave | — | `POST /api/hatch/session/autosave` (L1936, L2019, L2057, L3299) |
| Nudges | — | `/api/hatch/canvas/nudge` (L1693, L1735, L1843, L3123), `/api/hatch/nudge-warmup` (L2391) |
| Canvas coach | — | `POST /api/hatch/canvas/interpret` (L3161) |
| Adaptive | — | `/api/adaptive/guidance` (L1252) |
| Attempts | — | `GET /api/attempts/{attemptId}/grade` (L1043), `GET /api/attempts?challenge_id=&count=1` (L1176) |
| Profile | — | `GET /api/profile` (L3664) |

### Brief pane tabs
- Non-coding: `const tabs = ['Description', 'Solutions', 'Discussions', 'Submissions']` — L3918.
- Coding primary: `codingPrimaryTabs` L3932 = `['Description', …'Examples'?, …'Constraints'?, 'Notes']`; `codingMoreTabs` L3938 = `['Solutions','Discussions','Submissions']`.
- Tab nav render: L5103, `<nav className="workspace-reference-nav" aria-label="Challenge reference">`. Label override: `Description` renders as **"The brief"**. Badges via `workspaceTabBadge(count, active)` (L5114) on `Discussions` (count of `discussions`) and `Submissions` (`submissionBadgeCount`).
- Mobile/floating variant at L5393, `data-testid="floating-tab-strip"` L6080.
- State: `const [leftTab, setLeftTab] = useState<…>` L825.

**Pane sources:**
| Pane | Line | Source |
|---|---|---|
| `descriptionPane` | L3952 | `buildChallengeBrief` (`src/lib/challenges/presentation.ts`) → `challengeBriefSections`; for coding, split by `splitProblemSections` (`src/components/challenge/coding/descriptionTabs.ts`) |
| `examplesPane` | L4768 | `problemSections.examples` (from `## Examples`) |
| `constraintsPane` | L4776 | `problemSections.constraints` (from `## Constraints`) |
| `notesPane` | L4787 | local notes; per-field `data-testid={coding-note-${field.id}}` L4834 |
| `solutionsPane` | L4841 | `<SolutionsPane>` (`src/components/solutions/SolutionsPane.tsx`); loaded `GET /api/challenges/{id}/solution{qs}` L3584, generate `POST /api/challenges/{id}/solution/generate` L3600. Props: `solution, loading, challengeTitle, onRetry, onGoToDescription, activeApproachId, onApproachChange, onSteppedStepChange` |
| `discussionsPane` | L4864 | `GET /api/challenges/{id}/discussions` L3543; upvote `PATCH /api/challenges/{id}/discussions/{id}/upvote` L3723; components `DiscussionThread`, `DiscussionInput`, `ExpertPicksPanel`; splits `is_expert_pick` (L4861–4862); `deriveDiscussionUpvotes` L85 |
| `submissionsPane` | L4948 | `loadWorkspaceHistory` from `src/lib/workspace/submission-history.ts` → `sessionHistory[]` with `{attemptId, gradeLabel, stepResults[{step, score, hatchSignal}]}`; grade fetch `GET /api/attempts/{attemptId}/grade` L1043 |

`descriptionTabs.ts` API: `ProblemSections {description, examples?, constraints?}`, `splitProblemSections(markdown)` (fence-aware; any other `##` heading flows back into Description), `codingDocTabs(sections)`.

### Editor & test cases
- **Editor**: `MonacoCodeEditor` — `src/components/challenge/MonacoCodeEditor.tsx`, imported L52; container `data-testid="monaco-editor-container"` L6163. `LanguageSelector` L53. Change handler `handleEditorChange` L3101; `handleLanguageChange` L3269; paste telemetry `handleCodePaste` L3296 (`{length, percentOfBuffer, timestamp}`).
- **Test cases pane**: `TestCasePanel` — `src/components/challenge/coding/TestCasePanel.tsx` (L57). Test data via `getTestCases` from `useCodeRunner` (L64). Related: `ExpectedOutput.tsx`, `CodeOutputPanel.tsx`, `resultViews.tsx`, `StatusBar.tsx`, `SampleDataPreview.tsx`, `SchemaDiagram.tsx`.
- Answer area anchor: `data-hatch-target="workspace-answer-area"` L6361.
- Parts UI: `data-testid="parts-list"` L4396, `part-card-{id}` L4437, `part-toggle-{id}` L4449, `part-status-{id}` L4492, `finalize-result-card` L4667.

### leftWidth persistence
- State: `const [leftWidth, setLeftWidth] = useState(40)` — L797; `leftCollapsed` L739.
- **localStorage key: `` `flowworkspace:${challengeId}` ``** — read L808, write L893.
- Shape: `{ leftWidth: number, leftCollapsed: boolean, v: 2 }`.
- Migration: if `stored.v === undefined && stored.leftWidth === 30` → `setLeftWidth(35)` (L881).
- Persist effect deps `[challengeId, challengeTypeKnown, leftWidth, leftCollapsed]` (L895) — gated on `challengeTypeKnown` (per memory `project_flowworkspace_leftwidth_race`).
- Divider drag: `handleCodingDividerMouseDown` L1319 (and a sibling at L1293).
- Collapsed rail: width 32px, `data-testid="expand-rail-button"` L5052, rotated label "Parts"/"Prompt".

### "Ask about your code" Hatch button
- Panel component: **`CanvasChatPanel`** — `src/components/challenge/CanvasChatPanel.tsx`, mounted at L5656 (dedicated instance so "Ask Hatch" always has a panel — comment L5650–5651), L6000, L6213.
- **Window event: `open-hatch-workspace`** — listener registered L1610, removed L1611; handler `handleOpenWorkspaceHatch`.
- Collapsed pill shows an unread dot rather than a floating bubble (L1715, L1856).
- Also dispatched: `start-canvas-tour` (L5863), `profile-stats-updated` (L1218, L3423), `challenge-completed` (L3463, detail `{challengeId, fromPlan, fromDomain}`).
- Canvas anchors: `data-tour-target="canvas-surface"` L5950, `canvas-submit` L6451, `data-testid="canvas-autosave-state"` L5869; tour config `src/lib/tours/canvasTour.ts` (L43), mounted via `CanvasTourMount` L526.

---

## 2. INTERVIEW SETUP

### Page — `src/app/(app)/live-interviews/page.tsx` (184 lines), server component
- Wrapped in `UsageProvider`; container `max-w-[1400px] px-4 py-5 sm:px-8 sm:py-7` (L157).
- **Hero** (L161): `data-tour-target="interviews-hero"` → `<LearningPageHeading eyebrow="Interview preparation" title="Find your confidence in conversation.">`; body copy "Choose a role and company context, practice a realistic conversation, and leave with specific feedback."
- **"Hatch says" card**: `<HatchSays tint="mint" message={hatchMessage} ctaLabel="Set up an interview" ctaHref="#interview-setup" />` (`src/components/redesign/HatchSays.tsx`).
  - Data source `getLastSessionBrief()` (L110–150): admin client, `live_interview_sessions` select `id, challenge_id, debrief_json, ended_at`, filter `user_id`, `status='completed'`, order `ended_at desc`, limit 1. Score from `debrief_json.overallScore`; `<= 0` → null (never "scored 0"). Discipline label via `challenges.challenge_type` → `challengeTypeToDiscipline` → `DISCIPLINE_META[d].label`.
  - Message (L152–154): `` `Your latest session scored ${normalizeToTen(score,5).toFixed(1)}/10 in ${discipline}. Open the debrief when you want to review the details.` `` else fallback `'Choose a company and discipline below. You can answer by voice or chat.'`
- `<BillingUsageFromProfile />` (L165).
- `#interview-setup` anchor with `scroll-mt-24` → `LiveInterviewsShellClient` (L169).

**Company list data source** — `getPersonas()` L26–59: table **`company_profiles`**, columns `slug, name, icon, roles, interview_persona_prompt, interview_style`, ordered by `name`. Flat-mapped to one persona per `(company, role)`: `{companyId: slug, companyName, role, slug: '{slug}-{role-kebab}', icon ?? 'corporate_fare', interviewStyle, difficulty: 'medium', estimatedMins: 35, personaPrompt}`. Falls back to `MOCK_LIVE_INTERVIEW_PERSONAS` when empty. **Role counts come from `company_profiles.roles[]` length**, not a static config.

**Scenarios** — `getScenarios()` L61–102: `challenges` select `id, title, scenario_question, difficulty, estimated_minutes, relevant_roles, primary_competencies, challenge_type`; `is_published=true`, `scenario_question not null`, `challenge_type in ('flow','freeform','quick_take','system_design','data_modeling','sql','algorithm')`, order `difficulty`, limit 120. Mapped to `ScenarioBrief` (L15–24), dropped when `challengeTypeToDiscipline` returns null.

### Shell — `LiveInterviewsShell.tsx` (1232 lines)
- `LiveInterviewsShellClient.tsx` (27 lines) is the `'use client'` wrapper.
- **Single/Multi toggle**: `const [mode, setMode] = useState<'single'|'loop'>('single')` L1134. `role="tablist" aria-label="Interview format"`, ids `interview-single-tab` / `interview-multi-tab`, panel `interview-format-panel` (L1186–1211). Labels **"Single interview"** / **"Multi-round"** (suffixed ` · {n} active` when `loopSummary.inProgress > 0`). `selectMode` scrolls the panel into view + focuses (L1170–1184). Active style `bg-forest-800 text-white`.
- Loop summary: `fetchInterviewLoops()` → `GET /api/interview-loops` (L293), `countLoopSummary` → `{inProgress, configured, completed}`.
- Panel body: `mode === 'loop' ? <FullLoopPanel/> : <SingleRoundPicker personas scenarios/>` (L1219–1223).
- Design tokens object `T` at L14–38 (raw hex, not Tailwind).

**LoopBuilder** (L562+):
- `ROUND_OPTIONS` L508–513: `product-sense` "Product sense" 35min `center_focus_strong`; `system-design` "System design" 40min `schema`; `analytical` "Data modeling" 30min `bar_chart`; `coding` "Coding" 35min `code`.
- `COMPANIES` L515–520 (static, 8): Airbnb `home`, Netflix `movie`, Figma `design_services`, Google `search`, Meta `groups`, Notion `description`, Stripe `credit_card`, Uber `local_taxi`.
- State: `selectedCo` (default `'Stripe'`) L562, `selectedRounds` (default `['product-sense','system-design']`) L563, `difficulty` (default `'hard'`) L569.
- `UI_TO_DISCIPLINE` L531–536, `DISCIPLINE_TO_UI` L538–543, `diffLabelToKey` L547.
- Save (L583–610): min 2 rounds; `POST /api/interview-loops/create` or `PATCH /api/interview-loops/{id}`; payload `{ targetCompany, targetRole: DIFF_LABELS[difficulty], roundOrder: LoopDiscipline[] }`; response `{loopId}`.
- Delete: `DELETE /api/interview-loops/{loopId}` L785.
- `ROUND_MINS` L172, `DISCIPLINE_LABELS` L175–180, `COMPANY_ICONS` L182.
- `LoopStatusBadge` L40: `in_progress` "In progress" (amber, pulsing), `configured` "Configured", `completed` "Completed".
- `RoundRow` L74: statuses `locked | ready | in_progress | passed | failed`; icons `lock / radio_button_unchecked / play_circle / check_circle / cancel`; CTAs Resume / Start / Review →.

### SingleRoundPicker — `SingleRoundPicker.tsx` (709 lines)
- State L91–93: `selectedCompanyId`, `selectedRoleIdx` (0), `selectedDiscipline`.
- 3-column grid `minmax(0,0.86fr) minmax(0,1fr) minmax(0,1.18fr)`, collapses at `max-lg` (L114–119).
- Panels: `CompanyPanel` (step 1) / `DisciplinePanel` (step 2, role + discipline) / `OptionsPanel` (step 3).
- `filteredScenarios`: `scenarios.filter(s => s.discipline === selectedDiscipline).slice(0, 8)` (L97).
- Selecting a company resets role idx to 0 and clears discipline (L101–105).
- Test ids: `live-interview-company-{companyId}` L229, `live-interview-discipline-{discipline}` L356, `live-interview-scenario-{id}` L569.
- **"Your interview room is waiting"** — `DefaultOptionsState` L634–693, heading L664: `hasCompany ? 'Pick a discipline to see options.' : 'Your interview room is waiting.'`; icon `video_chat` in a 56px `primaryContainer` tile. Sibling `DefaultDisciplineState` L618 ("Choose a company first.").
- `SectionEyebrow` L695 renders numbered step pills.

### Create-session action — `StartInterviewButton.tsx`
- Props L15–23: `companyId, roleId, challengeId?, companyName?, discipline?, variant?: 'chip'|'hero', label?`.
- `handleClick` L56: at-limit check via `useIsAtLimit('interviews')` → PaywallModal; else **`POST /api/live-interview/start`** with body `{ companyId, roleId, challengeId, discipline }`.
- `402` → paywall with `{used, limit}`. Success → dispatches `profile-stats-updated` (detail `{source:'interview-start'}`), stores `sessionId, companyName, role, discipline, challengeId, scenarioTitle`, opens the ready modal.
- Ready modal `data-testid="live-interview-ready-modal"`: heading **"Ready to begin?"**, `HatchImage size={64} state="idle"`, mic note "Voice or chat, your pick. The mic is optional; typing runs the same interview.", buttons **"Start interview"** and **"← Back to interviews"**. `readyBody` varies by `DISCIPLINE_META[d].artifact` (`canvas` / `editor` / default).
- `handleStartInterview` L104: `router.push('/live-interviews/{sessionId}?' + params)` with `autostart=1, company, role, discipline, challenge_id, scenario_title`.
- Sonics: `play('submit'|'nudge'|'success'|'error'|'open'|'close')`.

**API `src/app/api/live-interview/start/route.ts`**: `RequestSchema = z.object({ companyId: z.string().max(200).nullable().optional(), roleId: …, challengeId: …, discipline: z.string().max(100).nullable().optional() })` (L10–14). Inserts into **`live_interview_sessions`** (L73–76) with `company_id: companyId ?? null`. Returns `discipline: built.effectiveDiscipline` (L107). Also calls `recordUsageEvent`.

Other routes: `src/app/api/live-interview/` → `start`, `history`, and per-session `[id]/{pause, resume, status, turn, chat, voice-turn, voice-think, voice-settings, snapshot, end, analyze, grade-turn, debug}`.

### Recent sessions — `PastSessionsTable` (L968+ in Shell)
- **`GET /api/live-interview/history`** (L974).
- Response fields mapped (L980–1004): `id, companyName, roleId, overallScore, grade, durationSeconds, endedAt, status, scenarioTitle, disciplineLabel`.
- UI shape `PastSession` (L959–966): `{id, company, role, score, grade, duration, date, status, scenarioTitle, disciplineLabel}`.
- Duration formatted `{m}m {s}s` / `{m}m`; date `toLocaleDateString('en-US',{month:'short',day:'numeric'})`.
- `status` defaults `'completed'`; incomplete rows carry `'abandoned'` and render a `statusLabel` in place of the date (L1100 joins `[duration, date||statusLabel]` with `·`).
- Loading: 3 shimmer bars height 56. Error: "Could not load past sessions."
- Underlying table `live_interview_sessions`; score is `debrief_json.overallScore`.
- Separate list component also exists: `src/app/(app)/live-interviews/PastInterviews.tsx` (107 lines).

### Loop routes
- `src/app/(app)/live-interviews/loop/new/page.tsx` (231 lines) — standalone multi-round builder entry.
- `src/app/(app)/live-interviews/loop/[id]/page.tsx` (143 lines) + `StartRoundButton.tsx` — loop detail with per-round start.
- Support components `src/components/live-interviews/`: `LoopProgressBar.tsx`, `PausedLoopCard.tsx`, `PriorRoundRecap.tsx`, `EntryModeCards.tsx`, `DisciplineFilterStrip.tsx`.
- Types: `src/lib/interview-loops/types.ts` (`LoopDiscipline` = `product_sense | system_design | data_modeling | coding`, `LoopRound`).
- Other setup files: `ScenarioPickerSheet.tsx`, `FilteredPersonaGrid.tsx`.

---

## 3. INTERVIEW ROOM

**`src/app/(app)/live-interviews/[id]/page.tsx`** — 3031 lines. Export `SessionPage` L447.

### Phase model
`type InterviewPhase = 'loading' | 'ready' | 'active' | 'ended'` — **L144**.
- State L483: `useState<InterviewPhase>(IS_MOCK ? 'active' : 'loading')`.
- → `'ready'` at L719, L742, L774, L778 (after resume/start resolution).
- → `'active'` at L926 (first successful opening turn / snapshot).
- → `'ended'` at L984 (SSE status) and L1049 (limit reached).
- Render branches: `loading` L1634, `ended` L1698, `ready` L1754, `active` L2054+.
- Guards: unload handler while `active` (L679–692); limit modal when `isLimitReached && phase==='active'` (L1034).

### Pre-flight modal (`phase === 'ready'`, L1754–2050)
Inline in the page (not a separate component). `role="dialog" aria-modal="true" aria-label="Choose voice or chat"`, fixed overlay `rgba(0,0,0,0.6)` + `blur(8px)`, `zIndex: 200`; card `maxWidth 440`, `background #1a2420`, `borderRadius 20`, `animation fadeUp 0.25s`.
- Close button top-right → `leaveReadyModal`.
- `HatchImage size={64} state="idle"`.
- Tag row: company pill, `DISCIPLINE_META[discipline].label`, `· {roleName}`.
- Heading **"Your interviewer is spinning up. Breathe."** + `scenarioTitle` + `readyCopy` (three variants by `DISCIPLINE_META[d].artifact`: canvas / editor / default).
- Reframe strip: icon `visibility`, "I am scoring how you reason, not whether you are instantly right."
- **Mic check** block: heading "Check your mic"; states `micCheckState: 'idle'|'checking'|'ok'|'denied'` (L536). Buttons **"Allow mic"** (idle) / **"Retry"** (denied) → `startMicPreflight()`. Level meter `role="meter"` with `levelPct = min(micLevel*5, 1)`, colour `#7ee099` above 0.04 else `rgba(255,255,255,0.25)`. Device state: `micDevices` L539, `selectedDeviceId` L540, `preferredDeviceId` L541 (persisted).
- `canStartWithVoice = micCheckState === 'ok' && micSeenSignal` (L1767).
- Handlers: `handleStartWithVoice` L1342, **`handleStartWithChatFallback`** L1334 (the "Continue in chat, no mic" path), `leaveReadyModal` (→ `/live-interviews`).

### Room layout — top bar
L2127–2200. `height: 52`, `background rgba(0,0,0,0.3)`, `backdropFilter blur(8px)`, bottom hairline.
- Back: 32×32 round button, icon `arrow_back`, `onClick={() => router.push('/live-interviews')}` (L2140).
- Company pill (truncate `max-w-[120px]`), discipline label (`sm:` up), `· {roleName}` (`md:` up).
- **LIVE badge**: green dot `#7ee099` with `pulseSoft 1.5s` while `phase === 'active'`, label `LIVE` at 10.5px.
- Tour/help button (L2196+): dispatches **`start-interview-tour`**, `aria-label="Tour this screen"`, `lg:` only.
- Timer: `useInterviewTimer` (`src/hooks/useInterviewTimer.ts`), called L568 with `interviewPhase === 'active'` (L570) and `interviewStartedAt`. Returns `{formatted, isWarning, isLimitReached}`. Source = `Date.now() - startedAt`, ticking each 1000ms, format `MM:SS`, cap **25 min** (`25*60`).
- Loop progress bar (L2103): `<LoopProgressBar loopTitle rounds currentRoundIndex onPause>`; pause closes the SSE stream, `POST /api/live-interview/{id}/pause`, then routes to `/live-interviews/loop/{loopId}`.
- Mock banner when `IS_MOCK` (L2118).

### Hatch presence / avatar
- `HatchAvatarState` type from `src/components/live-interview/HatchAvatar.tsx` (imported L9). State `const [avatarState, setAvatarState] = useState<HatchAvatarState>('idle')` — L496.
- Other avatar surfaces: `HatchConversationMascot.tsx`, `TalkingHeadAvatar.tsx` (handle `TalkingHeadHandle`, L12), `HatchImage` (`src/components/redesign/HatchImage.tsx`, `HatchImageState`).
- Voice pipeline: `DeepgramVoiceSession` (`src/components/live-interview/DeepgramVoiceSession.tsx`, handle `DeepgramVoiceSessionHandle`, L11); callbacks `handleConnected` L1221, `handleVoiceError` L1229 → `voiceError` L1227.
- Thinking flag `isThinking`; center orb rendered when `centerMode === 'orb'` (L2374); keyframes `orbRingAnim`, `wavebarAnim`, `floatHatchAnim`, `blinkAnim`, `pulseSoft` (L2055–2100).

### Transcript / chat drawer
- **Chat drawer** L2760+: `PresencePanel` `data-testid="live-interview-chat-panel"`, fixed right, `width: min(340px, calc(100vw - 24px))`, `background rgba(12,15,19,0.97)`, `blur(16px)`. Header label **"Chat mode"** with `chat` icon. State `isChatOpen`, closed via header X and the dock Chat button.
- Input `data-testid="live-interview-chat-input"` L2912; send `data-testid="live-interview-chat-send"` L2927.
- `handleSendChatMessage` L1360 → **`POST /api/live-interview/{sessionId}/chat`** (L1385). Second chat path L1446 (guarded by `phase !== 'active' || isThinking || isChatSending || isEnding`, L1421).
- **Quick replies**: `handleQuickChatMessage` L1491 (guards L1510). The dock's "Break" button sends the canned `'Can we take a quick break?'` (L2670). Standalone `ChatPanel` component (`src/components/live-interview/ChatPanel.tsx`) has props `{isOpen, onClose, turns, isThinking, onSendMessage}` (L6–14).
- **Transcript panel**: `TranscriptPanel.tsx`; toggled by `isTranscriptOpen`; anchor `data-tour-target="interview-transcript"`. Turn rendering `TurnBubble` L261, coaching pill `SignalCard` L228.
- Voice turn: `POST /api/live-interview/{sessionId}/voice-turn` L1132. Per-turn grade: `POST .../grade-turn` L1151. Analysis: `POST .../analyze` L1183. Snapshot: `POST .../snapshot` L911, L1060, L1567. Status: **`EventSource('/api/live-interview/{sessionId}/status')`** L933 (SSE).

### Bottom dock (L2647–2758)
`height: 96`, `background rgba(0,0,0,0.4)`, `blur(12px)`, top hairline; single centred scrollable row. Buttons render via `CtrlBtn` (L355, `data-testid={testId}` L384).

| Button | Icon | testId | Handler | Condition |
|---|---|---|---|---|
| Mute | `mic` / `mic_off` | — | `setIsMuted(m => !m)` | `isVoiceAvailable` |
| Break | `pause` | — | `handleQuickChatMessage('Can we take a quick break?')` | always |
| Captions | `closed_caption` | — | `setIsCaptionsOn(c => !c)` | always |
| Transcript | `notes` | — | `setIsFocusMode(false); setIsTranscriptOpen(o => !o)` | always |
| FLOW | `analytics` | `live-interview-mode-flow` | `setIsFocusMode(false); setIsFlowPanelOpen(o => !o)` | always |
| Chat | `chat` | `live-interview-mode-chat` | `setIsChatOpen(o => !o)` | always |
| Focus | `center_focus_strong` | `live-interview-mode-focus` | `setIsFocusMode(f => !f)`; clears `focusDismissedId` | always |
| Canvas | `draw` | `live-interview-mode-canvas` | `setCenterMode(m => m==='canvas'?'orb':'canvas')` | `discipline === 'system_design' \|\| 'data_modeling'` |
| Editor | `code` / `terminal` | `live-interview-mode-editor` | `setCenterMode(m => m==='editor'?'orb':'editor')` | `discipline === 'coding' \|\| 'sql'` |
| **End** | `call_end` | `live-interview-end` | `handleEndInterview` (L1545), `danger large` | always |

A 1×40 divider sits before End (L2743).

**End flow** (`handleEndInterview` L1545 / L1040): if `centerMode !== 'orb'` snapshot the artifact first (L1563/L1057), then **`POST /api/live-interview/{sessionId}/end`** (L1578, also L986, L1024, L1067) → routes to the debrief.

### Center surfaces by discipline
- `const [centerMode, setCenterMode] = useState<'orb'|'canvas'|'editor'>('orb')` — L527.
- Workspace wrapper `data-testid="live-interview-workspace"` L2327; header label logic L2355–2358 (`Voice mode` / `Chat mode` / `Canvas` / `Editor`).
- Canvas L2431: `data-testid="live-interview-canvas"`; scene state `canvasScene` L528 (`{elements, appState}`); helpers in `src/lib/hatch/canvas-scene`.
- Editor L2441: `data-testid="live-interview-editor"`; `currentLanguage` L530 (`'python'|'javascript'|'java'|'cpp'|'go'|'sql'`, default `python`); `lastRunResult` L531; `editorPasteEvents` L532 (`PasteEvent` from `MonacoCodeEditor`); `editorCursorLine` L533.
- `effectiveMode` derived L589–595.
- Artifact snapshot builder `buildCurrentArtifactSnapshot` — type `LiveInterviewArtifactSnapshot` from `src/lib/live-interview/artifact-context` (L51).

### FLOW / signal contract
- `FLOW_MOVES` from `src/lib/flow/moves` (L6); local `FLOW_COLORS`, `FLOW_NAMES`, `COMPETENCY_LABELS`.
- `CoachingSignal` shape (L228–254): `{ flowMove, competency, signal }` (+ client-added `id`, `time`).
- Signals arrive on the SSE `status` stream as `data.latestSignal` with `{turnIndex, flowMove, competency, signal}` (L954–972); de-duped via `lastSignalTurnIndexRef`, appended to `recentSignals` and attached to the last Hatch turn as `turn.coachingSignal`.
- `parseGradingSignal` — `src/lib/live-interview/parse-grading-signal` (L50). The chat renderer strips grading-signal JSON blocks before display (L849, L1395, L1461) so internal signals never leak.
- Context kinds allowed (L197): `['challenge','topic','rubric','flow-signal','memory']`; a local signal is injected as `id: local-signal-{id}`, kind `'flow-signal'` (L1599–1602).
- `FlowCoveragePanel` — `src/components/live-interview/FlowCoveragePanel.tsx`, toggled by `isFlowPanelOpen`/`showFlowPanel`; anchor `data-tour-target="interview-flow"`.
- `CompetencyRadar.tsx`, `DebriefUpgradeCard.tsx`, `InterviewControls.tsx` also in `src/components/live-interview/`.

### Interview tour — `src/lib/tours/interviewTour.ts` (87 lines)
- `SEEN_KEY = 'interview-tour:v1:done'` (L11) in **localStorage**; `interviewTourSeen()` L13, `markInterviewTourSeen()` L18 writes an ISO timestamp.
- `INTERVIEW_TOUR: TourConfig` L27, `id: 'interview-intro'`, single-route (no `route` on steps → engine never navigates); steps whose anchor is absent auto-skip.
- Steps (id / anchor / title / `on` / glyph):
  1. `stage` — `[data-tour-target="interview-stage"]` — "This is the room" — top — speaking
  2. `transcript` — `[data-tour-target="interview-transcript"]` — "Everything is captured" — right — speaking
  3. `flow` — `[data-tour-target="interview-flow"]` — "FLOW coverage" — left — speaking
  4. `canvas` — `[data-testid="live-interview-mode-canvas"]` — "Sketch your system" — top — speaking
  5. `editor` — `[data-testid="live-interview-mode-editor"]` — "Write your solution" — top — speaking
  6. `chat` — `[data-testid="live-interview-mode-chat"]` — "Type instead of talk" — top — speaking
  7. `end` — `[data-testid="live-interview-end"]` — "Wrap up when ready" — top — celebrating
- Mounted via `InterviewTourMount` (L73) → `<InterviewTourMount active={interviewPhase === 'active'} ready={turns.length > 0} />` at L2054, using `TourRunner` (L35) and `setCursor` from `src/lib/tours/shepherdEngine` (L37).
- Trigger event: **`start-interview-tour`** (top-bar help button).

### Debrief
Route: **`/live-interviews/[id]/debrief`** — `src/app/(app)/live-interviews/[id]/debrief/page.tsx`.

---

## 4. ONBOARDING

### Context — `src/context/OnboardingModalContext.tsx` (153 lines)
- `DISMISSED_KEY = 'onboarding-modal-dismissed'` (L17) — **sessionStorage**, written in `closeModal` (L124).
- `ModalSource = 'auto' | 'hero' | 'settings'` (L21).
- State: `{open, hasMeaningfulProgress, completed, valueFirst}` (L24–30).
- **`onboarding_value_first` flag** fetched from `GET /api/config/flags` (L64), fails safe to `false`. Defined in `src/lib/config/app-flags.ts`.
- Mount effect L74–105: waits for `profile`; if `profile.onboarding_completed_at` → `completed = true` and stop. Otherwise `getOnboardingState()` (`src/lib/onboarding/state-client`); `meaningful = screen !== 'intro' && screen !== 'results'`. **Calibration no longer auto-launches** — strictly opt-in.
- **Window event `'open-onboarding-modal'`** — listener L108–112, sets `open = true`.
- `markCompleted` L130 dispatches `profile-stats-updated` so `SessionContext` re-reads `onboarding_completed_at`.
- Hook `useOnboardingModal()` L151.

### Modal — `src/components/onboarding/OnboardingModal.tsx` (243 lines)
- Reads `{open, closeModal, markCompleted, valueFirst}` (L90).
- **`valueFirst` branch (L126)** renders `<QuickRoleSelect onRouted={handleQuickStartRouted} onSkip={closeModal} />` (L155); else `CalibrationFlowWrapper` (L198 / L207).
- `handleComplete(path, slug)` routing:
  | path | target |
  |---|---|
  | `tour` | `router.push('/dashboard')` **+ `window.dispatchEvent(new Event('start-intro-tour'))`** (L107–108) |
  | `plan` | `router.push('/explore/plans/${slug}')` (L112) |
  | `challenge` | `router.push('/challenges')` (L114) |
  | `flow` | `router.push('/dashboard')` (L116) |
- `handleQuickStartRouted(href)` L120 → `router.push(href)`.
- `CalibrationFlowWrapper` L224: mirrors internal screen transitions by listening for the `calibration-screen-change` event (dispatched from CalibrationFlow L436) so the modal chrome/close button can react without forking `CalibrationFlow` (L219–222).

### QuickRoleSelect — `src/components/onboarding/QuickRoleSelect.tsx` (125 lines)
- `ROLES` (L13–24), 10 entries, exact ids/labels: `swe` "Software Engineer", `data_eng` "Data Engineer", `ml_eng` "ML Engineer", `devops` "DevOps / Platform", `em` "Eng Manager", `founding_eng` "Founding Engineer", `tech_lead` "Tech Lead", `pm` "Product Manager", `designer` "Designer", `data_scientist` "Data Scientist".
- Copy: eyebrow "Pick your role", H2 "Which role best matches your work?"; skip button "Skip for now"; submitting "Pulling your first challenge, about 5 minutes, no setup."
- `handleSelect` L37: tracks `EVENT_ONBOARDING_STEP {step:'role_quick', step_index:0}` → **`POST /api/onboarding/quick-start`** body `{role: roleId}` → `data.challenge_href` (fallback `FIRST_REP_FALLBACK_HREF` from `src/lib/onboarding/curated-first-rep`) → tracks `EVENT_FIRST_REP_ROUTED {role, challenge_href}` → `onRouted(href)`.
- **`/api/onboarding/quick-start`**: updates `profiles.onboarding_completed_at = now` (L73–76), deletes `onboarding_state` for the user (L85), resolves a curated challenge from `challenges` (L91), returns `{success, challenge_href}`. Default `DEFAULT_FIRST_REP_SLUG` via `challengePath()` (L47).

### CalibrationFlow — `src/components/onboarding/CalibrationFlow.tsx` (1112 lines)
`CAL_SCREENS` (L53–56) — **12 screens in order**:
`'intro', 'role', 'context', 'goal', 'timeline', 'flow_intro', 'q0', 'q1', 'q2', 'q3', 'reading', 'results'`
`QUESTION_SCREENS = ['q0','q1','q2','q3']` (L58).

Transition map `NEXT` (L638–641): `intro→role→context→goal→timeline→flow_intro→q0→q1→q2→q3→reading→results→results`.

**Fields collected:**

| Screen | State | Options (exact) |
|---|---|---|
| `role` L708 | `selectedRole` L362 | `ROLES` L60–71 — same 10 ids/labels as QuickRoleSelect, each with an icon: `terminal, storage, model_training, settings_suggest, groups, rocket_launch, account_tree, track_changes, palette, query_stats` |
| `context` L748 | `roleContext` L363, type `RoleContext` | `CONTEXT_OPTIONS` L73–77: `engineer_pm_interview` "Prepping for PM-style interviews"; `engineer_on_job` "Sharpening product thinking on the job"; `both` "Both, honestly" |
| `goal` L778 | `primaryGoal` L364, `PrimaryGoal` | `GOAL_OPTIONS` L79–84: `land_pm_adjacent` "Land a PM or PM-adjacent role"; `level_up_current` "Get promoted in my current eng role"; `ship_better` "Make sharper product calls at work"; `explore` "Just exploring product thinking" |
| `timeline` L808 | `prepTimeline` L365, `PrepTimeline` | `TIMELINE_OPTIONS` L86–91: `lt_1mo` "Within a month" (revealCompany **true**); `1_3mo` "One to three months" (**true**); `gt_3mo` "Longer than that" (false); `no_timeline` "No fixed timeline" (false) |
| `timeline` (conditional) | `targetCompany` L366 | free-text input, shown only when `revealCompany`; advances via "Continue" (`handleTimelineContinue` L613) |
| `q0`–`q3` | `answers: Record<string,string>` L368 keyed by move | see `QUESTIONS` below |

**Other screens:** `intro` L683 — H1 "Let me figure out where you are.", body "4 choices. Product, systems, data, SQL, code. / No wrong answers, just honest ones."; `flow_intro` L965 (renders `FLOW_MOVES` L93–98: `frame ◇ #4a7c59`, `list ◈ #1565c0`, `optimize ◆ #ad1457`, `win ◎ #f57f17`); `reading` L946 — cycles `READING_PHRASES` L100 `['Reading your answers…','Mapping your instincts…','Almost done…']` every 700ms.

**Hatch states per screen** (`transitionTo` L595–609): `role/context/goal/timeline/q*` → `listening`; `flow_intro` → `speaking`; `reading` → `reviewing`; `results` → `celebrating`; `intro` starts `celebrating`, flips to `speaking` after 1200ms (L445–449).

**Instrumentation:** `EVENT_ONBOARDING_STEP` fired on every screen change with `{step, step_index: CAL_SCREENS.indexOf(screen)}` (L442). Also dispatches **`calibration-screen-change`** (L436).

**Resume/persistence:** `getOnboardingState`/`clearOnboardingState`; `stateLoaded` L374, `shouldPersistState` L375, `coerceAnswerMap` L106, `isCalScreen` L102. Persisted shape `CalibrationStateData` L31–39: `{screen, selectedRole, roleContext, primaryGoal, prepTimeline, targetCompany, answers}` → table **`onboarding_state`**.

### Calibration questions — `src/lib/calibration/questions.ts` (161 lines)
`QUESTIONS: CalibrationQuestion[]` (L19) — 4 items, one per FLOW move, each `{move, scenario, q, hatch, options: [A,B,C,D]}` with `quality ∈ best | good_but_incomplete | surface | plausible_wrong`.
- `frame` (L20): B2B SaaS, 30% WAU drop / "What is the right first move?" — A best, B good_but_incomplete, C surface, D plausible_wrong.
- `list` (L50): personal-finance app, 5-tap logging / "What options do you put on the table?" — A best, B gbi, C surface, D plausible_wrong.
- `optimize` (L79): checkout A/B, 18% abandonment vs +40s / "How do you decide which variant to ship?" — A best, B gbi, C surface, D plausible_wrong.
- `win` (L108): legacy export deprecation, 12% of users / "How does the team land this decision?" — A best, B gbi, **C plausible_wrong, D surface**.
- `QUESTIONS_BY_MOVE` L143.
- `FEEDBACK_BY_TIER` L150–159 — one Hatch line per quality tier, shown as `microFeedback` for ~1s on select (L622–627).

### Scoring / submit
`handleOptionSelect` L531: records answer, shows tier feedback, and on `q3` calls `startSubmit(newAnswers)` immediately so the round-trip overlaps the reading animation (L634).

**`startSubmit` L461–498 → `POST /api/onboarding/calibration/submit`**
Payload (L467–475): `{ answers, role, primary_goal, prep_timeline, role_context, target_company }`.
Response → `Results` (L41–49): `{ archetype, archetype_description, percentile, hatch_observation, starting_levels: Record<string,number>, scores: Record<string,number>, personalised_plan_slug: string|null }`.
Reading screen (L500–518) races the submit against a **12s timeout** and a **2500ms minimum wait**, then `transitionTo('results')` — never traps the user.

**Route `src/app/api/onboarding/calibration/submit/route.ts` writes:**
| Table | Op | Line |
|---|---|---|
| `calibration_attempts` | insert (`percentile: 50` placeholder), then update with real percentile | L115–121, L155 |
| `profiles` | update (incl. `interview_meta.preferred_move = weak`, `target_company`) | L159, L244, L253 |
| `onboarding_responses` | upsert `onConflict: 'user_id'` | L164–165 |
| `onboarding_state` | delete | L168 |
| `move_levels` | upsert | L173 |
| **`learner_competencies`** | upsert | L186 |
| `hatch_context` | insert (conditional) | L201 |
| `study_plans` | select to verify slug | L231 |

- Percentile: `Math.round(belowOrEqual/avgs.length*100)`, clamped 1–99 (L34–35), computed against `calibration_attempts` (L22).
- Archetype: `deriveArchetype(scores)` — `src/lib/calibration/deriveArchetype.ts` L73. **"The Strategist"** at L62 (`key: 'strategist'`, description "You frame problems sharply and land recommendations with conviction. Your instinct is to define the question before answering it."). Observation copy in `src/lib/calibration/archetypes.ts` L2.
- Mock/fallback values L65–67: `percentile: 78`, `archetype: 'The Strategist'`.
- **Auto-enrol into study plan**: `computePersonalisedPlanSlug({role, primaryGoal, prepTimeline})` (L225), then verified against `study_plans` where `slug = X and is_published = true` — **set to `null` if not found** so the CTA can never 404 (L229–237). Returned as `personalised_plan_slug`.
- Non-blocking side effects: `interview_meta` write (try/catch, logs on failure, L240–259); Hatch-context embedding fire-and-forget when `interview_date` present (L262+).

**`postProfileData` L559–590 → `POST /api/onboarding/profile`** — fired once when leaving `timeline`, payload `{role, role_context, primary_goal, prep_timeline, target_company, interview_date}`. `interview_date` defaults to **now + 21 days** when `prep_timeline === 'lt_1mo'` (L570–573). Fire-and-forget when no company input is needed (L607) because the route can take seconds.

**`handleComplete(path)` L646–653**: `await POST /api/onboarding/complete` → `clearOnboardingState()` → `onComplete?.(path, results?.personalised_plan_slug ?? null)`.

**Route `src/app/api/onboarding/complete/route.ts`** (76 lines): `RequestSchema = z.object({ role_context: z.string().trim().min(1).max(200).optional(), experience_level: …max(100).optional(), calibration_answers: z.array(z.unknown()).max(100).optional() })` (L7–11). Upserts `profiles` `{onboarding_completed_at: now, role_context?}` (L44–51), deletes `onboarding_state` (L53–56), upserts `onboarding_responses` `{user_id, role_context, experience_level, calibration_answers}` when both context and level present (L59–70). Logs `onboarding.completed`. Returns `{success: true, level}`.

### Results screen CTAs (L985–1108)
- Hero: `HatchImage size={76} state="celebrating"`; H2 **"Here's where you're starting."**; archetype chip only when present (never "Not set").
- 4 score boxes over `FLOW_MOVES` showing `results.scores[key]` and `Lv {results.starting_levels[key]}`, staggered `calFadeUp` at `1000 + i*150`ms.
- Hatch observation card (icon `auto_awesome`) when `results.hatch_observation`.
- CTAs (L1066–1104), reveal delay 2000ms:
  | Label | onClick | Target |
  |---|---|---|
  | **Start my first challenge** | `handleComplete('challenge')` | `/challenges` |
  | **See my study plan** (only when `personalised_plan_slug`) | `handleComplete('plan')` | `/explore/plans/{slug}` |
  | **Explore what FLOW is** | `handleComplete('flow')` | `/dashboard` (comment: opens `DisciplineExplorerModal` via window event) |
  | **Take me around** (icon `tour`) | `handleComplete('tour')` | `/dashboard` + **`start-intro-tour`** event |

### Proxy — `src/proxy.ts`
- `PRE_LAUNCH = false` (L18); `LAUNCH_ALLOWED` L19.
- **`const APP_PUBLIC_ROUTES = ['/canvas-harness']`** — **L27** (single entry).
- `AUTH_CALLBACK_ROUTES = ['/auth/callback']` (L25).
- Classification L57–70: `isMarketing`, `isExactMarketing`, `isWaitlist`, `isAuthRoute`, `isAuthCallback`, `isPublicScorecard`, `isApi`, `isAdminApi`, `isAdminUi`, `isPureMarketing`.
- Short-circuit before Supabase (L80): `isPureMarketing || isAuthCallback || isPublicScorecard || (isApi && !isAdminApi)` → `NextResponse.next()`. **`/api/*` skips the proxy** and must self-auth.
- Authenticated: `/reset-password` passes through (L160); auth routes redirect via `authRedirectFromParams(...) ?? '/dashboard'` (L161–164); **all other app routes pass freely — "The dashboard owns the calibrated/uncalibrated experience"** (L166–168). There is **no `onboarding_completed_at` gate in the proxy** on this branch; enforcement lives in `OnboardingModalContext` / dashboard.
- Unauthenticated: auth routes pass (L171–174); `APP_PUBLIC_ROUTES` pass (L176–180); everything else → `/login?returnTo={pathname}{search}` (L182–185).
- `IS_MOCK` bypass at L~35.
- Matcher (L188–194): `'/((?!_next/static|_next/image|favicon.ico|lottie/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'`.
- `/marketing` → `/` 308 redirect (top of file).

**`src/lib/routes/public.ts`** (dependency-free, shared by proxy + `V3AuthGate`):
- `MARKETING_ROUTES` (52 entries, prefix-matched): `/`, `/v3`, `/about`, `/contact`, `/security`, `/waitlist`, `/waitlist-quick`, `/waitlist-flow`, `/pricing`, `/offer`, `/privacy`, `/terms`, `/help`, `/changelog`, `/r`, `/flow`, `/hatch-preview`, `/hatch-motion`, `/design-review`, `/role-transitions`, `/uplevel`, `/salary-negotiation`, `/skills`, `/companies`, `/study-plans`, `/practice`, `/autopsies`, `/autopsy`, `/glossary`, `/claude-code-analytics`, `/blog`, `/interviews`, `/alternatives`, `/affiliate-program`, `/lp`, `/landing`, `/go`, `/quiz`, `/robots.txt`, `/sitemap.xml`, `/manifest.json`, `/llms.txt`, `/llms-full.txt`, `/clone`.
- `AUTH_ROUTES`: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/magic-link-sent`.
- `EXACT_MARKETING_ROUTES = ['/interview-prep']`.
- `PUBLIC_SCORECARD_ROUTE = /^\/workspace\/challenges\/[^/]+\/share(?:\/[^/]+(?:\/(?:opengraph-image|twitter-image)[^/]*)?)?$/`.
- Helpers: `prefixMatch`, `isPublicPath(pathname)`.

---

## 5. LANDING

**Entry: `src/app/page.tsx`** (8 lines) — **not** `(marketing)/page.tsx` (that file does not exist).
```
import { V5LandingPage, v5LandingMetadata } from '@/components/landing-v5/V5LandingPage'
import '@/app/(marketing)/v5-landing/v5-landing.css'
export const metadata = v5LandingMetadata
export default function RootPage() { return <V5LandingPage /> }
```
All landing components live in **`src/components/landing-v5/`** (11 files, 864 lines total). Styling is a plain CSS file (`v5-landing.css`), not Tailwind — class names like `hero-reference-*`, `reference-nav-*`.

### `V5LandingPage.tsx` (86 lines)
- Composition L70–84: `JsonLdScript` → `V5Header` → `main`(`V5Hero`, `V5PracticeGrid`, `V5Grading`, `V5AIWork`, `V5Pricing`) → `V5Footer` → `V3AuthGate` (`src/components/landing-v3/V3AuthGate.tsx`, listens for `open-auth-modal`).
- Metadata: `v5LandingTitle` "HackProduct | Practical Learning for Tech Professionals" (L17), `v5LandingDescription` L14, `v5LandingKeywords` L19–27; `buildMetadata({path:'/'})`.
- JSON-LD: `organizationJsonLd()`, `websiteJsonLd()` (`src/lib/seo/directory-content`), plus `softwareJsonLd` L35–68 — `SoftwareApplication`, offers **Pro Monthly $39 USD** (`/pricing?plan=monthly`) and **Pro Annual $199 USD** (`/pricing?plan=annual`).

### Hero — `V5Hero.tsx` (188 lines, `'use client'`)
- Section `className="hero-reference"` `id="top"`.
- **Headline** L74–79 (hard-wrapped): "Practice for / engineering / interviews that / test *more than code.*" (`<em>` on the last phrase).
- **Kicker** L69–72: `✣ ACE INTERVIEWS. BUILD WHAT'S NEXT.`
- **Sub copy** (`.hero-reference-lede`) L81–88: "Practical learning for software engineers, tech leads, staff engineers, EMs, AI engineers and FDEs across coding, SQL, system design, product judgment and AI-directed work." (with `hero-reference-desktop-break` `<br>`s).
- **Role chips** L90–105: `roles` array L7–14 — `{label:"SWE", value:"Software Engineer"}`, `Staff Engineer`, `{label:"FDE", value:"Forward-Deployed Engineer"}`, `AI Engineer`, `Tech Lead`, `{label:"EM", value:"Engineering Manager"}`. Behaviour: `onMouseEnter/onFocus/onClick` → `emitRole(value)`; `onMouseLeave/onBlur` → `emitRole(null)`. **`emitRole` (L23) dispatches `CustomEvent("hp-role-focus", {detail: role})`**. Index 0 gets `is-active` + a `hero-reference-role-dot`. Consumed by `V5PracticeGrid` (see below).
- **CTAs** L107–115:
  - Primary `<button className="hero-reference-primary" onClick={openSignup}>` — "Start a practice session" + `ArrowIcon`. `openSignup` L27 dispatches **`CustomEvent("open-auth-modal", {detail:{mode:"signup"}})`** (no href).
  - Secondary `<a className="hero-reference-secondary" href="#grading">` — "▶ See how review works".
- **3D Hatch asset** L127–129: `<Image src="/landing-v5/hatch-transparent.png" alt="" width={585} height={751} priority />` inside `.hero-reference-hatch.hero-reference-layer-hatch` (`aria-hidden`). Other assets in `public/landing-v5/`: `hatch.png`, `hatch-peek.png`, `hackproduct-mark.svg`, `hackproduct-logo.png`, `hackproduct-logo-tight.png`, `hackproduct-wordmark.png`, `hackproduct-wordmark-tight.png`.
- **Feedback card mock** L132–163: `<article className="hero-reference-review" aria-label="Example review feedback">` — header `⌘ SYSTEM DESIGN • URL SHORTENER`, `<time>Example feedback</time>`; score **86** (`aria-label="Example score 86 out of 100"`); "Strong" list: "Clarified traffic assumptions", "Separated read/write paths", "Explained caching tradeoff"; "Needs work": "Failure recovery", "Consistency model"; link "View full feedback →" `href="#grading"`. Commented as decorative, not interactive (L131).
- **Proof row = dimension breakdown** L165–178: `<aside className="hero-reference-dimensions" aria-label="Example dimension breakdown">` header "DIMENSION BREAKDOWN". **`dimensions` const L16–22 — fully static, no fetch**: `System Design 88, Product Judgment 84, Scalability 82, Tradeoffs 80, Failure handling 86`. Bars via inline `style={{width: `${score}%`}}`.
- Parallax: pointer effect L36–66 sets CSS vars `--mx`/`--my` on the visual; skipped on touch and under `prefers-reduced-motion: reduce`; rAF-throttled with cleanup.
- Decorative shapes L123–125: `hero-reference-taupe-shape`, `-green-shape`, `-amber-shape`. Sticky note L131: "You chose eventual consistency. **Defend that decision.**"

### Nav — `V5Header.tsx` (136 lines, `'use client'`)
- `<header className="site-header reference-header">` → `V5Brand` + `nav.desktop-nav.reference-nav` + `.header-actions`.
- Top-level items L104–109: `Home` → `/`; **Practice** dropdown; **Library** dropdown; `Progress` → `/progress`.
- `practiceLinks` L8–14: Coding / DSA → `/challenges?type=algorithm`; SQL & Data → `/challenges?type=sql`; System Design → `/challenges?type=system_design`; Product Judgment → `/challenges?type=product_sense`; AI-Directed Analytics → `/claude-code-analytics`. View-all → `/practice`.
- `resourceLinks` L16–22: Autopsies → `/autopsies`; Study plans → `/study-plans`; Glossary → `/glossary`; Blog → `/blog`; Interviews → `/interviews/live-ai-interviews`. View-all → `/explore`.
- `NavDropdown` L26–74: `aria-expanded`, `aria-haspopup`, `role="menu"`/`menuitem`, outside-click close, Escape closes and refocuses the trigger, "View all →" row.
- Actions L110–118: "Log in" → `openLogin()` (dispatches `open-auth-modal` mode `login`, L94); "Start practicing" → `openSignup()` (mode `signup`, L97); mobile menu button `MenuIcon`/`CloseIcon` with `aria-expanded` + `aria-label`.
- Mobile menu L121–133: Home / Practice (`/practice`) / Library (`/explore`) / Progress, plus "Start practicing". Body scroll locked while open; Escape closes and refocuses the button (L78–91).
- `V5Brand.tsx` (14 lines): `<Link className="brand" href="/" aria-label="HackProduct home">`; `compact` → `hackproduct-logo-tight.png` (57×41) else `hackproduct-wordmark-tight.png` (244×22), both `priority`.

### Other sections
- **`V5PracticeGrid.tsx`** (57 lines, `'use client'`) — 5 `areas`: `coding` "Coding / DSA" → `/challenges?type=algorithm`; `sql` "SQL & Data" → `?type=sql`; `system` "System Design" → `?type=system_design`; `product` "Product Judgment" → `?type=product_sense`; `agent` "AI-Directed Analytics" → `/claude-code-analytics`. **Listens for `hp-role-focus`** and maps via `roleAreas`: Software Engineer → `[coding, sql, system]`; Tech Lead → `[system, product, agent]`; Staff Engineer → `[system, product, agent]`; Engineering Manager → `[system, product]`; AI Engineer → `[coding, system, agent]`; Forward-Deployed Engineer → `[sql, system, product, agent]`. Applies `is-role-active` / `is-role-muted`.
- **`V5Grading.tsx`** (70 lines) — `id="grading"` (hero CTAs' anchor). Static `dims` L6–12: Framing & scoping 90, Architecture 85, Tradeoffs 80, Failure modes 76, Failure handling 95. Overall score **87/100**. Three feedback cards: Strong / Go deeper / Follow-up. "New practice" link → `/practice`. Uses `Reveal` from `./motion`.
- **`V5AIWork.tsx`** (55 lines) — "Example session" panel, bar heights `[78,63,55,48,40]`, review score **82/100**; 4-step list 01 Scope / 02 Direct / 03 Inspect / 04 Defend; CTA "See Claude Code Analytics →" → `/claude-code-analytics`.
- **`V5Pricing.tsx`** (127 lines).
- **`V5Footer.tsx`** (41 lines) — `hatch.png` 210×210; CTA "Start a practice session"; links: `#grading` "How it works", `/practice` "Practice areas", `/pricing` "Pricing", `/claude-code-analytics` "AI workflows".
- **`icons.tsx`** (39 lines): `ArrowIcon, CheckIcon, CloseIcon, MenuIcon, AgentIcon, CodeIcon, JudgmentIcon, SqlIcon, SystemIcon`.
- **`motion.tsx`** (51 lines): `Reveal` (`delay` prop).

### Cookie banner
**`src/components/legal/CookieBanner.tsx`** — `export function CookieBanner()` L15. Persists to **localStorage** key `COOKIE_CHOICE_STORAGE_KEY` (read L20, written L26 with the chosen value). Paired with `src/components/legal/AnalyticsGate.tsx` and `src/components/PostHogProvider.tsx`. Mounted from `src/app/layout.tsx` (not from `V5LandingPage`).

---

### Notes on divergence from CLAUDE.md
- Landing lives at `src/app/page.tsx` → `src/components/landing-v5/`; `src/components/marketing/*` (LandingHero, FloatingNav, SocialProof, etc.) exists but is **not** used by the root page.
- Onboarding uses `src/components/onboarding/*` + a modal, not `(onboarding)/*` routes.
- `ChallengeWorkspace.tsx` does not exist; the workspace is `src/components/v2/FlowWorkspace.tsx`.
- Study-plan hrefs are `/explore/plans/{slug}`, not `/prep/study-plans/{slug}`.
- Proxy has no `onboarding_completed_at` gate on this branch (`APP_PUBLIC_ROUTES` is `['/canvas-harness']` only).