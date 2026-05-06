# Launch Readiness Sign-Off

Last updated: May 6, 2026

This document tracks launch gates by real evidence. A checked item means the gate has been verified in this repo or in the configured Supabase/Stripe test setup. An unchecked item means launch should wait or the owner should explicitly accept the risk.

See `docs/notes/floating-mountain-plan-audit.md` for the full original-plan audit. The original plan contains feature streams that remain incomplete and should not be resumed during launch freeze without owner confirmation.

## Verified Gates

- [x] Production build passes.
  - Evidence: `npm run build` passed on May 6, 2026 after the PWA manifest, affiliate-gating, and AI grading budget changes.
  - Evidence: `npm run build` passed after explicitly setting the Next project root; the previous multiple-lockfile workspace-root warning no longer appears.
  - Evidence: `npm run build` passed on Next `16.2.4` after Sentry instrumentation and targeted dependency patches. The Sentry post-build hook completed.
- [x] TypeScript passes.
  - Evidence: `npx tsc --noEmit --pretty false` passed on May 6, 2026 after the PWA manifest, affiliate-gating, and AI grading budget changes.
  - Evidence: `npx tsc --noEmit --pretty false` passed after Sentry instrumentation and targeted dependency patches.
- [x] Repo lint exits successfully.
  - Evidence: `npm run lint` exits `0` on May 6, 2026.
  - Evidence: `npm run lint` exited `0` after Sentry instrumentation and targeted dependency patches.
  - Note: lint still reports warnings. `_archived/` and generated public bundles are excluded from lint, and React compiler-style purity rules are disabled to avoid rewriting established UI flows during launch hardening.
- [x] Secrets scan passes.
  - Evidence: `npm run secrets:scan` passed on May 6, 2026; staged secret scans passed on commit.
  - Evidence: exact secret-rotation grep for committed Supabase service-role JWTs and direct hardcoded service-key assignments returned no matches on May 6, 2026.
  - Evidence: `npm run secrets:scan` passed after Sentry instrumentation and dependency env examples were added.
- [x] Paywall scenarios pass.
  - Evidence: `e2e/paywall.spec.ts` passed `10/10` against `next start` with seeded Supabase users.
  - Evidence: `PLAYWRIGHT_BASE_URL=http://localhost:3016 E2E_TEST_PASSWORD=... npx playwright test e2e/paywall.spec.ts --reporter=line` passed `10/10` on May 6, 2026 after reseeding the six fixed E2E personas.
  - Evidence: N2.3 now validates the quick-take cap directly instead of relying on repeated duplicate submissions of the same quick-take, because duplicate completions are intentionally idempotent.
  - Commit: `4f96343 fix(paywall): unblock local production e2e`.
- [x] Discussions scenarios pass.
  - Evidence: `e2e/discussions.spec.ts` passed `10/10` against `next start`.
  - Evidence: `PLAYWRIGHT_BASE_URL=http://localhost:3016 E2E_TEST_PASSWORD=... npx playwright test e2e/discussions.spec.ts --reporter=line` passed `10/10` on May 6, 2026 after the fixed E2E personas were reseeded.
  - Commit: `7473936 fix(discussions): unblock launch e2e reporting`.
- [x] Essential auth paths pass.
  - Evidence: `e2e/auth.spec.ts -g "N4\.(1|2|4)"` passed `3/3` against `next start`.
  - Evidence: `PLAYWRIGHT_BASE_URL=http://localhost:3016 npx playwright test e2e/auth.spec.ts -g "N4\\.(1|2|4)" --reporter=line` passed `3/3` on May 6, 2026.
  - Covered: signup verification to onboarding to dashboard, password login, forgot-password reset to new password login.
  - Commit: `b026402 fix(auth): unblock local turnstile e2e`.
- [x] Local production E2E fallback flags are documented.
  - Evidence: `docs/notes/e2e-test-users.md` documents `RATE_LIMIT_MEMORY_FALLBACK=true`, `DISCUSSION_MODERATION_E2E_FALLBACK=true`, and `TURNSTILE_E2E_FALLBACK=true`.
  - Production note: these flags must stay unset in production.
