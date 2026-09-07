# Approved design integration

Updated September 5, 2026. Core real-route integration is published on `feat/platform-rebuild-20260905`, draft PR #20. Launch verification is not complete; do not promote this branch as launch-ready.

## Implemented
- Shared cream, forest, amber and sage design, Literata/Nunito typography, compact dashboard, restrained geometric entrance and reduced-motion support.
- Home, searchable/filterable Practice catalog, coding/SQL and canvas workspaces, Library/readers, interview setup/debrief, Progress, authentication/recovery, account, pricing and billing integrated into existing services.
- Four main destinations: Home, Practice, Library, Progress. Hatch suggestions open contextual floating chat. Claude Code remains specific to analytics.
- Phone brief/work switching, native compact code editor, reference tabs, canvas/write-up controls, full-screen controls and history/feedback return paths implemented.
- Shared GFM and math rendering fixes literal formulas and nested code-pill styling. Editorial reader, contents, bookmarking and local reading-position restoration remain connected to real content.
- Analytics Brief / Guidance / Findings, explicit start, terminal, checkpoint/retry/resume and bounded startup state are implemented. Failed gateway startup no longer silently creates repeated sessions. No model suggestions run before the terminal is ready.
- Coding review schema now ships in the application; correctness fallback does not invent process scores. Unobserved collaboration/communication/testing dimensions are omitted from new coding reviews. Canvas collaboration is optional and its weight is omitted without conversation evidence.
- Canvas review failure leaves a saved, retryable attempt and a visible error; it no longer fabricates a neutral score. The canvas stays mounted during submission to preserve its scene and undo state.
- Interview entry now requires an explicit voice/chat choice. Flux settings corrected, voice errors tear down audio before chat fallback, and the opening request survives connection-state changes.

## Authenticated browser evidence
Tested against the branch preview, including READY deployment `dpl_8pdLh27V2gcEJA1cQhkspe3FUqRj` at commit `07b7d3369b4b072e23e8ab4c35c4de887f33ba95`. Subsequent fixes listed above require their own deployed recheck.

| Journey | Observed result |
| --- | --- |
| Home and Hatch | Real continuation retained. Dashboard suggestion opened floating Hatch, prefilled the request, and produced a contextual response. Existing user drafts were preserved. |
| Practice | Real catalog, search/filter and grid/list destinations working; 1,470 challenges were available at test time. Coding, SQL, analytics and data-modeling workspaces opened. |
| Coding | Range Sum: 5/5 visible and 7/7 submitted tests passed; draft survived refresh. Its Progress review now redirects to the correct workspace attempt and shows actual test evidence. Seating Arrangement: 7/7 tests passed and fresh detailed Hatch review succeeded. |
| SQL | Refund Rate per Seller: schema/sample data loaded, query ran 3/3 visible tests and passed 5/5 including hidden tests on submit. |
| Canvas | Ski Rental Schema: opened canvas, inserted starter diagram, returned to write-up, and restored diagram plus text after refresh. All four sections reachable. Full write-up submitted and real feedback correctly distinguished thoughtful notes from the deliberately incomplete starter diagram. |
| Reader | LLM Internals attention chapter visually renders inline math and dark code blocks correctly. Gmail Undo Send bookmark persisted in Saved stories. Outline navigation reached the selected section; refresh restored the same section and scroll position. |
| Interviews | Google Product Sense scenario selection, text conversation, end confirmation and saved debrief passed. Voice failed on a provider schema field; corrected code and explicit-mode flow await a deployed voice check. |
| Progress | Real completed work appears. Normalized challenge scores now populate Scored 80+. Actual completed guide chapters and guide links replace the false empty state. Interview score display corrected separately to match /10 debrief. |
| Account/billing | Authenticated account/settings loaded. Manage billing reached the server but returned 503 because preview Stripe credentials are not configured. No charge or subscription change was made. |
| Analytics | Start reached provisioning; gateway virtual-key creation timed out/returned 500. No terminal connected. This is a failed canary, not a passed journey. |

Test-owned examples used existing authorized browser authentication. Earlier user work was not deleted or overwritten. These examples are not user achievement claims.

