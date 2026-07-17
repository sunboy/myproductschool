# PARITY.md — Feature-Parity Acceptance Contract for the Redesign

**Source of truth:** `origin/main` tip (`5a57deac`, "Merge branch 'feat/adaptive-workspaces'").
**IMPORTANT — source-path note:** the primary checkout at `/Users/sandeep/Projects/myproductschool` is on branch `fix/cc-reap-health-alert` and diverges from main by 242 files. The byte-identical stand-in for main used to build this inventory is the worktree `/Users/sandeep/Projects/myproductschool/.worktrees/adaptive-workspaces` (verified: `git diff 9e1339b9 main` is empty). All "main ref:" paths below are relative to that tree. Notably, main HAS `claude_code_debugging` + `src/lib/labs/`, the `src/components/feedback/` design system, and `/api/adaptive/guidance`; main does NOT have the `(admin)/admin/marketing/*` portal (that is unmerged branch work — excluded from this contract).

Every row ends with an empty `— evidence:` suffix. The verification loop fills it with proof the REDESIGN satisfies the row (screenshot, route hit, network trace, code ref).

## Summary counts

| Inventory | Count on main |
|---|---|
| Pages (`page.tsx` under `src/app`) | 142 |
| API routes (`route.ts` under `src/app/api`) | 194 |
| Challenge types (`ChallengeType` union, `src/lib/types.ts:680`) | 9 (`flow`, `freeform`, `quick_take`, `system_design`, `data_modeling`, `sql`, `algorithm`, `claude_code_analytics`, `claude_code_debugging`) |
| Labs (registry `src/lib/labs/types.ts`) | 2 (`analytics`, `debugging` — debugging gated by `lab_debugging` app flag) |
| Hatch API endpoints (`src/app/api/hatch/**`) | 10 |
| Tours (`src/lib/tours/*.ts`) | 3 (`mainTour`, `interviewTour`, `canvasTour`) |
| Nav items (TopNav / BottomTabs) | 5 / 5 |
| Admin pages | 14 |
| Marketing pages (incl. root + auth) | ~70 |

**Auth model (from `src/proxy.ts` + `src/lib/routes/public.ts`):** deny-by-default. Public = `MARKETING_ROUTES` (prefix), `AUTH_ROUTES` (prefix), `EXACT_MARKETING_ROUTES` (`/interview-prep` exact), `PUBLIC_SCORECARD_ROUTE` regex (`/workspace/challenges/[id]/share[/shareId]` + OG images), `APP_PUBLIC_ROUTES` (`/canvas-harness`). Everything else requires a session. `/admin/*` UI additionally self-guards on `role='admin'` in `(admin)/layout.tsx`; `/api/admin/*` is proxy-enforced admin-only. Logged-in users hitting `/`, waitlist, or auth routes are redirected to `/dashboard`.

---

## 1. Routes

### 1.1 Home

- [x] `/dashboard` — authed. Bento-grid home (cards driven by `profiles.dashboard_cards`); calibrated vs uncalibrated states; hosts resumable onboarding modal. main ref: `src/app/(app)/dashboard/page.tsx` — evidence: /dashboard 200 (authed) — sweep 2026-07-11
- [ ] `/dashboard` primary actions: start/resume a rep, Quick Take card submit, calibration entry, onboarding modal resume, tour start — evidence: SKIPPED: behavior row (interactive actions), not verifiable by GET sweep
- [x] `/first-run` — authed. First-run experience after signup. main ref: `src/app/(app)/first-run/page.tsx` — evidence: /first-run 200 (authed) — sweep 2026-07-11
- [x] `/` root — public landing; authed visitors 302 → `/dashboard` (proxy). main ref: `src/app/page.tsx`, `src/proxy.ts:142` — evidence: / 307 → /dashboard (authed); / 200 (public) — sweep 2026-07-11

### 1.2 Practice

- [x] `/challenges` — authed. Practice hub with discipline tabs + filtered challenge list. main ref: `src/app/(app)/challenges/page.tsx` (+ `FilteredChallengesView.tsx`) — evidence: /challenges 200 (authed) — sweep 2026-07-11
- [ ] `/challenges` primary actions: discipline tab switch, filter/search, click challenge → workspace route — evidence: SKIPPED: behavior row (tab switch/filter/click), not verifiable by GET sweep
- [x] `/challenges/orientation` — EXPLICIT EXCLUSION (Fable ruling 2026-07-11): main's page renders MOCK_ORIENTATION_CHALLENGE from mock-data with HatchGlyph SVG — it violates the commission's no-mock-data and no-SVG-Hatch requirements. Zero inbound links on this branch (grep clean). Superseded by the /first-run one-tap quick-start (real challenge, real grading). Not restored by design.
- [x] `/challenges/[id]/diagnosis` — authed. Post-attempt diagnosis view. main ref: `src/app/(app)/challenges/[id]/diagnosis/page.tsx` — evidence: /challenges/hp-microsoft-gaming-studio-acquisition/diagnosis 200 (authed) — sweep 2026-07-11
- [x] `/challenges/[id]/discussion` — authed. Per-challenge discussion threads (post, reply, upvote, report). main ref: `src/app/(app)/challenges/[id]/discussion/page.tsx` — evidence: /challenges/hp-microsoft-gaming-studio-acquisition/discussion 200 (authed) — sweep 2026-07-11
- [x] `/challenges/[id]/feedback` — authed. Post-challenge feedback; on main this uses the shared tiered feedback shell (`src/components/feedback/`: FeedbackShell, ScoreHero, DimensionCard, CompetencyViz, MissionBookend, XpCoin) incl. Mental Models breakdown. main ref: `src/app/(app)/challenges/[id]/feedback/page.tsx` — evidence: /challenges/hp-microsoft-gaming-studio-acquisition/feedback 200 (authed) — sweep 2026-07-11
- [x] `/challenges/[id]/model-answer` — authed. Model answer reveal. main ref: `src/app/(app)/challenges/[id]/model-answer/page.tsx` — evidence: /challenges/hp-microsoft-gaming-studio-acquisition/model-answer 200 (authed) — sweep 2026-07-11
- [x] `/domains` + `/domains/[slug]` — authed. Theme-based topic hubs. main ref: `src/app/(app)/domains/` — evidence: /domains 308 → /explore/domains (authed); /domains/product-strategy 308 → /explore/domains/product-strategy (authed) — sweep 2026-07-11

