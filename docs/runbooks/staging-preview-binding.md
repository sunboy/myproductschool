# Platform rebuild staging preview binding

Captured on `2026-09-06` for `feat/platform-rebuild-20260905`.

## Scope

| Item | ID or value |
| --- | --- |
| Vercel team | `team_gOiGgobpBZjhBPxPTkIYrSTE` |
| Vercel project | `prj_BnLtw2GgCcCyCnMciQ3Ps1Wezkff` (`myproductschool`) |
| Vercel target | `Preview` |
| Git branch | `feat/platform-rebuild-20260905` |
| Branch alias | `https://myproductschool-git-feat-platform-rebu-249507-sunboy2s-projects.vercel.app` |
| Supabase staging ref | `fkqsjjiunvvclwtgjqyc` |
| Stripe test account | `acct_1PnserEGJUB78L7n` |

The binding only affects this Preview branch. It does not change Production, the global Preview environment, another branch, Supabase data, or Stripe live mode. One dedicated TEST webhook was created and later enabled after the guarded checkout passed.

## Vercel environment inventory

The Vercel API returned these exact IDs with `target=preview` and `gitBranch=feat/platform-rebuild-20260905`. Values are omitted.

| Key | Environment ID | State |
| --- | --- | --- |
| `CC_ALLOW_UNCAPPED_LOCAL` | `9CecdZJV3nq4LTd4` | `false` |
| `CC_MAX_SESSION_BUDGET_USD` | `KjHXF3GNS8cpwtb4` | `0.49` |
| `CC_MAX_SESSION_TTL_SECONDS` | `EI3Vu6eFS3cPfOLY` | `1800` |
| `CC_SESSION_BUDGET_USD` | `MsXMcX8MHhiP6ZOZ` | `0.49` |
| `CC_SQL_INSTANCE` | `uSCd1xk3D8vfit5Z` | empty compute gate |
| `CC_SQL_WAKE_MS` | `ZYBHVfgh5DtpRp8m` | `0` |
| `CLOUD_RUN_BASE_REVISION` | `gNy79fP95RDjQnzE` | isolated sterile base |
| `CLOUD_RUN_IMAGE` | `X7KVUQtHOqBUfJAk` | immutable staging sandbox |
| `CLOUD_RUN_REGION` | `VgxmRZYfTIfKr8Q1` | isolated map |
| `CLOUD_RUN_RUNTIME_SA` | `n8TCQ1Rv18AaKO34` | read-only runtime identity |
| `CLOUD_RUN_SA_JSON` | `V3JM2sa9zWaHS3e5` | Vercel sensitive |
| `CLOUD_RUN_SERVICE` | `A8i6HLM88qB01sfj` | isolated staging sandbox |
| `CRON_SECRET` | `fHUYRu286lIIHpf8` | Vercel sensitive |
| `GCP_PROJECT` | `ntFE4XBWNMpCDTWM` | isolated map |
| `LLM_GATEWAY_MASTER_KEY` | `Uf92MIHJrq1M1Cti` | Vercel sensitive |
| `LLM_GATEWAY_URL` | `Tw3pq8hs81qtC3Rs` | isolated staging gateway |
| `NEXT_PUBLIC_APP_URL` | `RTUIZzJ34YguN1qt` | branch alias |
| `NEXT_PUBLIC_STRIPE_MODE` | `ftCdw2ecKKJhYCJO` | `test` |
| `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY` | `Ic5UtMjI6mXbABfd` | test account |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `Spzxhydogmhqcnml` | staging project |
| `NEXT_PUBLIC_SUPABASE_URL` | `xpATtSnznRe4w6Wx` | staging project |
| `SANDBOX_WSS_HOST` | `BiMyc7j8tfVcrYdQ` | isolated staging host |
| `SESSION_TOKEN_SECRET` | `C7F1n8qUXbd8RSQv` | Vercel sensitive |
| `STRIPE_MODE` | `uzz3CkBRXmKTA30Q` | `test` |
| `STRIPE_TEST_PRICE_ANALYTICS_ANNUAL` | `oNuEEc0fKdGm5KqH` | test price |
| `STRIPE_TEST_PRICE_ANALYTICS_MONTHLY` | `0yFnQMeQ0RwJNVkh` | test price |
| `STRIPE_TEST_PRICE_ANNUAL` | `ceo007HIxXF7HWF4` | test price |
| `STRIPE_TEST_PRICE_MONTHLY` | `K6YCqbncDWbHSUjP` | test price |
| `STRIPE_TEST_SECRET_KEY` | `qJPL9pM9s1GjJZh1` | Vercel sensitive |
| `STRIPE_WEBHOOK_SECRET` | `tEhGMdll8vYk9DPj` | Vercel sensitive |
| `SUPABASE_SERVICE_ROLE_KEY` | `AFuOVTUKjxNBBQ7f` | Vercel sensitive |

