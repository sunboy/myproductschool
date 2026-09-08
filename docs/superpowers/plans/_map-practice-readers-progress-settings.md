# Code map: Practice / Readers / Progress / Settings / Shared Primitives

Repo: `/Users/sandeep/Projects/myproductschool` (Next.js 16 App Router, Tailwind v4, Supabase).
This file is a factual reference for implementation planning. All paths relative to repo root unless noted.

---

## 1. PRACTICE (`/challenges`)

### Entry: `src/app/(app)/challenges/page.tsx` → `FreePracticeContent.tsx`
Server component. Reads many `searchParams` (discipline/type/topic/technique/difficulty/role/company/real_interview/resume/q/view/sort/page). Fetches SSR data via `src/lib/data/challenges.ts` (`CHALLENGE_LIST_COLUMNS`, filters, count/preview functions), passes `initialChallenges`, `counts`, `paradigms`, `summaries`, `previewPerDiscipline`, `pageSize` into `FilteredChallengesView`.

### `src/app/(app)/challenges/FilteredChallengesView.tsx` (791 lines, client) — core filter/list engine
- `EMPTY_FILTERS` / `FilterState`: `{difficulty, role, company, topic, technique, real_interview, resume}`; `BOOLEAN_FILTER_KEYS = ['real_interview', 'resume']`, rest are array filters.
- `DISCIPLINE_KEYS` (L58): `['algorithm','sql','system_design','analytics','data_modeling','product_sense','all']` — 'all' last; mirrors `DisciplineChipRow` chip order.
- `DISCIPLINE_ALIASES` (L102-106): legacy `coding`/`dsa`/`coding-dsa` → `algorithm`.
- `getDiscipline()`: reads `discipline` param, falls back to legacy `type` param, resolves aliases, defaults `'all'`.
- `challengeMatchesDiscipline()` (L128-133): `analytics` → `isClaudeCodeLab(type)`; `product_sense` → `type in ['flow','freeform','quick_take']`; else exact match.
- `buildListQuery()` (L137-163): builds `/api/challenges` querystring (discipline, filters, `q`, topic override, page, limit; multi-selects comma-joined).
- Main component (L171-376): `view` param → `listView = params.get('view') !== 'grid'`; `returnHref` = pathname+search; `updateParams()` → `router.push(..., {scroll:false})`; `handleDisciplineChange` clears `type/topic/technique/paradigm`; `handleToggleView()` uses `window.history.replaceState` (NOT router.push, avoids scroll jump).
- Render order: `DisciplineChipRow` → `FilterDropdownBar` (topic/technique dropdowns backed by `useTopicTechniqueCounts` hook hitting `/api/challenges/count?groupBy=topic|technique`) → `ActiveFilterPills` → `FilterBottomSheet` (mobile) → results: `AllPracticeView` if discipline==='all' else `DisciplineView`.
- `AllPracticeView` / `AllPracticeSection` (L418-625): per-discipline preview sections seeded from SSR; each has "see all N" link + independent "Load more" (`loadMore`/`expandToFull` fetch `/api/challenges`); renders `LockedChallengeGrid`.
- `DisciplineView` (L633-692): `flat` mode (analytics discipline, `resume` filter active, or topic/technique chip selected) → `FlatDisciplineList`; else `GroupedChallengeList` (topic-grouped, lazy-loads rows on expand).
- `FlatDisciplineList` (L695-790): seeded by SSR, refetches page 1 on topic/technique/q change; "Load more" via `GroupedChallengeList.FlatRows`.
- `ListResponse`: `{challenges: ChallengeWithDomain[], total: number, has_more: boolean}`.
- API routes hit: `/api/challenges`, `/api/challenges/count`, `/api/challenges/count?groupBy=topic|technique`.

### `src/components/redesign/practice/DisciplineChipRow.tsx` (77 lines)
- `CHIPS` (L21-29): 7 chips (algorithm/sql/system_design/analytics/data_modeling/product_sense/all), each `{label, description(tooltip), icon, iconClass}`.
- Props: `{active, counts: (key)=>number, onChange, visible}`. Wraps each pill in `AppTooltip`. Active state: `bg-forest-800`.

### `src/app/(app)/challenges/HatchPick.tsx` (59 lines)
- Uses `useNextChallenge()` hook (`/api/challenges/next`, module-level cached promise dedupes across consumers).
- Loading skeleton state; returns `null` if no data or no navigable target (`data.challenge.slug ?? data.challenge.id`).
- href: `/workspace/challenges/${target}`.
- Renders `HatchImage size={44} state="speaking"`, title via `cleanDisplayCopy`, tip text, "Try Now" button (`navigating` state + `router.push(href)`).
- **No dismiss mechanism** exists on HatchPick.

### `src/components/redesign/practice/useNextChallenge.ts` (46 lines)
- `NextChallengeData`: `{challenge: {id, slug?, title}, reason?, tip?, targets_move?, is_calibrated?}`.
- Module-level `cached` promise dedupes `/api/challenges/next` fetch.

### `src/app/(app)/challenges/ChallengeSearch.tsx` (41 lines)
- Props `{total, className}`. Reads `q` param. 300ms debounce (`setTimeout`/`clearTimeout` in `onChange`). `router.push(..., {scroll:false})`.
- Placeholder: `Search ${total} challenges by title, company, technique, or tag…`.

### `src/app/(app)/challenges/ChallengeCard.tsx` (69 lines) — grid/list preview card
- `disciplines` map (L16-26): `system_design, data_modeling, algorithm, claude_code_debugging, sql, claude_code_analytics, flow, freeform, quick_take` → `{label, icon, tone}`.
- Props: `{challenge, paradigm, listView, locked, returnHref, layoutId, summary}`.
- `href` = `appendReturnTo(challenge.is_in_progress ? destination+'&resume=1'/'?resume=1' : destination, returnHref)`, where `destination = challengePath(challenge)` (from `src/lib/challenges/challengeNumber.ts`).
- `discussion` href: `appendReturnTo('/challenges/${slug|id}/discussion', returnHref)`.
- Footer status via `deriveChallengeStatus()` (`src/lib/challenges/status.ts`): Completed (Check icon) / "In progress" / "${n} attempts" / "Not started".
- CTA text: locked → "View challenge"; in_progress → "Continue working"; else "Explore challenge".

