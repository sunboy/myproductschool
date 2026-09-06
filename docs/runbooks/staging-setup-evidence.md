# Platform rebuild staging setup evidence

Captured at `2026-09-06T15:26:23Z` and updated at `2026-09-06T15:34:41Z` from application commit `852442318394a2678ec27502093360863e399291` on `feat/platform-rebuild-20260905`.

## Provider allocation

- Production parent: `HackProduct` / `tikkhvxlclivixqqqjyb` in organization `evrrsluzxabwdugjbtqa`.
- Staging branch: `platform-rebuild-staging-20260906-r2`.
- Staging project ref: `fkqsjjiunvvclwtgjqyc`.
- Staging branch ID: `4248f0f3-7ad2-44b7-9b7c-0f29180acf3c`.
- Data cloning: disabled (`with_data=false`).
- Recurring cost accepted by the owner: `$0.01344/hour`, approximately `$0.32/day`.
- Provider state at capture: preview project `ACTIVE_HEALTHY`; branch lifecycle `MIGRATIONS_FAILED` because the automatic legacy replay stopped at migration `002`. The application schema was subsequently repaired through the staging database connection, but Supabase retains the original branch lifecycle label.
- Branch inventory at capture: exactly the default `main` branch and this one staging branch. The earlier empty branch `dsxufetlucqqfweivnwc` is absent.

The first replacement attempt exposed its generated database password in local tool output. That empty branch was deleted before it was attached to Vercel or received users, content, payments, or webhook traffic. Its local credential files were removed. The current branch was created afterward with new credentials.

## Credentials and test identity

Branch credentials and the test login are stored only in `/Users/sandeep/Projects/myproductschool/.env.staging.local`. The file mode is `0600` and `.gitignore` excludes `.env*`.

Stored key names are:

- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DEFAULT_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `STAGING_TEST_EMAIL`
- `STAGING_TEST_PASSWORD`
- `STAGING_TEST_USER_ID`

The confirmed staging user is `staging.platform-rebuild+9d6ca39f99db@example.com`, ID `3fdd1b26-14b2-4af3-af13-ab173bee2354`. Password authentication returned HTTP 200 and the response identity matched that ID. The generated password is not recorded in this document.

The user is deliberately free by default:

- profile: `plan=free`, `role=user`
- subscription: `plan=free`, `status=active`

## Schema establishment

Supabase's automatic branch replay applied `001_initial_schema.sql` and stopped because `002_remaining_tables.sql` repeats policies already created by `001`. The repair removed the duplicated staging policies before applying `002`, then used `supabase db push --include-all` with transactional migration application.

The repository also contains older numeric migrations that depend on objects created later by timestamped migrations. Those statements were deferred until their dependencies existed and then applied. This includes the response-vector functions and scaffold options, live-interview links and Hatch role constraint, study-plan chapter ID conversion, user-setting preferences, reading-path seed, interview loops and discipline constraints, FLOW score rescaling and credit registry, and community/cohort tables. Security migrations were applied conditionally to the functions that exist. Legacy policy migrations whose pipeline tables do not exist were recorded as repaired; absence of those unused tables is stricter than exposing them without policy.

The resulting migration state is:

- source migrations recorded: `178`
- latest migration: `20260906130000`
- `supabase db push --include-all --dry-run`: `Remote database is up to date`
- public base tables: `117`
- deferred-object verification: passed

The additive Stripe event migration is present with columns `status`, `processing_started_at`, `processing_token`, `processed_at`, `attempt_count`, `last_error`, and `effects`. All four RPCs exist: `claim_stripe_event`, `complete_stripe_event`, `release_stripe_event`, and `record_stripe_payment_failure`.

A transaction-only probe exercised claim, release, reclaim, and complete, then rolled back. The probe left zero `stripe_events` rows.

Hosted Supabase gives `anon` and `authenticated` explicit function grants. Revoking only `PUBLIC` did not remove those grants. Additive migration `20260906130000_restrict_stripe_event_processing_rpc_access.sql` was applied to staging to repair already-applied environments. Staging is hardened with zero client execute grants and four `service_role` execute grants across the four Stripe processing RPCs.

