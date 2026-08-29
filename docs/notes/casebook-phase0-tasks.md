# Casebook Loop — Phase 0 Task Board (orchestrator-owned)

## Corrections to the plan discovered during setup (BINDING — override the plan doc)

1. **RESOLVED — worktree switched.** The original .worktrees/casebook-loop was 148
   commits behind and its migration timestamps would sort BEFORE already-applied
   migrations. Team-lead cut a fresh worktree off origin/main. THIS worktree
   (.worktrees/casebook-loop-2, branch feat/casebook-loop-2) is the ONLY valid one.
   src/lib/labs/server.ts + src/lib/config/app-flags.ts both have lab_debugging here.
2. **plan_limits `-1 = unlimited` is WRONG.** `checkUsageLimit` computes
   `allowed = used + next <= limit` with NO -1 special case (src/lib/usage/check-limit.ts).
   `-1` would BLOCK Pro users. Live DB: 28 rows, ZERO use -1. Convention = high finite
   number for pro. USE HIGH FINITE VALUES.
3. **plan_limits.feature is CHECK-constrained.** Must DROP + re-ADD
   `plan_limits_feature_check` with the FULL live allowlist + the 4 new keys.
   LIVE allowlist (14, authoritative — migrations dir is drifted and MISSING the
   careerops_* ones):
     challenges, interviews, hatch_ai_cents, hatch_chat_msgs, hatch_nudges,
     hatch_canvas_interprets, simulation_turns, live_interview_turns, quick_takes,
     ai_grading_runs, claude_code_sessions, careerops_fit_scores,
     careerops_feed_scores, careerops_resume_tailors
4. **plan_limits real columns:** (plan, feature, limit_value, window_days, unit,
   description, cost_ceiling_cents). NOT the 4-col shape implied by the plan.
5. **Migration filenames:** timestamp style `202608XX......_name.sql`, not `0XX_`.
6. **Lab flag mechanism:** `app_flags` table (key TEXT PK, value JSONB) +
   `getAppFlag` in src/lib/config/app-flags.ts (AppFlagKey union) +
   `accessFlag` on LabServerDefinition in src/lib/labs/server.ts.

## Tasks
- T0 Worktree sync — DONE (fresh worktree off origin/main; old one abandoned)
- T1 Content tables migration            [blocked by T0]
- T2 User-state tables migration         [blocked by T0]
- T3 plan_limits rows + CHECK            [blocked by T0]
- T4 lab_casebook flag                   [blocked by T0]
- T5 API route skeletons                 [blocked by T1,T2]
- T6 Admin shell /admin/casebook         [blocked by T0]
- T7 RLS verification both tiers         [blocked by T1,T2,T3]

## Additional binding rules (orchestrator)

7. **Devs NEVER apply migrations.** dev+prod SHARE the live Supabase DB. Devs write
   the .sql file and get tsc clean. The ORCHESTRATOR applies via Supabase MCP after
   diff-checking it is strictly additive. Any dev that self-applies = task rejected.
8. **window_days semantics.** checkUsageLimit is strictly rolling-window; there is no
   "lifetime" concept. Therefore:
     cc_drill_sessions_weekly     -> window_days = 7
     cc_terminal_minutes_weekly   -> window_days = 7
     cc_test_out_attempts_monthly -> window_days = 30
     cc_case_attempts_total       -> window_days = 36500 (approximates lifetime)
                                     + SQL comment noting true lifetime semantics
                                     arrive with gate logic in a later phase.
9. **git hygiene:** each dev `git add`s ONLY the files they created. Never `git add -A`
   or `git add .` (this notes file and stray artifacts must not ride along).

## Phase 1 infra note — transcript capture lives in the workspace snapshot (write-down for Phase 4)

`infra/claude-code-sandbox/entrypoint.sh` stages `~/.claude/projects`
(turn-level Claude Code conversation transcripts) into
`/workspace/.cc-transcripts/` before every 30s autosave, so they ride along in
the per-SESSION workspace tarball (`cc-sessions/<sessionId>/workspace-<ts>.tar.gz`,
pointed to by `claude_code_sessions.transcript_uri`). Without this, only
workspace files were captured, which would have silently blocked Phase 4
move-diff grading.

This was originally implemented in the per-USER state tarball
(`cc-user-state/<userId>/claude.tar.gz`) instead, which was wrong: that
tarball is restored into `$HOME` on every future session boot, so
conversation history would have leaked across sessions for the same user, and
the tarball would have grown unboundedly (upsert, latest-wins, no pruning).
Moved to the per-session workspace snapshot to fix both: it is not restored
into future sessions, and it is bounded by the session's wall-clock limit. The
unbounded-growth concern is gone — it was specific to the per-user path.

One consequence that MUST still be honored by later phases:

**Phase 4 must disambiguate transcripts by Claude Code session id.** A single
case attempt can span reconnects (dropped WebSocket, browser refresh, etc.),
and each reconnect starts Claude Code fresh, which creates a new `.jsonl`
under `.cc-transcripts/<project>/`. The staging copy is a non-deleting merge,
so a workspace tarball can contain multiple `.jsonl` files for the same
project directory across reconnects within one attempt. Never assume "the one
jsonl in the dir" — resolve the specific session's file explicitly.
