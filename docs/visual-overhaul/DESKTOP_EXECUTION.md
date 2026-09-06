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