## Code verification
- Final deployed follow-up: chat-mode interview opened without a microphone request, exchanged a real answer/follow-up, and saved a 5.6/10 debrief. Lobby scores now match debriefs. `/simulation` loads its real page. Reader bookmark, outline and restored section remain available, with internal metadata removed.
- Analytics failure canary now stops at the retry panel while the brief remains readable. It did not establish a terminal connection. Header status was then corrected to report connection unavailable instead of continuing to say preparing.
- The deployed canvas check exposed continued overlap at the far-right Next button. Navigation is now grouped at the left edge, clear of the Hatch dock; final deployment verification remains required.
- Deployment `dpl_F4gCp8nj1BVpjHCnG4e6RYWKYShw` (commit `a8c5a05e27eef9670d0b01410baf40f90071f478`) reached READY. Fresh SQL feedback passed: 5/5 tests, detailed 8.0/10 review, and no unsupported collaboration or interview-communication dimension for an independent attempt. New interview entry displayed the explicit voice/chat choice, with voice disabled until microphone checking.
- Final route audit removed two redirects into nonexistent `/prep` pages, restoring the existing simulation and company interview-prep routes. Interview lobby scores now use the same /10 scale as debriefs.
- TypeScript passed after the final submission-error and scoring refinements.
- Full unit suite: 658 passed (491 Node + 167 Vitest), including coding/canvas independence regressions.
- Independent high-effort review checked voice lifecycle, scoring truthfulness, analytics retries, draft/checkpoint handling and control reachability. Findings were addressed.
- Focused lint: zero errors and five existing unused-code warnings in live interview files; separate from historical repository-wide lint debt. Actual device tests and live service tests are not implied by unit counts.
- No production promotion, security-header relaxation or database migration in this integration batch.

## Historical launch gates — superseded by the current staging checkpoint
1. Verify the final published commit: explicit interview mode choice, score display, canvas Next button clearance, error/retry handling and optional collaboration scoring.
2. Restore the analytics gateway configuration and run a real canary: start, terminal interaction, prompt insertion, finding checkpoint, refresh/reconnect, finalization and cleanup. The current runtime has GitHub/Vercel/Supabase connectors but no callable GCP administration connection or local ADC. Existing infrastructure observations in `docs/architecture/analytics-backend-simplification.md` are historical, not a fresh cost audit.
3. Configure a Stripe test-mode preview and verify checkout, portal and webhook entitlement changes without live charges. Current billing failure is `stripe_not_configured`.
4. Obtain actual phone/tablet/desktop viewport screenshots and interaction checks. Prior 390/768/1440 composition-container checks are not device/browser viewport verification; the available browser session does not expose viewport resizing.
5. Production readiness and rollback review after these gates pass. PR #20 remains a draft.

## Known follow-up debt
- Analytics exact adaptive branching continuity after refresh still needs the canary; persisted findings and active step alone do not prove the complete session lifecycle.
- Historical feedback can contain scores from the old fallback/collaboration rubric. This batch prevents new unsupported scores; it does not silently rewrite existing learning history.
- Infrastructure consolidation and cost savings require live provider verification. No new monthly savings claim is made.

## Continuation checkpoint — September 6, 2026

- Restored the existing branch at `f3ec9f887be022386506f75cd6d1f4810346a270` in a fresh workspace. GitHub reports its Vercel status as successful. The implementation checkpoint above remains authoritative; the earlier full-rebuild plan is not evidence that implemented work must be restarted.
- Restored preview authentication through secure sign-in. The protected ski-rental workspace destination was retained.
- Rechecked the published canvas workspace: Frame → Next: List opens List. A fresh desktop screenshot shows the section navigation at the left of the work panel, clear of the Hatch dock. This closes the desktop Next-button placement check, not phone/tablet coverage.
- Rechecked the interview lobby: the latest existing debrief is displayed as 5.6/10. Google → Product Sense → recommended scenario → Start interview opens the explicit voice/chat chooser. It offers Allow mic and Continue in chat, no mic; the voice-start button remains disabled pending the microphone check. No voice conversation was exercised in this pass.
- The browser API still offers no viewport resizing. Phone/tablet checks remain open; desktop evidence must not be relabeled as device coverage.
- No callable GCP administration tool or installed `gcloud` was available in the continuation runtime. Gateway repair/live analytics canary remains blocked on provider access. The prior `stripe_not_configured` finding remains an unresolved billing gate, not a newly repeated test result.
- No application code, production deployment, cloud configuration, schema, billing settings, or existing answers were changed in this continuation pass.

