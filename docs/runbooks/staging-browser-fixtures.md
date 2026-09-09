# Staging browser fixtures

Captured at `2026-09-06T16:58:01Z` for staging Supabase branch `platform-rebuild-staging-20260906-r2` (`fkqsjjiunvvclwtgjqyc`). Production project `tikkhvxlclivixqqqjyb` was used only as the read-only source.

## Scope and guards

The fixture operation required the source URL to resolve to production ref `tikkhvxlclivixqqqjyb`, the target URL to resolve to staging ref `fkqsjjiunvvclwtgjqyc`, and the refs to differ. It rejected unpublished source rows, unexpected slugs, unexpected domain references, source rows with `created_by` or `decision_id` references, and any target ID or slug conflict.

No learner attempts, profiles, subscriptions, feedback, sessions, solutions, private records, or broad seed content were copied. No user or live-interview session was created and no compute was started.

## Published challenge fixtures

Repository evidence in `docs/visual-overhaul/INTEGRATION_STATUS.md` and `docs/visual-overhaul/DESKTOP_EXECUTION.md` identifies the prior SQL `5/5` and `7.2/10` exercise as **Refund Rate per Seller**, including its hidden zero-order-seller cases. A production catalog lookup resolved that title to the exact slug `computing-refund-rate-per-seller-without-breaking-on-zero-orders`; the slug was not guessed.

All three required published rows were absent from staging before the operation. Exactly these rows were copied:

| Slug | ID | Type | Domain |
| --- | --- | --- | --- |
| `counting-distinct-senders-behind-support-ticket-aliases` | `32d32027-aa76-4da9-a96a-9a46cedb7c5a` | `algorithm` | `algorithms` |
| `model-a-ski-and-snowboard-rental-shop-schema` | `cae6daa5-5279-4aac-943f-8d71bb1b4014` | `data_modeling` | `databases-data` |
| `computing-refund-rate-per-seller-without-breaking-on-zero-orders` | `83771be9-a4eb-4ca4-90e3-e47529d5e5ec` | `sql` | `databases-data` |

The referenced published domain rows already existed in staging with the same stable IDs, slugs, and titles:

- `d0000001-0000-0000-0000-000000000007` — `databases-data`
- `d0000001-0000-0000-0000-000000000008` — `algorithms`

They were reused without modification. The target insert omitted only generated column `display_number_text`; staging regenerated it from the copied source fields.

Post-insert verification compared every returned challenge column between production and staging and found no differences for any slug. All three staging rows have `is_published=true`, retain their exact source IDs and domain IDs, and are visible when the database transaction assumes the `authenticated` role. Both referenced published domains are visible to that role as well.

## Live-interview catalog check

The live-interview page reads published challenges with a non-null `scenario_question` and types `flow`, `freeform`, `quick_take`, `system_design`, `data_modeling`, `sql`, or `algorithm`, ordered by difficulty and limited to 120.

Staging currently exposes 21 rows through that query for the `authenticated` role:

| Type | Staging rows |
| --- | ---: |
| `quick_take` | 20 |
| `algorithm` | 1 |
| `flow` | 0 |
| `freeform` | 0 |
| `system_design` | 0 |
| `data_modeling` | 0 |
| `sql` | 0 |

All 21 have the fields required by the page. Staging also has 30 company-profile rows containing 120 role personas. This is sufficient to render the lobby and select product-sense or coding scenarios for signed-in browser checks.

The catalog is not sufficient for full discipline coverage: no scenario row currently supports the lobby's system-design, data-modeling, or SQL choices. Production's corresponding published catalog has 795 eligible rows (`165` flow, `25` quick-take, and `605` algorithm) but also has zero eligible system-design, data-modeling, or SQL rows. This broader content gap was reported separately and was not filled by this narrow fixture operation.

## Anonymous published-catalog access

Before browser testing, anonymous staging reads of `challenges` and `domains` returned HTTP 401 / PostgreSQL `42501`. Both tables had a public published-read policy, but their separate admin policies also applied to `public`; those admin branches queried `profiles`, whose admin-read policy calls `public.is_admin()`. Anonymous execution of that helper is correctly revoked, so policy evaluation failed before the published-read branch could return rows.

`public.is_admin()` is a stable, zero-argument, `SECURITY DEFINER` SQL function owned by `postgres` with `search_path=public`. It returns whether the current `auth.uid()` has a `profiles` row whose role is `admin`. `authenticated` and `service_role` can execute it; `anon` cannot. That helper and its grants were left unchanged.

Additive migration `20260906160000_scope_catalog_admin_policies.sql` changes only the roles on `challenges_admin` and `Admins can manage domains` from `public` to `authenticated`. Their expressions are unchanged. Published-read policies `challenges_read` and `Anyone can view published domains` remain assigned to `public`, so anonymous users can read published catalog rows without entering either admin branch. No table grants, profile policies, helper definitions, or function privileges were broadened.

The migration was applied only to staging after checking the exact target ref. Staging migration history records `20260906160000`. Regression coverage in `tests/unit/public-catalog-anon-access.test.ts` applies the migration twice in a transaction and verifies the four policy roles plus the revoked anonymous helper privilege. Its API test then:

- reads all three published challenge fixtures and both published domains anonymously;
- inserts one uniquely named unpublished synthetic challenge through `service_role` and verifies anonymous results remain empty for it;
- verifies anonymous `is_admin()` execution and profile reads still fail with PostgreSQL `42501`;
- deletes the synthetic challenge and verifies cleanup.

Both regression tests pass, direct anonymous catalog reads now return HTTP 200, and no synthetic probe rows remain.
