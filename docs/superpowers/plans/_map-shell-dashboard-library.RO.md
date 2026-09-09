I have everything needed. Compiling the report.

# Code Map — App Shell, Profiles, Dashboard, Library

---

## 1. APP SHELL

### 1.1 `(app)` layout — `src/app/(app)/layout.tsx` (57 lines)

Server component. Default export `AppLayout({ children })`.

- **L22-35**: One-shot server fetch, `Promise.all`:
  - `profiles` select: `id, display_name, avatar_url, plan, streak_days, xp_total, onboarding_completed_at, has_seen_hatch_intro` where `id = user.id` (`.maybeSingle()`)
  - `user_streaks` select `streak_days`, order desc limit 1 → `longest_streak`
- **L37-47**: builds `SessionProfile`; `longest_streak = max(bestStreakRow.streak_days, profile.streak_days)`
- **L50-53**: swallows errors (client `SessionProvider` refetch is the fallback)
- **L56**: renders `<AppLayoutClient initialProfile={…}>`
- Guard at L17: skipped entirely when `IS_MOCK`

### 1.2 `src/app/(app)/AppLayoutClient.tsx` (61 lines) — the mount tree

```
HatchProvider (L54)                       @/context/HatchContext
└ SessionProvider initialProfile (L55)    @/context/SessionContext
  └ AppShell (L16)
    └ OnboardingModalProvider (L18)       @/context/OnboardingModalContext
      └ div.hp-learning-shell (L19)  min-h-screen bg-background
        └ div (L20) mx-auto flex min-h-screen w-full max-w-[1400px]
          ├ div (L22) sticky top-0 hidden h-screen shrink-0 overflow-y-auto lg:block
          │   └ <AppSidebarConnected/>    (L23)
          └ div (L26) flex min-w-0 flex-1 flex-col
            ├ <AppTopShell/>              (L27)
            └ <main> (L28) min-w-0 flex-1 pb-20 lg:pb-8
        ├ <BottomTabs/>        (L34)
        ├ <IntroTourController/> (L35)
        ├ <FloatingHatch/>     (L36)
        ├ <FeedbackModalHost/> (L37)  @/components/feedback/FeedbackWidget
        ├ <IdleTimer/>         (L38)  @/components/auth/IdleTimer
        ├ <UpgradeModalHost/>  (L39)  @/components/paywalls/UpgradeModalHost
        └ <OnboardingModal/>   (L40)  @/components/onboarding/OnboardingModal
```

**No cookie banner in the (app) shell** — `CookieBanner` is mounted in the root layout (`src/app/layout.tsx` L7 import; `AnalyticsGate` L6).

### 1.3 Side nav — `src/components/redesign/AppSidebar.tsx` (189 lines)

- Exported: `AppSidebar`, types `SidebarItem = 'home'|'practice'|'library'|'progress'` (L16-20), `PlanTier = 'free'|'pro'` (L22)
- **Nav item array**: `MAIN_NAV_ENTRIES` at **L33-38**
  | key | label | href | icon (lucide) |
  |---|---|---|---|
  | `home` | Home | `/dashboard` | `Home` |
  | `practice` | Practice | `/challenges` | `Compass` |
  | `library` | Library | `/explore` | `BookOpen` |
  | `progress` | Progress | `/progress` | `ChartColumn` |
- `NavEntry.showLivePill?` (L30) exists but **no entry sets it** — the Live pill (L101-105) is dead code today.
- **Props** (`AppSidebarProps`, L41-68): `active`, `planTier`, `coachLine`, `coachLineSecondary?`, `proSlot?`, `onUpgradeClick?`, `onHelpClick?`, `onFeedbackClick?`, `className?`
- **Dimensions** — `<aside>` L111-115: `w-[232px]`, `h-full`, `shrink-0`, `flex-col gap-5`, `border-r border-hairline bg-white p-4`
- Wordmark link L117-119: `HackProductWordmark h-8 w-[168px]`, href `/dashboard`
- **Active state**: `entry.key === active` (L87) → `bg-forest-800 text-white`; item base `min-h-11 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-secondary` (L95)
- **Tour anchors**: `data-hatch-target` = `nav-dashboard` for home, else `nav-{key}` (L93)
- Bottom stack (L125-186): Hatch coach card (L126-143, `HatchImage state="avatar" size={30}`, `size-9` tile), Go Pro card (L145-159, free only, gold button), footer buttons Send feedback (L164-173) / Help & Support (L174-184, `ChevronRight`)
- **No collapse state exists anywhere** — width is a hardcoded literal.

### 1.4 `src/components/redesign/AppSidebarConnected.tsx` (43 lines)

- `resolveActive(pathname)` **L8-15**:
  - `/` or `/dashboard*` → `home`
  - `/live-interviews*` → `practice`
  - `/explore*` → `library`
  - `/progress*` → `progress`
  - `/challenges*` or `/workspace/challenges*` → `practice`
  - default → `home`