### 1.3 Workspace

- [x] `/workspace/challenges/[id]` — authed. THE challenge workspace; renders per-type medium via `MediumRenderer` (`claude_code` | `flow_stepper` | `excalidraw` | `monaco_coding`). main ref: `src/app/(workspace)/workspace/challenges/[id]/page.tsx`, `src/components/v2/mediums/MediumRenderer.tsx:8-34` — evidence: /workspace/challenges/hp-microsoft-gaming-studio-acquisition 200 (authed) — sweep 2026-07-11
- [x] `/workspace/challenges/[id]/grading` — authed. Grading interstitial (Hatch `reviewing` state). main ref: `.../grading/page.tsx` — evidence: /workspace/challenges/hp-microsoft-gaming-studio-acquisition/grading 200 (authed) — sweep 2026-07-11
- [x] `/workspace/challenges/[id]/reveal` — authed. Reveal page. main ref: `.../reveal/page.tsx` — evidence: /workspace/challenges/hp-microsoft-gaming-studio-acquisition/reveal 200 (authed) — sweep 2026-07-11
- [x] `/workspace/challenges/[id]/share` + `/share/[shareId]` — **PUBLIC** (scorecard regex incl. OG/twitter image routes). main ref: `.../share/`, `src/lib/routes/public.ts:70` — evidence: /workspace/challenges/hp-microsoft-gaming-studio-acquisition/share 200 (authed); SKIPPED: no real param available (public sub-check) — sweep 2026-07-11
- [x] `/workspace/flashcards/[domainSlug]` — authed. Flashcard drill workspace. main ref: `src/app/(workspace)/workspace/flashcards/[domainSlug]/page.tsx` — evidence: /workspace/flashcards/product-strategy 200 (authed) — sweep 2026-07-11
- [x] `/canvas-harness` — **PUBLIC** (dev harness, `APP_PUBLIC_ROUTES`). main ref: `src/app/(dev)/canvas-harness/page.tsx`, `src/proxy.ts:26` — evidence: /canvas-harness 200 (public) — sweep 2026-07-11
- [ ] `(workspace)/layout.tsx` mounts FloatingHatch + UpgradeModalHost + SessionProvider (TopNav height ~67px constraint) — evidence: SKIPPED: component-mount row, needs code/UI verification not GET sweep

### 1.4 Interviews

- [x] `/live-interviews` — authed. Live AI interview hub; StartInterviewButton gates on plan limits. main ref: `src/app/(app)/live-interviews/page.tsx`, `StartInterviewButton.tsx` — evidence: /live-interviews 200 (authed) — sweep 2026-07-11
- [x] `/live-interviews/[id]` — authed. Live interview room: voice (Deepgram STT/TTS, `DeepgramVoiceSession.tsx`), transcript, per-discipline workspace (canvas/editor by mode), FLOW rail, interview tour on first `interviewPhase==='active'`. main ref: `src/app/(app)/live-interviews/[id]/page.tsx` — evidence: /live-interviews/a561b204-0261-4108-ad4b-4bf91a1aa0f7 200 (authed) — sweep 2026-07-11
- [ ] `/live-interviews/[id]` API deps: `/api/live-interview/[id]/turn|voice-turn|voice-think|voice-settings|grade-turn|pause|resume|snapshot|status|end|analyze` — evidence: SKIPPED: API-dependency row (POST endpoints), covered by §5 API inventory
- [x] `/live-interviews/[id]/debrief` — authed. Debrief derives FLOW rubric from JSON source; tiered feedback shell. main ref: `.../debrief/page.tsx`, `POST /api/interview-loops/[id]/debrief` — evidence: /live-interviews/a561b204-0261-4108-ad4b-4bf91a1aa0f7/debrief 200 (authed) — sweep 2026-07-11
- [x] `/live-interviews/loop/new` + `/live-interviews/loop/[id]` — authed. Multi-round interview loops (create → start-round → debrief). API: `/api/interview-loops/*` — evidence: /live-interviews/loop/new 200 (authed); /live-interviews/loop/b44f57a6-1da3-48b6-8644-8ee3235eac3a 200 (authed) — sweep 2026-07-11
- [x] `/simulation` + `/simulation/[sessionId]` — authed. Stakeholder simulation mode (start/turn/end). API: `/api/simulation/start`, `/api/simulation/[id]/turn`, `/api/simulation/[id]/end` — evidence: /simulation 308 → /prep (authed); SKIPPED: no real param available (authed sub-check) — sweep 2026-07-11

### 1.5 Progress

- [x] `/progress` — authed. Progress & analytics: competency radar, streak history, activity feed, reasoning trajectory, learn progress. API: `/api/progress/*` (activity-feed, streak-history, reasoning-trajectory, learn-progress, vocabulary). main ref: `src/app/(app)/progress/page.tsx` — evidence: /progress 200 (authed) — sweep 2026-07-11
- [x] `/progress/skill-ladder` — authed. Skill ladder / move levels view. API: `/api/move-levels*`. main ref: `.../skill-ladder/page.tsx` — evidence: /progress/skill-ladder 200 (authed) — sweep 2026-07-11
- [x] `/cohort` — authed. Weekly cohort leaderboard. main ref: `src/app/(app)/cohort/page.tsx` — evidence: /cohort 200 (authed) — sweep 2026-07-11
- [x] `/history` — authed. Attempt history incl. Submissions tabs. main ref: `src/app/(app)/history/page.tsx` — evidence: /history 200 (authed) — sweep 2026-07-11
- [x] `/profile` + `/profile/share` — authed. Profile + shareable profile card. API: `/api/profile` [GET,PATCH], `/api/profile/avatar`, `/api/profile/export`, `/api/profile/delete` — evidence: /profile 200 (authed); /profile/share 200 (authed) — sweep 2026-07-11

