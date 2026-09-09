# Code map: Workspace, Interview Setup/Room, Onboarding, Landing

Read-only research map. Exact paths, line numbers (approximate to nearest verified region), component/prop names, data sources, handlers, events, and storage keys for implementation planning.

---

## 1. WORKSPACE — `src/components/v2/FlowWorkspace.tsx` (6484 lines)

### Mode derivation
```ts
// L564
const isApiMode = props.mode === 'api'
// L852-856
const apiChallengeType = isApiMode ? detail?.challenge?.challenge_type : undefined
const isCanvasChallenge = apiChallengeType === 'system_design' || apiChallengeType === 'data_modeling'
const isCodingChallenge = apiChallengeType === 'sql' || apiChallengeType === 'algorithm'
const isInterviewChallenge = isCanvasChallenge || isCodingChallenge
// else: FLOW (MCQ) mode
```

### `leftWidth` persistence (resizable two-pane layout)
- State: `const [leftWidth, setLeftWidth] = useState(40)` (L797)
- **localStorage key**: `` `flowworkspace:${challengeId}` `` — schema `{ leftWidth, leftCollapsed, v: 2 }` (write at L884-895)
- Read/parse on mount (L808-812); migration shim at L881: `if (stored.v === undefined && stored.leftWidth === 30) setLeftWidth(35)`
- Drag handled via `handleSeparatorMouseDown` / `handleCodingDividerMouseDown` (coding editor/test-pane divider)

### Title / toolbar row
- `challengeTitle` (L3832): `isApiMode ? detail?.challenge.title : adapterChallenge?.title`
- Back/exit: `capExitHref = workspaceExitHref({ fromPlan, fromDomain }, props.returnTo)` (L3797) — from `src/lib/workspace/breadcrumbs.ts` (see partial notes)
- Desktop focus header (`workspace-focus-header`, ~L5700-5810):
  ```tsx
  <button onClick={props.onExit ?? (() => window.history.back())} aria-label="Back to practice">← Practice</button>
  <h1 title={challengeTitle}>{challengeTitle}</h1>
  {isCodingChallenge && !codingMaximised && (
    <div data-testid="workspace-command-row">
      <CodingStepper compact activeStep={codingStep} onSelectStep={...} />
      {codingActions /* Run/Submit cluster, see below */}
      <button onClick={() => setCodingMaximised(v => !v)} aria-label="Full screen workspace">⛶</button>
    </div>
  )}
  {!isInterviewChallenge && <button aria-pressed={hintOpen} onClick={() => setHintOpen(v => !v)}>Need a hint?</button>}
  ```
- Mobile chrome (~L5340-5420): same "← Practice" back button (`aria-label="Back to practice"`), horizontally scrollable tab strip.

### Run / Submit cluster (`codingActions`, L5130-5232)
- Autosave indicator: `data-testid="autosave-indicator"`, tooltip text driven by `codingSaveState`
- **Run**: `onClick={handleCodingRun}` (handler L2891), `data-testid="run-button"`, `⌘'` shortcut, disabled while `codeRunner.status === 'running'|'hydrating'` or `isSubmittingCoding`
- **Submit Part** (multi-part): `onClick={handleSubmitPart}` (L3000) → `POST /api/challenges/${challengeId}/coding-submit` (L3021)
- **Submit** (single-part): `onClick={handleCodingSubmit}` (L2926), `data-testid="submit-button"`, `⌘⏎` shortcut → `POST /api/challenges/${challengeId}/coding-submit`; also fires `POST /api/challenges/${challengeId}/coding-snapshot` fire-and-forget (L2975)
- "Submit all parts" (finalize): `POST /api/challenges/${challengeId}/finalize` (L4710/4749)

### Step tracker
- FLOW mode: `flowStepperStrip` (FLOW_STEPS, L459) using `FlowStepper` component (`./FlowStepper`, not read in full — imported)
- Coding mode: `CodingStepper` (compact, in header) — steps via `codingStep` state
- Canvas mode: `CompactStepPips` (`@/components/challenge/design/*`) in `workspace-specialist-toolbar`

### Brief pane tabs
- FLOW/default: `const tabs = ['Description', 'Solutions', 'Discussions', 'Submissions']` (L3918), label override: `'Description' → 'The brief'`
- Coding: `codingPrimaryTabs = ['Description'|'Examples'|'Constraints'|'Notes']` + `codingMoreTabs = ['Solutions','Discussions','Submissions']` (L3932-3938)
- Desktop nav render (`workspace-reference-nav`, L5103): `onClick={() => setLeftTab(tab)}`, `aria-pressed={leftTab === tab}`, badges via `workspaceTabBadge` (Discussions/Submissions counts)
- Tab content data sources:
  - `GET /api/challenges/${challengeId}/discussions` (L3543), `PATCH .../discussions/${id}/upvote` (L3723)
  - `GET /api/challenges/${challengeId}/solution${qs}` (L3584), `POST .../solution/generate` (L3600)
  - `GET /api/attempts/${attemptId}/grade` (L1043), `GET /api/attempts?challenge_id=...&count=1` (L1176) — Submissions
  - `GET /api/profile` (L3664)

### Editor component (coding mode, ~L6140-6270)
- `LanguageSelector` — `supportedLangs`: SQL-only if `apiChallengeType==='sql'`, filtered non-SQL if `'algorithm'`, else `metaLangs`
- `MonacoCodeEditor` — wrapper `data-testid="monaco-editor-container"`; props `value, preferPlainEditor, onChange, language, height="100%", onPaste, readOnly`
- `useCodeRunner` + `getTestCases` (`@/hooks/useCodeRunner`) drives Run

### Test cases pane
- `TestCasePanel` — props: `testCases, results, status, isSqlMode, errorMessage, hiddenCount, collapsed, onToggleCollapse`

### "Ask about your code" Hatch button + event
- **Not in FlowWorkspace.tsx.** Defined in `src/components/challenge/CanvasChatPanel.tsx` L227:
  ```ts
  if (challengeType === 'coding') return { title: 'Ask about your code', sub: 'Hatch can see your editor' }
  ```
- `CanvasChatPanel` props relevant here: `onToggle: () => void` (L38); placeholder text varies by mode (L324-327: `"Ask Hatch about your code…"` coding; `"Ask Hatch about the session…"` / `"Ask Hatch, or tell it what to draw from your notes…"` canvas/design)
- Collapsed-pill click: `onClick={() => { play('open'); setMode('floating'); onToggle() }}` (L717); close handlers L779, 954
- Reused for BOTH canvas (`challengeType="coding"` vs `"system_design"/"data_modeling"`) and coding modes — same component, differentiated by prop and `dockSurface`
- Coding-mode `sideTabs`: `guidance` (→ `GuidanceTab`, self-check, confidence), `hints` (→ `HintsTab`)
- Canvas-mode `sideTabs`: `guidance` (→ `DesignRail` + "Show me a hint" [`requestManualHint`] + "Run self-check" [`runSelfCheck`])