### Billing usage widget (used in Settings, referenced elsewhere)
- `src/components/billing/BillingUsageFromProfile.tsx` (17 lines): fetches `/api/profile`, `plan = data.plan ?? 'free'`, renders `<FreemiumUsageSummary plan className>`.
- `FreemiumUsageSummary` itself not read this pass (billing usage bar/detail rendering — located at `src/components/billing/FreemiumUsageSummary.tsx`).

### `returnTo` navigation helpers — `src/lib/navigation/return-to.ts`
- `appendReturnTo(href, returnTo)`, `sanitizeReturnTo`, `SAFE_RETURN_PREFIXES` — used to build workspace hrefs with `resume=1&returnTo=`.

---

## 2. MODULE READER (Learn)

### `src/app/(app)/explore/modules/[slug]/page.tsx` (350 lines, fully client-rendered)
Architecture: **query-param-based chapter switching**, not nested routing. `?chapter=slug` drives which chapter renders.

- `TocRail` (L26-99): left sticky rail, `width:220, position:sticky, top:96`. `ProgressRing` (redesign variant) shows `activeIdx+1/module.chapter_count`. Chapter buttons: locked if `!ch.is_unlocked && !ch.is_completed`; active bg `bg-forest-800`; completed shows Check icon. Footer "All guides" link → `/explore/modules`.
- `ReadingColumn` (L103-231): uses `useLearnChapter(moduleSlug, chapterSlug)` (`src/hooks/useLearnChapter.ts`). Renders module name + "CHAPTER N OF total" eyebrow, `h1` title (Literata, `clamp(2.5rem,6vw,3.5rem)`), optional `hook_text` pull-quote, then `<ChapterBody body_mdx={data.body_mdx} figures={data.figures ?? []} hatchContextLabel="Active chapter body" />` (`@/components/learning/ChapterBody`, not independently read this pass — renders the MDX prose + typed figures).
  - Footer nav: "All guides" back link (L180-186, plain `Link`, NOT the shared `BackCrumb`); "Mark chapter complete" button (calls `markComplete()`, posthog `EVENT_CHAPTER_COMPLETED`, calls `onComplete()`); "Next chapter" button (shown only if `nextChapter.is_unlocked || nextChapter.is_completed`).
- `ModulePageInner` (L235-338): reads `chapter` search param OR `completedChapterSlug` state; `activeChapterSlug` resolution priority: requested → first unlocked&incomplete → first chapter. `handleSelectChapter` does `router.replace('/explore/modules/${slug}?chapter=${chSlug}', {scroll:false})` + `window.scrollTo({top:0})` + posthog `EVENT_CHAPTER_OPENED`.
- Mobile (`lg:hidden`): `<select>` dropdown for chapter switching (L311-315) instead of TocRail; mobile `BackCrumb href="/explore/modules" label="All guides"` (L296-298) — this one **is** the shared `BackCrumb`.
- Root container data attrs (Hatch-awareness): `data-hatch-context-root`, `data-hatch-page-type="learning_module"`, `data-hatch-entity-id={slug}`, `data-hatch-active-chapter={activeChapterSlug}`.
- Layout: outer `max-w-[1080px]`, gap-10/lg:gap-14; TocRail 220px + reading column `max-w-[760px]`.
- **No `useReaderResume` / localStorage resume logic** — module reader relies on server-persisted `is_completed`/`is_unlocked` chapter state + URL query param, not scroll-position resume. Confirms the "story-only" resume rule.
- Page export wraps `ModulePageInner` in `<Suspense>` (required for `useSearchParams`).

### `src/app/(app)/explore/modules/[slug]/[chapter]/page.tsx` (20 lines)
Pure client redirect stub: `router.replace('/explore/modules/${slug}?chapter=${chapter}')`. Exists only to catch old/bookmarked nested-route URLs; not used for real rendering.

### Hooks
- `src/hooks/useLearnModule.ts` (35 lines): fetches `/api/learn/${slug}` → `{module, chapters}`.
- `src/hooks/useLearnChapter.ts` (52 lines): `completeLearnChapter(slug, chapter)` POSTs `/api/learn/${slug}/${chapter}/complete`; `useLearnChapter(slug, chapter)` fetches `/api/learn/${slug}/${chapter}` with `AbortController`, exposes `markComplete`/`isMarkingComplete`/`refetch`.

### API: `src/app/api/learn/[slug]/[chapter]/complete/route.ts` (53 lines, POST)
- `IS_MOCK` short-circuit → `{ok:true}`.
- Auth via `createClient()` + `supabase.auth.getUser()` → 401 if missing.
- `createAdminClient()`: looks up `learn_modules` by slug, then `learn_chapters` by `module_id`+slug.
- Upserts `user_learn_progress` on conflict `user_id,chapter_id` with `{user_id, module_id, chapter_id}`.
- Calls RPC `update_user_streak(p_user_id)` — same XP/streak RPC used platform-wide.
- Inserts `session_events`: `{user_id, event_type: 'chapter_complete', payload: {module_slug, chapter_slug, chapter_id}}`.

### Data model — `LearnModule` (`src/lib/types.ts` L873-886)
```ts
interface LearnModule {
  id: string; slug: string; name: string; tagline: string
  difficulty: LearnDifficulty  // shares PracticeDifficulty enum (easy/medium/hard)
  chapter_count: number; est_minutes: number
  cover_color: string    // dark hex e.g. '#1a3a2a'
  accent_color: string   // primary accent hex e.g. '#4a7c59'
  sort_order: number; track: string | null; created_at: string
}
```
`cover_color`/`accent_color` are NOT rendered directly in `explore/modules/[slug]/page.tsx` (module page uses Terra tokens, not per-module color); they ARE consumed elsewhere (module index page cover cards — not read this pass, likely `explore/modules/page.tsx`) and by the autopsy hero (`accentColor = hero?.accent_color ?? product.cover_color`, fallback `'#4a7c59'`, in `AutopsyReaderClient.tsx`).

