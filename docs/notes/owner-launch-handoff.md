# Owner Launch Handoff

Last updated: May 6, 2026

This is the short owner-facing checklist for moving the current `dev` launch-readiness work from local verification to production verification. It intentionally excludes broad original-plan feature streams that were narrowed out of launch scope.

## Current State

- Local branch: `dev`.
- Last launch-code commit before this docs handoff: `dbc6850`.
- Check current ahead count with `git status --short --branch` before pushing or deploying.
- Linked Vercel project: `myproductschool` (`prj_BnLtw2GgCcCyCnMciQ3Ps1Wezkff`), team `team_gOiGgobpBZjhBPxPTkIYrSTE`.
- Production currently serves an older waitlist build with legacy `Luma` copy, so production is not launch-signed-off.

## Code Gates Already Verified Locally

Run these again immediately before deploy if any new commits are added. Run `launch:preflight` with production env loaded; it only prints variable names and status, not values.

```bash
npm test
npm run build
npx tsc --noEmit --pretty false
npm run lint
npm run secrets:scan
npm audit --omit=dev
npm run launch:preflight -- --skip-network
```

Recorded evidence before this handoff:

- `npm test` passed with 88 Node tests and 87 Vitest tests.
- `npm run build` passed on Next `16.2.4`.
- `npx tsc --noEmit --pretty false` passed.
- `npm run lint` exited `0` with the known warning set.
- `npm run secrets:scan` passed.
- `npm audit --omit=dev` reported `found 0 vulnerabilities`.
- Paywall E2E passed `10/10`, discussions E2E passed `10/10`, and narrowed auth E2E passed signup/login/forgot-password `3/3`.
- `npm run launch:preflight -- --skip-network` can be used before deploy to check production env readiness without touching the live domain.

## Owner Actions Before Production Sign-Off

1. Review the local `dev` branch and approve either pushing `dev` or creating an explicit Vercel deployment from this checkout.
2. Confirm production environment variables are present and do not include any local E2E fallback flags.
3. Configure missing provider-owned settings:
   - Enable Supabase Auth leaked-password protection.
   - Rotate the Supabase service-role key if not already rotated after the prior committed key exposure.
   - Configure Sentry env vars and verify a real event appears in Sentry.
   - Configure OpenAI, Turnstile, and Upstash Redis env vars for production.
   - Configure the external status provider for `status.hackproduct.com`.
4. After deploy, rerun production checks:
   - Run `LAUNCH_PREFLIGHT_URL=https://hackproduct.com npm run launch:preflight`.
   - Confirm `https://hackproduct.com` serves the current app instead of the waitlist.
   - Confirm no visible `Luma`, provider, or system/internal copy.
   - Confirm `/privacy`, `/terms`, `/pricing`, `/help`, and `/changelog` return current pages.
   - Confirm production security headers include CSP.
   - Confirm production PWA installability.
   - Review `/dashboard` visually against the current dev baseline.

## Keep Disabled Until Provider Setup Is Done

Affiliates should remain disabled until Stripe Connect and all affiliate env vars are ready. Keep `NEXT_PUBLIC_ENABLE_AFFILIATES` unset unless all of these are true:

- Stripe Connect is enabled.
- `STRIPE_AFFILIATE_COUPON_ID` is set for live mode.
- `STRIPE_TEST_AFFILIATE_COUPON_ID` is set for test smoke runs if needed.
- `AFFILIATE_HASH_SECRET` is set.
- The real affiliate signup and Connect onboarding smoke passes.

When `NEXT_PUBLIC_ENABLE_AFFILIATES` is not exactly `true`, affiliate signup routes, referral attribution, checkout promotion application, webhook commissions, and payout cron stay disabled by default.

## Do Not Resume Without Explicit Approval

These original-plan streams remain deliberately outside the current launch freeze:

- MFA, custom recovery codes, magic link expansion, Google account merging, idle timeout, and broader auth suite.
- Cohort features.
- Broad discipline workspace rebuild.
- Full difficulty taxonomy migration.
- XP ledger/shared calculator/UTC boundary E2E expansion.
- Affiliate public launch.

See `docs/notes/launch-readiness-signoff.md` and `docs/notes/floating-mountain-plan-audit.md` for detailed evidence and known gaps.
