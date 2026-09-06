# Desktop rebuild continuation — September 6, 2026

Status: implementation and launch verification in progress. Production promotion and merging remain outside this continuation.

## Plan interpretation

The pasted Codex web handoff identifies the core rebuild as complete and asks for focused recovery and deployed verification. `LOCKED_PLAN.md` supersedes the earlier rebuild sequence: Home, Practice, Library, and Progress are the primary destinations; Hatch is contextual; Claude Code belongs to analytics. Preserve current authentication, saved attempts, feedback, learning progress, and payment contracts. The owner additionally requested integrating Claude's landing and login presentation from `feat/full-product-redesign`.

The source branch exists locally at `c60fc650`; its presentation is absent from the current rebuild. Integrate the presentation while retaining the rebuild's newer safe redirects, verification continuation, and authentication failure handling. Do not replace the completed application with the source branch wholesale.

## Access evidence

- Vercel: connector resolves the existing `myproductschool` project. Desktop CLI sign-in refreshed successfully; scoped API environment inspection works.
- Stripe: desktop test key authenticates to the same HackProduct test account as the connector. Existing Pro and Analytics test prices match the approved prices. No test webhook endpoints exist yet.
- Supabase: HackProduct is `ACTIVE_HEALTHY`; no development branches exist. Isolated billing database creation awaits the owner's cost confirmation ($0.01344/hour).
- GCP: local gcloud authenticated and project selected. Analytics agent found the existing gateway's Cloud SQL database stopped; the preview lacks `CC_SQL_INSTANCE`, which gates its existing on-demand startup path.

No secret values belong in this document or committed verification artifacts.

## Launch evidence required

| Gate | Required evidence | Current work |
| --- | --- | --- |
| Landing and auth | Source provenance; safe return destinations; keyboard/mobile behavior; actual browser widths | Sol presentation integration |
| Analytics | Gateway key creation; real terminal input; prompt insertion; finding save; reconnect; finalize; bounded cleanup | Sol gateway recovery, existing architecture |
| Voice | Provider accepts schema; explicit mode choice; microphone/audio teardown; fallback and navigation | Sol lifecycle fixes and provider verification |
| Billing | Isolated test database; app checkout; test webhook delivery; persisted entitlement; portal; cancellation and duplicate delivery | Parent access/configuration |
| Responsive and regressions | Actual 390/768/1440 browser viewports and representative authenticated journeys; loading/error/retry/empty states | Parent integration verification |
| Release | Ready preview tied to tested commit; documented rollback; draft PR retained | Pending combined verification |

Earlier container-width screenshots and mocks do not establish authenticated journeys, actual devices, voice success, or production readiness. Local browser viewport tests will be labeled as such; physical device coverage is a separate limitation.

## Initial local verification

The first run passed 491 Node tests and 147 Vitest tests, with three suites unable to load already-declared math dependencies. Repairing the local install required npm's legacy peer-dependency mode; no dependency version upgrade was made. After the integration and voice test additions, 496 Node tests and 180 Vitest tests pass. Combined build and final verification are still in progress.

## Release and rollback constraints

Keep PR #20 a draft while live gates remain open. Push only the existing feature branch. Use preview-scoped configuration; do not promote production. Gateway recovery uses the existing database and service with bounded canaries, not the proposed infrastructure migration. Restore test resource state only after fresh checks show no unrelated active/fresh-provisioning sessions. Do not delete Cloud SQL, service accounts, keys, or historical resources. The documented migration requires backup, replacement, no-live-reference, and 24-hour observation gates before deletion.

## Integrated preview and findings

Commit `522b48ba` integrates the requested presentation and voice lifecycle changes. Its Vercel preview reached READY; a configuration-only redeploy `dpl_94HRPwgTJSK8MdN2fT1BjeLgKVFX` also reached READY. PR #20 was freshly verified open, unmerged, and draft.

