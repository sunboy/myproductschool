# Staging analytics isolation evidence

Captured at `2026-09-06T16:44:02Z` for Supabase branch `platform-rebuild-staging-20260906-r2` (`fkqsjjiunvvclwtgjqyc`) and GCP project `hackproduct`. Analytics access remains disabled and no learner session has been started.

## Private LiteLLM database

- The existing staging-only `litellm` schema contains 65 initialized tables.
- The dedicated `litellm_staging` login is `NOINHERIT`, has a connection limit of 2, and cannot create roles or databases, replicate, bypass RLS, or act as superuser.
- The login has `CONNECT` on the staging database and `USAGE, CREATE` on `litellm`. It cannot select `public.profiles` and has no grants on application tables.
- `PUBLIC`, `anon`, `authenticated`, and `authenticator` have no schema or table grants in `litellm`.
- PostgREST rejects `Accept-Profile: litellm` with HTTP 406 because the schema is not exposed.

The first gateway attempt used PostgreSQL `options=search_path`. LiteLLM's Prisma bootstrap still inspected `public`, failed on a cross-schema application foreign key, and logged the staging database URL. The failed service was deleted, its sessions were terminated, and the staging password was immediately rotated. The active gateway uses Prisma's explicit `schema=litellm` URL. The `_Default` logging exclusion `cc-staging-db-url-redaction` now drops database-URL-bearing entries only for `cc-llm-gateway-staging`; the exclusion is not retroactive.

## Isolated Cloud Run services

| Service | Immutable image | Runtime identity | Scaling | Cloud SQL |
| --- | --- | --- | --- | --- |
| `cc-llm-gateway-staging` | `us-central1-docker.pkg.dev/hackproduct/cc/llm-gateway@sha256:a8a73e5652dde6ae32894dc7972070df250e16a4c329a61346386f4d23584b47` | `cc-gateway-staging@hackproduct.iam.gserviceaccount.com` | min 0, max 1 | none |
| `cc-sandbox-staging` | `us-central1-docker.pkg.dev/hackproduct/cc/sandbox@sha256:3e03c5c6933adbba0bb3affc0485f8287748f2eec270bb9face37ebce7e82004` | read-only `cc-bq-readonly@hackproduct.iam.gserviceaccount.com` | min 0, max 1 | none |

Both services are ready. The gateway revision is `cc-llm-gateway-staging-00002-nkt`. The sterile sandbox base revision is `cc-sandbox-staging-00002-wm4`, built from snapshot-smoke-tested build `ad2765ea-76e2-4573-9e0d-976ded932273`. It has zero environment keys and contains no session IDs, session tokens, snapshot URLs, restore URLs, learner data, or idle instance allocation.

`cc-staging-orchestrator@hackproduct.iam.gserviceaccount.com` has `roles/run.developer` only on `cc-sandbox-staging` and `roles/iam.serviceAccountUser` only on the read-only sandbox runtime identity. The final access-token check returned HTTP 200 for the staging sandbox and HTTP 403 for production `cc-sandbox`. Earlier boundary checks also returned HTTP 403 for GCP administration of the staging gateway and production Cloud SQL. Gateway key operations use the staging master key over HTTP and `/key/list` returned HTTP 200.

Production `cc-sandbox`, `cc-llm-gateway`, traffic, revisions, credentials, and IAM were not changed. Production `cc-llm-db` remains `STOPPED` with activation policy `NEVER`.

## Bounded gateway probe

The gateway readiness endpoint returned HTTP 200. An initial control key with a `$0.01` maximum budget and 300-second duration was generated and immediately deleted without a model request.

A second unique key used the same `$0.01` cap and 300-second duration for one minimal Haiku request. The request returned HTTP 200 and persisted exactly `$0.0000200000000000` across 16 tokens in one `LiteLLM_SpendLogs` row. Lowering the key budget below its recorded spend caused the next request to return HTTP 429. The key was revoked and its alias is absent.

Actual staging spend is `$0.00002`, leaving `$0.49998` of the total allowance. The configured learner session ceiling is `$0.49` because application budgets use cent precision. The later report, reusable-skill, and final-grade learner canary must remain within that ceiling.

