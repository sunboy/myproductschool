# September platform rebuild: release decision and rollback

Status: not approved for production. This runbook covers `feat/platform-rebuild-20260905` and draft PR #20. The July `redesign-rollback.md` describes a different release and must not be used as this branch's compatibility assessment.

## Verified baseline

On September 6, Vercel's alias API resolves `hackproduct.com` to production deployment `dpl_Bu9aXFufzXtbJvY9xNPdAbqfVXyH`, commit `c2c4d6e4f7267b7bf4538381c0133648e5f989fc`. That deployment is READY. Recheck the serving alias immediately before any future release; a deployment appearing in the production list alone is insufficient.

The latest verified rebuild preview is commit `9d286728`, deployment `dpl_EBFK62YePEh2jsuhTuyH4oMTXBmT`. It passes build/TypeScript, 498 Node tests, 220 existing Vitest tests, and four additional Progress tests. The final deployed Progress check shows the dedicated account's completed SQL challenge as one completion. Its phone viewport is 390px, document width 384px, with no horizontal overflow. SQL submission passed five tests and saved/restored 7.2/10 feedback.

GCP's gateway still serves `cc-llm-gateway-00017-4xb` at 100% traffic. Cloud SQL `cc-llm-db` was freshly verified STOPPED/NEVER. No gateway traffic change, database consolidation, production promotion or main merge is authorized by this runbook.

## Requirement audit

| Requirement from handoff | Evidence and status | Evidence still required |
| --- | --- | --- |
| 1. Correct branch, source integration and preserved local work | Branch and draft PR recovered; source landing/auth from `feat/full-product-redesign` integrated in `522b48ba`; user untracked files preserved | Recheck head/deployment match for final release candidate |
| 2–3. Approved plan and product/design contract | Four destinations, contextual Hatch, editorial landing/auth, quiet workspaces/readers integrated; real content and safe auth controller retained | Complete visual/accessibility/motion matrix below |
| 4. Preserve real learning workflows | Historical authenticated coding/canvas/reader/chat evidence in INTEGRATION_STATUS; latest mobile SQL submit, saved feedback and Progress count verified | Recheck representative unchanged workflows on final candidate after remaining changes |
| 5. Vercel, Stripe test, GCP and Supabase access | Desktop access verified; isolated staging approved; staging schema and synthetic login verified | Branch-only staging binding and hosted provider journeys |
| 6. Gateway and analytics lifecycle | $0.01 gateway request/revocation; real terminal/MCP/Claude/BigQuery; schema checkpoint and reconnect; spend recording and expired-revision cleanup passed | Full report/skill/final-grade lifecycle; explicit session-key cleanup proof; final live usage display; snapshot capture provenance rollout; retry from quota/staging account |
| 6. Safety invariants | `cost-policy.ts` caps TTL at 1800 seconds and model spend at $0.50 by default; production uncapped fallback disabled; etag/preserved-tag/base-revision tests pass | Final candidate create/finalize/cleanup and conflict canary; do not remove reaper |
| 7. Isolated billing | Test key/mode/signature guards and fenced claims tested; hosted staging claim lifecycle verified; client RPC grants corrected | Additive ACL migration regression, branch isolation, test checkout, signed delivery, entitlement/access changes, portal, cancellation, duplicate and delayed delivery; no production entitlement writes |
| 8. Spoken voice | Flux/Nova handshakes accepted; lifecycle regressions pass | Explicit microphone readiness, real spoken turns/transcription/audio, persisted debrief, failure/navigation cleanup and fallback |
| 8. Actual responsive coverage | Landing and Settings at 390/768/1440; Home/Progress phone/tablet; Library/SQL phone; coding run failure→retry→7/7 submit and saved 6.6/10 feedback; phone canvas starter fit, template controls and saved write-up | Deployed tablet canvas clearance and desktop canvas/coding; saved coding feedback reopening; interview/billing; reader position; remaining 3-width, keyboard/touch/dialog, reduced-motion and error/retry checks |
| 9. Checks, evidence and release/rollback | Builds/tests pass for published code; evidence and PR maintained; this compatibility review prepared | Remaining gate evidence, final reviewed candidate, explicit release decision |

Staging testing at $0.01344/hour (about $0.32/day) is now approved. The isolated database `fkqsjjiunvvclwtgjqyc` passes schema and test-login checks; preview environment binding and hosted billing tests remain in progress. Browser access resumed and enabled further coding/canvas/account checks, then the Mac locked again. Full spoken voice still needs live microphone participation. A second analytics start previously hit the production-backed canary account's monthly quota before creating compute; continue the finalization canary with a staging-owned account.

## Release order, after gates and approval

1. Record the final commit, preview deployment and container image digest. Export a non-secret inventory of configuration names/scopes and secure backups of existing values. Revalidate provider identities, production alias, current gateway traffic and active sessions.
2. Establish the approved isolated staging schema. Legacy migration replay previously failed on duplicate RLS policies; validate a repaired replay or schema-only baseline before attaching staging to the preview. Do not copy production users or payments into test data.
3. Apply and validate `20260906120000_stripe_event_processing_state.sql` in staging before enabling new webhook code. Register only the test webhook, set its preview-only signing secret and test configuration, and finish the documented test journeys.
4. Validate the analytics container/API pairing and complete the report/skill/finalization canary with the current image. Preserve the sterile base, existing session tags, etag conflict protection, reaper, TTL and gateway budget. Do not bundle the proposed database/identity infrastructure migration into this application release.
5. Close voice and responsive gates. Record actual browser widths and limitations; container-width and mocked checks remain separate evidence.
6. After a production decision, apply additive billing schema changes before deploying compatible billing handlers. Promote only the reviewed application/image/configuration combination. Verify serving aliases, authentication, saved work, real API error rates, webhook processing states and session cleanup.

