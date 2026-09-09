# Redesign rollback runbook

Historical July release only. For the September rebuild, use [platform-rebuild-release.md](platform-rebuild-release.md); its billing and analytics compatibility constraints differ.

The Stage B redesign (`feature/redesign-options`: app shell, dashboard, practice page,
coding + canvas workspace consolidation, canvas autosave hardening) merged into `main`
on 2026-07-17 as a single `--no-ff` merge commit. This runbook is the fallback path if
production misbehaves after that deploy.

The redesign makes **no breaking API or DB changes**, so every rollback option
below is safe to run without touching Supabase:

- The only API change (`resume=1` on `GET /api/challenges`) is additive.
- One migration ships with the branch (`20260712000000_hatch_interactions.sql`),
  but it is additive (`create table if not exists` + own RLS policies), was
  already applied to the shared dev/prod Supabase DB during Stage B development
  (verified 2026-07-17: table exists with rows), and the old code never touches
  the table. Do NOT drop it on rollback.

## Frozen fallback refs (created before the merge)

| Ref | What it is |
|---|---|
| branch `backup/main-pre-redesign` | `main` exactly as it was before the merge |
| tag `pre-redesign-2026-07-17` | same commit, immutable name |

Both are pushed to origin. Do not delete them until the redesign has soaked in prod.

## Option 1 — Vercel Instant Rollback (fastest, seconds, no git)

Use this first when prod is actively broken.

1. Vercel dashboard → the `myproductschool` project → **Deployments**.
2. Find the last **Production** deployment created *before* the redesign merge
   (its commit message will be from `backup/main-pre-redesign`'s tip,
   `Merge pull request #19 ...`).
3. `⋯` menu → **Instant Rollback** (or **Promote to Production**).
4. Prod serves the old build immediately. `main` still contains the redesign,
   so fix or revert at leisure (Options 2/3), then push to re-deploy.

Note: any push to `main` while rolled back triggers a fresh deploy of whatever
`main` contains, which cancels the rollback. Do Option 2 promptly if the redesign
needs to come out for more than a few hours.

## Option 2 — Revert the merge commit (durable, no force-push)

Removes the redesign from `main` as a normal forward commit. History stays intact;
Vercel auto-deploys the reverted state.

```bash
git fetch origin
# Find the redesign merge commit on main (the --no-ff merge of feature/redesign-options):
git log --merges --oneline -5 origin/main
# Revert it. -m 1 keeps the pre-merge main side as the surviving parent:
git checkout main && git pull
git revert -m 1 <merge-sha>
git push origin main
```

Verify the new Vercel production deployment goes READY on the revert SHA.

To bring the redesign back later: `git revert <revert-sha>` (revert the revert),
or fix forward on `feature/redesign-options` and merge again.

## Option 3 — Redeploy the frozen tag (belt and suspenders)

If `main` is in a confusing state and you just need the old app live:

```bash
git fetch origin --tags
git checkout -b hotfix/pre-redesign pre-redesign-2026-07-17
git push origin hotfix/pre-redesign
```

Then in Vercel, deploy that branch and promote it to production (or temporarily
change the production branch). This never touches `main`.

## Post-rollback checklist

- [ ] Prod smoke: `/dashboard`, `/challenges`, one coding workspace, one canvas workspace.
- [ ] Confirm the serving deployment SHA matches what you intended
      (known gotcha: a deploy can exist but not be the one serving — check
      the Production alias, not just the deployments list).
- [ ] In-progress user drafts are unaffected either way: `draft_snapshot`
      autosave payloads written by the new code hydrate fine under the old code
      (same shape; the new fields are additive).
- [ ] File the reason for rollback as an issue so the fix-forward is tracked.
