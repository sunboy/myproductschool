# Phase 3 close-out — Casebook Loop (Practice engine)

Phase 3 built the Practice engine: practice-session provisioning, a per-kind reaper
idle branch, the practice workspace UI, retry semantics, and usage-limit enforcement.

User-facing vocabulary is **Practice**. `drill` survives only as an internal identifier
(`sessionKind: 'drill'`, `cc_drill_sessions_weekly`) and must never render.

---

## Named deviations (accepted, not gaps to paper over)

### 1. Budget-exhaustion end state deferred to the Practice terminal client
`ANTHROPIC_BUDGET_USD` defaults to `$0.50` and is enforced **inside the running
container**, over the websocket, long after `practice/start` returns 200 with a live
`wss_url`. The route cannot turn a mid-session budget 429 into a graceful end state.

Phase 1 established what happens without handling: 11 raw 429s and a dead session.

**Phase 4/5 dependency:** the Practice terminal client MUST handle the cap gracefully —
a calm in-vocabulary end state ("Practice session ended.") with the attempt recorded,
never a hung terminal. There is no terminal client in Phase 3 to render it, so forcing
it now would mean building throwaway UI to check a box.

### 2. No `/state` poll loop for Practice
When `provisionSession` returns `{ pending: true }`, the route returns
`status: 'provisioning'` with a live `wss_url`. The analytics flow has a `/state`
polling route; Practice does not. The assumption is the client connects to `wss_url`
and waits for the socket. Confirm when the Practice terminal client is built.

### 3. Generic failure string instead of differentiated messages
`provisionSession` maps its failures (SQL wake timeout, gateway key mint failure,
sandbox create failure, readiness timeout) to distinct clean strings. The route
collapses them to one `'Practice session could not start'`. Simpler failure surface,
but it loses the differentiated "try again" wording some branches carry.

### 4. Scratch datasets deferred to Phase 4 (carried from the Phase 3 kickoff)
Plan §3.2 wants per-user `cc_scratch_<hash>` datasets with 24h expiration. Deferred:
practice runs **read-only against the shared warehouse**. See the SA fact below.

**Phase 4 prerequisite, design already settled:** create a new server-only SA
(e.g. `cc-bq-provisioner@`) holding `bigquery.datasets.create`, never injected into any
container. The read-only SA stays read-only. Do not grant create rights to the sandbox SA.

---

## Live-infra facts (verified, easy to assume wrong)

### `CC_BIGQUERY_SA_JSON` is BOTH the provisioning and container credential
There is **no separate server-side BigQuery identity today**.
`CC_BIGQUERY_SA_JSON` resolves to `cc-bq-readonly@hackproduct.iam.gserviceaccount.com`,
and `provision-session.ts:248` injects that same credential into the container as
`GOOGLE_APPLICATION_CREDENTIALS_JSON`. Granting it dataset-create would grant it to
every learner session. Its roles are `dataViewer` + `jobUser`; **neither can create a
dataset**.

### `challenges.difficulty` CHECK constraint has drifted from the migrations
```
migration 001_initial_schema.sql : CHECK (difficulty IN ('beginner','intermediate','advanced'))
LIVE constraint (pg_constraint)  : CHECK (difficulty = ANY (ARRAY['easy','medium','hard']))
```
The live table wins. Anyone writing a `challenges` row from the migration files will fail.
Query `pg_constraint` directly rather than trusting the migration file.

### `claude_code_sessions` has no `session_kind` column
27 columns, no kind/type/mode field. Plan §3.1 assumed one; it does not exist. Practice
sessions are classified by `challenge_id` against `cc_scenes` instead (see below).

### `claude_code_sessions` requires BOTH FKs
```sql
attempt_id   uuid NOT NULL REFERENCES challenge_attempts(id)
challenge_id text NOT NULL REFERENCES challenges(id)
UNIQUE (attempt_id)
```
A practice scene has neither natively, hence the shim rows.

---

## Architecture decisions

### `challenges` shim rows are an FK shim ONLY
Each scene gets an unpublished `challenges` row (`id` = scene id, e.g. `tuesday-dip-s1`,
`challenge_type='claude_code_analytics'`, `is_published=false`,
`metadata.casebook_fk_shim=true`). This is how the four live analytics labs already
satisfy the FKs.

**`cc_scenes` is the sole content authority.** The shim carries only what the FK and
session bootstrap require (`metadata.claude_code.{claude_md, bq_dataset}`).

Leak audit: all 93 `from('challenges')` call sites were scanned. Only 2 are list-style
with no `is_published` filter, and both are benign (one selects only `industry_tags` for
autocomplete; one is an INSERT). The practice hub filters `is_published=true`.

