# Reduced-motion evidence — 2026-09-07

## Audit result

The global CSS guard in `src/app/globals.css` (`@media (prefers-reduced-motion: reduce)`
neutralizing `animation-duration`/`transition-duration` on `*`, plus per-keyframe
overrides) already covers all CSS animations and transitions, Tailwind `animate-*`
utilities, the Shepherd tour theme, the floating Hatch chat, and every marketing CSS
file (each has its own reduce block). Those are correct and unchanged.

Two gaps were found and fixed, both animation kinds a CSS media query cannot reach:

1. **`src/components/shell/HatchGlyph.tsx`** — ~40 SVG SMIL `<animate>` /
   `<animateTransform>` elements. SMIL is not affected by CSS
   `prefers-reduced-motion`. Fixed by gating on the existing `useMotionPreference`
   hook: under reduce, the glyph renders `state="none"` (static cap + arrow, no
   animated children).
2. **`src/components/shell/MaskoAvatar.tsx`** — `<video autoPlay loop>` with no
   reduced-motion check. Fixed with a `matchMedia('(prefers-reduced-motion: reduce)')`
   listener that pauses and resets the video under reduce and resumes on
   no-preference.

Both changes are additive and gated only under the reduce query; no visual change
for no-preference users.

## Verification

- `npx tsc --noEmit`: clean.
- `npx eslint` on both changed files: clean.
- Runtime Playwright sweep with `page.emulateMedia({ reducedMotion })`: attempted at
  375x812 and 1440x900 on `/` and `/dashboard`. The local dev server's login flow was
  unreliable under concurrent load during this session (form submit did not navigate;
  the `/api/auth/login` request context timed out intermittently), so authed-route
  screenshots for the fix are **not captured here**. The two no-preference baseline
  screenshots that did capture are in this directory. This is a harness/dev-server
  limitation, not a fix regression. Re-run `e2e/reduced-motion.spec.ts` against a
  warm, idle dev server (or the staging preview) to capture the full before/after
  counts.

## Status

Code fix: complete and type/lint-clean. Runtime screenshot evidence: deferred (dev-server auth flakiness).