- [x] Next project root is explicit.
  - Evidence: `next.config.ts` sets `turbopack.root` and `outputFileTracingRoot` to the app project root so Next does not infer `/Users/sandeep` because of a parent `package-lock.json`.
  - Evidence: `npm run build` and `npx next start -p 3017` no longer emit the multiple-lockfile workspace-root warning.
- [x] Required launch schema is present in Supabase project `tikkhvxlclivixqqqjyb`.
  - Evidence: remote checks confirmed `abuse_reports`, `admin_action_log`, `feedback_submissions`, `feedback_prompt_events`, `challenge_attempts.share_id`, and `nudge_usage.nudge_sequence`.
  - Evidence: service-role REST access passed for those tables and columns.
  - Commit: `3be449c fix(db): expose launch tables to service role`.
- [x] Code-side status monitoring support exists.
  - Evidence: `/api/health` returns a no-store JSON health response for uptime monitors.
  - Evidence: `docs/notes/status-page.md` points the external status provider setup at `/api/health`.
  - Evidence: local production smoke returned `200` for `/api/health`.
- [x] Code-side error monitoring support exists.
  - Evidence: `@sentry/nextjs` is installed and wired through `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, and `src/app/global-error.tsx`.
  - Evidence: `next.config.ts` wraps the app with `withSentryConfig`, disables Sentry telemetry, removes Sentry debug logging from bundles, and only enables source map upload when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are set.
  - Evidence: CSP `connect-src` includes `*.sentry.io`, and `.env.example` documents the required Sentry env vars.
  - Evidence: `npx tsc --noEmit --pretty false`, `npm run lint`, `npm run build`, `npm run secrets:scan`, and `npm audit --omit=dev --audit-level=critical` passed after the change.
- [x] Critical/high production dependency audit is clean.
  - Evidence: `npm audit --omit=dev --audit-level=critical` exits `0` after targeted updates to `next@16.2.4`, `posthog-js@1.372.9`, and transitive `protobufjs@7.5.6`.
  - Evidence: targeted nonbreaking updates also cleared the previous `picomatch` high advisory and the `uuid` advisory.
  - Evidence: npm overrides pin transitive `dompurify@3.4.2` and `lodash-es@4.18.1`, clearing the remaining high Lodash-ES advisory and Monaco's nested DOMPurify advisory.
  - Evidence: `npm audit --omit=dev --audit-level=high` exits `0`; the remaining production audit findings are moderate.
- [x] Core legal, pricing, help, and changelog pages respond locally.
  - Evidence: local production smoke returned `200` for `/privacy`, `/terms`, `/pricing`, `/help`, and `/changelog`.
  - Evidence: `src/lib/seo/directory-content.ts` includes `/pricing`, `/privacy`, `/terms`, `/help`, and `/changelog` in `PUBLIC_DIRECTORY_PATHS`, which feeds `src/app/sitemap.ts`.
- [x] Local production security headers are configured and present.
  - Evidence: local `next start` smoke on `/privacy` returned HSTS, CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and no `x-powered-by` header.
- [x] Feedback, affiliate, and billing unit coverage passes with the right test runners.
  - Evidence: `npx vitest run tests/unit/feedback-nps.spec.ts tests/unit/affiliate-flow.spec.ts` passed on May 6, 2026: 3 files, 21 tests.
  - Evidence: `npx vitest run tests/unit/affiliate-flow.spec.ts` passed after affiliate launch gating was tightened: 2 files, 18 tests.
  - Evidence: `npx tsx --test tests/lib/billing/entitlements.test.ts` passed on May 6, 2026: 6 tests.
  - Evidence: `npx tsx --test tests/lib/usage/assert-plan-limit.test.ts tests/lib/billing/entitlements.test.ts tests/lib/ai/guarded-client.test.ts` passed after AI grading budget coverage was tightened: 14 tests.
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
- [x] Local authenticated mobile `/challenges` smoke passes at 375px.
  - Evidence: rebuilt production app on `localhost:3014` loaded `/challenges` with a temporary Supabase user that was deleted after the run.
  - Evidence: route returned `200`, rendered the Practice page and Hatch pick, had zero visible `Luma` text, zero visible em dashes, `documentScrollWidth` equaled `viewportWidth` at `375px`, and overflow element detection returned an empty list.
  - Evidence: the Hatch overlay was positioned above the mobile bottom nav (`hatchBottom=716`, `bottomNavTop=753`) after the responsive offset fix.
  - Evidence: screenshot captured at `/tmp/hackproduct-mobile-smoke/challenges-auth-1778068327143.png`.
  - Evidence: `npx tsx --test tests/lib/copy/display.test.ts`, `npx tsc --noEmit --pretty false`, `npm run lint`, `npm run build`, and `npm run secrets:scan` passed after the mobile and display-copy cleanup.
- [x] Local PWA browser installability passes.
  - Evidence: Chromium CDP probe against `RATE_LIMIT_MEMORY_FALLBACK=true npx next start -p 3014` returned `installabilityErrors: []` from `Page.getInstallabilityErrors`.
  - Evidence: the browser probe confirmed `http://localhost:3014/manifest.json` responds `200`, `display` is `standalone`, `start_url` is `/`, and manifest icons include 192px, 512px, and maskable 512px PNG entries.