## Rollback compatibility

### Preview snapshot provenance rollout

Build the reviewed sandbox source under a unique Artifact Registry tag and record its immutable digest. Do not overwrite `sandbox:mvp` or use the historical README's shared-service deployment command. Set `CLOUD_RUN_IMAGE` only for this feature branch's Vercel preview, then deploy its matching API. The provider supplies that image when creating new session revisions; keep `CLOUD_RUN_BASE_REVISION=cc-sandbox-00165-p9h` as the existing sterile traffic anchor. Preserve other revision tags and the reaper.

Before claiming the gate passed, use a new isolated canary session to verify capture-start headers, immutable workspace and skill archive pointers, report and skill checkpoint finalization, and cleanup. Old containers can still upload restorable legacy snapshots, but those upload timestamps cannot prove that file evidence was captured after a checkpoint. Do not claim strict freshness for those sessions. Capture timestamps also depend on the trusted runtime's synchronized clock; they are not independent proof against a modified container.

### Compatibility by subsystem

**Application presentation:** prefer a targeted forward revert of the affected frontend commit while keeping compatible billing/session handlers. Never replace the whole branch with the old landing source. Retain saved drafts, attempts, snapshots and new additive artifact fields.

**Billing:** the prior production handler at `c2c4d6e4` inserts `stripe_events.id` before processing and acknowledges every unique-key conflict as a duplicate. New code can leave `processing` or `failed` rows for legitimate retries. Therefore a full rollback to that prior handler can acknowledge incomplete deliveries without applying their effects. The additive migration being backward-readable does not make this handler rollback safe. Keep a verified compatible handler serving while reverting presentation, or quiesce billing changes and reconcile every unfinished event with the compatible processor before re-enabling an older route. Preserve Stripe event IDs and effect markers; never delete event rows or blindly replay historical events to force delivery. Check canonical subscription state and event-specific side effects. Keep webhook signing secret, endpoint mode and runtime mode paired.

**Analytics:** keep compatible snapshot/finalization readers until every live session created by the new container has ended. Inspect active/fresh-provisioning rows and tagged revisions before changing container defaults or gateway configuration. If a canary fails, stop admitting new sessions through the existing access gate, retain the reaper and restore only the recorded configuration/image that is compatible with existing sessions. Do not stop SQL while any live/fresh provisioning session depends on it. Do not remove virtual-key budget enforcement as a recovery path.

**Infrastructure:** the separate Supabase/LiteLLM migration remains subject to backup, replacement canary, no-live-reference checks and 24-hour observation. No Cloud SQL, service account, key or historical resource deletion follows merely from this app release.

## Post-release or post-rollback proof

Verify the serving deployment SHA, auth return destinations, existing draft hydration, real challenge execution/submission/feedback and saved reading state. Inspect Stripe failures and unfinished claims, reconcile entitlement state, and confirm test/live separation. Run a bounded analytics session and verify final artifacts, recorded spend, key cleanup and released compute. Check microphone teardown and persisted interview debrief. Keep PR #20 draft until the pre-release evidence is complete; do not mark this goal complete from a green build alone.

## Staging analytics isolation prerequisite

The isolated Supabase database cannot safely use the production analytics compute configuration. The production `cc-reap` endpoint enumerates session revisions across its configured Cloud Run service and treats revisions absent from its database as orphans. It also stops its configured gateway SQL instance when its own database has no active or fresh provisioning sessions. A staging session on the shared service could therefore be deleted, and a staging reaper could interfere with production sessions.

Read-only GCP inventory on 2026-09-06 found only `cc-sandbox`, `cc-llm-gateway`, and SQL instance `cc-llm-db` (STOPPED, activation policy NEVER). Before the staging analytics canary, provide a separate sandbox service, separate budget-enforcing gateway database and gateway, and staging-scoped scheduled cleanup. Use the immutable candidate sandbox image, a sterile base revision, unique session-token credentials, capped virtual keys, TTL at most 1800 seconds, and the existing etag/tag-preservation logic. Public BigQuery exercise reads may remain shared; private snapshots and application state must resolve to staging. Do not invoke the staging reaper against production compute or disable production cleanup to accommodate the canary.

While billing isolation is configured, branch-only compute settings are being gated to prevent accidental use of the shared service or SQL instance. This prerequisite is open and is not evidence of a passed analytics canary.

## Staging candidate 2c1a0bd6

The isolated replay now records 180 source migrations. Hosted testing exposed a missing `profiles.subscription_status` column and missing private analytics snapshot buckets; additive migrations `20260906140000` and `20260906150000` now establish them in source and staging. The profile endpoint authenticates the staging-owned user and returns a free baseline. Public pricing resolves the verified Stripe test prices. The first checkout API attempts failed with `customer_tax_location_invalid`, creating no Checkout Session; the candidate now supplies `customer_update.address=auto` for verified customers while preserving automatic tax and required billing address collection.

The candidate production build passes. Focused billing tests pass (40), and both hosted storage contracts pass. The dedicated test webhook is registered but disabled, with its own signing secret scoped to the feature preview. Separate analytics services use the tested immutable sandbox image, a sterile base, private gateway schema, and an orchestrator denied access to production sandbox and SQL. Staging-only scheduled cleanup and real gateway spend/enforcement now pass: the probe recorded $0.00002, rejected a request after its budget was lowered below spend, and revoked its key. The next learner canary is capped at $0.49. Genuine Stripe creation, duplicate, and delayed delivery passed; cancellation exposed stale profile mirrors. The forward fix now clears them while preserving distinct newer Pro or Analytics entitlements, passes 38 focused tests and the production build, and awaits a clean hosted rerun. Complete analytics finalization remains open. See staging runbooks for exact resource identifiers and cleanup instructions.
