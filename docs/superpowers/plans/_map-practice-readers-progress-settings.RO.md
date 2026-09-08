Report complete.

# Code Map: Practice, Readers, Progress, Settings, Shared UI

## 1. PRACTICE — `/challenges`

### Route shell
- **`src/app/(app)/challenges/page.tsx`** (35 lines) — server component. Wraps in `UsageProvider` (`src/context/UsageContext`), `<main data-tour-target="practice-hero" className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6">`, Suspense → `FreePracticeContent`.
  - Accepted searchParams (L8–23): `company, difficulty, discipline, move, paradigm, q, real_interview, role, scope, tab, tag, technique, topic, type, view`.

### Server data container
**`src/app/(app)/challenges/FreePracticeContent.tsx`** (147 lines)
- Constants: `PREVIEW_PER_DISCIPLINE = 6` (L18), `DISCIPLINE_PAGE_SIZE = 30` (L20).
- L74–75: `discipline = normalizeDisciplineParam(discipline ?? type) ?? 'all'`.
- L77–87: builds `ChallengeListFilters` — SSR uses **first value only** of comma-joined multi-selects (`firstOf`). `real_interview` accepts `'1'` or `'true'`.
- L95–101: `Promise.all([getChallengeCounts(filters), isAll ? getChallengePreviews(filters, 6) : getChallenges({...filters, type: discipline}, {limit:30, offset:0})])`.
- L113–120: `getChallengeDescriptions(previewIds)` → `challengeTaskSummary` → `summaryMap` (grid blurbs only for on-screen rows).
- Header (L124–133): `LearningGeometry quiet`, eyebrow "Practice", h1 "A good problem. / A new perspective."
- **"Practice interviews" button** (L132): `<Link href="/live-interviews">`.
- L138: `<HatchPick className="w-full" />`; L140: `<ChallengeSearch total={counts.all} />`; L142: `<BillingUsageFromProfile className="lg:hidden …" />`.
- L146–153: `<FilteredChallengesView … />`.

### Data layer — `src/lib/data/challenges.ts`
- **`CHALLENGE_LIST_COLUMNS`** (L21–25) — 16 slim columns:
  `id, title, difficulty, challenge_type, display_number, slug, paradigm, estimated_minutes, topic_tags, technique_tags, is_real_interview, company_tags, relevant_roles, industry_tags, is_premium, domain_id`. Comment (L15–20): cuts payload ~6.0MB → ~0.42MB; `domains(...)` join dropped; detail/workspace still `select('*')` via `getChallengeById` (L696).
- `ChallengeListFilters` interface L32–43: `domainId, difficulty, paradigm, role, company, q, type, topic, technique, real_interview`.
- `CountDiscipline` type L68: `'all' | 'product_sense' | 'system_design' | 'data_modeling' | 'sql' | 'algorithm' | 'analytics'`.
- `PRODUCT_SENSE_TYPES = ['flow','freeform','quick_take']` (L67).
- `DISCIPLINE_PARAM_ALIASES` L79–83: `coding|dsa|coding-dsa → algorithm`; `normalizeDisciplineParam` L85.
- `applyChallengeFilters` L144–222: `.eq('domain_id')`, `.in('difficulty', expandDifficultyForQuery)`, `.in('paradigm')`, `.overlaps('relevant_roles')`, `.eq('challenge_type')`, `.eq('is_real_interview', true)`.
- **`getChallenges`** L224–288: `from('challenges').select(CHALLENGE_LIST_COLUMNS).eq('is_published',true).neq('challenge_type','quick_take')` → filters → `.order('created_at',{ascending:false})` → `.range(offset, offset+limit-1)`. Then attempts join: `from('challenge_attempts').select('challenge_id, total_score, status').eq('user_id', user.id).in('challenge_id', challengeIds)` → `buildStatsMap`.
- **`getChallengeCounts`** L511–549: per-discipline `select('id', { count:'exact', head:true })`; `counts.all` = sum of the **5 core** disciplines (analytics excluded); analytics only when `isAnalyticsFeatureEnabled()`.
- **`getChallengePreviews`** L556–608: one bounded slice per discipline (`range(0, perDiscipline-1)`), flat array.
- `getChallengeTagCounts` / `getTagCounts` L610–669 (topic/technique tallies).
- `getChallengeDescriptions` L671–694: `select('id, prompt_text, scenario_context, scenario_trigger, scenario_question, metadata')`.
- `getInProgressPractice` L328: `challenge_attempts` `.eq('status','in_progress').order('started_at', desc)`.
- `getPracticeCoverage` L378–430.