- `isPro = profile?.plan === 'pro'` (L27), from `useSession()`
- `coachLine` L29-31: `"{streak}-day streak. Today's practice is picked on your dashboard."` else `"Your next practice session is picked on the dashboard."`
- Handlers: `onUpgradeClick` → `window.dispatchEvent(new CustomEvent('open-upgrade-modal'))` (L38); `onHelpClick` → `router.push('/help')` (L39); `onFeedbackClick` → `openFeedbackModal` (L40)

### 1.5 Top bar — `src/components/redesign/AppTopShell.tsx` (271 lines)

Exports `AppTopShell()` (no props).

- **L17**: `AFFILIATES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AFFILIATES === 'true'`
- **L42-50**: click-outside closes avatar menu
- **L53-62**: `⌘K` / `Ctrl+K` → `searchInputRef.current.focus()`
- **L64-69** `handleLogout`: `supabase.auth.signOut()` → `router.push('/login')` → `router.refresh()`
- **L71-74** `openUpgrade`: dispatch `open-upgrade-modal`
- **L76-80** `handleSearchSubmit`: `router.push(q ? '/challenges?q=' + encodeURIComponent(q) : '/challenges')` — **search routes to Practice, not a search page**
- **L84-95**: trial/dunning derived from `profile.subscription` / `profile.dunning`
- **Banners L214-219**: `<TrialBanner>` when `trialDaysLeft <= 7`; `<DunningBanner>` when `showDunning`
- **Desktop bar L222-257**: `<div data-topnav className="hidden lg:block">` wrapping `<TopUtilityBar>`:
  - `searchPlaceholder="Search topics, problems, or interviews..."`, controlled `searchValue`/`onSearchChange`/`onSearchSubmit`/`searchInputRef`
  - `avatarSlot={<AvatarMenu/>}`
  - `endSlot` (L233-255) = **the icon buttons**:
    1. `<SpendIndicator/>` (only `!isPro`) — L235
    2. **Mute toggle** L236-244: `toggleMuted` from `useHatchSonics()`; `size-[34px] rounded-lg border border-hairline bg-white`; icon `VolumeX`/`Volume2` 16px
    3. **Tour** L245-253: `window.dispatchEvent(new Event('start-intro-tour'))`; icon `Compass` 16px; same `size-[34px]` chrome
  - (The bell is rendered by `TopUtilityBar` itself, L156-166 — `onNotificationsClick` is **not passed**, so it is a no-op button.)
- **Mobile bar L260-268**: `<div data-topnav className="flex items-center gap-3 border-b border-hairline bg-page-field px-4 py-3 lg:hidden">` — wordmark `h-7 w-[147px]` + `<AvatarMenu compact/>`. No search, no sidebar.

**`AvatarMenu` (L97-210)** — trigger: avatar `size-8` rounded-full, gradient `#4a7c59→#264a34`, initials via `getInitials` (L19-25); non-compact also shows display name (`text-[13.5px] font-bold`) + gold Pro chip.
Dropdown `absolute right-0 top-11 z-50 w-[min(310px,calc(100vw-1.5rem))] rounded-xl border border-hairline bg-card-bright py-1 shadow-lg` (L132). Contents in order:
1. Name + plan line ("Pro annual"/"Pro monthly"/"Free plan") — L133-142
2. `<FreemiumUsageSummary plan compact/>` — L144
3. "Upgrade plan" button (free only) → `openUpgrade` — L146-155
4. Link `/affiliates` "Affiliates" — L156-164
5. "Send feedback" → `openFeedbackModal()` — L165-176
6. Link `/settings` "Settings" — L177-185
7. Link `/affiliate` "Affiliate" (only if `AFFILIATES_ENABLED`) — L186-196
8. "Log out" → `handleLogout` (text-error) — L197-205

### 1.6 `src/components/redesign/TopUtilityBar.tsx` (190 lines)

- Props interface `TopUtilityBarProps` L7-53: `searchPlaceholder?`, `onSearchClick?`, `searchValue?`, `onSearchChange?`, `onSearchSubmit?`, `searchInputRef?`, `streakDays?`, `bestStreakDays?`, `totalXp?`, `level?`, `onNotificationsClick?`, `hasUnreadNotifications?`, `avatarInitial`, `displayName`, `isPro?`, `onAvatarClick?`, `endSlot?`, `avatarSlot?`, `avatarImageUrl?`, `className?`
- **Bar container L87**: `flex items-center gap-6 border-b border-hairline bg-page-field px-8 py-4` (→ height ≈ 34px control + 32px padding ≈ **66-67px**)
- Search pill L89-106 (form when live) / L108-119 (button): `max-w-[480px] flex-1 rounded-lg border border-hairline bg-white px-3.5 py-2.5`; `⌘K` kbd chip L103-105
- Right cluster L121: `ml-auto flex items-center gap-[22px]`
- Streak block L122-136 (`Flame` text-flame) — **hidden unless `streakDays > 0`** (L82); "Best: N" sub-line
- XP block L138-152 (`Zap` text-gold) — hidden unless `totalXp > 0` (L83); "Level N" sub-line
- **Note**: `AppTopShell` does **not** pass `streakDays`/`totalXp`/`level`, so streak + XP clusters never render in the (app) shell today.
- Bell L156-166: `size-[34px] rounded-lg border border-hairline bg-white`; unread dot `size-[7px] bg-flame`
- Default avatar trigger L168-186 (overridden by `avatarSlot`)

