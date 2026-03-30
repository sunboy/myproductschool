# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint
npx shadcn@latest add <component>  # Add shadcn/ui components
```

## Dev Setup Notes

- **Supabase email confirmation**: For local dev, disable in Supabase dashboard → Authentication → Settings → "Enable email confirmations" → OFF. Without this, new signups won't get a session and will be stuck on the email confirm screen.
- **`NEXT_PUBLIC_APP_URL`**: Set to `http://localhost:3000` in `.env.local` for local dev — the submit route uses this to call internal APIs during grading.

## Reference Archive

- **Stitch v2 project**: https://stitch.withgoogle.com/projects/12072135267645366200 — **canonical design reference** for all screens.
- `_archived/` — previous codebase (indigo/dark design system). Do not modify.
- `stitch-screens/` — legacy Stitch-exported HTML screens. Superseded by the v2 Stitch project above.

### Canonical Stitch Screens (Overhaul series — 24 screens, project 12072135267645366200)

| Stitch Screen ID | Title | Next.js Route / File |
|---|---|---|
| `68778b9f57e24da8804a70148da56914` | Dashboard — Returning User | `src/app/(app)/dashboard/page.tsx` (`isCalibrated=true`) |
| `c6dde903c9d641269c9378b57f4a52d8` | Dashboard — No Calibration State | `src/app/(app)/dashboard/page.tsx` (`isCalibrated=false`) |
| `a240fbb846894d539a467a2ce25410ae` | Dashboard — Quick Take Hero | `src/app/(app)/dashboard/page.tsx` (Quick Take bento card) |
| `07c411ec97f644ce8c701b92643889cc` | Welcome — Onboarding | `src/app/(onboarding)/welcome/page.tsx` |
| `0a22f1d421854fb78a3278f75ab57bf1` | Onboarding — Role Select | `src/app/(onboarding)/role/page.tsx` |
| `91ae4dcd1c804d43baa6d71b5501b343` | Calibration — Challenge | `src/app/(onboarding)/calibration/frame/page.tsx` |
| `e525162901e54d92ac9fb79423934bcb` | Calibration — Results | `src/app/(onboarding)/results/page.tsx` |
| `b5c8a1b85b744ff3b34e6b01b2a07b84` | Explore Hub | `src/app/(app)/explore/page.tsx` |
| `d8ff8ac1508c49f89d08b0022a762e9f` | Practice Hub | `src/app/(app)/challenges/page.tsx` |
| `157890d0975a4eccbd9a54bf051d8b73` | Topic Detail | `src/app/(app)/domains/[slug]/page.tsx` |
| `2473324c072849c58ea6a7f3aa701dd1` | Study Plans Grid | `src/app/(app)/prep/study-plans/page.tsx` |
| `fb788270159b4241b81aa6fdba328c65` | Study Plan Detail | `src/app/(app)/prep/study-plans/[slug]/page.tsx` |
| `e27b0753c3e04f6982d2b408efa28151` | Prep Hub | `src/app/(app)/prep/page.tsx` |
| `931900bf0d9b4fc1ab014e929798c389` | Challenge Workspace — Guided Mode | `src/components/challenge/ChallengeWorkspace.tsx` (guided mode) |
| `1d429f7f30a744969c7b4590aa6d88b4` | Challenge Workspace — Freeform Mode | `src/components/challenge/ChallengeWorkspace.tsx` (freeform mode) |
| `2b2a0222adee445ea9343a0926b3e59c` | Grading Interstitial | `src/app/(workspace)/challenges/[id]/grading/page.tsx` |
| `e25aafa1956a41bca3911eb67e29b151` | Challenge Feedback | `src/app/(app)/challenges/[id]/feedback/page.tsx` |
| `4ef3267f6fcd49ae8da1d5291c0f4584` | Progress & Analytics | `src/app/(app)/progress/page.tsx` |
| `d838e20649dc44abbd5883e47e590a7e` | Skill Ladder | `src/app/(app)/progress/skill-ladder/page.tsx` |
| `b724c0423e5e45f5ab5281e90f33e04d` | Weekly Cohort Leaderboard | `src/app/(app)/cohort/page.tsx` |
| `ef42e52bf4c24614b6315ffb88aff85a` | Settings | `src/app/(app)/settings/page.tsx` |
| `aa9e904f90ac4bdbb5b399f3c6f60683` | Paywall Gate | `src/components/paywalls/ProPaywallGate.tsx` |
| `860565a797b74aeab2a8419b15412d8b` | Shareable Score Card | `src/app/(workspace)/challenges/[id]/share/page.tsx` |
| `6b27d3cac3984d3181812883626d4f3a` | Streak Recovery Modal | `src/components/modals/StreakRecoveryModal.tsx` |

