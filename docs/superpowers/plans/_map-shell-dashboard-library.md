# Shell / Dashboard / Library code map

Read-only factual map for implementation planning. All paths relative to
`/Users/sandeep/Projects/myproductschool`. Verified by direct file reads and
grep for actual usage (not assumed from filename/directory).

**Corrections vs. the task brief / partial notes:**
- The Hatch chat-open window event is **`'open-ask-hatch'`**, not `'open-hatch-chat'`.
- `AppLayoutClient.tsx` lives at `src/app/(app)/AppLayoutClient.tsx`, not under `src/components/redesign/`.
- `HatchDirector.tsx` **no longer exists** in the codebase. It was removed 2026-06-02 and replaced by the Shepherd.js `TourRunner`/`mainTour.ts` engine (see CLAUDE.md "Intro Tour" section). `IntroTourController.tsx` is the current mount point.
- There is **no first-run Hatch chat auto-open** anywhere in the codebase (grepped; only manual triggers exist: sidebar nav, `HatchSuggestionCard`, page-prompt CTAs, `open-ask-hatch` event).
- There is **no dedicated global search API/index**. "Search" in the top bar is a plain navigation to `/challenges?q=...`; the challenges page then does client-side/query-param filtering over already-fetched rows (see Section 5).

---

## 1. APP SHELL

### `(app)` layout chain
- `src/app/(app)/layout.tsx` (57 lines) — server component. Runs two parallel Supabase queries: `profiles` select (`id, display_name, avatar_url, plan, streak_days, xp_total, onboarding_completed_at, has_seen_hatch_intro, subscription_status`-family columns — see Section 2 for exact list used by `/api/profile`) and `user_streaks` (max `streak_days` → `longest_streak`). Builds an `initialProfile: SessionProfile` object and passes it into `<AppLayoutClient initialProfile={...}>`.
- `src/app/(app)/AppLayoutClient.tsx` (60 lines) — client component, exports `AppShell` (internal) and `AppLayoutClient` (default export used by the layout). Provider/DOM nesting (outer → inner):
  ```
  HatchProvider
    SessionProvider (initialProfile=...)
      AppShell
        OnboardingModalProvider
          div.hp-learning-shell
            div.mx-auto.max-w-[1400px].flex
              aside.sticky (lg:block only) -> AppSidebarConnected
              div.flex-1.flex-col
                AppTopShell
                main.pb-20.lg:pb-8 -> {children}
          BottomTabs        (mobile only, fixed bottom)
          IntroTourController (renders nothing, side-effect only)
          FloatingHatch      (FAB + chat panel, global)
          FeedbackModalHost  (global modal mount)
          IdleTimer          (session idle logic)
          UpgradeModalHost   (global modal mount)
          OnboardingModal    (rendered when OnboardingModalContext.open)
  ```
  `CookieBanner` is mounted in the root layout, not here.

### Sidebar
- `src/components/redesign/AppSidebar.tsx` (189 lines) — pure presentational.
  - `MAIN_NAV_ENTRIES` (L33-38): `home → /dashboard` (Home icon), `practice → /challenges` (Compass), `library → /explore` (BookOpen), `progress → /progress` (ChartColumn). No "Live" pill is currently assigned to any entry (`showLivePill` field exists on the type but unused in the array).
  - Root `<aside>` (L110-116): `flex h-full w-[232px] shrink-0 flex-col gap-5 border-r border-hairline bg-white p-4` — **the only hardcoded shell width in the codebase** (232px).
  - Active nav item: `bg-forest-800 text-white` pill (L96).
  - `data-hatch-target` on each nav link: `nav-dashboard` for home, else `nav-{key}` (L93) — these are the Shepherd tour anchors for the main-tour nav steps.
  - Props (`AppSidebarProps`, L41-68): `active: SidebarItem`, `planTier: 'free'|'pro'`, `coachLine: string`, `coachLineSecondary?: string`, `proSlot?: ReactNode`, `onUpgradeClick?`, `onHelpClick?`, `onFeedbackClick?`, `className?`.
  - Hatch coach card (L126-143): renders `HatchImage state="avatar"`, `coachLine` text next to a green dot, optional `coachLineSecondary`.
  - Go Pro card (L145-159, free tier only): static copy "Free plan: 20 challenges, 5 interviews, and 30 feedback reviews a month." + "Upgrade to Pro" button → `onUpgradeClick`.
  - Footer buttons (L163-185): "Send feedback" → `onFeedbackClick`; "Help & Support" → `onHelpClick`.
- `src/components/redesign/AppSidebarConnected.tsx` (43 lines) — wires `AppSidebar` to live state.
  - `resolveActive(pathname)`: `/` or `/dashboard` → `home`; `/live-interviews` → `practice`; `/explore*` → `library`; `/progress*` → `progress`; `/challenges*` or `/workspace*` → `practice`.
  - `coachLine` derived from `profile.streak_days` (exact copy branches not re-quoted here — read the file directly if wording matters for the plan; the mechanism is: streak-day-count driven string, no AI call).
  - `onUpgradeClick` → `window.dispatchEvent(new CustomEvent('open-upgrade-modal'))`.
  - `onHelpClick` → `router.push('/help')`.
  - `onFeedbackClick` → calls `openFeedbackModal()` from the feedback modal context.