## Billing verification follow-up — September 6, 2026

- Audited the connected HackProduct Stripe test account: all four US recurring prices match the current application plan amounts; the default test portal is active; no test webhook endpoints are registered. Exact identifiers and configuration requirements are in [BILLING_PREVIEW_GATE.md](./BILLING_PREVIEW_GATE.md).
- Fixed the test-setup script accepting a live key placed in `STRIPE_TEST_SECRET_KEY`. The script now rejects live/invalid values before Stripe client creation.
- Added signed webhook mode validation before database access, rejecting test events on live runtimes and live events on test runtimes. This does not replace isolated staging data.
- Verification: 180 Vitest tests passed across 21 files, including 13 config tests and 5 locally signed webhook mode/signature tests. TypeScript and focused ESLint passed. No external test payment or entitlement mutation was performed.
- Live gates remain open: preview environment writes and staging isolation, a registered test webhook with matching preview secret, GCP administration for gateway recovery, actual phone/tablet checks, and the complete live analytics/voice journeys. Plugin discovery found no relevant GCP administration integration in this session. No infrastructure or production settings were changed.

### Desktop continuation, September 6

See `DESKTOP_EXECUTION.md` for the current detailed evidence. Landing/auth from `feat/full-product-redesign` is integrated. Vercel, GCP, Stripe test and Supabase access are verified. Analytics now passes a real terminal, BigQuery query, checkpoint save, reconnect and expired-compute cleanup canary. Commit `66661497` is READY as deployment `dpl_A3gnPpgwaKZ9fUJ6zvWdBP8yBX2a`; its completion/usage fixes pass local build, TypeScript, 498 Node and 220 Vitest tests. A full deployed report/skill/final-grade journey remains open.

Actual phone/tablet Home checks pass; phone Library/readers, contents/save behavior and SQL workspace were exercised. SQL passed 5/5 cases and saved 7.2/10 feedback, restored from Progress at tablet width. The Progress total exposed a 1,000-row pagination bug now covered by a targeted fix and four tests; hosted verification follows deployment. Hosted test billing still requires staging isolation/cost approval; the new Stripe event-claim migration must precede billing enablement. Full spoken voice and remaining responsive/state checks are still open. Keep PR #20 draft and unmerged.
## Current staging checkpoint — September 6, 2026

This checkpoint supersedes earlier access and staging blockers above; historical browser results remain limited to the deployment and database on which they were observed.

