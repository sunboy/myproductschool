# Casebook Loop — Phase 3/4 closeout notes

## HEADLINE LESSON OF PHASE 4

  An environmental failure is not just an obstacle to a test, it is a BLINDFOLD
  over whatever lies further down the same path.

Phase 4 hit a three-deep masking chain (gateway 500 -> SQL stopped by our own
reaper -> the real bug: case sessions exceed Cloud Run's 1h request-timeout cap
and had NEVER once provisioned). The first two look exactly like "flaky infra,
try again later". Rescheduling around them would have shipped a capstone that
cannot start.

Corollaries earned the same way:

  - Deferral is not the absence of a decision, it is a decision to ship
    everything else without it. The review surface is N changes plus their
    interactions.
  - "Observability only" is a category that invites deferral. Before using it,
    check what CONSUMES the observable. If a safety mechanism reads it, it is
    not observability, it is control.
  - Agreement across sources on the same side of a boundary is not independent
    confirmation.
  - A tool that cannot observe the phenomenon produces silence, not a negative
    result.
  - Before using an operation to observe state, check whether it also CHANGES
    state.
  - "What does this actually establish?" beats "what does this cost?"

---

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

## The recurring failure patterns (seven of one kind, plus a distinct eighth)

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


---

## CORRECTION: the practice UI was never wired to the API

`PracticeClient.tsx` imports a hardcoded `practiceFixture`, resolves it via
`Promise.resolve`, and its "Start practice" handler is a 400ms `setTimeout`. It never
calls `POST /api/casebook/practice/start` and never mounts a real `wss_url`.

The API is genuinely working and was verified end to end against real sandboxes. Only the
seam is missing. Wiring folds into Phase 4, built once against the stricter case-session
requirements and then pointed at practice.

**Root cause is an orchestrator error.** The UI dev was briefed to build a placeholder
because the API did not exist yet; its own doc comment says "the API dev wires it to the
real session later." That task was never dispatched.

### ★ PATTERN #8 — verification that stops at a seam (distinct from #1-7)
Patterns 1-7 are checks that structurally could not fail. This is different: **two
components each correctly verified in isolation, with nobody verifying the connection
between them.** The verification was not broken; it stopped at a boundary.

The counter-practice differs too. Component proof on each side is not sufficient —
**every seam needs its own integration proof.** Curl-based E2E cannot detect a UI-to-API
gap by construction, however rigorous each side's verification is.

**Standing requirement, same tier as forcing `prefers-reduced-motion`: at least one E2E
case per phase must enter through the actual front door a user would use — a browser
driving the real UI — not only hit the API directly.**

### Case 3 reclassified: INCONCLUSIVE, not passed
The $0.50 cap was never observed tripping; a Cloud SQL flake produced 401s instead. The
learner-visible symptom was a **silently wedged REPL retrying with no error text**, worse
than the legible 429 wall assumed as the baseline.

Upgrades the terminal-client dependency from "render a calm end state on budget
exhaustion" to **"detect a dead upstream (budget cap, Cloud SQL flake, session expiry)
and surface it rather than silently retrying forever."**

### The reaper is the ONLY session-lifetime enforcement that exists today
- `claude_code_sessions.status` never flips `provisioning` -> `active`.
- `expires_at` is not enforced in-container (observed 30+ seconds past expiry).

Phase 4's 90-minute wall must be designed around the reaper, not around a status field or
expiry check it cannot lean on.

### Corrected session count
**7 of 8**, not the 6 originally reported. Plus ~5 failed provisions that created no
revision and no usage row, so they cost nothing.


---

## Housekeeping carried into Phase 4

### Stale `provisioning` session row needs a deliberate cleanup pass
`cc-003-so-activation`, created **2026-07-02T03:52:24**, status `provisioning`. It has
now surfaced in three separate teardown sweeps as noise. It is correctly excluded from
the reaper's liveness counts (the reaper counts only `freshProvisioning` rows newer than
a cutoff), so it is harmless, but it should get a deliberate cleanup so it stops
appearing in every future audit.

### Pro-tier case-session spend is bounded by observability, NOT by the allowance
The $3.00 case-session cap bounds spend **per session**. On the pro tier
`cc_case_attempts_total = 10000` is effectively unlimited, so the allowance does NOT
bound weekly or monthly exposure the way free's lifetime cap of 1 does.

**The actual backstop for pro exposure is the existing spend observability**:
`record_cc_session_spend` -> `usage_events` (`cc_claude_spend_cents`) -> spend alerts
(`spend-snapshot.ts`, `spend-alerts.ts`). That path is unchanged by Phase 3/4 work and
stays unconditional for every session kind.

Naming it explicitly so pro exposure is not left unexamined: the cap is a per-session
guard, the alerting is the aggregate guard. If pro case usage ever grows materially,
the aggregate guard is the thing to tighten, not the per-session cap.


---

## CI gap: every new test directory is born invisible (found Phase 4, applies project-wide)

`package.json`'s `test:unit:node` is an **explicit hardcoded list of ~45 test file paths**,
not a glob. A test file that is not manually added to that list **never runs in CI**.

`tests/lib/sandbox/cc-reap-practice-idle.test.ts` was in exactly that state: 13 passing
tests — including Phase 3's 6 reaper-classification tests — that CI had never executed.
Those tests are the enforcement layer for the FK-realizability discipline this project
established after the reaper classification bug, so the discipline was unenforced:
someone could have reintroduced the impossible `attempt_id` join and CI would have
stayed green.

Fixed by adding the file to the list (verified: the suite now appears in
`npm run test:unit:node` output, 463/463 passing).

**This is the ninth instance of "a check that cannot fail."** A test nobody runs is the
same shape as a validator that does not scan the surface that matters.

