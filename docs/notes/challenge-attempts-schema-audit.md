# Challenge Attempts Schema Audit

Last updated: May 6, 2026

## Finding

Live Supabase project `tikkhvxlclivixqqqjyb` has `public.challenge_attempts.completed_at`, `total_score`, `max_score`, `status`, `feedback_json`, `mental_models_breakdown`, `primary_competency`, and `weakest_competency`.

The live table does not have the legacy fields `submitted_at`, `score`, `score_json`, `mode`, or `response_embedding`.

## Fix

The active code paths that queried legacy `challenge_attempts` fields now use the live schema:

- Completion filters use `status = 'completed'`.
- Completion ordering uses `completed_at`.
- Scores use `total_score / max_score`.
- Feedback and diagnosis pages read `feedback_json`, `mental_models_breakdown`, and `weakest_competency`.
- Data export reads `move_levels` instead of the removed `user_move_levels`.
- `/api/challenges/next` no longer queries the absent `response_embedding` field.
- `/api/prescription/next` no longer queries the absent attempt `mode` field.

Compatibility fields named `submitted_at` remain only where `/api/attempts` deliberately maps `completed_at` for older UI consumers.

## Verification

- Live schema query against `information_schema.columns` confirmed the current `challenge_attempts`, `move_levels`, and `profiles` columns.
- `rg -n "submitted_at|score_json|user_move_levels|\\.select\\(['\\\"]score|\\.not\\(['\\\"]score|\\.order\\(['\\\"]submitted_at|\\.select\\(['\\\"]mode|response_embedding" src -S` now returns only expected compatibility or non-`challenge_attempts` references.
- `npx tsc --noEmit --pretty false` passed.
- `npm run lint` exited `0` with the existing warning set.
- `npm run build` passed.
- `npm run secrets:scan` passed.