---

## 3. AUTOPSY READER

Two parallel reader implementations exist. Neither uses the shared `ReaderRail` component (each hand-rolls its own left rail); both/either use `ReaderDock` and `useReaderResume`.

### Route tree
- `src/app/(app)/explore/autopsies/[slug]/page.tsx` (84 lines) — company hub. `generateStaticParams`/`generateMetadata` from `getAutopsyCompanies()`/`getAutopsyCompany()`. If company has readable stories: splits `teardownStories` (company_teardown) vs `featureStories` (feature_autopsy); renders `CompanyHubHeader` + two `CompanyStoryRail` (`variant='grid'` titled "Teardowns", `variant='rows'` titled "Feature autopsies") + `RelatedCompanies`. Legacy-only fallback (no company/no readable stories but legacy stories exist) → `AppLegacyCompanyHub` (`@/components/autopsy/AppAutopsyShowcase`). `notFound()` otherwise.
- `src/app/(app)/explore/autopsies/[slug]/stories/[storySlug]/page.tsx` (119 lines) — **canonical story route**. Branches:
  1. `feature_autopsy` type → `getBookmarkState` + `getPrevNext` in parallel → `<CinematicReader story company companyAccent initialBookmarked prevNext />`.
  2. `company_teardown` type → `getLegacyCompanyTeardown(slug, storySlug)`; `legacy.reader === 'aarrr'` → `<AutopsyReaderClient product practiceCards={await resolvePracticeCards(product)} />`; else → `<StoryReader story productName productSlug backHref forceVisible />` (`@/components/autopsy/StoryReader`, not read this pass).
  3. Fallback (readable but unbranched) → `StoryReader` via `featureAutopsyToStory()` adapter.
  4. Legacy-only path (no `result`) → same aarrr/StoryReader branching via `getLegacyCompanyTeardown`.
  5. `notFound()` otherwise.
- `src/app/(app)/explore/autopsies/[slug]/[storySlug]/page.tsx` (11 lines) — pure redirect: `redirect('/explore/autopsies/${slug}/stories/${storySlug}')`. Legacy URL-shape alias.

### `AutopsyReaderClient.tsx` (`src/app/(app)/explore/autopsies/[slug]/AutopsyReaderClient.tsx`, 1024 lines) — legacy AARRR stage reader
- Types: `HeroContent`, `ClosingContent`, `PracticeLinkCard {id, title, href, disciplineLabel, difficultyLabel}`.
- `getStages()`/`getHero()`/`getClosing()`: extract from `product.stories[0].sections` filtered by `layout === 'aarrr_stage'|'aarrr_hero'|'aarrr_closing'`.
- `animateMetric()`: GSAP count-up.
- `GoDeeper` (L91-286): collapsible — Key Metric Definitions table, System Design components, "What Didn't Work" cards, Do's/Don'ts, "vs. The Competition" table.
- `PracticePrompts` (L290-309): "On the job"/"Interview prep" dark cards from `stage.practice_prompts`.
- `StageSection` (L323-506): per-stage column — number/name/question, narrative (dangerouslySetInnerHTML), optional NoteCard callout, data tables, metrics-strip (3-up count-up cells), "War Room" quote card, `GoDeeper`, `PracticePrompts`, transition text, "Next stage" footer.
- `StageRail` (L510-596): **custom** left rail (`width:220, top:67, height: calc(100vh - 67px)`) — NOT `ReaderRail`. Back link, `ProgressRing`, numbered nav (done/current/upcoming).
- `RightRail` (L604-670): "Practice what you read" NoteCard (practiceCards) + "In this story" mini-TOC (`width:272, sticky top:67`).
- Main component props: `{product, backHref='/explore/autopsies', backLabel='All autopsies', closingHref?, practiceCards=[]}`.
- GSAP `ScrollTrigger`/`ScrollToPlugin`: `onEnter`/`onEnterBack` sets `activeStageIdx`; body-level `ScrollTrigger id:'autopsy-body'` → `setScrollProgress`; `onLeave` fires `EVENT_AUTOPSY_FINISHED`.
- PostHog: `EVENT_AUTOPSY_OPENED` (mount), `EVENT_AUTOPSY_SECTION_VIEWED` (per stage, with `pct`), `EVENT_AUTOPSY_FINISHED` (scroll-body leave).
- `useReaderResume({storyKey: '${product.slug}/${story?.slug ?? 'aarrr'}', sectionIds: railItemIds, activeId: activeSectionId, scrollPct: scrollProgress*100, canPersist: persistReady})` (L820-827); `railItemIds = ['hero', ...stages.map((_,i)=>'stage-${i}')]`.
- Restore-on-mount (L830-845): sets `persistReady` after restore (600ms) or immediately (0ms) if no saved position, to avoid the write-effect clobbering the restore.
- `ResumeBanner variant="aarrr"` shown when `showResumeBanner`.
- Layout: `<div ref={scrollBodyRef} className="mx-auto flex max-w-[1400px] items-start gap-8 px-6 pb-24 pt-7">` = `StageRail` + `<main>` + `RightRail`.
- Back bar: desktop `BackCrumb href="/explore/autopsies/${product.slug}" label={product.name}` (L862-864, shared component). Mobile sticky header (`top:48`) has its own back Link + progress bar + `${activeStageIdx+1}/${stages.length}`.
- Hero: GSAP-animated gradient using `accentColor = hero?.accent_color ?? product.cover_color`, fallback `'#4a7c59'`; radial-gradient dot-pattern mask; chips row (`Product Autopsy`, `${stages.length} Stages`, meta/read_time).
- Closing CTA: dark `#0c0c0e` bg, radial accent glow, links `closingHref ?? closing.cta_path`.