### 1.7 Mobile bottom tabs — `src/components/shell/BottomTabs.tsx` (55 lines)

- `tabs` array **L6-11** (Material Symbols icon names):
  | id | href | icon | label |
  |---|---|---|---|
  | home | `/dashboard` | `home` | Home |
  | practice | `/challenges` | `track_changes` | Practice |
  | library | `/explore` | `menu_book` | Library |
  | progress | `/progress` | `bar_chart` | Progress |
- `isTabActive` L13-20: home = `/` \| `/dashboard` \| `/dashboard/*`; practice = `/challenges*` \| `/workspace/challenges*` \| `/live-interviews*`; library = `/explore` \| `/explore/*`; else progress
- Nav L26: `fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant bg-surface-container-low pb-[env(safe-area-inset-bottom)] lg:hidden`
- Item L36-38: `min-h-11 flex-1 flex-col px-1 py-2`; active → `mx-0.5 rounded-2xl bg-primary-fixed text-primary` + `'FILL' 1`
- Same `data-hatch-target` anchors as the sidebar (L35)

### 1.8 Floating Hatch — `src/components/shell/FloatingHatch.tsx` (~580 lines)

- **Suppressed** on `/workspace/challenges/*` unless a cue is active — `isInWorkspace` L119, early return L359
- Wrapper L370-375: `fixed z-[60] flex flex-col items-end gap-2 pointer-events-none`, position class L345: `right-4 md:right-5` + `bottom-24 md:bottom-5` (`bottom-24 md:bottom-20` on `/workspace`)
- **FAB** L537-573: `width: 52, height: 52`, `rounded-2xl`, gradient `#4a7c59→#264a34` (open: `#264a34→#1a3325`), `data-testid="hatch-fab"`; unread dot L567-572
- **Panel** `PresencePanel` L377-534: `width: 320, height: 440`
- **Event listener `open-ask-hatch`** L151-160 — `detail.prompt` primes the input (only for a fresh conversation, via `promptForFreshConversation`, L154) then `setOpen(true)`
- Chat POST → **`/api/hatch/chat`** L175-185, body `{ message, history, challengeId: null, challengePrompt: null, pageContext }`; `pageContext` from `buildHatchPageContext(pathname)` (L172, `@/lib/hatch/page-context`)
- Messages persist in `HatchContext` (`chatMessages`/`setChatMessages`, L122-123)
- Cue click telemetry → `POST /api/hatch/interactions` `{ kind:'cue_click', payload:{ path, cta } }` (L218-234), sendBeacon preferred
- Empty-state CTA `runPagePromptCta` L304-336 — may `GET /api/hatch/pick` for `show-plan`
- "Show me around" button L459-471 → dispatches `start-intro-tour`
- Note L338-340: proactive nudge bubbles were removed 2026-07-24; panel is click-to-invoke only.

### 1.9 Intro tour — `src/components/shell/IntroTourController.tsx` (83 lines)

- Auto-start conditions **L50-62** (all must hold): not already latched (`sessionStorage` key `intro-tour:auto-started`, L23-33), `!loading && profile`, onboarding modal closed, `pathname.startsWith('/dashboard')`, **not mobile** (`max-width: 767px`, L16-19), `profile.onboarding_completed_at` set, `!profile.has_seen_hatch_intro`
- Manual trigger L65-75: window event **`start-intro-tour`**; navigates to `/dashboard` first if elsewhere
- Renders `<TourRunner config={MAIN_TOUR} active={active && !onboardingOpen}/>` (L78-82); config `src/lib/tours/mainTour.ts`, engine `src/lib/tours/shepherdEngine.ts` (`setCursor`)

### 1.10 `(workspace)` layout — `src/app/(workspace)/layout.tsx` (55 lines)

- `WorkspaceLayoutInner` L14; default export wraps in `<Suspense>` L49-55
- **Early return** for share routes: regex `^\/workspace\/challenges\/[^/]+\/share(?:\/[^/]+)?$` (L20, return L22) → children only
- Search params consumed: `from_plan`, `from_domain`, `cid` (L17-19)
- Tree: `HatchProvider` → `SessionProvider` (**no `initialProfile`**) → `div.flex h-screen min-w-0 flex-col bg-background` (L27) → `<TopNav/>` (L28) → `div flex min-w-0 flex-1 overflow-hidden` (L29) containing `<StudyPlanIndexPanel planSlug activeChallengeId>` (L31, if `from_plan`) or `<DomainIndexPanel domainSlug activeChallengeId>` (L34, if `from_domain` and no plan), then `<main className="relative min-w-0 flex-1 overflow-hidden">` (L36) → `<BottomTabs/>` (L40) → `<FloatingHatch/>` (L41) → `<UpgradeModalHost/>` (L42)