## Preview binding

The ready analytics-bound deployment is `dpl_2rYFHG8mPDrs1PkiUAZZXLkJfxFj` at commit `2c1a0bd6b1fadad621a0113687cc9ede16113c74`. Its feature-branch alias is `https://myproductschool-git-feat-platform-rebu-249507-sunboy2s-projects.vercel.app`; profile and prices checks returned HTTP 200 with staging identity.

All local credential copies are stored only in the ignored, mode-0600 file `/Users/sandeep/Projects/myproductschool/.env.staging.local`. Gateway runtime values are staging-only Cloud Run environment variables because Secret Manager is not enabled. Do not copy their values into documentation or shell history.

| Preview variable | Local source key |
| --- | --- |
| `GCP_PROJECT` | `STAGING_GCP_PROJECT` |
| `CLOUD_RUN_REGION` | `STAGING_CLOUD_RUN_REGION` |
| `CLOUD_RUN_SERVICE` | `STAGING_CLOUD_RUN_SERVICE` |
| `CLOUD_RUN_BASE_REVISION` | `STAGING_CLOUD_RUN_BASE_REVISION` |
| `CLOUD_RUN_RUNTIME_SA` | `STAGING_CLOUD_RUN_RUNTIME_SA` |
| `CLOUD_RUN_IMAGE` | `STAGING_CLOUD_RUN_IMAGE` |
| `CLOUD_RUN_SA_JSON` | `STAGING_CLOUD_RUN_SA_JSON` |
| `SANDBOX_WSS_HOST` | `STAGING_SANDBOX_WSS_HOST` |
| `LLM_GATEWAY_URL` | `STAGING_LLM_GATEWAY_URL` |
| `LLM_GATEWAY_MASTER_KEY` | `STAGING_LITELLM_MASTER_KEY` |
| `SESSION_TOKEN_SECRET` | `STAGING_SESSION_TOKEN_SECRET` |
| `CRON_SECRET` | `STAGING_CRON_SECRET` |
| `CC_SESSION_BUDGET_USD` | `STAGING_CC_SESSION_BUDGET_USD` (`0.49`) |
| `CC_MAX_SESSION_BUDGET_USD` | `STAGING_CC_MAX_SESSION_BUDGET_USD` (`0.49`) |
| `CC_MAX_SESSION_TTL_SECONDS` | `STAGING_CC_MAX_SESSION_TTL_SECONDS` (`1800`) |
| `CC_ALLOW_UNCAPPED_LOCAL` | `STAGING_CC_ALLOW_UNCAPPED_LOCAL` (`false`) |

Leave `CC_SQL_INSTANCE` unset or blank and set `CC_SQL_WAKE_MS=0`. The preview must continue to use the staging Supabase URL and service-role key stored in the same local file. This keeps `cc-reap` queries on staging session rows and its Cloud Run client on `cc-sandbox-staging`. The orchestrator IAM boundary prevents access to the production sandbox even if a service name is misconfigured.

## Snapshot storage

The current routes use private bucket `cc-sessions` for workspace snapshots and private bucket `cc-user-state` for reusable user state; there is no `cc-workspaces` route bucket. Additive migration `20260906150000_create_private_cc_snapshot_buckets.sql` creates both buckets idempotently, forces any pre-existing copy back to private, and installs a restrictive client-deny policy scoped only to those two bucket IDs.

Staging records 180 source migrations with `20260906150000` latest, and migration dry run reports the database is up to date. Both buckets have no file-size or MIME restriction, matching production's read-only metadata. The restrictive policy covers `anon` and `authenticated`.

`tests/unit/cc-snapshot-storage.test.ts` starts with both buckets public inside a database transaction, applies the migration twice, verifies repaired private state and restrictive policy, then rolls back. Its Storage API contract covers service-role upload, anonymous denial, authenticated denial, public-URL denial, signed download, overwrite, retained-object listing, updated signed download, and deletion for unique objects in both buckets. The lifecycle checks passed and cleanup left zero probe objects and zero total objects in the new buckets.

## Scheduled cleanup