### `CinematicReader.tsx` (`src/components/showcase/reader/CinematicReader.tsx`, 175 lines) — current-gen reader for `feature_autopsy`
- Props: `{story: FeatureAutopsy, companyName, companyAccent?, initialBookmarked: boolean, prevNext: PrevNextResult}`.
- `INLINE_IMAGE_ROLES` (L35): `['hatch-narrator','failure-mechanism','evidence-card','lesson-frame']`.
- `lede = story.flow[0]`; `bodySections = story.flow.slice(1)`.
- `sectionIds`/`tocItems` built conditionally: lede, quickRead, each bodySection (`flow-${i+1}`), metrics ("evidence"), timeline, quote, principle, sources.
- `useReaderScroll(sectionIds, contentRef)` (`src/hooks/useReaderScroll.ts`, not read this pass) → `{scrollPct, activeSection, visitedSections}`.
- `useReaderResume({storyKey: '${story.companySlug}/${story.slug}', sectionIds, activeId: activeSection, scrollPct, canPersist: persistReady})` — same pattern as AARRR reader; restore effect accounts for `article.getBoundingClientRect().top` offset.
- PostHog: `EVENT_AUTOPSY_OPENED` (mount); per-section `EVENT_AUTOPSY_SECTION_VIEWED` (dedup via `trackedSectionsRef`); `EVENT_AUTOPSY_FINISHED` when last section active (`finishedTrackedRef`).
- `scrollToSection(id)`: `document.querySelector('[data-section-id="${id}"]')?.scrollIntoView(...)`.
- Header (L122-136): back link `ArrowLeft` + companyName → `backHref = /explore/autopsies/${story.companySlug}`; `BookmarkToggle`; hero (kicker "Product autopsy · {estimatedReadTime}", h1 title, dek, tags via `readerTopicTags(story.tags).slice(0,4)`, `LearningArtwork` cover).
- Mobile TOC: `<details className="learning-reader-mobile-contents">` (L138-141).
- **Desktop left rail** (L144-155): raw `<aside className="reader-outline">` inline nav — does **NOT** use shared `ReaderRail` despite it existing in the same directory. Includes progress bar/pct, numbered/checked TOC, "Ask Hatch about this section" button dispatching `window.dispatchEvent(new CustomEvent('open-ask-hatch', {detail:{prompt: 'Help me understand ${activeLabel} in ${story.title}.'}}))`.
- Section renderers (all in `src/components/showcase/reader/sections/`, not individually read this pass): `FlowSectionDark` (lede + body sections, alternating `imageSide`), `QuickReadDark`, `EvidenceLedgerDark`, `TimelineDark`, `QuoteDark`, `PrincipleDark`, `SourcePackDark`, then `PrevNextChips`.
- Bottom: `<ReaderDock scrollPct activeSection tocItems backHref companyName storyTitle={story.title} />` — shared component, actively used.
- `ResumeBanner variant="aarrr"` shown when `showResumeBanner` — note: same variant string reused despite being the cinematic (not AARRR) reader; inconsistent naming worth flagging.

### `useReaderResume` — `src/hooks/useReaderResume.ts` (176 lines) — shared resume hook
- `StoredResume`: `{sectionId, scrollPct, at, bannerDismissed?}`.
- `UseReaderResumeOptions`: `{storyKey, sectionIds, activeId, scrollPct, canPersist?=true}`.
- `keyFor(storyKey)` → localStorage key **`hp_reader_${storyKey}`** (no user-id namespacing needed; localStorage already per-device/profile).
- Constants: `WRITE_THROTTLE_MS = 500`, `MIN_RESUME_PCT = 4`.
- Read-once-on-mount: parses saved JSON; `atStart = (isFirst||!knownSection) && saved.scrollPct < MIN_RESUME_PCT`; if not atStart and `scrollPct >= MIN_RESUME_PCT` → sets `resumeScrollPct` (source of truth for restore) + `resumeSection` (label only); respects `bannerDismissed`.
- Trailing-debounced write (500ms), gated on `restored && canPersist && activeId`.
- `dismissBanner()`: sets `bannerDismissed:true`, keeps position. `clearResume()`: removes localStorage entry entirely.
- All storage access try/catch-wrapped (private-mode/quota safety).
- **Used only by** `AutopsyReaderClient.tsx` and `CinematicReader.tsx` — confirmed NOT used by the module reader. This is the "story-only key" rule from project memory.

### Shared rail/dock components — `src/components/showcase/reader/`
- `ReaderRail.tsx` (326 lines) — presentational left rail (props: `items, activeId, visitedIds?, scrollPct, title, kicker?, accent='#4a7c59', backHref, backLabel='Back', onNavigate, variant='cinematic'|'aarrr'`). `dark` palette (cinematic, glass `rgba(20,22,20,0.72)`) vs light (`aarrr`, `#f0ece4` — "guides ChapterList look"). Layout `width:248, sticky top:67, height:'calc(100vh - 67px)'`, hidden `<lg`. Numbered/dot markers w/ connector lines, done/active/upcoming states. **Currently NOT consumed by either live reader** (both hand-roll their own rail markup) — likely intended for `StoryReader.tsx` or as a future consolidation target.
- `ReaderDock.tsx` (139 lines) — shared fixed bottom dock, actively used by `CinematicReader`. Props `{scrollPct, activeSection, tocItems, backHref, companyName, storyTitle, onNavigate?}`. `handleNavigate(id)` uses custom `onNavigate` or default `scrollIntoView`. Renders `TocOverlay` (mobile TOC modal, not read), back button, `ProgressRing` (reader variant, see below) + pct, TOC toggle (if `tocItems.length>0`), truncated title. CSS classes `sc-dock*` (in `showcase.css`, not located this pass).
- `src/components/showcase/reader/ProgressRing.tsx` (51 lines) — **reader-specific variant** (distinct from `redesign/ProgressRing`): props `{pct, size=36, strokeWidth=3}`, uses CSS vars `--outline-faint`/`--color-primary`, `transform:'rotate(-90deg)'`, no gradient support. Used inside `ReaderDock`.
- `BookmarkToggle.tsx` (49 lines) — props `{companySlug, storySlug, initialBookmarked}`. Optimistic toggle, reverts on error. Calls server action `toggleBookmark`. Renders lucide `Bookmark` icon filled when saved, label "Saved"/"Save".