**`src/components/shell/TopNav.tsx` (336 lines)** — the centred pill nav:
- `NAV_ITEMS` **L15-20** — identical four entries to BottomTabs (Material Symbols icons `home`/`track_changes`/`menu_book`/`bar_chart`)
- Wordmark L121-123: `h-8 w-[168px] sm:h-12 sm:w-[242px]`
- Pill nav L126-179: outer `hidden min-w-0 flex-1 justify-center lg:flex`; `<nav className="flex min-w-0 gap-1 rounded-full border p-1">` with `background: var(--color-surface-container-low)`
- Each item L148-174: `inline-flex items-center gap-[7px] px-2.5 lg:px-4 py-2 rounded-full text-[14px] font-bold min-h-11`; active → inline `background: var(--color-primary); color: var(--color-on-primary)` + `'FILL' 1`; per-item `AppTooltip` copy L140-145; anchors `data-hatch-target`
- Right cluster L182-…: mute toggle L191-201 (`h-8 w-8 rounded-full`), tour button L204-212 (icon `tour`, dispatches `start-intro-tour`), `SpendIndicator` L215-219 (`!isPro`), Upgrade pill L221-234, then avatar menu L237+
- Measured header height ~67px (see memory note `project_workspace_layout_session_provider`).

### 1.11 `(marketing)` layout — `src/app/(marketing)/layout.tsx` (13 lines)

Pure CSS-import shell. Imports `./v3/v3-landing.css`, `v3-pages.css`, `lead-magnet.css`, `lead-magnet-report.css`, `lead-magnet-instant.css` (L5-9). Returns `<>{children}</>` (L12) — no nav, no provider. The V3 design system is scoped under `.v3`.

---

## 2. PROFILES

### 2.1 Columns added by migrations (grep of every `ALTER TABLE profiles`)

Base table: `supabase/migrations/001_initial_schema.sql:15`.

Columns added later (union across migrations; some entries in the grep belong to sibling tables in the same files — the profile-relevant set):
`active_plan_id, active_role, affiliate_id, archetype, archetype_description, avatar_url, calibration_scores, cc_analytics_access, cc_claude_state_uri, dashboard_card_sizes, dashboard_cards, dismissed_cards, has_seen_hatch_intro, industry_focus, industry_interests, interview_date, interview_meta, is_premium, onboarding_completed_at, past_due_since, payment_failures, preferred_role, prep_timeline, primary_goal, primary_role, pro_access, referral_source, role, role_context, streak_days, streak_shield_count, subscription_status, weakness_move, xp_total`

Key locations:
- `dashboard_cards` JSONB + `dismissed_cards` TEXT[] + `interview_date` DATE — `supabase/migrations/012_dashboard_preferences.sql:11-14`, duplicated at `022_dashboard_preferences.sql:11-14` (022 is the `extensions.vector`-qualified re-issue). Default JSONB: `["quick_take","next_challenge","move_levels","productiq","hot_challenges","discussions","leaderboard","notes","interview_countdown","recent_activity"]`
- `interview_meta` JSONB `'{}'` — `020_interview_meta.sql:1`
- `role_context` text — `007_onboarding_responses.sql:14`
- `streak_days` / `xp_total` mutated by `update_user_streak` RPC — `005_achievements.sql:57-59`, corrected in `042_xp_streak_rpc_fix.sql:23-25` (042 no longer bumps xp)
- Standalone `dashboard_preferences` **table** was archived: `029_archive_orphaned_tables.sql:20` renames it to `_archived_dashboard_preferences`. Only the profile *columns* remain.

**No generic preferences/settings JSON column** on profiles — the closest are `dashboard_cards` (JSONB array), `dashboard_card_sizes`, `dismissed_cards` (text[]), `interview_meta` (JSONB), `calibration_scores`.

### 2.2 `src/app/api/profile/route.ts` (141 lines)

- **Zod `RequestSchema` L11-22** — accepts **only two fields**:
  - `display_name`: `string().trim().min(1).max(80).optional()`
  - `avatar_url`: `union([string().url().max(2048), literal(''), null]).optional()`
  - `superRefine` L14-22 rejects an empty body ("At least one profile field is required.")
- **`GET` L31-117**:
  - mock stub L33-59
  - profile select L67: `id, display_name, avatar_url, plan, role, preferred_role, streak_days, streak_shield_count, xp_total, onboarding_completed_at, has_seen_hatch_intro, archetype, archetype_description, created_at, updated_at, pro_access, subscription_status, payment_failures, past_due_since` (admin client, `.single()`)
  - `subscriptions` select L68-72: `plan, status, current_period_end, billing_interval, stripe_price_id, cancel_at_period_end, cancel_at, canceled_at`
  - `challenge_attempts` head-count for today L73-77 → `daily_attempts_today`
  - Error handling L80-92: `PGRST116` → 404 `profile_not_found`; anything else → 500 `profile_query_failed` (deliberate, to surface schema drift)
  - L94-97: `effectivePlanFromRows`, `dailyLimit = plan==='pro' ? null : 3`, `getUsageForUser`
  - L101-105: `computeDunningStatus({subscription_status, past_due_since, payment_failures})`
  - Response L107-116: `{...profile, plan, email, subscription, dunning, usage, daily_attempts_today, daily_limit}`