To fetch a screen: `mcp__stitch__get_screen` with `name: "projects/12072135267645366200/screens/{screenId}"` then `WebFetch` the `downloadUrl`.

## Product Context

"HackProduct" is a working name. The platform serves two audiences:
1. **Engineers in PM interviews** — practicing product sense rounds
2. **Engineers on the job** — sharpening product thinking as a day-to-day skill

It's a practice gym for product thinking, not a course. Not exclusively for PM-track people.

**AI Coach "Luma"**: Non-human, non-gendered. Always use "it" — never "she/he". Write "Luma reviewed your answer" not "she reviewed."

**Luma mascot — `src/components/shell/LumaGlyph.tsx`**:
Luma is a friendly robot with a graduation cap and a growth arrow (top-right). It is rendered as an inline SVG component — NOT a generic glyph or emoji.

```tsx
import { LumaGlyph, LumaState } from '@/components/shell/LumaGlyph'

<LumaGlyph size={48} state="idle" className="text-primary" />
```

Available `state` values — always use the contextually correct one:
| State | When to use | Animation |
|---|---|---|
| `none` | Static, decorative (no animation) | None |
| `idle` | Dashboard greeting, nav brand, auth forms | Floating cap, blinking eyes, rising ZZZs |
| `listening` | Calibration steps, challenge workspace tips, anywhere Luma is reading user input | Headphones on, notepad, pulsing eyes |
| `reviewing` | Grading interstitial, diagnosis, anywhere Luma is processing | Scanning eyes, thought bubble, glow aura |
| `speaking` | Luma tips, coaching panels, simulation | Animated mouth |
| `celebrating` | Results page, high scores, feedback reveal | Sparkles, cap toss, wide smile |

**Do NOT** use the deprecated `animated` boolean prop — always use `state`. **Do NOT** replace LumaGlyph with a Material Symbol icon, emoji, or any other element. When in doubt about which state to use, `idle` is a safe default.

## Architecture

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with CSS variables. All styles inline via Tailwind — no separate CSS files
- **Components**: shadcn/ui with Lucide icons + Material Symbols Outlined icon font
- **Fonts**: Literata (headlines) + Nunito Sans (body/label) via `next/font/google`

## Design System — Material 3 + Terra

The active design language is **Material 3 with Terra theme**. All new screens and components must follow this system. Reference `stitch-screens/material-*.html` for the canonical implementation.

### Color tokens (Tailwind classes, defined in `globals.css` + `tailwind.config`)