### Canvas mode (~L5900-6100)
- `DesignStepForm` (props: `step, values, onChange, onSectionFocus, diagramThumbUrl, diagramEntityCount, diagramConnectionCount, diagramLabels, onOpenCanvas`)
- `ExcalidrawCanvas` (props: `sessionId, onSnapshot, onElementsAdded, initialData, apiRef, exportRef`)
- `CanvasEmptyState` (props: `challengeType, guidance, onUseTemplate, onAskHatch, onOpenNotes`)
- `TourRunner` + `CANVAS_TOUR` (`@/lib/tours/canvasTour`) via `CanvasTourMount`
- Design step prev/next buttons use shared classes `WORKSPACE_BTN_PRIMARY` / `WORKSPACE_BTN_TONAL` (L560-561)

### Key API routes (all under `/api/challenges/${challengeId}/...` unless noted)
| Route | Line | Purpose |
|---|---|---|
| `POST /step/coding/submit` | 4589 | MCQ answer submit within a coding step |
| `POST /interview-submit` | 2829 | canvas/interview challenge submit (`handleInterviewSubmit`, L2820) |
| `POST /coding-submit` | 3021/3215 | full test suite + grading; also per-part |
| `POST /coding-snapshot` | 2975 | fire-and-forget draft snapshot |
| `POST /finalize` | 4710 | submit all parts |
| `POST /complete` | 3429 | challenge completion |
| `GET /discussions`, `PATCH /discussions/${id}/upvote` | 3543, 3723 | discussion tab |
| `GET /solution${qs}`, `POST /solution/generate` | 3584, 3600 | solutions tab |
| `GET /api/attempts/${attemptId}/grade` | 1043 | submissions grade |
| `GET /api/attempts?challenge_id=...&count=1` | 1176 | last attempt |
| `GET/POST /api/hatch/canvas/nudge` | 1693,1735,1843,3123 | proactive nudges, self-check/hint |
| `POST /api/hatch/canvas/interpret` | 3161 | Hatch chat message interpretation |
| `POST /api/hatch/session/autosave` | 1936,2019,2057,3299 | draft autosave |
| `POST /api/hatch/nudge-warmup` | 2391 | idle nudge warmup |
| `GET /api/adaptive/guidance` | 1252 | guidance level |
| `GET /api/profile` | 3664 | profile read |

### `(workspace)` layout — `src/app/(workspace)/layout.tsx` (for later shared-shell replacement)
Per partial notes (verified): client component, `Suspense`-wrapped. Mount tree:
```
HatchProvider > SessionProvider >
  div.flex.h-screen >
    TopNav (src/components/shell/TopNav.tsx)
    optional StudyPlanIndexPanel | DomainIndexPanel
    main
    BottomTabs
    FloatingHatch
    UpgradeModalHost
```
- Reads search params `from_plan`, `from_domain`, `cid`
- Share routes (`/workspace/challenges/[id]/share...`) bypass the shell entirely
- `TopNav` (`src/components/shell/TopNav.tsx`): `NAV_ITEMS` (L15-20, home/practice/library/progress w/ material icons); header `sticky top-0 z-40 border-b`, ~67px tall; `isActive('practice')` matches `/challenges`, `/workspace/challenges`, `/live-interviews`; logout `signOut()` → `/login`; Upgrade button dispatches `window.dispatchEvent(new Event('open-upgrade-modal'))`

---

## 2. INTERVIEW SETUP

### `src/app/(app)/live-interviews/page.tsx` (185 lines, server component)
- `ScenarioBrief`: `{id, title, scenarioQuestion, difficulty, estimatedMinutes, relevantRoles, primaryCompetencies, discipline}`
- `getPersonas()`: mock → `MOCK_LIVE_INTERVIEW_PERSONAS`; live → `company_profiles` table (`slug, name, icon, roles, interview_persona_prompt, interview_style`), flattened per role into `{companyId, companyName, role, slug, icon, interviewStyle, difficulty:'medium', estimatedMins:35, personaPrompt}`
- `getScenarios()`: `challenges` table (`id, title, scenario_question, difficulty, estimated_minutes, relevant_roles, primary_competencies, challenge_type`), filter `is_published=true AND scenario_question IS NOT NULL AND challenge_type IN ('flow','freeform','quick_take','system_design','data_modeling','sql','algorithm')`, limit 120; discipline via `challengeTypeToDiscipline()` (`@/lib/live-interview/disciplines`)
- `getLastSessionBrief()`: admin client reads `live_interview_sessions` (`id, challenge_id, debrief_json, ended_at`) where `user_id=user.id AND status='completed'`, order `ended_at desc`, limit 1; skips if `debrief.overallScore <= 0`
- **"Hatch says" card**: `<HatchSays tint="mint" message={hatchMessage} ctaLabel="Set up an interview" ctaHref="#interview-setup" />`
  - `hatchMessage` = last-session branch: `` `Your latest session scored ${normalizeToTen(lastSession.overallScore, 5).toFixed(1)}/10${discipline}. Open the debrief when you want to review the details.` `` — data source: `live_interview_sessions.debrief_json.overallScore`
  - else: `'Choose a company and discipline below. You can answer by voice or chat.'`
- Renders `<BillingUsageFromProfile />` then `<div id="interview-setup"><LiveInterviewsShellClient personas={personas} scenarios={scenarios} /></div>`

### `LiveInterviewsShellClient.tsx` → dynamic-imports `LiveInterviewsShell.tsx` (`ssr:false`)

### `LiveInterviewsShell.tsx` (1232 lines)
- Design tokens `T` (surface `#fdfbf6`, primary `#4a7c59`, etc.)
- `LoopStatusBadge`, `RoundRow` (loop round status icons/colors)
- `LoopBuilder` (L561) — company/rounds/difficulty picker for multi-round loops; posts to `POST /api/interview-loops/create`
- Mode state: `'single' | 'loop'`; `selectMode()` scrolls active panel into view
- **Single/Multi-round toggle** (L1150-1232):
  ```tsx
  <div role="tablist" aria-label="Interview format">
    <button role="tab" id="interview-single-tab" aria-selected={mode==='single'} onClick={() => selectMode('single')}>Single interview</button>
    <button role="tab" id="interview-multi-tab" aria-selected={mode==='loop'} onClick={() => selectMode('loop')}>
      Multi-round{!loopSummary.loading && loopSummary.inProgress>0 ? ` · ${loopSummary.inProgress} active` : ''}
    </button>
  </div>
  <div role="tabpanel">{mode==='loop' ? <FullLoopPanel/> : <SingleRoundPicker personas={personas} scenarios={scenarios}/>}</div>
  <h2>Recent sessions</h2><PastSessionsTable/>
  ```

### `SingleRoundPicker.tsx` (709 lines)
- `CompanyEntry`: `{companyId, companyName, slug, icon, roles: LiveInterviewPersona[]}`, grouped via `groupPersonasByCompany(personas)`
- 3-col grid `minmax(0,0.86fr) minmax(0,1fr) minmax(0,1.18fr)` (stacks below `lg`): `CompanyPanel | DisciplinePanel | OptionsPanel`
- State: `selectedCompanyId`, `selectedRoleIdx` (default 0), `selectedDiscipline` (`LiveInterviewDiscipline` union, `@/lib/live-interview/disciplines`)
- `handleSelectCompany(companyId)` resets role idx + discipline
- **Discipline/role step** — `DisciplinePanel` (L282): buttons per discipline (icon/label/scenario-count from `DISCIPLINE_META`/`LIVE_INTERVIEW_DISCIPLINES`), showing `${count} scenario(s)` or `'Persona-only interview'`
- **Interview options** (`InterviewOptions`, L441) — every field:
  - Header: `{company.companyName} · {persona.role}`
  - Sub: `{meta.label} · {persona.estimatedMins ?? 35} min`
  - `persona.interviewStyle` description text
  - Fixed note: "Voice or chat, your choice. The microphone is optional and can be enabled after the session opens."
  - `<StartInterviewButton variant="hero" label={autoPickScenario ? 'Start recommended scenario' : 'Start persona interview'} companyId roleId challengeId={autoPickScenario?.id} companyName discipline />`
  - If `scenarios.length > 0`: up to 8 `ScenarioRow` items, each with its own `StartInterviewButton` (`challengeId={scenario.id}`)
  - Else fallback: "No published {discipline} scenarios yet…"
  - `OptionsPanel` swaps `DefaultOptionsState` ↔ `InterviewOptions` via `PresencePanel`/`OPTIONS_SWAP_VARIANTS`