The Supabase URL was checked for staging ref `fkqsjjiunvvclwtgjqyc`. The source keys were checked for the staging JWT and Stripe test-key families without logging their values. Vercel reports the service-role and Stripe secret entries as sensitive.

## Stripe test configuration

The runtime keys follow `src/lib/stripe/config.ts`.

| Runtime key | Test price ID |
| --- | --- |
| `STRIPE_TEST_PRICE_MONTHLY` | `price_1TbiSTEGJUB78L7nn5ePQKVo` |
| `STRIPE_TEST_PRICE_ANNUAL` | `price_1TTTaSEGJUB78L7nRkD275eQ` |
| `STRIPE_TEST_PRICE_ANALYTICS_MONTHLY` | `price_1TedjCEGJUB78L7nE9tdkC6T` |
| `STRIPE_TEST_PRICE_ANALYTICS_ANNUAL` | `price_1TedjDEGJUB78L7nehEgipO1` |

Both mode selectors are `test`. The test secret and publishable key came from `.env.local`. The previously verified default test portal configuration is `bpc_1TTwgyEGJUB78L7nAlA5nFxu`. The portal route uses Stripe's default configuration.

Dedicated TEST webhook `we_1UCibBEGJUB78L7n92aeofTh` now targets:

`https://myproductschool-git-feat-platform-rebu-249507-sunboy2s-projects.vercel.app/api/stripe/webhook`

