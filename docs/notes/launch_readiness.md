# Launch Readiness

Last updated: May 6, 2026

This document records the work completed during the long launch-readiness pass on `dev`. It is a factual changelog of what was finished, what was verified, and what still blocks production sign-off.

## What Was Accomplished

### Launch gates and verification

- Added an aggregate `npm test` gate that runs the launch-focused Node and Vitest unit suites.
- Added a read-only `npm run launch:preflight` script for production readiness checks.
- Tightened `launch:preflight` so it fails public launch routes that silently land on `/login` or another wrong final path.
- Updated the launch sign-off checklist so the preflight command is part of the required gate set.
- Verified:
  - `npm test`
  - `npx tsc --noEmit --pretty false`
  - `npm run lint`
  - `npm run secrets:scan`
  - `git diff --check`
  - `npm audit --omit=dev`
  - local `launch:preflight` in skip-network mode
  - live `launch:preflight` against `https://hackproduct.com`

### Production-domain audit

- Confirmed the live production domain is still serving an older mixed deployment.
- Recorded that the public pages are still mismatched in production:
  - `/` serves legacy `Luma` copy
  - `/privacy`, `/terms`, `/help`, and `/changelog` resolve to `/login`
  - `/api/health` returns `404`
  - `/manifest.json` returns login HTML instead of JSON
  - CSP is missing on the live domain
- Updated the production domain audit and owner handoff so the deployment blocker is explicit.

### Dashboard and UI parity

- Ran local visual smokes for `/dashboard` and `/challenges` on production-style local servers.
- Confirmed the current dashboard structure remains intact in local smoke testing.
- Confirmed mobile `/challenges` does not overflow at 375px and the Hatch overlay sits above the bottom nav.
- Captured screenshots for manual review during the smoke pass.

### Paywall work

- Verified paywall scenarios end to end.
- Confirmed the paywall unit coverage passes.
- Kept the subscription flow tied to existing Stripe prices and checkout behavior.
- Confirmed user-triggered AI grading paths now reserve plan usage and AI spend budget before model calls.

### Affiliate work

- Kept affiliates disabled by default unless `NEXT_PUBLIC_ENABLE_AFFILIATES=true`.
- Confirmed affiliate signup, referral attribution, checkout discounting, webhook commissions, and payout cron are all gated off when affiliates are not enabled.
- Verified the affiliate signup flow uses Stripe Connect plus shared promotion codes.
- Created the launch coupon and promo-code setup needed for the affiliate path:
  - live affiliate coupon `1kgAyNZl`
  - test-mode launch coupon and promotion code objects for smoke coverage
- Recorded the affiliate coupon and promo-code IDs in the handoff docs.

### Stripe work

- Verified the existing paywall products and prices in Stripe.
- Created the shared affiliate coupon needed for launch referral flows.
- Created the launch promo-code objects for the discounted monthly and yearly offers.
- Documented the Stripe-side state and the remaining dashboard-only Connect step.

### Auth, discussions, and other launch gates

- Verified essential auth paths: signup, password login, and forgot-password reset.
- Verified discussions E2E passes.
- Verified paywall E2E passes.
- Confirmed the broader auth suite remains out of launch scope:
  - MFA
  - custom recovery codes
  - magic link expansion
  - Google account merging
  - idle timeout
  - broader account deletion flow

### Docs and handoff updates

- Updated:
  - `docs/notes/launch-readiness-signoff.md`
  - `docs/notes/owner-launch-handoff.md`
  - `docs/notes/floating-mountain-plan-audit.md`
  - `docs/notes/production-domain-audit.md`
  - `docs/notes/affiliates.md`
- Added a launch preflight script and documented its usage in the launch handoff.
- Added a concise owner-facing handoff checklist for deployment and provider setup.

## Key Commits

- `dbc6850` - `test(launch): add aggregate unit gate`
- `1885956` - `docs(launch): add owner handoff checklist`
- `6a3fce3` - `chore(launch): add production preflight script`
- `aeeb4ec` - `docs(launch): refresh production domain blockers`
- `2139585` - `chore(launch): fail preflight on public route redirects`
- `741c151` - `docs(launch): add preflight to signoff gates`
- `c8b252b` - `docs(launch): record affiliate coupon id`
- `549e5ed` - `docs(launch): record launch promo codes`

## Remaining Blockers

- Stripe Connect still has to be enabled in the Stripe dashboard.
- `NEXT_PUBLIC_ENABLE_AFFILIATES` should stay unset until the affiliate env and real signup smoke are ready.
- Production still needs a deploy that serves the current app instead of the older mixed build.
- Supabase leaked-password protection still needs dashboard action.
- Sentry receiving still needs provider verification.
- `/dashboard` still needs owner visual parity sign-off against the current dev baseline.

## Current State

- Local worktree is clean after the documentation updates.
- `dev` is ahead of `origin/dev`.
- The launch-readiness work is documented, but production sign-off is not complete.
