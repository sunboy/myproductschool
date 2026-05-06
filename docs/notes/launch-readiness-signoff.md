# Launch Readiness Sign-Off

Last updated: May 6, 2026

This document tracks launch gates by real evidence. A checked item means the gate has been verified in this repo or in the configured Supabase/Stripe test setup. An unchecked item means launch should wait or the owner should explicitly accept the risk.

See `docs/notes/floating-mountain-plan-audit.md` for the full original-plan audit. The original plan contains feature streams that remain incomplete and should not be resumed during launch freeze without owner confirmation.

## Verified Gates

- [x] Production build passes.
  - Evidence: `npm run build` passed on May 6, 2026 after the PWA manifest and affiliate-gating changes.
- [x] TypeScript passes.
  - Evidence: `npx tsc --noEmit --pretty false` passed on May 6, 2026 after the PWA manifest and affiliate-gating changes.
- [x] Repo lint exits successfully.
  - Evidence: `npm run lint` exits `0` on May 6, 2026.
  - Note: lint still reports warnings. `_archived/` and generated public bundles are excluded from lint, and React compiler-style purity rules are disabled to avoid rewriting established UI flows during launch hardening.
- [x] Secrets scan passes.
  - Evidence: `npm run secrets:scan` passed on May 6, 2026; staged secret scans passed on commit.
  - Evidence: exact secret-rotation grep for committed Supabase service-role JWTs and direct hardcoded service-key assignments returned no matches on May 6, 2026.
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
- [x] Code-side status monitoring support exists.
  - Evidence: `/api/health` returns a no-store JSON health response for uptime monitors.
  - Evidence: `docs/notes/status-page.md` points the external status provider setup at `/api/health`.
  - Evidence: local production smoke returned `200` for `/api/health`.
- [x] Core legal, pricing, help, and changelog pages respond locally.
  - Evidence: local production smoke returned `200` for `/privacy`, `/terms`, `/pricing`, `/help`, and `/changelog`.
  - Evidence: `src/lib/seo/directory-content.ts` includes `/pricing`, `/privacy`, `/terms`, `/help`, and `/changelog` in `PUBLIC_DIRECTORY_PATHS`, which feeds `src/app/sitemap.ts`.
- [x] Local production security headers are configured and present.
  - Evidence: local `next start` smoke on `/privacy` returned HSTS, CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and no `x-powered-by` header.
- [x] Feedback, affiliate, and billing unit coverage passes with the right test runners.
  - Evidence: `npx vitest run tests/unit/feedback-nps.spec.ts tests/unit/affiliate-flow.spec.ts` passed on May 6, 2026: 3 files, 21 tests.
  - Evidence: `npx tsx --test tests/lib/billing/entitlements.test.ts` passed on May 6, 2026: 6 tests.
- [x] Security helper unit coverage passes.
  - Evidence: `npx tsx --test tests/lib/security/turnstile.test.ts tests/lib/ai/moderation.test.ts tests/lib/security/rate-limit.test.ts` passed on May 6, 2026: 13 tests.
- [x] AI guardrail unit coverage passes.
  - Evidence: `npx tsx --test tests/lib/ai/voice-rules.test.ts tests/lib/ai/sanitize.test.ts tests/lib/ai/guarded-client.test.ts` passed on May 6, 2026: 15 tests.
- [x] Static app copy is clean for em dashes.
  - Evidence: static grep for literal em-dash characters and HTML mdash entities across `src/app`, `src/components`, and `src/lib/email` returned no matches on May 6, 2026.
  - Evidence: `npx tsc --noEmit --pretty false` passed after the cleanup.
  - Evidence: `npm run lint` exited `0` after the cleanup, with the existing warning set.
- [x] Active cohort feature surface is removed from launch.
  - Evidence: deleted `/api/cohort/current`, `/api/cohort/leaderboard`, and `/api/cohort/submit` route handlers plus the unused cohort hook/data helpers.
  - Evidence: `/challenges` no longer fetches cohort leaderboard data; dashboard community CTA now links to practice instead of a weekly room.
  - Evidence: `rg` found no remaining active cohort route/helper references, and `npm run build` no longer lists `/api/cohort/*`.
