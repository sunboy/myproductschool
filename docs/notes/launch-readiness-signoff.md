# Launch Readiness Sign-Off

Last updated: May 6, 2026

This document tracks launch gates by real evidence. A checked item means the gate has been verified in this repo or in the configured Supabase/Stripe test setup. An unchecked item means launch should wait or the owner should explicitly accept the risk.

## Verified Gates

- [x] Production build passes.
  - Evidence: `npm run build` passed on May 6, 2026.
- [x] TypeScript passes.
  - Evidence: `npx tsc --noEmit --pretty false` passed on May 6, 2026.
- [x] Secrets scan passes.
  - Evidence: `npm run secrets:scan` and staged secret scans passed.
- [x] Paywall scenarios pass.
  - Evidence: `e2e/paywall.spec.ts` passed `10/10` against `next start` with seeded Supabase users.
  - Commit: `4f96343 fix(paywall): unblock local production e2e`.
- [x] Discussions scenarios pass.
  - Evidence: `e2e/discussions.spec.ts` passed `10/10` against `next start`.
  - Commit: `7473936 fix(discussions): unblock launch e2e reporting`.
- [x] Essential auth paths pass.
  - Evidence: `e2e/auth.spec.ts -g "N4\.(1|2|4)"` passed `3/3` against `next start`.
  - Covered: signup verification to onboarding to dashboard, password login, forgot-password reset to new password login.
  - Commit: `b026402 fix(auth): unblock local turnstile e2e`.
- [x] Local production E2E fallback flags are documented.
  - Evidence: `docs/notes/e2e-test-users.md` documents `RATE_LIMIT_MEMORY_FALLBACK=true`, `DISCUSSION_MODERATION_E2E_FALLBACK=true`, and `TURNSTILE_E2E_FALLBACK=true`.
  - Production note: these flags must stay unset in production.
- [x] Required launch schema is present in Supabase project `tikkhvxlclivixqqqjyb`.
  - Evidence: remote checks confirmed `abuse_reports`, `admin_action_log`, `feedback_submissions`, `feedback_prompt_events`, `challenge_attempts.share_id`, and `nudge_usage.nudge_sequence`.
  - Evidence: service-role REST access passed for those tables and columns.
  - Commit: `3be449c fix(db): expose launch tables to service role`.
- [x] Feedback, affiliate, and billing unit coverage passes with the right test runners.
  - Evidence: `npx vitest run tests/unit/feedback-nps.spec.ts tests/unit/affiliate-flow.spec.ts` passed.
  - Evidence: `npx tsx --test tests/lib/billing/entitlements.test.ts` passed.

## Accepted Scope Changes

- [x] MFA is out of scope for launch.
  - Owner direction: use Supabase auth for login, signup, and forgot-password. Do not build MFA or custom recovery-code features.
- [x] Custom MFA recovery is out of scope for launch.
  - Existing dropped migration remains applied remotely as `drop_unused_mfa_recovery_codes`; no user-facing MFA work should be added.

## Open Blockers

- [ ] Affiliate real signup smoke is blocked by Stripe account setup.
  - Stripe Connect is not enabled for the account used by `.env.local`.
  - Required env vars are missing locally: `STRIPE_AFFILIATE_COUPON_ID`, `STRIPE_TEST_AFFILIATE_COUPON_ID`, `AFFILIATE_HASH_SECRET`.
  - Code and unit flow pass, but affiliate launch should not be signed off until Connect and env setup are done and the real signup smoke passes.
- [ ] Full repo lint is not green.
  - `npm run lint` currently fails on pre-existing unrelated files, including `_archived/` and older live-interview/showcase code.
  - Changed files in the recent launch-gate work passed targeted lint.
- [ ] Supabase advisors still report pre-existing security and performance items.
  - Fixed during this pass: `user_pattern_summary` security-definer view, direct public RPC access to security-definer functions, mutable search paths on app-owned functions, broad listing on the public `avatars` bucket, missing service-role-only policies on legacy pipeline tables, and broad public insert policies that are not used by the active app.
  - Remaining security items are `pg_trgm` installed in `public` and leaked-password protection disabled.
  - Evidence: live Supabase security advisor rerun after the policy migrations only reports those two items.
  - Evidence: service-role REST smoke inserted and deleted a temporary `waitlist` row after public insert access was removed.
  - Advisor output did not point to the newly applied launch tables as missing policies.
- [ ] Full auth suite has not been treated as a launch requirement after scope reduction.
  - Verified launch scope is signup, login, and forgot-password reset.
  - Magic link, Google linking, reauth, idle timeout, and account deletion exist in `e2e/auth.spec.ts`, but they are outside the narrowed launch auth scope unless the owner re-adds them.

## Manual Checks Before Launch

- [ ] Owner reviews `/dashboard` against the current dev baseline and confirms no visual regression.
- [ ] Owner confirms Stripe Connect is enabled and affiliate env vars are set.
- [ ] Owner reruns affiliate real signup smoke.
- [ ] Owner confirms production env does not set any `*_E2E_FALLBACK` flags.
- [ ] Owner confirms production has `OPENAI_API_KEY`, `TURNSTILE_SECRET_KEY`, and Upstash Redis env vars.
- [ ] Owner checks `/privacy`, `/terms`, `/pricing`, `/help`, and `/changelog` in production.
- [ ] Owner verifies status page and production security headers.

## Commands

Use a production-style local server:

```bash
RATE_LIMIT_MEMORY_FALLBACK=true DISCUSSION_MODERATION_E2E_FALLBACK=true TURNSTILE_E2E_FALLBACK=true npx next start -p 3002
```

Core launch gates:

```bash
npm run build
npx tsc --noEmit --pretty false
npm run secrets:scan
npx playwright test e2e/paywall.spec.ts --reporter=line
npx playwright test e2e/discussions.spec.ts --reporter=line
npx playwright test e2e/auth.spec.ts -g "N4\\.(1|2|4)" --reporter=line
```

Focused unit gates:

```bash
npx tsx --test tests/lib/security/turnstile.test.ts tests/lib/ai/moderation.test.ts tests/lib/security/rate-limit.test.ts
npx tsx --test tests/lib/billing/entitlements.test.ts
npx vitest run tests/unit/feedback-nps.spec.ts tests/unit/affiliate-flow.spec.ts
```