- [x] Duplicate FLOW and quick-take completions no longer double-award XP for the same completed item.
  - Evidence: `src/app/api/challenges/[id]/complete/route.ts` returns stored completion data when the attempt is already `completed`, before XP, streak, move-level, study-plan, or Hatch context writes.
  - Evidence: `src/app/api/challenges/quick-take/submit/route.ts` returns the stored quick-take result when the same user submits an already completed quick-take challenge, before AI grading, plan-limit reservation, attempt insert, XP write, or streak update.
  - Evidence: `npx tsx --test tests/lib/scoring/completed-attempt-result.test.ts`, `npx tsc --noEmit --pretty false`, `npm run lint`, `npm run build`, and `npm run secrets:scan` passed after the idempotency guard.
  - Note: full XP/streak correctness is still partial; see `docs/notes/xp-streak-audit.md`.
- [x] Active `challenge_attempts` consumers use the live Supabase schema.
  - Evidence: live Supabase schema checks confirmed `challenge_attempts` has `completed_at`, `total_score`, `max_score`, `status`, `feedback_json`, `mental_models_breakdown`, `primary_competency`, and `weakest_competency`, and does not have legacy `submitted_at`, `score`, `score_json`, `mode`, or `response_embedding`.
  - Evidence: admin overview, career benchmark, profile export, analytics summary, feedback, diagnosis, domains, recommendations, drafts, and prescription code paths now use `status`, `completed_at`, `total_score`, `max_score`, `feedback_json`, and `move_levels`.
  - Evidence: stale-field grep now returns only expected compatibility fields from `/api/attempts`, UI consumers of that compatibility payload, `step_attempts.score`, and onboarding `scores_json`.
  - Evidence: `npx tsc --noEmit --pretty false`, `npm run lint`, `npm run build`, and `npm run secrets:scan` passed after the schema cleanup.
  - See: `docs/notes/challenge-attempts-schema-audit.md`.
- [x] Affiliate mechanics are fully gated off for launch unless explicitly enabled.
  - Evidence: `NEXT_PUBLIC_ENABLE_AFFILIATES !== 'true'` now disables affiliate signup routes, referral redirect cookie-setting, auth referral attribution, checkout affiliate promotion-code application, webhook commission creation, and affiliate payout cron.
  - Evidence: `npx vitest run tests/unit/affiliate-flow.spec.ts`, `npx tsc --noEmit --pretty false`, `npm run lint`, `npm run build`, and `npm run secrets:scan` passed after tightening the gate.
- [x] User-triggered AI grading paths use plan reservations and AI spend budget checks.
  - Evidence: FLOW elaboration/freeform submit, coding submit, coding finalize, interview challenge submit, and interview-loop debrief routes now reserve `ai_grading_runs` before model grading and pass a `budget` object into their guarded Anthropic calls.
  - Evidence: duplicate FLOW step submissions return the existing saved answer before grading, so retries do not consume plan quota or AI spend budget.
  - Evidence: static audit of `guardedCachedMessage` call sites found the remaining unbudgeted launch exception is `src/lib/content/coaching-warmer.ts`, which is an admin publish-time cache warmer rather than a user-triggered paywall path.
  - Evidence: `npx tsc --noEmit --pretty false`, `npx tsx --test tests/lib/usage/assert-plan-limit.test.ts tests/lib/billing/entitlements.test.ts tests/lib/ai/guarded-client.test.ts`, `npx vitest run tests/unit/affiliate-flow.spec.ts`, `npm run lint`, `npm run build`, and `npm run secrets:scan` passed after the AI grading budget patch.