Subscribe to these billing events:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
customer.subscription.trial_will_end
invoice.paid
invoice.payment_failed
invoice.payment_action_required
charge.refunded
charge.dispute.created
charge.dispute.closed
charge.dispute.updated
charge.dispute.funds_withdrawn
charge.dispute.funds_reinstated
```

The endpoint has 16 events and `livemode=false`. Its unique signing secret is Vercel sensitive environment entry `tEhGMdll8vYk9DPj`, scoped only to this Preview branch. It was enabled after a guarded test checkout passed against a deployment containing the secret. Affiliate and Connect account events are outside this canary.

## Analytics isolation map

The branch now points at the dedicated resources described in `docs/runbooks/staging-analytics-isolation.md`: service `cc-sandbox-staging`, sterile base `cc-sandbox-staging-00002-wm4`, the immutable staging sandbox image, a staging-only gateway, and the staging orchestrator identity. The runtime service account remains the read-only BigQuery identity.

The branch has default and maximum session budgets of `$0.49` and a maximum TTL of `1800` seconds. Direct-key fallback is disabled. `CC_SQL_INSTANCE` remains empty and `CC_SQL_WAKE_MS=0`, so this preview cannot start or stop the production SQL instance.

The environment map is ready for deployment, but analytics remains disabled. Do not grant `cc_analytics_access`, start a learner session, send a model request, or invoke `cc-reap` until private snapshot buckets and the staging-only scheduled cleanup probe pass. The webhook is an independent billing gate and also remains disabled.

## Deployment protection

Project inspection returned `ssoProtection=null` and `gitForkProtection=true`. The branch alias returned HTTP `200` without authentication. Fork protection does not apply to this first-party branch. Recheck the fresh deployment URL because project protection can change independently.

## First bound candidate

Deployment `dpl_8yNJtCJ3SeWncc86mjKKBqAtFY5L` used exact Git SHA `4413077c2eaee10675531a27a4313dab73089724` on the expected branch. It changed from `BUILDING` to `ERROR` and never reached `READY`.

The sanitized failure was `BUILD_UTILS_SPAWN_1`: `npm run build` failed while collecting page data for `/explore/autopsies/[slug]` because staging Supabase had no autopsy content. TypeScript completed successfully. The application error points to `scripts/sync-autopsy-content-supabase.ts`. No runtime, asset, authenticated API, or billing checks were run against this failed deployment.

## Second bound candidate

Deployment `dpl_88LvqVgRWigCadc4RVbjDPTBVCpo` reached `READY` for exact Git SHA `c0758c647eba7e903c26ba1a464aa8f224ac9d54`. The expected branch alias is attached.

Compiled login assets contain staging ref `fkqsjjiunvvclwtgjqyc` and do not contain production ref `tikkhvxlclivixqqqjyb`. Direct sign-in against staging authenticated the expected test user. The hosted `GET /api/profile` then returned HTTP `500` with `profile_query_failed`. Sanitized Vercel runtime logs identify PostgreSQL `42703`: `profiles.subscription_status` does not exist.

A read-only `GET /api/billing/prices` returned HTTP `200` with source `stripe`. It resolved monthly test price `price_1TbiSTEGJUB78L7nn5ePQKVo` to `3900` cents and annual test price `price_1TTTaSEGJUB78L7nRkD275eQ` to `19900` cents. This proves the deployed server can use the intended Stripe test configuration without creating a transaction.

An additive staging dunning migration repaired the profile schema. A guarded read-only probe then returned `runtimeIdentityVerified=true`, HTTP `200` from profile and price reads, and plan `free` for the expected staging user.

Two guarded checkout preflight attempts created no Checkout Session. Stripe returned `customer_tax_location_invalid`: automatic tax needs a valid customer address or `customer_update[address]=auto`. The source fix is tracked separately; do not work around it by inserting a fabricated customer address.

## Third bound candidate

Deployment `dpl_2rYFHG8mPDrs1PkiUAZZXLkJfxFj` reached `READY` for exact Git SHA `2c1a0bd6b1fadad621a0113687cc9ede16113c74` with the expected branch alias attached. Authenticated profile returned HTTP `200`, the expected staging user, and plan `free`. Billing prices returned HTTP `200`, source `stripe`, and the expected monthly and annual test IDs and amounts. Authenticated dashboard assets contained the staging ref and test publishable key and did not contain the production ref.

An invalid-HMAC request returned HTTP `400` with `Invalid signature`, proving the deployed webhook route has a secret configured without reaching event processing. Stripe and Vercel do not permit the sensitive endpoint secret to be read back after creation, so the synthetic correct-HMAC mode-guard probe was not possible without rotating the endpoint. The real signed TEST delivery is the authoritative binding check.

After the checkout address fix, guarded preflight created TEST Checkout Session `cs_test_b1mVlbXX9cmmO5NxbkilSbOJi2CEwiOpGdGQSs69WIB4BRP1bgPVMduzlH` for customer `cus_VD8uoGxB0kKnmM`. It verified the test price, redirects, and staging customer persistence; a repeat returned the same session/customer. The dedicated TEST webhook was then enabled for the lifecycle canary.

## Gate after a successful deployment

1. Verify the exact Git SHA, branch, deployment ID, and `READY` state.
2. Scan compiled public assets for staging ref `fkqsjjiunvvclwtgjqyc` and confirm production ref `tikkhvxlclivixqqqjyb` is absent.
3. Sign in with the staging test user and call `GET /api/profile`. Confirm HTTP `200`, the expected staging user ID, and a staging-owned profile.
4. Confirm the analytics start path fails closed without waking SQL, creating a Cloud Run revision, or calling the gateway.
5. Deploy the `$0.49` analytics caps and recheck exact SHA, profile identity, test prices, and SQL-off controls.
6. Verify the private snapshot buckets and staging-only cleanup schedule before granting analytics access.
7. Run the real signed TEST webhook lifecycle: checkout completion, duplicate delivery, entitlement, portal return, and cancellation. Disable the endpoint again if the canary fails.

## Rollback

These ignored local files are mode `0600`:

- `.vercel/staging-preview-env-backup.env`: resolved environment captured before binding.
- `.vercel/staging-preview-compute-rollback.env`: concrete pre-gate compute values. The sensitive SQL value came from its local operator source because Vercel pull omits sensitive values.
- `.vercel/staging-preview-env-current.env`: resolved environment captured after binding. Sensitive values are omitted by Vercel.
- `.vercel/staging-preview-env-metadata.json`: IDs, names, scopes, types, and timestamps only.

Fail closed before teardown: set branch-only `CLOUD_RUN_SERVICE`, `LLM_GATEWAY_URL`, and `CC_SQL_INSTANCE` to empty values, set `CC_SQL_WAKE_MS=0`, and deploy that state. Then remove the other isolated analytics entries. Do not simply delete the service and gateway overrides because inherited Preview settings may point at shared production compute. Do not upload the full pulled environment because it includes inherited settings and blank sensitive placeholders.

If a TEST webhook is created later, disable and delete that exact endpoint and remove its branch-only signing secret. Do not modify Production variables, live Stripe resources, or production Supabase.