- [x] Static Hatch identity leak grep passes for user-visible app surfaces.
  - Evidence: `rg -i "claude|anthropic|sonnet|opus|haiku|openai|gpt-|language model|system prompt|tool call"` returned no matches in `src/components`, `src/app/(app)`, `src/app/(marketing)`, `src/app/(auth)`, and `src/lib/email` after excluding AI internals and Hatch system prompt files.
  - Evidence: `rg -i "\\bluma\\b|luma"` returned no matches in current `src/components`, `src/app`, and `src/lib/email` TypeScript/TSX user-surface files after renaming a stale internal preview export.
  - Evidence: stale `Luma` copy and selectors were removed from public static mockups and waitlist HTML; `rg -i "\\bluma\\b|luma" public src/app src/components src/lib/email --glob '!public/sql.js/**' --glob '!public/talkinghead/**' --glob '!public/images/logos/stripe.png'` returned no matches on May 6, 2026.
- [x] Local authenticated dashboard smoke passes after copy cleanup.
  - Evidence: a fresh `next start` on port `3012` loaded `/dashboard` with a temporary Supabase user that was deleted after the run.
  - Evidence: the smoke verified the dashboard hero, session CTA, quick-take card, multiple card sections, zero visible `Luma` text, and zero visible em dashes.
  - Evidence: screenshot captured at `/tmp/dashboard-smoke-1778065728974.png` for local visual review.
- [x] Local dashboard parity smoke preserves the current dashboard structure.
  - Evidence: Playwright loaded `/dashboard` on `localhost:3000`, current production build `localhost:3014`, and observed `localhost:3001` with a temporary Supabase user that was deleted after the run.
  - Evidence: all three runs returned `200`, showed the large greeting hero, session CTA, freemium usage card, practice-loop card, quick-take card, recommended challenge card, FLOW levels, trending/activity cards, and community pulse.
  - Evidence: current production build and `localhost:3001` both had zero visible `Luma` text and zero visible em dashes.
  - Evidence: screenshots captured at `/tmp/hackproduct-dashboard-parity/dev3000-baseline-1778066745062.png`, `/tmp/hackproduct-dashboard-parity/current3014-prod-1778066745062.png`, and `/tmp/hackproduct-dashboard-parity/dev3001-observed-1778066745062.png`.
  - Note: `localhost:3000` was not byte-for-byte identical to current build. It still showed older copy such as the weekly-room CTA and one visible em dash, while current build reflects the launch cleanup and affiliate/cohort gating.

## Accepted Scope Changes

- [x] MFA is out of scope for launch.
  - Owner direction: use Supabase auth for login, signup, and forgot-password. Do not build MFA or custom recovery-code features.
- [x] Custom MFA recovery is out of scope for launch.
  - Existing dropped migration remains applied remotely as `drop_unused_mfa_recovery_codes`; no user-facing MFA work should be added.
- [x] Cohorts are out of scope for launch.
  - Active cohort UI and backend endpoints are removed. The legacy protected `/cohort` path does not expose a cohort page; logged-out requests follow the normal app auth redirect.
- [x] The broader auth suite is out of scope for launch.
  - Verified launch auth scope is signup, password login, and forgot-password reset.
  - Magic link, Google linking, reauth, idle timeout, and account deletion remain outside the narrowed launch auth bar unless the owner re-adds them.

## Open Blockers

- [ ] Production domain appears to be serving an older waitlist build.
  - Evidence: live browser check on May 6, 2026 showed `https://hackproduct.com/` redirecting to `https://www.hackproduct.com/waitlist`.
  - Evidence: the live waitlist page still contains legacy "Luma" coach copy, so production does not match the current launch-ready local app.
  - Evidence: Vercel production deployment points at `main` commit `da0370e8e5cc2c4799f461ec8a5059a43fcbc605`, while local `dev` contains unpublished launch-readiness commits.
  - Evidence: the mismatch remains until `dev` is pushed or an explicit Vercel deployment is created from this checkout.
