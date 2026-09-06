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