- **`PATCH` L119-141**: auth → zod parse (400 with `issues[]` on failure) → `adminClient.from('profiles').update(updates).eq('id', user.id).select().single()`. **`dashboard_cards` is not writable through this route.**

### 2.3 Client read path — `src/context/SessionContext.tsx`

- `SessionProfile` interface **L16-38**: `id, streak_days, longest_streak?, xp_total, display_name, avatar_url, plan, onboarding_completed_at, has_seen_hatch_intro, daily_attempts_today?, subscription?, dunning?`
- `UsageData`/`FeatureUsage` L40-50; `DEFAULT_USAGE` L52-56 (`challenges 20`, `interviews 5`, `hatchAiCents 35`, 30-day windows)
- Context value L58-64: `{ profile, usage, userId, loading, refresh }`
- Fetches `/api/profile` **once per session** (comment L6-14); refreshes only on the `challenge-completed` / `profile-stats-updated` window events or an explicit `refresh()` — deliberately **not** pathname-dependent.

### 2.4 `dashboard_cards` usage

- `src/lib/data/dashboard.ts:42` — `select('dashboard_cards, dismissed_cards, interview_date')`, L47 falls back to `MOCK_DASHBOARD_PREFERENCES.dashboard_cards`
- `src/lib/mock.ts:57` (type) and `:95` (default array)
- **`src/app/(app)/dashboard/page.tsx` never reads it.** The current dashboard renders a fixed component set; `dashboard_cards` / `CardPicker.tsx` / `src/components/dashboard/cards/*` are legacy from the pre-redesign bento dashboard.

---

## 3. DASHBOARD — `src/app/(app)/dashboard/page.tsx` (320 lines)

Server component. `loadDashboard()` L113-267 wrapped in React `cache()` (L269).

### 3.1 Data fetch — one `Promise.all`, **L133-143**

| # | Client | Query | Feeds |
|---|---|---|---|
| 1 | `supabase` (RLS) | `profiles.select('display_name, streak_days, primary_goal, prep_timeline, preferred_role').eq(id).single()` | greeting, streak, difficulty targeting, curated first rep |
| 2 | `admin` | `move_levels.select('move, xp, level, progress_pct').eq(user_id).order(xp asc)` | focus move / weakest move |
| 3 | `admin` | `challenge_attempts.select('id, challenge_id, status').eq(user_id)` | `hasAnyAttempts`, `completedIds` |
| 4 | `admin` | `user_streaks.select('date, completed').eq(user_id).gte('date', monday)` | week strip |
| 5 | `admin` | **`challenge_attempts.select('challenge_id, current_step, challenges(id,slug,display_number,challenge_type,title,difficulty)').eq(user_id).eq('status','in_progress').order('started_at' desc).limit(1).maybeSingle()`** | **"Continue your challenge"** |
| 6 | `admin` | `challenges.select('id, prompt_text, move_tags').eq('challenge_type','quick_take').eq('is_published',true).order('created_at' asc)` | Quick Take |
| 7 | `admin` | `interview_loops.select('id,title').eq(user_id).eq('status','paused').order(created_at desc).limit(1).maybeSingle()` | paused interview |
| 8 | — | `getEnrolledPlans(user.id)` (`@/lib/data/study-plans`) | study path |
| 9 | — | `withSoftTimeout(getHatchContext(user.id), 1600, null)` (`@/lib/hatch-context`) | Hatch copy |

Follow-up queries (sequential, conditional):
- **Paused round** L162-167: `loop_rounds.select('session_id, round_index, discipline').eq('loop_id').eq('status','paused')` → href `/live-interviews/{session_id}?loop_id=&round_index=&discipline=` (L173)
- **First rep** L194-201 (only when no resume **and** no attempts): `getCuratedFirstRepSlug(profile.preferred_role)` → `challenges.select('id,slug,title,difficulty,display_number,challenge_type,scenario_context,domain:domains(title)').eq('slug', slug).eq('is_published', true)`; href `challengePath(first)` else `FIRST_REP_FALLBACK_HREF`; `firstScenario = scenario_context`
- **Next rep** L203-225 (attempts exist, no resume): `challenges` where `is_published`, `challenge_type != 'quick_take'`, `contains('move_tags',[weakestMove])`, `in('difficulty', targetDifficulties(...))`, excluding `completedIds`; fallback L212-219 drops the move/difficulty filters

Helpers: `targetDifficulties` L62-76 (avgXp <100 → easy/medium, <300 → medium/hard, else hard; bumped harder for `land_pm_adjacent`/`level_up_current`/`lt_1mo`); `buildWeek` L90-107 (Monday-anchored, local-date keys, labels `M T W T F S S`); `flowStepNumber` L56-60 over `FLOW_STEP_ORDER = ['frame','list','optimize','win']` (L22).

### 3.2 Hatch copy selection — L243-257
- resume → `"You already have momentum on {title}…"` / prompt `"How should I approach the next step in {title}?"`
- weakest competency present → `"{Focus} is the clearest area to strengthen next…"` / `"Why is today's challenge a good way to strengthen {Focus}?"`
- continuePlan → plan-specific / else generic fallback