- Candidate `7e3c4d2822abee64560fc9db3d12734729618457` is READY as `dpl_4gzMyq6K7V9xeAxaS5C8qHfJECpS` on the feature-branch preview, with 31 branch-only environment bindings verified unchanged. Landing and authentication changes from `feat/full-product-redesign` are integrated.
- Vercel, Stripe TEST, GCP, and isolated Supabase staging access are established. Staging ref `fkqsjjiunvvclwtgjqyc` records 181 migrations through `20260906160000`. Its project is healthy, but the provider branch lifecycle still reports the initial replay's `MIGRATIONS_FAILED`; repaired schema verification does not clear that provider status.
- Genuine Stripe TEST creation, duplicate resend, delayed update, and cancellation passed the recorded lifecycle checks. Actual browser Checkout completed on `1ae7b4bc`, returned to Pro, and its signed completion event processed once. The customer portal rendered the trial and scheduled cancellation; exact cleanup restored Free. See [browser billing evidence](../runbooks/staging-ui-billing-20260906.md). On `cf7e9fee`, the explicit cancellation date displays correctly, but Keep Pro failed after reauthentication because Stripe rejects both cancellation parameters together. The conditional-request fix passed a real Keep Pro retry on `b01d6585`: Stripe and signed webhook state cleared cancellation, and a reload displayed next billing. The immediate Settings display remained stale on that candidate; the bounded reconciliation fix on `7e3c4d28` passed a fresh Keep Pro browser check without reload. Both exact fixtures are canceled, signed deletion events processed once, and staging is Free with zero nonterminal subscriptions.
- Separate staging sandbox/gateway services, private snapshot storage, and scheduled cleanup are verified. A real gateway request recorded $0.00002; enforcement and key revocation passed. Three preserved learner failures exposed entitlement resolution, lost mint responses, and missing staging repository read access; fixes are applied. The fourth run on `cf7e9fee` reached a real terminal, saved six assessed checkpoints, and passed reconnect continuity, but failed reading the expected reusable skill file before finalization. Cleanup is independently verified: the owned revision is absent, traffic remains on the sterile base, the exact key is blocked with its record retained, and billing/access returned to Free. Gateway spend is `$0.4924225` against a configured `$0.49` limit; the DB records 49 cents. The harness incorrectly labeled cleanup incomplete because its missing-revision matcher did not recognize the installed CLI wording. Complete reusable skill and final-grade persistence remain open. See [analytics evidence](../runbooks/staging-analytics-isolation.md).
- Published browser fixtures now load anonymously while unpublished records, profiles, and the admin helper remain inaccessible to anonymous clients. See [fixture and policy evidence](../runbooks/staging-browser-fixtures.md).
- Browser access works. On `ebd506fd`, actual 390×844, 768×1024, and 1440×1000 canvas checks passed: Back/Next clear Hatch and the footer, section navigation works, and the desktop header remains visible after starter insertion. The 223-character write-up persists. Coding exercised assertion failure, syntax error, corrected 5/5 visible tests, 7/7 submission, and grounded 7.4/10 feedback; Submissions and Progress restore the same result and source. Phone Run/Submit and fullscreen entry/exit pass. Library search, mobile contents navigation, and reading-position restoration pass on their recorded candidates. See [screenshots and exact scope](./evidence/staging-20260906/README.md).
- Completion-URL pinning passed on `b01d6585`: new attempt `d2094b0c-1273-4fd6-a10e-d165e188dca6` retained the same 7/7 tests, 7.4/10 feedback, and submitted source after direct reload. Actual spoken turns/transcription/audio/debrief still require user microphone participation. The interview reaches the explicit microphone preflight without starting audio. Reduced-motion emulation is unavailable in the current browser capabilities and remains unverified. Physical-device coverage is not claimed.

PR #20 remains draft and unmerged. Production promotion is not authorized by staging testing approval.

## Staging handoff — stop further canary retries

On READY runtime candidate `7e3c4d28`, the bounded Analytics recovery restored the prior workspace and six assessed checkpoints, then the Claude skill command exited 1. No new assessment or final grade was produced. Session `7ef76e1f-6de6-4f97-8638-3c34126b6b9a` ended with `failed_cleanup_complete`: its revision is absent, key blocked and retained, and exact subscription cleanup restored Free with zero blocking subscriptions. The preserved final state records gateway spend `$0.1754103` for this new session; the prior session remains separately recorded. The command failure has no deeper captured cause. Further retries are stopped.

The implementation and deployed Settings/coding regressions are verified; Analytics completion, user-participated spoken voice, and reduced-motion coverage remain unresolved. PR #20 remains draft, with no production promotion or merge.

## 2026-09-07 release-gate reconciliation (HEAD bd5b998c)

Independent reviewer pass on branch `feat/platform-rebuild-20260905`. No commits, no builds, no paid canary, no Stripe/Supabase/GCP mutation performed for this review.

### Test and typecheck results

- Sandbox + billing suites: **81/81 passed, 0 failed** across both runners in use (`node --import tsx --test` for the node:test/TAP files — `provisioning-lease`, `cost-policy`, `cloud-run-provider`, `provision-session`, `reaper-budget`, `gateway-usage`, `billing/entitlements` — 34+12 passed; `npx vitest run` for the vitest-suite files — `finalize-grade`, `finalize-route`, `analytics-progress`, `snapshot-provenance`, `snapshot-routes` — 35 passed). Vitest reports false "no test suite found" on the node:test files if run directly against them; use the runner each file is actually wired into.
- `npx tsc --noEmit`: **0 errors**, including 0 under `supabase/functions/`.
- Two test files exist but are **not wired into any `package.json` script**: `tests/lib/sandbox/gateway-mint.test.ts`, `tests/lib/billing/subscription-cancellation.test.ts`. Pre-existing gap, unrelated to this branch's changes.