- [ ] Affiliate real signup smoke is blocked by Stripe account setup.
  - Affiliate UI and affiliate routes are disabled by default unless `NEXT_PUBLIC_ENABLE_AFFILIATES=true` is set at build time.
  - Stripe Connect is not enabled for the account used by `.env.local`.
  - Required env vars are missing locally: `NEXT_PUBLIC_ENABLE_AFFILIATES`, `STRIPE_AFFILIATE_COUPON_ID`, `STRIPE_TEST_AFFILIATE_COUPON_ID`, `AFFILIATE_HASH_SECRET`.
  - Code and unit flow pass, but affiliate launch should not be signed off until Connect and env setup are done and the real signup smoke passes.
- [ ] Supabase Auth leaked-password protection is disabled.
  - Fixed during this pass: `user_pattern_summary` security-definer view, direct public RPC access to security-definer functions, mutable search paths on app-owned functions, broad listing on the public `avatars` bucket, missing service-role-only policies on legacy pipeline tables, broad public insert policies that are not used by the active app, and `pg_trgm` living in the exposed `public` schema.
  - Remaining security advisor item: leaked-password protection disabled in Supabase Auth settings.
  - Evidence: live Supabase security advisor rerun on May 6, 2026 only reports leaked-password protection.
  - Evidence: service-role REST smoke inserted and deleted a temporary `waitlist` row after public insert access was removed.
  - Evidence: `pg_trgm` now lives in `extensions`; existing `idx_artifacts_desc_trgm` and `idx_artifacts_name_trgm` indexes still exist.
  - Advisor output did not point to the newly applied launch tables as missing policies.
- [ ] Supabase performance advisor backlog remains.
  - Evidence: live Supabase performance advisor rerun on May 6, 2026 still reports pre-existing INFO/WARN items such as unindexed foreign keys, multiple permissive RLS policies, and duplicate indexes.
  - Launch note: no blanket performance migration was applied during this pass because the warnings span many legacy/content tables and need a deliberate database tuning pass to avoid unnecessary lock or policy risk.
- [ ] Difficulty taxonomy is not standardized to `easy | medium | hard`.
  - Evidence: read-only live DB audit on May 6, 2026 found existing values such as `advanced`, `beginner`, `intermediate`, `standard`, `warmup`, `staff_plus`, and other content-specific labels.
  - Launch note: no blanket taxonomy migration was applied during launch freeze because this touches content, UI labels, recommendation logic, and legacy cohort data.
- [ ] Error monitoring is not implemented.
  - Evidence: static repo audit on May 6, 2026 found no Sentry package and no Sentry instrumentation.
## Manual Checks Before Launch

- [ ] Owner reviews `/dashboard` against the current dev baseline and confirms no visual regression.
  - Codex local smokes passed after the copy cleanup and again against `localhost:3000`, current production build `localhost:3014`, and observed `localhost:3001`.
  - Owner visual parity remains a launch check because the requested baseline is the running dev dashboard and there are small intentional copy/launch-scope deltas.
- [ ] Owner confirms Stripe Connect is enabled and affiliate env vars are set.
- [ ] Owner reruns affiliate real signup smoke.
- [ ] Owner confirms production env does not set any `*_E2E_FALLBACK` flags.
- [ ] Owner confirms production has `OPENAI_API_KEY`, `TURNSTILE_SECRET_KEY`, and Upstash Redis env vars. Local `.env.local` presence check did not find these keys.
- [ ] Owner enables Supabase Auth leaked-password protection in the Supabase dashboard.
- [ ] Owner checks `/privacy`, `/terms`, `/pricing`, `/help`, and `/changelog` in production.
- [ ] Owner runs browser PWA installability check. Local production smoke found `/manifest.json` publicly reachable with dedicated 192px and 512px PNG icons, but no browser installability proof yet.
- [ ] Owner creates/configures the external status provider and DNS for `status.hackproduct.com`. Live check on May 6, 2026 found DNS resolving, but `https://status.hackproduct.com` returned `404`.
- [ ] Owner verifies production security headers are present on the deployed domain. Live check on May 6, 2026 found HSTS, nosniff, frame, referrer, and permissions headers on `https://www.hackproduct.com/waitlist`, but CSP was absent.

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

Note: `package.json` does not currently define an aggregate `npm test` script. Use the focused commands above until a unified test script exists.
