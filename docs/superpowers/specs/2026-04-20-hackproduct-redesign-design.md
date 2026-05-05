# HackProduct Redesign — Design Spec
**Date:** 2026-04-20  
**Source:** HackProduct-handoff.zip (Claude Design artifact)

---

## Context

The user created a full UI redesign prototype in Claude Design and exported a handoff bundle. The prototype (`HackProduct.html` + supporting JSX/CSS) defines a refined version of the existing Material 3 Terra design system. The goal is to implement this new design language across all app pages in the Next.js codebase.

**What changed vs. current app:**
1. **Navigation shell** — replaces vertical NavRail + TopBar with a horizontal top nav containing pill-style nav items
2. **Background grain texture** — subtle paper grain overlay using SVG noise filter (currently absent)
3. **Floating Luma button** — persistent "Ask Luma" floating action in bottom-right corner
4. **Hero section** — richer dark-green gradient card with stat strip, dot-grid pattern, and ambient glow
5. **Home layout** — 2-column grid (main + 340px right rail) vs. current single-column
6. **FLOW Move Levels widget** — 4-card horizontal grid with tinted backgrounds
7. **Challenge Workspace** — full-bleed two-pane layout (resizable left context / right MCQ) with FLOW stage tabs

Color tokens, typography (Literata + Nunito Sans), and overall color palette are **already aligned** — no changes needed to `globals.css` color variables. Minor additions needed for new CSS utilities.

---

## Design System Additions (from handoff styles.css)

### New CSS variables to add to globals.css
```css
--outline-faint: #e7dfc9;          /* softer border for cards */
--on-surface-muted: #78715f;       /* muted text, currently missing */
--amber: #c9933a;                   /* amber accent */
--amber-soft: #f3e2b9;             /* amber container */
--ai-assisted-soft: #e1ecff;
--ai-native-soft: #fbe1d0;
--agentic-soft: #ecdeff;
--traditional-soft: #dfe7e1;
--radius-xs: 8px; --radius-sm: 12px; --radius-md: 18px;
--radius-xl: 32px;
--tr-fast: 120ms cubic-bezier(.2,.8,.2,1);
--tr: 200ms cubic-bezier(.2,.8,.2,1);
```

### Grain texture overlay
Add to `globals.css` on `body::before`:
```css
body::before {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1;
  opacity: 0.35;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.35 0 0 0 0 0.25 0 0 0 0.04 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
```

### Radial background gradients
Add to `body`:
```css
background-image:
  radial-gradient(1200px 600px at 15% -10%, rgba(74,124,89,0.06), transparent 60%),
  radial-gradient(1000px 500px at 110% 10%, rgba(201,147,58,0.06), transparent 60%);
```

---

## Architecture

### Shell Redesign (Critical)

**New TopNav** — horizontal bar replacing NavRail + TopBar:
- Height: 56px, sticky, `bg-surface/90` + `backdrop-blur-md`
- Left: LogoMark (square icon) + "HackProduct" wordmark in Literata
- Center: Nav pill items — Home, Explore, Practice, Workspace, Interviews, Progress
  - Active: `bg-primary-container text-on-primary-container` pill with icon + label
  - Inactive: icon-only on desktop (label on hover), `text-on-surface-variant`
- Right: GoalRing progress circle + streak badge + XP badge + avatar
- Mobile: Collapse to hamburger or keep bottom tabs

**Remove:** `NavRail.tsx`, `BottomTabs.tsx` (or keep BottomTabs as mobile-only fallback)

**New FloatingLuma** — fixed bottom-right:
- 64×64px rounded button, dark green gradient
- Opens a 340px Luma chat panel
- Screen-contextual greeting line
- `LumaGlyph` with `state="idle"` / `state="speaking"`

---

## Pages to Implement

### 1. Home/Dashboard (`dashboard/page.tsx`)

**Layout:** 2-column grid — `1fr 340px` gap-7 on ≥1280px, single column below

**Main column (left):**
- **HeroGreeter card** — dark green gradient (`#3e6a4b → #264a34`), `rounded-3xl`, min-h 200px
  - "Luma · Your coach" badge (pill, white/8% bg, pulsing green dot)
  - Literata h1: "Good [time], [Name]."
  - Rotating coach line (every 5s, fade-up animation)
  - CTA buttons: "Start today's session" (cream bg) + "Open study plan" (ghost)
  - Floating LumaGlyph `size=96 state="idle"` with anim-float, hover → cheering
  - Stat strip (4 cols): Streak / XP today / Next milestone / Due this week