### Client view — `src/app/(app)/challenges/FilteredChallengesView.tsx` (790 lines)
- Props L22–36: `initialChallenges, initialDiscipline, counts, paradigms, summaries, previewPerDiscipline, pageSize`.
- `EMPTY_FILTERS` L38–46: `{difficulty:[], role:[], company:[], topic:[], technique:[], real_interview:false, resume:false}`.
- `DISCIPLINE_KEYS` L58: `['algorithm','sql','system_design','analytics','data_modeling','product_sense','all']`.
- `DISCIPLINE_LABELS` L61–68, `DISCIPLINE_COLORS` L69–76.
- URL state (all filters live in URL, comma-joined via `writeFilterValues` L92–98; read via `readFilterValues` L82–90):
  - `discipline` (or legacy `type`) L108–118; `q` L215; `sort` L217–218; **view state L220: `listView = parsedParams.get('view') !== 'grid'`** (list is default; toggle uses `window.history.replaceState`, L276–282 — no navigation).
  - `real_interview=1`, `resume=1` L211–212.
- `returnHref = pathname + '?' + searchString` L221 — threaded into every card link.
- `handleDisciplineChange` L230–241 clears `type/topic/technique/paradigm`.
- `useTopicTechniqueCounts` L384–411: two fetches to **`/api/challenges/count?…&groupBy=topic|technique`**.
- Render tree L295–375: `DisciplineChipRow` (inside `<section data-tour-target="practice-filters">`), `FilterDropdownBar`, `ActiveFilterPills`, `FilterBottomSheet`, then `AllPracticeView` (discipline==='all') or `DisciplineView`.
- `buildListQuery` L137–163 → `/api/challenges?discipline&q&difficulty&role&company&technique&topic&real_interview=1&resume=1&page&limit`.
- `AllPracticeView` L418–501 → `AllPracticeSection` L503–625 (per-discipline preview + "see all N →" + expandToFull/loadMore; resume filter forces refetch L582–585).
- `DisciplineView` L633–692: `flat = discipline==='analytics' || filters.resume || topic.length>0 || technique.length>0` (L661) → `FlatDisciplineList` else `GroupedChallengeList`. `SortSegmented` rendered at L667.
- `FlatDisciplineList` L695–790: page-1 refetch on discipline/topic/technique/q change; "Load more (N more)".

### Discipline chips — `src/components/redesign/practice/DisciplineChipRow.tsx`
- `CHIPS` L22–30 (key/label/description/icon/iconClass): algorithm "Coding / DSA" (Braces), sql "SQL" (Database), system_design "System design" (Network), analytics "AI Analytics" (LineChart), data_modeling "Data modeling" (Workflow), product_sense "Product sense" (Lightbulb), all "All practice" (LayoutGrid).
- Counts come from parent `counts(key)` → server `getChallengeCounts`. Each chip wrapped in `AppTooltip`, count badge L61–70.

### Filters — `src/components/challenges/FilterDropdownBar.tsx`
- `FilterState` L22–30. `DIFFICULTY_OPTIONS` from `@/lib/practice/difficulty` L37; `ROLE_OPTIONS` L38 (`SWE, Tech Lead, EM, ML Eng, Data Eng, DevOps, Founding Eng, PM, Designer, Data Scientist`); `COMPANY_OPTIONS` L39 (`Google, Meta, Stripe, Airbnb, Netflix, Uber, Amazon, Apple`).
- `DROPDOWNS` L51–57: difficulty, role, company, topic (dynamic), technique (dynamic). Topic/technique options built from `getTopicsForDiscipline`/`getTechniquesForDiscipline` + live counts (L163, L168).
- Pill toggles: **Real interview** L225–234, **Resume only** L236–245. View toggle (`LayoutGrid`/`List`) shown only when `showViewToggle` (i.e. `discipline === 'all'`).
- Also: `ActiveFilterPills.tsx`, `FilterBottomSheet.tsx` (mobile sheet).

### Search — `src/app/(app)/challenges/ChallengeSearch.tsx` (40 lines)
- **300ms debounce** (L28 `setTimeout(() => push(v), 300)`), writes `?q=`; placeholder `Search {total} challenges by title, company, technique, or tag…`. Filtering happens server-side in `applyChallengeFilters`/`/api/challenges`.

### Hatch's pick — `src/app/(app)/challenges/HatchPick.tsx` (59 lines)
- Uses `useNextChallenge()` (`src/components/redesign/practice/useNextChallenge.ts`) — module-level promise cache `cached` (L15) shared with the right rail; single `GET /api/challenges/next`.
- Renders `HatchImage size={44} state="speaking"`, eyebrow "Hatch's Pick", title, `tip`, button "Try Now" → `router.push('/workspace/challenges/{slug ?? id}')` (L28–31).
- **No dismiss/refresh affordance** — it re-fetches only on full page load.
- **`src/app/api/challenges/next/route.ts`**:
  - `WORKSPACE_TYPES = ['flow','system_design','data_modeling','sql','algorithm']` (L13).
  - Inputs (L93–105): `profiles.preferred_role`; `move_levels(move, xp)` ordered `xp asc limit 1` → `weakestMove`; `challenge_attempts` where `status='completed'` → `completedIds`; `buildSkillContextPack({userId, surface:'recommendation'})` from `@/lib/hatch/skill-context`.
  - `isCalibrated = levels.length>0 && completedAttempts.length>0` (L107).
  - Weakest FLOW move from `skillPack.raw.moveLevels` sorted by `level` (L112–115); `hatch_insight` via `deriveHatchInsight`.
  - Side effect: inserts `hatch_context` row `{context_type:'role_observation', content, is_active:true}` (L120–125).
  - Query L128–135: `challenges.select('id, slug, title, prompt_text, difficulty, domain_id, move_tags, relevant_roles, paradigm').eq('is_published',true).in('challenge_type', WORKSPACE_TYPES).contains('move_tags',[weakestMove])`, excludes completed, ORs `relevant_roles` on `preferred_role`. Fallback query L146–162 without move filter.
  - Response: `{challenge, reason, tip, targets_move, recommendation_type: 'weakest_move'|'fallback', is_calibrated, hatch_insight}`. Mock at L16–31.
