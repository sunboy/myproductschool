# API Reference

> Auto-generated inventory of all API routes. Last updated: 2026-04-01.
> Routes are Next.js App Router handlers at `src/app/api/`.

## Table of Contents
- [Onboarding](#onboarding)
- [Challenges (v1)](#challenges-v1)
- [Challenges (v2)](#challenges-v2)
- [Luma AI](#luma-ai)
- [Move Levels](#move-levels)
- [Learn](#learn)
- [Cohort & Leaderboard](#cohort--leaderboard)
- [Domains](#domains)
- [Prep](#prep)
- [Profile & Settings](#profile--settings)
- [Simulation](#simulation)
- [Study Plans](#study-plans)
- [Streak](#streak)
- [Stripe / Billing](#stripe--billing)
- [Misc](#misc)

---

## Onboarding

### `POST /api/onboarding/role`
**Does:** Saves the user's selected role to their profile.
**DB:** `profiles` (write — `preferred_role`, `updated_at`)
**Auth:** Yes
**Notes:** Mock mode supported (`NEXT_PUBLIC_MOCK_MODE=true` returns `{success: true}` without DB write). Valid roles: `swe`, `data_eng`, `ml_eng`, `devops`, `em`, `founding_eng`, `tech_lead`, `pm`, `designer`, `data_scientist`.

---

### `POST /api/onboarding/calibration/submit`
**Does:** Records a calibration attempt, seeds initial FLOW move levels (level 1, xp 0) and 6 learner competency axes (score 50) for the user.
**DB:** `calibration_attempts` (write — status=`grading`), `move_levels` (upsert — 4 FLOW moves), `learner_competencies` (upsert — 6 competencies)
**Auth:** Yes
**Notes:** Mock mode returns `{attempt_id: 'mock-calibration-1'}`. Accepts either full `responses` object or single-move `{move, answers}` payload.

---

### `GET /api/onboarding/results`
**Does:** Returns calibration scores, archetype, starting FLOW levels, and percentile for the current user.
**DB:** `profiles` (read — `archetype`, `archetype_description`), `move_levels` (read), `calibration_attempts` (read — `scores_json`, `percentile`)
**Auth:** Yes
**Notes:** Mock mode returns hardcoded archetype + scores (`{frame:72, list:65, optimize:58, win:81}`, `"The Strategist"`).

---

### `POST /api/onboarding/complete`
**Does:** Marks onboarding as complete on the profile; optionally saves role context and experience level.
**DB:** `profiles` (write — `onboarding_completed_at`, `role_context`), `onboarding_responses` (upsert — if `role_context` + `experience_level` provided)
**Auth:** Yes
**Notes:** Logs `onboarding.completed` event. Body is optional — bare POST also works.

---

## Challenges (v1)

### `GET /api/challenges/[id]`
**Does:** Returns a single challenge prompt by ID (v1 `challenge_prompts` table).
**DB:** `challenge_prompts` (read)
**Auth:** No

---

### `GET /api/challenges/[id]/steps`
**Does:** Returns the ordered FLOW steps for a challenge including hints and scaffold options.
**DB:** `challenge_steps` (read)
**Auth:** No

---

### `GET /api/challenges/[id]/discussions`
**Does:** Returns community discussions for a challenge, ordered by recency.
**DB:** `challenge_discussions` (read)
**Auth:** No

### `POST /api/challenges/[id]/discussions`
**Does:** Posts a new discussion comment on a challenge.
**DB:** `challenge_discussions` (write)
**Auth:** Optional (falls back to `mock-user` if unauthenticated)

---

### `GET /api/challenges/[id]/discussions/[discussionId]/replies`
**Does:** Returns all replies on a discussion thread, ordered ascending.
**DB:** `discussion_replies` (read), `profiles` (read — `username`)
**Auth:** No

### `POST /api/challenges/[id]/discussions/[discussionId]/replies`
**Does:** Posts a reply to a discussion thread.
**DB:** `discussion_replies` (write), `profiles` (read — `username` for response)
**Auth:** Optional (falls back to `mock-user`)

---

### `PATCH /api/challenges/[id]/discussions/[discussionId]/upvote`
**Does:** Toggles upvote on a discussion (add if not upvoted, remove if already upvoted).
**DB:** `challenge_discussions` (read `upvoted_by` array, write — `upvoted_by`, `upvote_count`)
**Auth:** Optional (falls back to `mock-user`)

---

### `GET /api/challenges/count`
**Does:** Returns count of published challenges, optionally filtered by paradigm.
**DB:** `challenge_prompts` (read — count only)
**Auth:** No
**Notes:** Mock mode (`USE_MOCK_DATA=true`) returns `{count: 42}`.

---

### `GET /api/challenges/drafts`
**Does:** Returns the user's most recent in-progress (unsubmitted) challenge attempts for "continue where you left off" dashboard card.
**DB:** `challenge_attempts` (read — where `submitted_at IS NULL`), `challenge_prompts` (read — `title`)
**Auth:** Yes

---

### `GET /api/challenges/next`
**Does:** Returns the next recommended challenge for the user, using semantic novelty (embedding centroid) when available, falling back to weakest-FLOW-move targeting.
**DB:** `profiles` (read — `preferred_role`), `move_levels` (read), `challenge_attempts` (read), `challenge_prompts` (read)
**Auth:** Yes
**Notes:** Uses `match_novel_challenges` RPC when user has 3+ response embeddings. Mock mode returns a hardcoded challenge.

---

### `GET /api/challenges/quick-take`
**Does:** Returns today's quick-take prompt, or a weakest-move-targeted prompt as fallback.
**DB:** `move_levels` (read), `quick_take_prompts` (read)
**Auth:** Yes
**Notes:** Mock mode returns a hardcoded DAU diagnostic prompt.

---

### `POST /api/challenges/quick-take/submit`
**Does:** Scores a quick-take response using heuristic word-count grading, logs the event, and updates move XP and streak.
**DB:** `quick_take_prompts` (read), `session_events` (write), `move_levels` (updated via internal call to `/api/move-levels/update`), `profiles` (streak updated via RPC)
**Auth:** Yes
**Notes:** Mock mode returns fixed mock scores. Calls `update_user_streak` RPC fire-and-forget.

---

### `GET /api/challenges/recommended`
**Does:** Returns Luma's recommended challenge — the highest learning-impact uncompleted challenge targeting the weakest FLOW move.
**DB:** `challenge_attempts` (read), `move_levels` (read), `challenge_prompts` (read)
**Auth:** Yes
**Notes:** Mock mode returns a hardcoded prioritization challenge.

---

### `POST /api/challenges/submit`
**Does:** Saves a v1 challenge attempt and triggers async Luma grading (feedback generation, embedding, trap detection, XP update, FLOW move update, achievement check).
**DB:** `profiles` (read — `plan`; write — `xp_total`), `challenge_attempts` (write — attempt row, then update with `feedback_json`, `score`, `response_embedding`), `user_failure_patterns` (read for bonus XP, persisted via `/api/luma/feedback`), `move_levels` (updated via internal call)
**Auth:** Yes
**Notes:** LLM: `claude-sonnet-4-6` (via `/api/luma/feedback`). Async grading — returns `{attemptId}` immediately; grading page polls for completion. Free tier enforces 3 challenges/day. Calls `match_thinking_traps` RPC for trap detection.

---

## Challenges (v2)

### `GET /api/v2/challenges`
**Does:** Returns paginated list of published v2 challenges with per-user attempt stats.
**DB:** `challenges` (read), `challenge_attempts_v2` (read — count, best score, completion status)
**Auth:** Yes
**Notes:** Supports `paradigm`, `industry`, `role`, `difficulty` query filters plus `page`/`limit` pagination.

---

### `GET /api/v2/challenges/[id]`
**Does:** Returns a v2 challenge with its FLOW steps (ordered), question counts per step, and the user's current in-progress attempt if any.
**DB:** `challenges` (read), `flow_steps` (read), `step_questions` (read — count), `challenge_attempts_v2` (read)
**Auth:** Optional (mock mode allowed)

---

### `POST /api/v2/challenges/[id]/start`
**Does:** Creates a new `challenge_attempts_v2` row (or returns an existing in-progress one to resume); enforces free-tier 3-attempts-per-day limit.
**DB:** `challenge_attempts_v2` (read for resume check + count; write — new attempt), `subscriptions` (read — plan check)
**Auth:** Yes
**Notes:** Returns `{attempt, is_resume: bool}`. Free tier cap: 3 attempts/day.

---

### `GET /api/v2/challenges/[id]/step/[step]`
**Does:** Returns all questions and shuffled answer options for a given FLOW step, with already-answered flags and a role-personalized nudge.
**DB:** `flow_steps` (read), `challenge_attempts_v2` (read — `role_id`), `step_questions` (read), `flow_options` (read — strips `quality`/`points`/`explanation` before sending), `step_attempts` (read — answered set), `role_lenses` (read — nudge)
**Auth:** Yes
**Notes:** Options are deterministically shuffled per user+challenge+step (mulberry32 PRNG). Requires `attempt_id` query param.

---

### `POST /api/v2/challenges/[id]/step/[step]/submit`
**Does:** Grades one question answer (pure MCQ, hybrid MCQ+elaboration, or freeform AI), persists the `step_attempts` row, advances attempt sequence, and detects step completion to advance to the next FLOW step.
**DB:** `challenge_attempts_v2` (read — ownership; write — `current_question_sequence`, `current_step`), `flow_options` (read — full rubric), `challenges` (read — scenario), `step_questions` (read — competencies, weights), `step_attempts` (write — scored attempt; read — completion count), `flow_steps` (read — total question count)
**Auth:** Yes
**Notes:** LLM: `claude-sonnet-4-6` for `freeform` and `mcq_plus_elaboration` paths (lazy import `freeform-grader`). Deterministic grading for `pure_mcq`. Returns revealed options with quality/points after submission.

---

### `POST /api/v2/challenges/[id]/coaching`
**Does:** Returns role-personalized coaching (2-paragraph `role_context` + `career_signal`) for a question answer; caches results per `userId:challengeId:step:questionId:optionId:roleId`.
**DB:** `coaching_cache` (read + write), `challenge_attempts_v2` (read — `role_id`), `step_questions` (read), `flow_options` (read), `challenges` (read — scenario), `role_lenses` (read), `step_attempts` (write — `role_context`, `career_signal`)
**Auth:** Yes
**Notes:** LLM: `claude-opus-4-6` with `thinking: {type: 'adaptive'}`. Supports both option-based and freeform paths. Cache reduces LLM calls significantly.

---

### `POST /api/v2/challenges/[id]/complete`
**Does:** Finalizes a v2 challenge attempt — computes weighted step scores, aggregates total score, runs ELO-style competency updates, awards XP, and writes a Luma context row.
**DB:** `challenge_attempts_v2` (read — ownership; write — `status`, `total_score`, `max_score`, `grade_label`, `completed_at`), `step_attempts` (read — all answers), `step_questions` (read — weights), `role_lenses` (read), `learner_competencies` (read + upsert), `profiles` (read + write — `xp_total`), `luma_context_v2` (write — challenge insight)
**Auth:** Yes
**Notes:** Calls `update_user_streak` RPC fire-and-forget. `grade_label` values: `Developing`, `Competent`, `Strong`, `Exceptional`.

---

## Luma AI

### `POST /api/luma/chat`
**Does:** Streams a Luma coaching reply given a challenge prompt, conversation history, and user message.
**DB:** None
**Auth:** No
**Notes:** LLM: `claude-sonnet-4-6`, max 300 tokens. Falls back to canned mock replies if `USE_MOCK_DATA=true` or no `ANTHROPIC_API_KEY`.

---

### `POST /api/luma/feedback`
**Does:** Calls Luma to score a v1 challenge response on 4 FLOW dimensions, validates the JSON schema, retries once on parse failure, and persists detected failure patterns.
**DB:** `user_failure_patterns` (write — detected patterns per attempt)
**Auth:** No (called server-to-server from `/api/challenges/submit`)
**Notes:** LLM: `claude-sonnet-4-6`, max 2000 tokens. Validates with `LumaFeedbackSchema` (Zod). One auto-retry with stricter prompt. Mock mode returns `MOCK_FEEDBACK_FULL` fixture. Logs `session.feedback_generated` event.

---

### `POST /api/luma/nudge`
**Does:** Returns a Luma thinking nudge for a draft response (in-progress challenge); rate-limited to 3 nudges per attempt.
**DB:** `nudge_usage` (read — count; write — record usage)
**Auth:** Optional
**Notes:** LLM: `claude-sonnet-4-6`, max 150 tokens. Returns HTTP 429 when limit reached. Mock mode returns random canned nudge.

---

## Move Levels

### `GET /api/move-levels`
**Does:** Returns all 4 FLOW move levels for the current user; auto-initializes rows at level 1 if none exist.
**DB:** `move_levels` (read; write — initialize if missing)
**Auth:** Yes
**Notes:** Mock mode returns synthetic levels.

---

### `GET /api/move-levels/[move]`
**Does:** Returns level, XP, progress percentage, XP-to-next, and recent history for a single FLOW move.
**DB:** `move_levels` (read), `move_level_history` (read — last 20 entries)
**Auth:** Yes
**Notes:** Valid moves: `frame`, `list`, `optimize`, `win`.

---

### `POST /api/move-levels/update`
**Does:** Updates XP and level for one or more FLOW moves given a `{userId, scores}` payload; records level-up events.
**DB:** `move_levels` (read + write — `xp`, `level`, `progress_pct`), `move_level_history` (write — one row per move)
**Auth:** No (called server-to-server)
**Notes:** Score is on 0–10 scale; multiplied ×10 for XP delta. XP_PER_LEVEL = 500.

---

## Learn

### `GET /api/learn`
**Does:** Returns all learn modules with per-user chapter completion counts and progress percentages.
**DB:** `learn_modules` (read), `user_learn_progress` (read)
**Auth:** Yes
**Notes:** Mock mode returns modules from `LEARN_MODULES_SEED`.

---

### `GET /api/learn/[slug]`
**Does:** Returns a learn module with its chapters, each flagged as completed/unlocked based on user progress.
**DB:** `learn_modules` (read), `learn_chapters` (read), `user_learn_progress` (read)
**Auth:** Yes
**Notes:** Chapters unlock sequentially (chapter N unlocks after N-1 completed).

---

### `GET /api/learn/[slug]/[chapter]`
**Does:** Returns a single learn chapter's full content.
**DB:** `learn_modules` (read), `learn_chapters` (read)
**Auth:** Yes

---

### `POST /api/learn/[slug]/[chapter]/complete`
**Does:** Marks a learn chapter as completed for the current user.
**DB:** `learn_modules` (read), `learn_chapters` (read), `user_learn_progress` (upsert)
**Auth:** Yes

---

## Cohort & Leaderboard

### `GET /api/cohort/current`
**Does:** Returns the active cohort challenge and the user's existing submission (if any), plus days remaining.
**DB:** `cohort_challenges` (read), `cohort_submissions` (read)
**Auth:** Yes
**Notes:** Mock mode returns a hardcoded active challenge.

---

### `POST /api/cohort/submit`
**Does:** Submits (or re-submits) a response to the active cohort challenge.
**DB:** `cohort_challenges` (read — verify active), `cohort_submissions` (upsert — `onConflict: user_id,cohort_challenge_id`)
**Auth:** Yes

---

### `GET /api/cohort/leaderboard`
**Does:** Returns ranked leaderboard for the active cohort challenge with the current user's rank and percentile.
**DB:** `cohort_challenges` (read), `cohort_submissions` (read — all scores), `profiles` (read — display names)
**Auth:** Yes
**Notes:** Mock mode returns 4 hardcoded ranked entries.

---

## Domains

### `GET /api/domains`
**Does:** Returns all published domains with per-user challenge completion counts and progress percentages.
**DB:** `domains` (read), `challenge_prompts` (read), `challenge_attempts` (read — completed IDs)
**Auth:** Yes
**Notes:** Mock mode returns 2 hardcoded domains.

---

### `GET /api/domains/[slug]`
**Does:** Returns a domain with its challenges (each flagged as completed with best score) and move-training counts per FLOW step.
**DB:** `domains` (read), `challenge_prompts` (read), `challenge_attempts` (read — completed IDs and scores)
**Auth:** Yes

---

## Prep

### `GET /api/prep/challenges`
**Does:** Returns published challenges grouped into difficulty chapters (Beginner/Intermediate/Advanced) with per-user best scores.
**DB:** `challenge_prompts` (read), `challenge_attempts` (read — best scores; optional, skipped if not authed), `domains` (read — slug/title join)
**Auth:** Optional

---

### `GET /api/prep/companies`
**Does:** Returns a list of companies for the prep hub, falling back to a static list if the DB table is missing.
**DB:** `companies` (read — optional, static fallback)
**Auth:** No

---

## Profile & Settings

### `GET /api/profile`
**Does:** Returns the current user's profile, subscription info, and today's attempt count vs daily limit.
**DB:** `profiles` (read), `subscriptions` (read), `challenge_attempts` (read — today's count)
**Auth:** Yes

### `PATCH /api/profile`
**Does:** Updates allowed profile fields (`display_name`, `avatar_url`).
**DB:** `profiles` (write)
**Auth:** Yes

---

### `GET /api/profile/export`
**Does:** Returns a JSON download of the user's full data export (profile, attempts, move levels).
**DB:** `profiles` (read), `challenge_attempts` (read — last 200), `user_move_levels` (read)
**Auth:** Yes
**Notes:** Returns `Content-Disposition: attachment` for direct download.

---

### `GET /api/settings`
**Does:** Returns the user's notification and goal settings; returns sensible defaults if no row exists.
**DB:** `user_settings` (read)
**Auth:** Yes

### `PATCH /api/settings`
**Does:** Upserts the user's settings; allowed fields: `notifications`, `daily_goal_count`, `preferred_role`.
**DB:** `user_settings` (upsert — `onConflict: user_id`)
**Auth:** Yes

---

### `GET /api/analytics/summary`
**Does:** Returns a user's analytics summary (aggregated challenge and session stats).
**DB:** via `getUserAnalyticsSummary()` helper (reads multiple tables)
**Auth:** No (userId passed as query param `?userId=...`)

---

### `GET /api/career-benchmark`
**Does:** Returns career benchmark levels and the user's current benchmark level based on average score across last 20 attempts.
**DB:** `challenge_attempts` (read — last 20 scores)
**Auth:** Yes
**Notes:** Mock mode returns `Senior Engineer`. Levels: Junior Engineer (p25) → Principal (p95).

---

## Simulation

### `POST /api/simulation/start`
**Does:** Creates a new simulation session.
**DB:** `simulation_sessions` (write)
**Auth:** Yes
**Notes:** Optional `companyId` body field.

---

### `GET /api/simulation/[id]`
**Does:** Returns a simulation session with its full turn history.
**DB:** `simulation_sessions` (read), `simulation_turns` (read), `company_profiles` (read — name, industry, interview_style), `challenge_prompts` (read — title, prompt)
**Auth:** Yes

---

### `POST /api/simulation/[id]/turn`
**Does:** Submits one user turn and returns Luma's AI reply, persisting both to the turn log.
**DB:** `simulation_sessions` (read — session + company/challenge context), `simulation_turns` (read — history; write — user + luma turns)
**Auth:** Yes
**Notes:** LLM: `claude-sonnet-4-6`, max 300 tokens. System prompt includes company and challenge context. Returns `questions_remaining` countdown.

---

### `POST /api/simulation/[id]/end`
**Does:** Ends a simulation session — generates a Luma debrief from the full transcript and marks session completed.
**DB:** `simulation_sessions` (read — transcript; write — `status=completed`, `debrief_json`, `completed_at`), `simulation_turns` (read)
**Auth:** Yes
**Notes:** LLM: `claude-sonnet-4-6`, max 1000 tokens. Validates debrief with `LumaFeedbackSchema`. Triggers achievement check fire-and-forget. Idempotent: returns cached debrief if already completed.

---

## Study Plans

### `GET /api/study-plans`
**Does:** Returns all published study plans.
**DB:** `study_plans` (read)
**Auth:** Yes

---

### `GET /api/study-plans/[slug]`
**Does:** Returns a study plan with its chapters (enriched with challenge details) and the user's current progress.
**DB:** `study_plans` (read), `study_plan_chapters` (read), `challenge_prompts` (read — title, difficulty), `user_study_plans` (read)
**Auth:** Yes

---

### `POST /api/study-plans/[slug]/activate`
**Does:** Activates a study plan for the user, deactivating any currently active plan first.
**DB:** `study_plans` (read), `user_study_plans` (write — deactivate old; upsert new — `onConflict: user_id,plan_id`)
**Auth:** Yes

---

## Streak

### `POST /api/streak/recover`
**Does:** Recovers a broken streak by consuming either a streak shield or 50 XP.
**DB:** `profiles` (read — `streak_days`, `streak_shield_count`, `xp_total`; write — increments streak, decrements shield or XP)
**Auth:** Yes
**Notes:** Body: `{method: "shield" | "xp"}`. Returns 400 if insufficient shields/XP.

---

## Stripe / Billing

### `POST /api/stripe/create-checkout`
**Does:** Creates a Stripe Checkout session for HackProduct Pro ($39/month) and returns the redirect URL.
**DB:** None (Stripe only)
**Auth:** Yes
**Notes:** Requires `STRIPE_SECRET_KEY` env var. Returns 503 if Stripe not configured.

---

### `POST /api/stripe/webhook`
**Does:** Handles Stripe webhook events to sync subscription state: upserts `subscriptions` row and updates `profiles.plan` on creation/update/deletion.
**DB:** `subscriptions` (upsert), `profiles` (write — `plan`)
**Auth:** No (Stripe signature verified via `STRIPE_WEBHOOK_SECRET`)
**Notes:** Handles `customer.subscription.created`, `.updated`, `.deleted` events.

---

## Misc

### `POST /api/achievements/check`
**Does:** Checks all achievement definitions against the user's current stats (challenge count, streak, simulation completions) and awards any newly earned achievements with XP.
**DB:** `achievement_definitions` (read), `user_achievements` (read — already unlocked; write — new), `profiles` (read — streak; write — `xp_total`), `challenge_attempts` (read — count), `simulation_sessions` (read — completed count)
**Auth:** No (called server-to-server with `user_id` in body)

---

### `POST /api/embeddings/generate`
**Does:** Generates and stores vector embeddings for content rows; supports single-record mode (`{table, id, column, text}`) and batch mode (`{batch: true}` to process all null-embedding rows).
**DB:** `challenge_prompts` (write — `scenario_embedding`), `challenge_steps` (write — `recommended_embedding`, `pattern_embedding`), `thinking_traps` (write — `exemplar_embedding`)
**Auth:** No (admin client; intended for seeding scripts)
**Notes:** Batch mode processes 4 embedding columns across 3 tables. Skips rows where embedding already exists.

---

### `GET /api/prescription/next`
**Does:** Returns Luma's learning prescription — the most impactful next challenge and mode based on the user's recurring failure patterns.
**DB:** `challenge_attempts` (read — submission count, mode distribution, completed IDs), `user_pattern_summary` (read — recurring patterns), `challenge_prompts` (read — next uncompleted)
**Auth:** No (`userId` as query param)
**Notes:** Three prescription types: `onboarding` (< 2 submissions), `explore` (no recurring patterns), `prescription` (pattern-driven). Mock mode returns hardcoded FP-09 prescription.

---

### `GET /api/progress/vocabulary`
**Does:** Returns vocabulary flashcards due for review or new, optionally filtered by domain; prioritizes overdue cards first, limited to 20.
**DB:** `concepts` (read), `domains` (read — slug join), `flashcards` (read), `vocabulary_progress` (read)
**Auth:** Yes

### `POST /api/progress/vocabulary`
**Does:** Records a flashcard review confidence rating (1–5) and computes the next review date using a spaced-repetition interval schedule.
**DB:** `vocabulary_progress` (upsert — `onConflict: user_id,concept_id`)
**Auth:** Yes
**Notes:** Intervals by confidence: 0→same day, 1→1d, 2→3d, 3→7d, 4→14d, 5→30d.

---

### `GET /api/v2/dna`
**Does:** Returns the user's 6 learner competency scores, weakest link, and overall skill level (`Beginner` / `Developing` / `Advanced` / `Expert`).
**DB:** `learner_competencies` (read), `profiles` (read — `preferred_role`), `role_lenses` (read)
**Auth:** Yes

---

### `GET /api/v2/dna/recommend`
**Does:** Recommends the next v2 challenge targeting the user's weakest learner competency.
**DB:** `learner_competencies` (read), `profiles` (read — `preferred_role`), `role_lenses` (read), `challenge_attempts_v2` (read — completed IDs), `challenges` (read — `primary_competencies` filter)
**Auth:** Yes

---

### `GET /api/v2/roles`
**Does:** Returns all role lenses (role ID, label, short label) for role-select UI.
**DB:** `role_lenses` (read — `role_id`, `label`, `short_label`)
**Auth:** No

---

### `POST /api/waitlist`
**Does:** Adds an email address (plus optional name and company) to the waitlist.
**DB:** `waitlist` (write)
**Auth:** No
**Notes:** Returns 409 if email already on waitlist. Validates email format server-side.

---

### `GET /api/attempts`
**Does:** Returns the current user's most recent completed v2 challenge attempts (default: last 5, max 20).
**DB:** `challenge_attempts_v2` (read — `status=completed`), `challenges` (read — title)
**Auth:** Yes

### `GET /api/attempts/[id]`
**Does:** Returns a single v1 challenge attempt with its feedback JSON and detected failure patterns.
**DB:** `challenge_attempts` (read — with `challenge_prompts` join), `user_failure_patterns` (read)
**Auth:** Yes

### `GET /api/attempts/[id]/share-card`
**Does:** Returns the data needed to render a shareable score card for a completed attempt (score, title, XP, percentile, share URL).
**DB:** `challenge_attempts` (read — with `challenge_prompts`, `move_level_history` joins), `profiles` (read — `display_name`)
**Auth:** Yes
**Notes:** Mock mode returns a fixed share card payload.
