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

- `_archived/` — previous codebase (indigo/dark design system). Do not modify.
- `stitch-screens/` — Stitch-exported HTML screens. Source of truth for layout/visual intent. `material-*.html` files are the canonical design language reference.

## Product Context

"HackProduct" is a working name. The platform serves two audiences:
1. **Engineers in PM interviews** — practicing product sense rounds
2. **Engineers on the job** — sharpening product thinking as a day-to-day skill

It's a practice gym for product thinking, not a course. Not exclusively for PM-track people.

**AI Coach "Luma"**: Non-human, non-gendered. Always use "it" — never "she/he". Write "Luma reviewed your answer" not "she reviewed." Luma's visual identity is an abstract geometric glow symbol (diamond + concentric rings), not a face or robot.

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