- `learner_competencies` is **not** read here; it feeds `/api/dna` (Progress) instead. `skillPack.weakestCompetency` supplies the competency phrase in `moveTip` (L46–58).

### Card / row components
- **`ChallengeCard.tsx`** (69 lines, grid + list card): `disciplines` map L17–27 (label/icon/tone per `challenge_type`). Fields: discipline label, difficulty (`coerceDifficulty` + `DIFFICULTY_LABELS`), title, `challengeTaskSummary` description, tags (topic/technique/company/paradigm), footer status.
  - **Resume vs Start (L48)**: `href = appendReturnTo(challenge.is_in_progress ? \`${destination}?resume=1\` : destination, returnHref)`; `destination = challengePath(challenge)`.
  - Footer L60: `Completed` / `In progress` / `{n} attempts` / `Not started`. CTA L63: `View challenge` (locked) / `Continue working` / `Explore challenge`. Discussion link → `/challenges/{slug ?? id}/discussion`.
- **`GroupedChallengeList.tsx`** — `ChallengeRow` L151–240 (compact list row): status icon (`CheckCircle2`/`Timer`/`Circle` L126–130), title, number pill, topic/technique chips, `BadgeCheck` real-interview chip, `best_score`/100, difficulty pill (`DIFFICULTY_PILL` L146–150), **action label L133–137 `{completed:'Review', attempted:'Resume', not_started:'Start'}`**, `ArrowRight`/`Lock`.
  - href L160–163: `collectionParam ? basePath?{key}={slug}&cid={id}` : `appendReturnTo(basePath, returnHref)`.
  - `sortChallenges` L92–107 + `SORT_DESCRIPTOR` L109–113. `ServerGroupedList` L494; `FlatRows` L561, attached as `GroupedChallengeList.FlatRows` L574.
- **`LockedChallengeGrid.tsx`** — reads `useIsAtLimit('challenges')` from `UsageContext`, wraps in `MotionListItem`, passes `locked`.

### Status source of truth — `src/lib/challenges/status.ts`
- `ChallengeStats` L13–18: `attempt_count, best_score, is_completed, is_in_progress`.
- `buildStatsMap` L44–68: **table `challenge_attempts`, columns `challenge_id, total_score, status`**. `status === 'completed'` → completed (+best_score max); `status === 'in_progress'` → `is_in_progress`.
- `deriveChallengeStatus` L33–41: completed → attempted (in_progress or attempt_count>0) → not_started.

### Link helpers
- `src/lib/challenges/challengeNumber.ts`: `CHALLENGE_NUMBER_PREFIX` L14–24 (`ALGO/SQL/PS/QT/SD/DM/CCA/CCD`), `formatChallengeNumber` L27, `challengeNumberSlug` L37, `CHALLENGE_NUMBER_SLUG_RE` L46, `challengePath` (prefers text slug → number slug → id).
- `src/lib/navigation/return-to.ts`: `SAFE_RETURN_PREFIXES` L1–12; `sanitizeReturnTo` L14; `appendReturnTo` L33 → `?returnTo=`.

### Other
- `V2ChallengesSection.tsx` — "FLOW Challenges" grid, fetches `/api/challenges?paradigm&difficulty&role`; uses `ChallengeCardV2`. Not mounted by the current page.

---

## 2. MODULE READER

### `src/app/(app)/explore/modules/[slug]/page.tsx` (349 lines, `'use client'`)
Layout: `max-w-[1080px] flex items-start gap-10 px-4 pb-24 pt-7 lg:gap-14` (L300).

- **Left chapter index = `TocRail`** (L26–99), local to this file (not ReaderRail).
  - `<aside className="hidden lg:flex shrink-0 flex-col gap-4" style={{ width: 220, position:'sticky', top:96 }}>` (L45–48).
  - `ProgressRing` (`@/components/redesign/ProgressRing`) size 40, strokeWidth 4.5, shows `{activeIdx+1}/{module.chapter_count}`; pct = completedCount/chapter_count (L41).
  - Chapter buttons L61–87: index badge or `Check`, locked when `!is_unlocked && !is_completed`.
  - Bottom link L90–96: `href={backHref}` = `/explore/modules`, "All guides".
