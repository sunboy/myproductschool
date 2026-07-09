# Content Organization Audit & IA Restructure

**Date:** 2026-07-09 · **Branch:** `feature/redesign-options` · **Inputs:** 4 parallel codebase audits + competitor research (LeetCode, Educative, Maven, Interview Kickstart, Exponent, Brilliant, Duolingo, AlgoExpert) + Codex brainstorm

## Executive summary

The content is not the problem. HackProduct has more substance than most funded competitors: 500+ staged challenges (coding 278, algorithms 122, system design 87, data modeling 16), 102 company autopsies, learn modules, study plans, live AI interviews, and a Claude Code Analytics lab nobody else has. The problem is that every surface tries to show all of it at once.

Three numbers tell the story:

| Surface | Today | Target |
|---|---|---|
| Dashboard cards/sections | ~20 (18–22 CTAs) | ≤8 modules, ≤8 CTAs |
| Explore clickable destinations | ~40+ | ~20 |
| Nav items vs route families | 5 nav items / ~30 route families | 5 nav items, every family reachable in ≤2 clicks |

The fix is one principle applied everywhere: **the dashboard answers "where am I," the library answers "what's next," and practice is a filterable index.** FLOW stops being a brand and becomes a progression system.

---

## Part 1 — What's wrong today

### 1.1 Dashboard (`src/app/(app)/dashboard/page.tsx`)

Inventory: ~20 cards/sections across a hero row and a two-column body. 18–22 distinct CTAs depending on plan/calibration state. Specific problems:

- **Five entry points to the same "practice" action** near the fold: Coach Spine "Start today's session", Next Challenge card, Cadence Ribbon "Core challenge" step, section-heading "All practice" link, Hot Challenges card.
- **Four interview-flavored cards can coexist** in the right aside: Upgrade Sponsor ("Run a live loop"), Paused Loop, Latest Interview, Interview Countdown.
- **FLOW appears three times**:
  1. `FlowMoveLevelsCard` (compact map of the user's own move levels) — *actionable, worth keeping*
  2. `DisciplineExplorer`/`DisciplineCard` — a large GSAP-animated dark-green "F→L→O→W" circuit card. It is the single heaviest visual element on the page, teaches generic FLOW content, and duplicates the dedicated `/explore/flow` explainer page
  3. Coach Spine hero language ("a Frame challenge", focus/Lv stats)
- **Two dark high-contrast heroes** (Coach Spine + DisciplineCard) compete above the fold.
- **Dead weight**: `AnalyticsLabCard` is mounted twice (breakpoint swap); `AchievementsCard` is commented out but its data is still fetched every load.
- **`profiles.dashboard_cards` is not wired** — the layout is hardcoded JSX. Density cannot be fixed by trimming a preference list; it requires editing the page.

### 1.2 Explore (`src/app/(app)/explore/page.tsx`)

Single page stacking: animated backdrop + hero with meta chips + 3 primary path cards + Guides (4) + Autopsies (4) + Domains (6) + "Asked at top companies" spotlight (4 company groups × up to 4 links) + Study Plans grid. Roughly **40+ clickable destinations**.

- **Study plans have three entry points on this one page** (hero CTA, path card, full grid section).
- **The dedicated `/explore/flow` explainer — the right home for FLOW education — is not obviously linked from Explore**, while the dashboard over-teaches FLOW inline.
- Static fallbacks (`MODULES_STATIC`, `PLANS_STATIC`) can render hardcoded duplicates when queries return empty.

### 1.3 Site information architecture

- **TopNav has 5 items** (Home, Explore, Practice, Interviews, Progress) **against ~30 authenticated route families.** Orphaned or near-invisible: `/notes`, `/flashcards`, `/vocabulary`, `/cohort`, `/history`, `/simulation`, `/frameworks`, `/product-75`, `/interview-prep/[company]`, blog (no app entry), discussions (no top-level route), Quick Takes (dashboard embed only), CC Analytics (challenge medium + marketing page only).
- **Four parallel autopsy URL trees**: `/explore/autopsies` (app), `/autopsies` (marketing), `/autopsy` (redirect alias), plus nested-vs-flat story URL variants. Same story, multiple canonical-looking URLs.
- **Three mock-interview surfaces** (`/live-interviews`, `/live-interviews/loop`, `/simulation`) with only one in the nav.
- **Redundant doors**: `/domains` redirects to `/explore`; marketing `/study-plans` parallels app `/explore/plans`; practice is triple-sourced (nav, path card, company spotlight) into the same `/challenges` hub.
- **FLOW is fundamentally an internal scoring taxonomy** (`src/lib/flow/moves.ts` drives grading, coverage credits, move levels, and `?move=` filtering) that got over-promoted into hero UI.

### 1.4 Design system (why it reads "vibecoded")

Two disconnected token systems share one palette: app `globals.css` (M3 Terra) and marketing `v3-landing.css` (3,022 lines, own token names, `--amber` **value mismatch**: `#c9933a` vs `#d98211`). On top of that:

- **997** arbitrary `text-[Npx]` font sizes (incl. `text-[10.5px]` ×31) — the type scale is abandoned
- **2,021** inline hex literals across 125 files, bypassing tokens that exist for those exact values
- **74** bespoke `shadow-[…]` recipes; 4 different card radii on the dashboard grid alone (`rounded-2xl`, `[22px]`, `[24px]`, plus arbitrary one-offs)
- Off-palette FLOW gradients (blue `#4a8fd4`, teal, purple `#a78bfa`) directly contradicting the token comment above them
- Two icon systems (material-symbols ×234 files, lucide ×14) + emoji in 20 files
- ~22 different page max-widths including invalid classes (`max-w-l`, `max-w-x`) that silently do nothing
- shadcn `Card` primitive used by exactly 1 file; `.card-elevated`/`.glass-card` utilities used 0 times; no `PageShell`/`SectionHeader` — every page hand-rolls its shell
- Hatch is the strongest brand asset (`HatchGlyph` in 79 files) but is rendered via three technologies (inline SVG, PNG, Rive)

### 1.5 What the serious platforms do differently

From the competitor research, the principles HackProduct violates today:

1. **Dashboard ≠ library.** LeetCode, Educative, and Exponent keep "where am I" (progress, continue, streak) strictly separate from "what's next" (filterable index, curated paths). HackProduct's dashboard tries to be both.
2. **Curated paths are the anti-overwhelm device.** Study Plans (LeetCode), Skill Paths (Educative), the single linear path (Duolingo), 200 curated questions (AlgoExpert). HackProduct buries study plans below three other sections.
3. **Taxonomy lives in tags and filters, never the hero.** LeetCode topics are quiet chips; Exponent facets are role × type × company. FLOW should follow the same model.
4. **One unambiguous primary CTA per surface.** Every serious platform repeats a single action. HackProduct's dashboard offers ~20.
5. **Color carries meaning (difficulty/status/progress), not mood.** Green/amber/red difficulty coding, activity heatmaps, progress rings — quantified progress reads as serious.

---

## Part 2 — Recommended restructure

### 2.1 Navigation (stays at 5 items)

| Nav item | Route | Role |
|---|---|---|
| Home | `/dashboard` | Where am I: continue, streak, weak spot |
| Practice | `/challenges` | Filterable index of 500+ challenges (difficulty, company, medium, FLOW-move facets) |
| Interviews | `/live-interviews` | ALL mock-interview modes — voice rounds, loops, and **text simulation (absorbs `/simulation`)** as a third mode tab |
| **Library** | `/explore` | Curated content: plans, guides, autopsies, domains, company prep. (Label renamed from "Explore"; route unchanged) |
| Progress | `/progress` | FLOW mastery, skill ladder, history, leaderboard, community |

**Avatar menu** gains a "Review" group: Notes, Flashcards, Vocabulary, History (also surfaced as a "Review tools" row on `/progress`). Orphan adoption: `/product-75` pinned as the marquee Program card in Library plans; `/interview-prep/[company]` linked from Interviews and the Library companies row; `/cohort` linked from the Progress community section; `/frameworks` redirected to `/explore/flow`.

### 2.2 Dashboard v2 — from ~20 cards to ≤8

**The one primary CTA: "Continue"** — next step of the enrolled study plan if one exists, else the recommended next challenge.

| Card | Verdict |
|---|---|
| CoachSpineCard | **Hero.** Absorbs NextChallengeCard (Continue CTA payload) and CadenceRibbon (streak strip). FLOW language reduced to one focus-move line ("This week: sharpen Frame") |
| FlowMoveLevelsCard (compact) | **Keeps** — aside, calibration-locked. The ONLY FLOW-branded module on the page |
| QuickTakeCard | **Keeps** — aside; the sanctioned 2-minute secondary action |
| AnalyticsLabCard | **Keeps, single-mounted** (kill the breakpoint duplicate); `hasAccess=false` remains the upsell state |
| UpgradeSponsorCard | **Keeps** — free plan only |
| PausedLoop + InterviewCountdown + LatestInterview | **Merge** into one "Interviews" aside card (max 3 rows; renders nothing when empty) |
| EnrolledPlansCard | Slim progress row, enrolled users only |
| DisciplineExplorer | **Removed from dashboard.** `/explore/flow` owns FLOW education |
| AchievementsCard | **Deleted** (block + data fetch + ICON_MAP import) |
| FeaturedAutopsyCard | **Moves** to Library (featured slot) |
| HotChallengesCard | **Moves** to `/challenges` as a "Trending" rail |
| LeaderboardPeek + CommunityActivity | **Move** to `/progress` (fetches move with them — relocate, don't delete) |

Above the fold: hero (left ~60%) + FLOW compact and Quick Take (right ~40%). Target ≤8 modules for the busiest user, ~5 typical.

### 2.3 Explore → Library v2 — from 40+ CTAs to ~20

Sticky anchor tabs: **Plans · Guides · Autopsies · Domains · Companies**.

1. Compact hero, ONE CTA (continue enrolled plan / "Find your path")
2. **Study Plans first** (marquee section) — Product-75 pinned as "Program"; the other two study-plan entry points on the page are removed
3. Guides (4 + See all), Autopsies (4 + See all, adopts the featured slot), Domains (compact rows)
4. Company spotlight shrinks to a **chip row** → filtered `/challenges?company=X`, doubling as the door to `/interview-prep/[company]`
5. Quiet bottom **tag row** (FLOW moves + skills as chips → filtered practice), ending with the subtle link: *"New to these tags? How FLOW works →"* (`/explore/flow`)

Redundancy rule: each content type gets exactly one section and one See-all.

### 2.4 FLOW demotion spec

FLOW **survives** on: `/progress` (primary home), `/progress/skill-ladder`, the compact dashboard card, tag chips + filter facet on `/challenges`, the `/explore/flow` explainer, and one focus line in the dashboard hero. Chip treatment everywhere: tiny uppercase `FRAME` `LIST` `OPTIMIZE` `WIN`, outlined taupe, active state forest green — never a gradient, never a hero card.

FLOW is **removed** from: the dashboard DisciplineExplorer mount, Coach Spine hero branding blocks, Explore hero/path cards, and the `/frameworks` page (redirects to `/explore/flow`). The off-palette FLOW gradients (blue/teal/purple) die with the redesign. Marketing `/flow` stays untouched (SEO).

### 2.5 Route consolidation

| Change | Detail |
|---|---|
| `/simulation` → `/live-interviews` | Text simulation becomes a mode tab. `/simulation/[sessionId]` stays live for in-flight sessions |
| `/frameworks` → `/explore/flow` | Duplicate FLOW education |
| `/domains` → `/explore/domains` | More precise than the current `/explore` redirect |
| Marketing SEO trees | **Untouched** (`/autopsies/*`, `/study-plans/*`, `/flow`, `/companies/*`, `/claude-code-analytics`, blog). Optional, gated on SEO sign-off: 301 the `/autopsy` alias and canonicalize story URLs to the nested form |
| App-side rule | App components never link the marketing autopsy trees; `/explore/autopsies/*` is the in-app canonical |

### 2.6 Migration risks (for the implementation phase)

- **Calibration gating** (`LockOverlay`, `isCalibrated` branches in CoachSpine) and the first-run fallbacks must survive the hero merge
- **Plan gating**: preserve both `enabled` and `hasAccess` flags on AnalyticsLab (`hasAccess=false` = upsell, don't hide)
- **Tour anchors**: every moved/removed section needs a `data-tour-target` audit or the product tour breaks silently
- **In-flight sessions** (`/simulation/[sessionId]`, `/live-interviews/[id]`, paused loops) must never 404
- **`hatchContext` 1200ms soft-timeout** in the dashboard lead loader protects TTFB — keep it in the merged hero
- **Sequencing**: (1) nav + redirects, (2) Library restructure, (3) dashboard hero merge last (touches loaders + gating)

### 2.7 Design-system consolidation (prerequisite for whichever visual direction wins)

1. One token source: unify `globals.css` and `v3-landing.css` values (resolve the `--amber` mismatch in favor of `#c9933a`)
2. One `Card` primitive + `PageShell` + `SectionHeader`; migrate the 25 dashboard cards onto them
3. One radius scale, one type ramp; codemod the 997 `text-[Npx]` and arbitrary radii
4. Replace inline hex with tokens (the hero-forest family already exists for the dark cards)
5. One icon system (material-symbols, the de-facto standard); retire lucide + emoji
6. Canonicalize Hatch on `HatchGlyph`; consolidate PNG/Rive variants

---

*Companion doc: [`visual-directions.md`](./visual-directions.md) — the four visual directions with concept images and live HTML previews under [`previews/`](./previews/).*
