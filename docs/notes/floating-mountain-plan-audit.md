# Floating Mountain Plan Audit

Last updated: May 6, 2026

This audit maps `~/.claude/plans/the-platform-is-at-floating-mountain.md` to the current repo and provider evidence. It separates the narrowed launch-readiness bar from the full original plan, which included large feature streams that should not be expanded without owner confirmation.

## Objective Restatement

The original plan asks for a full pre-launch hardening pass across AI guardrails, workspaces, server-side gating, auth and email, legal pages, monetization, operations, security, retention, discussions, paywall validation, difficulty taxonomy, XP/streak correctness, identity opacity, and markdown rendering.

The current owner-narrowed launch scope is:

- Preserve the current dev dashboard structure and avoid visual regressions.
- Do not add MFA or custom recovery-code features.
- Do not ship cohort features.
- Keep paywall verified.
- Treat affiliates as blocked until Stripe Connect and affiliate env setup are complete.
- Rely on Supabase-native auth for signup, password login, and forgot-password reset.

## Prompt-To-Artifact Checklist

| Plan Gate | Status | Evidence / Gap |
| --- | --- | --- |
| 1. Build, lint, types, tests clean | Partial | `npm run build`, `npm run lint`, `npx tsc --noEmit --pretty false`, and `npm run secrets:scan` passed on May 6 after the copy and identity cleanup. `package.json` does not define an `npm test` script, so the aggregate test gate cannot run as written. Focused test commands remain the evidence source. |
| 2. Playwright N2/N3/N4 green | Partial | N2 paywall passed `10/10`; N3 discussions passed `10/10`; narrowed N4 auth passed signup/login/forgot-password `3/3`. Full N4 remains out of launch scope per owner direction. |
| 3. AI guardrails E2E | Partial | AI guardrail unit tests passed on May 6: 15 tests across voice rules, sanitizer, and guarded client. Static source grep for literal em-dash characters and HTML mdash entities returned no matches across `src/app`, `src/components`, and `src/lib/email`. No latest E2E evidence proves a live Hatch response logs `ai_voice_violations` and appears in the admin dashboard. |
| 4. Prompt injection | Partial | Guarded client unit tests cover wrapping user input and opacity guard instructions. No latest live Hatch probe evidence is recorded. |
| 5. Plan limits + throttle | Partial | Paywall N2 coverage passed; full per-route AI throttle/limit verification across every AI route is not recorded. |
| 6. Discipline workspaces | Not complete | `src/components/challenge/workspace/WorkspaceShell.tsx` and new per-discipline workspace routes are absent. This is broad feature work, not current launch scope. |
| 7. Auth | Launch scope complete, full plan not complete | Essential auth paths passed for signup, password login, and forgot-password reset. Magic link, Google linking, reauth, idle timeout, delete account, and 2FA are outside the narrowed launch bar unless re-added. |
| 8. Stripe | Partial | Paywall checkout/webhook scenarios passed. Affiliate real signup smoke is blocked by Stripe Connect and missing affiliate env vars. Owner/provider setup required. |
| 9. Onboarding resilience | Partial | Essential signup to onboarding to dashboard passed. Refresh mid-calibration resume has not been reverified in the latest gate. |
| 10. Mental Models | Unknown | No latest evidence tying weak competency feedback to `motivation_theory` recommendation. |
| 11. Discussions | Complete for launch | `e2e/discussions.spec.ts` passed `10/10` against local production server. |
| 12. Legal/help | Local complete, production blocked | Local production smoke returned `200` for `/privacy`, `/terms`, `/pricing`, `/help`, and `/changelog`. `PUBLIC_DIRECTORY_PATHS` includes those paths for sitemap generation. Live production currently redirects to an older waitlist build, so production page checks remain blocked until deployment/domain routing is updated. |
| 13. Bookmarks/share/referral display/push/2FA | Not complete | Push and 2FA are not launch scope. Referral display depends on affiliate setup. |
| 14. Mobile | Partial | Authenticated `/challenges` passed a 375px local production smoke on May 6: `200`, Practice page rendered, Hatch pick rendered, zero visible `Luma`, zero visible em dashes, no horizontal overflow (`documentScrollWidth=375`, `viewportWidth=375`), and Hatch overlay stayed above the bottom nav. Screenshot: `/tmp/hackproduct-mobile-smoke/challenges-auth-1778068327143.png`. Broader mobile route and axe coverage is still not recorded. |
| 15. Voice violation rate after 24 hours | Not complete | Requires post-launch or extended normal-use monitoring. |
| 16. Security headers | Local complete, production partial | `next.config.ts` defines HSTS, CSP, frame denial, nosniff, referrer, and permissions policies. Local `next start` smoke on `/privacy` returned those headers and no `x-powered-by`. Live `https://www.hackproduct.com/waitlist` check found HSTS, nosniff, frame, referrer, and permissions headers, but CSP was absent and the page is an older waitlist build. |
| 17. Secret rotation | Code-side complete, provider action remains | Repo/staged secret scans pass. Exact grep for committed Supabase service-role JWTs and direct service-key assignments returned no matches. Supabase key rotation remains owner-controlled. |
| 18. Sentry receiving | Not complete | Static repo audit found no Sentry package and no Sentry instrumentation. |
| 19. Status page reachable | Partial | `/api/health` exists and smokes locally. `status.hackproduct.com` DNS resolves, but `https://status.hackproduct.com` returned `404` on May 6, so provider/app routing still needs setup. |
| 20. PWA installable | Partial | Static/local production audit found `/manifest.json` public, valid, and backed by dedicated 192px and 512px PNG icons; browser installability has not been verified. See `docs/notes/pwa-manifest-audit.md`. |
| 21. Difficulty taxonomy | Not complete | Read-only live DB audit found values outside `easy | medium | hard`; see `docs/notes/difficulty-taxonomy-audit.md`. No migration was applied during launch freeze. |
| 22. Streak + XP correctness | Not complete | `src/lib/xp/calculator.ts`, `docs/notes/xp-streak-audit.md`, and P8 evidence are absent. This is broad correctness work, not safe to invent during launch freeze. |
| 23. Hatch identity opacity | Partial | Sanitizer and guarded client artifacts exist. Static grep over user-visible app/components/auth/marketing/email surfaces returned no forbidden provider/internal terms after excluding AI internals and Hatch system prompt files. Stale `Luma` copy and selectors were removed from public mockups and waitlist HTML. Live Hatch probe evidence is still not recorded. |
| 24. Markdown rendering | Partial | `src/components/ui/Md.tsx` exists. Full raw-prose replacement and Hatch challenge-link E2E are not recorded. |