- **Center = `ReadingColumn`** (L103–231): `className="reading-col mx-auto w-full max-w-[760px] min-w-0"` (L150).
  - Kicker L151–157: `{module.name} · CHAPTER {data.sort_order} OF {module.chapter_count}`.
  - h1 L159; `data.hook_text` L163–167.
  - Body L170: `<ChapterBody body_mdx={data.body_mdx} figures={data.figures ?? []} hatchContextLabel="Active chapter body" />` (`src/components/learning/ChapterBody.tsx`, 71 lines — figures render as typed React components, not images).
  - **"Save"/completion (L189–213)**: button "Mark chapter complete" → `markComplete()` → `POST /api/learn/{slug}/{chapter}/complete`; on success `trackEvent(EVENT_CHAPTER_COMPLETED)` then `onComplete()`. There is **no bookmark/save-for-later** on modules.
  - **Prev/next**: footer has only *next* (L215–226, `nextChapter = chapters[currentIdx+1]`, gated on `is_unlocked || is_completed`) plus a "All guides" back link (L180–186). Prev is via the left rail (see comment L175–178).
- **Navigation state**: chapter is a **query param, not a route** — `handleSelectChapter` L248–253 does `router.replace('/explore/modules/{slug}?chapter={chSlug}', {scroll:false})` + `window.scrollTo({top:0})` + `trackEvent(EVENT_CHAPTER_OPENED)`.
- Active chapter resolution L241–245: `?chapter` → first unlocked-and-incomplete → `chapters[0]`.
- Mobile: `BackCrumb href="/explore/modules" label="All guides"` (L297) + a `<select id="guide-chapter">` chapter picker (L311–316).
- Hatch context attrs L290–293: `data-hatch-page-type="learning_module"`, `data-hatch-entity-id`, `data-hatch-active-chapter`.
- Decorative blob L295 (inline div, not LearningGeometry).

### `src/app/(app)/explore/modules/[slug]/[chapter]/page.tsx` (19 lines)
Pure redirect: `router.replace('/explore/modules/{slug}?chapter={chapter}')`.

### Hooks + API
- `src/hooks/useLearnModule.ts` (35 lines) → `GET /api/learn/{slug}`.
- `src/hooks/useLearnChapter.ts` (52 lines) → `GET /api/learn/{slug}/{chapter}`; `markComplete` → `POST …/complete`; `completeLearnChapter` exported L6.
- **`src/app/api/learn/[slug]/route.ts`**: `learn_modules.select('*')` L47; `learn_chapters.select('*')` L55; `user_learn_progress.select('chapter_id')` L63.
- **`src/app/api/learn/[slug]/[chapter]/route.ts`**: `learn_modules.select('id').eq('slug')` L39; `learn_chapters.select('*')` L43.
- **`src/app/api/learn/[slug]/[chapter]/complete/route.ts`** — **progress table = `user_learn_progress`** (`.upsert(...)` L33–34); then `rpc('update_user_streak', {p_user_id})` L42; then `session_events.insert(...)` L45.
- **TOC generation**: none — the module TOC is the `learn_chapters` row list (`title`, `sort_order`, `is_unlocked`, `is_completed`), not extracted headings. No heading-scan TOC in the module reader.
- **localStorage resume key**: none for modules — resume is server-side (active chapter derived from `user_learn_progress`).
- **Hero image fields**: no `cover_image`/`hero_image`/`image_url` used on `learn_modules`/`learn_chapters` in the reader. Visual assets come through `data.figures` (typed React figures in `ChapterBody`) — no image-URL column is read.

---

## 3. AUTOPSY READER

### Route — `src/app/(app)/explore/autopsies/[slug]/stories/[storySlug]/page.tsx` (119 lines, server)
- `generateStaticParams` L14–21 from `getQueuedAutopsyStories()` + `getReadableAppStories`.
- `generateMetadata` L27–46: title/description from `story.title`/`story.dek`, canonical `/explore/autopsies/{slug}/stories/{storySlug}`.
- Branching in `StoryPage` L48–118:
  1. `storyType === 'feature_autopsy'` → **`CinematicReader`** with `getBookmarkState(slug, storySlug)` + `getPrevNext(slug, storySlug)` (L51–68).
  2. `storyType === 'company_teardown'` → `getLegacyCompanyTeardown`; `reader === 'aarrr'` → `AutopsyReaderClient` (1023 lines, `../../AutopsyReaderClient`) with `resolvePracticeCards`; else `StoryReader` (`src/components/autopsy/StoryReader.tsx`).
  3. Fallback: `StoryReader` via `featureAutopsyToStory` (L92–101), then legacy-only path, then `notFound()`.
- **Back link target**: `backHref = '/explore/autopsies/{slug}'` (company hub) — set in `CinematicReader` L64 and passed to `StoryReader` L86/L98.

