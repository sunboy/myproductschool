# Phase 1 close-out — Casebook Loop

Phase 1 (content pipeline + authoring "The Tuesday Dip") is **complete**:
`validate-case.ts tuesday-dip` passes including the live warehouse check, and the case is
upserted to Supabase with `is_published=false`. `lab_casebook` remains false.

Six latent defects surfaced during Phase 1. Every one was invisible until a REAL recorded
session flowed through the REAL pipeline end to end, and most produced plausible-looking
empty or wrong output rather than a loud failure. Recorded here so case #2 does not
rediscover them.

---

## 1. `bumpLatestRevision` silently drops scaling config (NOT Casebook-specific)

`src/lib/sandbox/providers/cloud-run-provider.ts` builds a deliberately "sterile" base
template emitting only `labels`, `scaling.minInstanceCount`, `serviceAccount`, and
`containers`. It OMITS `maxInstanceCount` and `resources`, so Cloud Run substitutes its
own defaults and the cc-sandbox base service drifts (observed: maxScale 20 -> 100 and
-> 1; memory 512Mi -> 2Gi). Seen three times in one session.

This path is also used by the reaper's orphan sweep, so it drifts in **production**, not
only under manual teardown.

Restore with:

```
gcloud run services update cc-sandbox --region us-central1 \
  --max-instances=20 --min-instances=0 --memory=512Mi
```

**Real fix (own ticket, separate from Casebook):** carry forward `maxInstanceCount` and
`resources` in that template.

## 2. `ANTHROPIC_BUDGET_USD=0.50` is too low for ANY authoring session

Default is `'0.50'` (`src/lib/sandbox/provision-session.ts`). Correct for a normal user
drill; far too low for a full multi-trap expert recording. Pass 1 died mid-arc with 11
`Budget has been exceeded` 429s at ~$0.51. Pass 2 with a $3 session-scoped cap completed
the whole arc and spent well under it.

Raise it **per recording session only**, never the global default.

Note: the 429 is enforced by the LiteLLM gateway's `max_budget`, driven by
`CC_SESSION_BUDGET_USD` (`src/lib/sandbox/llm-gateway.ts`). Set both.

## 3. Session reuse does NOT mint a fresh budget

Starting a second session for the same user reconnects to the SAME (budget-dead) session
rather than minting a new key. A genuinely fresh budget requires a new session id, and a
free-plan user also hits the `plan_limits` cap (1/month). Use a FRESH throwaway user with
`plan=pro` set up front.

## 4. Local-dev-origin autosave fails SILENTLY

`ORCHESTRATOR_SNAPSHOT_URL` is built from the request origin. Provisioning from a local
dev server (`localhost:PORT`) makes it unreachable from Cloud Run, and the container's
autosave `curl ... || true` swallows the failure — no error surfaces anywhere. This is
almost certainly why pass 2's final turn was never captured.

When recording from local dev, use a public tunnel (e.g. cloudflared), or drive a manual
signed-upload + PTY `tar`/`curl` path from the start.

## 5. Passing SQL to `bq` as an argv element breaks comment-prefixed queries

A query whose text starts with a `--` comment line looks like a FLAG to bq's parser and
fails with `Run 'bq.py help' to get help` instead of executing. Real transcripts contain
such queries. Fixed in `validate-case.ts` (SQL now goes via stdin). Apply the same rule to
any new harness, and keep SQL byte-for-byte verbatim.

## 6. Pipeline shape mismatches (all fixed, all one root cause)

The pipeline scripts were fixture-tested against synthetic inputs whose SHAPE differed
from the real artifact:

- `annotate-session.ts` read `.t` on input events that only define `ts` (7 sites), so
  `duration_s` and every decision-point / move / query timestamp came out null.
  `cut-scenes.ts` cuts on those timestamps, so scene cutting would have produced garbage.
- `sample-raw-session.jsonl` embedded RAW 0x1B ESC bytes inside JSON string literals, so
  it was not valid JSON and had never actually parsed. Re-encoded as the six-character
  JSON escape (still exercises the ANSI-stripping path).
- SQL extraction only handled the CLI form (`$ bq query` + SELECT). Real transcripts use
  the MCP form (`[tool_use] mcp__bigquery__bq_query` / `sql:` / SELECT), so ZERO queries
  were extracted. That made TIME_BOMBS pass **vacuously** — green because it had nothing
  to scan, not because the SQL was clean.

**Lesson:** a synthetic fixture only tests the shape you imagined. Run a real artifact end
to end before trusting any green.

## 7. `cc_expert_sessions.queries` column was missing

`annotate-session.ts` emits `queries[]`, which is load-bearing (TIME_BOMBS scans it,
WAREHOUSE reproduces it), but the Phase 0 migration predated a real annotated session and
had no such column, so `publish-case.ts` failed on upsert. Added additively in
`supabase/migrations/20260827100000_casebook_expert_queries.sql` (JSONB, nullable, no
backfill).

---

## Conventions established in Phase 1

- A query that genuinely errored during the recording is **kept** in `queries[]` and
  flagged `failed_in_session: true`. The validator reports it explicitly, never silently
  skips it, and it is never deleted — deleting it would erase real expert reasoning AND
  silently shrink TIME_BOMBS coverage.
- Transcript consumers MUST disambiguate by Claude Code session id: reconnects create
  additional `.jsonl` files under one project directory.
- **Latent, currently harmless:** `validate-case.ts` matches transcript turns with
  `find(turn.t === q.t)` (FIRST match). Two queries share `t=190` in this case. Safe today
  only because neither transcript turn carries `expected_rows`. Fragile if a future case
  attaches `expected_rows` directly to a turn for a duplicate-`t` query set.

## Artifacts

- `content/casebook/tuesday-dip/case.json`, `expert-session.json`, `scenes.json`
- `content/casebook/tuesday-dip/raw/expert-session.raw.jsonl` — the real pass-2 recording
  (150 lines, single session id `4d0e7f10-5b23-4efa-ad13-a9f2f0fed9b2`)
- `content/casebook/tuesday-dip/raw/expert-session.pass1-partial.jsonl` — pass-1 partial,
  kept for reference
- `scripts/casebook/convert-cc-transcript.ts` — native Claude Code transcript to the flat
  `{ts, role, text}` shape `annotate-session.ts` consumes