### Bookmarks — `src/lib/showcase/bookmarks.ts` (99 lines, `'use server'`)
- `getBookmarkState(companySlug, storySlug)`: `{bookmarked}`, false if unauthenticated. Queries table `autopsy_bookmarks` (`id, user_id, company_slug, story_slug, created_at`).
- `toggleBookmark(companySlug, storySlug)`: throws if unauthenticated; deletes existing row or inserts new; `revalidatePath('/explore')` after each mutation.
- `getUserBookmarks(strict=false)`: `Array<{companySlug, storySlug}>`, ordered `created_at desc`; throws if `strict && error`.

### Cover image storage convention
- `src/lib/autopsies/storage.ts`: `AUTOPSY_IMAGE_BUCKET = 'autopsy-images'` (L4). `getAutopsyImageStoragePath(storySlug, role, storageVersion)` builds the path. Resolution fallback chain (L25-27): `bucket = image.bucket ?? generated?.bucket ?? AUTOPSY_IMAGE_BUCKET`; `storagePath = image.storagePath ?? generated?.storagePath ?? getAutopsyImageStoragePath(...)`.
- `scripts/sync-autopsy-images-storage.ts`: imports `generatedAutopsyImageStorageData` from `src/lib/autopsies/generated-image-storage-data.ts`; `StorageData` fields `{bucket, storagePath, storageVersion, publicUrl}`. `buildLocalImageRecords(story, storageVersion)` (L203) builds records via `getAutopsyImageStoragePath`. `ensureBucket` logic (L225-241): checks/creates `admin.storage.getBucket(AUTOPSY_IMAGE_BUCKET)`. `uploadImage(localPath, storagePath, force)` (L244): `admin.storage.from(AUTOPSY_IMAGE_BUCKET).upload(...)`. Writes resolved data back to `generated-image-storage-data.ts` via `writeStorageData()`.

### Data types
- `FeatureAutopsy` fields incl. `cover_color: string | null` (`src/lib/types.ts` L986) and `accent_color` on the AARRR hero content type (`{ id, layout: 'aarrr_hero'; content: { product_name, tagline, meta, accent_color } }`, L1187).

### Marketing mirror routes
Not located as a distinct route group this pass — no `(marketing)` autopsy mirror found under grep for `AutopsyReaderClient`/`CinematicReader` usage outside `(app)/explore/autopsies/`. If a marketing-facing mirror exists it likely reuses the same `getAutopsyCompany`/`getAutopsyStory` data functions from a public/unauthenticated route; **not confirmed — flag for the implementer to grep `src/app/(marketing)` or similar before assuming it exists.**

---

## 4. PROGRESS

### `src/app/(app)/progress/page.tsx` (1005 lines, fully client-rendered)
- Imports: `LearningPageHeading`, `HatchImage`, `NoteCard` (redesign), `StatStrip`, `AppTooltip`, `Md` (`@/components/ui/Md`), `useMoveLevels`, `useProfile`, `formatChallengeNumber`, `levelFromXp` (`@/lib/utils`), `normalizeToTen` (`@/lib/feedback/score`), `useLearnerDNAData` (local `./LearnerDNASection`).
- `EVENT_LABELS` (L32-38): `chapter_complete, quick_take_submit, note_saved, challenge_complete, live_interview_end` → activity-feed label functions.
- `FLOW_ROWS` (L42-47): 4 rows (Frame/List/Optimize/Win), `{move, desc, dotClass, barClass}`.
- `formatInterviewScore(score)`: `normalizeToTen(score, 5).toFixed(1)/10`.
- Interfaces: `RecentAttempt`, `RecentInterview`, `TrajectoryMove ('frame'|'list'|'optimize'|'win')`, `TrajectoryTrend ('improving'|'declining'|'steady'|'insufficient_data')`, `TrajectoryCell`, `TrajectoryDiscipline`, `TrajectoryEvidence`, `ReasoningTrajectory`.
- `CARD_CLASS`: `'rounded-2xl border border-hairline bg-card-bright p-4 shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]'` — reused everywhere.
- `FourWeekHeatmap({activeDates})` (L155-204): Monday-start 4-week grid, `activeSet = new Set(activeDates)`, 4×7 colored cells (`bg-forest-600` if active).
- `CompetencyRadarSvg({competencies})` (L208-258): SVG polygon radar, `viewBox="0 0 360 300"`, `cx=180,cy=140,r=88`, 4 rings, data polygon `var(--color-forest-600)` @0.32 opacity.
- Trajectory helpers: `TREND_META`, `TrendIcon`, `TrendDot`, `MiniSparkline` (SVG polyline), `TrajectoryCellCard` (per discipline×move cell w/ `AppTooltip`), `TrajectoryStat`.
- `ReasoningTrajectorySection({trajectory, loading})` (L356-544): `hasEnoughSignal` gate requires `disciplinesWithAnySignal >= 3`; full discipline×move grid table (`gridTemplateColumns: '170px repeat(4, minmax(132px,1fr))'`) OR placeholder; bottom split: "Hatch read" `NoteCard` (`nextFocus` CTA "Start focused challenge" → `trajectory.nextFocus.href`) + "Evidence ledger" list (deduped by href, max 4).
- `TimelineItem`/`TimelineRow` — "Recent work" merged feed rows.