### `src/components/showcase/reader/CinematicReader.tsx` (174 lines)
- Props L27–33: `story: FeatureAutopsy, companyName, companyAccent, initialBookmarked, prevNext`.
- **Section ids** L42–51 from story shape: `lede`, `quick-read`, `flow-1..n`, `evidence`, `timeline`, `quote`, `principle`, `sources`. `tocItems` L52–61 label from `section.title` or fixed labels ("At a glance", "Evidence", "Timeline", "The quote", "The principle", "Sources"). **Not derived from markdown headings** — derived from the structured story object.
- Scroll: `useReaderScroll(sectionIds, contentRef)` (`src/hooks/useReaderScroll.ts`, 105 lines) → `{scrollPct, activeSection, visitedSections}`.
- **Resume**: `useReaderResume({storyKey: \`${story.companySlug}/${story.slug}\`, …})` L65–71 — **localStorage key `hp_reader_{companySlug}/{storySlug}`** (`keyFor` L58 in `src/hooks/useReaderResume.ts`). Stored shape `{sectionId, scrollPct, at, bannerDismissed}` L5–11. `WRITE_THROTTLE_MS = 500` L53; `MIN_RESUME_PCT = 4` L55. Restore effect L95–108 (600ms `persistReady` delay). Banner = `ResumeBanner variant="aarrr"` L155.
- Analytics: `EVENT_AUTOPSY_OPENED` L73, `EVENT_AUTOPSY_SECTION_VIEWED` L84, `EVENT_AUTOPSY_FINISHED` L88.
- Header L118–137: `reader-article-header` → `reader-back` Link (`ArrowLeft` + companyName), `BookmarkToggle`, kicker `Product autopsy · {story.estimatedReadTime}` (**read-time field = `estimatedReadTime`, `FeatureAutopsy` L120**), h1, `reader-dek`, `readerTopicTags(story.tags).slice(0,4)`, cover = `<LearningArtwork />` (CSS geometry, **not** a hero image).
- Mobile TOC L139–142: `<details className="learning-reader-mobile-contents"><summary>In this autopsy</summary>`.
- **Left "In this autopsy" index** L145–153: `<aside className="reader-outline">` containing `reader-outline-progress` — `{Math.round(scrollPct)}%` + a bar `width: {scrollPct}%` (progress % is **scroll-based**, not completion-based); nav buttons with `Check` when `visitedSections.has(id)` else zero-padded index; then `reader-hatch-note` button dispatching `window.dispatchEvent(new CustomEvent('open-ask-hatch', {detail:{prompt}}))` L152.
- Content L154–167: `FlowSectionDark`, `QuickReadDark`, `EvidenceLedgerDark`, `TimelineDark`, `QuoteDark`, `PrincipleDark`, `SourcePackDark`, `PrevNextChips` (all under `src/components/showcase/reader/sections/`).
- `INLINE_IMAGE_ROLES` L35: `['hatch-narrator','failure-mechanism','evidence-card','lesson-frame']` — inline images per flow section.
- Footer dock L169: `<ReaderDock scrollPct activeSection tocItems backHref companyName storyTitle />`.

