# September platform rebuild: release decision and rollback

Status: not approved for production. This runbook covers `feat/platform-rebuild-20260905` and draft PR #20. The July `redesign-rollback.md` describes a different release and must not be used as this branch's compatibility assessment.

## Verified baseline

On September 6, Vercel's alias API resolves `hackproduct.com` to production deployment `dpl_Bu9aXFufzXtbJvY9xNPdAbqfVXyH`, commit `c2c4d6e4f7267b7bf4538381c0133648e5f989fc`. That deployment is READY. Recheck the serving alias immediately before any future release; a deployment appearing in the production list alone is insufficient.

The latest verified rebuild preview is commit `b01d65855e1620731a950cfe26a980b2e98ceb8b`, deployment `dpl_3Mhe4EHhhtsCVNW3Lcyj8tTm8oJh`. Vercel reports it READY at the exact feature-branch alias. Its 31 branch-specific Preview variables were unchanged and all predated the build. The candidate production build, focused cancellation tests, targeted lint, diff check, and staged secret scan pass.

GCP's gateway still serves `cc-llm-gateway-00017-4xb` at 100% traffic. Cloud SQL `cc-llm-db` was freshly verified STOPPED/NEVER. No gateway traffic change, database consolidation, production promotion or main merge is authorized by this runbook.

## Requirement audit

| Requirement from handoff | Evidence and status | Evidence still required |
| --- | --- | --- |
| 1. Correct branch, source integration and preserved local work | Branch and draft PR recovered; source landing/auth from `feat/full-product-redesign` integrated in `522b48ba`; user untracked files preserved | Recheck head/deployment match for final release candidate |
| 2–3. Approved plan and product/design contract | Four destinations, contextual Hatch, editorial landing/auth, quiet workspaces/readers integrated; real content and safe auth controller retained | Complete visual/accessibility/motion matrix below |
| 4. Preserve real learning workflows | Historical authenticated coding/canvas/reader/chat evidence in INTEGRATION_STATUS; latest mobile SQL submit, saved feedback and Progress count verified | Recheck representative unchanged workflows on final candidate after remaining changes |
| 5. Vercel, Stripe test, GCP and Supabase access | Exact `b01d6585` preview binding verified; isolated staging has 181 source migrations and synthetic users; Stripe TEST Checkout and portal journeys passed | Recheck production identities and aliases immediately before an approved release |
| 6. Gateway and analytics lifecycle | Separate staging sandbox, gateway, database, identity, and cleanup exist; failed runs preserved key/spend evidence and cleanup state | A fresh explicitly approved learner canary must pass report, skill, final grade, spend, key block, and revision cleanup |
| 6. Safety invariants | TTL and spend caps, uncapped-fallback denial, fenced provisioning, etag/tag preservation, and retained key records are tested | Keep the reaper and compatible session handlers; rerun the bounded staging canary only after a new GO |
| 7. Isolated billing | TEST checkout, signed event processing, duplicate/delayed delivery, entitlement changes, portal cancellation, and cleanup passed; client RPC grants are restricted | Production migration/cutover rehearsal and approval; no production entitlement write has occurred |
| 8. Spoken voice | Flux/Nova handshakes and lifecycle regressions pass; a staging room can reach microphone readiness | User microphone participation, real spoken turns/transcription/audio, persisted debrief, and teardown proof |
| 8. Actual responsive coverage | On `ebd506fd`, coding reached 7/7 with detailed 7.4/10 feedback and reopened through Submissions/Progress; phone Run/Submit/fullscreen passed; canvas passed phone/tablet/desktop clearance and navigation; phone reader passed | Verify immediate Settings reconciliation after the successful billing action and run reduced-motion coverage in an environment that exposes the OS preference |
| 9. Checks, evidence and release/rollback | `b01d6585` is READY; builds and focused checks pass; evidence and compatibility review are maintained | Resolve remaining gates, review the final candidate, and record an explicit production decision |

Staging testing remains isolated from production. The third analytics run exposed a missing repository read permission, now repaired with repository-scoped access. The fourth run on `cf7e9fee` reached a real terminal, saved six assessed checkpoints, and passed reconnect continuity, but could not read the expected reusable skill before finalization. Authoritative cleanup checks pass despite a harness CLI-message mismatch: the owned revision is absent, the retained key is blocked, the session is ended, and billing/access are Free. Provider spend was `$0.4924225` against the configured `$0.49` budget; the database records 49 cents. Recorded standard-card Checkout, portal, and responsive checks pass. Keep Pro and completion-URL corrections passed deployed checks on `b01d6585`; immediate Settings reconciliation remains under repair. Analytics finalization, reduced-motion coverage, and user microphone participation remain open.

## Production migration compatibility audit — `cf7e9fee`

No production migration, provider configuration change, webhook pause, entitlement write, or analytics session was performed during this audit.