### Top bar
- `src/components/redesign/AppTopShell.tsx` (272 lines) — client component, replaces `TopNav` inside `(app)/layout.tsx`. Renders two variants:
  - **Desktop (lg+)**: full `<TopUtilityBar>` (search, sound/tour toggles, avatar menu).
  - **Mobile (<lg)**: collapsed bar — logo + avatar only, no sidebar, no search box.
  - Search state: `const [searchValue, setSearchValue] = useState('')`, `searchInputRef = useRef<HTMLInputElement>(null)`.
  - Keyboard shortcut (L52-57): `⌘K` / `Ctrl+K` global listener focuses `searchInputRef.current`. Hint pill shown in the search box shows the same shortcut.
  - `handleSearchSubmit(e)` (L76+): reads trimmed `searchValue`, navigates to `/challenges?q=${encodeURIComponent(q)}` (no dedicated search API — see Section 5).
  - Passed into `<TopUtilityBar>` (L221-228): `searchPlaceholder="Search topics, problems, or interviews..."`, `searchValue`, `onSearchChange` (implied), `onSearchSubmit={handleSearchSubmit}`, `searchInputRef`.
  - **Gap found**: `AppTopShell` does not pass streak/XP/notification props into `<TopUtilityBar>` even though `TopUtilityBar`'s prop interface supports them (see below) — those pills are effectively dark today.
  - Also renders trial/dunning banners (from `useSession().profile.dunning`) above/around the bar.
  - `AvatarMenu` (inner component, defined within this file): full menu item list — read the file directly for the authoritative current copy/hrefs, but it is a superset of `TopNav.tsx`'s avatar menu (this file additionally has a "Send feedback" item that `TopNav.tsx` lacks).
- `src/components/redesign/TopUtilityBar.tsx` (191 lines) — pure presentational, props-driven, no data fetching of its own. Two modes:
  - **live-search mode**: parent controls `searchValue`/`onSearchChange`, used by `AppTopShell`.
  - **click-to-navigate mode**: clicking the search box navigates away instead of filtering in place (used elsewhere / fallback).
  - Full prop interface — includes optional streak/XP/notification-count props (currently unused by the one caller, `AppTopShell`).

### Mobile bottom nav
- `src/components/shell/BottomTabs.tsx` (56 lines) — mobile-only fixed bottom nav.
  - `tabs` array mirrors the 4 sidebar entries (home/practice/library/progress).
  - `isTabActive()` matcher is **broader** than the sidebar's `resolveActive` for `practice`: it matches an additional prefix set (`/challenges`, `/workspace`, and likely `/live-interviews`-family routes — confirm exact set in file if pixel-precision on active state matters).

### Hatch chat / floating coach
- `src/components/shell/FloatingHatch.tsx` (~580 lines) — the floating chat FAB + panel, mounted globally in `AppLayoutClient`.
  - `isInWorkspace` check suppresses the FAB while inside `(workspace)` routes (workspace has its own `FloatingHatch` mount via `(workspace)/layout.tsx`, so this avoids double-mounting/collision).
  - **Open mechanism**: listens for `window.addEventListener('open-ask-hatch', handler)`. `handler` reads `event.detail.prompt` (a string) and pre-fills + opens the chat panel with that prompt. This is the exact, verified event name — **not** `'open-hatch-chat'`.
  - `sendMessage()` → `POST /api/hatch/chat` with the conversation/message payload; response streamed/rendered into the panel.
  - `runCueAction()` — executes a contextual "cue" (a suggested action bound to the current page/state).
  - `logCueClick()` → `POST` (or `navigator.sendBeacon` as a fire-and-forget fallback) to `/api/hatch/interactions`, logging that the user clicked a cue.
  - Page-prompt CTA handling: `getPagePromptEntry()` resolves a per-route suggested prompt; `runPagePromptCta()` executes it; `POST /api/hatch/pick` is called as part of this flow (Hatch's contextual "pick" — same backing endpoint referenced elsewhere as `HatchPick`'s data source, see Section 3/practice notes: `GET /api/challenges/next`).
  - FAB/panel are pure client-side state (no server round trip to merely open/close).

### Intro tour
- `src/components/shell/IntroTourController.tsx` (84 lines) — renders nothing, pure side-effect component mounted once in `AppLayoutClient`.
  - **Auto-start**: gated behind 7 conditions checked in sequence (read file for the exact list) — includes at minimum: profile loaded, `profile.onboarding_completed_at` set (i.e. post-onboarding), `!profile.has_seen_hatch_intro`-equivalent gate (main tour uses its own storage key per CLAUDE.md: `profiles.has_seen_hatch_intro`), not already on a route where the tour shouldn't run, tour not already completed this session, etc.
  - **Manual trigger**: `window.addEventListener('start-intro-tour', handler)` — same event dispatched by the TopNav "tour" button and the calibration-results "Take me around" button (per CLAUDE.md).
  - Confirmed via grep: `HatchDirector.tsx` does not exist anywhere in the repo today.