### `ReaderDock` — `src/components/showcase/reader/ReaderDock.tsx` (138 lines)
Fixed `.sc-dock` toolbar: back Link, divider, `ProgressRing pct size={32} strokeWidth={2.5}` + `{scrollPct}%`, TOC toggle → `TocOverlay`, truncated story title. Optional `onNavigate` override (used by the AARRR reader's GSAP jump).

### `ReaderRail` — `src/components/showcase/reader/ReaderRail.tsx` (325 lines)
**Defined but not imported anywhere** (`grep -rln ReaderRail src/` returns only the file itself). The live left index is `CinematicReader`'s inline `<aside className="reader-outline">`.

### Save / bookmark — `src/lib/showcase/bookmarks.ts` (`'use server'`)
- **Table `autopsy_bookmarks`**, columns `user_id, company_slug, story_slug` (+`id`).
- `getBookmarkState(companySlug, storySlug)` → `.select('id').eq(user_id).eq(company_slug).eq(story_slug).maybeSingle()`; returns `{bookmarked:false}` for anon.
- `toggleBookmark(...)` — delete if existing else insert; throws when unauthenticated; calls `revalidatePath`.
- UI: `src/components/showcase/reader/BookmarkToggle.tsx` (48 lines).

### Story data — `src/lib/autopsies/db.ts`
- `getSupabaseAutopsyLibrary()` L241+:
  - `autopsy_companies.select('slug,name,dek,industry,accent,thesis,timeline')` L273–274.
  - `autopsy_content_stories.select([...])` L277–282 (includes `story_type`, `slug`, `company_slug`).
  - `autopsy_story_versions.select('id,company_slug,story_slug,version,status')` L320–323.
  - **`autopsy_story_images.select('story_version_id,role,bucket,storage_path,public_url,width,height,alt,caption,sha256,watermark,qa_status')`** L339–341 — images live in a Supabase **storage bucket** referenced by `bucket` + `storage_path`, surfaced as `public_url`. No `hero_image` column; roles come from `AutopsyImageRole` (`src/lib/autopsies/types.ts` L24 includes `'social-cover'`).
- Legacy stub `legacyStoryStub` L182–200: `estimatedReadTime: story.read_time ?? '12 min read'` (**legacy read-time column = `read_time`**), `canonicalPath: '/autopsies/{product.slug}/{story.slug}'`.
- `FeatureAutopsy` type — `src/lib/autopsies/types.ts` L110–137: `slug, companySlug, storyType, title, dek, queueRank, status, proofreadStatus, canonicalPath, estimatedReadTime, tags, sourceSummary, replacementPolicy, featured?, sources, metrics, images, quickRead, flow, backdropWord?, timeline?, comparison?, quote?, principle?, sourcePackSummary?`.
- Other libs: `app-library.ts` (`isReadableAppAutopsyStory` L8, `getReadableAppStories` L27, `getFeaturedAppStory` L66), `queries.ts` (`getAutopsyStory`, `getQueuedAutopsyStories`), `showcase-adapter.ts`, `legacy-showcase.ts`, `practice-links.ts`, `display-tags.ts`, `images.ts`, `storage.ts`.

### Marketing mirror
`src/app/(marketing)/autopsies/[companySlug]/stories/[storySlug]/page.tsx` — **redirect only**: `redirect('/autopsies/{companySlug}/{storySlug}')`. Same for the `(marketing)/autopsy/*` tree. The real marketing renderer is `src/components/autopsies/AutopsyPages.tsx`; `src/app/(app)/explore/autopsies/showcase.css` holds the reader CSS shared by both.

---

## 4. PROGRESS — `/progress`

### `src/app/(app)/progress/page.tsx` (1004 lines, `'use client'`)
**Data sources (all client fetches, L625–659):**
| Fetch | API | Tables |
|---|---|---|
| `/api/challenges/mastery` (L598) | mastery | `challenges`, `challenge_attempts` |
| `/api/attempts?limit=5&include_patterns=true` (L627) | recent attempts | `challenge_attempts` |
| `/api/live-interview/history?limit=3` (L632) | interviews | `live_interview_sessions` |
| `/api/hatch/growth-reflection` (POST, L636) | Hatch read | — |
| `/api/progress/reasoning-trajectory` (L641) | trajectory | `profiles`, `challenge_attempts`, `live_interview_sessions`, `claude_code_sessions`, `step_attempts`, `interview_grades`, `loop_rounds`, `challenges` |
| `/api/progress/learn-progress` (L647) | learn | `learn_modules`, `learn_chapters`, `user_learn_progress` |
| `/api/progress/streak-history` (L648) | heatmap | **`user_streaks`** |
| `/api/progress/activity-feed` (L649) | feed | **`session_events`** |
| `/api/profile` (L650) | profile | `profiles` (`streak_shield_count`, `streak_days`, `xp_total`, `archetype`) |
- Hooks: `useMoveLevels()` (`src/hooks/useMoveLevels`) → `move_levels`; `useProfile()`; `useLearnerDNAData()` from `./LearnerDNASection` → `useLearnerDNA` → `/api/dna` → **`learner_competencies`** (+`profiles`, `role_lenses`).

**Structure (render L813–1002):**
- **Hero** L814: `<LearningPageHeading eyebrow="Your progress" title="See how far you've come.">Your completed work, feedback, and learning history in one place.</LearningPageHeading>`.
- **"Your next focus"** L815: renders only when `weakest` exists. Computed L688–691 (`weakest = movesWithEvidence.reduce(min by pct)` — the slowest FLOW move with reps, from `useMoveLevels` `progress_pct`). Copy: "Build confidence in {move}." **CTA target: `/challenges`** ("Find a challenge →").
- **Stats row** L818–832: `<StatStrip>` (`@/components/redesign/StatStrip`) — `Challenges completed` (attempted), `Scored 80+` (mastered, `score >= 80`), `Practice coverage` (`attemptedPct`), `Total XP` + `Level {levelFromXp(xpTotal)}`. Mastery math L672–677.
- **Row 1 grid** `lg:grid-cols-[1.05fr_1.05fr_1fr]` L842:
  - **FLOW moves card** L843–869 — `FLOW_ROWS` L43–48 (`Frame/List/Optimize/Win` with `dotClass`/`barClass`), level + `progress_pct` bar or "Building evidence" chip. Footer `ViewLink href="/progress/skill-ladder"`.
  - **Skill profile (radar)** L871–898 — `<CompetencyRadarSvg competencies={dna.competencies} />` (defined in this file; also `CompetencyRadar` in `src/components/v2/CompetencyRadar.tsx` used by `LearnerDNASection`), `Focus area: {dna.weakest_link_label}`, link to `/progress/skill-ladder`.
  - **Activity grid** L900–928 — `data-testid="streak-heatmap"`, `FourWeekHeatmap` (defined L141–186 in-file): 4 rows × 7 cols Monday-first, `activeSet` from `streakDates`. Footer stats: Active days (`activeDays28`, L756–761), Streak (`profile.streak_days`), Shields (`streak_shield_count`).
- **Row 2** L931–981: Recent work timeline (`data-testid="activity-feed"`, `TimelineItem` L718–748, links to `/challenges/{id}/feedback?attempt=`, `ViewLink href="/history"`) + Learn progress card (links `/explore/modules/{slug}`).
- **`ReasoningTrajectorySection`** L983 (defined ~L370–560): discipline × FLOW-move grid, `TrajectoryStat`, `TrajectoryCellCard`, `TrendDot`, "Hatch read" `NoteCard` with `nextFocus.href` CTA "Start focused challenge", Evidence ledger.
- **Hatch's read** L986–1001: `NoteCard tint="mint"`, `HatchImage state="presenting" size={64}`, `<Md variant="chat" tone="inherit">`, share button → `/profile/share`.
- **Day-0 state** L776–812: gated on `isDayZero` (L753) — centered `HatchImage state="wave" size={120}`, CTA `/challenges`, FLOW method explainer.
- Loading skeleton L761–775 (`coreLoaded = attemptsLoaded && feedLoaded && !profileLoading`).
- `CARD_CLASS` L121, `CardTitle` L124, `ViewLink` L128, `EVENT_LABELS` L32–38.

### `src/app/(app)/progress/skill-ladder/page.tsx` (772 lines)
- `useMoveLevels()` L160; fetches L172–175: `/api/career-benchmark`, `/api/dna/recommend`, `/api/dna`, `/api/attempts?limit=20`. Default export L766.

### `src/app/(app)/progress/LearnerDNASection.tsx` (84 lines)
`useLearnerDNAData()` L14–29 wraps `useLearnerDNA` (`src/lib/v2/hooks/useLearnerDNA`); returns `{overall_level, competencies:[{label,score}], weakest_link_label, weakest_link_key}` using `COMPETENCY_LABELS`. `LearnerDNASection` supports `variant: 'standalone' | 'embedded'`.

### Submissions
No `/progress/submissions` route exists. Only `src/app/api/community/submissions`. Progress links to `/history` for full history.

---

## 5. SETTINGS — `/settings`

`src/app/(app)/settings/page.tsx` (1000 lines, `'use client'`)
- **Hero** L528: `<LearningPageHeading eyebrow="Your account" title="Make it yours." action={isPro ? <span …>Pro member</span> : undefined}>Manage your profile, sign-in preferences, and membership.</LearningPageHeading>`.
- Layout L530: `grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]` — left profile/security card (L532), right billing card (L751).
- **State** L94–122: displayName/editingName/profileSaving/profileInitial/email/avatarUrl/avatarUploading, plan/planLoading/subscription/billingAction/billingError/prices, linkedIdentities/identitiesLoading/identityAction/identityError, passwordForm/passwordFieldErrors/passwordError/passwordSuccess/passwordSaving, reauth request, delete-dialog state.

**API routes used:**
| Purpose | Route | Line |
|---|---|---|
| Load/save profile | `GET /api/profile` (`cache:'no-store'`) L141; `PATCH/POST /api/profile` | L141, L221 |
| Avatar upload | `POST /api/profile/avatar` (FormData) | L240 |
| Billing prices | `GET /api/billing/prices` | L207 |
| Link/unlink identity | `/api/auth/link-identity` | L263, L289 |
| Password change | `POST /api/auth/change-password` | L337 |
| Subscription actions (cancel/resume/switch) | `POST /api/billing/subscription` (`runBillingAction` L364, `performBillingAction` L379) | L385 |
| **Billing portal** | `POST /api/stripe/portal` (`openBillingPortal` L405) | L412 |
| Delete account | `POST /api/profile/delete` (reauth_required handling L463) | L456 |

- **Calibration redo** — `handleRedoCalibration` L130–138: `await clearOnboardingState()` then **`openModal('settings')`** (the onboarding modal context; no route navigation). UI at L627–639: label "Calibration", button text `Redo` / `Opening`.
- **Notifications**: link out to `/settings/notifications` (L615) — separate page `src/app/(app)/settings/notifications/page.tsx`. Billing page also exists at `src/app/(app)/settings/billing/page.tsx`.
- Upgrade CTA L788: `window.dispatchEvent(new CustomEvent('open-upgrade-modal'))`; upgrade banner h2 L778.
- Delete dialog L905–960 (`id="delete-account-title"`, `#delete-email`, `#delete-confirmation`).
- Profile save dispatches `window.dispatchEvent(new CustomEvent('profile-stats-updated'))` L184.
- Footer legal links L994–995 (`/privacy`, `/terms`).
- Shared class constants L502–504: `inputClass`, `quietButtonClass`, `primaryButtonClass`.

---

## 6. SHARED UI PRIMITIVES

| Primitive | Path | Notes |
|---|---|---|
| `BackButton` | `src/components/navigation/BackButton.tsx` L14–31 | Pill; `href`, `label='Back'`, `className`. Uses Material Symbols `arrow_back`. Replaces breadcrumbs. |
| `BackCrumb` | same file, L38–58 | Compact text link for reader headers; `href`, `label` required. |
| `AppTooltip` | `src/components/ui/AppTooltip.tsx` | Props L7–13: `label, children, side='top', className, disabled`. `SIDE_CLASS` L15–20, **`SHOW_DELAY_MS = 300`** L22, controlled `open` state (immediate hide). |
| `Md` (Markdown) | `src/components/ui/Md.tsx` L34–48 | `children, className, tone: MdTone='default', variant: MdVariant='default'`. `ReactMarkdown` loaded via `dynamic(..., {ssr:false})` L21. Building blocks in **`src/components/ui/md-shared.ts(x)`** (`getMdComponents`, `mdRehypePlugins`, `mdRemarkPlugins`, `safeMarkdownUrl`) — server components must import from `md-shared` directly. Styles: `src/components/ui/markdown.css`. Challenge-specific overrides: `src/components/challenge/markdownComponents.tsx`. |
| `HatchGlyph` | `src/components/shell/HatchGlyph.tsx` L15 | **`HatchState` L5**: `'idle' \| 'listening' \| 'reviewing' \| 'speaking' \| 'celebrating' \| 'intrigued' \| 'challenging' \| 'delighted' \| 'none'`. Deprecated `animated` prop L11; `prefersReducedMotion` forces `'none'` L28. Per-state SVG branches L40–230. |
| `HatchImage` | `src/components/redesign/HatchImage.tsx` L106 | Props L72–79: `state: HatchImageState, size=48, className, priority=false, alt`. `HATCH_STATE_MAP` L58 → `/hatch/v2/{state}.png` with `HATCH_FALLBACK_MAP` L37. `DEFAULT_ALT` L82. States used in this codebase include `speaking, avatar, presenting, wave, idle, reviewing`. |
| `LearningPageHeading` | `src/components/redesign/LearningPageHeading.tsx` (10 lines) | Props `{eyebrow, title, children?, action?}`. Renders `<header className="learning-section-heading">` + `<LearningGeometry quiet />` + `.learning-section-copy` + optional `.learning-section-action`. Used by Progress L814 and Settings L528. |
| `LearningGeometry` / `LearningArtwork` | `src/components/redesign/LearningGeometry.tsx` (14 lines) | `LearningGeometry({quiet})` L2 → `<div className="learning-geometry[ learning-geometry-quiet]">` with four `<i>`: `.learning-plane`, `.learning-orb`, `.learning-sage`, `.learning-forest`. `LearningArtwork()` L9 → `.learning-artwork` with `.learning-art-disc` + three `.learning-art-sheet` (one/two/three). **All shapes are pure CSS — no SVG assets.** |
| `StatStrip` | `src/components/redesign/StatStrip.tsx` | `cells: [{key, label, value, valueSuffix?}]`. |
| `NoteCard` | `src/components/redesign/NoteCard.tsx` | `tint` (`mint`/`amber`), `as`, `className`. |
| `ProgressRing` (app) | `src/components/redesign/ProgressRing.tsx` | `percent, size, strokeWidth, trackColor, color`, children. |
| `ProgressRing` (reader) | `src/components/showcase/reader/ProgressRing.tsx` (51 lines) | Different API: `pct, size, strokeWidth`. |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | `title`, `hint`. |
| Motion | `src/components/motion` | `motion`, `motionTokens.spring.layout`, `MotionList` (`layoutKey`), `MotionListItem` (`layoutId`, `layoutDependency`). |

### Stylesheets (geometric backgrounds + reader chrome)
- **`src/components/redesign/learning-design.css`** — defines `.learning-geometry`, `.learning-plane/orb/sage/forest`, `.learning-artwork`, `.learning-art-*`, `.learning-section-heading`, `.learning-page-heading`, `.learning-challenge-card` (+ `.is-list`), `.learning-challenge-art tone-*`, `.learning-reader-hero`, `.learning-reader-cover`, `.learning-reader-mobile-contents`, `.learning-account`.
- **`src/components/redesign/platform-design.css`** — platform chrome tokens.
- **`src/app/(app)/explore/autopsies/showcase.css`** — `.reader-article`, `.reader-layout`, `.reader-outline`, `.reader-outline-progress`, `.reader-top-progress`, `.reader-back`, `.reader-kicker`, `.reader-dek`, `.reader-tags`, `.reader-content`, `.reader-hatch-note`, `.reader-next`, `.sc-dock`, `.sc-dock-btn`, `.sc-dock-divider`, `.sc-dock-path`.
- `src/app/globals.css` — Material/Terra tokens + discipline accent pairs (§9: `text-sd-fg`, `text-sql-fg`, `text-dm-fg`, `text-ps-fg`, `text-aiml-fg`, `bg-*-bg`).
- `src/app/design-review/review.css` (design-review only), `src/styles/shepherd-theme.css` (tours).
- **`WorkshopBg`**: no such component. The only match for `WorkshopBg|workshop-bg` is inside `src/components/onboarding/CalibrationFlow.tsx`.

### Hero components (grep `Hero` in `src/components`)
`feedback/ScoreHero.tsx`, `dashboard/cards/HeroGreeterCard.tsx`, `redesign/dashboard/DashboardHero.tsx`, `marketing/LandingHero.tsx`, `landing-v5/V5Hero.tsx`, `showcase/index/ShowcaseHero.tsx`, `showcase/reader/ParallaxHero.tsx`, `flow-disciplines/modal/Hero.tsx`. **None is shared across the app hubs** — Practice/Progress/Settings all use `LearningPageHeading`; the module reader and Cinematic reader use their own inline headers.