Apply the five new source migrations in filename order during one controlled release window, before the new application handles traffic:

| Order | Migration | Required compatibility condition |
| --- | --- | --- |
| 1 | `20260906120000_stripe_event_processing_state.sql` | Adds backward-readable claim columns with existing rows classified as processed, then creates the claim/complete/release/payment-failure RPCs. Pause Stripe delivery and drain legacy webhook invocations first; a legacy handler can insert an event row before finishing its side effects. |
| 2 | `20260906130000_restrict_stripe_event_processing_rpc_access.sql` | Reasserts that only `service_role` can call the new security-definer RPCs. Apply immediately after `120000` while delivery remains paused. |
| 3 | `20260906140000_profiles_subscription_status.sql` | Adds the nullable profile mirror required by the new profile query, webhook writes, entitlement hard revokes, and the payment-failure RPC created in `120000`. Do not invoke the new RPC or deploy the new handlers before this migration is present. |
| 4 | `20260906150000_create_private_cc_snapshot_buckets.sql` | Creates or normalizes the two private snapshot buckets and denies client access while preserving service-role access. Apply before the new snapshot routes or provenance-aware container are admitted. |
| 5 | `20260906160000_scope_catalog_admin_policies.sql` | Narrows the two existing admin policies to authenticated clients. The named policies exist in production source history; public published-read policies remain separate. |

After all five migrations validate, deploy the exact reviewed handler set, re-enable Stripe delivery, and inspect unfinished claims and canonical subscription state. Keep the migrations applied during an application rollback; they are additive or access-narrowing and remain readable by `c2c4d6e4`.

## Release order, after gates and approval

1. Record the final commit, preview deployment and container image digest. Export a non-secret inventory of configuration names/scopes and secure backups of existing values. Revalidate provider identities, production alias, current gateway traffic and active sessions.
2. Finish the open staging gates without changing production: explicit cancellation rendering, completion-URL pinning, reduced-motion coverage where the OS preference is available, spoken voice participation, and a separately authorized analytics canary.
3. After an explicit production decision, pause Stripe webhook delivery and wait for legacy invocations to drain. Record the last delivered event and verify there is no unresolved provider-side delivery before changing the schema.
4. Apply and validate migrations `20260906120000` through `20260906160000` in exact filename order. Keep webhook delivery paused until `120000`, `130000`, and `140000` are all present and the new compatible webhook handler is serving.
5. Promote only the reviewed application, image, and configuration combination. Re-enable Stripe delivery and verify claims, entitlement state, aliases, authentication, saved work, real API errors, analytics session cleanup, and no unexpected production resource activation.

## Rollback compatibility

### Preview snapshot provenance rollout

Build the reviewed sandbox source under a unique Artifact Registry tag and record its immutable digest. Do not overwrite `sandbox:mvp` or use the historical README's shared-service deployment command. Set `CLOUD_RUN_IMAGE` only for this feature branch's Vercel preview, then deploy its matching API. In isolated staging, preserve `CLOUD_RUN_BASE_REVISION=cc-sandbox-staging-00002-wm4` as the sterile traffic anchor. The production base is a separate configuration and must be revalidated before an approved release. Preserve other revision tags and the reaper.

Before claiming the gate passed, use a new isolated canary session to verify capture-start headers, immutable workspace and skill archive pointers, report and skill checkpoint finalization, and cleanup. Old containers can still upload restorable legacy snapshots, but those upload timestamps cannot prove that file evidence was captured after a checkpoint. Do not claim strict freshness for those sessions. Capture timestamps also depend on the trusted runtime's synchronized clock; they are not independent proof against a modified container.

### Compatibility by subsystem

**Application presentation:** prefer a targeted forward revert of the affected frontend commit while keeping compatible billing/session handlers. Never replace the whole branch with the old landing source. Retain saved drafts, attempts, snapshots and new additive artifact fields.

**Billing:** the prior production handler at `c2c4d6e4` inserts `stripe_events.id` before processing and acknowledges every unique-key conflict as a duplicate. New code can leave `processing` or `failed` rows for legitimate retries. Therefore a full rollback to that prior handler can acknowledge incomplete deliveries without applying their effects. The backward-readable schema does not make that handler rollback safe. Keep the compatible webhook route serving during a presentation rollback. Before any full handler rollback, pause delivery, wait at least through the configured maximum invocation window, let active 120-second claim leases expire, and reconcile every `processing` or `failed` event with canonical Stripe and subscription state. Preserve event IDs and effect markers; never delete rows or blindly replay historical events. Keep the signing secret, endpoint mode, and runtime mode paired. Leave migrations `120000`–`140000` installed.