The staging database has `pg_cron`, `pg_net`, and two staging-only Vault entries named `cc_reap_staging_url` and `cc_reap_staging_cron_secret`. Its only cron job is ID 3, `cc-reap-staging-10min`, on `*/10 * * * *`. The stored command reads only those Vault entries and contains no production project reference or Cloud Run service literal.

The job was created inactive in one transaction and did not fire before validation. With the job still inactive, the exact stored command was submitted once through `pg_net` as request ID 1. `net._http_response` recorded HTTP 200, no timeout, and no error. The response reported zero sessions scanned or reaped, zero deferred sessions, zero failures, zero orphans scanned or reaped, idle spend skipped, and `sql_stopped=false`. The staging `claude_code_sessions` table remained empty. The production sandbox access check remained HTTP 403 and production `cc-llm-db` remained `STOPPED/NEVER`.

After those checks passed, `cron.alter_job(3, active := true)` enabled the job. `cron.job` now records `active=true` on `*/10 * * * *`. Keep `cc_analytics_access` disabled and do not start a learner session until the separate learner-canary gate is authorized.

## Cleanup

Before removing the isolated setup, confirm no preview variables or session rows reference it. Delete only `cc-sandbox-staging`, `cc-llm-gateway-staging`, the staging orchestrator key and staging service accounts, the staging-only logging exclusion, and the local staging environment file. Deleting the Supabase branch removes its `litellm` tables and dedicated database login. Do not alter production Cloud Run services, production Cloud SQL, shared runtime identity, production cron jobs, or production credentials.
## Ended-session credential cleanup follow-up

Source review before the learner canary found that the existing key-revocation helper had no application callers. Finalization, expiry, failed provisioning, and reaping now block the exact session key through LiteLLM `/key/block`, retaining the key record for spend reconciliation. Lookup requires both the exact alias and matching mint metadata. Already-blocked records are idempotent; unavailable spend stays null, distinct from a genuine zero. Provider errors return bounded, allow-listed reasons rather than key-bearing response bodies.

Provisioning failure cleanup requires winning the `provisioning` to `failed` database transition before blocking the key or destroying its deterministic host, protecting a concurrent request that already activated the session. Reaper retries are bounded and gated on existing active/provisioning work, preserving idle gateway/Cloud SQL behavior. TTL remains the fallback if blocking is temporarily unavailable.

Validation: gateway/provision/reaper focused checks passed 5/5; finalize route checks passed 10/10; targeted lint and independent review passed. The final production build and full TypeScript check passed. Four migration-test child-process environments now explicitly set `NODE_ENV=test`, resolving their TypeScript environment-shape errors. These checks establish code behavior; the new deployment still requires the genuine learner canary to verify blocked-key retention, final spend persistence, and revision cleanup. No learner session was started for this source review.

## Aborted analytics entitlement canary

The first approved canary against deployment `dpl_6ntuvPCynQLVqhbFEVfoQwwU11uZ` at commit `abfe572acc61ec2e018602064dda14f009370c8e` started at `2026-09-06T18:41:21.426Z`. Run ID `47d308e6-cc67-40fa-9dfc-1b760274c9af` created only the uniquely tagged Stripe TEST subscription `sub_1UCl0HEGJUB78L7nRpapHMBN`.

The signed `customer.subscription.created` event `evt_1UCl0IEGJUB78L7njnF3J2NR` was processed once at `2026-09-06T18:41:24.793566Z`, with `attempt_count=1` and no processing error. The harness then stopped with `analytics_entitlement_timeout` before calling `/api/claude-code/session/start`. No challenge attempt, session ID, gateway key, Cloud Run host, or revision was created, so session quota and provisioning were not exercised.

This was an application profile-entitlement mismatch, not a Stripe delivery failure or session-quota rejection. The webhook stores the active analytics subscription as `subscriptions.plan='analytics_monthly'` and sets the profile's Pro and analytics flags. `/api/profile` calls `effectivePlanFromRows`; when a subscription row exists, that helper calls `subscriptionEntitlesPro`, whose plan matcher accepts only `plan='pro'`. It therefore reports the hosted effective plan as Free for an otherwise active or trialing `analytics_monthly` subscription. The harness required the hosted profile to agree with the webhook-backed entitlement and timed out before session start. The start route's later usage check derives its quota plan directly from `profiles.plan`, but that route was never called, so this run provides no quota result.

