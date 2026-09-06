# Staging billing lifecycle evidence

Target Supabase project: `fkqsjjiunvvclwtgjqyc`  
Stripe mode: TEST only  
Stripe account: `acct_1PnserEGJUB78L7n`

## Profile dunning schema repair — 2026-09-06

The hosted preview returned PostgreSQL error `42703` from `/api/profile` because the route selects `profiles.subscription_status`, but source migration history had only added the other three profile dunning fields.

Migration `20260906140000_profiles_subscription_status.sql` adds the missing column as nullable `TEXT` with no default and no check constraint. A null value allows profile reads to fall back to the canonical `subscriptions.status` before the first Stripe lifecycle event. The absence of a fixed status constraint also permits every Stripe subscription status plus application billing-access states such as `disputed`.

The full profile dunning contract is:

| Column | PostgreSQL type | Nullable | Default | Constraint rationale |
| --- | --- | --- | --- | --- |
| `subscription_status` | `text` | Yes | None | Stripe and application lifecycle states are intentionally not narrowed by a check constraint. |
| `payment_failures` | `integer` | No | `0` | Consecutive failure counter used by webhook processing. |
| `past_due_since` | `timestamp with time zone` | Yes | None | Null until the first past-due transition. |
| `pro_access` | `boolean` | No | `false` | Explicit entitlement mirror. |

The migration was applied directly only after both the Supabase URL project ref and database connection identity matched staging ref `fkqsjjiunvvclwtgjqyc` and did not match the production ref. No production database was read or written.

Verification:

- Source migration regression: pass.
- Guarded staging transaction schema contract: pass for all four fields, types, nullability, and defaults.
- Authenticated hosted `GET /api/profile`: HTTP 200.
- Returned staging user identity matched the configured synthetic user.
- Initial billing state: `plan=free`, `subscription_status=null`, `payment_failures=0`, `past_due_since=null`.

## Stripe TEST lifecycle — pending

The API-only lifecycle canary remains unexecuted until the dedicated hosted TEST webhook endpoint is ready and the parent explicitly releases the run. Completing a real hosted Checkout session remains a separate browser-required gate while the Mac is locked.

The planned direct TEST lifecycle will use the same staging-owned Stripe customer created by Checkout preflight, a monthly TEST price, and a seven-day trial. It will prove genuine Stripe-signed subscription creation, persisted Pro entitlement, genuine duplicate delivery with `stripe events resend`, an unprocessed older-event replay after a newer canonical state, and cancellation downgrade to Free. The harness must refuse live credentials, the wrong Stripe account, the wrong Supabase ref, a non-owned customer, or a webhook endpoint whose URL and status do not match the staging preview.

The executable harness is local and gitignored at `.vercel/staging-billing-lifecycle.mjs`. It has been syntax-checked but has not been executed. It emits only project refs, Stripe object IDs, event IDs, status fields, and boolean results. Its state file is written with mode `0600` to `.vercel/staging-billing-lifecycle-state.json` so an interrupted run can be inspected without guessing object ownership.

Required release conditions:

1. The parent confirms the dedicated hosted TEST webhook endpoint is `READY` after the branch deployment binds its endpoint-specific signing secret.
2. Checkout API preflight has created and persisted a TEST customer for the configured staging user, without completing the browser Checkout session.
3. `STRIPE_API_KEY` is exported in the process environment and matches a TEST restricted or secret key for account `acct_1PnserEGJUB78L7n`. The key is never passed as a command-line argument.
4. `STAGING_BILLING_WEBHOOK_ENDPOINT_ID` identifies the dedicated endpoint whose URL is exactly the branch alias `/api/stripe/webhook` URL.
5. No active, trialing, incomplete, past-due, unpaid, or paused subscription already exists for that customer.

After those conditions are met, the read-only guard phase is:

```sh
node .vercel/staging-billing-lifecycle.mjs preflight
```

The mutation phase additionally requires an explicit one-run unlock:

```sh
ALLOW_STAGING_BILLING_LIFECYCLE=RUN_TEST_ONLY \
  node .vercel/staging-billing-lifecycle.mjs run
```

The run creates one TEST subscription with a seven-day trial and no live charge. It waits for the real `customer.subscription.created` event to be processed by the hosted endpoint, then checks the staging profile, subscription row, event lease state, and authenticated hosted effective plan.