| Role | Token | Value |
|------|-------|-------|
| Primary | `bg-primary` / `text-primary` | `#4a7c59` forest green |
| On Primary | `text-on-primary` | `#ffffff` |
| Primary Container | `bg-primary-container` | `#78a886` |
| On Primary Container | `text-on-primary-container` | `#d8f0de` |
| Secondary | `bg-secondary` | `#6b6358` |
| Secondary Container | `bg-secondary-container` | `#f0e8db` |
| On Secondary Container | `text-on-secondary-container` | `#5e5548` |
| Tertiary | `bg-tertiary` / `text-tertiary` | `#705c30` amber |
| Tertiary Container | `bg-tertiary-container` | `#c4a66a` |
| Background | `bg-background` | `#faf6f0` warm cream |
| On Background | `text-on-background` | `#2e3230` |
| Surface | `bg-surface` | `#faf6f0` |
| Surface Dim | `bg-surface-dim` | `#dbd7cf` |
| Surface Container Low | `bg-surface-container-low` | `#f5f1ea` |
| Surface Container | `bg-surface-container` | `#f0ece4` |
| Surface Container High | `bg-surface-container-high` | `#eae6de` |
| Surface Container Highest | `bg-surface-container-highest` | `#e4e0d8` |
| On Surface | `text-on-surface` | `#2e3230` |
| On Surface Variant | `text-on-surface-variant` | `#4a4e4a` |
| Outline | `border-outline` | `#74796e` |
| Outline Variant | `border-outline-variant` | `#c4c8bc` |
| Inverse Surface | `bg-inverse-surface` | `#2e3230` |
| Inverse On Surface | `text-inverse-on-surface` | `#f5f0e8` |
| Inverse Primary | `text-inverse-primary` | `#8ecf9e` |
| Error | `text-error` | `#b83230` |
| Primary Fixed | `bg-primary-fixed` | `#c8e8d0` |
| Surface Tint | `bg-surface-tint` | `#4a7c59` |

### Typography

- **`font-headline`** (Literata) — page titles, section headings, display text
- **`font-body`** (Nunito Sans) — body copy, default
- **`font-label`** (Nunito Sans) — labels, captions, UI chrome

### Icons

Use **Material Symbols Outlined** icon font (loaded via Google Fonts CDN in `layout.tsx`):
```html
<span class="material-symbols-outlined">home</span>
```
Set icon style via CSS: `font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`
Use filled variant (`'FILL' 1`) for active/selected states.

### Elevation & Shape

- Border radius: `rounded` (0.5rem) → `rounded-lg` (1rem) → `rounded-xl` (1.5rem) → `rounded-full`
- Elevation via tonal surface layering — use `surface-container-low/container/container-high/container-highest` to create depth
- Shadows: very soft only — `shadow-sm` at most. Never hard box shadows.
- Glass cards where appropriate: `bg-white/40 backdrop-blur-md border border-white/50`

### Component Patterns (from material-*.html screens)

- **Top App Bar**: `fixed h-16 bg-background border-b border-stone-200 shadow-sm` with Literata logo in primary green
- **Nav Rail** (desktop): left sidebar, `bg-surface-container-low`, icon + label items, active state uses `bg-primary-fixed` pill
- **Cards**: `bg-surface-container rounded-xl p-6`, no harsh borders, tonal separation for elevation
- **Primary Button**: `bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold`
- **Secondary Button**: `bg-secondary-container text-on-secondary-container rounded-full`
- **Chips/Badges**: `bg-secondary-container text-on-secondary-container rounded-full text-sm px-3 py-1`
- **Text gradient accent**: `bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent`

## Stitch → Next.js Replication Process

When building or fixing a screen to match a Stitch design, follow this exact process. **Do NOT use your own judgement to recreate screens — extract the HTML and convert it literally.**

### Step 1: Download the Stitch HTML
```bash
# Get the screen metadata (includes downloadUrl)
mcp__stitch__get_screen  projectId=12072135267645366200  screenId={SCREEN_ID}

# Download the full HTML
curl -sL "{downloadUrl}" -o /tmp/stitch-{screen-name}.html
```

### Step 2: Read the full HTML
Read `/tmp/stitch-{screen-name}.html` completely. Extract:
- **Exact layout**: How many panes? What's the split ratio (e.g., `w-2/5` + `flex-1`)? `flex-row` or `flex-col`?
- **Every section** in order, top to bottom, left to right
- **All text content** verbatim — headings, labels, body copy, badge text, placeholder text
- **All icon names** — the `material-symbols-outlined` icon text content (e.g., `search`, `bookmark`, `arrow_forward`)
- **All color classes** — map Stitch's Tailwind classes to our token classes
- **Grid structures** — `grid-cols-2`, `grid-cols-3`, gaps
- **Interactive states** — hover classes, active states, focus rings

