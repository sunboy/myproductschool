# Funnel Conversion Build — Remaining Plan Items (grounded 2026-07-01)

Base: worktree `funnel-conversion` off `origin/main` (b03d550f, includes the completion fix).
All 5 workstreams scouted against real current code. Scope decisions below reflect what actually exists.

## A. Upgrade moment → make `checkout_started` fire (HIGHEST leverage)

**Root finding:** `checkout_started` is only fired from the marketing pricing page (`PricingClient.tsx:245`). The in-app **PaywallModal** — the dominant upgrade surface — fires NOTHING in `handleUpgrade()` (`PaywallModal.tsx:198-220`). That's why the metric reads ~0.

- A1. Fire `trackEvent(EVENT_CHECKOUT_STARTED, { plan })` in `PaywallModal.handleUpgrade()` before the fetch. (imports from `@/lib/posthog/client` + `@/lib/posthog/events`)
- A2. New `DebriefUpgradeCard.tsx` on the interview debrief page (`live-interviews/[id]/debrief/page.tsx`), gated `plan !== 'pro'`. Personalized copy from `debrief.overallScore`/`grade`/`competencySignals`. CTA → existing `/pricing?plan=monthly&checkout=1` deeplink (already wired, auto-fires checkout_started). Needs a plan lookup added to the page (none today).
- **Descoped:** the fake `founding_member` Stripe tier. No such price exists; marketing copy references it but it's unbacked. A promo is config not code (create-promo.ts). Reuse `monthly`.
- `?checkout=1` deeplink ALREADY EXISTS (`PricingClient.tsx:186-209`) — no work.

## B. `/quiz/archetype` — public archetype quiz (top-of-funnel)

**Scope: STATELESS claim variant (no DB migration).** `deriveArchetype` is NOT in archetypes.ts — it's private in the calibration submit route and must be extracted.

- B1. Extract `ARCHETYPES` + `deriveArchetype()` + `scoreMove()`/`TIER_CAPS` → new pure `src/lib/calibration/deriveArchetype.ts` (imports existing `QUESTIONS` from `questions.ts`, `ARCHETYPE_OBSERVATIONS` from `archetypes.ts`). Refactor the calibration route to import from it (no behavior change).
- B2. `src/app/(marketing)/quiz/archetype/page.tsx` — `V3PageShell` + new lightweight client quiz (4 scenario questions from `questions.ts`, no role/context pre-screens). Computes archetype CLIENT-SIDE (pure fn). Result screen → share + `/signup?archetype=<slug>&redirectTo=/dashboard`.
- B3. `.../quiz/archetype/opengraph-image.tsx` — dynamic OG per archetype via `?a=<slug>` (next/og ImageResponse, palette from workspace share OG). Since stateless, OG reads archetype from a query param, not a DB row.
- B4. `src/lib/routes/public.ts` — add `/quiz` to `MARKETING_ROUTES` (1 line).
- B5. Claim-on-signup (stateless): signup route reads `?archetype=` → writes archetype to profile on first post-signup load. Lightweight; no table.

## C. Campaign-page cluster (volume, low effort) — SMALLEST slice first

- C1. Extend `OUTCOME_PAGES` (role-transition/uplevel) data + thin route, CTA → `/quiz/archetype`. Reuse `OutcomePage`/`V3PageHero`/`V3Section`/`V3Card`/`V3CtaBand`. (Ship 1-2 exemplar pages, not all 4 clusters — prove the pattern.)

## D. Email activation drip — NO migration, NO new vercel cron

Audience = `profiles.created_at` in window MINUS any `challenge_attempts`/`live_interview_sessions` row (no `activated` column exists; absence = not activated).

- D1. Add `activation_day1/3/7` template kinds + senders in `transactional.ts` (Lifecycle section). Dedupe `activation_dayN:${userId}`.
- D2. New `src/app/api/cron/activation-drip/route.ts` — copy `resume-challenge/route.ts` shape (auth, fan-out fetch, skip logic, send+log). Gate on `notification_prefs.lifecycle !== false`, reuse `createUnsubscribeToken({preference:'lifecycle'})`.
- D3. Add `/api/cron/activation-drip` to `daily-maintenance` `DAILY_CRON_PATHS` (avoids Hobby cron limit).

## E. Sentry HACKPRODUCT-G hydration crash (paid-traffic first-paint)

**Root cause:** `useSearchParams()` in `PostHogProvider` (`PostHogProvider.tsx:24-39`) on the statically-prerendered `/`. Paid clicks land with a query string that didn't exist at build → hydration mismatch. Uniquely explains ad-traffic-only crash.

- E1. `PostHogProvider.tsx` — replace `useSearchParams()` with a post-hydration `useEffect` reading `window.location.search`. Keep `/` static. NO blanket suppressHydrationWarning.
- E2. (defensive) Harden `useReducedMotion()` init in `V3HatchReveal.tsx` + `V3LiveInterviewSection.tsx` — init to `false`, apply media value in `useEffect`.

## Verification (every workstream)
- `tsc --noEmit` clean (no NEW errors; lint/audit already pre-existing red on main).
- A: E2E that opening PaywallModal fires `checkout_started`; debrief card renders for free users only.
- B: unauth E2E reaches quiz result with no signup; OG renders; public route works.
- D: dry-run the cron against a seeded not-activated user; assert send + dedupe + lifecycle opt-out respected.
- E: Playwright-load `/?gad_source=5&gclid=TEST` → assert zero hydration console errors.
- Codex review of anything touching money (A) before merge.