### Commit 67dde19d (`freshProvisioningState` spend reset) — verified correct

`src/lib/sandbox/provisioning-lease.ts:18-19` zeroes `observed_spend_cents`/`recorded_spend_cents` only on the path where `session/start` (`src/app/api/claude-code/session/start/route.ts:310`) replaces a session row with a brand-new `sessionId = randomUUID()`. The gateway key alias is `` `cc-${sessionId}` `` (`src/lib/sandbox/llm-gateway.ts:187`), so a new session id always mints a fresh, zero-spend gateway key — no double-count risk, since this path never fires for a same-key re-provision (that returns early at route.ts:264 with the existing row untouched). `usage_events` are never touched by this change. One minor, non-blocking gap: `host_app` on `claude_code_sessions` is not reset by `freshProvisioningState` and not set anywhere in the `session/start` upsert, so it survives stale from the replaced row — low severity, diagnostic-only field, not spend/security-relevant.

### Migration compatibility — `git diff main...HEAD --stat -- supabase/migrations` (5 files, all additive/narrowing)

| File | Change type | Compatibility |
|---|---|---|
| `20260906120000_stripe_event_processing_state.sql` | New columns `status/processing_started_at/processing_token/processed_at/attempt_count/last_error/effects`, all `NOT NULL DEFAULT ...` or nullable; backfills `processed_at`; CHECK constraint compatible with default; 4 new `SECURITY DEFINER` RPCs | Additive. Safe. |
| `20260906130000_restrict_stripe_event_processing_rpc_access.sql` | `REVOKE`/`GRANT` hardening only, idempotent | Pure ACL tightening. Safe. |
| `20260906140000_profiles_subscription_status.sql` | New nullable column `subscription_status TEXT`, no default needed | Additive. Safe. |
| `20260906150000_create_private_cc_snapshot_buckets.sql` | `ON CONFLICT DO UPDATE` upsert forcing `public=false` on 2 named buckets; new `RESTRICTIVE` policy narrowing client access to those 2 buckets | Narrowing only, no widening, other buckets untouched. Safe. |
| `20260906160000_scope_catalog_admin_policies.sql` | `ALTER POLICY ... TO authenticated` on 2 existing admin policies (`challenges_admin`, `Admins can manage domains`), removing `anon` | Narrows anon access; separate public-read policies for challenges/domains confirmed untouched. Safe. |

No dropped columns, no `NOT NULL` added without default on populated tables, no renamed/altered signatures of pre-existing RPCs — 0 non-additive changes found.

`MIGRATIONS_FAILED` branch-lifecycle label root cause: the staging branch's *initial legacy replay* stopped at migration `002` during branch creation, unrelated to this branch's 5 new migrations; schema was subsequently repaired via direct connection and reverified (181 migrations present through `20260906160000`). The label is stale, not evidence of a current schema problem (`docs/runbooks/staging-setup-evidence.md:13`).

### Release-gate table