### Step 3: Read the current Next.js file
Read the existing `.tsx` file to understand what state/logic exists.

### Step 4: Rewrite JSX to match Stitch exactly
- Copy the Stitch structure literally — same divs, same nesting, same order
- Replace Stitch's raw hex Tailwind config colors with our token classes (`bg-primary` not `bg-[#4a7c59]`)
- Keep all existing React state, hooks, event handlers, and imports
- The `(app)` layout already provides NavRail + TopBar — **do NOT duplicate** the sidebar nav or top header bar that Stitch shows as shared components
- The `(onboarding)` layout is minimal — check what it provides before adding shells

### Step 5: Verify
```bash
cd /Users/sandeep/Projects/myproductschool/.claude/worktrees/overhaul
npx tsc --noEmit 2>&1 | head -20
```

### Rules
- **NO creative interpretation** — if Stitch shows a 2-column split, build a 2-column split. If Stitch puts the textarea on the right pane, put it on the right pane.
- **NO raw hex in className** — use Tailwind token classes. Raw hex IS allowed in `style={{}}` for SVG strokes or non-token colors.
- **Copy ALL text** — every heading, every label, every badge, every placeholder. Don't paraphrase.
- **Copy ALL icons** — use the exact Material Symbols name from the Stitch HTML.
- **LumaGlyph** replaces Stitch's `<img>` Luma mascot images — use the appropriate `state` prop.

## Worktree Rules

When working inside a git worktree (e.g. `.claude/worktrees/overhaul`):

- **Edit files in the worktree only** — never touch files in the main repo (`/Users/sandeep/Projects/myproductschool/src/...`). All edits must target the worktree path.
- **Dev server must serve the worktree** — the Next.js dev server must be started from the worktree directory so hot reload picks up changes. If `node_modules` is missing, symlink it first:
  ```bash
  ln -s /Users/sandeep/Projects/myproductschool/node_modules \
    /Users/sandeep/Projects/myproductschool/.claude/worktrees/overhaul/node_modules
  ```
  Then start the server:
  ```bash
  cd /Users/sandeep/Projects/myproductschool/.claude/worktrees/overhaul
  npm run dev
  ```
- **Verify the running server** — confirm `ps aux | grep "next dev"` shows the process rooted in the worktree path, not the main repo.

## Reviewer Personas

When asked to do a review (e.g. in a ralph-loop or any feedback pass), always use these 5 expert founder personas. Each brings a distinct lens validated against the product spec.

| Persona | Company | Lens | Signature concern |
|---|---|---|---|
| **Wes Kao** | Maven | Social & cohort learning | Is it social? Are there cohort challenges, shared progress, community proof? |
| **Sebastian Thrun** | Udacity | Credentials & outcomes | Does practice produce proof? Is there a shareable credential or badge at the end? |
| **Zhang Yiming** | TikTok | Algorithmic content serving | Is content surfaced by algorithm or buried in menus? Should feel like a feed, not a bookshelf. |
| **Luis von Ahn** | Duolingo | Engagement & gamification | XP, leagues, streaks, levels — is the engagement wrapper A-grade or C-grade? |
| **Raph Koster** | Game design | Game feel & narrative | Does practice feel like a game? Is grading animated? Are there narrative arcs and progression stories? |

### How to apply
Each persona should give:
- **3 things working well** (specific, with file/component references where relevant)
- **Up to 3 action items** (concrete: file, element, what to change)

Items that require a real human to moderate (live cohorts, live interviews, legal pages) go in `HUMAN_MODERATION.md`, not as action items.

## Key Conventions

- `@/*` path alias maps to `./src/*`
- Use Tailwind token classes — never raw hex values in JSX className
- Stitch v2 project ID: `12072135267645366200` (canonical design reference)
- See "Canonical Stitch Screens" table above for all 24 screen IDs and their file paths

---