### Reaper classifies by `challenge_id`, NEVER `attempt_id`
`src/lib/sandbox/practice-idle-reap.ts` carries a `PREVIOUS (BROKEN) DESIGN — do not
resurrect` block. The plan text still points at the broken approach, so anyone
re-deriving from the plan would rebuild it.

The broken version joined `attempt_id` -> `cc_scene_attempts.id`. That join can **never**
match: the FK forces `attempt_id` to reference `challenge_attempts`. Every real practice
session would silently take the 10-minute path — no crash, just a dead feature behind
six green tests.

**Fail-safe rule:** null / unmatched / any query error falls through to the existing
10-minute path. Never reap fast on ambiguity. The failure to prevent is reaping a real
user's live analytics session at 3 minutes.

**Verification status:** the 3-minute branch is verified by **injected unit test only**.
It cannot be observed live this phase, because production runs the previously-deployed
build with the global 10-minute cutoff. Live behavior begins after merge and deploy.

### Retry semantics: a fresh `challenge_attempts` row per practice start
Not find-or-create. `session/start` reuses any `in_progress` attempt, and
`claude_code_sessions` has `UNIQUE (attempt_id)`, so reusing an attempt makes a retry
**reconnect to that attempt's existing, possibly budget-dead session** — the Phase 1
trap, user-facing on the second attempt. The prior attempt is marked `abandoned`
(a pre-existing status used by three other flows, not invented).

Do not "optimize" this back to find-or-create.

---

## The recurring failure pattern (now at seven instances)

**A validator/check exists but does not cover the surface that matters**, so it passes
while proving nothing:

1. `VOICE_RULES` never scanned TSX -> em dashes reached a built component
2. `TIME_BOMBS` passed **vacuously** on an empty extracted-query set
3. No §4.3 lint over transcripts/authored copy -> `casebook` rendered on the public page
4. Reaper tests passed against an **FK-impossible row shape** -> dead classification
5. A usage gate that only CHECKS with nothing writing `usage_events` would read
   `used=0` forever and **never trip**
6. An `as ProvisionInput` **type cast** silenced tsc while leaving `sessionKind`
   undefined on the `/state` polling path, so the trial-quota fix would have been
   silently defeated there. The cast suppressed exactly the check that would have
   caught it.
7. `usage_events` has its **own** CHECK constraint, separate from `plan_limits`.
   Phase 0 widened `plan_limits.feature` but not `usage_events.feature`, so every
   `recordUsageEvent('cc_drill_sessions_weekly')` would have failed on insert and
   the gate could never have fired.

Every instance produces plausible-looking green. The counter-practice that caught 3, 4
and 5: ask not "does the check pass?" but **"can I make it fail on purpose?"** Before
accepting the WAREHOUSE green in Phase 1, a query's `expected_rows` was stripped to
confirm it went red. The same tamper test is required of the usage gate.

**Standing requirement:** force `prefers-reduced-motion` before asserting on rendered
text in any visual audit. Typed-text animation makes `innerText` assertions
timing-dependent; a 375px run reported clean while 768/1440 caught a real violation,
purely on animation timing.

---

## Known cosmetic items (deliberately not fixed)

- `next_rep` survives in the `cc_scene_attempts.verdict` **migration comment**
  (`20260826100100_casebook_user_state.sql`). The verdict key is `next_practice`;
  `next_rep` count across `src/` and `tests/` is 0. Not worth a migration to edit a comment.
