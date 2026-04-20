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

## Reference Archive

- **Stitch v2 project**: https://stitch.withgoogle.com/projects/12072135267645366200 — **canonical design reference** for all screens. This supersedes the old `material-*.html` files.
- `_archived/` — previous codebase (indigo/dark design system). Do not modify.
- `stitch-screens/` — legacy Stitch-exported HTML screens. Superseded by the v2 Stitch project above.

### Canonical Stitch Screens (Overhaul series — 24 screens, project 12072135267645366200)

These are the 24 frozen "Overhaul:" screens that define the v2 UI. Always fetch from Stitch when making pixel-accurate changes.

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

To fetch a screen's HTML for reference: use `mcp__stitch__get_screen` with `name: "projects/12072135267645366200/screens/{screenId}"` then `WebFetch` the `downloadUrl`.

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
- **Exact layout**: How many panes? What's the split ratio? `flex-row` or `flex-col`?
- **Every section** in order, top to bottom, left to right
- **All text content** verbatim
- **All icon names** (material-symbols-outlined)
- **All color classes** — map to our token classes
- **Grid structures** — cols, gaps
- **Interactive states** — hover, active, focus

### Step 3: Read the current Next.js file
Read the existing `.tsx` to understand what state/logic exists.

### Step 4: Rewrite JSX to match Stitch exactly
- Copy the Stitch structure literally — same divs, same nesting, same order
- Replace Stitch's raw hex colors with our token classes (`bg-primary` not `bg-[#4a7c59]`)
- Keep all existing React state, hooks, event handlers
- The `(app)` layout already provides NavRail + TopBar — **do NOT duplicate** shared shells
- The `(onboarding)` layout is minimal — check what it provides

### Step 5: Verify
```bash
npx tsc --noEmit 2>&1 | head -20
```

### Rules
- **NO creative interpretation** — match Stitch layout exactly
- **NO raw hex in className** — use Tailwind tokens. Raw hex OK in `style={{}}` for SVG
- **Copy ALL text** — every heading, label, badge, placeholder verbatim
- **Copy ALL icons** — exact Material Symbols name from Stitch
- **LumaGlyph** replaces Stitch's `<img>` mascot images — use the right `state` prop

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

## API Routes

Full API inventory: see [`API_DOCS.md`](./API_DOCS.md) at the repo root.

### Calibration flow (key onboarding path)
1. `POST /api/onboarding/role` — saves `profiles.preferred_role`
2. `POST /api/onboarding/calibration/submit` — seeds `calibration_attempts` (status=grading), `move_levels` (4 FLOW moves at level 1), `learner_competencies` (6 axes at score 50)
3. `GET /api/onboarding/results` — reads `calibration_attempts.scores_json` + `profiles.archetype` + `move_levels`
4. `POST /api/onboarding/complete` — sets `profiles.onboarding_completed_at`

### Mock mode
Set `NEXT_PUBLIC_MOCK_MODE=true` to bypass auth and DB on onboarding routes. Results route returns hardcoded archetype + scores. Many routes also check `USE_MOCK_DATA=true` for challenge and simulation flows.

## Content Authoring Pipeline

Full architecture: [`docs/notes/content-authoring-architecture.md`](./docs/notes/content-authoring-architecture.md). Operator runbook: [`docs/notes/content-generation-runbook.md`](./docs/notes/content-generation-runbook.md).

**What it does:** turns a URL, article, or question into a 4-step FLOW challenge (Frame / List / Optimize / Win) with 1-3 MCQ questions per step, 4 options each (one of each quality), taxonomy tags, and deterministic validation. Two pipelines with identical shape: local mode (`scripts/job-server.ts` using the `claude` CLI subprocess) and API mode (`src/lib/content/generator.ts` using Anthropic SDK).

