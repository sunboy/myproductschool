# UI density pass: design spec

Date: 2026-09-07. Status: approved by founder across three review rounds (see `.superpowers/brainstorm/68183-1788796857/content/final.html`, `feedback-round1..3.md`). This spec is the single source of truth for the implementation plan.

## 1. Problem

Every hub page spends 36% to 92% of a 1440×900 viewport on a hero, a subtitle paragraph and a full-width Hatch strip before useful content starts. The side nav (230px) and top bar (78px) are oversized for a product with four main routes. Reading pages show the side nav and a bold chapter index side by side, leaving a cramped column. The workspace and interview room use different shells from the rest of the app. Onboarding is a 12-screen modal over the dashboard.

## 2. Goals and non-goals

Goals
- Content begins by ~37% of a 1440×900 viewport on every hub page, and by 20% on Settings and readers.
- One shell for every signed-in route, with a collapsible side nav and a 48px top bar.
- Compact heroes that keep the geometric aesthetic and Hatch's presence.
- Reading pages in a single column with a quiet right-hand table of contents.
- Every button, chip, card and toggle in the new layouts is wired to a real action. No orphaned controls.
- Mobile (375) and laptop (1280) layouts follow the same rules.

Non-goals
- No new brand, palette, type or icon set. Terra tokens, Literata + Nunito Sans, Material Symbols stay.
- No changes to grading, Hatch prompts, billing, or content data. Only new read models where the design needs them (reading progress, view-mode preference, nav preference).
- No change to the admin area.

## 3. Global rules

### 3.1 Shell
- Side nav: 200px wide, labelled, open by default. A "Collapse" control at the bottom toggles a 56px icon-only rail with tooltips. Preference persists per user (`profiles.ui_prefs.nav_collapsed`, boolean) and is mirrored in `localStorage["hp:nav-collapsed"]` for instant paint. Brand mark stays in the nav; the rail shows the "H" monogram.
- Reader routes (`/explore/modules/*`, `/explore/autopsies/*/stories/*`) and workspace routes (`/workspace/*`, `/live-interviews/[id]`) force the rail on entry and restore the user preference on exit. Forced state is not written to the preference.
- Top bar: 48px. Contents: search field (route-scoped placeholder and target), three icon buttons (sound, tour, notifications), avatar with plan badge. On reader routes the search is replaced by a back link and a Save button.
- Mobile keeps the bottom tab bar (Home, Practice, Library, Progress) and a 44px top bar.
- The floating Hatch button and the Hatch chat panel are unchanged, except the first-run auto-open pop-up is removed (its two actions move into the dashboard Hatch card).

### 3.2 Header band (hubs)
- One tinted container (`bg-surface-container`, `rounded-2xl`), 88px tall on desktop, containing: page title (Literata 26px), optional subtitle ≤60 characters, optional chips row, and on the right a Hatch card (avatar, eyebrow, one-line title with ellipsis, one-line reason with ellipsis, CTA). Geometric shapes may sit behind at ≤55% opacity as texture.
- Mobile: the band stacks (title row, chips, Hatch card).
- Pages: Practice (chips: Practice interviews, Resume only), Progress (chips: Overview, Skill ladder, Submissions), Interviews (chips: Single, Multi-round). Library uses a title row plus a featured card instead of a band. Settings uses a title row only. Dashboard uses the hero grid in 3.3.
- Hatch card is functional everywhere: the title links to the recommended item, the CTA starts it, a ✕ dismisses it for 24h (`localStorage["hp:hatch-pick-dismissed:<route>"]` with timestamp), and it refreshes after the item is completed.

