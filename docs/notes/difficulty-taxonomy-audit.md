# Difficulty Taxonomy Audit

Last updated: May 6, 2026

This is a read-only audit of live Supabase project `tikkhvxlclivixqqqjyb`. No data migration was applied.

## Schema

The public schema still has `difficulty` columns on:

- `autopsy_decisions`
- `challenge_prompts`
- `challenges`
- `cohort_challenges`
- `concepts`
- `learn_modules`
- `user_settings`

No `complexity_level` column was found in the public schema during this audit.

## Distinct Values Found

The original plan's target was `easy | medium | hard`. The live project does not currently meet that target.

Current distinct values include:

- `autopsy_decisions`: `standard`, `warmup`
- `challenge_prompts`: `advanced`, `beginner`, `intermediate`
- `challenges`: `advanced`, `staff_plus`, `standard`, `warmup`
- `cohort_challenges`: `intermediate`
- `learn_modules`: `advanced`, `beginner`, `entry-point`, `foundation`, `intermediate`, `new-era`
- `user_settings`: `Mixed`

## Launch Decision

Do not apply a blanket migration during launch freeze. This touches content taxonomy, UI labels, recommendation logic, and legacy cohort data. It should be handled as a dedicated post-freeze data and UI migration with a reversible mapping plan.