**Main `ProgressPage` component (L586-1004)**
- Data fetches: `/api/attempts?limit=5&include_patterns=true`, `/api/live-interview/history?limit=3`, `/api/hatch/growth-reflection` (POST), `/api/progress/reasoning-trajectory`, `/api/progress/learn-progress`, `/api/progress/streak-history`, `/api/progress/activity-feed`, `/api/profile`, `/api/challenges/mastery` (via retryable `loadMastery()`).
- `flowMoves`: `FLOW_ROWS` mapped against `useMoveLevels()` data (`{level, pct, hasReps}`).
- Mastery stats: `total` (catalogued), `attempted`, `mastered` (score≥80), `attemptedPct`.
- `streakDays`/`xpTotal` via `useProfile()`; `level = levelFromXp(xpTotal)`.
- `isDayZero` gate: `coreLoaded && !hasActivity && activityEvents.length===0 && attempted===0 && streakDays===0 && xpTotal===0` → centered invitation + FLOW explainer instead of full dashboard.
- **"Your next focus"** (L690-694): `movesWithEvidence = flowMoves.filter(m=>m.hasReps)`; `weakest = reduce to min pct`. Rendered banner (L816): eyebrow "Your next focus", headline "Build confidence in {weakest.k.toLowerCase()}.", CTA "Find a challenge →" → **`/challenges`** (generic, NOT move-filtered — worth noting for implementers who assume a `?move=` param is passed here; contrast with skill-ladder page which DOES pass `?move=`).
- `timeline`: merged `recentAttempts` + `recentInterviews` + `activityEvents`, newest-first, sliced to 8. Attempt items → `/challenges/${challenge_id}/feedback?attempt=${id}` (cta "Review"); interview items → `/live-interviews/${id}/debrief` if completed else `/live-interviews` (cta "Resume").
- `activeDays28`: count of `streakDates` within last 28 days.
- Layout: `mx-auto max-w-[1400px] px-6 py-5 pb-12`.
- Hero: `LearningPageHeading eyebrow="Your progress" title="See how far you've come."`.
- `StatStrip` cells: Challenges completed, Scored 80+, Practice coverage %, Total XP (suffix `Level ${level}`, `text-flame` class).
- Row 1 grid (`lg:grid-cols-[1.05fr_1.05fr_1fr]`): FLOW moves card → `ViewLink href="/progress/skill-ladder"`; Skill profile card (radar via `dna.competencies`, `dna.weakest_link_label`) → same skill-ladder link; "Last four weeks" card (heatmap + active days/streak/shields, `data-testid="streak-heatmap"`).
- Row 2 grid (`lg:grid-cols-[1.4fr_1fr]`): "Recent work" timeline (`data-testid="activity-feed"`) → `ViewLink href="/history"`; "Learn progress" card (per-module bars → `/explore/modules/${module_slug}`).
- `ReasoningTrajectorySection` full width.
- Footer: "Hatch's read" `NoteCard tint="mint"` w/ `HatchImage state="presenting"`, `Md variant="chat" tone="inherit"` rendering growth-reflection text; optional "Share your archetype" button → `/profile/share` (shown only if `profile?.archetype`).