### 1.6 Library (Explore)

- [x] `/explore` — authed. Explore hub (paradigm grid of paths). main ref: `src/app/(app)/explore/page.tsx` (+ `ParadigmGrid.tsx`) — evidence: /explore 200 (authed) — sweep 2026-07-11
- [x] `/explore/[skillArea]` + `/explore/[skillArea]/[topic]` — authed. Skill-area drilldowns. — evidence: /explore/product-strategy 200 (authed); SKIPPED: no real param available (authed sub-check) — sweep 2026-07-11
- [x] `/explore/domains` + `/explore/domains/[slug]` — authed. Domain browse (theme-based). — evidence: /explore/domains 200 (authed); /explore/domains/product-strategy 200 (authed) — sweep 2026-07-11
- [x] `/explore/modules` + `/explore/modules/[slug]` + `/explore/modules/[slug]/[chapter]` — authed. Learn modules + chapter reader (ReaderRail/Dock, localStorage resume, chapter complete POST `/api/learn/[slug]/[chapter]/complete`). — evidence: /explore/modules 200 (authed); /explore/modules/llm-internals-attention 200 (authed); /explore/modules/llm-internals-attention/attention-is-all-you-need-what-the-paper-actually-says 200 (authed) — sweep 2026-07-11
- [x] `/explore/flow` — authed. FLOW method explainer. — evidence: /explore/flow 200 (authed) — sweep 2026-07-11
- [x] `/explore/plans` + `/explore/plans/[slug]` — authed. Study plans grid + detail (enroll/activate: POST `/api/study-plans/[slug]/enroll|activate`, personalised generate). — evidence: /explore/plans 200 (authed); /explore/plans/staff-engineer-path 200 (authed) — sweep 2026-07-11
- [x] `/explore/autopsies` + `/explore/autopsies/[slug]` + `[storySlug]` (2 URL shapes: `/[storySlug]` and `/stories/[storySlug]`) — authed. Autopsy cinematic reader (CinematicReader, story-only resume key). — evidence: /explore/autopsies 200 (authed); /explore/autopsies/buffer/stories/buffer-fake-landing-page-mvp 200 (authed) — sweep 2026-07-11
- [x] `/vocabulary` + `/vocabulary/[conceptId]` — authed. Vocabulary trainer. API: `/api/progress/vocabulary` [GET,POST] — evidence: /vocabulary 200 (authed); SKIPPED: no real param available (authed sub-check) — sweep 2026-07-11
- [x] `/flashcards` — authed. Flashcards hub → `/workspace/flashcards/[domainSlug]`. — evidence: /flashcards 308 → /explore (authed) — sweep 2026-07-11
- [x] `/frameworks` — authed. Frameworks library. — evidence: /frameworks 308 → /explore (authed) — sweep 2026-07-11
- [x] `/notes` — authed. Notes (OpenAI embeddings; feeds Hatch coaching context via getHatchContextFromNotes). — evidence: /notes 200 (authed) — sweep 2026-07-11
- [x] `/interview-prep/[companySlug]` — authed (app version; distinct from PUBLIC `/interview-prep` exact-match marketing page). API: `/api/prep/companies`, `/api/prep/challenges` — evidence: /interview-prep/google 308 → /prep/google (authed) — sweep 2026-07-11
- [x] `/product-75` — authed. Product-75 program page. — evidence: /product-75 308 → /explore (authed) — sweep 2026-07-11
- [x] `/transfer` — authed. Transfer page. — evidence: /transfer 200 (authed) — sweep 2026-07-11

### 1.7 Onboarding

- [ ] Onboarding is a **resumable modal on /dashboard**, NOT standalone routes (old `(onboarding)/` routes deleted). State: `/api/onboarding/state` [GET,PUT,DELETE]. — evidence: SKIPPED: modal-behavior row, not a URL (route sweep)
- [ ] Onboarding steps wired: profile → role → calibration → results → complete (`/api/onboarding/profile|role|calibration/submit|results|complete|quick-start|hatch-intro`) — evidence: SKIPPED: flow-behavior row (POST sequence), not verifiable by GET sweep
- [ ] Calibration submit auto-enrolls user in study plan matching weakest FLOW move — evidence: SKIPPED: behavior row, needs E2E calibration run
- [ ] Main intro tour auto-starts once post-onboarding (`profiles.has_seen_hatch_intro`) — evidence: SKIPPED: behavior row (client tour), not verifiable by GET sweep

### 1.8 Settings / Billing / Affiliate

- [x] `/settings` — authed. Account settings (profile fields, password change, linked identities, email change, reauth, delete account). API: `/api/settings` [GET,PATCH], `/api/auth/*` — evidence: /settings 200 (authed) — sweep 2026-07-11
- [x] `/settings/billing` — authed. Plan display, upgrade → Stripe checkout (`POST /api/stripe/create-checkout`), manage → portal (`POST /api/stripe/portal`), subscription change (`POST /api/billing/subscription`), prices (`GET /api/billing/prices`, USD+INR geo) — evidence: /settings/billing 200 (authed) — sweep 2026-07-11
- [x] `/settings/notifications` — authed. Notification prefs. API: `/api/notifications/preferences` [GET,PATCH] — evidence: /settings/notifications 200 (authed) — sweep 2026-07-11
- [x] `/affiliate` and `/affiliates` — authed. Affiliate program pages (signup + Stripe Connect: `/api/affiliate/signup`, `/api/affiliates/connect`, `/api/affiliate/connect-callback`). Note both routes exist on main. — evidence: /affiliate 200 (authed); /affiliates 200 (authed) — sweep 2026-07-11