**Audience:** engineers first (tech lead, staff engineer, founding engineer, EM, SWE). PMs secondary. Taxonomy biases toward engineering roles. Copy never uses second-person role framing — no "you are a tech lead", no "as a senior engineer". Role is metadata, not copy.

**Grounding is the core idea.** Every MCQ generation call receives a grounding pack: per-question `focus`, source `excerpts` filtered by step topic, real `data_points`, extracted `insights`, the `engineer_standout` angle, and `siblingFocuses` from other questions in the step to prevent overlap. The BEST option must reference a source-specific element (named entity, metric, or listed insight), or it does not qualify as BEST.

**Open-ended prompts** (short questions like "how do you improve ChatGPT") run an expansion step that picks a concrete angle and writes source-like material, then a verifier step that strips fabricated claims before the main pipeline runs. Unsalvageable sources fail the job.

**Voice rules** (enforced by prompts and validator warnings):
- No second-person role framing in user-facing copy
- No em dashes
- No AI slop ("delve", "leverage", "utilize", "holistic", "robust", "seamlessly", "in order to", "as well as")
- Explanations read like insight, not instruction
- Best option is genuinely better in reasoning, not longer

**Validator** runs after generation: hard errors (structural) block publish; warnings (grounding miss, sibling overlap, role-framing match) surface to the reviewer.

**Admin UI:** `/admin/content` lists all jobs with View / Review / Tags / Delete actions. Review page has inline editing and step approvals. Tag editor for published challenges at `/admin/content/challenges/{id}`.

**Bulk ingest** from a Notion "Challenge Pipeline" database: `scripts/bulk-ingest.ts`. Reads rows where `Status=Queued`, submits jobs, updates Notion with `Job ID` and `Status=Generating`.

## Writing Style

Canonical guide: [`docs/notes/writing-style-guide.md`](./docs/notes/writing-style-guide.md). Every user-facing word the platform produces follows this. All five HackProduct skills (`backend_planning/hackproduct-v2-bundle/skills/*/SKILL.md`) inherit from it.

**Register:** Shreyas Doshi in a tweet thread, or an opinionated staff engineer thinking out loud. Direct. Confident. Slightly opinionated. Academic is wrong. Corporate is worse.

**Hard rules (enforced by the content validator):**
- **No second-person role framing.** No "you are a tech lead", "as a senior engineer", "imagine you work at". Drop into the situation. Role is metadata, not copy.
- **No em dashes.** Use a comma, a period, or restructure. Hard ban.
- **No AI slop.** Never: *delve, leverage, utilize, holistic, robust, seamlessly, it's worth noting, in order to, as well as, embark on, navigate, unlock, landscape, tapestry, ensure, tailored, cutting-edge, revolutionary, game-changing*.
- **Coherent sentences, not fragments.** Full flowing sentences that connect. Fragment-style ("Four moves. Real problem is upstream.") reads like a speech, not writing. Exception: UI chrome (buttons, labels, status).

**Applies to:** challenge scenarios/questions/options/nudges, grading explanations, Luma coaching, learn chapter bodies, competency labels, push notifications, emails, and any admin UI copy that appears alongside user-facing content.

**Does NOT apply to:** code comments, migration SQL, developer-facing error messages, internal reference docs.

**Quick check before shipping generated text:** Does a sentence exist only to sound thorough? Cut it. Does a word appear in the AI-slop list? Replace it. Does the scenario open with "you are" or "as a"? Rewrite it into the situation.

## Key Conventions

- `@/*` path alias maps to `./src/*`
- Use Tailwind token classes — never raw hex values in JSX className
- Stitch v2 project ID: `12072135267645366200` (canonical design reference)
- See "Canonical Stitch Screens" table above for all 24 screen IDs and their file paths
- **Reuse core components** — always import and use existing components (`FlowStepper`, `OptionCard`, `LumaInsightBlock`, `LumaGlyph`, etc.) rather than rebuilding them inline. Only create new components when explicitly asked or when no suitable component exists.