- [x] Challenge scenario/context markdown renders without changing surrounding text tone.
  - Evidence: `CaseContextPane`, `ChallengeWorkspace`, `FlowWorkspace`, challenge feedback, and orientation now render challenge context prose through markdown components instead of plain JSX text interpolation.
  - Evidence: `Md` supports an explicit `tone="inherit"` mode so embedded scenario prose keeps the existing muted/on-surface color from its container.
  - Evidence: `rg -n "\\{challenge\\.prompt_text\\}|challenge\\.prompt_text\\}" src/app src/components` returns only `Md` render sites.
  - Evidence: `npx vitest run tests/components/Md.test.tsx` passed `5/5`, and `npx tsc --noEmit --pretty false`, `npm run lint`, `npm run build`, `npm run secrets:scan`, and staged secret scans passed before the markdown commits.

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
  - Affiliate UI, routes, auth attribution, checkout discounts, webhook commissions, and payout cron are disabled by default unless `NEXT_PUBLIC_ENABLE_AFFILIATES=true` is set.
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
- [ ] Sentry provider receiving is not verified.
  - Code-side instrumentation exists, but no staging or production event has been observed in Sentry yet.
  - Required env vars before verification: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN`.
  - Launch note: source map upload stays disabled until Sentry org, project, and auth token are present.
- [ ] Production dependency audit still has moderate advisories.
  - Evidence: `npm audit --omit=dev --json` reports 0 critical, 0 high, and 8 moderate production advisories after targeted patches.
  - Remaining moderate items include the Anthropic SDK memory-tool advisories, Next's nested PostCSS advisory, and Excalidraw's nested NanoID path. The npm suggested fixes include breaking changes or an invalid Next downgrade path, so they need a deliberate dependency upgrade pass.
- [ ] Full XP/streak correctness remains partial.
  - Evidence: the same-item duplicate-award paths for FLOW completion and quick takes are fixed and tested, but there is still no XP ledger, shared XP calculator, atomic XP increment, UTC boundary E2E, or simultaneous-completion coverage.
  - Launch note: see `docs/notes/xp-streak-audit.md`.

## Manual Checks Before Launch

- [ ] Owner reviews `/dashboard` against the current dev baseline and confirms no visual regression.
  - Codex local smokes passed after the copy cleanup and again against `localhost:3000`, current production build `localhost:3014`, and observed `localhost:3001`.
  - Owner visual parity remains a launch check because the requested baseline is the running dev dashboard and there are small intentional copy/launch-scope deltas.
- [ ] Owner confirms Stripe Connect is enabled and affiliate env vars are set.
- [ ] Owner reruns affiliate real signup smoke.
- [ ] Owner confirms production env does not set any `*_E2E_FALLBACK` flags.
- [ ] Owner confirms production has `OPENAI_API_KEY`, `TURNSTILE_SECRET_KEY`, and Upstash Redis env vars. Local `.env.local` presence check did not find these keys.
- [ ] Owner configures Sentry env vars and verifies a captured staging or production error appears in the Sentry project.
- [ ] Owner enables Supabase Auth leaked-password protection in the Supabase dashboard.
- [ ] Owner checks `/privacy`, `/terms`, `/pricing`, `/help`, and `/changelog` in production.
- [ ] Owner reruns browser PWA installability check on the production domain after it serves the current app. Local Chromium installability passes for the current production build.
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
npx tsx --test tests/lib/usage/assert-plan-limit.test.ts tests/lib/billing/entitlements.test.ts tests/lib/ai/guarded-client.test.ts
npx tsx --test tests/lib/scoring/completed-attempt-result.test.ts
npx vitest run tests/unit/feedback-nps.spec.ts tests/unit/affiliate-flow.spec.ts
```

Note: `package.json` does not currently define an aggregate `npm test` script. Use the focused commands above until a unified test script exists.