## Reviewer Personas

When asked to collect feedback or run a review, embody each of these personas in turn and give their honest, specific critique of the design, user journeys, and product decisions. Each reviewer speaks in first person, from their own founder/operator lens.

### 1. Sebastian Thrun — Co-founder, Udacity
**Background**: Built the world's first MOOC platform. Deep expertise in online learning, learner motivation, skill credentialing, and ed-tech monetization. Believes learning must be outcome-driven and tied to career advancement.

**Lens**: Learner activation and retention. Does the onboarding hook people fast enough? Is skill progression visible and motivating? Are credentials meaningful and shareable? Is the content ladder clear — do users know what to do next?

**Tone**: Precise, research-backed. Pushes on completion rates, time-to-value, and outcome clarity. Will call out anything that feels like "content for content's sake" with no career signal.

---

### 2. Shou Zi Chew — CEO, TikTok (formerly CFO/exec)
**Background**: Scaled TikTok to 1B+ users. Expert in engagement loops, feed algorithms, short-form habit formation, viral content mechanics, and growth at scale. Thinks in DAU, session length, and D7/D30 retention.

**Lens**: Engagement and habit formation. Is there a daily hook? Does the product create a "just one more" loop? Is the core action (doing a challenge) fast enough to fit into a spare 5 minutes? Is social/community mechanics driving return visits?

**Tone**: Direct, numbers-first. Will flag anything with friction in the core loop. Pushes hard on why a user would open the app tomorrow, not just today.

---

### 3. Gagan Biyani — Co-founder, Maven (also Udemy)
**Background**: Co-founded Udemy and Maven. Expert in cohort-based learning, live social learning, instructor economics, and premium B2C/B2B ed-tech. Believes the future of learning is live, cohort-driven, and community-anchored.

**Lens**: Community and cohort mechanics. Is the social layer real or decorative? Do users feel accountable to others? Is the cohort/discussion feature creating genuine connection or just a comment box? Is there a path to B2B / team sales?

**Tone**: Candid, product-intuition-heavy. Will push on whether the community features are "table stakes box-checking" or genuinely differentiated. Skeptical of async-only learning.

---

### How to run a review session

When the user says "run a review" or "get feedback from the reviewers":
1. Pick the relevant screen(s) or user journey being reviewed
2. Speak as each reviewer in turn — give 3–5 specific, actionable observations per persona
3. End with a prioritized list of the top 3 changes that all three would agree on

---

## Agent Team Configuration

Use this pattern for any significant build task (3+ files, multiple concerns):

### Structure
- **Opus** — orchestrator only. Reads the plan, validates proof, approves or rejects. Never writes code.
- **Sonnet** — developers. One agent per task. Must send proof to Opus and wait for explicit "APPROVED" before marking task complete.
- **One task per developer** — never assign multiple tasks to one dev agent.

### Workflow
1. Create a team: `TeamCreate { team_name, description }`
2. Create all tasks with `TaskCreate`, set `addBlockedBy` dependencies
3. Spawn Opus first with full plan context and validation criteria
4. Spawn wave 1 Sonnet devs (unblocked tasks) in a single message (parallel)
5. As waves complete and Opus approves, spawn next wave devs
6. Spawn final build-validator dev last (blocked on all others)
7. Shut down each agent with `SendMessage shutdown_request` after their task is approved
8. `TeamDelete` when all agents are terminated

### Proof requirements (Opus enforces these before approving)
- `npx tsc --noEmit` output — must be clean (pre-existing Deno errors in `supabase/functions/` are acceptable)
- List of files created/modified
- For UI tasks: brief description of what renders
- No raw hex in `className` strings
- Correct `'use server'` / `'use client'` directives

### Example spawn message to a dev agent
> "You are devN on the [team] team. You have ONE task: [Task #N — Title]. Working dir: [...]. Read [...] first. Implement [...]. After implementing: run tsc, send full output to opus saying 'Task N proof: [output]'. Wait for APPROVED from opus before marking task completed."
