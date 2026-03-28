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

## Key Conventions

- `@/*` path alias maps to `./src/*`
- Use Tailwind token classes — never raw hex values in JSX
- Generous spacing, large touch targets — design feels breathable
- Stitch project ID: `8824654605376882712` (source of truth for screen designs)
- Material screens in `stitch-screens/material-*.html` are the canonical reference for new work
