# Linear Issues → Stitch Screen Mapping
## Design Language: Material 3 + Terra Theme

---

## Design System Reference

All screens share this common token set (defined in each file's `tailwind.config` `#tailwind-config` script block):

| Token | Value | Usage |
|---|---|---|
| `primary` | `#4a7c59` | Primary actions, active nav, headings |
| `tertiary` | `#705c30` | Luma notes, streak/milestone accents |
| `tertiary-fixed` | `#f8e0a8` | Warm amber highlight cards |
| `surface` / `background` | `#faf6f0` | Page background |
| `surface-container-low` | `#f5f1ea` | Card backgrounds (default) |
| `surface-container` | `#f0ece4` | Slightly elevated containers |
| `surface-container-high` | `#eae6de` | Higher elevation containers |
| `surface-container-highest` | `#e4e0d8` | Highest elevation, also `outline-variant` |
| `outline-variant` | `#c4c8bc` | Dividers, subtle borders |
| `on-surface-variant` | `#4a4e4a` | Secondary text |
| `error` | `#b83230` | Danger states |

**Fonts:** `font-headline` → Literata (serif); `font-body` / `font-label` → Nunito Sans

**Border radii:** `rounded` = 8px, `rounded-lg` = 16px, `rounded-xl` = 24px, `rounded-full` = 9999px

**Material Symbols:** `<span class="material-symbols-outlined">icon_name</span>`. Filled variant: add `style="font-variation-settings: 'FILL' 1;"`.

---

## FRONTEND: LEARN & PRACTICE

---

### SUN-55 — FE-01: App Shell, Navigation, Mobile Bottom Bar

**Primary Screen References:** `material-dashboard.html`, `05-dashboard-practice-gym.html`, `07-challenge-experience-a.html`

#### Sections / Components

**TopAppBar** (`material-dashboard.html` lines 92–109)
- `<header class="bg-[#faf6f0] ... fixed ... h-16 w-full">` — fixed, full-width, `h-16`, `z-50`
- Left: wordmark `font-headline text-2xl font-bold text-[#4a7c59]` + desktop nav `<a>` links with active state `border-b-2 border-[#4a7c59]` and hover state `hover:bg-[#4a7c59]/5`
- Right: search input `bg-surface-container rounded-full pl-10`, notifications button `material-symbols-outlined p-2 rounded-full hover:bg-[#4a7c59]/5`, avatar `account_circle`
- Challenge experience variant (`material-challenge-experience.html` line 91): close button `material-symbols-outlined close` replaces nav; challenge title shown in header

**Left SideNavBar** (`material-dashboard.html` lines 111–149)
- `<aside class="bg-[#faf6f0] w-72 fixed left-0 top-16 h-[calc(100vh-64px)] flex flex-col p-4 z-40 hidden md:flex">`
- User card: `rounded-2xl bg-surface-container` with avatar, name `font-headline font-bold`, role `text-xs text-outline uppercase`, progress bar `bg-primary h-full w-[65%]`
- Nav items: active `bg-[#4a7c59]/10 text-[#4a7c59] rounded-r-full font-bold`; inactive `text-stone-500 hover:pl-6 transition-all duration-300`; icons via `material-symbols-outlined`
- Icons used: `dashboard`, `workspace_premium`, `groups`, `library_books`
- CTA button at bottom: `bg-primary text-on-primary w-full py-4 rounded-xl font-bold`

**Right SideNavBar — Luma AI Coach** (`05-dashboard-practice-gym.html` lines 114–154)
- `<aside class="bg-[#faf6f0] w-80 border-l border-stone-200 shadow-xl fixed right-0 top-14 flex flex-col z-40">`
- Luma header: `w-10 h-10 rounded-xl bg-primary-container` icon container + `font-headline text-[#705c30]` label
- Nav items: `smart_toy`, `lightbulb`, `check_circle`, `forum` — hover `hover:text-[#4a7c59] hover:bg-stone-100 rounded-xl`
- Primary CTA: `bg-primary text-on-primary w-full py-3 rounded-xl font-bold`

**BottomNavBar — Mobile** (`material-dashboard.html` lines 301–319)
- `<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-[#faf6f0] flex justify-around items-center h-16 z-50 px-4 border-t border-stone-200">`
- Each item: `flex flex-col items-center gap-1`; active: `text-[#4a7c59]` with `FILL 1`; inactive: `text-stone-500`
- Labels: `text-[10px] font-bold` (active) / `text-[10px] font-medium`

**FAB** (`material-dashboard.html` line 321)
- `<button class="fixed bottom-20 right-6 md:bottom-8 md:right-8 bg-tertiary text-on-tertiary w-14 h-14 rounded-2xl shadow-xl">`
- Tooltip on hover: `absolute right-full mr-4 bg-inverse-surface text-inverse-on-surface px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100`

**Main Content offset:** `<main class="pt-24 pb-12 px-6 md:ml-72 min-h-screen">` (left nav offset) or `pr-0 md:pr-80` (right nav offset in practice gym variant)

**Design Notes:**
- Two sidebar patterns exist: left-sidebar (material-dashboard) and right-sidebar/Luma-coach (practice gym). These are context-dependent: left nav for content browsing, right Luma panel for active challenge/practice states.
- The challenge experience (`material-challenge-experience.html`) uses a minimized TopAppBar with a close button—this is the "focus mode" shell variant for FE-08.
- No screen exists for a collapsed/hamburger mobile sidebar. The mobile pattern uses BottomNavBar only. A slide-in drawer for mobile may need to be designed.

---

### SUN-56 — FE-02: Auth Screens (Signup, Login, Forgot/Reset Password)

**Primary Screen References:** None found in the provided stitch screens.

**Design Gap — No auth screens exist.** These need to be designed from scratch.

**Material 3 + Terra patterns to apply (derived from existing screens):**

- Page background: `bg-[#faf6f0]` (same as `background` token)
- Card container: `bg-surface-container-lowest` (white `#ffffff`) or `bg-surface-container-low` with `rounded-xl shadow-sm border border-outline-variant/20`
- Form inputs: follow the pattern in `material-challenge-experience.html` line 194 — `bg-surface-container-lowest border-outline-variant/40 rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-transparent`
- Primary button: `bg-primary text-on-primary py-3 rounded-full font-bold shadow-md hover:shadow-lg`
- Wordmark: `font-headline text-2xl font-bold text-[#4a7c59]`
- Luma branding element (abstract glow symbol) should appear on auth screens per product guidelines
- Error state: `text-error` (`#b83230`), `bg-error-container` (`#ffdad8`), `border-error`
- Link/secondary action: `text-primary font-bold hover:underline`

---

### SUN-57 — FE-03: Onboarding Flow (Calibration, Luma's Read, Self-Assessment)

**Primary Screen References:** None found in the provided stitch screens.

**Design Gap — No onboarding screens exist.** Three screens need to be designed.

**Material 3 + Terra patterns to apply:**

- **Stepper pattern** for multi-screen flow — reference `material-challenge-experience.html` lines 111–131:
  - Active step: `w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm`
  - Completed step: same but with check icon
  - Future step: `bg-surface-container-highest text-on-surface-variant border border-outline-variant`
  - Connector line: `h-[2px] mx-2 bg-primary` (done) / `bg-outline-variant` (future)
  - Step label: `text-xs font-bold text-primary` (active) / `text-xs font-medium text-on-surface-variant opacity-60` (future)
- **Luma note card** for "Luma's Read" screen — reference `05-dashboard-practice-gym.html` lines 278–283:
  - `bg-tertiary/10 rounded-lg border border-tertiary/20` with italic quote text `text-xs text-on-tertiary-container italic leading-relaxed`
- **Self-assessment** could use the checklist chip pattern from `07-challenge-experience-a.html` lines 278–291:
  - `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#4a7c59] text-xs text-[#4a7c59] font-bold`
- Calibration questions: textarea with `bg-surface-container-lowest border-outline-variant/40 rounded-xl p-4`

---

### SUN-58 — FE-04: Dashboard (Contextual Greeting, Continue Card, Stats, Luma Note)

**Primary Screen References:** `05-dashboard-practice-gym.html` (primary), `06-dashboard-advanced-analytics.html` (variant), `material-dashboard.html` (earlier iteration)

#### Sections / Components

**Contextual Greeting Header** (`05-dashboard-practice-gym.html` lines 158–175)
- Container: `<header class="mb-10">` with `flex items-start justify-between`
- Headline: `text-4xl font-bold text-on-background mb-2 tracking-tight` (Literata)
- Luma suggestion line: `text-on-surface-variant flex items-center gap-2` with icon `material-symbols-outlined text-[#705c30] FILL 1 wb_sunny`
- Streak pill: `bg-surface-container p-4 rounded-xl border border-outline-variant/20` with streak value `text-2xl font-bold font-headline text-tertiary` + `local_fire_department` icon filled

**Continue Card (In-Progress Module)** (`05-dashboard-practice-gym.html` lines 180–200)
- `bg-primary rounded-xl p-8 text-on-primary shadow-lg` with decorative blurs: `absolute -right-20 -top-20 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl`
- Badge: `bg-primary-container/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`
- Headline: `text-3xl font-bold mt-4 mb-2`
- CTA: `bg-background text-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2`
- Circular progress ring: SVG with `stroke-dasharray` / `stroke-dashoffset`, text `text-2xl font-bold` centered

**Domain Cards** (`05-dashboard-practice-gym.html` lines 211–237)
- `bg-surface-container-low p-6 rounded-xl hover:shadow-md transition-all border border-transparent hover:border-primary/20 group`
- Icon container: `w-12 h-12 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary`
- Title: `font-bold text-lg group-hover:text-primary transition-colors`
- Metadata: `text-stone-500 text-sm`
- Facepile: `flex -space-x-2` with `w-6 h-6 rounded-full border-2 border-background`

**ProductIQ Score / Radar Chart** (`05-dashboard-practice-gym.html` lines 241–287 — simple SVG radar)
- Container: `bg-surface-container-highest p-6 rounded-xl shadow-sm`
- SVG radar: `stroke-outline-variant/40 fill-none` background web, `fill-primary/20 stroke-primary stroke-2` data polygon
- Labels: `absolute text-[10px] font-bold uppercase tracking-tighter text-on-surface`
- Luma note: `bg-tertiary/10 rounded-lg border border-tertiary/20` with italic text

**ProductIQ Bento Grid variant** (`06-dashboard-advanced-analytics.html` lines 250–338)
- Each dimension card: `bg-surface-container-low p-4 rounded-xl border border-outline-variant/20`
- Score: `text-2xl font-bold font-headline` + percentile `text-[10px] text-stone-500`
- Mini sparkline bars: `flex items-end gap-1 h-8` with `w-1.5 bg-tertiary h-full rounded-full`
- Mini circular progress ring: small SVG `w-8 h-8 -rotate-90` with `stroke-2` circles
- Trend arrow: `material-symbols-outlined trending_up` (green), `trending_flat` (neutral), `trending_down` (red)

**Focus Tasks Section** (`05-dashboard-practice-gym.html` lines 291–322)
- Grid: `grid-cols-1 md:grid-cols-3 gap-6`
- Task card: `bg-surface p-5 rounded-xl border border-outline-variant/30 flex items-start gap-4`
- Checkbox: `w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary`

**Design Notes:**
- Screens 05 and 06 are nearly identical in structure but differ in the ProductIQ panel: 05 uses an SVG radar chart, 06 uses a bento-grid of dimension cards. The `variant` prop pattern (mentioned in CLAUDE.md) should control which renders.
- The `material-dashboard.html` is an earlier design with a left sidebar; screens 05/06 use a right-side Luma panel. Use screens 05/06 as the definitive reference.

---

### SUN-59 — FE-05: Domain List + Domain Detail Pages (Layer 1)

**Primary Screen References:** `05-dashboard-practice-gym.html` (domain card pattern only — no dedicated domain list/detail screen exists)

**Partial Design Gap — No full domain list or domain detail screens exist.** Domain cards on the dashboard provide the card component pattern; the list/grid and detail page need to be designed.

**Patterns from existing screens:**

**Domain Card** (reuse from `05-dashboard-practice-gym.html` lines 206–237):
- `bg-surface-container-low p-6 rounded-xl hover:shadow-md border border-transparent hover:border-primary/20`
- Icon tile: `w-12 h-12 rounded-lg` colored by domain type (tertiary-fixed for FinTech, primary-fixed for Behavioral)

**Domain Detail — suggested patterns to compose:**
- TopAppBar with back navigation: `material-symbols-outlined arrow_back` (reference `material-challenge-experience.html` close button at line 93)
- Progress section: reuse sidebar progress bar from `material-dashboard.html` lines 120–126 (`bg-outline-variant/30 h-1.5 rounded-full`, `bg-primary h-full`)
- Breadcrumb: `flex items-center gap-2 text-sm text-outline` + `material-symbols-outlined chevron_right` (reference `material-discussions.html` lines 161–166, `material-analytics.html` lines 161–166)
- Module list: table-style with status badges from `material-analytics.html` lines 377–392 — `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold`

---

### SUN-60 — FE-06: Comprehension Checks, Vocabulary Page, Flashcard Drill

**Primary Screen References:** None found in the provided stitch screens.

**Design Gap — No comprehension check, vocabulary, or flashcard screens exist.** All need to be designed.

**Material 3 + Terra patterns to apply:**

**Comprehension Check (quiz-style):**
- Question card: `bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20` (ref: `material-challenge-experience.html` line 137)
- Answer options: `rounded-xl p-6 rounded-xl border border-outline-variant/20` with hover `hover:border-primary/30`; selected: `border-primary bg-primary/5`
- Stepper for question progress: reuse `material-challenge-experience.html` lines 111–131 pattern

**Vocabulary Page:**
- Term card: `bg-surface-container-low p-6 rounded-xl` pattern
- Definition badge: `bg-secondary-container text-on-secondary-container text-xs px-2 py-0.5 rounded-md font-medium` (ref: `material-discussions.html` line 188)

**Flashcard Drill:**
- Card flip: `bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20` — front/back states. Consider `bg-primary text-on-primary` for revealed answer face to match the "Continue card" visual language.
- Progress: micro sparkline bar pattern from `06-dashboard-advanced-analytics.html`

---

### SUN-61 — FE-07: Pattern Pages (Layer 2) + Challenge Library with Filters + Company Tags

**Primary Screen References:** `07-challenge-experience-a.html` (challenge page header/company tag), `material-discussions.html` (filter tag pattern), `09-challenge-discussions-a.html` (company tag chip)

**Design Gap — No dedicated challenge library list screen exists.** The company tag and filter chip patterns exist; the library grid/list needs to be designed.

**Patterns from existing screens:**

**Company tag chip** (`07-challenge-experience-a.html` line 171):
- `<img class="w-5 h-5 rounded shadow-sm">` company logo + `text-xs font-bold uppercase tracking-wider text-[#6b6358] font-body`
- Also: `09-challenge-discussions-a.html` line 107: `bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider`

**Filter chips** (`material-discussions.html` lines 336–342):
- Primary: `bg-primary-container text-on-primary-fixed-variant px-3 py-1.5 rounded-full text-xs font-bold`
- Default: `bg-surface-container-highest text-on-surface-variant px-3 py-1.5 rounded-full text-xs font-medium`
- Accent: `bg-tertiary-fixed-dim text-on-tertiary-container px-3 py-1.5 rounded-full text-xs font-bold`

**Challenge Library Card (suggested composition):**
- Use domain card shell: `bg-surface-container-low p-6 rounded-xl hover:shadow-md border border-transparent hover:border-primary/20 group`
- Company logo: `w-5 h-5 rounded shadow-sm` with company name chip
- Difficulty badge: use status pill from `material-analytics.html` (`inline-flex items-center gap-1.5 px-3 py-1 rounded-full`)
- Estimated time: `material-symbols-outlined timer text-sm` pattern from `material-dashboard.html` line 233

**Pattern Page** (Layer 2 content page — no screen exists, needs design):
- Content card: `bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20` with rich text and an image block
- Related topics chips: reuse `material-discussions.html` Related Topics section (lines 334–343)

---

### SUN-62 — FE-08: Challenge Detail Page — Four-Mode Architecture (Spotlight / Workshop / Live / Solo)

**Primary Screen References:** `07-challenge-experience-a.html` (primary — full split-pane layout), `08-challenge-experience-b.html` (variant — visual refinement of same layout), `material-challenge-experience.html` (earlier version — stepper-based flow)

#### Sections / Components

**Split-Pane Shell** (`07-challenge-experience-a.html` lines 163–315)
- Outer: `<main class="flex-1 flex overflow-hidden mr-80">` (offset for right Luma rail)
- Left pane (Case): `<section class="w-1/2 flex flex-col border-r border-stone-200 bg-white/50">`
- Right pane (Work): `<section class="w-1/2 flex flex-col bg-white">`

**Case Pane Header** (lines 167–178)
- Company logo: `<img class="w-5 h-5 rounded shadow-sm">` + company name chip `text-xs font-bold uppercase tracking-wider text-[#6b6358]`
- Challenge title: `font-headline text-2xl font-bold text-[#2e3230]`
- Fullscreen toggle: `material-symbols-outlined fullscreen`

**Case Pane Content** (lines 179–238)
- Prose body: `text-[#4a4e4a] font-body leading-relaxed`
- Data table: `rounded-xl border border-stone-200 overflow-hidden bg-white/60` with `thead bg-stone-100 text-[#6b6358] uppercase tracking-tighter` and `tbody divide-y divide-stone-100`
- READ ONLY badge: `bg-stone-200 px-2 py-0.5 rounded text-[#6b6358] font-mono` (07-a) / `bg-[#f0ece4] border border-[#d4ccbf]` (08-b)
- Hint block: `p-4 bg-[#4a7c59]/5 border-l-4 border-[#4a7c59] rounded-r-xl` with `text-xs text-[#4a7c59] font-bold mb-1` label + italic body

**Work Pane Tabs** (lines 243–255)
- Tab bar: `h-14 flex border-b border-stone-200`
- Active tab: `border-b-2 border-[#4a7c59] text-[#4a7c59] flex items-center gap-2 font-bold`
- Inactive: `text-[#6b6358] hover:text-[#4a7c59]`
- Tab labels with icons: `edit_note` Answer, `visibility` Review, `history` History

**Work Pane Stepper** (lines 257–273)
- `flex items-center gap-1` row of `w-8 h-8 rounded-full` nodes
- Active node: `bg-[#4a7c59] text-white shadow-sm`; future node: `border-2 border-[#d4ccbf] text-[#6b6358]`
- Connector: `w-12 h-0.5` — `bg-[#4a7c59]` (complete), `bg-[#e4e0d8]` (future)
- Step label top-right: `text-[10px] uppercase font-bold text-[#6b6358] tracking-widest` + `text-sm font-bold text-[#2e3230]`

**Checklist Chips** (lines 278–291)
- Completed: `border border-[#4a7c59] text-[#4a7c59] font-bold` with `check_circle FILL 1` icon
- Incomplete: `border border-stone-200 text-[#6b6358]` with `radio_button_unchecked`

**Answer Textarea** (lines 292–298)
- `w-full h-full bg-white border-2 border-[#e4e0d8] rounded-xl p-6 focus:ring-2 focus:ring-[#4a7c59] focus:border-[#4a7c59] outline-none resize-none`
- Floating Coach Pill: `absolute bottom-6 right-6 bg-[#2e3230] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg` with pulsing amber dot `w-2 h-2 rounded-full bg-amber-400 animate-pulse`

**Footer Actions** (lines 300–313)
- Meta: `text-[#6b6358] text-xs` with `schedule` and `description` icons
- Save Draft: `border border-[#d4ccbf] text-[#6b6358] font-bold text-sm rounded-xl hover:bg-white hover:border-[#4a7c59]`
- Next Step: `bg-[#4a7c59] text-white font-bold rounded-xl shadow-sm` + `arrow_forward` icon

**Mode Architecture Design Notes:**
- Screens 07 and 08 show the same "Solo" mode layout in two refinements (08-b uses tighter Terra tokens, 07-a uses some raw stone- values). Use **08-b as canonical** for its consistent use of the full token set.
- **Spotlight, Workshop, Live modes do not have distinct screens.** The four-mode architecture variation (mode selector, timer for Live, collaborative indicators for Workshop) needs to be designed. Suggested approach: mode selector pill group above the case pane, with conditional state changes to the stepper, footer actions, and Luma panel.
- The earlier `material-challenge-experience.html` shows a **single-pane vertical layout with a right coaching rail** as an alternative to the split-pane—this may be better suited for mobile.

---

### SUN-63 — FE-09: Luma Feedback Screen (Mode-Aware Rendering, Realtime Polling, Scores, Transcript)

**Primary Screen References:** `material-challenge-experience.html` (Luma panel pattern), `05-dashboard-practice-gym.html` (Luma sidebar)

**Design Gap — No dedicated post-submission / Luma feedback screen exists.** Needs to be designed.

**Patterns from existing screens:**

**Luma Chat Bubble** (`material-challenge-experience.html` lines 183–189)
- Message: `bg-surface-container-high text-on-surface-variant p-4 rounded-r-xl rounded-bl-xl text-sm leading-relaxed border border-outline-variant/30`
- Timestamp: `text-[10px] text-on-surface-variant font-bold uppercase tracking-widest`

**Coaching panel header** (`material-challenge-experience.html` lines 169–181)
- `bg-[#4a7c59] text-on-primary p-6`
- Avatar: `w-12 h-12 rounded-full border-2 border-primary-fixed`; online dot: `w-3 h-3 bg-emerald-400 border-2 border-[#4a7c59] rounded-full absolute bottom-0 right-0`
- Name: `font-bold font-headline`; subtitle: `text-xs text-on-primary-container opacity-90`

**Score display** (derived from `material-analytics.html` and `05-dashboard-practice-gym.html`):
- Large score: `text-5xl font-bold text-on-background` (ref analytics) or per-dimension bento cards
- Progress bar: `h-2 flex-1 bg-surface-container-highest rounded-full overflow-hidden` with colored fill
- Trend badge: `text-sm font-bold flex items-center gap-1` + `trending_up` icon

**Luma note** (ref `05-dashboard-practice-gym.html` line 340):
- `bg-tertiary/10 rounded-lg border border-tertiary/20 p-4`
- `text-xs text-on-tertiary-container italic leading-relaxed`

**Realtime polling indicator** — no pattern exists. Suggested: pulsing dot `w-2 h-2 rounded-full bg-amber-400 animate-pulse` (from challenge screen floating pill) combined with a `text-xs text-outline` status label.

**Design Notes:**
- This screen must handle two states: (1) waiting/polling state (Luma is reviewing) and (2) feedback ready state. The waiting state should show the animated Luma glyph per product guidelines.
- Transcript section can reuse the discussion thread pattern from `material-discussions.html` or `09-challenge-discussions-a.html`.

---

### SUN-64 — FE-10: Model Answer Page + Other Approaches Tab

**Primary Screen References:** `07-challenge-experience-a.html` (Review tab in work pane), `08-challenge-experience-b.html` (same)

**Design Gap — The Review tab is shown in the tab bar but its content state is not rendered.** The model answer and "Other Approaches" tab content needs to be designed.

**Patterns from existing screens:**

**Tab navigation** (`07-challenge-experience-a.html` lines 243–255): The `visibility` Review tab and `history` History tab share the same tab bar as Answer. Model answer lives under "Review."

**Content card for model answer:**
- Reuse `bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/20` (ref `material-challenge-experience.html` line 137)
- Prose: `text-on-surface-variant leading-relaxed font-body text-lg`
- Section headers: `font-bold text-primary flex items-center gap-2` with icon

**Other Approaches / Community** — reference `09-challenge-discussions-a.html` discussion list (lines 103–161):
- Discussion list sidebar: `bg-surface-container-lowest` with `p-4 rounded-xl bg-primary/5 border-l-4 border-primary shadow-sm` for featured pick
- Regular items: `p-4 rounded-xl hover:bg-surface-container transition-colors`
- Expert badge: `bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded`

**Design Notes:**
- The "Other Approaches" tab maps directly to the discussion thread pattern; consider whether it's a tab within the challenge work pane or a navigation to the discussions screen (FE-09 / SUN-63).

---

### SUN-65 — FE-11: Progress Page (Radar Chart, Luma Summary, Submission History)

**Primary Screen References:** `05-dashboard-practice-gym.html` (radar chart + Luma note on dashboard), `06-dashboard-advanced-analytics.html` (bento grid scores), `material-analytics.html` (analytics layout with table)

#### Sections / Components

**Radar Chart** (`05-dashboard-practice-gym.html` lines 248–268)
- SVG with `stroke-outline-variant/40 fill-none` concentric polygon web + `fill-primary/20 stroke-primary stroke-2` data polygon
- Dimension labels: `absolute text-[10px] font-bold uppercase tracking-tighter text-on-surface` — positioned with absolute offset from center
- Dimensions used: Execution, Product Sense, Strategy, Leadership, Analytical

**Dimension Bento Cards** (`06-dashboard-advanced-analytics.html` lines 250–338)
- Large "featured" dimension: `col-span-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 flex items-center justify-between` with circular SVG progress ring
- Small dimension card: `bg-surface-container-low p-4 rounded-xl` with score + percentile + mini sparkline or trend arrow
- Circular progress ring: `w-16 h-16` SVG with `text-stone-200` track circle + `text-primary` progress circle, `stroke-dasharray/stroke-dashoffset` for fill

**Total score display** (`06-dashboard-advanced-analytics.html` lines 243–247)
- `bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30` containing `text-xs uppercase font-bold text-stone-500` label + `font-headline font-bold text-2xl text-primary` value

**Luma Summary Note** (`05-dashboard-practice-gym.html` lines 278–283)
- `bg-tertiary/10 rounded-lg border border-tertiary/20 p-4`
- `text-xs text-on-tertiary-container italic leading-relaxed` with `— Luma` attribution

**Submission History Table** (reference `material-analytics.html` lines 349–428)
- Section header: `px-8 py-6 border-b border-surface-container-highest flex justify-between items-center`
- Table: `w-full text-left`
- `thead bg-surface-container-low text-xs font-bold uppercase tracking-wider text-outline`
- `tbody divide-y divide-surface-container-highest`
- Row hover: `hover:bg-surface-container-low transition-colors group`
- Status badge: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full` with colored dot `w-1.5 h-1.5 rounded-full`
- Mini trend sparkline in table cell: `w-24 h-6 bg-primary/5 rounded flex items-center gap-0.5 px-1` with `w-1.5 rounded-full` bar columns

**Page layout:**
- Full-page, left sidebar navigation (same shell as `material-dashboard.html`)
- Breadcrumb: `flex items-center gap-2 text-sm text-outline mb-4` with `chevron_right` separators
- Page header: `font-headline text-4xl font-bold text-on-background tracking-tight`

---

## FRONTEND: INTERVIEW PREP, TRANSFER & PROFILE

---

### SUN-66 — IP-01: Interview Prep Hub + Company Study Plan Pages + Countdown Planner

**Primary Screen References:** `05-dashboard-practice-gym.html` nav (Interview Prep link), `material-dashboard.html` (dashboard layout reference)

**Design Gap — No Interview Prep hub, company study plan, or countdown screens exist.** All need to be designed.

**Material 3 + Terra patterns to apply:**

**Hub page layout:**
- Same shell as dashboard (left sidebar or right Luma rail depending on context)
- Section header: `font-headline text-4xl font-bold` + descriptive subtitle `text-on-surface-variant mt-2 max-w-2xl leading-relaxed` (ref `material-analytics.html` lines 166–167)

**Company Study Plan card (suggested):**
- Use domain card shell: `bg-surface-container-low p-6 rounded-xl hover:shadow-md border border-transparent hover:border-primary/20`
- Company logo: `w-12 h-12 rounded-lg` with company logomark
- Company tag chip: `bg-secondary-container text-on-secondary-container text-xs px-2 py-0.5 rounded-md font-medium` (ref `material-discussions.html` line 188)
- Progress bar: `bg-outline-variant/30 h-1.5 rounded-full` with `bg-primary h-full`

**Countdown Planner:**
- "Milestone Progress" card pattern from `material-dashboard.html` lines 270–296:
  - Container: `bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-xl p-8`
  - Phase badge: `bg-tertiary-container text-on-tertiary-container rounded-full text-xs font-semibold`
  - Progress bar: `overflow-hidden h-2 mb-4 rounded-full bg-on-tertiary-fixed-variant/10` with `bg-tertiary` fill
  - ETA: `font-bold` date text
- Or "Streak" chip from dashboard: `bg-surface-container p-4 rounded-xl border border-outline-variant/20` with `text-2xl font-bold font-headline text-tertiary`

---

### SUN-67 — IP-02: Transfer Hub, Product Pages, Interview Simulation Chat UI + Debrief

**Primary Screen References:** `material-challenge-experience.html` (chat/coaching panel pattern), `09-challenge-discussions-a.html` (prose body + reply textarea)

**Design Gap — No transfer hub, product pages, or interview simulation screens exist.** All need to be designed.

**Material 3 + Terra patterns to apply:**

**Interview Simulation Chat UI** — compose from:
- Chat bubble (Luma message): `bg-surface-container-high text-on-surface-variant p-4 rounded-r-xl rounded-bl-xl text-sm leading-relaxed border border-outline-variant/30` (ref `material-challenge-experience.html` line 185)
- User reply bubble (mirrored): `bg-primary text-on-primary p-4 rounded-l-xl rounded-br-xl`
- Chat input: `material-challenge-experience.html` lines 192–199: `bg-surface-container-lowest border-outline-variant/40 rounded-xl p-4 focus:ring-2 focus:ring-primary resize-none` + mic icon `material-symbols-outlined mic` + attach icon
- Submit button: `bg-primary text-on-primary py-3 rounded-full font-bold shadow-md` (same file line 213)
- Luma coaching panel header (for simulation header): lines 169–181

**Debrief screen:**
- Score card: bento-grid dimension cards from `06-dashboard-advanced-analytics.html`
- Luma summary: `bg-tertiary/10 rounded-lg border border-tertiary/20` italic note
- Transcript: prose body `text-xl text-stone-600 leading-relaxed font-light` with `strong` emphasis (ref `09-challenge-discussions-a.html` lines 186–189)

**Product Pages (Transfer Hub):**
- Reuse the domain card pattern with a `w-12 h-12 rounded-lg bg-tertiary-fixed` icon tile
- Card grid: `grid-cols-1 sm:grid-cols-2 gap-4` (ref dashboard domain cards)

---

### SUN-68 — IP-03: Transfer Skill Test, Certificate Page

**Primary Screen References:** `07-challenge-experience-a.html` / `08-challenge-experience-b.html` (skill test = challenge UX), `material-dashboard.html` (badge/achievement pattern)

**Design Gap — No certificate page exists.** The skill test can reuse the challenge experience shell; the certificate page needs to be designed.

**Patterns from existing screens:**

**Skill Test** — reuse challenge split-pane shell from `08-challenge-experience-b.html` directly. Differences to implement:
- Mode label: different badge text (e.g., "Skill Assessment" vs "In Progress") using `bg-primary-container/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`
- Final submit CTA: `bg-[#4a7c59] text-white font-bold rounded-xl shadow-sm` in footer

**Badge / Achievement** (`material-dashboard.html` lines 218–220):
- Reference: `bg-on-primary-container text-primary font-bold text-[10px] px-2 py-1 rounded-md uppercase` chip
- Streak/badge count: `font-headline font-bold text-on-surface` stat in grid

**Certificate Page (suggested composition):**
- Hero card: use the Featured Challenge card pattern from `material-dashboard.html` lines 226–241 as structural reference: `bg-primary text-on-primary rounded-xl p-6 shadow-lg relative overflow-hidden` with `absolute top-0 right-0 w-32 h-32 bg-on-primary-container/10 rounded-bl-full` decoration
- Certificate title: `font-headline text-2xl font-bold`
- Credential details: `bg-surface-container text-on-surface rounded-xl p-6`
- Share / download CTA: `bg-primary text-on-primary px-6 py-3 rounded-xl font-bold` + secondary `bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-bold`
- Social proof / company tags: filter chip pattern from `material-discussions.html` lines 336–342

---

## Screen Inventory Summary

| Screen File | Issues It Covers |
|---|---|
| `material-dashboard.html` | FE-01 (shell), FE-04 (dashboard — earlier) |
| `05-dashboard-practice-gym.html` | FE-01 (shell), FE-04 (dashboard primary), FE-11 (radar) |
| `06-dashboard-advanced-analytics.html` | FE-04 (variant), FE-11 (bento analytics) |
| `material-challenge-experience.html` | FE-08 (stepper variant), FE-09 (Luma panel), IP-02 (chat UI) |
| `07-challenge-experience-a.html` | FE-08 (split pane A), FE-10 (tabs) |
| `08-challenge-experience-b.html` | FE-08 (split pane B — canonical), FE-10 (tabs), IP-03 (skill test) |
| `material-discussions.html` | FE-07 (filter chips), FE-09 (transcript), community components |
| `09-challenge-discussions-a.html` | FE-07 (company tags), FE-09/10 (other approaches) |
| `material-analytics.html` | FE-11 (submission history table), IP-01 (hub layout) |

## Screens That Do Not Exist (Need New Designs)

| Issue | Screen(s) Needed |
|---|---|
| SUN-56 / FE-02 | Auth: Signup, Login, Forgot Password, Reset Password |
| SUN-57 / FE-03 | Onboarding: Calibration, Luma's Read, Self-Assessment (3 screens) |
| SUN-59 / FE-05 | Domain List page, Domain Detail page |
| SUN-60 / FE-06 | Comprehension Check, Vocabulary Page, Flashcard Drill |
| SUN-61 / FE-07 | Challenge Library list/grid page, Pattern page (Layer 2 content) |
| SUN-63 / FE-09 | Luma Feedback / Post-submission screen |
| SUN-64 / FE-10 | Model Answer content state (Review tab content) |
| SUN-66 / IP-01 | Interview Prep Hub, Company Study Plan page, Countdown Planner |
| SUN-67 / IP-02 | Transfer Hub, Product pages, Interview Simulation, Debrief screen |
| SUN-68 / IP-03 | Certificate page |