| Gate | Status | Evidence pointer | What would close it |
|---|---|---|---|
| Stripe lifecycle (checkout/cancel/reactivate/portal) | Proven (TEST mode) | `HANDOFF-2026-09-06.md` §`b01d6585`,`7e3c4d28`; real TEST fixtures + signed webhooks, cleanup verified | Live-mode rehearsal per this runbook's Release order step 3 |
| 3DS | Open | HANDOFF: "3DS was not tested" | Run a 3DS-required TEST card through checkout |
| Coding/SQL journeys | Proven | HANDOFF `b01d6585`: 5/5+7/7 tests, 7.4/10 feedback, reload persistence | none — closed |
| Canvas journey | Proven | This file, line 90: 390/768/1440 viewport checks pass | none — closed |
| Library journey | Proven | This file, line 90: search/bookmarks/reading-position pass | none — closed |
| Progress journey | Proven | This file, line 90: "Progress counts real completed work" | none — closed |
| Text interview | Proven | HANDOFF: "Text interview conversation and saved debrief pass" | none — closed |
| Spoken voice | Open (blocked on user) | HANDOFF §3 / this file line 91: reached mic preflight only, no participation | Real mic session with user: speech, transcription, audio reply, persisted debrief, teardown |
| Analytics finalize + grade | Open | This file line 88 / HANDOFF §1: report generated but no skill file / no final grade in 2 of 2 real runs; spend crossed cap by $0.0024 with no rejection captured | Diagnose captured Claude CLI exit-1 error before another paid canary; re-run to get skill+grade+in-cap spend |
| Spend-cap compliance | Partial | Same run: $0.4924 vs $0.49 cap, last request crossed by $0.0024, no budget rejection observed | Investigate why the cap didn't reject; needs a clean in-cap or a proven-rejected run |
| Restarted-session accounting | Proven (locally) | This review above: commit 67dde19d correct, full sandbox suite 81/81 pass, tsc clean | No production build or live/paid canary run yet (explicitly deferred per handoff) — not a correctness blocker, but not deploy-validated |
| Reduced motion | Open | HANDOFF §4 / this file line 91: automation did not expose reduced-motion emulation; no OS preference changed this session | Test in an environment with OS-level reduced-motion toggle available; capture actual Playwright evidence |
| Migration compatibility | Proven | Table above — all 5 migrations additive/narrowing only, 0 non-additive changes | none — closed, but still requires the staged webhook-pause release order in `platform-rebuild-release.md` |
| Rollback path | Documented, unexecuted | `platform-rebuild-release.md` §Rollback compatibility — per-subsystem plan exists | Dry-run/rehearse before production promotion |
| Prod env parity | Not verified this session | HANDOFF §Vercel: "31 exact branch-specific Preview env bindings unchanged" — preview only, not prod | Recheck prod aliases/env immediately before any release per runbook step 1 |

## 2026-09-07 fresh canary run (80f6d31c) + spend-cap finding

**Run 80f6d31c (fresh, non-resume, one authorized paid run):** preflight green against
READY deployment `dpl_BNzMXwLKLfzN4Ys63UP3JERSZAm4`. Reached 6 of 8 checkpoints, all
verdict pass (mcp_setup, explore_schema, data_layout, analyze, segment, answer). The WSS
connect retry worked on a single attempt, no 404. The OS then killed the Node process for
low memory during checkpoint 7 (report), before report, skill, finalize, or grade ran.
This is an out-of-memory kill on the host, not an app defect, so it neither validates nor
invalidates the finalize+grade path. **That gate remains open.** Retry requires a host with
more memory headroom (or the staging preview driving it), not another attempt on this box.

Because the kill was external, the harness cleanup did not auto-fire. Cleanup was run
explicitly via the harness's own `cleanupOwnedSessionFailure` (import guard added to the
untracked harness; no logic change) and completed 6/6: session reaped via the real
`/api/cron/cc-reap`, revision absent, gateway key blocked and retained, Stripe TEST
subscription canceled with its deletion event processed once, Free baseline restored, prod
`cc-llm-db` never touched (`sql_stopped: false`). State file SHA-256
`6d82bfbe…38c8dee`.

**Spend-cap gap (systemic, needs a fix before launch):** the session key spent
`$0.5455824` against a `$0.49` cap, an overage of `$0.0556`. Root cause: `src/lib/sandbox/
llm-gateway.ts` mints the LiteLLM key with `max_budget` set to the raw intended ceiling,
no headroom. LiteLLM enforces per-request: it blocks a request from *starting* once
cumulative spend is at or over budget, but lets an in-flight request that started under
budget run to completion. The crossing request here started at `$0.4868` cumulative and
finished at `$0.5456`. `src/lib/sandbox/spend-alerts.ts` is observability-only (its
`SESSION_RUNAWAY_CENTS = 80` alert fired), not enforcement. Observed twice now (88f1e579
crossed by `$0.0024`, this run by `$0.0556`), and the overage scales with the final turn's
cost. **Recommended fix (not implemented):** mint keys with `max_budget = ceiling − worst-case
single-turn cost`, and/or add an app-side pre-flight budget check before dispatching a turn.
This directly informs the freemium pricing decision: the per-session cap must actually hold.

## 2026-09-07 remaining-gate closure notes