## Current Launch Blockers

- Affiliate real signup smoke cannot be signed off until Stripe Connect is enabled and `NEXT_PUBLIC_ENABLE_AFFILIATES`, `STRIPE_AFFILIATE_COUPON_ID`, `STRIPE_TEST_AFFILIATE_COUPON_ID`, and `AFFILIATE_HASH_SECRET` are set. Until then, affiliate UI and routes are disabled by default.
- Supabase Auth leaked-password protection is disabled in dashboard settings.
- Supabase performance advisor has a broad pre-existing backlog that needs a deliberate tuning pass, not a blanket launch migration.
- Production env and provider checks remain owner-controlled: no E2E fallback flags, OpenAI, Turnstile, Upstash, status DNS/provider, security headers.
- Owner still needs to visually compare `/dashboard` against the current dev baseline. Codex local smokes loaded `/dashboard` with temporary Supabase users, verified the large hero, session CTA, usage card, practice loop, quick take, recommended challenge, FLOW levels, trending/activity, and community pulse sections, found zero visible `Luma` text in current builds, and deleted the temporary users. The `localhost:3000` baseline still differs in small copy/CTA details from the launch-cleaned current build.

## Guardrail Decision

Do not mark the full plan complete. The launch bar is substantially closer, but the original plan still contains incomplete feature streams. Continuing into those streams could create regressions and contradict current owner direction.
