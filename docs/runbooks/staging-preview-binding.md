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

The binding only affects this Preview branch. It does not change Production, the global Preview environment, another branch, Supabase data, or Stripe live mode. No webhook or Stripe transaction was created.

## Vercel environment inventory

The Vercel API returned these exact IDs with `target=preview` and `gitBranch=feat/platform-rebuild-20260905`. Values are omitted.

| Key | Environment ID | State |
| --- | --- | --- |
| `CC_SQL_INSTANCE` | `uSCd1xk3D8vfit5Z` | empty compute gate |
| `CLOUD_RUN_BASE_REVISION` | `gNy79fP95RDjQnzE` | preserved |
| `CLOUD_RUN_IMAGE` | `X7KVUQtHOqBUfJAk` | preserved |
| `CLOUD_RUN_SERVICE` | `A8i6HLM88qB01sfj` | empty compute gate |
| `LLM_GATEWAY_URL` | `Tw3pq8hs81qtC3Rs` | empty compute gate |
| `NEXT_PUBLIC_APP_URL` | `RTUIZzJ34YguN1qt` | branch alias |
| `NEXT_PUBLIC_STRIPE_MODE` | `ftCdw2ecKKJhYCJO` | `test` |
| `NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY` | `Ic5UtMjI6mXbABfd` | test account |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `Spzxhydogmhqcnml` | staging project |
| `NEXT_PUBLIC_SUPABASE_URL` | `xpATtSnznRe4w6Wx` | staging project |
| `STRIPE_MODE` | `uzz3CkBRXmKTA30Q` | `test` |
| `STRIPE_TEST_PRICE_ANALYTICS_ANNUAL` | `oNuEEc0fKdGm5KqH` | test price |
| `STRIPE_TEST_PRICE_ANALYTICS_MONTHLY` | `0yFnQMeQ0RwJNVkh` | test price |
| `STRIPE_TEST_PRICE_ANNUAL` | `ceo007HIxXF7HWF4` | test price |
| `STRIPE_TEST_PRICE_MONTHLY` | `K6YCqbncDWbHSUjP` | test price |
| `STRIPE_TEST_SECRET_KEY` | `qJPL9pM9s1GjJZh1` | Vercel sensitive |
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

After a new deployment proves database isolation, create one TEST webhook at:

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

Store its unique signing secret as sensitive `STRIPE_WEBHOOK_SECRET` on this branch only. Keep the endpoint disabled until isolation is verified. Affiliate and Connect account events are outside this canary.

## Analytics compute gate

The database is isolated, but the analytics compute plane is not. Production `cc-reap` scans the shared Cloud Run service and can delete staging revisions that are absent from the production database. It can also stop the shared SQL instance when production appears idle.

The branch therefore has empty overrides for `CLOUD_RUN_SERVICE`, `CC_SQL_INSTANCE`, and `LLM_GATEWAY_URL`. Existing `CLOUD_RUN_IMAGE` and `CLOUD_RUN_BASE_REVISION` entries remain in place.

Do not start analytics sessions or invoke `cc-reap` on this preview. Create a separate Cloud Run service, gateway database, gateway URL, and cleanup owner before removing the gate.

Direct-key fallback is closed. `CC_ALLOW_UNCAPPED_LOCAL` is not enabled, and `allowsDirectProviderKey()` accepts the fallback only when `NODE_ENV` is `development` or `test`. Hosted Vercel Preview code uses the production runtime path.

## Deployment protection

Project inspection returned `ssoProtection=null` and `gitForkProtection=true`. The branch alias returned HTTP `200` without authentication. Fork protection does not apply to this first-party branch. Recheck the fresh deployment URL because project protection can change independently.

## First bound candidate

Deployment `dpl_8yNJtCJ3SeWncc86mjKKBqAtFY5L` used exact Git SHA `4413077c2eaee10675531a27a4313dab73089724` on the expected branch. It changed from `BUILDING` to `ERROR` and never reached `READY`.

The sanitized failure was `BUILD_UTILS_SPAWN_1`: `npm run build` failed while collecting page data for `/explore/autopsies/[slug]` because staging Supabase had no autopsy content. TypeScript completed successfully. The application error points to `scripts/sync-autopsy-content-supabase.ts`. No runtime, asset, authenticated API, or billing checks were run against this failed deployment.

## Gate after a successful deployment

1. Verify the exact Git SHA, branch, deployment ID, and `READY` state.
2. Scan compiled public assets for staging ref `fkqsjjiunvvclwtgjqyc` and confirm production ref `tikkhvxlclivixqqqjyb` is absent.
3. Sign in with the staging test user and call `GET /api/profile`. Confirm HTTP `200`, the expected staging user ID, and a staging-owned profile.
4. Confirm the analytics start path fails closed without waking SQL, creating a Cloud Run revision, or calling the gateway.
5. Create the disabled TEST webhook, add its signing secret to this branch, redeploy, and enable it.
6. Run test-owned checkout, signed delivery, duplicate delivery, entitlement, portal return, and cancellation checks.

## Rollback

These ignored local files are mode `0600`:

- `.vercel/staging-preview-env-backup.env`: resolved environment captured before binding.
- `.vercel/staging-preview-compute-rollback.env`: concrete pre-gate compute values. The sensitive SQL value came from its local operator source because Vercel pull omits sensitive values.
- `.vercel/staging-preview-env-current.env`: resolved environment captured after binding. Sensitive values are omitted by Vercel.
- `.vercel/staging-preview-env-metadata.json`: IDs, names, scopes, types, and timestamps only.

Delete only the branch environment IDs in the inventory to roll back this binding. Removing the empty service and gateway overrides restores inherited Preview settings. Restore the prior SQL value from the compute rollback file only when shared compute is intentionally re-enabled. Do not upload the full pulled environment because it includes inherited settings and blank sensitive placeholders.

If a TEST webhook is created later, disable and delete that exact endpoint and remove its branch-only signing secret. Do not modify Production variables, live Stripe resources, or production Supabase.