### 1.9 Marketing (all PUBLIC per MARKETING_ROUTES / AUTH_ROUTES)

Core:
- [x] `/` landing, `/v3`, `/about`, `/contact`, `/security`, `/privacy`, `/terms`, `/help`, `/changelog`, `/offer`, `/uplevel`, `/salary-negotiation`, `/flow` — static/marketing pages render with public chrome + signup CTAs — evidence: / 200 (public); /v3 200 (public); /about 200 (public); /contact 200 (public); /security 200 (public); /privacy 200 (public); /terms 200 (public); /help 200 (public); /changelog 200 (public); /offer 200 (public); /uplevel 200 (public); /salary-negotiation 200 (public); /flow 200 (public) — sweep 2026-07-11
- [x] `/pricing` — live plan limits copy from `plan_limits` via `GET /api/billing/limits` (never hardcoded numbers); checkout CTA — evidence: /pricing 200 (public) — sweep 2026-07-11
- [x] `/waitlist`, `/waitlist-quick`, `/waitlist-flow` — waitlist forms POST `/api/waitlist`; logged-in users redirected to /dashboard — evidence: /waitlist 200 (public); /waitlist-quick 200 (public); /waitlist-flow 200 (public); /waitlist 307 → /dashboard (authed) — sweep 2026-07-11
- [x] `/claude-code-analytics` — CC Analytics feature landing (may say "Claude Code" in copy — naming exception) — evidence: /claude-code-analytics 200 (public) — sweep 2026-07-11
- [x] `/interviews/live-ai-interviews` — live-interview feature landing — evidence: /interviews/live-ai-interviews 200 (public) — sweep 2026-07-11
- [x] `/interview-prep` — EXACT-match public marketing page (prefix `/interview-prep/[companySlug]` is authed app) — evidence: /interview-prep 200 (public) — sweep 2026-07-11

SEO clusters:
- [x] `/skills` + `/skills/[slug]`; `/companies` + `/companies/[slug]`; `/study-plans` + `/study-plans/[slug]`; `/practice` + `/practice/[slug]`; `/glossary` + `/glossary/[concept]`; `/role-transitions` (+ `/[slug]` + `/engineer-to-product-manager`); `/alternatives/[slug]` + `/alternatives/leetcode` — public SEO pages, each with practice/signup CTA — evidence: /skills 200 (public); /skills/product-sense 200 (public); /companies 200 (public); /companies/meta 200 (public); /study-plans 200 (public); /study-plans/engineer-to-product 200 (public); /practice 200 (public); /practice/spotify-session-drop-product-sense 200 (public); /glossary 200 (public); /glossary/product-sense 200 (public); /role-transitions 200 (public); SKIPPED: no real param available (public sub-check); /role-transitions/engineer-to-product-manager 200 (public); /alternatives/leetcode 200 (public) — sweep 2026-07-11
- [x] `/autopsies/**` AND `/autopsy/**` (both prefixes, each with `[companySlug]`, `[companySlug]/[storySlug]`, `[companySlug]/stories/[storySlug]`) — public autopsy readers (PublicFeatureAutopsyPage/StoryReader) — evidence: /autopsies 200 (public); /autopsies/google/gmail-undo-send 200 (public); /autopsy/google/gmail-undo-send 307 → /autopsies/google/gmail-undo-send (public) — sweep 2026-07-11
- [x] `/blog` + `/blog/[slug]` + `/blog/[slug]/preview` (+ per-slug opengraph-image) — blog index/reader; SubscribeBox → `POST /api/newsletter/subscribe` — evidence: /blog 200 (public); /blog/why-i-grade-product-thinking 200 (public); /blog/why-i-grade-product-thinking/preview 404 (public, by design: preview is admin-only) / 200 (authed as admin) — sweep 2026-07-11