For duplicate proof, it invokes the installed Stripe CLI as `stripe events resend EVENT_ID --webhook-endpoint ENDPOINT_ID`, passing the TEST key only through the child process environment. It requires the original event row to remain processed with `attempt_count=1` and requires the billing email row count to remain unchanged.

For delayed-event proof, the harness briefly disables only the dedicated TEST endpoint, sets `cancel_at_period_end=true`, captures the real older update event, and proves that event has no staging processing row. A `finally` block re-enables the endpoint. It then sets the canonical Stripe state back to `cancel_at_period_end=false`, waits for that newer event to persist, and rechecks that the older event is still unprocessed before resending it. After the genuine signed resend, staging must remain aligned with the newer Stripe state and must not create a stale email side effect. If Stripe delivered the older event before the explicit resend, the harness stops and does not claim delayed canonical-state proof.

Finally, the harness cancels only that test-owned subscription, waits for the genuine `customer.subscription.deleted` delivery, and requires both staging and authenticated hosted profile state to return to Free. It does not complete or claim proof for `checkout.session.completed`; hosted Checkout, its redirect, and the resulting event remain browser-required evidence.

If a handled run failure occurs after subscription creation, the harness records the original failure code and all captured IDs before cleanup. It re-verifies the exact TEST account, customer, staging user metadata, canary marker, and unique run ID before canceling anything. If Stripe created the subscription but the create response was interrupted before its ID was saved, cleanup searches only that verified customer for the unique canary run ID and requires exactly one match. A mismatch refuses cancellation and remains recorded for manual review. The cleanup also restores the exact dedicated endpoint to enabled state and writes its final subscription status without replacing the original failure evidence.

## First genuine lifecycle attempt — cancellation mirror failure

The first authorized API-only lifecycle attempt used the expected staging customer and generated these TEST objects:

| Object | ID | Processed state |
| --- | --- | --- |
| Trial subscription | `sub_1UCj9CEGJUB78L7nRtszKEID` | Canceled by verified failure cleanup |
| Subscription created event | `evt_1UCj9EEGJUB78L7n8EteQOym` | Processed, attempt count 1 |
| Older delayed update | `evt_1UCj9IEGJUB78L7nbay8gpwf` | Absent before explicit resend; then processed, attempt count 1 |
| Newer canonical update | `evt_1UCj9JEGJUB78L7n8v4F6ebY` | Processed before older resend, attempt count 1 |
| Subscription deleted event | `evt_1UCj9NEGJUB78L7nwS60B3EC` | Processed, attempt count 1 |

Every recorded event had `last_error=null`. No billing email audit rows were created. The dedicated endpoint was restored to enabled state, and Stripe confirmed the trial subscription was canceled. The hosted Checkout session was not completed; its browser gate remains open.

The created event established Pro access. Resending that same event through Stripe preserved one processed event row with attempt count 1. For delayed delivery, the older real update had no staging event row before the explicit resend; the newer canonical event processed first, and replaying the older event did not overwrite the newer subscription state.

The final cancellation exposed a source defect. The subscription row became `plan=free,status=canceled`, but the profile became `plan=free` while retaining `pro_access=true,subscription_status=active`. The regular Pro deletion branch only wrote `plan=free` to the profile. Migration or deployment alone cannot retroactively repair this already-processed event because duplicate delivery short-circuits before side effects.

The forward fix makes regular Pro deletion write `plan=free`, `pro_access=false`, `subscription_status=canceled`, `payment_failures=0`, and `past_due_since=null`. Before writing either the subscription row or shared profile mirrors, every deletion now checks whether a distinct current subscription still entitles the user. An old deleted subscription cannot overwrite a newer active subscription that owns the user row. An old Analytics deletion clears `cc_analytics_access` when the remaining entitlement is regular Pro, while a distinct current Analytics subscription preserves that paid Analytics access. Both sibling cases preserve shared Pro state. No production backfill, event-row deletion, duplicate replay, or direct profile repair was performed. A clean subscription lifecycle rerun must wait for a READY preview containing the fix and a new explicit GO.

## Clean genuine lifecycle rerun — pass