Failure cleanup canceled only the owned TEST subscription. Signed deletion event `evt_1UCl1oEGJUB78L7n0mJOTbDL` was processed once at `2026-09-06T18:42:57.221223Z`, with `attempt_count=1` and no processing error. Final staging state was `plan=free`, `pro_access=false`, `cc_analytics_access=false`, profile and subscription status `canceled`, and hosted plan Free. Cleanup completed without errors.

The original mode-0600 state remains at `.vercel/staging-analytics-canary-state.json`. A byte-identical mode-0600 backup is `.vercel/staging-analytics-canary-failed-47d308e6.json`; both were 3,295 bytes with SHA-256 `00b05bd1a1f9d91797687dd63185d87ceec15e5e3142b9f007e8e0cba51e47e0` when preserved. The harness now accepts a separately named state file through `STAGING_CANARY_STATE_FILE`, restricted to `.vercel/staging-analytics-canary-state-<label>.json`. A future rerun must use a new path and a new explicit approval; it must not delete, rename, or overwrite either failed-run file.

## Aborted gateway-mint canary

The second approved canary ran against deployment `dpl_B1CBRTyjcX87o3eM4rK1JvbsuUk4` at commit `1ae7b4bc02d35aa1f11cc4d995aeaaf678c6b7c0`. The branch alias resolved to that exact deployment, the same 31 preview variables predated its build, and read-only preflight showed a Free baseline with zero active sessions or blocking TEST subscriptions. Run `50a18ef8-3737-4de1-b13f-a3055e808cdf` started at `2026-09-06T18:59:57.681Z`.

Signed creation event `evt_1UClIJEGJUB78L7nCSMKocTp` for owned Stripe TEST subscription `sub_1UClIIEGJUB78L7nKqFl9QTt` was processed once at `2026-09-06T19:00:00.160204Z` without error. The corrected analytics entitlement passed. The start route created attempt `486a33b6-e489-43aa-9919-7696254d4a8f` and session `1c978110-f7c6-44be-9f3c-c9982268d771`; the session row was created at `2026-09-06T19:00:03.421Z`, so the entitlement and session-quota gates were exercised and allowed.

Provisioning failed before sandbox creation with `provision_phase='starting_gateway'` and `failure_code='gateway_key_mint'`; the row ended as `failed` at `2026-09-06T19:01:11.837Z`. No host instance, WSS URL, learner terminal, BigQuery query, model request, or per-session Cloud Run revision was created. The deterministic revision `cc-sandbox-staging-s1c978110f7c644be9f3c` did not exist after cleanup.

Cloud Run request logs show the observable failure sequence. The first `POST /key/generate` returned HTTP 200 at `2026-09-06T19:00:13.330454Z`. Duplicate retries then returned HTTP 500 at `19:00:23.830011Z`, `19:00:35.831272Z`, `19:00:49.336123Z`, and `19:01:04.337675Z`. This is recorded as a successful first mint whose response was lost to the caller, followed by duplicate retries against the same exact alias. A plain HTTP 500 is not sufficient authority to delete an alias: the fix must recover idempotently only after exact alias and mint metadata establish ownership of this session.

Application cleanup called `POST /key/block`, which returned HTTP 200 at `2026-09-06T19:01:12.162026Z`. Read-only verification found exactly one key with alias `cc-1c978110-f7c6-44be-9f3c-c9982268d771`, matching `feature='claude_code_analytics'` and session metadata, `blocked=true`, `$0` observed spend, `$0.49` budget, and zero recorded spend cents. The record remains retained for reconciliation. There were no live, provisioning, or finalizing sessions and no blocking TEST subscriptions.

Failure cleanup canceled only the owned TEST trial. Signed deletion event `evt_1UClJWEGJUB78L7nY6RiRsKX` was processed once at `2026-09-06T19:01:15.175142Z` without error. Final profile and hosted state were Free with `pro_access=false`, `cc_analytics_access=false`, and canceled profile/subscription status. All cleanup steps succeeded.