### 3.3 Dashboard hero grid
- 240px tinted container, grid `260px 1fr 1fr 300px` (returning) or `260px 1fr 300px` (new user).
- Cells: greeting (eyebrow, 28px Literata headline with amber italic accent, one line); Continue · challenge (dark green, stacked-rectangle art) shown only if an attempt is in progress; Continue · reading (deep green, diamond-and-ring art) shown only if a module chapter or autopsy story is in progress, else Hatch's pick; "A thought from Hatch" card with one sentence and two prompt rows that open the Hatch chat with that prompt.
- New user: Continue slot becomes the calibration card (eyebrow "Set your baseline · 5 min", headline, four FLOW moves as an empty checklist, "Start calibration →", "or skip and pick a challenge"). Hatch card prompts: "Pick my first challenge", "Show me around".

### 3.4 Cover cards
- Used on dashboard shelves, Library shelves, Practice card mode. Structure: art (56 to 96px, gradient + geometric shapes), eyebrow, title, then a meta row (counts) and a progress ring (conic gradient, `--pct`). Eight geometric compositions rotate by index so adjacent cards differ: diagonal cut, ring, diamond, ribbon stripes, chevron bands, waveform, stacked diamonds, halo. The composition index is `hash(id) % 8`, so a given item always gets the same art.
- Rings: challenges per area use `completed / total` for that discipline; study plans and modules use chapters or reps done.

### 3.5 Readers
- Rail forced collapsed. Column 700px, centred at ≥1280, left-aligned with 140px inset at 1440. Top bar: back link (to the parent list), Save, notifications, avatar.
- Header: eyebrow (module name · chapter n of N, or "Product autopsy · category · read time"), 34px Literata title, Literata lede 18px, an article hero image slot 700×180 (`rounded-2xl`), then body.
- Right TOC at ≥1280 (200px, 12px muted text): for modules a chapter list with ✓ on completed chapters and a 3px progress bar, then "On this page" headings; for autopsies a beat list with a progress bar. Active item: 2px `border-primary` left bar, `text-primary` bold. Clicking scrolls; IntersectionObserver updates the active item. Below 1280 the TOC is a "list" icon in the top bar opening a sheet.
- Reading progress: the scroll position and the last heading are saved to `reading_progress` (see 5) and `localStorage`, and drive "Continue · reading" on the dashboard and "Your learning" in the Library.

### 3.6 Copy
- Subtitles optional, ≤60 characters, never a paragraph. No em dashes, no second-person role framing. Landing headline ≤8 words, sub one line. Hatch is "it".

## 4. Route specifications