### 3.3 Render tree — `DashboardContent` L280-310

`<main className="mx-auto w-full max-w-[1400px] px-4 py-5 font-body sm:px-7 sm:py-7 lg:px-9">` (L273) → `<UpgradedBanner/>` in Suspense (L274) → `<DashboardContent/>` in Suspense with `<DashboardSkeleton/>` (L275, skeleton L312-320).

```
section.learning-home-stage (L284)
  ├ <LearningGeometry/>                                 L285
  ├ .learning-welcome  (L286-290) — "Welcome/Welcome back, {name}" + headline + sub
  └ .learning-home-primary (L291)
     ├ <DashboardHero displayName action firstScenario/>  L292
     └ <HatchSuggestionCard message prompt/>              L293
<PracticeAreaGrid/>                                       L296
div.grid lg:grid-cols-[minmax(0,1.55fr)_minmax(290px,.7fr)] (L297)
  ├ col A: <ContinueLearning plan unavailable pausedInterview/>  L299
  │        <QuickTakePanel prompt challengeId move/>  (only if prompt_text) L300-302
  └ col B: <ProgressSnapshot week streakDays focusMove/>          L305
```

### 3.4 Card-by-card

**`DashboardHero`** — `src/components/redesign/dashboard/DashboardHero.tsx` (35 lines)
- Props L7-11: `displayName`, `action: ResumeOrStartAction|null`, `firstScenario?`
- Eyebrow L25: `resume` → **"Continue your challenge"**; `first` → **"A good place to begin"**; else "Recommended for you"
- Meta L17-21: resume → "Step N of 4" or difficulty; next → `domain · difficulty`
- CTA L28-32: `href = action.href ?? '/challenges'`, label "Continue working" / "Explore challenge" / "Browse challenges"; anchors `data-hatch-target="dashboard-hero"` (L22) and `"dashboard-session"` (L28)

**`HatchSuggestionCard`** — `src/components/redesign/dashboard/HatchSuggestionCard.tsx` (21 lines) — **"A thought from Hatch."**
- Client component; props `{ message, prompt, buttonLabel = prompt }` (L6)
- **Opens the chat via** `ask(q)` L7-9: `window.dispatchEvent(new CustomEvent('open-ask-hatch', { detail: { prompt: q } }))` → consumed by `FloatingHatch` L151-160
- Two buttons: L16 (the contextual `prompt`), L17-19 (fixed `'Help me choose what to learn next based on my recent work and goals.'`)
- `HatchImage state="thinking" size={43}` L12

**`QuickTakePanel`** — `src/components/redesign/dashboard/QuickTakePanel.tsx` (234 lines)
- Props L10-14: `prompt`, `challengeId`, `move?`; export const `QUICK_TAKE_ANCHOR = 'quick-take'` (L8); container `id="quick-take"` L137
- **Submit → `POST /api/challenges/quick-take/submit`** L81-85, body `{ challenge_id, response_text }`
- Error branches L88-102: `status==='not_ready'`, `code==='limit_reached'`, `code==='rate_limited'`
- On success L105: dispatches `profile-stats-updated` `{source:'quick-take'}` → triggers `SessionContext.refresh`
- **"Try another" → `GET /api/challenges/quick-take/next?exclude={id}&move={move}`** L117-124
- Grade bands L38-43: ≥0.8 Sharp, ≥0.5 Solid, ≥0.2 Surface, else Weak
- Hash-focus effect L67-74 (`#quick-take` focuses the textarea); textarea `maxLength={6000}` L217
- **Only rendered for returning users** — `quickTakeForReturningUser` (action.ts L31-33) nulls it when `!hasAnyAttempts`

**`PracticeAreaGrid`** — `src/components/redesign/dashboard/PracticeAreaGrid.tsx` (35 lines)
- **Fully static** — `AREAS` array L4-11, **no counts, no DB**:
  | label | href |
  |---|---|
  | Coding / DSA | `/challenges?discipline=algorithm` |
  | SQL & Data | `/challenges?discipline=sql` |
  | System Design | `/challenges?discipline=system_design` |
  | Data Modeling | `/challenges?discipline=data_modeling` |
  | AI Analytics | `/challenges?discipline=analytics` |
  | Product Sense | `/challenges?discipline=product_sense` |