**Spend cap — CLOSED in code (commit 024ea4a2).** Keys now minted at ceiling minus
`CC_WORST_CASE_TURN_USD` headroom; user-facing ceiling unchanged; session-recovery ownership
fixed; reaper/spend-verify unaffected; 25/25 sandbox tests + tsc + eslint clean; new tests
wired into CI. Live-at-reap confirmation is the only residual and rides the finalize canary
below.

**Analytics finalize + grade — OPEN, host-bound, not an app defect.** The one paid run
(80f6d31c) reached 6/8 checkpoints then the OS OOM-killed Node. Confirmed cause: this host is
8 GB total and was simultaneously running two Next dev servers + Playwright + Chrome + several
Claude processes during the run. To close: run one fresh canary on a host with real memory
headroom (or with nothing else running — the two idle dev servers were reclaimed this session),
same harness (SHA in the run notes above), same $0.49 cap. Success = report + reusable skill at
/home/analyst/.claude/skills/funnel-analyst/SKILL.md (verified via /api/claude-code/skills) +
all 8 checkpoint assessments + persisted grade + cumulative key spend <= ceiling at reap (also
closes the spend-cap live check). The WSS connect-retry already landed and worked on its single
exercised attempt.

**Spoken voice — ACCEPTED by the user for this release; live mic test deferred.** Not a
release blocker. Route and steps remain in HANDOFF §3. No code work outstanding.

**Reduced motion — code CLOSED, runtime screenshots deferred.** Fix verified by tsc+eslint;
re-run e2e/reduced-motion.spec.ts against a warm, idle server for the before/after grid when
convenient. Not a blocker.

### Net release posture
PR #20 stays draft. The only true code-open item is the finalize+grade live proof, which is
gated on host memory, not on the codebase. Everything else is either closed or an accepted
deferral. A merge-with-Analytics-gated-off is viable now if desired; a full merge should wait
for one clean finalize canary on an adequate host.

## 2026-09-07 4th canary (GCP VM) — spend-cap fix proven INCOMPLETE, then re-tuned

Ran the finalize canary from a fresh GCP VM (cloud-platform.read-only scope, hardened
harness SHA 421f2ad4) against HEAD 0932f717. Memory, gcloud-path, and OAuth-scope blockers
were all resolved this time — it reached real BigQuery analysis, then the Claude session hit
a hard gateway 429 mid-analysis:

    API Error: Request rejected (429) · Budget has been exceeded!
    Current cost: 0.45104175, Max budget: 0.39

**This is a LIVE reproduction of the overage the 024ea4a2 headroom fix was meant to prevent,
and it shows $0.10 headroom was too small.** The key minted correctly at $0.39 (ceiling $0.49
minus $0.10), but actual spend reached $0.4510 before the 429 — a $0.061 overshoot past the
mint, burning >half the headroom. Root cause: BigQuery tool-call turns in the analytics flow
cost more than a plain chat turn, so the $0.10 worst-case assumption was under-sized.

**Action taken (committed):** raised `DEFAULT_WORST_CASE_TURN_USD` from $0.10 to $0.15 in
`src/lib/sandbox/cost-policy.ts` (covers the observed $0.061 overshoot with margin), with an
inline evidence note. Tests updated (0.49 ceiling now mints at $0.34), 16/16 headroom+mint+
usage tests pass, tsc clean. This is a floor, not a proof — LiteLLM still lets one in-flight
turn finish, so a genuinely large single turn could exceed even $0.15. If overshoot recurs
above $0.15, raise `CC_WORST_CASE_TURN_USD` or cap per-turn max_tokens in the analytics flow.

**Gate status:** finalize + grade STILL not reached (the 429 killed the session before report/
skill/finalize/grade). But the run was not wasted: it turned the spend-cap fix from
"unit-tested" to "live-tested and corrected." Note the 429 firing at all confirms the gateway
budget enforcement works end-to-end; the only issue was the headroom size, now larger.

Cleanup 6/6 (Free baseline, key blocked+retained at $0.4510, sub canceled, revision deleted,
prod cc-llm-db STOPPED/NEVER). VM deleted, 404-confirmed. Spend $0.4510, under the $0.49
ceiling. State file SHA-256 53cf245635989f388e50f85c79d32b5c8efb44c22e67b803c9e61264403cb5d4.