- `ScenarioRow` (L557): title, difficulty dot+label (`coerceDifficulty`, `DIFF_LABEL`/`DIFF_DOT`), `~{estimatedMinutes} min`, `data-testid="live-interview-scenario-${scenario.id}"`

### `StartInterviewButton.tsx` (307 lines, full read)
- Props: `{companyId, roleId, challengeId?, companyName?, discipline?, variant?: 'chip'|'hero', label?}`
- `handleClick()`:
  1. `useIsAtLimit('interviews')` check → if at limit, show `PaywallModal` with `{used, limit}` from `useUsage()`
  2. `POST /api/live-interview/start` body `{companyId, roleId, challengeId, discipline}`
  3. On `402`, read `{used, limit}` from body → paywall
  4. On success: `window.dispatchEvent(new CustomEvent('profile-stats-updated', {detail:{source:'interview-start'}}))`; store `sessionId`, `modalCompany`, `modalRole`, `sessionDiscipline`, `sessionChallengeId`, `sessionScenarioTitle`; open `showReadyModal`
- `handleStartInterview()`: builds `URLSearchParams({autostart:'1', company, role, discipline, challenge_id, scenario_title})`, `router.push(\`/live-interviews/${sessionId}?${params}\`)`
- **Ready modal** (portaled): `role="dialog" aria-labelledby="live-interview-ready-title" data-testid="live-interview-ready-modal"`; shows company/discipline/role tags, "Ready to begin?" heading, scenario title, `readyBody` (canvas/editor/default text), mic note; actions: **Start interview** (`onClick={handleStartInterview}`), **← Back to interviews** (closes modal)
- `variant='hero'`: full-width primary button; disabled+"Upgrade to start an interview" lock icon when at limit. `variant='chip'`: compact pill.
- Renders `PaywallModal` (feature="interviews")

### Create-session API — `POST /api/live-interview/start` (109 lines, full read)
```ts
const RequestSchema = z.object({
  companyId: z.string().max(200).nullable().optional(),
  roleId: z.string().max(200).nullable().optional(),
  challengeId: z.string().max(200).nullable().optional(),
  discipline: z.string().max(100).nullable().optional(),
})
```
- `IS_MOCK` short-circuit → `{sessionId:'mock-session-id', companyName:'Uber', role:'PM'}`
- 400 `invalid_request`/`invalid_json` on schema failure; 401 `auth_required` if no user
- `getEffectiveUserPlan(adminClient, user.id)` → `{plan, isAdmin}`
- `checkUsageLimit(user.id, 'interviews', userPlanForLimit)` → 402 `limit_reached` `{used, limit, feature:'interviews', windowDays}` if not allowed and not admin
- `buildPromptFromSession({adminClient, userId, companyId, roleId, challengeId, discipline})` → `{systemPrompt, scenarioRubric, calibrationSnapshot, companyName, scenarioTitle, effectiveDiscipline, guidanceLevel}`
- Inserts `live_interview_sessions`: `{user_id, company_id, role_id: roleId ?? 'PM', challenge_id, status:'active', started_at, system_prompt, scenario_rubric, calibration_snapshot: {...calibrationSnapshot, companyName, scenarioTitle, effectiveDiscipline, guidanceLevel}}`
- `recordUsageEvent(user.id, 'interviews')` if not admin
- **Response**: `{sessionId, companyName, role, scenarioTitle, challengeId, discipline}`

### Recent sessions list — `PastSessionsTable` (in `LiveInterviewsShell.tsx`, L968+)
- Fetches `GET /api/live-interview/history` → `{sessions: [...]}`
- Row shape from API: `{id, companyName, roleId, overallScore, grade?, durationSeconds, endedAt, status?, scenarioTitle?, disciplineLabel?}`
- Mapped to display: `{id, company, role, score, grade, duration ("Xm Ys"), date (short), status: status ?? 'completed', scenarioTitle, disciplineLabel}`
- Loading: 3 shimmer rows. Error: `role="alert"` "Could not load past sessions." Empty: dashed-border empty state.
- (Row click → Debrief href / resume href not captured in the read range — implementer should re-grep `PastSessionsTable` render body past L1005 for the exact `href`/`onClick` per row; the fetch + interface above are exact.)

### Loop routes (briefly, per spec)
- `src/app/(app)/live-interviews/loop/new/page.tsx`, `loop/[id]/page.tsx` exist (not deep-read)
- `POST /api/interview-loops/create` (full read): body `{targetCompany, targetRole, roundOrder: LoopDiscipline[]}`; requires `roundOrder.length >= 2`; inserts `interview_loops` (`user_id, title, target_company, target_role, status:'draft', round_order, current_round_index:0`) then `loop_rounds` rows (`loop_id, round_index, discipline, status:'pending'`); returns `{loopId, title}`
- `GET/PATCH /api/interview-loops/[id]/route.ts`: GET returns `{loop, rounds}` joined from `interview_loops` + `loop_rounds` (both scoped `user_id=user.id`); PATCH updates loop status (auth-scoped)
- `POST /api/interview-loops/[id]/start-round/route.ts`: reads loop + rounds + profile, finds `currentRound` by `round_index === loop.current_round_index`, guards against `status==='completed'`; uses `@/lib/interview-loops/loop-context-distiller` for `cross_round_memory` (`CrossRoundMemoryItem[]`)

---

## 3. INTERVIEW ROOM — `src/app/(app)/live-interviews/[id]/page.tsx` (3031 lines)

### Key imports
`DeepgramVoiceSession`, `TalkingHeadAvatar` (dynamic ssr:false), `ExcalidrawCanvas` (dynamic), `MonacoCodeEditor` (dynamic), `LoopProgressBar`, `PriorRoundRecap`, `useInterviewTimer`, `PaywallModal`, `useEntitlements`, `parseGradingSignal` (`@/lib/live-interview/parse-grading-signal`), `summarizeScene` (`@/lib/hatch/canvas-scene`), `DISCIPLINE_META`/`normalizeDiscipline` (`@/lib/live-interview/disciplines`), motion (`AnimatedProgress, CollapsiblePanel, FocusSurface, PresencePanel` from `@/components/motion`), `Md`, `TourRunner` + `INTERVIEW_TOUR`.

### `interviewPhase` derivation
```ts
type InterviewPhase = 'loading' | 'ready' | 'active' | 'ended'
const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>(IS_MOCK ? 'active' : 'loading')
```