- Grid L24: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`, `rounded-2xl border border-hairline bg-card-bright`; "View all" → `/challenges` (L21)

**`ContinueLearning`** — `src/components/redesign/dashboard/ContinueLearning.tsx` (83 lines) — **"Study path"**
- Props L11-19: `plan: StudyPlanWithItems|null`, `unavailable: boolean`, `pausedInterview`
- Plan chosen in page.tsx L234-236: first enrolled plan with `0 < progress_percentage < 100`, else first `< 100`, else null
- Paused-interview strip L30-41 → `pausedInterview.href`
- Plan card L50-70: progress bar from `plan.progress_percentage`, CTA `/explore/plans/{plan.slug}` labelled "Continue"/"Start path"
- Empty/unavailable states → `/explore/plans` (L47, L78); header link "All paths" → `/explore/plans` (L27)

**`ProgressSnapshot`** — `src/components/redesign/dashboard/ProgressSnapshot.tsx` (58 lines) — **"Your progress"**
- Props L11: `week: WeekDay[]` (`{label, completed, today}` L4), `streakDays: number`, `focusMove: {move, level, progress_pct}|null`
- Source: `user_streaks` (week), `profiles.streak_days`, `move_levels` (focus)
- Empty state L23 when no activity; "Details" → `/progress` (L19)

**`action.ts`** — `src/components/redesign/dashboard/action.ts` (33 lines)
- `canonicalResumeHref` L11-13 → `` `${challengePath(challenge)}?resume=1` ``
- `resolveDashboardAction` L15-29: resume > (first, only if `!hasAnyAttempts`) > next
- `quickTakeForReturningUser` L31-33
- Tests: `action.test.ts`

**`getCuratedFirstRepSlug`** — `src/lib/onboarding/curated-first-rep.ts` (41 lines)
- `DEFAULT_FIRST_REP_SLUG = 'template-gallery-launch'` L18
- `ROLE_TO_FIRST_REP_SLUG` L20-31: swe → `your-ai-agent-booked-the-wrong-meeting`; ml_eng → `your-ml-model-is-95-accurate-but-users-hate-it`; data_eng → `how-do-you-know-if-your-ai-native-product-is-working`; devops → `the-4-minute-deploy-nobody-uses`; em → `new-feature-vs-tech-debt-allocating-next-quarter`; founding_eng → `how-much-autonomy-should-your-ai-agent-have`; tech_lead → `hp-google-youtube-watch-time-drop`; designer → `the-onboarding-vs-retention-paradox`; pm & data_scientist → default
- `getCuratedFirstRepSlug(role)` L33-38 (unknown role → default); `FIRST_REP_FALLBACK_HREF = '/challenges'` L41

**Hatch chat pop-up for new users** — there is **no auto-opening chat**. Two mechanisms only:
1. `HatchSuggestionCard` buttons → `open-ask-hatch` event (user-initiated)
2. `IntroTourController` auto-starts the **Shepherd tour** (not the chat) once, gated on `!has_seen_hatch_intro && onboarding_completed_at && desktop && /dashboard` (L50-62)
Proactive nudge bubbles were deleted 2026-07-24 (`FloatingHatch.tsx` L338-340).

---

## 4. LIBRARY (`/explore`)

### 4.1 `src/app/(app)/explore/page.tsx` (108 lines) — server, `dynamic = 'force-dynamic'` (L10)

`Promise.allSettled` **L21-29**, seven sources:

| Source | Table(s) | Notes |
|---|---|---|
| `getLearnModuleSummaries()` | `learn_modules` (`select('*').order('sort_order')`) — `src/lib/data/learn-modules.ts:19-22` | guides |
| `getStudyPlanSummaries()` | `study_plans` `.eq('is_published',true).order('created_at')` — `src/lib/data/study-plans.ts:14-17` | throwing availability signal |
| `getStudyPlans(user?.id)` | `study_plans` + `challenge_attempts` (`study-plans.ts:279,286`) + `user_learn_progress` (`:310`) | enriched w/ progress |
| `getAutopsyCompanies()` | `src/lib/autopsies/queries.ts:83` | company accent/name lookup |
| `getPublishedAutopsyStories()` | `queries.ts:114` | autopsy items |
| `getUserBookmarks(true)` | `autopsy_bookmarks` | saved set; `strict=true` → throws |
| `user_learn_progress.select('module_id').eq(user_id)` (L28) | `user_learn_progress` | guide progress % |

- Fallback L36-46: if enrichment returns nothing but the catalog has rows, synthesise plans from `planCatalog` with zeroed progress
- `unavailableKinds` L50-54 from rejected promises → banner
- `completedByModule` L56-58; guide progress = `round(completed / chapter_count * 100)` (L67)
- **Item mapping**:
  - guides L64-75: `href /explore/modules/{slug}`, `meta "{chapter_count} chapters · {est_minutes} min"`, accent `module.accent_color || '#2f6b4f'`
  - autopsies L77-92: `href /explore/autopsies/{companySlug}/stories/{slug}`, `bookmarked` from `savedStories` set (L62), **`progressKey: hp_reader_{companySlug}/{slug}`** (L89), accent `company.accent || '#c48a2c'`
  - plans L94-105: `href /explore/plans/{slug}`, eyebrow `'Enrolled'` when enrolled, `progress` only when enrolled, accent `'#8c6830'`
- Renders `<LibraryCatalog items unavailableKinds savedUnavailable/>` L107

### 4.2 `src/app/(app)/explore/LibraryCatalog.tsx` (187 lines) — client

- Types L7-12: `LibraryKind = 'guide'|'autopsy'|'plan'`; `LibraryItem { id, kind, title, description, href, eyebrow, meta, accent, searchText, bookmarked?, progress?, progressKey? }`
- `categoryCopy` L14-19, `iconByKind` L21
- **State is component-local, no URL params**: `query` L34, `savedOnly` L35, `category` L36, `deviceProgress` L37
- **"Continue where you left off" reads localStorage** — `readProgress(key)` L23-31 parses `JSON.parse(localStorage[key]).scrollPct` (key = `hp_reader_{company}/{story}`); effect L39-46; merged L48; band L106-112 = items with `0 < progress < 100`, sorted desc, `.slice(0,3)` (L54)
- **Featured card** L55: `bookmarked` item → else first `autopsy` → else `items[0]`. Rendered only when no query, no savedOnly, category `all` (L104). `Featured` component L142-159 — eyebrow reads **"Saved for you"** when `item.bookmarked`, else "From the Library" (L146)
- `counts` L56-61 (all / guide / autopsy / plan) — shown inside each chip
- **Filter chips** L89-96: category buttons (`aria-pressed`, active `bg-[#174a34] text-white`) + a "Saved stories" toggle that also flips category to `autopsy`
- **Page search** L79-86: `<input id="library-search" type="search">`, purely client-side substring match over `` `${title} ${description} ${eyebrow} ${searchText}` `` (L52). No API call, no route change.
- `activeUnavailable` L63; states: unavailable L122-126, results grid L128, empty L130-134
- `LibraryCard` L171-186 shows a "Saved" chip when `item.bookmarked` (L177) and a progress bar (L183)

### 4.3 Save / unsave — `src/lib/showcase/bookmarks.ts` (`'use server'` server actions, **not** an API route)

- Table **`autopsy_bookmarks`** (`supabase/migrations/063_autopsy_bookmarks.sql:5`; index `(user_id, created_at DESC)` L15-16), columns `user_id, company_slug, story_slug, created_at`
- `getBookmarkState(companySlug, storySlug)` L14-32
- `toggleBookmark(companySlug, storySlug)` L38-75 — delete if exists (L58-63) else insert (L68-70); both `revalidatePath('/explore')`; throws if unauthenticated (L45)
- `getUserBookmarks(strict = false)` L82-99 — `select('company_slug, story_slug').eq(user_id).order('created_at' desc)`; throws on error only when `strict`

### 4.4 Sub-list pages

| Route | File | Data source |
|---|---|---|
| `/explore/plans` | `src/app/(app)/explore/plans/page.tsx` (14 lines) | `getStudyPlans(user?.id)` + `getEnrolledPlans(user.id)` (L8-11) → `<StudyPlansClient studyPlans enrolledPlans/>` (L13) |
| `/explore/modules` | `src/app/(app)/explore/modules/page.tsx` | `getLearnModuleSummaries()` (L33, `.catch(() => [])`) + admin `user_learn_progress.select('module_id').eq(user_id)` (L39-43) → per-module `completed_chapters` / `progress_percentage` (L52-58); renders a dark hero + module grid + continue-reading band |
| `/explore/autopsies` | `src/app/(app)/explore/autopsies/page.tsx` | `getAutopsyCompanies()` + **`getQueuedAutopsyStories()`** (L24-27, note: *queued*, not *published* as on the hub), passed through `getReadableAppCompanies` / `getReadableAppStories` → `<ShowcaseIndexExperience companies stories/>` (L31-34). `dynamic = 'force-dynamic'` L11 |

Other `/explore` children present: `[skillArea]/`, `domains/`, `flow/`, plus `CollapsibleSection.tsx`, `ParadigmGrid.tsx`, `StudyPlanGrid.tsx`, `loading.tsx`.

---

## Notable facts worth flagging

1. **Two parallel shells exist.** `(app)` uses `redesign/AppSidebar` + `AppTopShell`; `(workspace)` still uses the older `shell/TopNav` centred pill nav. Both define the same four nav items in three separate arrays (`AppSidebar.tsx:33`, `BottomTabs.tsx:6`, `TopNav.tsx:15`).
2. **No sidebar collapse state exists** anywhere — `w-[232px]` is a literal.
3. **Streak/XP never render in the (app) top bar**: `TopUtilityBar` supports them but `AppTopShell` doesn't pass `streakDays`/`totalXp`/`level`, and the component hides them when absent (`TopUtilityBar.tsx:82-83`).
4. **The notification bell is inert** in the (app) shell — `onNotificationsClick` is not supplied.
5. **Top-bar search is not a search feature** — it redirects to `/challenges?q=`. The only real search UI is the client-side filter in `LibraryCatalog`.
6. **`profiles.dashboard_cards` is dead for the current dashboard.** Only `src/lib/data/dashboard.ts:42` reads it; `dashboard/page.tsx` renders a fixed component set. `src/components/dashboard/cards/*` (24 files) and `CardPicker.tsx` are legacy.
7. **`PracticeAreaGrid` counts are absent** — the six practice areas are a hardcoded static array with no DB-backed counts.
8. **Migrations 012 and 022 are duplicates** of the same `dashboard_preferences` content (022 is the `extensions.`-schema-qualified reissue).
9. `/explore` uses `getPublishedAutopsyStories`, while `/explore/autopsies` uses `getQueuedAutopsyStories` — different story sets on the two surfaces.
10. Bookmarks go through **server actions**, not an API route; there is no `/api/bookmarks`.