The original rerun state remains mode 0600 at `.vercel/staging-analytics-canary-state-rerun-1ae7b4bc.json`. Its byte-identical mode-0600 backup is `.vercel/staging-analytics-canary-failed-50a18ef8.json`; both were 10,785 bytes with SHA-256 `2e9427e27e0df8635872f8a12697657ecd1b70937d6759d76e54d5c0fcf42c9a` when preserved. Neither this run nor the earlier entitlement failure may be overwritten or reused. A new learner canary requires a new candidate, a fresh state path, and explicit approval.

## Aborted sandbox-create canary

The third approved canary ran against deployment `dpl_5oJMNrYbo1jsShYamDzETgp9RN4h` at commit `ebd506fd6a3b636cb7d62382294d8fedafb15531`. Exact deployment, branch alias, the unchanged 31-variable preview snapshot, and a clean Free baseline passed before run `2fc06da2-f3d8-4556-b80a-eb3e20e79d15` started at `2026-09-06T20:39:41.433Z`.

Signed TEST subscription creation event `evt_1UCmqoEGJUB78L7n7LDM5NEv` was processed once at `2026-09-06T20:39:43.665498Z` without error. Entitlement and session quota passed, creating session `629cdbbd-1997-4a02-8160-b5087fac1c57` and reusing in-progress attempt `486a33b6-e489-43aa-9919-7696254d4a8f`. Deterministic key mint recovery passed. Sandbox creation then failed: the authoritative row ended `failed` at `2026-09-06T20:40:59.241Z` with `provision_phase='booting_sandbox'` and `failure_code='create_session'`.

Cloud Audit Admin Activity records `google.cloud.run.v2.Services.UpdateService` by `cc-staging-orchestrator@hackproduct.iam.gserviceaccount.com` against `projects/hackproduct/locations/us-central1/services/cc-sandbox-staging` at `2026-09-06T20:40:59.015432Z`. It failed with code 7 because `artifactregistry.repositories.downloadArtifacts` was denied on `//artifactregistry.googleapis.com/projects/hackproduct/locations/us-central1/repositories/cc`. No session revision was created. Staging service traffic remained 100% on sterile base revision `cc-sandbox-staging-00002-wm4`; production `cc-llm-db` remained `STOPPED` with activation policy `NEVER`.

The harness's 195-second HTTP observation expired later at `2026-09-06T20:48:38.805Z`, then read the already-terminal authoritative session state rather than creating another session or treating the observation timeout itself as the failure. Cleanup found the exact session key blocked and retained with matching derived-key metadata, `$0` observed spend, `$0.49` budget, and zero recorded spend cents. No manual deletion occurred. Signed deletion event `evt_1UCmzbEGJUB78L7nR4LE1qOY` for the uniquely owned TEST trial `sub_1UCmqnEGJUB78L7nEtPvTDEY` was processed once at `2026-09-06T20:48:48.338936Z` without error. Final profile, analytics access, hosted plan, live-session count, and blocking-subscription count returned to the clean Free baseline.

The original mode-0600 state remains `.vercel/staging-analytics-canary-state-rerun-ebd506fd.json`. Its byte-identical mode-0600 backup is `.vercel/staging-analytics-canary-failed-2fc06da2.json`; both were 10,983 bytes with SHA-256 `862022659cbeb649b5cb3d8827c87498bba7c78cca5f95097aaf081b14b04399` when preserved. No further analytics run is authorized from this evidence.

## Aborted final-artifact canary

The fourth approved canary ran once against READY deployment `dpl_Dx6SmBJWu21T5XmZvc4QZ1GPCXud` at commit `cf7e9fee960785a44e4b0af5c1dea1ebca8d6e63`. The exact deployment, branch alias, 31-variable preview snapshot predating the build, clean Free baseline, zero nonterminal sessions, and zero blocking TEST subscriptions passed immediately before run `88f1e579-9507-4fe0-8431-dd565090e079` started at `2026-09-06T21:43:05.461Z`. Signed TEST subscription creation event `evt_1UCnqAEGJUB78L7n1bEawdmf` established the Analytics entitlement. Session `f7d74423-9b0f-428c-861e-31357b7dbf23` reused in-progress attempt `486a33b6-e489-43aa-9919-7696254d4a8f`. Repository-scoped Artifact Registry access repaired the preceding failure: deterministic revision `cc-sandbox-staging-sf7d744239b0f428c861e` imported its image, became Ready in 31 seconds, and served the authenticated WSS session while service traffic stayed 100% on sterile base `cc-sandbox-staging-00002-wm4`.