### `src/app/(app)/progress/skill-ladder/page.tsx` (773 lines) — per-FLOW-move deep dive
- Imports `recharts` (`RadarChart`, `PolarAngleAxis`, `PolarGrid`, `PolarRadiusAxis`, `Radar`, `ResponsiveContainer`, `Tooltip`), `HatchImage`, `BackButton` (shared), `useMoveLevels`.
- `buildLinkedInUrl(moveName, level)`: builds a LinkedIn certification-add deep link (`LINKEDIN_BRAND_BLUE = '#0077b5'`, documented as an intentional off-token brand-color exception).
- `COMPETENCY_META` (L69-76): 6 competencies (motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise) with `label`/`shortLabel`.
- `MOVE_META` (L80-85): per-FLOW-move `{label, icon, description}`.
- `MOVE_LEVEL_NAMES` (L87-92): 5 level names per move (e.g. Frame Finder → Frame Builder → Frame Strategist → Frame Expert → Frame Master).
- Data fetches (parallel): `/api/career-benchmark`, `/api/dna/recommend`, `/api/dna`, `/api/attempts?limit=20`.
- `selectedMove` resolution: URL `?move=` param if valid, else `weakestMove` (min `progress_pct` among `useMoveLevels()` moves).
- `selectMove(move)`: `router.push('?${params}')` after setting `move` param — **this page DOES use `?move=` navigation** (contrast w/ Progress page's generic `/challenges` CTA).
- `buildRadarData(competencies)`: maps to `CompetencyRadarDatum[]`, default score 50 if missing.
- `buildLastMovementByCompetency(attempts)`: derives per-competency last delta from `attempt.feedback_json.competency_deltas`.
- Layout: move-selector tabs (4 FLOW moves with level badges) → header (icon, move name, level badge) → 2-col grid (`lg:grid-cols-12`): left (8 cols) = Hatch coaching card + 5 skill-ladder "rungs" (`CompletedRung`/`CurrentLevelCard`/`LockedRung` sub-components per level 1-5, `CurrentLevelCard` embeds "Hatch's pick" → `/workspace/challenges/${recommendation.challenge_id}` or `/challenges?move=${selectedMove}`); right (4 cols) = `CompetencyRadarPanel` (recharts radar + per-competency movement cards linking `/challenges/${challengeId}/feedback?attempt=${attemptId}`), "Live credential" card (LinkedIn add-to-profile), "Career benchmark" bar (APM→PM→YOU→Senior→Principal), "Other FLOW moves" quick-switch list, FLOW framework info note.
- Wrapped in `<Suspense>` for `useSearchParams`.

---

## 5. SETTINGS

### `src/app/(app)/settings/page.tsx` (1000 lines, client) — main account page
- Hero: `LearningPageHeading eyebrow="Your account" title="Make it yours." action={isPro ? <Pro badge> : undefined}` — "Manage your profile, sign-in preferences, and membership."
- Layout: `grid lg:grid-cols-[360px_1fr]` — left "Profile & security" card, right "Plan & billing" card.
- **Profile & security card**: avatar upload (`POST /api/profile/avatar`, FormData), display-name inline edit (`PATCH /api/profile {display_name}`), hairline rows: Email (read-only), Notifications → `/settings/notifications` link, Calibration "Redo" (`clearOnboardingState()` + `openModal('settings')` via `useOnboardingModal()`), Google sign-in connect/remove (`POST`/`DELETE /api/auth/link-identity`, redirect flow via `redirectTo`), change-password form (`newPasswordSchema` validation, reauth via `ReauthModal` then `POST /api/auth/change-password` with `currentPassword`), Sign out (`supabase.auth.signOut()` + `router.push('/login')`).
- **Plan & billing card**: skeleton while `planLoading`; dark pricing band (`isPro` → "HackProduct Pro" else "Free plan"), upgrade CTA dispatches `window.dispatchEvent(new CustomEvent('open-upgrade-modal'))`; stat cells (Current/Next billing or Access ends/Switch price) sourced from `GET /api/billing/prices` + profile `subscription`; `<FreemiumUsageSummary plan={plan} />`; billing actions via `POST /api/billing/subscription` (`{action, ...body}` — actions: `change-plan`, `cancel`, `reactivate`), `openBillingPortal()` → `POST /api/stripe/portal` (opens in new tab, handles `res.status>=500`); cancellation banner via `scheduledCancellationState(subscription)`; "Danger zone" → delete-account modal (`email`+`DELETE` confirmation, reauth, `DELETE /api/profile/delete`).
- Reauth: all sensitive actions (password change, billing action, delete account) route through `<ReauthModal>` (`@/components/auth/ReauthModal`) requiring current password before `onVerified` callback executes.
- Billing reconciliation: `reconcileBillingAction()` polls `/api/profile` up to 5x over 10s (`BILLING_RECONCILIATION_DELAYS_MS = [250,500,1000,2000,4000]`) after an action, using `subscriptionReflectsBillingAction()` (`@/lib/billing/subscription-cancellation`) to detect when Stripe webhook has landed; dispatches `profile-stats-updated` custom event on success.
- Footer: Privacy/Terms links.

### `src/app/(app)/settings/notifications/page.tsx` (205 lines, client)
- `PREF_ITEMS` (L26-68): 7 visible toggles — `streak_reminder, weekly_digest, completion_email, lifecycle, discussion_reply, billing_alerts, marketing` (`push_enabled` key exists in DB/type but intentionally omitted from UI — push not implemented).
- `DEFAULT_PREFS`: all true except `marketing`/`push_enabled` false.
- Fetches `GET /api/notifications/preferences` on mount; each toggle immediately optimistic-updates then `PATCH /api/notifications/preferences {[key]: value}`, reverts on failure.
- Simple back link (plain `Link`, not `BackCrumb`) → `/settings`.
- Layout: `max-w-[880px]`, single card with hairline-divided rows, each a label/detail + switch button (custom pill switch, not a native `<input type=checkbox">`).

### Billing/settings-adjacent components (not independently re-read this pass, located)
- `src/components/billing/FreemiumUsageSummary.tsx` — usage bar detail (consumed by both `BillingUsageFromProfile` and Settings page directly).
- `src/components/auth/ReauthModal.tsx` — password-reauth modal gate.
- `src/lib/billing/subscription-cancellation.ts` — `mergeStripeSubscriptionSnapshot`, `scheduledCancellationState`, `subscriptionReflectsBillingAction`, types `BillingSubscriptionAction`, `BillingSubscriptionState`, `StripeSubscriptionSnapshot`.
- `src/lib/auth/validation.ts` — `newPasswordSchema`, `zodFieldErrors`.
- `src/lib/onboarding/state-client.ts` — `clearOnboardingState()`.
- `src/context/OnboardingModalContext.tsx` — `useOnboardingModal()` → `openModal(source)`.

### API routes referenced by Settings
`GET/PATCH /api/profile`, `POST /api/profile/avatar`, `DELETE /api/profile/delete`, `GET /api/billing/prices`, `POST /api/billing/subscription`, `POST /api/stripe/portal`, `POST/DELETE /api/auth/link-identity`, `POST /api/auth/change-password`, `GET/PATCH /api/notifications/preferences`.

---

## 6. SHARED PRIMITIVES

### `BackButton` / `BackCrumb` — `src/components/navigation/BackButton.tsx` (58 lines)
- `BackButton({href, label='Back', className})`: pill-style — `rounded-full border border-outline-variant/60 bg-surface-container-low`, `arrow_back` Material Symbol. "The platform's single back affordance. Replaces old breadcrumb trails."
- `BackCrumb({href, label, className})`: compact inline link (no pill) for narrow fixed bars (reader headers) — `text-primary`, smaller `arrow_back` icon.

### `AppTooltip` — `src/components/ui/AppTooltip.tsx` (82 lines)
- Props `{label, children, side='top', className, disabled}`. `SHOW_DELAY_MS = 300` — asymmetric (300ms show delay, immediate hide) "so the tooltip never lingers." Hover+focus/blur driven (keyboard parity via bubbling). Dark tooltip bubble `bg-[#1f2b24] text-[#f7efe2]`, hidden on mobile (`md:block`).

### `HatchImage` (v2, current) — `src/components/redesign/HatchImage.tsx` (125 lines)
- Renders real generated PNGs at `public/hatch/v2/{state}.png` with onError fallback to legacy statics (`public/hatch/avatar.png`, `pose-chart.png`, `pose-reading.png`, `pose-thinking.png`, `pose-writing.png`).
- `HatchImageState` union (12 states): `idle, wave, listening, reviewing, speaking, celebrating, thinking, reading, writing, presenting, pointing, avatar`.
- `HATCH_STATE_MAP` exported for cross-checking usage.
- **`HatchGlyph`** (`src/components/shell/HatchGlyph.tsx`, referenced in project CLAUDE.md, not re-read this pass) is explicitly `@deprecated` for redesigned surfaces per code comment: "Do NOT import HatchGlyph in anything under `src/components/redesign/` or in any page/route touched by the redesign phases." All reader/practice/progress/settings surfaces in this map use `HatchImage`, not `HatchGlyph`.
- Props: `{state, size=48, className, priority=false, alt?}`.

### `Md` (Markdown) — `src/components/ui/Md.tsx` (49 lines) + `src/components/ui/md-shared.ts` (not read, re-exported)
- Client component wrapping `react-markdown` (dynamically imported, `ssr:false`). Props `{children: string, className?, tone: MdTone='default', variant: MdVariant='default'}`.
- Uses shared `getMdComponents(variant, tone)`, `mdRehypePlugins`, `mdRemarkPlugins`, `safeMarkdownUrl` from `md-shared` — server components must import those directly since importing `Md.tsx` marks them client-only.
- Used e.g. in Progress page footer: `<Md variant="chat" tone="inherit">{growthReflectionText}</Md>`.

### `LearningPageHeading` / `LearningGeometry` — `src/components/redesign/LearningPageHeading.tsx` (11 lines), `src/components/redesign/LearningGeometry.tsx` (15 lines)
- `LearningPageHeading({eyebrow, title, children, action})`: `<header className="learning-section-heading">` wrapping `<LearningGeometry quiet />` (decorative bg) + `.learning-section-copy` (eyebrow span, h1, optional children paragraph) + optional `.learning-section-action` slot. Used identically by Settings and Progress pages.
- `LearningGeometry({quiet})`: 4 decorative `<i>` shapes (`learning-plane`, `learning-orb`, `learning-sage`, `learning-forest`) — CSS-driven geometric background, "non-interactive geometry from the approved visual review."
- `LearningArtwork()`: separate export — disc + 3 "sheet" shapes, used as a cover placeholder (e.g. `CinematicReader` hero `.learning-reader-cover`).
- All styling lives in CSS classes (likely `src/components/redesign/learning-design.css`, not read this pass) — no inline Tailwind in these two files.

### `NoteCard` — **two distinct components with the same name**, do not confuse:
1. `src/components/redesign/NoteCard.tsx` (35 lines) — generic tinted sticky-note surface. Props `{tint: 'mint'|'amber'|'teal'|'blush', rotate?, children, className?, as?}`. Maps to CSS classes `note-mint/note-amber/note-teal/note-blush` (+ `note-tilt` for the -0.6 to -1deg pinned rotation). "Rules: max 2-3 tinted surfaces per page; different tints only when they encode different content classes (mint=coach, amber=tip, teal=info, blush=review)." Used by Progress page footer, skill-ladder implicitly via similar card styling, AARRR reader `GoDeeper`/callouts.
2. `src/components/notes/NoteCard.tsx` — **not read this pass**; separate component for the user Notes feature (per project memory `project_notes_feature.md`), unrelated to the tinted-surface primitive. Implementers must import from `redesign/NoteCard` for tinted UI callouts, not `notes/NoteCard`.

### `StatStrip` — `src/components/redesign/StatStrip.tsx` (75 lines)
- Hairline-separated stat-cell strip. `StatStripCell {key, label, icon?, value, valueSuffix?, delta?, progressPercent?}`. Grid: `grid-cols-2 sm:grid-cols-3 md:[grid-template-columns:var(--statstrip-cols)]` (CSS var computed from cell count). Value in `font-headline text-[25px] font-bold tabular-nums`; delta in `text-forest-600`; optional thin progress bar under a cell. Used by Progress page hero stats.

### `ProgressRing` — **three distinct implementations**, do not confuse:
1. `src/components/redesign/ProgressRing.tsx` (~90 lines) — general-purpose conic ring via SVG stroke-dasharray. Props `{percent, size=72, strokeWidth=10, trackColor='rgba(255,255,255,.14)', color: string|[string,string]='#fdb41f', children?, className?}`. Supports gradient sweep (`color` as tuple → generates a `linearGradient`). Center slot defaults to `${percent}%` label. `animate-ring-fill` CSS animation class. Used by module reader `TocRail` and skill-ladder-adjacent surfaces.
2. `src/components/showcase/reader/ProgressRing.tsx` (51 lines) — reader-specific, simpler: props `{pct, size=36, strokeWidth=3}`, fixed CSS-var-driven colors (`--outline-faint`, `--color-primary`), no children slot, no gradient. Used exclusively inside `ReaderDock`.
3. `src/components/learning/ProgressRing.tsx` — **not read this pass**, exists as a third variant (likely used by `ChapterBody`/module index cards). Implementer must check which of the three is imported before reusing.

### Terra / Material 3 color tokens — `src/app/globals.css`
- `@theme inline { ... }` block starts L10. Full token families: Primary (`--color-primary: #4a7c59` + container/fixed/inverse variants), Secondary, Tertiary (all L11+), Background `--color-background: #faf6f0` (L44), plus a separate **hero-forest** dark scale (`--color-hero-forest-deep: #14241c`, `--color-hero-forest-deepest: #0e1a14`, L128-129) and a **forest-NNN** numeric scale used pervasively in redesigned surfaces (`--color-forest-950: #052316` through `--color-forest-500: #1c5a34`, L144-150 — these are the `bg-forest-800`, `text-forest-600`, etc. classes seen throughout Settings/Progress/skill-ladder).
- Fonts (L104-106): `--font-headline: var(--font-literata), 'Literata', serif`; `--font-body` / `--font-label: var(--font-nunito-sans), 'Nunito Sans', sans-serif` (label and body share the same font family, differ only by weight/size in usage).
- Two color systems coexist: the Material-3-named tokens (`primary`, `on-primary-container`, `surface-container-high`, etc. — used in Settings' left rail-adjacent bits, skill-ladder page, HatchPick) AND the flatter `forest-NNN`/`ink-*`/`hairline`/`card-bright`/`page-field` tokens (used in the "Codex ref 10" newer Settings billing band, Progress page, ChallengeCard, StatStrip, NoteCard). Both are valid/live; **do not assume one has superseded the other** — check which a given file already uses before adding new classes.

---

## Cross-cutting notes for implementers
1. **Resume/localStorage** is scoped to autopsy stories only (`hp_reader_${companySlug}/${storySlug}` via `useReaderResume`). Module reader and any other surface has no localStorage resume — don't assume `useReaderResume` generalizes without checking `storyKey` collisions.
2. **`ReaderRail` is currently dead code** for the two readers documented here (both hand-roll rails) — only `ReaderDock` is actually shared/wired up between them. If consolidating, `ReaderRail` is the target component but needs wiring into `CinematicReader`/`AutopsyReaderClient` (or `StoryReader.tsx`, not read this pass, may already use it).
3. **Three `ProgressRing` components and two `NoteCard` components** exist under different paths with the same export name — always check the import path, not just the local variable name, when reading/editing call sites.
4. **"Your next focus" CTA** on the main Progress page links to generic `/challenges` (no move filter), while the equivalent CTA on `/progress/skill-ladder` correctly deep-links `/challenges?move=${selectedMove}`. This asymmetry is pre-existing, not obviously intentional.
5. Marketing-mirror autopsy routes mentioned in the original brief were **not located** in this pass — flag for a follow-up grep of any `(marketing)` route group before assuming they exist or match this map.