### Pre-flight modal (`interviewPhase === 'ready'`, ~L1754)
- `role="dialog" aria-modal="true" aria-label="Choose voice or chat"`; close button `onClick={leaveReadyModal}`
- `HatchImage size={64} state="idle"`; company/discipline/role tag row
- Heading "Your interviewer is spinning up. Breathe." + `scenarioTitle` + `readyCopy` (varies by `DISCIPLINE_META[discipline].artifact`: canvas/editor/default)
- Reframe box: "I am scoring how you reason, not whether you are instantly right."
- **Mic check box**: "Check your mic" label; **"Allow mic"** button (idle, `onClick={() => startMicPreflight()}`); **"Retry"** (denied state); level meter (`levelPct = Math.min(micLevel * 5, 1)`, green `#7ee099` if `micLevel > 0.04` else grey); "Say a few words so I know your mic is live." / "Mic is live." (`micSeenSignal`); device `<select>` shown when `micDevices.length > 1` (`onChange` → `startMicPreflight(id)`)
- Mic state: `micCheckState: 'idle'|'checking'|'ok'|'denied'` (L536); refs `preflightStreamRef`, `preflightCtxRef`, `preflightRafRef`, `preflightGenerationRef` (L543-549); `teardownPreflight` (L1239), `startMicPreflight(deviceId?)` (L1253)
- `canStartWithVoice = micCheckState === 'ok' && micSeenSignal`; `isReadyBtnEnabled = canStartWithVoice`
- **Actions**:
  - **"I'm ready"**: `onClick={handleStartWithVoice}`, `disabled={!isReadyBtnEnabled}`, label varies (`'Check mic above first'` / `'Checking mic…'` / `"I'm ready"`)
  - **"Continue in chat, no mic"**: `onClick={handleStartWithChatFallback}`
  - **"Back to interviews"**: `onClick={leaveReadyModal}`

### Room layout (active phase, ~L2043+)
- `flowMoves`: `[{key:'frame',label:'F',name:'Frame'}, {key:'list',label:'L',...}, {key:'optimize',label:'O',...}, {key:'win',label:'W',...}]`
- Root: `<div className="dark-room-enter fixed inset-0..." style={{background:'#0c0f13', zIndex:200}}>` + `<InterviewTourMount active={interviewPhase==='active'} ready={turns.length>0}/>`
- **Loop progress**: `LoopProgressBar` (shown when `loopRounds.length>0 && loopIdParam`); `onPause` → close SSE, `POST /api/live-interview/${sessionId}/pause`, `router.push('/live-interviews/loop/'+loopIdParam)`
- **Top bar (52px)**: Left — Back (`router.push('/live-interviews')`, `aria-label="Back"`), companyName pill, discipline label, roleName, LIVE dot, "Replay the interview tour" (`onClick={() => window.dispatchEvent(new Event('start-interview-tour'))}`, hidden `<lg`). Center — timer (`{timerDisplay}`). Right — FLOW mini-bars (hidden `<sm`).
- **3-column body**:
  - LEFT: Transcript panel (320px, `data-tour-target="interview-transcript"`, hidden `<lg`) → `CollapsiblePanel` title "Transcript" → `TurnBubble` list or "Conversation will appear here"
  - CENTER stage (`data-testid="live-interview-workspace"`, `data-tour-target="interview-stage"`): mode badge, `FocusSurface`, then per `centerMode`:
    - `'orb'`: floating `HatchImage` (speaking/listening), caption box if `isCaptionsOn`
    - `'canvas'`: `<div data-testid="live-interview-canvas"><ExcalidrawCanvas sessionId onSnapshot={handleCanvasSnapshot} initialData={canvasScene}/></div>`
    - `'editor'`: `<div data-testid="live-interview-editor"><MonacoCodeEditor value={currentCode} onChange language={currentLanguage} theme="vs-dark" height="100%" onPaste onCursorMove/></div>`
    - Small Hatch "pip" (44px) shown when `centerMode !== 'orb'`
  - RIGHT: FLOW HUD (280px, `data-tour-target="interview-flow"`, hidden `<lg`) — per-move coverage bars, `FLOW_COLORS`
- **Bottom dock** (`CtrlBtn`, ~L2680-2760): Transcript toggle, FLOW toggle (`data-testid="live-interview-mode-flow"`), Chat toggle (`data-testid="live-interview-mode-chat"`, `onClick={() => setIsChatOpen(o => !o)}`), Focus toggle (`data-testid="live-interview-mode-focus"`), **Canvas** toggle (only `discipline==='system_design'|'data_modeling'`, `data-testid="live-interview-mode-canvas"`), **Editor** toggle (only `discipline==='coding'|'sql'`, `data-testid="live-interview-mode-editor"`), Mute (`icon="mic"/"mic_off"`, `onClick={() => setIsMuted(m => !m)}`), **End** (`data-testid="live-interview-end"`, `icon="call_end"`, danger, `onClick={handleEndInterview}`)
- **Chat drawer** (340px, `data-testid="live-interview-chat-panel"`): header "Chat mode" + close; message list (hatch via `Md variant="chat"`); typing indicator; **quick replies**: `["I'm here", 'Give me a hint', 'I need a minute', 'Can we take a quick break?']` (`onClick={() => handleQuickChatMessage(chip)}`); input (`data-testid="live-interview-chat-input"`) + send (`data-testid="live-interview-chat-send"`) → `handleSendChatMessage(text)`
- `DeepgramVoiceSession` (gated `ENABLE_DIRECT_VOICE_AGENT`): props `sessionId, isMuted, onTranscript, onAgentSpeaking, onAgentDoneSpeaking, onConnected, onError, onAnalyserReady, disabled, preferredDeviceId`
- Time-limit `PaywallModal` (`feature="interviews"`, `dismissible={false}`, `secondaryAction={{label:'End session & view debrief', onClick: () => {setShowLimitModal(false); handleEndInterview()}}}`)

### "Generating debrief" phase (`interviewPhase==='ended'`, ~L1698)
Full-screen overlay: `HatchImage state="reviewing"`, "Generating debrief" / "Hatch is analyzing your interview across all four FLOW moves. Just a moment.", shimmer progress bar, `{timerDisplay} recorded`, retry button → `autoEndToDebrief()`

### End flow
- `handleEndInterview`/`confirmEndInterview` (L1545-1592): two-step confirm (`showEndConfirm`); if `centerMode !== 'orb'` saves artifact via `PATCH /api/live-interview/${sessionId}/snapshot` first; then `POST /api/live-interview/${sessionId}/end`; dispatches `profile-stats-updated`; routes to `/live-interviews/${sessionId}/debrief`

### API routes (grepped, `/api/live-interview/${sessionId}/...` unless noted)
| Route | Purpose |
|---|---|
| `POST /api/live-interview/${id}/resume` | resume session |
| `POST /api/live-interview/start` | (re-confirm on resume) |
| `POST .../chat` | text chat turns |
| `PATCH .../snapshot` | artifact snapshot save |
| `GET .../status` (SSE, `new EventSource`) | phase/status stream |
| `POST .../end` | end session, triggers debrief |
| `POST .../pause` | loop pause |
| `POST .../voice-turn` | voice transcript submit |
| `POST .../grade-turn` | per-turn FLOW grading |
| `POST .../analyze` | artifact analysis |

