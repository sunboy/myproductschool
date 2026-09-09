# AI analytics backend simplification

## Decision

Keep the product boundary that matters: every learner gets an isolated Claude
Code runtime, a read-only BigQuery identity, a short-lived connection token, and
a hard per-session model budget. Simplify the shared services around that
runtime before replacing the host model.

The first production architecture should be:

```text
Browser
  -> Next.js session API + Supabase session rows/snapshots
  -> isolated Cloud Run sandbox (one active learner per revision)
       -> LiteLLM Cloud Run gateway (scale to zero)
            -> Anthropic
            -> Supabase Postgres, dedicated litellm schema
       -> BigQuery through the sandbox's attached read-only runtime identity
```

This removes the dedicated Cloud SQL instance and both long-lived Google JSON
keys. It retains the pieces that enforce isolation and spend ceilings.

## Verified current state

- `cc-sandbox` creates one tagged Cloud Run revision per session. Each revision
  pins one 1 vCPU / 2 GiB instance with `minInstanceCount=1`, `cpuIdle=false`,
  and a 30-minute default TTL.
- Session creation and deletion mutate a shared service traffic list. Deletion
  may also create a sterile base revision because Cloud Run refuses to delete
  the latest-created revision. The reaper is therefore a correctness and cost
  dependency.
- `cc-llm-gateway` is a scale-to-zero LiteLLM service used only to issue virtual
  session keys and enforce their dollar budget.
- `cc-llm-db` is `db-f1-micro`, has a public IPv4 address, and currently has
  `activationPolicy=NEVER`. Compute is stopped. Storage and the IPv4 allocation
  remain billable until the instance is deleted.
- The HackProduct Supabase database is 509 MB. Its private `litellm` schema is
  already initialized with 73 relations and 123 Prisma migration records, using
  about 2.1 MB. It currently has zero virtual-key and spend-log rows. This makes
  it a strong canary target, but the gateway connection still needs live proof.
- Supabase currently has no live analytics session rows: 15 are `failed` and four
  are `terminated`.
- The analytics reaper and its independent health watcher each run 144 times per
  day. The last 24 hours of cron history succeeded, and the retained pg_net
  responses were HTTP 200. These calls are functioning; they are also 288 daily
  maintenance executions for an idle feature.
- Waking Cloud SQL, warming LiteLLM, minting a key, creating a revision, and
  waiting for readiness are split across several Vercel requests because the
  cold path does not fit reliably inside one function invocation.
- The sandbox receives a BigQuery service-account JSON value even though its
  Cloud Run revision already runs as `cc-bq-readonly`.

## Why costs can appear with no learners

The dedicated database is mostly controlled now: `activationPolicy=NEVER`
stops compute. It still retains disk and public IPv4 cost. The larger risk is a
session revision that fails teardown. A leaked revision pins its minimum
instance indefinitely. The existing ten-minute reaper mitigates that risk, but
the feature's cost safety depends on a Supabase cron, a Vercel route, service
traffic reconciliation, revision deletion, and a special latest-revision bump
all succeeding.

The application also performs frequent maintenance requests for spend snapshots,
orphan scans, database state changes, and health alerts. Their direct request
cost is likely small, but the number of moving parts makes false alarms and
resource leaks harder to diagnose.

Do not remove or slow the reaper while session revisions use `minScale=1`; it is
the backstop that releases abandoned compute. After the host no longer pins idle
instances, collapse the reaper and health watcher into a simpler daily orphan
audit.

## Migration order

### 1. Add code guardrails

- Clamp the effective sandbox TTL at every provisioning boundary. The default
  ceiling remains 30 minutes; raising it requires changing
  `CC_MAX_SESSION_TTL_SECONDS` explicitly.
- Clamp LiteLLM key budgets independently with
  `CC_MAX_SESSION_BUDGET_USD`. The current default remains $0.50.
- Fail production provisioning when LiteLLM is unavailable. The shared Anthropic
  key fallback is limited to an explicit non-production setting, so a missing
  gateway cannot silently create an uncapped learner session.
- Unit-test traffic reconciliation so creation preserves every other live tag
  and teardown removes only its own tag.
- Send the Cloud Run service `etag` on create, teardown, and sterile-base bump
  PATCHes. A simultaneous update now fails safely instead of silently dropping
  another learner's tag. Creation returns a retryable provisioning failure;
  teardown is retried by the reaper on its next sweep. The provider deliberately
  does not replay an ambiguous revision-creation PATCH inside the same request.
- Set `CLOUD_RUN_BASE_REVISION` to a sterile minScale=0 revision. This pins 100%
  of untagged service traffic to that revision instead of routing it to whichever
  per-session revision was created most recently.
- Bound LiteLLM's Postgres pool to two connections per worker and disable its
  duplicate database error log. At the current ten-instance gateway ceiling,
  that stays within the small database's approximate 25-connection limit.

These changes are deploy-safe with the current Cloud SQL architecture.

## Deployment contract for the guardrails

Deploy the application guardrails before the database or credential migrations.
The following settings are the exact production contract:

