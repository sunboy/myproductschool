# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint (next/core-web-vitals + typescript)
npx shadcn@latest add <component>  # Add shadcn/ui components
```

## Product Context

MyProductSchool (myproductschool.com) is a product sense training platform for software engineers preparing for PM interviews. It's a practice gym, not a course.

**AI Coach "Luma"**: Non-human, non-gendered. Always use "it" — never "she/he". Write "Luma reviewed your answer" not "she reviewed." Luma's visual identity is an abstract geometric glow symbol (diamond + concentric rings), not a face or robot.

## Architecture

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with CSS variables for theming. All styles inline via Tailwind — no separate CSS files
- **Components**: shadcn/ui (base-nova style) with Lucide icons. Config in `components.json`
- **Fonts**: Clash Display (headings) + Satoshi (body) via Fontshare CDN, loaded in `layout.tsx`
- **Dark mode**: Class-based (`.dark` on `<html>`), resolved before paint via inline script in `layout.tsx`. Both light and dark token sets defined in `globals.css`

## Design System

Color tokens defined as CSS custom properties in `src/app/globals.css`:
- `--primary`: Indigo (#4338CA light / #818CF8 dark)
- `--pro-gold`: Amber — reserved for paid/pro features
- `--success`, `--warning`, `--danger`: Semantic status colors
- Use Tailwind classes like `bg-primary`, `text-muted-foreground` — not raw hex values

Typography applied via inline `style={{ fontFamily: "'Clash Display', sans-serif" }}` for headings and `'Satoshi', sans-serif` for body text.

Custom animations in `globals.css`: `animate-fade-in-up` (staggered reveals), `animate-luma-glow` (Luma symbol). All respect `prefers-reduced-motion`.

## Key Conventions

- A/B headline variants controlled via `variant` prop on page components
- The waitlist form currently uses simulated API calls — marked with `// Simulate` comments for replacement with Supabase
- `@/*` path alias maps to `./src/*`
- shadcn/ui components live in `src/components/ui/`, custom components go in `src/components/`