Candidate commit `471b7ada1ecad6ec1c45338f81b16e6a3c277ab7` was READY with the branch alias attached and the dedicated TEST endpoint enabled. The first failed-run state remained preserved under its run ID; this rerun used a separate `0600` state file.

| Object | ID | Final evidence |
| --- | --- | --- |
| Trial subscription | `sub_1UCjXxEGJUB78L7nfBk03Asw` | TEST seven-day trial created, then canceled |
| Subscription created event | `evt_1UCjXyEGJUB78L7nVxRsc7bl` | Processed, attempt count 1 |
| Older delayed update | `evt_1UCjY3EGJUB78L7nGu3MweFO` | Absent before explicit resend; then processed, attempt count 1 |
| Newer canonical update | `evt_1UCjY4EGJUB78L7nooTQlXcB` | Processed before older resend, attempt count 1 |
| Subscription deleted event | `evt_1UCjY8EGJUB78L7nMnQkE3n5` | Processed, attempt count 1 |

The actual Stripe-signed `customer.subscription.created` delivery changed the staging profile and authenticated hosted effective plan to Pro. A genuine Stripe CLI resend of that event returned through the same hosted endpoint; the event row remained processed with `attempt_count=1`, and the billing email audit count did not change.

For the delayed test, the dedicated endpoint was briefly disabled for the older `cancel_at_period_end=true` update. The older event had no staging processing row before explicit resend. After re-enabling the endpoint, the newer `cancel_at_period_end=false` event processed first. Resending the older real event through Stripe preserved the newer canonical state and produced no stale email side effect.

The actual `customer.subscription.deleted` delivery then produced the expected final state:

- Stripe subscription: `canceled`.
- Staging subscription row: `plan=free`, `status=canceled`, `cancel_at_period_end=false`, with the expected customer, subscription, and TEST price IDs.
- Staging profile: `plan=free`, `pro_access=false`, `subscription_status=canceled`, `payment_failures=0`, `past_due_since=null`.
- Authenticated hosted `/api/profile`: HTTP 200 with `plan=free`, `pro_access=false`, and `subscription_status=canceled`.
- All four event rows: processed, attempt count 1, non-null `processed_at`, and null processing token, processing start, and last error.
- Billing email audit rows for these event IDs: zero.
- Dedicated endpoint after the run: enabled and TEST mode.

The hosted Checkout session remains open and was not completed. This API-only lifecycle does not claim `checkout.session.completed`, Stripe-hosted payment UI, or browser redirect evidence.

The reviewed deletion repair also protects a distinct newer entitling subscription from an old deletion event. An old regular Pro deletion cannot overwrite the newer subscription row or downgrade its profile. An old Analytics deletion clears only Analytics access when the newer entitlement is regular Pro, and preserves Analytics access when the newer entitlement is also Analytics. The existing same-subscription canonical-state guard remains. The focused suite passed 38 tests and the production build passed for the deployed candidate.

## Hosted portal-session API probe — pass with bounded evidence

One authenticated `POST /api/stripe/portal` against the branch alias returned HTTP 200, `mode=test`, and an HTTPS URL on `billing.stripe.com`. Before that single POST, the guarded probe verified:

- Supabase ref `fkqsjjiunvvclwtgjqyc`, excluding production.
- Stripe TEST account `acct_1PnserEGJUB78L7n`.
- Staging subscription customer `cus_VD8uoGxB0kKnmM` and matching Stripe customer user and TEST-mode metadata.
- Active default TEST portal configuration `bpc_1TTwgyEGJUB78L7nAlA5nFxu`; invoice history, payment-method updates, customer updates, and end-of-period cancellation are enabled, while subscription price changes are disabled.
- Authenticated identity matched the configured synthetic staging user.

Stripe's SDK exposes portal-session creation but no retrieve or list operation. The deployed route and `tests/unit/stripe-portal-route.test.ts` prove the creation request uses the resolved customer and preview `/settings` return URL. The hosted response proves Stripe accepted the authenticated request and returned a TEST-mode portal URL on its billing host. It does not independently read back those creation parameters.

The local canary asserted an overly specific pathname shape after the successful response and therefore did not persist the tokenized URL. A mode-`0600` ignored state record preserves the safe IDs and observed response status without the URL; the POST was not repeated. Browser render, displayed customer, return navigation, and portal-scheduled cancellation UI remain open.