The ACL regression is PostgreSQL-backed. After loading the ignored staging environment, `npx vitest run tests/unit/stripe-event-processing-migration.test.ts tests/unit/stripe-webhook-mode.test.ts` passed 14 tests. The migration test refuses the production project ref, explicitly grants all four functions to `anon` and `authenticated`, executes the additive migration, checks client and service-role privileges with `has_function_privilege`, and rolls the transaction back.

The legacy profile admin policy also caused recursive RLS evaluation. Staging uses a `SECURITY DEFINER` `is_admin()` predicate, and an authenticated profile query now succeeds. The remaining Supabase advisor baseline is 16 security findings (5 info, 2 error, 9 warning) and 767 performance findings on the rebuilt empty schema. The two security errors are legacy security-definer views; no new Stripe RPC ACL finding remains.

## Allowed public content

Only one production challenge and its referenced public domain were copied:

- challenge `cc_001_checkout_funnel`, published
- domain `d0000001-0000-0000-0000-000000000001`, published
- `BQ_PROJECT=hackproduct`
- `BQ_DATASET=case_001_checkout_funnel`
- four Claude Code sub-problems

The corrected metadata was read from production and inserted into staging. No production identity, profile, subscription, payment, Stripe event, attempt, saved work, or private content was copied.

After setup, staging contains one synthetic auth user, one free profile, one free subscription, and zero Stripe events. The synthetic profile has `cc_analytics_access=false`. Source migration seeds also provide 21 published challenges including the copied checkout challenge, three public reading paths, and seven study plans.

## Attachment gate

No Vercel environment variable has been changed. No Stripe webhook endpoint has been created or enabled. No checkout, portal, subscription mutation, or live charge has run.

Do not start analytics or call `cc-reap` from this staging branch. Its reaper scans the shared `cc-sandbox`, so analytics stays disabled until staging has separate compute. Billing validation is independent of that compute isolation.

The staging API, password login, source migration state, required public challenge, and Stripe processing schema are ready for a parent-coordinated feature-branch preview switch. Keep the webhook disabled until the preview deployment is confirmed to use ref `fkqsjjiunvvclwtgjqyc` and the source ACL regression is included in that candidate.

## Private LiteLLM database assessment

Read-only staging inspection confirms the existing `litellm` schema is available for a private gateway database without adding Cloud SQL cost. It currently contains zero tables, has zero schema or table privileges for `PUBLIC`, `anon`, `authenticated`, and `authenticator`, and the staging PostgreSQL role can create objects in the current database. The `vector` extension is also installed.

Use this existing schema with a dedicated login role, a schema-scoped `search_path`, bounded session-pooler connections, and explicit schema, table, and default privileges. Keep `litellm` absent from the Supabase API exposed-schema list and do not grant client or PostgREST roles access. A second database is technically permitted by the current PostgreSQL role, but Supabase's managed API, pooling, backups, and migrations center on the default database; the private schema is the lower-risk reuse path. No LiteLLM schema, role, table, database, gateway, or connection setting was created or changed during this assessment.

## Cost stop and cleanup

To stop the hourly charge and remove this isolated environment:

1. Confirm the target branch ID is `4248f0f3-7ad2-44b7-9b7c-0f29180acf3c` and the project ref is `fkqsjjiunvvclwtgjqyc`.
2. Remove or replace any feature-branch-only Vercel variables that reference this staging ref. Do not change production variables.
3. Remove any Stripe test webhook that was later created specifically for this preview.
4. Delete the Supabase branch by its exact branch ID, or run `supabase branches delete platform-rebuild-staging-20260906-r2 --project-ref tikkhvxlclivixqqqjyb --yes`.
5. Verify the Supabase branch list contains only default `main`.
6. Delete `/Users/sandeep/Projects/myproductschool/.env.staging.local` and any temporary test artifacts.

Deleting this branch removes the synthetic user, public copied challenge, and all staging-only state. It does not change production. The recurring branch charge stops when Supabase confirms deletion.
