# Staging public autopsy content

## 2026-09-06 sync evidence

Target: staging Supabase project `fkqsjjiunvvclwtgjqyc`.

The tracked autopsy source was synced with the existing content sync command and the staging service credentials from `.env.staging.local`:

```sh
npx tsx scripts/sync-autopsy-content-supabase.ts --published-only
```

Before invoking the command, the runner required both `SUPABASE_URL` and the `NEXT_PUBLIC_SUPABASE_URL` override used by `createAdminClient()` to equal `https://fkqsjjiunvvclwtgjqyc.supabase.co`. A mismatched project ref stopped the run before client creation.

The `--published-only` selection limited writes to published editorial content in these tables:

- `autopsy_companies`
- `autopsy_content_stories`
- `autopsy_story_versions`
- `autopsy_story_images`

No draft stories, learner records, billing data, authentication records, or analytics data were read or written. The sync did not connect to or mutate production.

### Verification

Pre-sync staging counts were zero in all four tables. Post-sync verification compared the complete staging company/story key sets with the local published source and checked version, status, canonical path, and image counts.

| Check | Result |
| --- | ---: |
| Companies | 72 |
| Published stories | 92 |
| Published version 1 rows | 92 |
| Image metadata rows | 644 |
| Company key set equals published source | Pass |
| Story key set equals published source | Pass |
| Every story is published | Pass |
| Every story has a canonical path | Pass |
| Every version is published version 1 | Pass |
| Image count equals published source | Pass |

An anonymous-key read returned 72 companies and 92 published stories. This confirms the public read policy exposes the rows needed by Next.js static parameter collection for `/explore/autopsies/[slug]`.