- Direct Deepgram handshakes accepted both Flux v2 and Nova v1 settings (`SettingsApplied`). These requests used no microphone, learner session, or spoken turn. Full deployed voice remains open.
- Browser login with a dedicated test account succeeded. The new editorial login preserved `/challenges?discipline=sql`; the SQL filter was selected afterward. These final mobile-layout checks used local development code, not the earlier deployed layout.
- Actual browser layout measurements for the landing at widths 390, 768, and 1440 reported no document overflow (client widths 384, 762, and 1434 respectively). Phone and tablet screenshots were reviewed. The in-app browser's desktop screenshot capture cropped/scaled unexpectedly; it is not reliable full-desktop visual evidence. These are browser viewport checks, not physical-device tests.
- Mobile menu Escape closed the menu and returned focus to its trigger. Mobile auth initially put its large marketing composition before the form; corrected CSS and DOM order place the form approximately 91px from the top at 390px. Example feedback remains labeled on phones. Library navigation now targets `/explore`.
- Gateway canary passed: a key with a $0.01 budget and 600-second TTL served one Haiku request, then was revoked and confirmed absent. This proves gateway service, not terminal completion.
- First browser analytics failure revealed missing `CLOUD_RUN_BASE_REVISION` after gateway key creation. It now points at the freshly verified sterile existing base revision, scoped only to this feature branch. `CC_SQL_INSTANCE` is also branch-scoped.
- The next retry exposed a lease bug: upserting a replacement session retained the prior row's `created_at`, allowing the reaper to stop SQL during new provisioning. The pending fix resets the lease timestamp and stale host fields; its regression verifies the retried row survives cleanup and can activate.
- The serving gateway revision still has minimum scale 1; its attempted minimum-scale-0 successor never became healthy while SQL was stopped. Changing serving gateway traffic is deferred to the infrastructure release decision. Stopping SQL can therefore restore the pre-existing idle gateway restart behavior.

## Billing reliability changes pending hosted verification

The review found event IDs recorded before successful processing, ignored entitlement-write errors, and repeat checkout creating split Stripe customers. Prepared fixes introduce fenced expiring event claims, acknowledge only completed events, fail closed on critical database errors, record payment-failure increments once, and derive subscription lifecycle state from current Stripe state. Checkout now creates/reuses a stable verified customer and routes existing active/trialing/past-due subscriptions to the portal. The embedded client handles that redirect.

The migration `20260906120000_stripe_event_processing_state.sql` is additive and must precede the new webhook code wherever billing is enabled. It preserves historical rows as processed because historical side effects cannot safely be inferred. The new code fails closed if its RPCs are unavailable. Do not enable this preview's billing against the production database to bypass staging.

Migration SQL was exercised in isolated PGlite against representative tables: concurrent claim exclusion, lease expiry, new ownership token, stale-owner completion rejection, stale release rejection, once-only payment-failure effect, and processed replay. This does not substitute for testing the complete Supabase migration history or hosted RLS/service-role behavior.

An agent created an empty staging branch without the pending cost confirmation. Its migration replay failed on legacy duplicate RLS policies. The parent stopped external work, deleted that branch, and verified only the default main branch remains. It was never attached to Vercel. The original cost confirmation remains required before another hosted staging branch is created; legacy schema replay will also need repair or an approved schema-only baseline.

Combined tests before the lease fix: 496 Node tests and 206 Vitest tests passed. The new lease regression passes separately. Focused lint passed. The build caught a webhook discriminated-union typing issue, corrected before the final build. Final build/deployment results will be recorded after completion.

## Remaining release gates

1. Deploy the retry-lease fix; complete the real analytics terminal, prompt insertion, findings, reconnect, finalization, and cleanup journey.
2. Confirm staging cost, establish an isolated schema, apply the prepared billing migration there, configure a test-only preview/webhook, and verify real checkout-to-entitlement delivery, duplicate delivery, cancellation, and portal return.
3. Complete deployed voice with actual spoken input, response audio, saved debrief, and cleanup on failure/navigation.
4. Finish representative authenticated responsive checks across workspaces, readers, and progress; obtain reliable desktop captures and physical-device evidence where required.
5. Review migration compatibility, gateway scale-to-zero rollout, release order, and rollback before any production promotion. Keep the draft PR unmerged until those decisions.

Final local build for the pending reliability/mobile patch passed. TypeScript is clean; the 13 signed webhook cases passed again after the type correction. Hosted billing gates remain open regardless of this result.

## Analytics terminal canary and mobile journeys (08:16 UTC)

Deployment `dpl_AVUXgv84bEUGZnxhjZnBqAGbHU3j` is READY for commit `6f4da4a1`. Its Home contrast fix was visually checked at actual browser widths 390 and 768; document widths were 384 and 762 with no horizontal overflow.

The dedicated analytics canary `d9204b5c-026a-4c59-a596-4e658bb14110` reached an active terminal. Shell input, guidance insertion, BigQuery MCP registration, Claude Code launch, and a real read-only schema/funnel query succeeded. Guidance → Mark this step → Review finding saved the schema evidence and advanced to `data_layout`. A new browser connection restored the saved finding and active step. The connection milestone resets until terminal signals are detected again; the apparent 3/9 → 2/9 change was not lost checkpoint evidence.

The canary's observed gateway spend was $0.3959818 against a $0.50 key budget. Its 40-cent rounded spend was already recorded idempotently. The session expired at 08:05 UTC, its revision was absent on fresh GCP inspection, and Supabase showed zero active/provisioning sessions. Cloud SQL was then restored to STOPPED/NEVER. Key expiration is provided by the existing TTL; explicit key deletion after expiration was not independently verified after database shutdown. This canary establishes terminal, query, checkpoint, reconnect, spend recording, and expired-compute cleanup; it does not establish the full report/skill/final-grade journey.

Observed defects addressed in the pending patch:

- The usage meter previously read token columns that the container never emits, displaying $0.00 after real requests. It now performs a bounded, exact-alias gateway lookup and shows unavailable state instead of invented zero usage when that lookup fails.
- Retried provisioning also clears stale failure codes/phases. A live shell awaiting setup is labeled “Set up your analyst.”
- Finalization now includes saved findings and complete scenario context, verifies uploaded report/current-skill evidence, and waits for post-checkpoint storage timestamps before teardown. Report/skill signals persist in the existing artifact; normal Claude write output and absolute persistent skill paths are supported.
- Storage timestamps describe upload completion, not archive capture start. Rewriting an existing file during an overlapping upload still needs capture metadata or a content hash for a strict freshness guarantee. This remains a release limitation, not proof of exact final-snapshot synchronization.
- The checkout seed copy now matches the real `event_name` and `ts` schema. Existing hosted challenge metadata remains stale until a deliberate content update; the broad seeding script was not run.
- Practice fallback recommendations no longer use “rep” language, and its stacked header geometry uses the same lighter opacity as Home. The Practice CSS passes a rendered 390px check on deployment dpl_A3gnPpgwaKZ9fUJ6zvWdBP8yBX2a: readable paragraph, document width 384 and viewport 390.

On the 390px browser viewport, Library → Gmail Undo Send, story saving, mobile contents expansion and Sources jump worked without document overflow. Progress's first-challenge empty state and Practice's SQL filter worked. The SQL refund-rate workspace switched Brief/Your work, accepted query input, passed 3/3 visible cases and 5/5 submitted cases (including hidden zero-order sellers). SQL feedback then returned 7.2/10 with correctness, approach and code-quality evidence. These checks used the dedicated canary account. The completed SQL attempt appears in Recent work, but the overview incorrectly reports zero completed challenges; a targeted Progress fix is in progress. Physical devices and full tablet/desktop journey coverage remain open.

The pending patch passes 498 Node tests and 220 Vitest tests across 26 Vitest suites. Targeted lint and TypeScript pass; the production build passes. Commit `66661497` is pushed and preview deployment dpl_A3gnPpgwaKZ9fUJ6zvWdBP8yBX2a is READY. Hosted test billing remains disabled pending isolated staging cost approval. Full deployed spoken voice remains unverified. PR #20 stays draft and unmerged.

The Progress follow-up fixes the 1,000-row Supabase response cap by paging the published catalog and completed attempts, deduplicating repeat attempts with their best normalized score, and retaining distinct historical completions. The named canary account derives one completed challenge and zero scores at 80+, as expected for its 72% overall score. The coverage label now says Practice coverage; loading/errors show a dash and provide retry rather than a false zero. Four targeted tests, lint, TypeScript and the production build pass. Hosted verification is pending this follow-up deployment.
