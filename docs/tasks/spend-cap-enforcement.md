# Task: enforce the per-session Analytics spend cap

**Status (updated 2026-09-07):** headroom backstop IMPLEMENTED and merged to the branch
(commit 024ea4a2) — keys minted at ceiling minus `CC_WORST_CASE_TURN_USD` (default $0.10),
user-facing ceiling unchanged, session-recovery ownership fixed, 25/25 sandbox tests pass.
Verified by unit tests + code review; NOT yet confirmed by a live staging canary (needs a
paid run on a host with more memory — the last run OOM-died before finalize). The graceful
80% wrap-up UX (Hatch prompts the user to finalize) is the remaining, front-end piece and
is still deferred — tracked with the freemium work.

---

## Problem

The LiteLLM gateway key for an Analytics session is minted with `max_budget` equal to the
raw intended ceiling, with no headroom. LiteLLM enforces per-request: it blocks a request
from *starting* once cumulative spend is at or over budget, but it lets a request that
started under budget run to completion at whatever it costs. So the cap is always overshot
by up to one turn's cost.

Observed twice on staging:
- run 88f1e579: $0.4924 vs $0.49 cap (+$0.0024)
- run 80f6d31c: $0.5456 vs $0.49 cap (+$0.0556)

The overage scales with the size of the final in-flight turn, so it is unbounded in
principle (a large final turn could blow well past the cap).

## Root cause (code)

- `src/lib/sandbox/llm-gateway.ts` (~line 239): `/key/generate` sets `max_budget: budgetUsd`
  directly — the raw ceiling, no margin subtracted.
- `src/lib/sandbox/spend-alerts.ts`: observability only. `SESSION_RUNAWAY_CENTS = 80` fires
  an alert but enforces nothing.
- No app-side per-turn or pre-flight budget check exists in the session path.

## Fix directions (pick one or both)

1. **Headroom on the minted key (simplest, do this first).** Mint the key with
   `max_budget = ceiling − worst_case_single_turn_cost`. Derive the worst-case turn from the
   model and a max-output-tokens assumption (Sonnet 4.6 turn seen here ~$0.06; size the
   margin from the actual max, not the average). Downside: reserves headroom the user never
   spends, so the effective usable budget shrinks. Document the effective ceiling in
   `cost-policy.ts` so pricing copy stays honest.
2. **App-side pre-flight budget check.** Before dispatching a turn, read remaining key spend
   and estimate the turn's max cost; if `remaining < estimated_max`, refuse the turn and
   end the session gracefully (surface a "session budget reached, wrapping up" state — the
   same graceful-cap UX noted for freemium: Hatch prompts the user to finalize at ~80%).
   More accurate than a static margin, more code.

Recommended: (1) as the hard backstop, (2) for the graceful UX. Together they give a cap
that both holds and degrades nicely.

## Acceptance

- A session whose final turn would exceed the ceiling never lets cumulative key spend cross
  the intended cap (verify on staging: cumulative `key.spend <= ceiling` at reap).
- The user sees a graceful wrap-up, not a mid-turn hard stop.
- `plan_limits` / `cost-policy.ts` document the effective per-session ceiling; no hardcoded
  budget numbers in user-facing copy.
- Regression test in `tests/lib/sandbox/` covering the mint-with-headroom math and the
  pre-flight refusal boundary.

## Ties to

- Freemium pricing decision (invisible per-session cap must hold): see the freemium
  follow-up memory and INTEGRATION_STATUS.md 2026-09-07 spend-cap finding.
- The June GCP bill lesson: unbounded per-session dollars is the failure mode to prevent.