- **Resume + QuickTake row:** `grid-cols-[1.25fr_1fr] gap-5`
  - ResumeCard: surface card, challenge title, progress bar, LumaCoachCard inline, Continue CTA
  - QuickTakeCard: dark green gradient card, 60-second prompt, Start CTA
- **FLOW Move Levels:** 4-card horizontal grid, tinted backgrounds per move
- **Trending + Leaderboard:** 2-col grid

**Right rail (340px):**
- TodaysPath (today's challenge sequence)
- AchievementsCard
- StreakCalendar

---

### 2. Practice Hub (`challenges/page.tsx`)

**Layout:** Max-width content, search bar, filter chips, challenge card grid

**Key design elements from handoff:**
- Role filter tabs (All / PM / Eng / Designer / Founder)
- Search input with filter icon
- `ChallengeCard` with paradigm tag (AI-Native, AI-Assisted, Agentic, Traditional) in tinted chips
- Featured card: larger, with `featured` badge
- Difficulty chip + solver count + comment count

---

### 3. Explore (`explore/page.tsx`)

**Layout:** Left-weighted 2-col (`1fr 320px`) — plan content + sidebar

**Key design elements from handoff:**
- Collapsible module sections with done/total progress indicators
- LumaCoachCard with personalized message at top
- Study plan sidebar with cohort avatar stack
- Challenge items: type chip + title + XP badge + done checkmark

---

### 4. Challenge Workspace (`ChallengeWorkspace.tsx`)

**Layout:** Full-bleed, no main content padding

**Two-pane resizable split:**
- Left pane (default 50%): Context panel with tab bar (Description / Editorial / Discussions / Submissions)
  - FLOW stage progress pills at top
  - Drag handle divider (mouse-drag to resize)
- Right pane: MCQ question + confidence selector + freeform textarea + Luma hint
  - Bottom bar: confidence dock (Developing / Solid / Strong / Expert)
  - Submit button

**FLOW stage tabs:** Frame / List / Optimize / Win — horizontal pill row, active has primary container fill

---

### 5. Progress (`progress/page.tsx`)

**Layout from handoff OtherScreens:**
- Radar chart for FLOW skills (Frame/List/Optimize/Win)
- Stats strip: challenges completed, avg score, current streak, rank
- Recent activity feed (completed / started / earned)
- Luma coaching reflection card

---

### 6. Interviews (`live-interviews/page.tsx`)

**Layout from handoff OtherScreens:**
- Persona grid for mock interviews
- Quick-start CTA with Luma
- Past interviews table with scores

---

## Implementation Approach

### Worktree
Create a new git worktree from `dev` branch: `git worktree add .worktrees/redesign redesign/hackproduct-design`

### Agent Team (per CLAUDE.md pattern)
- **Opus** — orchestrator: validates TSC clean, no raw hex in classNames, correct Luma states
- **Sonnet devs** — one per task group:
  1. Dev1: CSS additions (globals.css) + new TopNav shell component
  2. Dev2: FloatingLuma component + Home/Dashboard page
  3. Dev3: Practice Hub page + ChallengeCard component
  4. Dev4: Explore page
  5. Dev5: Challenge Workspace (two-pane)
  6. Dev6: Progress + Interviews pages
  7. Dev7 (build validator): TSC clean check + Playwright screenshots

### File Map

| Task | Files |
|---|---|
| CSS + Shell | `src/app/globals.css`, `src/components/shell/TopNav.tsx` (new), `src/app/(app)/layout.tsx` |
| FloatingLuma | `src/components/shell/FloatingLuma.tsx` (new) |
| Dashboard | `src/app/(app)/dashboard/page.tsx`, subcomponents |
| Practice | `src/app/(app)/challenges/page.tsx`, `ChallengeCard.tsx` |
| Explore | `src/app/(app)/explore/page.tsx` |
| Workspace | `src/components/challenge/ChallengeWorkspace.tsx` |
| Progress | `src/app/(app)/progress/page.tsx` |
| Interviews | `src/app/(app)/live-interviews/page.tsx` |

---

## Verification

1. `npx tsc --noEmit` — clean (pre-existing Deno errors in supabase/functions/ are acceptable)
2. No raw hex in className strings — use Tailwind tokens
3. Playwright screenshots of: Home, Practice, Explore, Workspace, Progress
4. Dev server loads without runtime errors
5. Luma floating button visible on all pages
6. TopNav active state highlights correct route

---

## Key Rules (from handoff README)

- Match visual output exactly — recreate in React/Tailwind, don't copy prototype internals
- Replace prototype's raw hex with our Tailwind token classes
- LumaGlyph replaces Luma SVG component — use correct `state` prop
- No creative interpretation — match Stitch layout