**Follow-up ticket (not this phase's work):** replace the hardcoded list with glob-based
discovery, or add a lint that fails when a file under `tests/` is unreachable from any
test script. Until then, every new test directory is born invisible to CI by default, and
each new one must be added by hand.


---

## Pre-existing em dash in SHIPPED analytics-lab copy (found Phase 4, out of scope)

`src/components/v2/mediums/ClaudeCodeTerminal.tsx:605` renders:
```tsx
{wsError} — retrying…
```
An em dash in **user-facing copy**, which CLAUDE.md hard-bans. Confirmed pre-existing via
`git show HEAD` — it is committed, shipped analytics-lab code that predates Casebook
entirely. Deliberately NOT fixed under this branch: it is not Casebook's, and a drive-by
edit to live shipped copy is exactly the unscoped change devs on this project are told
not to make. Applying a looser standard to orchestrator edits than to dev diffs would
undermine the discipline.

**Why it survived:** `VOICE_RULES` scans case CONTENT, never TSX. That is the same gap
that let three em dashes reach a built Casebook component in Phase 2. So the violation
has presumably been live in production for months with nothing capable of detecting it.

Connective tissue to the recurring patterns: this is the "a validator exists but does not
scan the surface that matters" family (#1-7), not the seam family (#8). The fix is the
same one already ticketed — extend voice linting to TSX user-facing strings — and this
finding raises its priority, because the gap is demonstrably wider than Casebook.


---

## Working rule: never read a diff mid-write

Three separate false readings this project came from inspecting a file while a dev still
owned it and was actively editing:
1. A `replay-projection.ts` test failed with a "missing export" that existed seconds later.
2. `practice-idle-reap.ts` scratch-reference counts disagreed between two checks 30s apart.
3. `ClaudeCodeTerminal.tsx` was reported at 50/2 insertions when the finished diff was 66/2.

None caused harm, but each produced a confidently-stated wrong number, and one (#3) was
reported upward before being corrected.

**Rule: read a diff's size, run its tests, or grep its contents only AFTER the owning dev
reports done.** Mid-task polling is fine for liveness (does the file exist, is the agent
running) but not for any claim about content. The same discipline already applies to
writes — never edit a file a running agent owns, learned when an em dash fix was silently
reverted by a restarted dev in Phase 2.

## Phase 4 addendum — metering and budget, verified structurally (2026-08-27)

Two properties were confirmed by reading control flow, not only by observing a
run. Recording the reasoning because the observational evidence alone is weaker
than what the code actually guarantees.

### 1. Quota cannot burn on a failed start

`src/app/api/casebook/practice/start/route.ts` orders the three steps as:

  L135  checkUsageLimit(...)      read-only, consumes nothing
  L307  provisionSession(...)     the step that can fail
  L336  recordUsageEvent(...)     the debit, INSIDE `if (result.ok)`

The debit is downstream of, and guarded by, the step that fails. So a failed
provision cannot reach it. Observed empirically too: three failed starts during
the devAC seam test (cc-llm-db transiently in MAINTENANCE) produced zero
`usage_events` rows for `cc_drill_sessions_weekly`, zero Cloud Run revisions,
and no budget spend.

Both directions matter and both hold:
  - debit unreachable on failure  -> a user's weekly allowance is not burned by
    infra flakiness
  - debit reachable on success    -> getUsedQuantity actually climbs, so the
    gate can trip

The second direction is the one this project got wrong twice before (a gate
reading a counter nothing increments). It is correct here.

### 2. Per-kind budgets are non-interfering by type shape

`SESSION_BUDGET_USD` (provision-session.ts) is a PARTIAL record. Only
`casebook_case` is populated (3.00 via CC_CASE_SESSION_BUDGET_USD). `drill` and
`case` miss the lookup, yielding undefined, which `??` resolves to
CC_SESSION_BUDGET_USD (0.50, set in .env.local).

A lookup miss is the only path back to the original behavior, and the new key is
purely additive. The kinds therefore cannot contaminate each other by
construction. The pending non-interference E2E should verify that the minted
gateway virtual key CARRIES the right cap (3.00 vs 0.50) in one run, rather than
hunting for interference the type shape already precludes.

DEPLOY-TIME GAP: CC_CASE_SESSION_BUDGET_USD is not set in .env.local, so the
'3.00' code default applies. Prod would likewise fall back to the default unless
the var is set explicitly. Flagged for the deploy checklist, not a code defect.

## Pattern instance #10 — the orchestrator's own monitor was blind (2026-08-27)

Recorded because it is MY error, not a dev's, and it is the same class this
project has been catching all phase: a check that exists but does not cover the
surface it claims to.

I armed a monitor to enforce "at most ONE concurrent sandbox session" during the
seam test. It counted revisions with `grep -c "sess"`. Per-session revisions are
named `cc-sandbox-s<sessionid-prefix>` (see `revisionTag()` in
src/lib/sandbox/providers/cloud-run-provider.ts: `s` + id prefix). They never
contain the string "sess". The counter could only ever return 0. It reported a
clean cap for the entire run while being structurally incapable of reporting
anything else.

A second monitor had the opposite flaw: its session count was correct
(`^cc-sandbox-s`), but it read base template config via
`gcloud run services describe`, which returns the LATEST revision's template.
Once a per-session revision exists it IS the latest, so the healthy per-session
shape (maxScale=1, minScale=1, 2Gi) was reported as base-template drift from
20/512Mi. I briefly believed the base service had drifted to an always-on 2Gi
billing shape.

Two monitors, two different defects, same false picture. Resolved by reading the
revision LIST with timestamps, which showed `cc-sandbox-s0ca63c90...` created at
the moment of the click and every base revision before it correctly 512Mi/20.

Corrected monitor: anchors on `^cc-sandbox-s[0-9a-f]` for the count, and reads
base config from the newest NON-session revision (`grep -v` the same pattern).
Both its alarms can now actually fire.

Counter-practice, restated because I did not apply it to my own tooling: "can I
make it fail on purpose?" A cap monitor that has never once observed a live
session has not been tested, it has only been quiet. Silence from a monitor is
not evidence of a healthy system until the monitor has been shown capable of
alarming.

Related trap, same root: `gcloud run services describe` and
`gcloud run revisions list` answer DIFFERENT questions once per-session
revisions exist. For base template config, always read the newest non-session
revision, never the service.

## Phase 4 seam test — RESULT, and a wrong diagnosis I published (2026-08-27)

### The seam is CLOSED. The terminal mounts and works on a cold start.

Session 0ca63c90 (practice, tuesday-dip-s1, pro account) reached a live,
interactive terminal. Proven by round-trip, not by screenshot: `date && hostname
&& whoami` typed into xterm returned the sandbox's real UTC time, hostname and
user. That is a genuine WebSocket round trip to Cloud Run.

### My wrong diagnosis, recorded because publishing it was the error

Mid-test I found the DB row stuck at `provisioning`/`booting_sandbox` while the
Cloud Run revision was fully healthy, and that `api/casebook/practice/` contains
only `start` (no `/state` route, no polling in PracticeTerminal). I concluded the
terminal could NEVER mount on a cold start, and reported that to the coordinator
as a shipping blocker.

It was wrong. `PracticeClient.tsx:69` sets client `sessionStatus = 'active'`
directly from the synchronous start response's `wss_url`. The client never needs
a /state poll, because ClaudeCodeTerminal opens the WebSocket itself once
mounted. There is no user-facing hang.

What misled me: `PracticeTerminal.tsx:88` carries a comment saying the terminal
mounts "even while the session is still 'provisioning' on the server side", but
the line it documents requires `status === 'active'`. The comment describes
SERVER status; the code reads CLIENT status. Both are internally consistent, and
reading the comment against the wrong `status` produced a coherent but false
story. I traced schema + infra + logs and never checked the client state
machine, which was the one place the answer lived.

The dev (devAD) did not take the diagnosis on faith and tested the live browser
directly. That is what caught it. A subordinate empirically checking the
orchestrator's theory is the behavior that saved this.

### What IS real (narrower, still worth fixing)

1. `claude_code_sessions.status` never flips to `active` for practice sessions.
   `markActiveAndMeter` (provision-session.ts:410) runs on the /state path,
   which practice never calls. Server-side state defect, NOT a UX defect.
   Consequences, bounded:
   - Metering is UNAFFECTED. Verified: `cc_drill_sessions_weekly` qty 1 was
     written at 19:47:56 tagged with this session id, by the start route's own
     recordUsageEvent. The gate does not depend on the flip.
   - Both idle reapers key on `status='active'` (practice-idle-reap.ts:128,:230)
     so a stuck row is invisible to them. BUT the orphan sweep in cc-reap
     (route.ts:274-277) explicitly treats rows stranded in `provisioning` past a
     cutoff as dead and sweeps their sandboxes. Not an unbounded cost leak.
   - Real cost: observability. Nothing distinguishes "booting" from "running".
2. Stale "[Reconnecting in 3s...]" banner persists after a successful reconnect,
   while the terminal is demonstrably accepting input.

### Teardown gotcha (cost the sweep one cycle)

`gcloud run revisions delete` FAILS on the latest-created revision
("FAILED_PRECONDITION"). The reaper hit exactly this: `orphans_scanned: 1,
orphan_failures: 1`. The provider handles it via `bumpLatestRevision`
(cloud-run-provider.ts:367): deploy a new base revision so the session one is no
longer latest, then delete. Did that manually; base config verified unchanged
after the bump at maxScale=20 / minScale=0 / 512Mi (the documented
bump-drops-scaling-config risk did NOT materialise here). Reaper is a GET, not a
POST; a POST returns 405.

### Not verified

375 and 768 breakpoints. The browser viewport would not leave 1440x723 despite
repeated resize calls (environment limitation). devAD reported the gap rather
than claiming coverage. 1440 is clean. Still outstanding.

## The July 2 stranded row is NOT a cost leak (checked 2026-08-27)

This row has been waved past three times as "harmless noise", and was then
proposed as empirical proof that the reaper never sweeps rows stuck in
`provisioning`, i.e. a June-bill-shaped billing leak. Checked directly:

  id:               c188604f-9fd1-4d0b-a102-5bcbdf16c1a8
  status:           provisioning
  provision_phase:  starting_gateway
  host_instance_id: null
  created_at:       2026-07-02

It died at `starting_gateway`, which is BEFORE any sandbox is created.
`host_instance_id` is null: there was never any compute. So it is a stranded DB
row, not two months of billing. Live per-session revisions at time of check:
zero.

This also explains why the orphan sweep "never caught it". That sweep walks from
LIVE Cloud Run revisions back to session rows. A row with no host_instance_id
has no revision to walk back from, so it is correctly outside the sweep's remit
rather than being missed by it.

A bounded provisioning lifetime ALREADY EXISTS (cc-reap route.ts:273-278):
provisioning rows older than a 5-minute cutoff do not count as live, fail-closed.
That is why `sql_stopped: true` fired on a reaper run while this row existed.

Real remaining gap, much smaller: nothing ever marks such a row terminal, so it
lingers in the table forever. Query noise and confusing to anyone reading the
table, not cost.

Generalizable: `status='provisioning'` alone does not imply live compute. Check
`host_instance_id`. A row can strand before, or after, a sandbox exists, and the
two have completely different cost consequences.

## Why the front-door test paid off (the accurate version)

Worth stating precisely, because the tempting version is wrong. The seam test did
NOT catch a cold-start bug; the cold start works. What it caught was the
ORCHESTRATOR producing a confident, coherent, WRONG diagnosis, and a dev
empirically overturning it.

The false diagnosis fit every piece of evidence held at the time: healthy Cloud
Run revision, DB row stuck at `provisioning`, genuinely absent /state route, and
zero polling requests in the network log. Three independent-looking sources
agreed. They were not independent: all three sat on the SERVER side of the seam,
and the answer lived in the client state machine (PracticeClient.tsx:69 sets
client status straight from the start response's wss_url).

The fourth "source" was also a false negative: the network tool logs XHR/Fetch,
not WebSocket, so a live WS connection answering commands produced no entries.
Absence of evidence from a tool that cannot observe the thing is not evidence of
absence.

The dev disproved it with a command a mock could not fake (`date && hostname &&
whoami` returning real current UTC and the sandbox's actual user). Front-door
testing earned its keep by contradicting the person directing the test.

Standing lesson: when several sources agree, check whether they are actually
independent or merely on the same side of the boundary being investigated.

## Lesson: agreement across sources on the same side of a boundary is not independent confirmation

Distinct from the mid-write-read trap, and worth keeping separate.

When investigating a defect that spans a boundary (client/server, app/infra,
producer/consumer), corroboration only counts if the sources sit on DIFFERENT
sides of it. Otherwise multiple agreeing sources are one source counted several
times, and the agreement feels like proof while proving nothing about the half
never examined.

Concrete instance (Phase 4 seam test). Conclusion reached: "the terminal can
never mount on a cold start." Evidence, all of it real and correctly read:
  1. Cloud Run revision fully healthy, all conditions True   [infra]
  2. DB row stuck at provisioning/booting_sandbox            [server state]
  3. No /state route exists; no polling code in the component [server-side code]
  4. Zero polling requests observed in the network log        [tool artifact]

Four sources, unanimous, and the conclusion was still false. (1)-(3) are all on
the SERVER side of the client/server seam. The answer lived in the client state
machine (PracticeClient.tsx:69 sets client status directly from the start
response's wss_url), which was never opened. (4) was not evidence at all: the
network tool logs XHR/Fetch and cannot see WebSocket frames, so a live connection
answering commands produced no entries. Absence of evidence from an instrument
that cannot detect the phenomenon is not evidence of absence.

Practice: before treating agreement as confirmation, list the sources and mark
which side of the boundary each sits on. If they are all on one side, the
investigation has not started on the other. And for any negative result from a
tool, confirm the tool can observe a POSITIVE case before trusting its silence.

## Stale-provisioning-row cleanup: sized, and deliberately NOT built (2026-08-27)

Confirmed there is no writer that marks a long-dead `provisioning` row terminal.
cc-reap correctly EXCLUDES them from liveness (so they cannot block the SQL stop)
but never transitions them, so they linger indefinitely.

Before proposing a mechanism, sized the actual problem. Full-table counts:

  provisioning: 1     (the July 2 row, host_instance_id null, never had compute)
  active:       0
  idle:         3
  ended:        0
  failed:       6

One stale row in nearly two months, nothing accumulating. That is noise, not a
growth problem, and building a sweep for it would be over-engineering: more code,
more failure modes, and a new writer against the sessions table, to solve a
single row that a one-line UPDATE clears.

Recommendation: clear it manually if it ever bothers anyone; do not build a
cleanup path. Revisit only if the provisioning count starts climbing, which is
the actual signal that would justify a mechanism.

Recorded because "we found a gap" does not automatically mean "we should build
something." The count is what turns that into a decision instead of a reflex.

(`active: 0` in the same query also independently confirms the Phase 4 seam-test
session was fully torn down and nothing is billing.)

## Correction to the "do not build (iii)" recommendation (2026-08-27)

The sizing entry above recommended NOT building a stale-provisioning-row cleanup,
on the grounds that one row in two months is noise and a one-line UPDATE clears
it. The coordinator approved (iii) anyway and asked for the row retired by
mechanism rather than by hand.

Recording the reversal rather than quietly folding, because the reasoning matters
and the sizing entry above is still true as far as it goes.

Why the coordinator's call is better: the manual-cleanup recommendation optimizes
for the row COUNT, which is genuinely small. It ignores that this row has now
been raised five separate times, each time costing a fresh investigation to
re-establish that it is harmless. The recurring cost is not the row sitting in a
table, it is people repeatedly re-deriving that `status='provisioning'` does not
imply live compute. A mechanism that marks such rows terminal ends that loop
permanently. One-line manual cleanup does not: the next stranded row restarts it.

Generalizable: when sizing whether to build something, count the investigation
cost of the ambiguity, not only the size of the artifact. A single row that
triggers five investigations is more expensive than its row count suggests.

The WebSocket-invisibility fact belongs in the same family and is recorded above:
the network tool tracks XHR/fetch only, so "no request observed" was never
evidence about WebSocket traffic at all. An instrument that cannot observe the
phenomenon produces silence, not a negative result.

## Breakpoint audit CLOSED: 375 and 768 verified (2026-08-27)

The standing visual-audit requirement (375 / 768 / 1440, prefers-reduced-motion
forced) is now fully satisfied for the Practice page. 1440 was already clean.

What finally worked: **Playwright MCP** (`browser_resize`), which drives its own
bundled browser process and is therefore not subject to the OS window
constraints that defeated the Chrome-extension path. That path reported success
five times while the viewport never left 1440x723.

Results:

  375px: window.innerWidth=375, scrollWidth=369=clientWidth, no horizontal scroll
  768px: window.innerWidth=768, scrollWidth=762=clientWidth, no horizontal scroll

Reduced motion applied as a REAL media query via
`page.emulateMedia({ reducedMotion: 'reduce' })`, verified with
`matchMedia(...).matches === true`, not a CSS override approximating it.

Independently verified rather than taken on report: the PNG pixel dimensions are
375x812 (viewport shot) and 369 / 762 wide (full-page shots). The full-page
widths match the reported scrollWidth exactly, narrower than the viewport by the
scrollbar. That internal consistency is not something a silently-failed resize
could produce, which is the specific thing worth checking given how the previous
attempt failed.

Two apparent bugs were investigated and correctly ruled out as false positives
(async content-load timing, and a full-page-screenshot stitching artifact around
the fixed bottom nav where the real button position is never obscured).

METHOD NOTE for next time: when a tool reports success but the effect may not
have occurred, verify the EFFECT (measured innerWidth, image dimensions), never
the return value. Two separate agents were misled by success-reporting calls in
this phase.

## Pre-existing vocabulary leak found (NOT ours, not fixed here)

`src/app/(app)/dashboard/page.tsx:876` renders `ctaLabel="Pick a rep"`. "rep" is
on the section 4.3 banned list for user-visible copy (the mapping is
Practice / Challenge / Walkthrough / Checkpoint / Feedback).

Confirmed pre-existing: identical string at the identical line on `main`. Not
introduced by Casebook Loop. Deliberately NOT fixed in this branch, because an
unrelated copy change would muddy a diff that is already under review.

Flagged for the coordinator as a separate call. Worth noting the vocabulary rule
is being enforced on new Casebook surfaces while an existing violation sits on
the dashboard, which is exactly the kind of inconsistency that erodes a naming
convention.

## Correction to devAF's "async data-load timing" note (2026-08-27)

devAF saw an early 375px screenshot with "The goal" body empty and the "What you
know so far" section absent from the DOM, then saw the content present on a later
check. It concluded async data-load timing and suggested a loading skeleton.

That diagnosis does not fit the architecture, and the suggested fix would be
wrong for this route.

`practice/[sceneId]/page.tsx` is an ASYNC SERVER COMPONENT (`export default async
function PracticePage`, awaiting the cc_cases / cc_scenes queries). There is no
`'use client'` and no client-side fetch for that content. The scene brief arrives
IN THE HTML. A server-rendered region cannot paint empty and then populate,
because nothing client-side is fetching it.

What devAF almost certainly captured is the harness screenshotting mid-navigation,
before the server response finished streaming. That is a test artifact, not a
product behavior, and it is consistent with everything else it observed: the
content was "already there" on every later check because it was never being
fetched, only awaited.

Why this matters beyond the detail: a loading skeleton is the RIGHT fix for a
client-fetched region and the WRONG fix for a server-rendered one. Shipping one
here would add a state that can never legitimately render, which is dead UI that
later readers must reason about.

Note this is the same shape as the phase's main lesson, one level down: a
plausible, internally-coherent explanation formed without checking which side of
the client/server boundary the content actually comes from. devAF verified
carefully and reported honestly; the miss was architectural context it did not
have, not sloppiness. Recorded so the suggestion is not actioned later by someone
reading only the report.

Caveat on my own check: an unauthenticated curl of the route returns nothing
useful (it redirects to auth), so the SSR HTML was not confirmed by fetch. The
conclusion rests on the component being an async server component with no client
fetch path for that content, which is sufficient but is code reading, not an
observation of the rendered stream.

## SEPARATE TICKET (do not fix on this branch): "Pick a rep" vocabulary leak

Coordinator ruling 2026-08-27: leave as a separate ticket. Do not fix on
feat/casebook-loop-2, and do not fix on main mid-review of this branch. It is a
real pre-existing violation but is unrelated to this diff, nothing is breaking,
and touching main now adds review noise for no urgency.

Exact location so it does not get lost:

  file:   src/app/(app)/dashboard/page.tsx
  line:   876
  string: ctaLabel="Pick a rep"
  links:  /challenges
  status: present on `main` at the identical line; NOT introduced by Casebook Loop

Why it is a violation: "rep" is on the section 4.3 banned list for user-visible
copy. Mapping is Case->Module, drill/scene->Practice, full case->Challenge,
replay->Walkthrough, prediction point->Checkpoint, debrief->Feedback,
solved->Completed, resume->Continue. A CTA pointing at /challenges would most
naturally read as Challenge-flavoured copy.

Found by devAF during the 375/768 audit, on an adjacent page, outside its scope.
It flagged rather than fixed, which was correct.

## (i)/(ii)/(iii) landed and PROVEN, not just implemented (2026-08-27)

### (iii) stale-provisioning sweep: the July 2 row is retired BY MECHANISM

The row that had been waved past five times:

  before: status=provisioning, provision_phase=starting_gateway, host_instance_id=null
  after:  status=failed, ended_at=2026-08-27T20:35:29Z, provision_phase preserved,
          failure_code=null

Retired by a reaper run, not by hand. A later run reports
`stale_provisioning_found: 0`, which is the correct steady state now that the
backlog is clear, not a failure to act. Wired at
`stale_provisioning_cutoff_seconds: 3600`.

IMPORTANT correction the dev made to MY brief: I suggested leaving hostful rows
to the existing orphan sweep. That does not work. The orphan sweep's `keep` set
INCLUDES `provisioning`-status rows, so a stuck provisioning row with live
compute would never have been touched by it. The dev caught this and instead
confirms liveness via the same `listSessionHostIds()` the orphan sweep uses,
destroys confirmed-live compute ITSELF before marking a row terminal, and leaves
the row `provisioning` for a retry if teardown fails. Fail-closed in the right
direction: a row is never marked terminal while its compute might still be
running.

Worth noting the dev declined to follow an orchestrator instruction that would
have produced a sweep with a hole in it, and said so explicitly. That is the
behavior the standing constraints are meant to produce.

### (i) status flip: the fix was BACKED OUT and re-approached

The dev's first attempt (client ping to the analytics lab's /state endpoint,
reusing `probeAndActivate`) would have fallen through that function's
cc_scenes-lookup default to `'case'` and burned the analytics trial for
`casebook_case` sessions. It recognised this mid-build, reverted the change
completely (verified: no residue of the /state ping remains), and stopped to ask
rather than shipping it.

That is the Phase 3 bug pattern being re-introduced through an observability fix,
caught by the person writing it.

### The property nobody was protecting

While preparing to "re-run the composition assertion", I found there WAS no such
assertion. `claude_code_sessions` appeared in exactly one test file, about idle
reaping. The practice/analytics-trial composition had been verified LIVE in Phase
3 and never encoded, so the exact bug above could have been reintroduced with CI
fully green.

Now guarded. `consumesAnalyticsTrial` was extracted as an exported pure predicate
and tested directly, no DB mocking:

  drill          -> false
  casebook_case  -> false
  case           -> true
  undefined      -> true   <- the trap: omission IS the analytics lab

The allowlist semantics survived intact (`ANALYTICS_TRIAL_KINDS` still contains
only 'case'; the `?? 'case'` default preserved). It was NOT regressed to a
negative check, which is what the long comment in that block warns against.

### (ii) reconnect banner

Root cause was not React state: the banner is written directly into the xterm
buffer in `ws.onclose`, so nothing could clear it. Fixed with a pinned-ref
checked on `ws.onopen`, which prints a confirmation line and resets, only when a
banner was actually pinned (never on first connect). Dead-upstream detection
untouched and verified.

### CI

470 -> 481 tests, 481 pass, 0 fail. Both new test files confirmed present in the
`test:unit:node` glob AND observed in the run output, because a test that does
not run is not a test and this project has been bitten by that exact gap.

### Environment note (not a code defect)

The dev server wedged mid-verification: a normally-350ms page request took 3.5
minutes, then cc-reap would not respond at all (HTTP 000). Steady degradation
across successive requests, consistent with the documented stale-.next wedge.
`pkill next-server` + `rm -rf .next` + restart -> ready in 3.0s. First call to a
cold route still takes ~54s to compile, so warm the route before timing anything
against it.

## The regression guard is load-bearing, verified by the orchestrator independently

devAE reported it had mutation-tested the new `consumesAnalyticsTrial` guard. I
re-ran the mutation myself rather than accept the claim, because it is the
strongest piece of evidence produced this phase and therefore the one most worth
checking.

Mutation applied (the exact historical bug, restoring the negative check the
long comment warns against):

  -  return ANALYTICS_TRIAL_KINDS.has(sessionKind ?? 'case')
  +  return sessionKind !== 'drill'

Result: 4 tests, 3 pass, 1 FAIL. Restored: 4/4 pass. File confirmed
byte-identical afterwards (`diff` clean), allowlist intact at line 441.

The case that fails under mutation is `casebook_case`, which is exactly the kind
that silently inherited analytics-trial metering under the old negative check.
That is the bug this project already shipped once and then fixed. It can no
longer be reintroduced silently.

This is the "can I make it fail on purpose?" standard actually executed rather
than invoked. A test that has never been observed failing is an assumption; this
one has now been observed failing for the right reason, twice, independently.

## Disclosure handled: a dev's pkill may have disrupted concurrent verification

devAE disclosed that a `pkill -f "tsc --noEmit"` it ran to clear a stalled job
may have killed other agents' concurrent tsc runs. Disclosed voluntarily and
unprompted.

Resolved by re-running verification myself rather than trusting any agent's
possibly-interrupted result: tsc clean, 481/481 pass. No lasting consequence.

Recording it because the disclosure was the correct behavior and worth
reinforcing: a dev flagging that it may have disturbed someone else's work costs
one paragraph, while an undisclosed interrupted test run silently degrades every
downstream claim built on it.

Also cleared: devAE flagged an unfamiliar migration in `git status`. It is
`20260827110000_casebook_case_attempts_feature.sql`, pre-existing Phase 4 work
present before any of these agents started. No unauthorized migration was created
and none was applied to the live DB. The dev was right to flag rather than assume.

## A false comment corrected (orchestrator edit, 2026-08-27)

`case/start/route.ts` (~line 22) claimed:

  "the client's existing /api/claude-code/session/[id]/state poll finishes the
   readiness check across further short requests"

That is FALSE for the casebook path. `probeAndActivate` is referenced in exactly
two places: its own definition, and the analytics lab's /state route. Nothing on
the casebook path calls it.

Flagged by devAE, verified by grep, corrected directly (devAE was stood down, so
the file was unowned).

Why a wrong comment mattered more than usual here: it does not merely mislead, it
points a future reader at a fix that is ACTIVELY HARMFUL. Anyone reading "the
state poll handles this" and wiring it up would route casebook_case sessions
through `probeAndActivate`'s cc_scenes lookup, which for a case id misses
DETERMINISTICALLY (challenge_id is a case id, never a scene id), leaving
sessionKind undefined so `?? 'case'` charges the analytics-lab trial unit on
EVERY casebook_case session. Not an intermittent blip: every time.

devAE found this by building that exact fix, recognising the trap mid-build, and
reverting rather than shipping. The replacement comment now states the gap is
observability-only, states why, and names the trap explicitly so the next reader
is warned rather than invited.

Generalizable: a comment describing behavior that does not exist is worse than no
comment, because it substitutes for verification. This one survived because it
described a REASONABLE design that was simply never implemented on this path.

## Phase 4 closing state

Landed and verified (tsc clean, 481/481, both new test files confirmed running):
  - Practice front-door seam: terminal mounts, WebSocket connects, commands
    execute. Proven by round trip, not screenshot.
  - Breakpoints 375 / 768 / 1440, reduced-motion forced via real media-query
    emulation. Verified via Playwright after the extension path proved incapable.
  - (ii) stale reconnect banner cleared on successful reconnect.
  - (iii) stale-provisioning sweep; the July 2 row retired BY MECHANISM.
  - Metering regression guard, mutation-falsified TWO independent ways.
  - False comment in case/start corrected.

Deliberately NOT done, deferred pending a scope decision:
  - (i) DB status never flips to `active` on the casebook path. Observability
    only; metering, cost and UX all verified unaffected. The fix shape is known
    and documented (explicit sessionKind on probeAndActivate + a casebook-owned
    activation endpoint). Building it was stopped on purpose, twice: once by the
    dev mid-build, once by the orchestrator declining to give the go.

Open:
  - Budget non-interference E2E (needs a live run; confirms the minted gateway
    key CARRIES 3.00 vs 0.50, which no unit test can cover).
  - "Pick a rep" vocabulary leak, logged as a separate ticket, deliberately
    untouched on this branch and on main.

Infra at close: zero per-session revisions, base template maxScale=20 /
minScale=0 / 512Mi, cc-llm-db stopped, zero rows in `provisioning`, zero
`active`. Nothing billing.

## Pattern #8 BETWEEN TWO OF THIS PHASE'S OWN FIXES (2026-08-27)

The most consequential finding of Phase 4, and the orchestrator's recommendation
to defer (i) would have shipped it.

Two changes, each individually correct, each individually verified:

  (A) The stale-provisioning sweep (landed): retires rows stuck in
      `provisioning`. Query filters ONLY on `status='provisioning'` AND
      `created_at < cutoff` (3600s). No session-kind filter, no activity check.
      For a hostful row with confirmed-live compute it calls destroySession(),
      then marks the row failed.

  (B) The status flip (proposed for deferral): the casebook paths never advance
      a row to `active`, because that transition lives in markActiveAndMeter,
      which only the analytics lab's /state route calls.

Individually fine. Together:

  case session ttlSeconds = 5400 (90 minutes)
  sweep cutoff             = 3600 (60 minutes)
  row status               = 'provisioning' for the session's ENTIRE life (B)

A learner 61 minutes into a 90-minute Challenge therefore has a `provisioning`
row past the cutoff WITH live compute. The sweep confirms it is live, DESTROYS
it, and marks the row failed. A mid-capstone session kill at the one-hour mark,
hitting precisely the session kind Phase 4 exists to build.

Verified in code, not inferred: stale-provisioning-reap.ts's query has no kind
filter, and its hostful branch is
`if (liveHostIds.has(hostId)) await sandbox.destroySession(hostId)` followed by
`markFailed(row.id)`.

### Correcting the "observability only" framing

The orchestrator repeatedly described (B) as "an observability gap only", on the
grounds that metering, cost and UX were each verified unaffected. That framing
was too weak, and it is what made deferral sound reasonable.

The accurate framing: the mechanism meant to protect against orphaned billing
compute CANNOT SEE these sessions at all. Both idle reapers key on
`status='active'` (practice-idle-reap.ts:128 and :230), so a casebook session
whose row never leaves `provisioning` is invisible to idle reaping for its entire
life. That is not a wrong value in a column, it is a hole in exactly the
protection this phase was built to provide. The status column is not the
deliverable; it is the input every safety mechanism reads.

Lesson: "observability only" is a category that invites deferral. Before using
it, check what CONSUMES the observable. If a safety mechanism reads it, it is not
observability, it is control.

### Why this one is worth studying

This is pattern #8 (verification that stops at a seam) occurring BETWEEN TWO OF
THIS PHASE'S OWN FIXES, in the same message. Both were reviewed carefully. Both
were correct. Nobody verified the pair.

It was found by the coordinator reading stale-provisioning-reap.ts against a
deferral recommendation, i.e. by checking what the DEFERRED item would mean for
the LANDED item. The orchestrator had verified each change against its own spec
and never against the other.

Generalizable: when several changes land together, the review surface is not N
changes, it is N changes plus their interactions. "Deferring X is scope-neutral"
is a claim about an interaction, and it needs the same verification as a claim
about a change. Deferral is not the absence of a decision; it is a decision to
ship the other things without it.

### Resolution: flip WITHOUT meter

The fix is smaller than the one devAE backed out of. That proposal looked
expensive because "flip status" is bundled with metering inside
markActiveAndMeter, which the analytics /state path needs together. The casebook
routes do NOT need that bundle: they already meter route-side via
recordUsageEvent inside `if (result.ok)`.

So what these routes need is a plain guarded UPDATE (status='active', CAS on
`.eq('status','provisioning')`) after a successful provision, with sessionKind
already in hand. No probeAndActivate signature change, no new endpoint, no
metering code touched.

The deterministic cc_scenes-lookup trap that devAE correctly refused to ship
exists ONLY on the path that meters. This path does not meter, so the trap does
not apply.

Two guards on the fix: zero recordUsageEvent calls added (so "flip" cannot
quietly regrow into "flip and meter"), and a new test in devAG's sweep suite
pinning the behavior for a hostful, confirmed-live, past-cutoff case row, so this
interaction cannot silently regress in either direction.

## THE FORMULATION (keep verbatim)

  Deferral is not the absence of a decision, it is a decision to ship everything
  else without it. The review surface is N changes plus their interactions.

## Ruling: flip on COMPUTE-EXISTENCE, not boot-completion

The `pending: true` question, settled. The discriminator is "does billing compute
exist," not "is the boot finished."

`status='active'` in this schema does not mean "boot finished". It means
"compute exists that enforcement must track". Verified: every idle-reap path
keys on it (cc-reap/route.ts:71, practice-idle-reap.ts:128 and :230), so a row
that is not `active` is invisible to all idle reaping.

Verified rather than assumed, both halves:

  1. `provisionSession` returns `{ ok: true, wssUrl, expiresAt, pending: true }`
     (provision-session.ts:354) with wssUrl POPULATED. Real billing compute
     exists at that moment, and the client mounts its terminal off that same
     synchronous response regardless of what the row says.

  2. The normal idle sweep selects `status='active'` with
     `.or(last_activity_at.lt.cutoff, expires_at.lt.now)`
     (cc-reap/route.ts:71-72). So an eagerly-flipped row whose boot later dies is
     caught and cleaned up.

Rule: host/wss attached -> flip, even on the pending path. No host attached ->
do NOT flip (that is the genuinely stranded pre-compute case, and the
stale-provisioning sweep retiring it is correct).

### The asymmetry that settles it

  flip eagerly, boot then dies  -> active row with dead compute, caught by the
                                   normal idle sweep, ~15 minute cleanup delay,
                                   bounded and self-healing
  flip conservatively           -> a 90-minute Challenge destroyed at minute 60

Eager fails toward a short cleanup delay. Conservative fails toward destroying a
learner's capstone. Same fail-safe-direction logic as every other reaper decision
this phase. The CAS guard makes it race-safe either way, so eagerness costs
nothing in correctness.

Note the trap avoided: a ready-only flip sounds MORE careful, and is worse. It
would leave exactly the slow-boot sessions stuck in `provisioning` for their
whole life, which are precisely the sessions most likely to still be running at a
60-minute cutoff. The bug would survive in a narrower, harder-to-find disguise
while looking like the conservative choice.

## Proving the >60-minute survival cheaply

A real hour-long soak is not required. Backdating proves the identical property:
start a real case session, backdate its `created_at` by 61 minutes in the DB, run
the reaper, assert the session survives (row still `active`; the sweep only
queries `provisioning`), then restore and tear down.

Same insert-prove-clean discipline as the seeded usage-limit falsification
earlier this phase. Recorded because "must cross 60 real minutes" is the kind of
requirement that sounds rigorous and quietly costs an hour of wall clock plus
sandbox spend to prove exactly what a backdated timestamp proves in seconds.

## THE OBSERVABILITY/CONTROL TEST (keep verbatim)

  "Observability only" is a category that invites deferral. Before using it,
  check what CONSUMES the observable. If a safety mechanism reads it, it is not
  observability, it is control.

Concrete instance: `claude_code_sessions.status` looked like a reporting column
whose wrongness was cosmetic. Every idle-reap path keys on it
(cc-reap/route.ts:71, practice-idle-reap.ts:128, :230), so a row that never
reaches `active` is invisible to all idle reaping for its entire life. The column
is not the deliverable, it is the input every safety mechanism reads.

## Standing question worth carrying past this phase

  "What does this actually establish?" beats "what does this cost?"

Named after nearly buying rigor by the hour twice in one phase: once by proposing
to defer (i) on an unverified scope-neutrality claim, once by requiring a
60-minute real soak to prove what a backdated timestamp proves in seconds. Both
times the corrective was the same question.

## Backdate mechanism de-risked BEFORE the live proof (2026-08-27)

The survival proof depends on being able to restore `created_at` after
backdating it. If the restore failed with a live session mid-test, the row would
be left with a fabricated timestamp and the sweep would act on a lie.

So the mechanism was rehearsed first, on an already-`failed` row (which the sweep
ignores by its `status='provisioning'` predicate, so nothing was at risk):

  original:  2026-07-02T03:52:24.355079+00:00
  patched:   2026-08-27T00:00:00+00:00
  restored:  2026-07-02T03:52:24.355079+00:00   (byte-identical)

PATCH works, and the round trip is exact including sub-second precision.

Worth doing because the ordering matters: rehearsing the undo on a harmless row
costs one command, while discovering the undo is broken while a real session
depends on it means a corrupted row and a wasted live run. General form: when a
test requires mutating live state and then restoring it, prove the RESTORE works
before you have anything at stake in it.

## (i) LANDED: flip-without-meter, verified independently (2026-08-27)

The session-killer interaction is closed. Verified by reading the code, not from
the dev's report.

### The hostless-pending carve-out turned out to be unreachable

devAH reported flipping on ANY `result.ok`, on the grounds that host is always
persisted before `ok: true` is returned. That sounded like the carve-out had been
skipped, so it was checked directly.

It is correct. `provisionSession` has exactly TWO `ok: true` returns (lines 348
and 354), and BOTH come after the UPDATE that persists `host_instance_id`,
`host_app` and `wss_url`. Compute always exists by the time `ok: true` is
returned, so a hostless-pending result cannot occur on this path.

"Flip on any result.ok" is therefore EXACTLY equivalent to "flip when compute
exists" here. The carve-out is not skipped, it is unreachable. Worth recording,
because the two formulations look different and only one of them is safe to
generalize: if a future `ok: true` return is added BEFORE the host UPDATE, the
equivalence silently breaks and the stranded-row case starts flipping.

### Both hard requirements verified

  1. ZERO recordUsageEvent calls added. Counted on the diff:
     `git diff -- <both routes> | grep "^+" | grep -c recordUsageEvent` -> 0.
     The recordUsageEvent calls visible near the new block are PRE-EXISTING
     route-side metering. Notably case/start's records `cc_case_attempts_total`,
     not the analytics feature, which is the exact separation the trap was about.
  2. New test added to devAG's sweep suite pinning post-fix behavior.

### Shape confirmed in BOTH routes, not assumed symmetric

Both practice/start and case/start carry the identical guarded update:

    .update({ status: 'active', started_at: ..., provision_phase: 'ready' })
    .eq('id', sessionId)
    .eq('status', 'provisioning')

case/start was checked separately rather than inferred from practice/start. An
initial grep did not show its `.eq()` lines (line-range cropping), and rather
than assume symmetry the file was read directly. Assuming the second route
matched the first is exactly the kind of shortcut that leaves a capstone path
unfixed while the tested path passes.

CI: 482/482, tsc clean, composition test untouched and green.

## Survival proof BLOCKED on gateway/SQL cold-wake, stopped after 3 attempts

The flag was never touched: `tuesday-dip` is the sole member of
`CHALLENGE_CASE_IDS` and the `lab_casebook` check sits inside
`if (!isAllowlisted)`, so it is unreachable for this id. Zero exposure window.

Three case-start attempts, all failed before compute:

  1. gateway_key_mint   (LiteLLM 500: "All connection attempts failed")  19.4s
  2. sql_wake_timeout   (cc-llm-db in MAINTENANCE)                        1.4s
  3. gateway_key_mint   (same LiteLLM 500) after cc-llm-db RUNNABLE/ALWAYS 25.3s

Cause chain: an earlier reaper run stopped cc-llm-db (correct, cost control).
Attempt 1 woke it, which put the instance into a Cloud SQL admin operation.
Attempt 2 hit MAINTENANCE. By attempt 3 the instance was RUNNABLE/ALWAYS but the
gateway still could not reach it, consistent with a stale connection pool in
cc-llm-gateway after its database was stopped and restarted underneath it.

Stopped at three rather than looping, per the standing rule given to every dev.

### The fail-closed property held again, this time on the CASE path

Verified after the failures:

  cc_case_attempts_total rows:   0
  live per-session revisions:    0
  session rows:                  3, all `failed`, each with an accurate
                                 failure_code (gateway_key_mint / sql_wake_timeout)

Three failed starts, no quota burned, no compute created, no orphaned rows. This
was previously demonstrated only on the practice path; it now holds on the case
path too, under a real failure rather than a simulated one.

Worth noting the phase's structural claim earned another confirmation: the debit
sits inside `if (result.ok)`, downstream of the step that failed, so the failures
COULD NOT have burned quota. Observation agreed with the code reading.

### Operational note

A stopped cc-llm-db is not sufficient on its own for the next provision to
succeed: waking the instance can leave the gateway holding dead connections.
Anything that depends on a fresh session after an idle period should expect
either a warm-up attempt or a gateway restart, not a single clean start.

## PRODUCT BUG (Phase 5 candidate): gateway does not reconnect after a SQL wake

Found while blocked on the survival proof. Logged as a real defect rather than
environmental noise, because the sequence that produces it is one the system
deliberately creates for itself.

Confirmed by the gateway's OWN health endpoint, not inferred from a 500:

    GET https://cc-llm-gateway-.../health/readiness
    {"status":"healthy","db":"disconnected"}

Service alive, answering in 132ms. Database connection dead.

### The chain

  1. cc-reap stops cc-llm-db when no session is active   (correct, cost control)
  2. A new session start wakes it (Cloud SQL admin op -> MAINTENANCE, then
     RUNNABLE/ALWAYS)
  3. cc-llm-gateway is still holding connections to the instance that was
     stopped underneath it, and does not reconnect
  4. Every LiteLLM key/generate returns 500 "All connection attempts failed"
  5. Every session start fails at `starting_gateway` with `gateway_key_mint`

### Why this is a product bug and not a test-environment quirk

The learner-visible sequence: be idle long enough for the reaper to stop the DB
(which the reaper is DESIGNED to do), come back, start a session, and see
"Challenge session could not start" on a completely healthy system.

Hit three times consecutively from a cold start. This is not a rare race; it is
close to the default first-session experience after an idle period. Two
individually-correct mechanisms (idle cost control, and provisioning) combine
into a broken experience. Same interaction shape as the sweep-vs-flip bug:
neither component is wrong, the pair is.

### Severity is bounded by fail-closed

Verified during the failures: zero quota burned, zero compute created, three
session rows correctly `failed` with accurate failure codes. So it costs the
learner an attempt, not an allowance. It degrades to "try again", not to a
charged-but-broken session.

But "try again, possibly several times" IS the current first-run experience after
idle, and that is worth fixing rather than absorbing.

### Candidate fixes (Phase 5, deliberately not bolted on now)

  - reconnect-on-failure inside mintSessionVirtualKey's retry path (it already
    retries on 5xx; the retry does not currently fix a dead pool)
  - a gateway readiness gate before provisioning, using the /health/readiness
    endpoint that already reports `db` state
  - an explicit gateway warm-up call after awaitSqlRunnable succeeds, so the
    wake and the reconnect are one operation rather than two independent hopes

Not fixed in Phase 4. Recorded with the reproduction and the evidence so Phase 5
starts from a diagnosis rather than a symptom.

## CORRECTION to the gateway finding above: it was NOT a stale pool

The entry titled "gateway does not reconnect after a SQL wake" is WRONG. Leaving
it uncorrected would send Phase 5 after a defect that does not exist. The
accurate diagnosis, from logs captured before any redeploy:

    "Escalating to heavy reconnect after 96 consecutive failures"
    "Prisma DB reconnect failed (96 consecutive)"
    "prisma-query-engine PID 0 is dead; reconnecting"
    Error 409: "The instance or operation is not in an appropriate state"
    "connection was refused" / "timed out after 10s"

(full capture: docs/notes/evidence/gateway-500s-2026-08-27.log)

LiteLLM's watchdog reconnects AGGRESSIVELY, 96 consecutive attempts. It is not
holding a stale pool. It was repeatedly failing to reach a database that was
genuinely stopped or mid-admin-operation. `db:disconnected` is a truthful report
of a real condition, not a gateway defect. The reconnect logic works.

### The actual cause: a race I created with my own verification runs

`cc-llm-db` was found STOPPED/NEVER after having been confirmed RUNNABLE/ALWAYS
minutes earlier. Cause: cc-reap calls `stopSqlInstance()` when it sees no live
sessions (route.ts:374), which is correct cost control. Every reaper run I made
during verification reported `sql_stopped: true`, truthfully.

    reap -> sees 0 sessions -> stops cc-llm-db (correct)
    -> start a session -> provision wakes it -> Cloud SQL admin op
    -> gateway cannot reach a stopped/waking DB -> mint 500 -> start FAILS
    -> still 0 sessions -> next reap stops it again

All three failed attempts were fighting a database my own verification kept
turning off.

Lesson, and it is a new one: I treated the reaper as an observation tool. It is a
MUTATING operation with a side effect on the exact resource under test. Running
it between attempts was not neutral measurement, it was interference. Before
using an operation to observe state, check whether it also CHANGES state.

### The real, narrower finding (this is what Phase 5 should get)

A session start can race a Cloud SQL instance that is stopped or mid-wake, and
the resulting 500 surfaces to the learner as "Challenge session could not start".
The reaper creates that window BY DESIGN as a cost measure.

That is still real and still worth fixing, but the fix is different from what the
wrong diagnosis implied: not pool recycling, but making provisioning wait
properly for the instance (awaitSqlRunnable already exists; the mint path fails
before or despite it) rather than failing on the first mint attempt.

### Why the wrong theory nearly cost something

A prod redeploy of cc-llm-gateway had been approved specifically to "clear the
stale pool". The pool was never the problem, so that deploy would have changed
nothing and been executed on a falsified theory, on a service every Claude
session's key mint depends on.

What prevented it: the standing requirement to CAPTURE LOGS BEFORE the redeploy,
because the redeploy would destroy the evidence. That requirement existed to feed
a Phase 5 ticket, and it incidentally falsified the reason for the deploy itself.

Generalizable: when a fix would destroy the evidence for the diagnosis that
justified it, gather the evidence first. Not for the record afterwards, but
because it is the last moment the diagnosis can still be proven wrong.

## THE CASE PATH HAD NEVER PROVISIONED, EVER. Found by the first front-door attempt.

The sharpest instance of the front-door lesson this project has produced, and the
reason the standing "at least one E2E per phase enters through the real front
door" rule exists.

    Cloud Run createSession failed (400):
    "Violation in UpdateServiceRequest.service.template.timeout:
     maximum allowed time is one hour."

`cloud-run-provider.ts:157` passes the session TTL through as the Cloud Run
REQUEST timeout: `timeout: \`${input.ttlSeconds}s\``. `case/start/route.ts:277`
sets `ttlSeconds = 5400`. Cloud Run's hard cap is 3600s. Every case provision
returns a deterministic 400.

Practice works only because its TTL is 600s. The Challenge path had never
successfully provisioned, in this phase or any prior one, until the first live
front-door attempt. Phase 4's stated purpose is full case sessions, and
everything layered on top (replay grading, report, debrief) was built against a
path that could not execute.

Unit tests could not have caught it: the failure is a platform constraint that
only exists when a real Cloud Run API call is made with a real value.

### The masking chain was THREE DEEP

Each cleared failure revealed the next one underneath:

  1. gateway_key_mint    LiteLLM 500, gateway could not reach its DB
  2. sql_wake_timeout    cc-llm-db in MAINTENANCE, then STOPPED again by my own
                         reaper runs (a race I created by treating a mutating
                         operation as an observation tool)
  3. create_session      the real bug: 5400s TTL exceeds Cloud Run's 1h cap

Nobody could have seen (3) without fixing (1) and (2) first. And (1) and (2) were
both environmental, which is exactly the kind of thing it is tempting to wave
away as "flaky infra, try again later". Waving them away would have left a
capstone that cannot start.

This is the same masking pattern as devAC's SQL-wake failure hiding the missing
poll path, now recurring at three levels. Generalizable: an environmental failure
is not only an obstacle to a test, it is a BLINDFOLD over whatever lies further
down the same path. Clear it and look again rather than rescheduling.

### Fail-closed held across all four failures

  cc_case_attempts_total rows:  0
  live per-session revisions:   0
  session rows:                 all `failed` with accurate failure_codes
                                (gateway_key_mint x2, sql_wake_timeout,
                                 create_session)

Four failures, four distinct causes, zero quota burned, zero compute created,
zero orphans. The structural claim (the debit sits inside `if (result.ok)`,
downstream of the failing step) has now been confirmed by observation under four
different failure modes.

### Note on the survival proof

The sweep-kill bug requires a case session alive for 60 minutes. Case sessions
could not start at all, so that bug was never reachable in practice, though it
would have become reachable the moment this one was fixed. devAH's flip is still
correct and still needed; it simply had never been exercised live by anyone.

## The 3600s cap protects future config, not just the case route

Independently enumerated every ttlSeconds that reaches createSession (devAI was
asked the same question separately; this is the orchestrator's own check):

  analytics lab  claude-code/session/[id]/provision:100
                 CC_SESSION_TTL_SECONDS ?? 1800   -> currently 1800  OK
  practice       casebook/practice/start:284
                 scene.time_budget_s || 1800      -> max scene is 300  OK
  case           casebook/case/start:273
                 hardcoded 5400                   -> EXCEEDS the 3600 cap

Only the case route violates it today, so `Math.min(ttlSeconds, 3600)` is
behaviorally identical for every existing caller. That is the non-interference
property, confirmed by enumeration rather than assumed.

Worth stating separately though: TWO of the three read values that can change
WITHOUT a code review.

  - `CC_SESSION_TTL_SECONDS` is an env var (currently 1800). Someone raising it
    above 3600 on Vercel would break every analytics-lab session, with no diff
    to review and no test to fail.
  - `cc_scenes.time_budget_s` is a DB column (max 300 today). A content author
    setting a 2-hour practice scene would break that scene the same way.

So the cap is not merely a fix for one hardcoded 5400. It is the thing that keeps
a config or content change from silently reproducing this outage on a path nobody
edited. Anyone tempted to remove it as redundant ("all callers are under 3600
anyway") should note that the callers are under 3600 by CONFIGURATION, not by
construction.

Follow-on worth considering, not done in Phase 4: the cap silently truncates. A
warning log when ttlSeconds is capped would turn a silent surprise ("why did my
2-hour scene end at 60 minutes") into a diagnosable one.

## BOTH LIVE PROOFS PASSED (2026-08-27)

First successful case-session provision in the project's history, plus the two
proofs that were blocked behind it.

### The case path works now

    session.wss_url:  present
    expires_at:       22:48 (exactly 90 min after 21:18 start)

`expires_at` at the full 5400s confirms the fix separated the two concerns
correctly: the Cloud Run REQUEST timeout was capped at 3600, the SESSION lifetime
was not touched.

### devAH's flip, exercised live for the first time

    status:           active
    provision_phase:  ready

Until this run, no case session had ever provisioned, so the flip had never
executed outside unit tests.

### The metering trap did NOT fire (live confirmation)

    cc_case_attempts_total:  1        (metered once, correct)
    claude_code_sessions:    unchanged, newest row still 2026-07-25

The case session metered its own feature and did NOT burn the analytics-lab
trial. This is the trap devAE caught mid-build and backed out of, now proven
inert under real conditions rather than only in the mutation-tested predicate.

### PROOF 1: survival past the sweep cutoff

Backdated `created_at` by 61 minutes (21:18 -> 20:17), so the row looked like a
learner 61 minutes into a 90-minute Challenge. Ran cc-reap exactly once.

    stale_provisioning_found:   0     <- the sweep did not match it
    row after reap:             status=active, provision_phase=ready
    Cloud Run revision:         still live (Ready=True)

The sweep skipped it BECAUSE the row said `active` rather than `provisioning`.
Without devAH's flip, that identical row would have matched
`status='provisioning' AND created_at < cutoff`, and the sweep would have called
destroySession on live compute. Mid-capstone kill, prevented and demonstrated.

`created_at` restored byte-identically afterwards.

### PROOF 2: budget non-interference

Read from the live session revision's container env:

    ANTHROPIC_BUDGET_USD:  3.00
    SESSION_KIND:          casebook_case

The per-kind budget resolved correctly through the real provisioning path, not
just via the partial-record type shape. Practice remains at the 0.50 default.

Note on method: the virtual key is injected into the container and deliberately
never persisted to the session row, so it cannot be read back from the DB after
the fact. The budget was verified from the revision's env instead. Worth
recording, because the obvious verification route (query the gateway for the
key's max_budget) is closed by design.

### Teardown

    per-session revisions:  0
    cc-sandbox base:        maxScale=20, minScale=0, 512Mi
    cc-llm-db:              NEVER (stopped)

The reaper again hit `orphan_failures: 1` on the latest-revision constraint;
cleared with the documented bump-then-delete. That is now twice in one phase, so
it is a reliable property of the automated path rather than a one-off.