### `live_interview_sessions` columns referenced across code
`id, user_id, company_id, role_id, challenge_id, status, started_at, ended_at, system_prompt, scenario_rubric, calibration_snapshot (jsonb), debrief_json (jsonb)`. Recent-sessions display fields (`overallScore, grade, durationSeconds, scenarioTitle, disciplineLabel`) are derived server-side in `/api/live-interview/history`, not raw columns.

### `useInterviewTimer` (`src/hooks/useInterviewTimer.ts`, full read)
`useInterviewTimer(startedAt, isActive, maxMinutes?)` — 1s `setInterval` computing `elapsed = Date.now() - startedAt`; returns `{elapsed, formatted (MM:SS), isWarning (elapsed >= 25min), isLimitReached}`.

### Interview tour anchors — `src/lib/tours/interviewTour.ts` (88 lines, full read)
- `SEEN_KEY = 'interview-tour:v1:done'` (localStorage); `interviewTourSeen()`/`markInterviewTourSeen()`
- `INTERVIEW_TOUR` steps (auto-skips absent anchors):
  1. `stage` → `[data-tour-target="interview-stage"]` — "This is the room"
  2. `transcript` → `[data-tour-target="interview-transcript"]` — "Everything is captured"
  3. `flow` → `[data-tour-target="interview-flow"]` — "FLOW coverage"
  4. `canvas` → `[data-testid="live-interview-mode-canvas"]` — "Sketch your system"
  5. `editor` → `[data-testid="live-interview-mode-editor"]` — "Write your solution"
  6. `chat` → `[data-testid="live-interview-mode-chat"]` — "Type instead of talk"
  7. `end` → `[data-testid="live-interview-end"]` — "Wrap up when ready"