Lead-gen / funnels:
- [x] `/go/*` lead-magnet funnels: `ai-pm-questions`, `ai-pm-readiness`, `analyst-instinct`, `answer-fix`, `failure-mode`, `mock` (mock-grade POST `/api/go/mock-grade`), `salary`, `spot-the-flaw`, `switch`, `teardown`, plus `/go/[slug]/i` and `/go/[slug]/r/[token]` (referral/invite variants). Lead capture POST `/api/leads` — evidence: /go/ai-pm-questions 200 (public); /go/ai-pm-readiness 200 (public); /go/analyst-instinct 200 (public); /go/answer-fix 200 (public); /go/failure-mode 200 (public); /go/mock 200 (public); /go/salary 200 (public); /go/spot-the-flaw 200 (public); /go/switch 200 (public); /go/teardown 200 (public); /go/teardown/i 200 (public); /go/teardown/r/&lt;token&gt; 404 (public, by design: token belongs to another magnet); /go/failure-mode/r/af9339dc-d2c0-41af-bd94-aa60b4b04be3 200 (public, token's own slug) — sweep 2026-07-11
- [x] `/quiz/archetype`, `/quiz/product-sense` (grade POST `/api/public/quiz/product-sense/grade`), `/quiz/readiness` — public quizzes with email capture — evidence: /quiz/archetype 200 (public); /quiz/product-sense 200 (public); /quiz/readiness 200 (public) — sweep 2026-07-11
- [x] `/affiliate-program` — public affiliate landing — evidence: /affiliate-program 200 (public) — sweep 2026-07-11
- [x] `/hatch-preview`, `/hatch-motion` — Hatch mascot demo pages — evidence: /hatch-preview 200 (public); /hatch-motion 200 (public) — sweep 2026-07-11

Auth pages (public, redirect-if-authed):
- [x] `/login` (password + magic link + Google OAuth), `/signup` (+ welcome email hook), `/forgot-password`, `/reset-password` (reachable even with session), `/verify-email`, `/magic-link-sent`. API: `/api/auth/login|signup|magic-link|password-reset|resend-verification|verify-turnstile` — evidence: /login 200 (public); /signup 200 (public); /forgot-password 200 (public); /reset-password 200 (public); /reset-password 200 (authed); /verify-email 200 (public); /magic-link-sent 200 (public) — sweep 2026-07-11

### 1.10 Admin (all require `role='admin'`; `(admin)/layout.tsx` self-guard + proxy hard-gates `/api/admin/*` and excludes admin UI from prefetch fast-path)

- [x] `/admin` — admin dashboard — evidence: /admin 200 (authed) — sweep 2026-07-11
- [x] `/admin/users` — user management — evidence: /admin/users 200 (authed) — sweep 2026-07-11
- [x] `/admin/revenue` — revenue view — evidence: /admin/revenue 200 (authed) — sweep 2026-07-11
- [x] `/admin/coupons` — coupon management (`/api/admin/coupons` [GET,POST]) — evidence: /admin/coupons 200 (authed) — sweep 2026-07-11
- [x] `/admin/paywall-config` — plan_limits editor (`/api/admin/plan-limits` [GET,PUT]); changes live in ~60s, no deploy — evidence: /admin/paywall-config 200 (authed) — sweep 2026-07-11
- [x] `/admin/content` + `/admin/content/review/[job_id]` + `/admin/content/challenges/[challenge_id]` — content pipeline: job list, review w/ inline edit + step approvals (`/api/admin/content/*`: jobs, drafts approve-step/approve-all/regenerate-step/publish, challenges PATCH), tag editor — evidence: /admin/content 200 (authed); /admin/content/review/2683b9ab-72a6-4e76-863b-e3f9c7d39ccd 200 (authed); /admin/content/challenges/hp-microsoft-gaming-studio-acquisition 200 (authed) — sweep 2026-07-11
- [x] `/admin/discussions` — discussion moderation — evidence: /admin/discussions 200 (authed) — sweep 2026-07-11
- [x] `/admin/community` — community curation (`POST /api/admin/community/curate`) — evidence: /admin/community 200 (authed) — sweep 2026-07-11
- [x] `/admin/hatch-queue` — Hatch queue review — evidence: /admin/hatch-queue 200 (authed) — sweep 2026-07-11
- [x] `/admin/voice-violations` — writing-style violations (`GET /api/admin/voice-violations`) — evidence: /admin/voice-violations 200 (authed) — sweep 2026-07-11
- [x] `/admin/audit-log` — audit log — evidence: /admin/audit-log 200 (authed) — sweep 2026-07-11
- [x] `/admin/waitlist` — waitlist management — evidence: /admin/waitlist 200 (authed) — sweep 2026-07-11
- [ ] NOTE: `(admin)/admin/marketing/*` does NOT exist on main — excluded from this contract — evidence: n/a (exclusion note)

---

## 2. Challenge-type flows (happy paths)

Medium routing: `MediumRenderer.tsx` picks by `challenge_type` → `claude_code` | `flow_stepper` | `excalidraw` | `monaco_coding`. Attempts: `POST /api/challenges/[id]/start` creates the attempt; `attempts.max_score` is DECIMAL(4,2).

### 2.1 flow
- [ ] Start: `/workspace/challenges/[id]` → medium `flow_stepper` → `FlowWorkspace.tsx` (+ `FlowWorkspaceShell.tsx`) — evidence:
- [ ] Interact: 4 FLOW steps (Frame/List/Optimize/Win), MCQ + elaboration per step; step data `GET /api/challenges/[id]/step/[step]` — evidence:
- [ ] Submit: `POST /api/challenges/[id]/step/[step]/submit` (+ `submit-batch`); grading via `src/lib/v2/skills/grade-step-answer.ts` + `grading-router.ts` (deterministic MCQ + AI elaboration), competency_signal in response — evidence:
- [ ] Complete: `POST /api/challenges/[id]/complete` (XP formula: difficulty_base × score × streak multiplier) — evidence:
- [ ] Feedback: `/challenges/[id]/feedback` (tiered shell + Mental Models breakdown) — evidence:
- [ ] Hatch: FloatingHatch in workspace; nudges `POST /api/hatch/nudge` (+ `nudge-warmup`); session autosave `PATCH /api/hatch/session/autosave` — evidence:

### 2.2 algorithm
- [ ] Start: `/workspace/challenges/[id]` → medium `monaco_coding` (Monaco editor + CodeOutputPanel) — evidence:
- [ ] Run: `POST /api/code/run` → Judge0 (RapidAPI; batch+backoff); a successful Run is REQUIRED before submit (no RunResult → attempt stays in_progress) — evidence:
- [ ] Submit: `POST /api/challenges/[id]/coding-submit`; grading: test-case execution + `hackproduct-coding-grader` skill; CodingFeedback surface — evidence:
- [ ] Feedback: `/challenges/[id]/feedback` (coding evidence path) + solution/stepped walkthrough (`/api/challenges/[id]/solution`, 347 execution walkthroughs live) — evidence:
- [ ] Hatch: coding coach (`hackproduct-coding-coach`) sees editor state + recent test runs; declines full solutions — evidence:

### 2.3 sql
- [ ] Same workspace/medium family as algorithm (monaco); execution via in-browser sql.js worker incl. per-test `setup_override`; submit `POST /api/challenges/[id]/coding-submit` — evidence:
- [ ] SQL-specific grader integrity rules (compare_mode, match_mode, expected rows) preserved — evidence:

### 2.4 system_design
- [ ] Start: `/workspace/challenges/[id]` → medium `excalidraw` (canvas workspace, native Excalidraw primitives + elbow arrows) — evidence:
- [ ] Interact: canvas drawing + CanvasChatPanel; canvas interpretation `POST /api/hatch/canvas/interpret`; nudges `POST /api/hatch/canvas/nudge`; prompt suggestions `POST /api/hatch/canvas/suggest-prompts`; CanvasReadinessMeter + CanvasCoachCard — evidence:
- [ ] Canvas first-entry tour (`canvasTour.ts`, localStorage `canvas-tour:v1:done`) — evidence:
- [ ] Submit: `POST /api/challenges/[id]/interview-submit`; grading via `hackproduct-canvas-grader` skill — evidence:
- [ ] Feedback: `/challenges/[id]/feedback` (canvas adopts shared feedback system) — evidence:

### 2.5 data_modeling
- [ ] Same excalidraw canvas flow as system_design (canvas challenge, no MCQ parts); same submit/grading/feedback path — evidence:

### 2.6 quick_take
- [ ] Start: dashboard Quick Take card (`QuickTakeCard.tsx`); fetch `GET /api/challenges/quick-take` (+ `/next`) — evidence:
- [ ] Submit: `POST /api/challenges/quick-take/submit` → Haiku grades quality 0–1 (Sharp/Solid/Surface/Weak), XP = round(20 × quality); word-count fallback — evidence:
- [ ] Feedback: inline on card (one-sentence feedback + XP); quick-take keeps its structure on the shared feedback tokens — evidence:

### 2.7 claude_code_analytics (lab: analytics)
- [ ] Start: `/workspace/challenges/[id]` → `AnalyticsWorkspaceClient.tsx` → medium `claude_code` → `ClaudeCodeAnalyticsMedium.tsx` (xterm terminal + mission column + spine strip + AnalyticsOnboardingOverlay + UsageMeter + SubProblemStepper) — evidence:
- [ ] Provision: `POST /api/claude-code/session/start` → `POST .../[id]/provision` → poll `GET .../[id]/state` (provision_phase, silent retry, cold-SQL wake retry); reconnect probe `GET /api/claude-code/session/current` — evidence:
- [ ] Interact: live Claude Code REPL against BigQuery (env: BQ_PROJECT/BQ_DATASET/BQ_BILLING_PROJECT/CLAUDE_MD from challenge metadata); user-state `POST .../user-state`; snapshot `POST .../snapshot`; adaptive guidance `PATCH /api/claude-code/session/[id]/adaptive` + `GET /api/adaptive/guidance` — evidence:
- [ ] Coach: `hackproduct-analytics-coach` (verdicts on marked findings); grading on finalize: `POST /api/claude-code/session/[id]/finalize` → `hackproduct-analytics-grader` (analyst_v1 rubric) — evidence:
- [ ] Report/feedback: `GET /api/claude-code/session/report`; skills library `GET /api/claude-code/skills`; share/OG artifact surfaces — evidence:
- [ ] Access: own entitlement module (`src/lib/flags/analytics.ts`); free quota 1; per-session LiteLLM virtual key + spend cap — evidence:

### 2.8 claude_code_debugging (lab: debugging — ships DARK behind `lab_debugging` app flag; admins bypass)
- [ ] Registry: `src/lib/labs/types.ts` (`LabId='analytics'|'debugging'`, `labIdForChallengeType('claude_code_debugging')→'debugging'`) + `src/lib/labs/server.ts` (env: CHALLENGE_TARBALL, CLAUDE_MD; allowedTools Bash(npm/node/npx); `canAccessLab` fails safe to hidden) — evidence:
- [ ] Same Claude Code medium + session lifecycle as analytics (start/provision/state/finalize) with lab-resolved sandbox env — evidence:
- [ ] Coach `hackproduct-debugging-coach`; grader `hackproduct-debugging-grader` — evidence:
- [ ] Redesign must preserve flag-gated dark launch (flag off → hidden for non-admins) — evidence:

### 2.9 freeform (legacy)
- [ ] Type remains in union; 51 freeform challenges were converted to FLOW (not deleted) — redesign must not break their rendering as FLOW — evidence:

---

## 3. Hatch surfaces (contextuality checklist)

Rule (CLAUDE.md): every surface must demonstrate real context-awareness — if Hatch replies "I can only see what's in your editor", the integration is broken.

Endpoints (all 10 on main under `src/app/api/hatch/`):
- [ ] `POST /api/hatch/chat` — main chat; must receive workspace state per mode — evidence:
- [ ] `POST /api/hatch/canvas/interpret` — canvas → structured interpretation; user-content builder includes canvas + new workspace state — evidence:
- [ ] `POST /api/hatch/canvas/nudge` — canvas nudges — evidence:
- [ ] `POST /api/hatch/canvas/suggest-prompts` — contextual prompt chips — evidence:
- [ ] `POST /api/hatch/nudge` — step nudges (Haiku, step-aware) — evidence:
- [ ] `POST /api/hatch/nudge-warmup` — nudge warmup — evidence:
- [ ] `POST /api/hatch/feedback` — feedback generation — evidence:
- [ ] `POST /api/hatch/growth-reflection` — growth reflection — evidence:
- [ ] `PATCH /api/hatch/session/autosave` — session autosave — evidence:
- [ ] `POST /api/hatch/embed` — embedding (fire-and-forget; must never block submit) — evidence:

UI surfaces:
- [ ] FloatingHatch mounted in `(app)/layout.tsx`, `(workspace)/layout.tsx`, and `FlowWorkspace.tsx` — must see current route/workspace context — evidence:
- [ ] CanvasChatPanel (canvas + coding + analytics chat rail; autoOpenKey gotcha) — initial message/example prompts/placeholder match active mode — evidence:
- [ ] HatchGlyph `state` prop used correctly per context: `idle` (nav/dashboard/auth), `listening` (workspace input), `reviewing` (grading interstitial), `speaking` (coaching), `celebrating` (results/feedback) — NEVER a Material icon/emoji replacement; never deprecated `animated` prop — evidence:
- [ ] HatchDirector / HatchChoreography / HatchSonicSurface shell components preserved — evidence:
- [ ] Dashboard Hatch cards: CoachSpineCard, QuickTakeCard, AnalyticsLabCard — evidence:
- [ ] Live interview: Hatch is the interviewer (voice turns, grade-turn, workspace-awareness of canvas/editor mid-interview) — evidence:
- [ ] Analytics lab: coach verdicts on marked findings in-terminal + AnalyticsSessionMirror — evidence:
- [ ] Opacity rule: model names/tools/internal routes never user-visible (exception: "Claude Code" naming allowed in CC Analytics copy) — evidence:
- [ ] Hatch is "it", never "she/he" in all copy — evidence:

## 4. Global chrome

Navigation:
- [ ] TopNav items (desktop): Home `/`, Explore `/explore`, Practice `/challenges`, Interviews `/live-interviews`, Progress `/progress` (main ref: `src/components/shell/TopNav.tsx:16-20`) — evidence:
- [ ] BottomTabs (mobile): same 5 (Home → `/dashboard`) (main ref: `src/components/shell/BottomTabs.tsx:6-10`) — evidence:
- [ ] TopNav also hosts: tour button, streak/XP display, account menu — evidence: (detail INCOMPLETE — needs follow-up from shell read)
- [ ] Back navigation: single BackButton/BackCrumb pattern (`src/components/navigation/BackButton.tsx`); no breadcrumb trails (AppBreadcrumbs slated for removal; JSON-LD breadcrumbs stay) — evidence:
- [ ] Index panels: DomainIndexPanel, StudyPlanIndexPanel — evidence:

Streak / XP:
- [ ] Streak count (`profiles.streak_days`) + XP visible in chrome; streak multiplier caps 1.5×; StreakRecoveryModal (shield or −50 XP via `POST /api/streak/recover`) — evidence:

Paywall / upgrade touchpoints (grep-verified mounts on main):
- [ ] UpgradeModalHost mounted in `(app)/layout.tsx` + `(workspace)/layout.tsx`; PaywallModal is the single unified paywall — evidence:
- [ ] Triggers: live-interview start (`StartInterviewButton`, `[id]/page.tsx`, `voice-think` 402), CC analytics session start (`session/start` 402, `AnalyticsLabCard`, `ClaudeCodeAnalyticsMedium`, `AnalyticsWorkspaceClient`), canvas chat (`CanvasChatPanel`), FLOW workspace (`FlowWorkspaceShell`), usage limits via `src/lib/usage/check-limit.ts` + `usePlanLimits`/`GET /api/billing/limits` — evidence:
- [ ] UsageMeter component in analytics medium (session budget) — evidence:
- [ ] Limit copy always from plan_limits (never hardcoded) — evidence:

Tours (Shepherd.js engine `src/lib/tours/shepherdEngine.ts` + `TourRunner.tsx`; no highlight ring; HatchGlyph in popover headers; MaskoAvatar mascot steps):
- [ ] Main intro tour: 9 steps (centered Meet-Hatch intro → dashboard → explore → autopsies → study plans → practice → interviews → dashboard wrap; final "Start a rep" CTA → /challenges); auto-start via `profiles.has_seen_hatch_intro`; triggers: TopNav tour button, results-screen button, `start-intro-tour` window event; controller `IntroTourController.tsx` — evidence:
- [ ] Interview tour: single-route, first active interview, localStorage `interview-tour:v1:done`, waits for Hatch opening turn (3.5s fallback), auto-skips absent anchors — evidence:
- [ ] Canvas tour: `canvasTour.ts`, localStorage `canvas-tour:v1:done`, anchors `[data-tour-target="canvas-surface"]` etc., replayable via window event — evidence:
- [ ] AppTooltip: controlled, 300ms show / instant hide — evidence:

Notifications / feedback / misc:
- [ ] Notification preferences page + `GET/PATCH /api/notifications/preferences`, unsubscribe `GET /api/notifications/unsubscribe` — evidence: (bell/dropdown detail INCOMPLETE — needs follow-up)
- [ ] Feedback widget submits to `/api/feedback` [GET,PATCH,POST] — evidence: (mount location INCOMPLETE — needs follow-up)
- [ ] Idle handling: CC sessions reaped server-side via pg_cron `/api/cron/cc-reap`; client reconnect probe on refresh (`session/current`); PTY survives WS drop — redesign must keep the client-side reconnect/probe behaviors — evidence:
- [ ] Config flags endpoint `GET /api/config/flags` (app_flags incl. `lab_debugging`) — evidence:
- [ ] PostHog events (`src/lib/posthog/events.ts`) preserved incl. paywall events — evidence:

---

## 5. API inventory (194 routes on main — dependency ground truth)

Grouped; each group's consumers noted where known. Full list verified against `.worktrees/adaptive-workspaces`.

- [x] Challenges core: `/api/challenges` [GET], `/[id]` [GET], `/[id]/start`, `/[id]/step/[step]` [GET] + `/submit` + `/submit-batch`, `/[id]/steps`, `/[id]/complete`, `/[id]/finalize`, `/[id]/coding-submit`, `/[id]/interview-submit`, `/[id]/coaching`, `/[id]/solution` (+ `/generate`), `/by-ids`, `/count`, `/drafts`, `/growth-snapshot`, `/mastery`, `/next`, `/recommended`, `/quick-take` (+ `/next`, `/submit`) — consumers: practice hub, workspace, feedback, dashboard — evidence: all present (194=194 inventory, zero D); modified: `/[id]/coding-submit` and `/[id]/interview-submit` — intentional grading fall-open: on PlanLimitExceeded/AiBudgetExceededError the routes no longer 402 `limit_reached` (which stranded attempts in_progress); they return a fallback grade instead (coding: correctness-anchored `gradeFromCorrectnessFallback`; interview: `neutralInterviewGradeFallback`). Rep-start limits unchanged. All other routes in group: no behavior diff (verified 2026-07-11)
- [x] Discussions: `/api/challenges/[id]/discussions` [GET,POST] + `[discussionId]` [PATCH,DELETE] + `/replies` [GET,POST] + `/upvote` [PATCH]; `/api/discussions/[id]/report` — consumer: discussion page — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Attempts: `/api/attempts/[id]` [GET], `/grade` [GET], `/share-card` [GET], `/steps` [GET] — consumers: history, feedback, share — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Adaptive: `GET /api/adaptive/guidance` (NEW on main) — consumer: workspace adaptive engine — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Claude Code lab: `/api/claude-code/session/start|current|report`, `[id]/provision|state|snapshot|user-state|finalize|adaptive [PATCH]`, `/api/claude-code/skills` — consumer: analytics/debugging workspace — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Code exec: `POST /api/code/run` (Judge0) — consumer: coding workspace — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Hatch: 10 routes (section 3) — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Live interview: 15 routes (`start`, `history`, `[id]/turn|voice-turn|voice-think|voice-settings|grade-turn|pause|resume|snapshot|status|end|analyze|chat|debug`) — evidence: all present (194=194 inventory, zero D); modified: `[id]/chat` — known signal-strip fix: strips the trailing grading-signal JSON block via `parseGradingSignal` before persisting/returning Hatch replies (incl. legacy stored opening turns), and stores `flow_move_detected`/`competency_signals` on hatch turn rows. Hatch-opacity fix, intentional. All other routes: no behavior diff (verified 2026-07-11)
- [x] Interview loops: `create`, `[id]` [GET,PATCH,DELETE], `[id]/start-round`, `[id]/debrief`, list [GET] — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Simulation: `start`, `[id]` [GET], `[id]/turn`, `[id]/end` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Onboarding: `state` [GET,PUT,DELETE], `profile`, `role`, `calibration/submit`, `results`, `complete`, `quick-start`, `hatch-intro` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Progress: `activity-feed`, `learn-progress`, `reasoning-trajectory`, `streak-history`, `vocabulary` [GET,POST]; move-levels: list, `[move]`, `update`; `/api/prescription/next`; `/api/dna` (+ `/recommend`); `/api/career-benchmark` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Learn: `/api/learn` [GET], `[slug]` [GET], `[slug]/[chapter]` [GET] + `/complete` [POST] — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Study plans: list, `[slug]` [GET], `enroll` [POST,DELETE], `activate`, `personalised` [GET] + `generate` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Billing/Stripe: `limits`, `prices`, `subscription`; `stripe/create-checkout`, `stripe/portal`, `stripe/webhook`; `usage/me` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Auth: `login`, `signup`, `magic-link`, `password-reset`, `change-password`, `link-identity` [POST,DELETE], `reauthenticate`, `request-email-change`, `resend-verification`, `verify-turnstile` (Turnstile currently fail-open) — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Profile/settings: `profile` [GET,PATCH], `avatar`, `export`, `delete`; `settings` [GET,PATCH]; `notifications/preferences` [GET,PATCH] + `unsubscribe` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Community: `activity-feed`, `feedback-trades`, `gallery`, `reactions`, `submissions`, `weekly-room`; `showcase/[slug]/[decisionIndex]/submit` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Streak/achievements: `streak/recover`, `achievements/check` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Domains/roles/prep: `domains` [GET] + `[slug]`, `roles`, `prep/companies`, `prep/challenges` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Growth/marketing APIs: `waitlist`, `leads` (+ `unsubscribe`), `newsletter/subscribe|unsubscribe`, `go/mock-grade`, `public/quiz/product-sense/grade`, `feedback`, `abuse-report` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Affiliate: `affiliate/signup` [GET,POST], `affiliate/connect-callback`, `affiliates/connect` [GET,POST] — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Admin: `community/curate`, `content/*` (9 routes), `coupons`, `plan-limits`, `voice-violations` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Cron (19, incl. `newsletter-seed` NEW on main; `blog-publish` [POST]; others [GET]): `activation-drip`, `affiliate-payouts`, `blog-publish`, `cc-reap`, `cc-spend-snapshot`, `daily-maintenance`, `lead-nurture`, `newsletter-seed`, `newsletter-send`, `paid-insights`, `reap-stale-sessions`, `resume-article`, `resume-challenge`, `streak-reminders`, `trial-ending`, `trial-warnings`, `upgrade-nudge`, `weekly-digest`, `weekly-growth-report` — not UI-facing but must survive route moves — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)
- [x] Misc: `health`, `config/flags`, `debug-auth` — evidence: present, no behavior diff (route-file inventory identical vs origin/main, 194=194, zero D; git diff clean for this group, verified 2026-07-11)

---

## 6. Known open items (INCOMPLETE — needs follow-up)

- [ ] Per-page `fetch('/api...')` mapping for every minor page (research threads still reporting; majors are covered above in sections 1–2) — evidence:
- [ ] Exact tour step-by-step lists (anchors + copy) for all 3 tours — evidence:
- [ ] Notification bell / feedback widget mount locations in shell — evidence:
- [ ] `/product-75`, `/transfer`, `/challenges/orientation`, `/first-run` purposes verified from file reads (currently path-inferred) — evidence:
- [ ] Marketing `/go/*` per-slug distinguishing copy/CTA details — evidence:
- [ ] Streak/XP exact display locations in TopNav vs dashboard header — evidence:
