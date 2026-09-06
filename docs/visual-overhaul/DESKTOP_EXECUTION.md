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