### 4.1 Dashboard `/dashboard` (returning)
Hero grid (3.3). Shelves in order:
1. "Practice areas" · "View all →" (`/challenges`): six cover cards (Coding/DSA, SQL & Data, System Design, Data Modeling, AI Analytics, Product Sense) with count of published challenges and a completion ring; click → `/challenges?discipline=<id>`.
2. "Worth reading this week" · "Library →" (`/explore`): one wide featured card (the same "Saved for you" item as the Library) plus three cover cards (mix of autopsy stories and module chapters, chosen by: in-progress first, then saved, then newest), each with read time and "Read →".
3. Row: two study-path cover cards (the user's enrolled plan, then the plan for the weakest FLOW move), Quick Take (existing card, unchanged behaviour), "Your week" (7-day streak dots, focus chip → `/progress`).

### 4.2 Dashboard (new user, `onboarding_completed_at` null)
Hero grid per 3.3 new-user variant. Shelves: "A good place to begin" (three curated first reps: one product, one coding, one system design, from the curated-first-rep helper extended to return three), then Practice areas with 0% rings. The Hatch chat does not auto-open.

### 4.3 Onboarding `/welcome`
- New full-page route in the `(onboarding)` group, no app shell. Split layout: left 44% (gradient `linear-gradient(160deg, primary-fixed, surface-container-low 55%, secondary-container)` with three geometric shapes, brand mark top-left, Hatch avatar with live dot and "Your HackProduct coach", 40px Literata question with the key phrase bold, one reassurance line, footer "About 5 minutes. Reset anytime from Settings."); right 56% (cream, step dots top-left, "Skip for now" top-right, content centred, "← Back" and a large "Next →" bottom).
- Steps (5): 1 Role: primary role (single-select chips, the ten existing roles) + "Also preparing for" (multi-select, optional). 2 Goal (four existing options) + Timeline (This month / 1 to 3 months / No deadline) + Context (Interview loop / Day-to-day work / Both). 3 and 4: the four FLOW scenarios, one screen each, with the FLOW strip on top; each shows a one-sentence scenario as a 28px headline ending in an italic amber question and four gut-call options (icon, bold line, short reason). 5 Results: archetype chip, four FLOW score tiles with level, Hatch's read, "Start my first challenge →" and "See my study plan".
- Left-panel copy and Hatch pose change per step (reuse the existing screen→pose map). Answers persist per step to the same fields the modal uses today; refresh resumes at the last step. "Skip for now" marks onboarding complete with role only and returns to `/dashboard` (value-first path).
- The modal remains only as a fallback when the flag is off; with the flag on, the dashboard redirects brand-new users to `/welcome` and Settings "Redo calibration" opens `/welcome?redo=1`. The proxy has no onboarding gate on this branch (the dashboard owns first-run routing), so no proxy change is needed.

### 4.4 Library `/explore`
Title row "Library" + chips (All N · Guides N · Autopsies N · Study plans N · Saved stories); chips filter the shelves below and set `?type=`. Featured "Saved for you" card, 160px, deep green, eyebrow, 34px title, one-line sub, "Start reading →", geometric art right with a glass chip "<Company> · N min read". Shelves: "Your learning" (in-progress modules/plans with rings; "Continue where you left off →"), "Study plans" (the move-tagged plans), "Modules", "Autopsies" (newest four; "All →" to the list page). All cover cards per 3.4. Top-bar search placeholder "Search guides, companies, or skills" targeting the Library search.

### 4.5 Practice `/challenges`
Band (3.2) with Hatch's pick. Discipline chips with counts (existing), filter row (Difficulty, Role, Company, Real interview) plus results count and a list/grid toggle (`profiles.ui_prefs.practice_view`, `"list" | "cards"`, mirrored in localStorage). List mode: existing rows. Card mode: 3-column cards with a 44px geometric thumbnail, type and difficulty tags, title, two-line summary, one technique chip, CTA (Start, or Resume when an attempt is in progress; no separate "In progress" tag). Page-level search removed; the top-bar search is scoped to challenges with placeholder "Search 1470 challenges by title, company, technique".

### 4.6 Module chapter `/explore/modules/[slug]/[chapter]`
Reader per 3.5. Right TOC: chapter list + on-page headings. Hero image: `learn_chapters.hero_image_url` if present, else a deterministic geometric placeholder (composition by hash). Save toggles the existing saved-content mechanism.

### 4.7 Autopsy story `/explore/autopsies/[company]/stories/[slug]`
Reader per 3.5 with the existing cover image at 150px height. Right TOC: beats with a progress bar. Left index removed.

### 4.8 Progress `/progress`
Band: "Progress" + chips (Overview / Skill ladder / Submissions, navigating to the sub-routes) + Hatch card "Your next focus" (weakest FLOW move, CTA "Find a challenge" → `/challenges?move=<weakest>`). Then the stats row and the three cards (FLOW moves, Skill profile, Last four weeks) unchanged in content.

### 4.9 Settings `/settings`
Title row "Settings" + chips (Account / Notifications / Membership) that scroll to sections. Two columns: account list (profile, email, notifications, calibration redo, Google link, password) and membership (plan, renewal, Manage billing, Invoices, usage this month). No hero, no band.

### 4.10 Workspace `/workspace/challenges/[id]`
Shared shell with the rail forced collapsed and the 48px top bar (back link uses `returnTo`; sound and flag icons; avatar). The pill nav is removed. 44px title row: title, type/difficulty tags, step tracker, Run, Submit. Panes unchanged.

### 4.11 Interview setup `/live-interviews`
Band: "Interviews" + chips (Single interview / Multi-round · N active) + Hatch card ("Hatch says", last session score and discipline, CTA "Debrief" → the debrief route). Setup panel (one bordered container): company list (existing data), discipline & role (existing), options (mode, length, pressure, canvas, plus a preview of the opening prompt), "Start interview →" inside the panel. Right column "Recent sessions" (score tags, Debrief links, incomplete rows resume). At <1280 the column drops below the panel.

### 4.12 Interview room `/live-interviews/[id]`
Dark shell kept. 44px bar: back, "Company · Role · Discipline", LIVE, timer "mm:ss / MM:00", FLOW phase tracker (four segments, filled by `interviewPhase`), "End interview". Three columns at ≥1280: left 300px (Hatch avatar with state ring and waveform, prompt card, "Hatch is scoring" checklist driven by the per-turn signal contract, quick replies); centre (notes pad or canvas by discipline mode, dock: mic, chat, focus, end); right 340px transcript always open (timestamps, voice state, text input). Mobile: stacked, notes as a bottom sheet, transcript primary. Pre-flight modal unchanged. Interview tour anchors updated to the new columns.

### 4.13 Landing `/` (`src/app/page.tsx` → `src/components/landing-v5/`)
Hero within 900px: eyebrow chip, 6-word headline "Interview practice that tests *more than code.*", one-line sub "Coding, SQL, system design and product judgment, graded by Hatch.", role chips, two CTAs, right side 3D Hatch + speech bubble + feedback card over the dark triangle and amber circle. Proof row fully visible at the fold. Logged-out nav: Practice, Library, Pricing, Log in, Start practicing.

## 5. Data and API additions

- `profiles.ui_prefs jsonb default '{}'`: `nav_collapsed: boolean`, `practice_view: "list"|"cards"`. Read in the (app) layout; written through `PATCH /api/profile` (extend the zod schema).
- `reading_progress` table: `user_id uuid`, `content_type text check in ('module_chapter','autopsy_story')`, `content_id text`, `parent_id text` (module slug or company slug), `progress numeric(4,3)`, `last_heading text`, `updated_at timestamptz`, PK `(user_id, content_type, content_id)`, RLS: owner read/write. `PUT /api/reading-progress` upserts (debounced client), `GET /api/reading-progress?limit=` returns latest for dashboard and Library.
- `learn_chapters.hero_image_url text null` (or the module-level equivalent found in the code map); placeholder when null.
- Hatch pick endpoint reused as-is; add `dismissed` handling client-side only.
- Curated first rep helper returns three slugs (product, coding, design).
- `ChallengeListFilters` gains `move` (filters `challenges.move_tags`) so `/challenges?move=<weakest>` from the Progress band works.
- No changes to attempts, sessions, grading or billing tables.

## 6. Responsiveness

- 1440×900: as specified. 1280×720: same layouts; dashboard hero 220px; Library and Practice grids 3 columns; interview setup sessions column below the panel; readers centre the 700px column. 375×812: bottom tab bar, band stacks, shelves become 2-column (practice areas) or single column (editorial, cards), readers single column with TOC sheet, onboarding split stacks with the left panel as a 150px header, interview room stacked.

## 7. Verification

Each route ships with Playwright checks at 1440×900, 1280×720, 375×812, authenticated as the Pro test user and, for new-user states, a freshly created user. Checks assert: content start y (dashboard shelves ≤ 340, Library "Your learning" ≤ 340, Practice first result ≤ 260, Settings first form ≤ 120, module h1 ≤ 120), shell dimensions (nav 200/56, top bar 48), every interactive element in the new layouts performs its action (navigation URL, network call, state change), preference persistence across reload, and no console errors. Visual snapshots are stored for review.

## 8. Rollout

Feature flag `ui_density_v1` (profile-level boolean via the existing flag mechanism, default on for the founder accounts, off in prod until sign-off). The old components stay behind the flag until the new ones are approved on the preview, then are deleted in a follow-up.