- `case_001_checkout_funnel` (the validator's good-fixture BigQuery dataset) still carries
  the old `case_` naming. Out of scope, but it needs the same treatment as the
  `casebook_` -> `module_` rename if it ever renders on a user-visible surface.
- `cc_drill_sessions_weekly` contains the banned word "drill" as a `plan_limits` feature
  key. Internal identifier, same category as `session_kind: 'drill'`. **It must never be
  rendered** — refusal copy says "practice sessions" and never the raw key.

---

## E2E results (real sandbox sessions)

Baseline before the run: 0 session revisions, base config `20/512Mi`, cc-llm-db STOPPED,
both test users at `claude_code_sessions=0` and `cc_drill_sessions_weekly=0`.

### Case 1 — pro clean path: PASS
Session `cc-sandbox-s4992ad7e...` reached `Ready=True` against real infrastructure with a
`claude_code_sessions` row at `status=active`. Provisioning works end to end; this is the
first production validation of the wiring (a clean `tsc` had already passed while the
route still returned `session: null`).

### Case 2 — pro retry: PASS (closes the Phase 1 trap)
```
07:40:24  tuesday-dip-s1  ended 07:43:14   session A
07:43:20  tuesday-dip-s1  ended 07:44:09   session B  <- distinct id, non-overlapping
```
The retry minted a genuinely new session rather than reconnecting to the first. Combined
with the data-layer proof (fresh `challenge_attempts` row, prior marked `abandoned`,
`attempt_no` incremented), both halves of the trap are closed.

### Gate-composition fix — VALIDATED IN PRODUCTION
Across three real sessions:
```
pro/cc_drill_sessions_weekly : 3
pro/claude_code_sessions     : 0
```
Before the fix each would have burned an analytics trial unit.

**How this was distinguished from "metering never ran":** the session went `active` at
07:40:24 and the usage row was written at 07:40:35, eleven seconds later, after
`markActiveAndMeter`. If metering had been skipped entirely, BOTH counters would read 0,
which is indistinguishable from success. One counter incrementing while the other stays
at zero is only consistent with the conditional evaluating correctly. Check the timing,
not just the counts.

### `bumpLatestRevision` drift — transient, NOT persistent (correction)
```
during a live session : 1/2Gi     <- the per-session revision's own config, expected
after teardown        : 20/512Mi  <- restored, no intervention needed
```
Three base revisions were created during one session's lifecycle (bump-then-delete
teardown plus restore). **The drift did not persist.**

This downgrades the follow-up ticket. An earlier Phase 2 note implied the drift silently
degrades the service after every reap; it does not. It is transient during normal
teardown. Still worth fixing (a bump that happens to land last with defaults would
stick), but it is not actively degrading production.

Do NOT restore the base config while a session is live — that fights the session's own
template. The meaningful check is post-teardown.

### Case 4 — non-pro composition proof: PASS (the assertion the phase turned on)
```
after session 1 : cc_drill_sessions_weekly 1   claude_code_sessions 0
after session 2 : cc_drill_sessions_weekly 2   claude_code_sessions 0
after session 3 : cc_drill_sessions_weekly 3   claude_code_sessions 0
4th attempt     : HTTP 402, refused, counters unchanged
```
Verbatim refusal:
> You have used all your practice sessions for now. They reset on a rolling basis,
> or you can upgrade for more practice sessions.

`{used:3, limit:3, feature:"practice_sessions", windowDays:7, upgrade_url:"/pricing"}`

**§4.3 verified against the literal response body**: zero hits for `drill`,
`cc_drill_sessions_weekly`, `casebook`, `boss`, `rep`, `next_rep`, `session_kind`, or
em dash. The feature is aliased to `practice_sessions`. Numbers appear only as
structured fields, never in prose, so an `/admin/paywall-config` change flows through
instead of silently contradicting hardcoded copy.

**Correct attribution matters more than the refusal itself.** Because the analytics
trial was never consumed, the 402 could ONLY have come from the practice gate. Pre-fix,
session 1 would have burned the free tier's single analytics unit and the refusal would
have arrived at session 2 from the wrong feature. "Refused at the 4th" and "refused by
the right gate" are different claims; both hold.

The refusal did zero work: no `s4` scene-attempt row, no 4th session. The gate fires
before the scene lookup and before provisioning, so a refused learner costs nothing.

### Teardown sweep (verified independently, not from the dev's report)
```
session revisions        : 0
base config              : 20/512Mi, image :mvp
traffic tags             : none stray
cc_scene_attempts        : 0
cc_predictions           : 0
challenge_attempts       : 0 (tuesday-dip)
usage_events (cc_drill)  : 0
claude_code_sessions     : 0 (practice)
shim rows                : 6, all is_published=false  <- seed content, correctly RETAINED
lab_casebook (live DB)   : false
tsc                      : clean
unit tests               : 6/6 pass
stray temp scripts       : none
```

### Session budget
```
used            : 6 of 8   (3 pro + 3 non-pro)
peak concurrent : 1        (no leak)
refusal test    : 0 sessions (refused before provisioning)
```

### Monitoring lesson: an alarm is only worth having if it still means something
Three refinements were needed in one phase, each removing a false positive before it
reached the coordinator:
1. alarm on any base-config deviation -> fired constantly during normal sessions
2. alarm only when no session is live -> still fired in the ~30s window between one
   teardown and the next session's revision appearing
3. alarm only when drift persists across TWO consecutive no-session checks -> correct

The second version produced a confident "this is the real bumpLatestRevision bug" alert
that was false. It was caught by checking before relaying. A monitor that cries wolf
once starts costing trust faster than it saves time, and the real bug produces an
identical-looking message.