- `InterviewTourMount` (page.tsx L73-107): fires once `interviewPhase==='active'` and `ready` (Hatch's opening turn landed); 800ms delay or 3500ms fallback; skips ≤1023px; listens for `start-interview-tour` window event.

### Not deep-read (flagged for implementer)
- `src/app/(app)/live-interviews/[id]/debrief/page.tsx`
- `src/lib/live-interview/{artifact-context,artifact-grader,audio-lifecycle,build-prompt-from-session,context-pack,debrief-generator,discipline-contracts,disciplines,flow-coverage-credits,flow-detector,model-policy,parse-grading-signal,snapshot-schema,system-prompt,voice-settings,voice-token,workspace-adapters}.ts`

---

## 4. ONBOARDING

### `OnboardingModalContext.tsx` (`src/context/OnboardingModalContext.tsx`, full read)
- `DISMISSED_KEY = 'onboarding-modal-dismissed'` (sessionStorage)
- State: `{open, hasMeaningfulProgress, completed, valueFirst}`
- `valueFirst`: fetched once from `GET /api/config/flags` → `data.onboarding_value_first`
- Mount effect: if `profile.onboarding_completed_at` set → `completed=true`, done. Else calls `getOnboardingState()` (`@/lib/onboarding/state-client`) — if `data.screen` is not `'intro'`/`'results'` → `hasMeaningfulProgress=true`. **Does NOT auto-open the modal** (explicit design choice, see comment: calibration is opt-in only, reachable via `'open-onboarding-modal'` window event)
- `openModal(source?: 'auto'|'hero'|'settings')` → `setOpen(true)`
- `closeModal()` → `setOpen(false)` + `sessionStorage.setItem(DISMISSED_KEY, '1')`
- `markCompleted()` → `setCompleted(true)`, `setOpen(false)`, dispatches `window.dispatchEvent(new Event('profile-stats-updated'))`
- Listens for `window.addEventListener('open-onboarding-modal', ...)` → opens modal

### `OnboardingModal.tsx` (`src/components/onboarding/OnboardingModal.tsx`, 243 lines, full read)
- `CalScreen` union: `'intro'|'role'|'context'|'goal'|'timeline'|'flow_intro'|'q0'|'q1'|'q2'|'q3'|'reading'|'results'`
- `screenToPose(screen)` maps screen → `HatchImageState`: results→celebrating, reading→reviewing, q0-q3→writing, flow_intro→presenting, goal/timeline→thinking, role/context→listening, default→wave
- `SCREEN_PANEL_COPY` — one line of copy per screen for the left welcome panel (exact strings in file)
- `WelcomePanel` (left pane, 30% width desktop): "Welcome to HackProduct" heading, body copy, `HatchImage` at 150px, footnote note
- **Value-first variant** (`valueFirst===true`): 2-col dialog (`sm:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]`), left = `WelcomePanel` (pose="wave", footnote "One tap. Under a minute to your first rep."), right = `<QuickRoleSelect onRouted={handleQuickStartRouted} onSkip={closeModal} />`
- **Full variant**: desktop 2-pane grid `sm:grid-cols-[3fr_7fr]` (WelcomePanel + `CalibrationFlowWrapper`); mobile: slim mascot banner + form below
- `handleComplete(path, slug?)`:
  - `'flow'` → `closeModal()` + `window.dispatchEvent(new CustomEvent('open-flow-explorer'))`
  - `'tour'` → `closeModal()`, `router.push('/dashboard')`, `window.dispatchEvent(new Event('start-intro-tour'))`
  - `'plan'` + slug → `router.push('/explore/plans/'+slug)`
  - `'challenge'` → `router.push('/challenges')`
  - default → `router.push('/dashboard')`
- `CalibrationFlowWrapper` listens for `'calibration-screen-change'` CustomEvent (fired by `CalibrationFlow`) to sync `currentScreen` for the pose/copy panel
- Close button hidden during `screen === 'reading'` (`showCloseButton`)

### `CalibrationFlow.tsx` (`src/components/onboarding/CalibrationFlow.tsx`, 1112 lines, full read)

**State types**: `RoleContext = 'engineer_pm_interview'|'engineer_on_job'|'both'`, `PrimaryGoal = 'land_pm_adjacent'|'level_up_current'|'ship_better'|'explore'`, `PrepTimeline = 'lt_1mo'|'1_3mo'|'gt_3mo'|'no_timeline'`

**Screen sequence** (`CAL_SCREENS`): `intro → role → context → goal → timeline → flow_intro → q0 → q1 → q2 → q3 → reading → results`

| Screen | Content | Options (exact strings) |
|---|---|---|
| `intro` | "Let me figure out where you are." / "4 choices. Product, systems, data, SQL, code.<br/>No wrong answers, just honest ones." | Button: "Let's go" |
| `role` | "What's your primary role?" | `ROLES`: Software Engineer, Data Engineer, ML Engineer, DevOps / Platform, Eng Manager, Founding Engineer, Tech Lead, Product Manager, Designer, Data Scientist (ids: swe, data_eng, ml_eng, devops, em, founding_eng, tech_lead, pm, designer, data_scientist) |
| `context` | "What brings you here right now?" | `CONTEXT_OPTIONS`: "Prepping for PM-style interviews" (engineer_pm_interview), "Sharpening product thinking on the job" (engineer_on_job), "Both, honestly" (both) |
| `goal` | "What does winning look like in the next few months?" | `GOAL_OPTIONS`: "Land a PM or PM-adjacent role" (land_pm_adjacent), "Get promoted in my current eng role" (level_up_current), "Make sharper product calls at work" (ship_better), "Just exploring product thinking" (explore) |
| `timeline` | "How soon does this matter?" | `TIMELINE_OPTIONS`: "Within a month" (lt_1mo, revealCompany:true), "One to three months" (1_3mo, revealCompany:true), "Longer than that" (gt_3mo, false), "No fixed timeline" (no_timeline, false); if revealCompany, shows optional company `<input id="target-company-input">` + "Continue" button |
| `flow_intro` | "Now the fun part." / 4-scenario intro copy | Button: "Begin" |
| `q0`-`q3` | FLOW move questions from `QUESTIONS` (see below) | 4 options per Q (A/B/C/D) |
| `reading` | Cycles `READING_PHRASES = ['Reading your answers…', 'Mapping your instincts…', 'Almost done…']` every 700ms | — |
| `results` | Archetype chip, 4 FLOW score boxes, Hatch observation, CTAs | see below |

**Results CTAs** (exact):
- "Start my first challenge" → `handleComplete('challenge')`
- "See my study plan" (only if `results.personalised_plan_slug` set) → `handleComplete('plan')`
- "Explore what FLOW is" → `handleComplete('flow')`
- "Take me around" (tour icon) → `handleComplete('tour')`

**Data source for Q0-Q3**: `src/lib/calibration/questions.ts` (161 lines, full read)
```ts
export interface CalibrationOption { id: 'A'|'B'|'C'|'D'; text: string; quality: OptionQuality }
export interface CalibrationQuestion { move: 'frame'|'list'|'optimize'|'win'; scenario: string; q: string; hatch: string; options: CalibrationOption[] }
export const QUESTIONS: CalibrationQuestion[] // 4 questions, one per move, each with scenario text, question, Hatch coaching note, and 4 options tagged best/good_but_incomplete/surface/plausible_wrong
export const QUESTIONS_BY_MOVE = { frame, list, optimize, win }
export const FEEDBACK_BY_TIER: Record<OptionQuality, string> // one Hatch one-liner per quality tier, shown as micro-feedback after each answer
```

**Persistence**:
- Resume-on-mount: `getOnboardingState<CalibrationStateData>()` → if `state.step === '/calibration'`, restores `screen, selectedRole, roleContext, primaryGoal, prepTimeline, targetCompany, answers`
- Debounced (400ms) autosave: `saveOnboardingState('/calibration', {screen, selectedRole, roleContext, primaryGoal, prepTimeline, targetCompany, answers})`
- Emits `window.dispatchEvent(new CustomEvent('calibration-screen-change', {detail: screen}))` on every screen change (consumed by `OnboardingModal`)
- PostHog: `trackEvent(EVENT_ONBOARDING_STEP, {step: screen, step_index})` on every screen transition

**Profile write (mid-flow)** — `postProfileData()` fires once when leaving `timeline` screen (or via "Continue" for company-reveal path):
```ts
POST /api/onboarding/profile
body: { role, role_context, primary_goal, prep_timeline, target_company, interview_date? }
// interview_date auto-computed as now+21 days when prepTimeline === 'lt_1mo'
```
`/api/onboarding/profile/route.ts` (partially read): accepts `{role_context, experience_level, calibration_answers}` (note: schema differs slightly from what CalibrationFlow posts — only `role_context`/`experience_level`/`calibration_answers` are validated; `role`/`primary_goal`/`prep_timeline`/`target_company`/`interview_date` fields sent by CalibrationFlow are not in this route's `RequestSchema` — **flag for implementer**, verify against `/api/onboarding/profile/route.ts` directly if behavior matters). Sets `profiles.onboarding_completed_at`, upserts `onboarding_responses`, deletes `onboarding_state`.

**Scoring call** — `startSubmit()` kicked off the moment the 4th answer (q3) is locked, so network overlaps the reading animation:
```ts
POST /api/onboarding/calibration/submit
body: { answers, role, primary_goal, prep_timeline, role_context, target_company }
```
`src/app/api/onboarding/calibration/submit/route.ts` (full read):
- `IS_MOCK` → static mock response
- Auth required (401 if missing)
- `scoreMove(move, answerId)` per move (`@/lib/calibration/deriveArchetype`) → `scores: {frame, list, optimize, win}`
- `deriveArchetype(scores)` → `{name, description}`; `observationFor(archetype.name)` → one-line Hatch observation; `scoreToLevel(score)` → level int
- `weakestMove(scores)` → lowest-scoring move
- Inserts `calibration_attempts` (`user_id, responses_json, status:'complete', scores_json, percentile`), computes real percentile via `computeRealPercentile()` (compares against all other `calibration_attempts` averages)
- Parallel writes: `profiles` update (`buildCalibrationPersistencePayload` from `@/lib/onboarding/calibration-submit`), `onboarding_responses` upsert, `onboarding_state` delete, `move_levels` upsert (per move: `level, progress_pct:0, xp:0`), `learner_competencies` upsert (6 competencies seeded at `score:50, total_attempts:0, trend:'steady'`), `hatch_context` insert (calibration observation)
- `computePersonalisedPlanSlug({role, primaryGoal, prepTimeline})` (`@/lib/onboarding/calibration-submit`) then verified against `study_plans` (`slug, is_published=true`) — nulled if no match, so results CTA never 404s
- Writes `profiles.interview_meta.preferred_move` (+ `target_company` if given)
- Fire-and-forget: embeds `interview_date`/`target_company` context via `embedAndStoreContext()`; PostHog `EVENT_CALIBRATION_COMPLETED`
- **Response**: `{attempt_id, scores, percentile, archetype, archetype_description, weakness_move, onboarding_completed_at, starting_levels: {frame,list,optimize,win}, hatch_observation, personalised_plan_slug}`

**Auto-enrol**: handled inside the same submit route via `computePersonalisedPlanSlug` + `study_plans` lookup (no separate enrol call/table found in this route — study plan auto-enrollment referenced in project memory happens via `personalised_plan_slug` being surfaced to the results CTA, not a distinct `study_plan_enrollments` write in this file).

**Completion** — `handleComplete(path)` in CalibrationFlow: `POST /api/onboarding/complete` then `clearOnboardingState()`, then calls `onComplete?.(path, results?.personalised_plan_slug ?? null)`.
`src/app/api/onboarding/complete/route.ts` (full read): body `{role_context?, experience_level?, calibration_answers?}` (zod, all optional); sets `profiles.onboarding_completed_at = now()` (+ `role_context` if given) via upsert; deletes `onboarding_state`; upserts `onboarding_responses` if `role_context && experience_level` given; logs `onboarding.completed`; returns `{success:true, level}`.

### `QuickRoleSelect.tsx` (`src/components/onboarding/QuickRoleSelect.tsx`, 125 lines, full read)
- One-tap role picker behind `onboarding_value_first` flag. Same 10 `ROLES` list (label only, no icon needed here) as CalibrationFlow.
- `handleSelect(roleId)`:
  ```ts
  POST /api/onboarding/quick-start
  body: { role: roleId }
  → { success, challenge_href }
  ```
  On success or failure (fallback `FIRST_REP_FALLBACK_HREF`), calls `trackEvent(EVENT_FIRST_REP_ROUTED, {role, challenge_href})` then `onRouted(challengeHref)`
- "Skip for now" button → `onSkip()`

**`src/app/api/onboarding/quick-start/route.ts`** (full read):
- `RequestSchema = z.object({ role: z.enum(VALID_ONBOARDING_ROLES) })`
- Sets `profiles.{preferred_role, onboarding_completed_at: now, updated_at: now}` — same completion flag as full calibration, so all downstream readers (dashboard, proxy) keep working
- Deletes any partial `onboarding_state` draft
- Logs `onboarding.quick_start`
- Resolves `getCuratedFirstRepSlug(role)` → looks up `challenges` (`id, slug, challenge_type, display_number`, `is_published=true`) → `challengePath(challengeRow)` else `FIRST_REP_FALLBACK_HREF`
- **Response**: `{success:true, challenge_href}`

### `src/app/api/onboarding/*` routes — full list & status
| Route | Read status | Summary |
|---|---|---|
| `calibration/submit/route.ts` | full | see above |
| `complete/route.ts` | full | see above |
| `quick-start/route.ts` | full | see above |
| `profile/route.ts` | partial | schema `{role_context?, experience_level?, calibration_answers?}`; sets `onboarding_completed_at`, upserts `onboarding_responses` |
| `role/route.ts` | not read | — |
| `state/route.ts` | not read | backs `getOnboardingState`/`saveOnboardingState`/`clearOnboardingState` client helpers (`@/lib/onboarding/state-client`) — table `onboarding_state` |
| `results/route.ts` | not read | — |
| `hatch-intro/route.ts` | not read | — |

### `src/proxy.ts` (full read) — onboarding/route enforcement
- **No `onboarding_completed_at` gating exists in proxy.ts.** Comment at L167: "Authenticated users can access all app routes freely. The dashboard owns the calibrated/uncalibrated experience." Onboarding is enforced at the UI level (dashboard state + `OnboardingModalContext`), not the proxy.
- Route lists actually present (contradicts task's assumed `MARKETING_ROUTES`/`AUTH_ROUTES`/`APP_PUBLIC_ROUTES` all living in proxy.ts):
  - `MARKETING_ROUTES`, `AUTH_ROUTES`, `EXACT_MARKETING_ROUTES`, `PUBLIC_SCORECARD_ROUTE` are imported from **`@/lib/routes/public`** (shared with client-side `V3AuthGate`), not defined inline in proxy.ts
  - `APP_PUBLIC_ROUTES = ['/canvas-harness']` (L27) — defined inline in proxy.ts, minimal
  - `AUTH_CALLBACK_ROUTES = ['/auth/callback']`, `WAITLIST_ROUTES = ['/waitlist','/waitlist-quick','/waitlist-flow']` (L24, L55) — also inline
- Special redirect: `pathname === '/marketing'` or `/marketing/*` → 308 redirect stripping the `/marketing` prefix (legacy path cleanup)
- Root `/`: authenticated → redirect to `/dashboard`; unauthenticated → serve landing page
- `isPureMarketing` routes short-circuit before Supabase auth call entirely (fail-open by design)
- Prefetch requests (`next-router-prefetch`/`purpose: prefetch` headers) skip auth validation except for admin UI
- No `(onboarding)` route group exists in the app router — onboarding is entirely modal-based (`OnboardingModal` + `OnboardingModalProvider`), confirmed by earlier `find` showing no `(onboarding)` directory.

---

## 5. LANDING

**Correction to task assumption**: there is no `src/app/(marketing)/page.tsx`. The actual root landing page is **`src/app/page.tsx`**:
```tsx
import { V5LandingPage, v5LandingMetadata } from '@/components/landing-v5/V5LandingPage'
import '@/app/(marketing)/v5-landing/v5-landing.css'
export const metadata = v5LandingMetadata
export default function RootPage() { return <V5LandingPage /> }
```
The `(marketing)` route group exists for other pages (pricing, blog, about, etc.) and supplies the shared CSS file `v5-landing.css`, but the `/` route itself is served by the app-root `page.tsx`, not a page inside `(marketing)`. `proxy.ts` also 308-redirects any stray `/marketing` or `/marketing/*` hit to the equivalent non-prefixed path.

### `V5LandingPage.tsx` (`src/components/landing-v5/V5LandingPage.tsx`, full read) — composition root
```tsx
<div className="v5">
  <JsonLdScript data={[organizationJsonLd(), websiteJsonLd(), softwareJsonLd]} />
  <V5Header />
  <main>
    <V5Hero />
    <V5PracticeGrid />
    <V5Grading />
    <V5AIWork />
    <V5Pricing />
  </main>
  <V5Footer />
  <V3AuthGate />  {/* handles 'open-auth-modal' events fired by header/hero/footer CTAs */}
</div>
```
- Metadata: `v5LandingTitle = 'HackProduct | Practical Learning for Tech Professionals'`, `v5LandingDescription` (full copy in file), `v5LandingKeywords` array
- `softwareJsonLd`: SoftwareApplication schema with Pro Monthly ($39) / Annual ($199) offers pointing at `/pricing?plan=monthly|annual`

### `V5Header.tsx` (full read) — marketing nav
- `V5Brand` (logo component, not read)
- Desktop nav: `Home` (/), `Practice` dropdown (`NavDropdown`, links: Coding/DSA `/challenges?type=algorithm`, SQL & Data `/challenges?type=sql`, System Design `/challenges?type=system_design`, Product Judgment `/challenges?type=product_sense`, AI-Directed Analytics `/claude-code-analytics`; "View all →" → `/practice`), `Library` dropdown (Autopsies `/autopsies`, Study plans `/study-plans`, Glossary `/glossary`, Blog `/blog`, Interviews `/interviews/live-ai-interviews`; "View all →" → `/explore`), `Progress` (/progress)
- Header actions: "Log in" (`onClick={openLogin}` → `window.dispatchEvent(new CustomEvent('open-auth-modal', {detail:{mode:'login'}}))`), "Start practicing" CTA (`onClick={openSignup}` → same event, `mode:'signup'`)
- Mobile: hamburger menu (`MenuIcon`/`CloseIcon`), full-screen `mobile-menu` overlay with same links + "Start practicing" button

### `V5Hero.tsx` (full read) — hero
- Headline (h1): "Practice for<br/>engineering<br/>interviews that<br/>test *more than code.*"
- Kicker: "✣ ACE INTERVIEWS. BUILD WHAT'S NEXT."
- Sub-copy (lede): "Practical learning for software engineers, tech leads, staff engineers, EMs, AI engineers and FDEs across coding, SQL, system design, product judgment and AI-directed work."
- **Role chips** (`roles` array, hover/focus/click emits `hp-role-focus` CustomEvent consumed by `V5PracticeGrid` to highlight matching practice areas):
  ```ts
  const roles = [
    { label: "SWE", value: "Software Engineer" },
    { label: "Staff Engineer", value: "Staff Engineer" },
    { label: "FDE", value: "Forward-Deployed Engineer" },
    { label: "AI Engineer", value: "AI Engineer" },
    { label: "Tech Lead", value: "Tech Lead" },
    { label: "EM", value: "Engineering Manager" },
  ]
  ```
  `emitRole(role)` → `window.dispatchEvent(new CustomEvent("hp-role-focus", {detail: role}))`
- **CTAs**: "Start a practice session" (`onClick={openSignup}` → `open-auth-modal` signup event) + "See how review works" (`href="#grading"`, anchors to `V5Grading` section)
- **3D Hatch asset**: `<Image src="/landing-v5/hatch-transparent.png" alt="" width={585} height={751} priority />` inside `.hero-reference-hatch.hero-reference-layer-hatch` — pointer-parallax driven by `visualRef` mousemove handler setting CSS vars `--mx`/`--my` (disabled if `prefers-reduced-motion`)
- **Feedback card mock**: `<article className="hero-reference-review" aria-label="Example review feedback">` — decorative, not interactive: header "SYSTEM DESIGN • URL SHORTENER", score ring `86`, strengths list (Clarified traffic assumptions / Separated read/write paths / Explained caching tradeoff), needs-work tags (Failure recovery, Consistency model), "View full feedback" link (`href="#grading"`)
- Also a floating "note" bubble: "You chose eventual consistency. **Defend that decision.**"
- `dimensions` array (dimension-breakdown aside): System Design 88, Product Judgment 84, Scalability 82, Tradeoffs 80, Failure handling 86 — all hardcoded illustrative numbers, no live data source

### `V5PracticeGrid.tsx` (full read) — practice areas grid
- `areas`: Coding/DSA (`/challenges?type=algorithm`), SQL & Data (`/challenges?type=sql`), System Design (`/challenges?type=system_design`), Product Judgment (`/challenges?type=product_sense`), AI-Directed Analytics (`/claude-code-analytics`) — each with icon, title, 2-line desc
- Listens for `hp-role-focus` (from `V5Hero` role chips) → highlights areas matching `roleAreas[activeRole]` map, dims the rest (`is-role-active`/`is-role-muted` classes)

### `V5Grading.tsx` (full read) — "how review works"
- Heading "See how your reasoning is reviewed."; check-list of 3 bullets
- Mock product panel: score ring `87/100`, dimension bars (`Framing & scoping 90, Architecture 85, Tradeoffs 80, Failure modes 76, Failure handling 95`), 3 feedback cards (`positive`/`improve`/`question` variants) — same "illustrative, not live data" pattern as hero
- "New practice" link → `/practice`

### `V5AIWork.tsx`, `V5Pricing.tsx` (grepped, not fully read)
- `V5AIWork.tsx`: contains an "agent-status" mock line ("User corrected aggregation") — AI-directed work demo section; no proof-row numbers found
- `V5Pricing.tsx` (partial read, first 50 lines): uses `usePlanPrices()` (`@/lib/billing/use-plan-prices`, live-fetches `/api/billing/prices`, seeded with static fallback) and `usePlanLimits()` (`@/lib/usage/use-plan-limits`, 60s-cached) — **never hardcodes limit/price numbers**, per CLAUDE.md rule. Shared annual/monthly toggle (`annual` state) drives both Pro and Analytics tier cards. `PricingCta` component from `landing-v3` reused here.

### `V5Footer.tsx` (full read)
- Final CTA block: Hatch image, "SEE HOW HACKPRODUCT REVIEWS YOUR WORK" eyebrow, "Start with one practice session." heading, "Start a practice session" button (`onClick={openSignup}`)
- Footer nav: "How it works" (`#grading`), "Practice areas" (`/practice`), "Pricing" (`/pricing`), "AI workflows" (`/claude-code-analytics`)
- Copyright: `© {year} HackProduct`

### Proof row / social-proof numbers
**No dedicated proof-row / social-proof-numbers component exists on the current landing page.** The only numeric "proof" elements are the illustrative mock scores/dimension percentages hardcoded in `V5Hero.tsx` and `V5Grading.tsx` (listed above) — not sourced from any live metrics table or API. If the plan requires a real proof row, it will need to be built from scratch; there is nothing to reuse.

### Cookie banner — `src/components/legal/CookieBanner.tsx` (full read)
- Mounted in root layout (`src/app/layout.tsx` L7 import, L129 render) — global, not landing-specific
- Visibility: `localStorage.getItem(COOKIE_CHOICE_STORAGE_KEY)` checked via `isCookieChoice()` (`@/lib/privacy/cookies`) on mount (`queueMicrotask`)
- `choose(choice: 'essential'|'all')`: `localStorage.setItem(COOKIE_CHOICE_STORAGE_KEY, choice)`, dispatches `window.dispatchEvent(new CustomEvent(COOKIE_CHOICE_EVENT, {detail: choice}))`, hides banner
- Buttons: "Essential only" (`choose('essential')`), "Accept all" (`choose('all')`)
- Copy: "Cookie choices" / "HackProduct uses essential storage for login, security, billing, and core product state. Optional analytics help us see what needs fixing."

### Marketing icons/motion helpers
- `src/components/landing-v5/icons.tsx` — `ArrowIcon`, `CloseIcon`, `MenuIcon`, `CheckIcon`, `AgentIcon`, `CodeIcon`, `JudgmentIcon`, `SqlIcon`, `SystemIcon` (not individually read, names confirmed via imports)
- `src/components/landing-v5/motion.tsx` — `Reveal` component (scroll-reveal wrapper, used in Footer/Grading)
- `src/components/landing-v5/V5Brand.tsx` — logo/brand mark (not read)

### Legacy `src/components/marketing/*` (NOT used by current landing page)
Files exist (`CyclingText, FailurePatternGrid, FloatingNav, GradientFooter, InlinePricing, InteractiveDemo, LandingHero, LogoMarquee, ModesShowcase, OutcomePage, SocialProof, UpgradeButton, WaitlistCountdown, WaitlistForm`) but are **not imported by `V5LandingPage.tsx`** — likely legacy/pre-v5 components or used only on the waitlist routes. Flagged so the implementer does not mistake these for the live landing page's components. `SocialProof.tsx` in particular may be worth checking directly if a "proof row" needs a template to start from, but it is not currently wired into `/`.

---

## Flags for implementer (open questions / discrepancies found)

1. **Task assumed `(marketing)/page.tsx` is the landing page** — it doesn't exist. Root `/` is `src/app/page.tsx` → `V5LandingPage`.
2. **`proxy.ts` has no onboarding-completion gating** and no `(onboarding)` route group — onboarding enforcement is UI-level only (dashboard + `OnboardingModalContext`), contrary to the task's assumed proxy-level enforcement.
3. **`MARKETING_ROUTES`/`AUTH_ROUTES` live in `@/lib/routes/public`**, not inline in `proxy.ts`; only `APP_PUBLIC_ROUTES`, `AUTH_CALLBACK_ROUTES`, `WAITLIST_ROUTES` are defined inline there.
4. **`/api/onboarding/profile/route.ts` schema mismatch**: `CalibrationFlow.tsx`'s `postProfileData()` POSTs `{role, role_context, primary_goal, prep_timeline, target_company, interview_date}`, but the route's `RequestSchema` (as read) only validates `{role_context, experience_level, calibration_answers}`. Re-verify this route directly before relying on it — could be a stale read or an actual latent bug.
5. **No proof-row/social-proof numbers component exists** on the current landing page — only decorative mock scores in Hero/Grading. Must be built new if required.
6. **`PastSessionsTable`'s per-row Debrief/resume href logic** was not captured past L1005 of `LiveInterviewsShell.tsx` — re-grep that file for the row-click handler before implementing.
7. Not deep-read: `debrief/page.tsx`, most of `src/lib/live-interview/*`, `src/app/api/onboarding/{role,state,results,hatch-intro}/route.ts`, `V5AIWork.tsx`/`V5Pricing.tsx` bodies past line ~50, `icons.tsx`/`motion.tsx`/`V5Brand.tsx` internals.