The real BigQuery and Claude workflow passed six evidence-backed adaptive checkpoints through the learner's answer. It verified reconnect continuity with the same WSS URL, unchanged analysis notes, persisted adaptive arc, and no injected or adjusted steps. The final Claude artifact command returned success and produced `/workspace/report.md` (8,871 bytes), but did not create `/home/analyst/.claude/skills/funnel-analyst/SKILL.md`. The next direct read failed with exact persisted label `__CANARY_SKILL_READ_88f1e579-9507-4fe0-8431-dd565090e079___exit_1`. The private workspace snapshot contains `analysis-notes.md` (7,802 bytes), `checkpoint-evidence.json` (4,299 bytes), and `report.md`; both captured skill directories are empty. The harness does not persist the full PTY body, so no more detailed Claude transcript exists after cleanup. Finalization, report/skill checkpoint assessment, persisted grade, and successful-path cleanup were not exercised and must not be reported as passed.

LiteLLM records 12 matched per-session Anthropic requests, all `success`; gateway request logs show no HTTP error after the learner WSS connected. No budget rejection was captured. Cumulative raw key spend was `$0.4924225` against a configured `$0.49` maximum, an overage of `$0.0024225`; the session row stored 49 cents. This run therefore does not prove strict raw-dollar cap compliance. The final accepted request crossed the key maximum, but the evidence does not prove that budget enforcement caused the missing skill. A future approved canary must retain the `$0.49` cap, reduce Claude context/output/turns, require the genuine skill before the report, and preserve both real artifacts and all eight checkpoint assessments before calling finalize.

Failure cleanup reaped only the owned session, blocked its exact key, retained the key for spend reconciliation, recorded 49 cents, and removed the deterministic revision without a manual delete. The harness labeled cleanup incomplete only because `gcloud` reported `Cannot find revision [...]`, while its absence parser recognized `not found`, `does not exist`, or `404`. Authoritative revision listing confirmed the owned revision absent; the ignored harness now accepts the observed `Cannot find revision` form and still rejects permission, authentication, and timeout failures. TEST subscription `sub_1UCnq9EGJUB78L7ng0axduAX` was canceled. Signed deletion event `evt_1UCo1uEGJUB78L7nRVQrMhOI` processed once at `2026-09-06T21:55:16.707755Z` with no error. Final state was Free with `pro_access=false`, `cc_analytics_access=false`, zero nonterminal sessions, and zero blocking TEST subscriptions. Production `cc-llm-db` remained `STOPPED/NEVER`; repository IAM stayed etag `BwZa1vsOOc0=` with no project-level reader grant.

Original state `.vercel/staging-analytics-canary-state-rerun-cf7e9fee.json` and byte-identical mode-0600 backup `.vercel/staging-analytics-canary-failed-88f1e579.json` are both 18,650 bytes with SHA-256 `b7980c340f2dc2e580a3882195e40d3391343e6c285f53a7b4f03fb27f916438`. Mode-0600 forensic inventory `.vercel/staging-analytics-canary-forensics-88f1e579.json` has SHA-256 `8d5d33bb2d5becc288577ddf301db29ab6a62f1b7eca501682c15f9c4caf53a0`. Preserve all three. No further analytics canary is authorized by this evidence.

## Repository-scoped IAM repair

After the failed run, the staging orchestrator received only `roles/artifactregistry.reader` on Artifact Registry repository `projects/hackproduct/locations/us-central1/repositories/cc`. The resulting repository policy etag was `BwZa1vsOOc0=`. A follow-up check found no project-level Artifact Registry role for the staging orchestrator. The repair log was preserved at `/tmp/hackproduct-artifact-reader-repair.log` with SHA-256 `1328c667d89b07df59762e9966a7530b96bfab9fcdae31991149a208aae5c03d`. The repair does not authorize another analytics canary.
