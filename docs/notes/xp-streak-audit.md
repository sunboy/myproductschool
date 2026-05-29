# XP And Streak Audit

Last updated: May 6, 2026

This is a launch-scope audit of XP and streak persistence. It does not claim the full original XP/streak plan is complete.

## Evidence

- `supabase/migrations/042_xp_streak_rpc_fix.sql` removes the old flat `+10 XP` side effect from `update_user_streak`; the RPC now writes one `user_streaks` row per user/date and updates `profiles.streak_days`.
- `supabase/migrations/20260506095426_restrict_security_definer_rpc_access.sql` revokes direct `update_user_streak(uuid)` execution from public, anon, and authenticated roles, then grants it to `service_role`.
- `supabase/migrations/20260506095721_set_app_function_search_paths.sql` sets a fixed search path for `update_user_streak(uuid)`.
- `src/app/api/live-interview/[id]/end/route.ts` returns early when a session is already `completed`, before XP/streak writes.
- `src/app/api/challenges/[id]/complete/route.ts` now returns stored completion data when the attempt is already `completed`, before XP, streak, move-level, study-plan, or Hatch context writes. This prevents duplicate XP awards from repeated FLOW finalization calls for the same attempt.
- `src/app/api/challenges/quick-take/submit/route.ts` now returns the stored quick-take result when the same user submits a completed quick-take challenge again, before AI grading, plan-limit reservation, attempt insert, XP write, or streak update.
- `src/lib/scoring/completed-attempt-result.ts` reconstructs duplicate-completion responses from stored `feedback_json` and attempt columns.
- `tests/lib/scoring/completed-attempt-result.test.ts` covers replaying stored FLOW completion feedback, old-attempt fallback behavior, and stored quick-take results.

## Verified Commands

```bash
npx tsx --test tests/lib/scoring/completed-attempt-result.test.ts
npx tsc --noEmit --pretty false
npm run lint
npm run build
npm run secrets:scan
```

## Remaining Gaps

- No append-only XP ledger exists, so historical XP awards still cannot be independently audited.
- XP formulas are still spread across FLOW challenge completion, quick takes, and live interview end instead of one shared calculator.
- `profiles.xp_total` updates still use read-then-update arithmetic rather than a single atomic increment RPC.
- No latest browser or API E2E proves streak behavior across UTC day boundaries.
- No latest E2E covers simultaneous completions across different attempts for the same user.

## Launch Decision

The main same-attempt duplicate-award risks for FLOW completion and quick takes are fixed and covered by focused unit tests. Full XP/streak correctness is still partial and should remain outside automatic sign-off until the ledger, shared calculator, atomic XP update, UTC boundary tests, and simultaneous-completion coverage are added deliberately.