### Workspace shell
- `src/app/(workspace)/layout.tsx` (56 lines) — client component, wraps a `Suspense` boundary.
  - Share routes bypass the shell entirely via a regex match on the pathname (share pages render standalone).
  - Mount tree: `HatchProvider > SessionProvider > div.flex.h-screen > TopNav / (optional StudyPlanIndexPanel | DomainIndexPanel) / main / BottomTabs / FloatingHatch / UpgradeModalHost`.
  - `StudyPlanIndexPanel` renders when the `from_plan` search param is present; `DomainIndexPanel` renders when `from_domain` is present. Also reads `cid` search param (challenge id context, consumed further down the tree).
- `src/components/shell/TopNav.tsx` (337 lines) — the pill nav used inside `(workspace)`.
  - `NAV_ITEMS` (L15-20): home/practice/library/progress, each with a Material icon name, matching the sidebar's 4 entries.
  - Sticky header: `sticky top-0 z-40 border-b` with backdrop blur. **No hardcoded height class** — height is driven by padding, measured at ~67px in prior work (see project memory `project_workspace_layout_session_provider.md`), not by a fixed `h-*` utility or CSS variable.
  - `isActive('practice')` matches `/challenges`, `/workspace/challenges`, `/live-interviews`.
  - Avatar dropdown: same core items as `AppTopShell`'s `AvatarMenu` minus "Send feedback".
  - Logout: `signOut()` → redirects to `/login`.
  - Upgrade button: dispatches `'open-upgrade-modal'` (same event as the sidebar's Go Pro card).

### Marketing shell
- `src/app/(marketing)/layout.tsx` — no shared nav component of its own; just imports page-scoped CSS (`v3-landing.css`, `v3-pages.css`, `lead-magnet*.css`) and passes children through.
- `src/components/marketing/FloatingNav.tsx` (~50 lines) — one marketing nav variant found via grep: fixed pill-style nav with links Practice / Curriculum / AI Interviews / Pricing, plus "Sign in" and "Start Free" CTAs. **Not exhaustively confirmed** whether every marketing page uses this exact component — some landing variants may render their own inline nav; grep `FloatingNav` usages before assuming universality if the plan touches marketing pages.

### CSS / global shell tokens
- Grepped `src/app/globals.css` for `hp-learning-shell`, `--nav`, `sidebar`, `232`, `--sidebar-width`, `--nav-width`, `--topbar-height`.
- Only match: `.hp-learning-shell` (L884-888) — purely decorative (a background gradient), **not** a layout/sizing token.
- **No CSS custom properties define shell widths or heights anywhere in the app.** The only hardcoded shell dimension in the entire codebase is `AppSidebar.tsx`'s inline Tailwind arbitrary value `w-[232px]`. `TopNav`/`AppTopShell` heights are unstyled by fixed classes (padding-driven).

---

## 2. PROFILES

### `public.profiles` — full verified column list (reconstructed from ~20 migrations, chronological)

Base table (`001_initial_schema.sql`) plus every `ALTER TABLE public.profiles ADD COLUMN` found across migrations:

| Column | Added in | Notes |
|---|---|---|
| `id` | 001 (PK, references `auth.users`) | |
| `email` | 001 | |
| `display_name` | 001 | |
| `avatar_url` | 001 | |
| `role` | 001 | |
| `preferred_role` | later migration | CHECK constraint values changed from Title-Case to snake_case across two migrations (drift resolved) |
| `plan` | 001 or early | `'free' \| 'pro'` |
| `streak_days` | 001 or early | current streak count |
| `xp_total` | 001 or early | |
| `onboarding_completed_at` | `20260505231943_profiles_onboarding_calibration_state.sql` | timestamp, null until calibration/first-rep completes |
| `has_seen_hatch_intro` | `20260505233406_hatch_intro_seen.sql`, then **re-added** by `20260612211339_restore_has_seen_hatch_intro.sql` | column was dropped/lost via live-DB drift after first add; restore migration exists specifically to fix that — comment in the file explains root cause |
| `dashboard_cards` | `012_dashboard_preferences.sql` (and duplicated in `022_dashboard_preferences.sql`) | jsonb, bento card layout preference — **see Dead Code note below** |
| card-size preference | `021_card_sizes.sql` | additional jsonb/columns for card sizing, same legacy bento system |
| `subscription_status` | `20260906140000_profiles_subscription_status.sql` | `TEXT`, nullable, **no CHECK constraint by design** — comment explains: null lets entitlement reads fall back to the `subscriptions` table before Stripe delivers a lifecycle event; Stripe + dispute handlers write a wider state set than a fixed enum would allow |
| dunning columns | `20260523140000_profiles_dunning_columns.sql` | grace period / dunning state fields backing `SessionProfile.dunning` |
| onboarding personalization fields | `20260601130000_onboarding_personalization.sql` | role/goal personalization inputs captured during onboarding |
| affiliate/referral fields | `20260506021618_affiliate_referrals.sql` (partial read) | referral code / attribution columns |
| v2 schema extension fields | `20260519001000_v2_schema_extensions.sql` (partial read) | additional v2-era columns |
| CC (Claude Code) analytics fields | `20260602150000_cc_user_claude_state.sql`, `20260603120000_cc_analytics_tier.sql` (grep only, not fully read) | CC session/tier state |

**Important negative finding**: `timezone`, `flow_focus`, `difficulty` preference-style fields belong to the separate **`user_settings`** table (`044_user_settings_preferences.sql`), **not** `profiles`. Don't assume every user-preference lives on `profiles`.

**Drift/duplication flag for the implementer**: `012_dashboard_preferences.sql` and `022_dashboard_preferences.sql` appear to add the same `dashboard_cards`-family column(s) with only minor schema-qualification differences — almost certainly a reapplied/duplicate migration. Treat `dashboard_cards` as present exactly once on the live table regardless of the duplicate migration files.

### `src/app/api/profile/route.ts` (141 lines)
- **GET**: selects a fixed column list from `profiles` (id, display_name, avatar_url, plan, streak_days, xp_total, onboarding_completed_at, has_seen_hatch_intro, subscription_status, plus dunning-derived fields) joined/merged with usage data (`hatchAiCents`, `challenges`, `interviews` — the `UsageData` shape). Response shape matches `SessionProfile` + `usage: UsageData` (see below) plus `daily_attempts_today`.
- **PATCH**: validates the request body against a Zod `RequestSchema` (partial update — only a subset of profile fields are patchable this way; read the file directly for the exact allowed key list if the plan needs to add a new patchable preference).
- Error-code handling: 401 for unauthenticated, structured error JSON on Supabase errors.

### `src/context/SessionContext.tsx` (165 lines)
- `SessionProfile` interface (L16-40): `id`, `streak_days`, `longest_streak?` (seeded server-side only, not returned by `/api/profile`, so refresh() preserves it via `Math.max(prev, incoming)`), `xp_total`, `display_name`, `avatar_url`, `plan`, `onboarding_completed_at`, `has_seen_hatch_intro`, `daily_attempts_today?`, `subscription?` (status/current_period_end/billing_interval/cancel_at_period_end), `dunning?` (state/shouldShowBanner/bannerMessage/gracePeriodEndsAt).
- `FeatureUsage { used, limit, windowDays, unit? }`; `UsageData { challenges, interviews, hatchAiCents }`; `DEFAULT_USAGE` fallback constants (20/5/35 respectively).
- `SessionProvider({ children, initialProfile })`: seeds state from the server-rendered `initialProfile` (avoids client fetch flash). `refresh()` — guarded by an `inFlight` ref to prevent overlapping fetches — calls `GET /api/profile`, on 401 redirects to `/login`, on success updates `profile` and `usage`, and calls `identifyUser()` (PostHog) with `is_internal` flag.
- **Refresh triggers**: mount (`useEffect` on mount calls `refresh()` once), plus two window events only: `'challenge-completed'` and `'profile-stats-updated'`. **Intentionally no pathname dependency** — refresh does not fire on every navigation.
- `useSession()` hook returns `{ profile, usage, userId, loading, refresh }`.

### Related: `OnboardingModalContext.tsx` (154 lines)
- Confirms (explicit code comment, L90-97) that the onboarding modal **no longer auto-launches** the full 12-screen `CalibrationFlow`. It is strictly opt-in as of the refactor referenced in the comment.
- On mount, once `profile` loads: if `profile.onboarding_completed_at` is set → `completed = true`, stop. Otherwise calls `getOnboardingState()` to determine `hasMeaningfulProgress` (true if the user got past the intro screen, i.e. `screen !== 'intro' && screen !== 'results'`) — this feeds a dismissible "resume calibration" CTA, not an auto-opened modal.
- `openModal(source?: 'auto'|'hero'|'settings')` sets `open = true`.
- Opens via **`window.addEventListener('open-onboarding-modal', ...)`** (mirrors the `open-upgrade-modal` pattern) — this is the only way the full modal opens outside of an explicit `openModal()` call from TopNav/a dashboard CTA.
- `closeModal()` sets a `sessionStorage['onboarding-modal-dismissed'] = '1'` flag.
- `markCompleted()` sets `completed = true`, closes, and dispatches `'profile-stats-updated'` so `SessionContext.refresh()` re-reads `onboarding_completed_at`.

---

## 3. DASHBOARD

### `src/app/(app)/dashboard/page.tsx` (320 lines)
Server component. `loadDashboard()` runs ~9 parallel queries (challenges, attempts, streaks, study-plan enrollment, autopsy featured story, quick-take eligibility, etc. — read the file directly for the exact 9-query list if the plan needs to touch a specific one; all are Promise.all'd for a single round trip). Contains difficulty-targeting logic (picks a challenge difficulty tier based on recent performance) and action-resolution logic (delegated to `action.ts` below). Branches the "Hatch suggestion" message/prompt based on computed state (e.g. weakest FLOW move, streak status, or new-user state). Renders `<DashboardContent>` wrapped in `<Suspense fallback={<DashboardSkeleton/>}>`.

### Rendered components (all in `src/components/redesign/dashboard/`)
- **`action.ts`** (34 lines) — pure helpers, not a component:
  - `canonicalResumeHref(...)` — resolves the canonical "resume" URL for an in-progress challenge/interview.
  - `resolveDashboardAction(...)` — decides which primary CTA the hero should show (resume vs. new challenge vs. quick-take vs. curated first rep).
  - `quickTakeForReturningUser(...)` — decides whether a returning user's dashboard should surface the Quick Take panel.
- **`DashboardHero.tsx`** (35 lines) — the hero CTA card. Carries `data-hatch-target` attributes used as Shepherd main-tour anchors.
- **`HatchSuggestionCard.tsx`** (22 lines) — "A thought from Hatch" card. **Exact mechanism verified**: on click, runs
  ```ts
  window.dispatchEvent(new CustomEvent('open-ask-hatch', { detail: { prompt: question } }))
  ```
  which `FloatingHatch.tsx`'s listener picks up to open the chat panel pre-filled with `question`.
- **`PracticeAreaGrid.tsx`** (36 lines) — static `AREAS` array (hardcoded discipline list), **no dynamic counts**. Each area links to `/challenges?discipline=...`.
- **`ContinueLearning.tsx`** (84 lines) — "Continue learning" card. Renders one of: a paused-interview banner, a study-plan progress card (data source: `getEnrolledPlans(userId)` in `src/lib/data/study-plans.ts`, table `user_study_plan_enrollments` joined against `study_plans`/`study_plan_chapters`/`challenge_attempts`), or an empty state.
- **`QuickTakePanel.tsx`** (233 lines) — full quick-take flow.
  - Submit: `POST /api/challenges/quick-take/submit` with body `{ challenge_id, response_text }`.
  - Next prompt: `GET /api/challenges/quick-take/next?exclude=&move=`.
  - Grade bands rendered client-side from the response.
  - Hash-based textarea autofocus: `#quick-take` anchor scrolls/focuses the textarea on load.
- **`ProgressSnapshot.tsx`** (59 lines) — "Your progress" card: week strip, streak count, focus-move progress bar (FLOW move with lowest score).

### New-user "A good place to begin"
- `src/lib/onboarding/curated-first-rep.ts` (42 lines):
  - `ROLE_TO_FIRST_REP_SLUG`: map from onboarding role → a specific curated challenge slug.
  - `getCuratedFirstRepSlug(role)`: looks up the map.
  - `DEFAULT_FIRST_REP_SLUG = 'template-gallery-launch'` — fallback slug when role is unknown/unset.
  - `FIRST_REP_FALLBACK_HREF = '/challenges'` — final fallback if even the default slug can't resolve to a live challenge.

### `profiles.dashboard_cards` — dead code
- Grep confirms `CardPicker.tsx` and the `dashboard_cards`/bento-card registry are referenced **only** in `src/lib/mock.ts` and `src/lib/data/dashboard.ts` — **not** in the actual rendered dashboard tree (`(app)/dashboard/page.tsx` and its `redesign/dashboard/*` imports). This is legacy/dead infrastructure relative to the live dashboard. Do not build new work assuming `dashboard_cards` drives the current UI.
- Directory `src/components/dashboard/**` (legacy bento cards) still exists on disk but is not imported by the live page.

### Confirmed-dead files in `src/components/redesign/dashboard/`
Grepped for any reference outside their own file — **zero matches** for all of:
`FirstWeekStrip.tsx`, `FlowMethodRail.tsx`, `PeersPanel.tsx`, `QuietInvite.tsx`, `RecommendedRow.tsx`, `ThisWeekPanel.tsx`, `TodaysPathPanel.tsx`, `WhyThisOrderCard.tsx`.
These are unused/superseded — do not treat them as part of the live dashboard surface. (Note: `RecommendedRow.tsx` itself imports the neighboring `discipline.ts`, but nothing imports `RecommendedRow.tsx` in turn, so the whole component is still dead.)

`discipline.ts` in the same directory **is live** — referenced from `src/app/(app)/explore/plans/[slug]/StudyPlanDetailClient.tsx` and `src/lib/autopsies/practice-links.ts` in addition to the dead `RecommendedRow.tsx`.

### First-run Hatch chat auto-open
No such behavior exists anywhere in the current codebase (grepped for auto-open patterns tied to first dashboard visit). All Hatch chat opens are user-initiated: sidebar/topbar nav to a Hatch surface, `HatchSuggestionCard`'s `open-ask-hatch` dispatch, or a page-prompt CTA inside `FloatingHatch.tsx`. If the plan requires this, it is new work, not a toggle on an existing flag.

---

## 4. LIBRARY

### `src/app/(app)/explore/page.tsx` (108 lines) — full read
Server component. Runs `Promise.allSettled` over 7 sources in parallel:
1. `getLearnModuleSummaries()` (`src/lib/data/learn-modules.ts`) → `learn_modules` table, `select('*')`, `order('sort_order')`. Mock-mode fallback: `LEARN_MODULES_SEED`.
2. `getStudyPlanSummaries()` → `study_plans` table, `is_published = true`.
3. `getStudyPlans(user?.id)` (`src/lib/data/study-plans.ts`) — enriched plan list with per-user progress (see below).
4. `getAutopsyCompanies()` (`src/lib/autopsies/queries.ts`) → memoized `getAutopsyLibrary()` (Supabase-backed, `cache()`-deduped per render; falls back to local seed data `companyHubs`/`autopsyStories` if `AUTOPSY_LOCAL_FALLBACK=true`, `IS_MOCK`, or a build-time timeout).
5. `getPublishedAutopsyStories()` → same library, filtered `status === 'published'`, sorted feature-stories-first then legacy teardowns.
6. `getUserBookmarks(true)` (`src/lib/showcase/bookmarks.ts`) → `autopsy_bookmarks` table, `select('company_slug, story_slug')`, `strict=true` throws on error instead of silently returning `[]`.
7. Raw inline query: `supabase.from('user_learn_progress').select('module_id').eq('user_id', user.id)` — used only to compute per-guide completion percentage, not routed through a helper.

**Availability degradation**: each source uses `Promise.allSettled`; a rejected source is excluded from `unavailableKinds` (`'guide' | 'plan' | 'autopsy'`) and the catalog renders whatever succeeded, with a banner (see `LibraryCatalog.tsx` below).

**Plan-enrichment fallback quirk** (L33-46, explicit code comment): `getStudyPlans()` sometimes treats Supabase errors as empty results internally, so the page uses the throwing `getStudyPlanSummaries()` call purely as an "is the catalog actually available" signal, and if `getStudyPlans()` returned nothing but the summary catalog is non-empty, it synthesizes minimal `StudyPlanWithItems`-shaped rows from the summaries (`items: []`, `chapter_count: 0`, `completed_count: 0`, `progress_percentage: 0`, `is_enrolled: false`) rather than showing an empty Library.

**Item construction** (all mapped into a single `LibraryItem[]` passed to `<LibraryCatalog>`):
- `guideItems`: `id = "guide:{module.id}"`, `href = /explore/modules/{module.slug}`, `progress` computed from `completedByModule` (rows from `user_learn_progress`) vs `module.chapter_count` (only set if `> 0` completions and `chapter_count > 0`), `meta = "{chapter_count} chapters · {est_minutes} min"`, `searchText` = joined name/tagline/difficulty/track.
- `autopsyItems`: built from `getReadableAppStories(stories)` (filters to `status === 'published'` or legacy `company_teardown` status, sorts feature stories first — `src/lib/autopsies/app-library.ts`). `id = "autopsy:{companySlug}/{slug}"`, `href = /explore/autopsies/{companySlug}/stories/{slug}`, `bookmarked` = membership in the `savedStories` Set built from `bookmarks`, `progressKey = "hp_reader_{companySlug}/{slug}"` (**localStorage key**, read client-side — see below), `searchText` = title/dek/company name/tags.
- `planItems`: `id = "plan:{plan.id}"`, `href = /explore/plans/{plan.slug}`, `eyebrow` = `"Enrolled"` if `is_enrolled` else `difficulty || "Study plan"`, `meta` = joined `"{estimated_hours} hours · {challenge_count} challenges"`, `progress` = `plan.progress_percentage` rounded (only if enrolled), `searchText` = title/description/difficulty/role_tags/disciplines.

### `src/app/(app)/explore/LibraryCatalog.tsx` (186 lines, client component)
`LibraryItem` type (L8-12): `{ id, kind: 'guide'|'autopsy'|'plan', title, description, href, eyebrow, meta, accent, searchText, bookmarked?, progress?, progressKey? }`.

- **"Continue where you left off"**: client-only progress hydration. On mount, `readProgress(item.progressKey)` reads `localStorage.getItem(progressKey)`, parses JSON, extracts `.scrollPct` (clamped 0-100). Only `autopsyItems` carry a `progressKey` (`hp_reader_{companySlug}/{slug}`) — **guides and plans have no localStorage-based progress in this component**; guide progress instead comes server-side from `user_learn_progress` (baked into `progress` before it ever reaches the client). The merged `resolved` array prefers `deviceProgress[item.id]` over the server-provided `item.progress`. `continueItems` = items with `0 < progress < 100`, sorted by progress descending, sliced to 3, rendered only when no search/filter is active.
- **"Saved for you" featured card selection** (L55): `resolved.find(item => item.bookmarked) ?? resolved.find(item => item.kind === 'autopsy') ?? resolved[0]` — first bookmarked item wins; else first autopsy; else the very first item in the combined list. Rendered by the `Featured` sub-component (L142-159), only shown when no search/filter/saved-only is active.
- **Filter chips**: pure **component state**, not URL params — `category: LibraryKind | 'all'` and `savedOnly: boolean`, both plain `useState`. Switching category resets `savedOnly` to false and vice versa (L91, L95). No `router.push`/searchParams involved — filters do not survive a page refresh or deep link.
- **Search**: also plain `useState<string> query`, client-side substring filter (`.toLowerCase().includes(needle)`) against `title + description + eyebrow + searchText` — **no API call**, filters the already-fetched `items` array in memory.
- **Saved stories** toggle: `savedOnly` boolean chip; when `savedUnavailable` (bookmarks fetch failed) and `savedOnly` is active, shows a retry-prompting error state instead of results.
- Category counts (`counts`, L56-61) are computed client-side from the full `items` array (not server-counted).

### List sub-pages
- **`explore/plans/page.tsx`** (14 lines) — server component. `getStudyPlans(user?.id)` + `getEnrolledPlans(user.id)` (only if signed in) → passed to `<StudyPlansClient studyPlans={...} enrolledPlans={...}>` (client component, not read in full this pass — file exists at `src/app/(app)/explore/plans/StudyPlansClient.tsx`).
- **`explore/modules/page.tsx`** (280 lines) — not read in full this pass; exists as the Guides list page. Revisit if the plan needs guide-list-specific detail (filters, cards) beyond what's inferable from `LibraryCatalog`'s `guideItems` shape.
- **`explore/autopsies/page.tsx`** (36 lines) — server component. `getAutopsyCompanies()` + `getQueuedAutopsyStories()` (all stories, not just published — includes queued/unpublished for internal preview presumably), run through `getReadableAppCompanies`/`getReadableAppStories`, rendered via `<ShowcaseIndexExperience companies={...} stories={...}>` (`src/components/showcase/index/ShowcaseIndexExperience.tsx`, not read this pass). Note the explicit `dynamic = 'force-dynamic'` export with a comment explaining this route lives under the authed `(app)` shell and cannot be statically prerendered because it reads auth cookies at render.
- **`explore/plans/[slug]/page.tsx`** + **`StudyPlanDetailClient.tsx`** — plan detail route, backed by `getStudyPlanBySlug(slug)` (see below). Not fully read this pass beyond confirming it imports `discipline.ts` from the dashboard folder.

### Study plan data layer — `src/lib/data/study-plans.ts` (378 lines, full read)
- **`getStudyPlanSummaries(limit?)`**: `study_plans` table, `select('*')`, `is_published = true`, ordered by `created_at`. Mock fallback: `MOCK_STUDY_PLANS`.
- **`getStudyPlans(userId?)`**: `study_plans` (published) + `study_plan_chapters` (`plan_id, id` — used only to count chapters per plan) + (if `userId`) `user_study_plan_enrollments` (`plan_id, progress_pct`) to compute `is_enrolled`/`progress_percentage`. Returns `item_count = plan.challenge_count` (a denormalized column on `study_plans` itself), `chapter_count` from the chapters join, `completed_count` hardcoded to `0` in this function (real completion count only computed in `getStudyPlanBySlug`/`getEnrolledPlans`).
- **`getEnrolledPlans(userId)`**: `user_study_plan_enrollments` (ordered by `last_active_at desc`) → `study_plans` (`in id`, published) → `study_plan_chapters` (`plan_id, challenge_ids`) to build a flat `allChallengeIds` list → `challenge_attempts` (`status = 'completed'`, best `total_score` per challenge) to compute real `completed_count`/`progress_percentage`. This is the exact data source backing `ContinueLearning.tsx`'s study-plan progress card on the dashboard.
- **`getStudyPlanBySlug(slug)`**: the full plan-detail loader. `study_plans` (single, published) → `study_plan_chapters` (`id, title, order_index, challenge_ids, topic_tags, learn_chapter_id` — a chapter is either a challenge-chapter with `challenge_ids[]` or a lesson-chapter with `learn_chapter_id`) → resolves lesson chapters via `learn_chapters` joined to `learn_modules(slug)` for reader links → resolves `topic_tags` labels via a `topics` table lookup (`default_chapter_label` fallback to `title`/slug) → resolves challenge rows via `challenges` joined to `domains(slug, title, icon)` → computes per-user progress via `challenge_attempts` (completed + in-progress, best score) and `user_learn_progress` (lesson completion) → flattens everything into ordered `enrichedItems` (one row per lesson-chapter or per challenge-within-a-chapter) → returns `{ ...plan, items, item_count, chapter_count, completed_count, progress_percentage }`.

### Study plan enrollment API — `src/app/api/study-plans/[slug]/enroll/route.ts` (55 lines, full read)
- **POST**: auth required. Looks up `study_plans.id` by slug (admin client), then `upsert`s into `user_study_plan_enrollments` (`onConflict: 'user_id,plan_id'`) with `last_active_at = now()`. Returns `{ enrollment: data }`.
- **DELETE**: auth required. Same slug lookup, then deletes the matching `user_study_plan_enrollments` row. Returns `{ ok: true }`.
- Sibling routes not read this pass but present on disk: `src/app/api/study-plans/route.ts`, `[slug]/route.ts`, `[slug]/activate/route.ts`, `personalised/route.ts`, `personalised/generate/route.ts`.

### Saved stories — `src/lib/showcase/bookmarks.ts` (98 lines, full read)
- All three functions are `'use server'` actions (not REST API routes): `getBookmarkState(companySlug, storySlug)`, `toggleBookmark(companySlug, storySlug)` (upsert/delete against `autopsy_bookmarks`, keyed by `user_id + company_slug + story_slug`, calls `revalidatePath('/explore')` after mutating), `getUserBookmarks(strict = false)` (used by the explore page with `strict = true` so a fetch failure surfaces as `unavailableKinds` rather than silently showing zero bookmarks).
- **No separate "learn bookmarks" table found** — bookmarking in this codebase is autopsy-story-specific (`autopsy_bookmarks` only). Guides/modules have no bookmark mechanism; their "saved" state doesn't exist.

### Autopsy queries — `src/lib/autopsies/queries.ts` (139 lines) + `app-library.ts` (73 lines)
- `getAutopsyLibrary()` is a module-level memoized (`cache()` + a manually-managed promise, `autopsyLibraryPromise`) Supabase fetch, specifically to avoid re-running an expensive company+story+version+image fan-out query once per static page during `next build`. Falls back to local seed data (`companyHubs`/`autopsyStories` from `./data`) if `AUTOPSY_LOCAL_FALLBACK=true`, mock mode, or (during production build only) a Supabase timeout — this last case logs a warning rather than failing the build.
- `getReadableAppStories`/`getReadableAppCompanies` (`app-library.ts`) apply the "readable" filter: `status === 'published'` OR a legacy `company_teardown` with `status === 'published'`; sort feature-autopsies before legacy "X, Decoded" teardowns (explicit design comment: ten near-identical teardown titles at the top read as filler).
- `getFeaturedAutopsyStory()` / `getFeaturedAutopsyForDashboard()` — dashboard's featured-autopsy card (referenced from the dashboard's `loadDashboard()` 9-query set) picks `story.featured === true` first, else first published, else the first story overall.

---

## 5. SEARCH

There is **no global search component or search API** shared across routes. What exists:

- **Top bar "search"** (`AppTopShell.tsx` → `TopUtilityBar.tsx`): a plain controlled `<input>`. On submit (`handleSearchSubmit`), it does a full navigation to `/challenges?q={encodeURIComponent(value)}`. It does not call any search API and does not know about guides/autopsies/plans — it is scoped to challenges only, by construction (destination route), regardless of where the user currently is.
- **`/challenges` page's own search** (`src/app/(app)/challenges/ChallengeSearch.tsx`, 41 lines, full read): a separate, second search input rendered on the challenges list page itself. It's a debounced (300ms) `useState` wrapped around `router.push` that sets/clears the `q` URL search param on the current pathname (`useSearchParams`/`usePathname`/`useRouter` from `next/navigation`) — **no fetch call from this component**; it just changes the URL, and the server component that renders the list (`FreePracticeContent.tsx` per partial notes) re-queries `challenges` with `q` as a filter via `src/lib/data/challenges.ts`'s `applyChallengeFilters`/`getChallenges` (likely an `ilike`/text filter on title — not confirmed byte-for-byte this pass, but this is the only place `q` is actually consumed against the database).
- **Library search** (`LibraryCatalog.tsx`): entirely client-side, in-memory substring filter over the `items` array already fetched server-side by `explore/page.tsx`. Does not call any API and cannot search anything not already loaded onto that page (i.e. it cannot search modules/autopsies/plans beyond what got fetched for the current Library view).
- **No unified/cross-entity search index** (no Postgres full-text search column, no Algolia/Typesense/Meilisearch integration, no `/api/search` route) was found anywhere in the codebase.

**Implication for "scope search per route"**: today there are two independent, hardcoded search implementations (`AppTopShell`'s top-bar search, hardcoded to `/challenges?q=`; and `ChallengeSearch.tsx`, scoped to the challenges page's own list). Building a genuinely route-aware/global search (e.g. searching guides while on `/explore`, challenges while on `/challenges`) is new work — there is no existing abstraction to extend, only two single-purpose implementations to either generalize or replace.
