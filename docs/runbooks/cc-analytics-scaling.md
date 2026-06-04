# Claude Code Analytics — scaling runbook

How to raise the concurrent-user ceiling for the live-sandbox analytics feature.
Read this when sessions start timing out / 503ing under load, or before a launch
that expects more than a couple dozen simultaneous analysts.

## The model (why these are the limits)

Each active session = **one pinned Cloud Run instance** (`cc-sandbox`, 1 vCPU /
512 MiB, `minScale=maxScale=1` on a per-session tagged revision). Every session's
Claude traffic + per-session key minting routes through **one shared gateway**
(`cc-llm-gateway`) backed by **one Cloud SQL Postgres** (`cc-llm-db`). So the
ceiling is set by the *shared funnels*, not the per-session sandbox.

Bottlenecks, in the order they bite:

1. **LiteLLM gateway DB** (`cc-llm-db`) — connection cap + shared CPU. **First wall.**
2. **LiteLLM gateway compute** (`cc-llm-gateway` maxScale).
3. **Anthropic account RPM/TPM tier** (shared org key).
4. **BigQuery** concurrent-query quota (all sessions bill to `hackproduct`).
5. **Cloud Run regional CPU quota** (1 vCPU per session → quota ÷ 1000 mCPU = max
   concurrent sandboxes). Only binds after 1–4 are raised.

## Current state (2026-06-03)

- `cc-sandbox`: 1 vCPU / 512 MiB, 1 instance per session, 30-min TTL, **no reaper**
  (abandoned sessions hold an instance until TTL — implement the reaper before real load).
- `cc-llm-gateway`: **maxScale=10** (raised from 3 on 2026-06-03), minScale=1,
  `cpu-throttling=false`, scales to zero idle.
- `cc-llm-db`: **`db-f1-micro`** (shared-core, ~0.6 GB RAM, **~25 max connections**),
  ZONAL, 10 GB PD_HDD, `storageAutoResize=true`. **This is the current first wall.**
- Realistic ceiling today: **~20–40 concurrent active users** (DB-bound).

> Note: with the gateway now at maxScale=10, the f1-micro connection cap is the
> binding limit (10 gateway instances × Prisma pool can exceed ~25 connections).
> The gateway bump only pays off in full once the DB is right-sized (below).

## Cloud SQL does NOT autoscale compute

`storageAutoResize` grows the disk automatically (already on), but **CPU/RAM are a
fixed tier** you resize manually with a `patch` + a brief (~1–2 min) restart. There
is no compute-autoscaling toggle. The move is a one-time right-size, not autoscaling.

### Upgrade path for `cc-llm-db` (do when approaching ~30 concurrent)

Step 1 — right-size the tier (downtime ~1–2 min, single restart):

```bash
# Recommended target: 1 dedicated vCPU / 3.75 GB, ~100 connections (~$25–35/mo).
gcloud sql instances patch cc-llm-db --project hackproduct \
  --tier db-custom-1-3840

# Cheaper half-step if you only expect ~30–50 concurrent (still shared-core,
# ~1.7 GB, ~50 connections, ~$15–20/mo):
#   gcloud sql instances patch cc-llm-db --project hackproduct --tier db-g1-small
```

Step 2 — (optional, for HA at higher load) make it regional instead of zonal:

```bash
gcloud sql instances patch cc-llm-db --project hackproduct \
  --availability-type REGIONAL
```

Step 3 — verify connection headroom. LiteLLM uses Prisma; with `cc-llm-gateway` at
maxScale=10 each instance holds a pool. If you still see "too many connections",
either raise the tier further (`db-custom-2-7680`) or cap Prisma's pool via the
gateway `DATABASE_URL` (`?connection_limit=N`) so `10 × N` stays under the tier's
max connections. Tier connection limits: f1-micro ~25, g1-small ~50,
db-custom-1-3840 ~100, db-custom-2-7680 ~200.

No code/redeploy needed for the tier change — `cc-llm-gateway` reconnects through
the same Cloud SQL socket (`--add-cloudsql-instances` is unchanged).

## Raising the other ceilings

- **Gateway compute**: `gcloud run services update cc-llm-gateway --region us-central1
  --max-instances <N>`. Already at 10. Scales to zero idle, so raising is cheap.
- **Anthropic tier**: shared org RPM/TPM. Raise in the Anthropic console; not in repo.
- **BigQuery**: all sessions bill to `hackproduct`; default ~100 concurrent
  interactive queries per project. Raise via GCP Quotas console if query-bound.
- **Cloud Run CPU quota**: the final wall. Each sandbox = 1 vCPU, so
  `max concurrent sandboxes ≈ (regional Total-CPU-allocation mCPU) / 1000`. The
  exact value is project/region config — read it at
  console.cloud.google.com/iam-admin/quotas (service = Cloud Run Admin API,
  metric = "Total CPU allocation, per region", region = us-central1) and request an
  increase there. Also watch the **revision-tag cap (2000/region)** — the per-session
  teardown must drop its tag (see [[project_cc_sandbox_revision_leak]]) or tags
  accumulate toward that cap.

## Deferred: managed LLM gateway (revisit only if ops burden bites)

The DB right-size + gateway maxScale above keep the self-hosted LiteLLM path viable
well past current scale, so this is parked. IF operating the gateway + Cloud SQL ever
becomes the pain (not throughput, but ops), the pivot worth evaluating is a **hosted
LLM-native gateway** that keeps the same per-session virtual-key + hard-budget model
without us running Postgres: **LiteLLM Cloud** (same API, zero ops), **Portkey**,
**Cloudflare AI Gateway**, or **Helicone**. (Apigee is the wrong category — it's a
general API gateway with no first-class per-key dollar-budget cutoff, and is
enterprise-priced; not a fit for guarding sub-dollar sessions.) Not worth doing until
it's an actual problem.

## Quick triage when sessions start failing under load

1. 503 "Sandbox timed out starting" → check `cc-sandbox` tagged-revision count isn't
   bloated (teardown leak) and the Cloud Run CPU quota isn't maxed.
2. Claude calls hang / 5xx from the gateway → DB connections (`cc-llm-db`) or gateway
   maxScale. Right-size the DB per above.
3. `bq` errors about concurrent queries → BigQuery project quota.
4. Anthropic 429s → org RPM/TPM tier.