| Setting | Required production behavior | Safe default or failure mode |
| --- | --- | --- |
| `LLM_GATEWAY_URL` and `LLM_GATEWAY_MASTER_KEY` | Both point at the budget-enforcing LiteLLM service. | If either is absent, provisioning returns 503 before creating compute. |
| `CC_SESSION_BUDGET_USD` | Requested per-session virtual-key budget. | `$0.50`. |
| `CC_MAX_SESSION_BUDGET_USD` | Operator ceiling for the requested budget. | `$0.50`; a larger request is clamped. |
| `CC_MAX_SESSION_TTL_SECONDS` | Maximum sandbox lifetime. | `1800`; invalid values fall back to 1800 and requests are clamped. |
| `CLOUD_RUN_BASE_REVISION` | Sterile minScale=0 revision that can receive 100% untagged traffic. | Optional only when the API exposes an inferable untagged auto-named base. Missing or unresolved state fails before PATCH. |
| `CC_ALLOW_UNCAPPED_LOCAL` | Local-only escape hatch for direct provider testing. | `false`; even `true` is ignored in production. |
| `CC_SQL_INSTANCE` | Retain while LiteLLM still uses Cloud SQL. | Remove only after the Supabase database canary; absence disables the legacy SQL wake path. |

Explicit `CLOUD_RUN_BASE_REVISION` values may be auto-generated names, full
resource paths, or custom names outside the reserved per-session namespace.
Names matching `cc-sandbox-s[0-9a-z]{1,20}` are reserved for learner sessions
and rejected as base targets. Cloud Run still validates that the configured
revision exists and belongs to the service.

The `infra/cc-llm-gateway/config.yaml` pool and timeout changes take effect only
after rebuilding and deploying the gateway image. Roll out in this order:

1. Confirm or create a sterile minScale=0 base revision and set
   `CLOUD_RUN_BASE_REVISION` in preview and production.
2. Deploy the application with the explicit TTL, budget ceiling, and both
   gateway settings. Verify that a missing gateway fails without a Cloud Run
   PATCH and that two concurrent test starts preserve both tags.
3. Rebuild and deploy the LiteLLM gateway configuration, then mint and revoke a
   low-budget canary key.
4. Exercise create, reconnect, finalize, and forced-etag-conflict cleanup before
   opening analytics traffic.

No cloud resource deletion is part of this guardrail deployment.

### 2. Consolidate LiteLLM into Supabase Postgres

Do this during a short analytics maintenance window with no live sessions.

1. Confirm the Supabase compute tier's free connection headroom and current
   connection pool allocation.
2. Use the existing `litellm` schema. Create a dedicated login that has access
   only to that schema; do not give the gateway the application owner or service
   role.
3. Use Supabase's IPv4 session pooler on port 5432 unless the Cloud Run service
   has verified IPv6 connectivity. Prisma migrations need session semantics.
4. Preserve the current `LITELLM_SALT_KEY`. Changing it can make encrypted
   LiteLLM data unreadable.
5. Dump and restore the LiteLLM schema from Cloud SQL. Even though current users
   are zero, this preserves virtual-key and spend records and makes rollback
   straightforward.
6. Point a non-production gateway revision at Supabase with pool limit two.
   Verify readiness, mint a $0.01 test key, make one model request, read spend,
   and revoke the key.
7. Shift the gateway service to the verified revision. Exercise one complete
   analytics session through finalization and confirm the spend event reaches
   `usage_events`.
8. Remove `CC_SQL_INSTANCE` from Vercel. This turns the existing SQL wake/stop
   helpers into no-ops without an application release.
9. Observe for 24 hours, then export a final backup and delete `cc-llm-db`. This
   is the step that removes its residual disk and public IPv4 cost.
10. In a later cleanup commit, delete `cloud-sql-admin.ts` and remove its start,
    provision, and reaper branches.

LiteLLM documents that its database pool is per worker and should be bounded by
the database's connection capacity. Supabase recommends session mode for Prisma
when direct IPv6 is unavailable. We should verify these against the exact
deployed LiteLLM image during the canary rather than changing production blind.

### 3. Remove Google JSON keys

The sandbox already attaches a runtime service account. Replace the `bq` CLI
wrapper with the Node BigQuery client so it uses Application Default Credentials
from Cloud Run's metadata server. Then remove `CC_BIGQUERY_SA_JSON`, the key-file
write, and `gcloud auth activate-service-account` from the container. The runtime
identity keeps only dataset read and BigQuery job permissions.

Replace `CLOUD_RUN_SA_JSON` in Vercel with short-lived federation from Vercel's
OIDC token to a narrowly scoped Google service account. Limit it to managing the
single sandbox service and acting as the read-only runtime identity. Remove the
long-lived key only after create, reconnect, finalize, and orphan-reap tests pass.

### 4. Revisit the sandbox host after launch

The tagged-revision design is complicated, but replacing it before launch risks
the feature's central promise: a real isolated Claude Code environment. Keep it
for the launch once leak checks and cleanup telemetry are green. Evaluate a
per-session Cloud Run service or a managed sandbox provider separately with
measured cold-start, WebSocket reconnect, quota, and teardown behavior.

## Required operational checks

- Alert whenever a per-session revision is older than its effective TTL plus ten
  minutes.
- Alert on a nonzero per-session revision count when Supabase reports no active or
  fresh-provisioning sessions.
- Set a GCP monthly budget alert and separate BigQuery bytes-billed alert. The
  in-container 2 GiB query cap limits one query; it is not a monthly project cap.
- Report Cloud Run instance time, Anthropic spend, and BigQuery bytes by day in
  one small admin view. Keep this operational; it does not belong in learner UX.

## Deletion gate

Do not delete Cloud SQL, service accounts, keys, or revisions merely because a
replacement exists. Delete only after the canary path completes, production is
pointing at the replacement, no live session references the old resource, a
rollback export exists, and the 24-hour observation window is clean.