**Analytics:** the new snapshot routes accept headerless legacy containers and retain their legacy object paths. The private-bucket migration and immutable v2 objects can remain installed, and existing profile/session pointers remain valid. A rollback to `c2c4d6e4` would discard strict capture provenance, fenced provisioning recovery, real spend reads, and immediate key blocking. Keep the compatible start/provision/state/snapshot/user-state/finalize route set until every live or fresh-provisioning session created by the new container has ended. Inspect active rows and tagged revisions before changing container defaults or gateway configuration. Retain the reaper, private buckets and their referenced objects, virtual-key enforcement, and any v2 object addressed by a profile or session pointer. Do not stop SQL while a live or fresh-provisioning session depends on it.

**Infrastructure:** the separate Supabase/LiteLLM migration remains subject to backup, replacement canary, no-live-reference checks and 24-hour observation. No Cloud SQL, service account, key or historical resource deletion follows merely from this app release.

## Post-release or post-rollback proof

Verify the serving deployment SHA, auth return destinations, existing draft hydration, real challenge execution/submission/feedback and saved reading state. Inspect Stripe failures and unfinished claims, reconcile entitlement state, and confirm test/live separation. Run a bounded analytics session and verify final artifacts, recorded spend, key cleanup and released compute. Check microphone teardown and persisted interview debrief. Keep PR #20 draft until the pre-release evidence is complete; do not mark this goal complete from a green build alone.

## Staging analytics isolation prerequisite

The isolated Supabase database cannot safely use the production analytics compute configuration. The production `cc-reap` endpoint enumerates session revisions across its configured Cloud Run service and treats revisions absent from its database as orphans. It also stops its configured gateway SQL instance when its own database has no active or fresh provisioning sessions. A staging session on the shared service could therefore be deleted, and a staging reaper could interfere with production sessions.

Read-only GCP inventory on 2026-09-06 found only `cc-sandbox`, `cc-llm-gateway`, and SQL instance `cc-llm-db` (STOPPED, activation policy NEVER). Before the staging analytics canary, provide a separate sandbox service, separate budget-enforcing gateway database and gateway, and staging-scoped scheduled cleanup. Use the immutable candidate sandbox image, a sterile base revision, unique session-token credentials, capped virtual keys, TTL at most 1800 seconds, and the existing etag/tag-preservation logic. Public BigQuery exercise reads may remain shared; private snapshots and application state must resolve to staging. Do not invoke the staging reaper against production compute or disable production cleanup to accommodate the canary.

Branch-only compute settings now point to the isolated staging services, and repository download access is scoped only to the staging orchestrator on repository `cc`. This isolation prerequisite is complete, but the three failed learner runs are not evidence of a passed analytics canary.

## Staging evidence chronology

The isolated replay now records 180 source migrations. Hosted testing exposed a missing `profiles.subscription_status` column and missing private analytics snapshot buckets; additive migrations `20260906140000` and `20260906150000` now establish them in source and staging. The profile endpoint authenticates the staging-owned user and returns a free baseline. Public pricing resolves the verified Stripe test prices. The first checkout API attempts failed with `customer_tax_location_invalid`, creating no Checkout Session; the candidate now supplies `customer_update.address=auto` for verified customers while preserving automatic tax and required billing address collection.

Candidate `471b7ada` completed the genuine Stripe TEST subscription lifecycle, including duplicate and delayed delivery and cancellation restoring Free access. Commit `ebd506fd` then passed the recorded desktop/phone/tablet canvas checks, phone reader check, and real coding run, submit, grading, feedback, and saved-result reopening checks. Its third analytics learner run failed before revision creation on missing repository download permission; cleanup and evidence preservation passed, and the least-privilege IAM repair is complete without a rerun.

Candidate `cf7e9fee` is READY as `dpl_Dx6SmBJWu21T5XmZvc4QZ1GPCXud`. The browser verifies that an explicit future `cancel_at` with `cancel_at_period_end=false` displays Access ends and Keep Pro. Reactivation fails because Stripe rejects receiving both cancellation parameters together; the failed fixture was canceled with its deletion event processed once. A conditional single-parameter correction and completion-URL pinning now pass focused tests, TypeScript, and the production build, but await deployment and browser proof. Complete analytics finalization, reduced-motion coverage, and live microphone participation remain open. See the staging runbooks for exact identifiers, preserved failure state, and cleanup instructions.

## Observed candidate b01d6585

Candidate `b01d65855e1620731a950cfe26a980b2e98ceb8b` is READY as `dpl_3Mhe4EHhhtsCVNW3Lcyj8tTm8oJh`, with the same 31 branch-only preview bindings. Keep Pro now succeeds in Stripe and the signed webhook; reload shows next billing. Its exact fixture cleanup restored Free and zero nonterminal subscriptions. An immediate Settings refresh race remains under repair. Coding completion now pins attempt `d2094b0c-1273-4fd6-a10e-d165e188dca6`; direct reload preserved all seven passing tests, 7.4/10 feedback, and source. These observations supersede earlier pending-deployment statements for those two fixes. Analytics artifact recovery/finalization, spoken voice, and reduced-motion coverage remain open.
