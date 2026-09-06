# Billing preview gate — September 6, 2026

## Verified in the connected HackProduct test account

The account is `acct_1PnserEGJUB78L7n`, with `livemode=false`.
No live account operations, charges, subscription changes, or webhook creations
were performed during this audit.

| Preview variable | Existing test price | USD amount |
| --- | --- | --- |
| `STRIPE_TEST_PRICE_MONTHLY` | `price_1TbiSTEGJUB78L7nn5ePQKVo` | $39/month |
| `STRIPE_TEST_PRICE_ANNUAL` | `price_1TTTaSEGJUB78L7nRkD275eQ` | $199/year |
| `STRIPE_TEST_PRICE_ANALYTICS_MONTHLY` | `price_1TedjCEGJUB78L7nE9tdkC6T` | $49.99/month |
| `STRIPE_TEST_PRICE_ANALYTICS_ANNUAL` | `price_1TedjDEGJUB78L7nehEgipO1` | $249.99/year |

These match the current US plan amounts in `src/lib/billing/plans.ts`. The
account also has regional prices; the table is not a regional-pricing audit.

The active default test portal configuration is
`bpc_1TTwgyEGJUB78L7nAlA5nFxu`. It enables invoice history, payment-method
updates, customer updates, and cancellation at the end of the billing period.
Subscription price changes are disabled.

Listing test webhook endpoints returned an empty list. Having products/prices
and a portal does not prove checkout-to-entitlement delivery.

## Configuration required before the canary

1. Confirm a preview uses an isolated staging database and test-owned users.
   Test Stripe credentials alone do not isolate application entitlement writes.
2. Configure that preview with `STRIPE_MODE=test`,
   `NEXT_PUBLIC_STRIPE_MODE=test`, a restricted test key in
   `STRIPE_TEST_SECRET_KEY`, its test publishable key, the four test prices above,
   and its own application URL. Store secrets in sensitive deployment variables.
3. Register a test webhook for that verified preview's `/api/stripe/webhook`
   route, using the events handled by the route. Store its signing secret as
   `STRIPE_WEBHOOK_SECRET` on that preview only. Do not reuse a production endpoint
   or production signing secret.
4. Deploy and exercise app checkout, webhook delivery, persisted entitlements,
   portal return, cancellation, and duplicate-event delivery with test-owned data.
   Do not infer success from a Stripe-only API call or a mocked unit test.

The continuation runtime has a read-capable Vercel connection, but no exposed
environment-write tool, Vercel CLI, or `VERCEL_TOKEN`. It has no local test key.
The existing preview previously returned `stripe_not_configured`; this audit
did not change its configuration or claim that a live billing journey passed.

## Code guardrails added in this pass

- Test setup validates the value in `STRIPE_TEST_SECRET_KEY`, refusing live or
  invalid values before constructing the Stripe client or creating products.
- Webhooks validate `event.livemode` against the configured runtime after
  signature verification and before database access. This prevents a
  misconfigured test/live endpoint from applying the opposite mode's events.
- Regression tests use local Stripe-generated signatures, including matching
  modes, mismatched modes, and an invalid signature. They do not contact Stripe.

These guards do not replace staging isolation or end-to-end billing verification.

## Desktop continuation status

Desktop Vercel CLI authentication and the local Stripe test key now work. The earlier cloud-runtime access limitation above is historical. Test prices and account are verified; billing remains deliberately unconfigured on the feature preview because it still uses the production database.

The owner subsequently approved staging testing at $0.01344/hour (about $0.32/day). The current isolated branch is `fkqsjjiunvvclwtgjqyc`; its repaired replay records all 181 current source migrations through `20260906160000_scope_catalog_admin_policies.sql`, and the database is healthy. The provider's branch lifecycle still reports the earlier automatic replay failure, so that status is not being represented as green. No production users or payments were copied. Setup evidence and repair details are recorded in `docs/runbooks/staging-setup-evidence.md`.

The additive migration `20260906120000_stripe_event_processing_state.sql` introduces fenced event-processing claims and once-only payment-failure increments. Hosted staging transaction checks pass. The staging audit found explicit `anon` and `authenticated` execution grants that survived revoking `PUBLIC`; staging now restricts these RPCs to `service_role`, and the additive repair `20260906130000_restrict_stripe_event_processing_rpc_access.sql` and transactional PostgreSQL regression pass (14 focused tests total). Preview environment isolation must be verified before registering a test webhook. Complete checkout/portal/entitlement journeys remain open. Production billing configuration and entitlements remain untouched by the preview test setup.

The staging-bound runtime now returns the correct synthetic user from `/api/profile` and verified test prices from `/api/billing/prices`. Missing dunning-status schema is repaired by `20260906140000_profiles_subscription_status.sql`. Checkout preflight exposed Stripe's automatic-tax requirement for persisting a collected address on the pre-created customer; candidate `2c1a0bd6` adds `customer_update.address=auto` only when a customer ID is supplied. The test endpoint is registered and disabled; no successful checkout or genuine delivery has yet passed. The candidate containing this fix, the endpoint secret, and isolated analytics configuration is awaiting hosted verification.

Hosted checkout API creation now passes on `2c1a0bd6`, including the configured test price, staging customer persistence, preview return URLs, and identical retry session. Genuine created, duplicate, delayed, and deleted Stripe events reached the enabled dedicated endpoint. The first lifecycle run found stale profile mirrors after regular cancellation and stopped; its test subscription is canceled. The forward handler repair also protects distinct newer Pro and Analytics subscriptions from old deletion events. It passes the production build and focused tests; browser checkout and portal journey checks remain required.

## Current hosted billing gate

The clean API-only lifecycle rerun passed on commit `471b7ada1ecad6ec1c45338f81b16e6a3c277ab7` using the staging-owned user, customer `cus_VD8uoGxB0kKnmM`, TEST account `acct_1PnserEGJUB78L7n`, and dedicated endpoint `we_1UCibBEGJUB78L7n92aeofTh`.

| Gate | Status | Evidence |
| --- | --- | --- |
| Staging identity and TEST-mode isolation | Pass | Supabase ref, Stripe account, endpoint mode, customer ownership, and TEST price guards passed. |
| Checkout API session creation | Pass | Hosted TEST session creation, address collection for automatic tax, customer persistence, preview return URLs, and same-minute idempotent retry passed. |
| Genuine subscription-created delivery | Pass | `evt_1UCjXyEGJUB78L7nVxRsc7bl` processed and established Pro entitlement. |
| Genuine duplicate delivery | Pass | Stripe CLI resend returned through the hosted endpoint; the event remained processed with `attempt_count=1` and no email side-effect delta. |
| Genuine delayed delivery | Pass | Older `evt_1UCjY3EGJUB78L7nGu3MweFO` was absent before explicit resend; newer `evt_1UCjY4EGJUB78L7nooTQlXcB` processed first; the older signed resend preserved canonical state. |
| Genuine deletion and downgrade | Pass | `evt_1UCjY8EGJUB78L7nMnQkE3n5` produced subscription `free/canceled`, profile `free`, `pro_access=false`, `subscription_status=canceled`, and hosted effective plan `free`. |
| Endpoint and TEST object cleanup | Pass | Dedicated endpoint remains enabled; TEST subscription `sub_1UCjXxEGJUB78L7nfBk03Asw` is canceled. |
| Stripe-hosted Checkout completion | Open — browser required | The real Checkout session remains open; no `checkout.session.completed` evidence is claimed. |
| Optional 3DS challenge | Open — browser required | Standard TEST Visa `4242` Checkout and the success redirect passed; no 3DS challenge-card journey was performed. |
| Portal session API | Pass | One authenticated hosted POST returned HTTP 200, `mode=test`, and an HTTPS `billing.stripe.com` URL after guards verified the staging ref, TEST account, stored customer ownership, and active default TEST portal configuration. |
| Stripe-hosted portal render and return | Open — browser required | Must prove the portal renders the correct customer and returns to preview `/settings`. |
| Portal-scheduled cancellation UI | Open — browser required | The API lifecycle proved signed update/deletion handling, not the user journey through the portal. |

The remaining server-side billing evidence is the real Checkout completion event. The completed subscription lifecycle found no remaining server-side entitlement, duplicate-delivery, delayed-event, or final-cancellation gap. Invoice payment-failure, action-required, renewal, and trial-ending paths retain automated coverage but were outside this bounded no-charge canary.

The portal API probe created exactly one session. Stripe does not provide a portal-session retrieve or list API, so independent readback of the created session's customer and return URL is unavailable. The deployed route and focused unit test establish that it passes the resolved customer and preview `/settings` return URL to Stripe; the live response establishes successful TEST-mode creation on the expected Stripe host. A local pathname check was stricter than the returned opaque URL shape and rejected the response before the tokenized URL was persisted. The request was not repeated. No portal render, customer display, return navigation, or portal cancellation UI is claimed.
## Analytics entitlement canary follow-up

The first Analytics trial canary on `abfe572acc61ec2e018602064dda14f009370c8e` stopped before session creation. Genuine creation event `evt_1UCl0IEGJUB78L7njnF3J2NR` processed once, but the hosted profile stayed Free because the shared Pro entitlement matcher accepted only the literal `pro` subscription plan and excluded the existing `analytics_monthly` and `analytics_annual` plans. The webhook's Analytics grant alone therefore did not establish consistent application entitlement.

Owned TEST subscription `sub_1UCl0HEGJUB78L7nRpapHMBN` was canceled; deletion event `evt_1UCl1oEGJUB78L7n0mJOTbDL` processed once. The final hosted/database state is Free with both access flags false and subscription canceled. No learner session, attempt, key, or sandbox revision was created. This failure is preserved separately from the successful regular Pro lifecycle. The shared matcher now includes both canonical Analytics plans under unchanged lifecycle guards; 12 focused tests, TypeScript, lint, and independent review pass. A fresh hosted Analytics rerun is still required before closing this gate.

## Browser billing completion and current reactivation exception

The regular Pro TEST billing journey is now complete on the isolated preview for the standard TEST Visa ending in `4242`. Stripe-hosted Checkout accepted the card, returned to the application, and produced Pro access through a signed `checkout.session.completed` event. The TEST customer portal rendered the correct trial and payment method, scheduled an end-of-trial cancellation, and returned to Settings. Duplicate, delayed, created, updated, and deleted event handling and final entitlement downgrade remain covered by the API lifecycle evidence above. Optional 3DS remains untested. Exact identifiers and processing evidence are recorded in [the staging UI billing runbook](../runbooks/staging-ui-billing-20260906.md).

Candidate `cf7e9fee` also passed the explicit-cancellation display case. For a `trialing` subscription with `cancel_at` equal to `current_period_end` and `cancel_at_period_end=false`, both Settings surfaces showed **Access ends**, the September 13 date, and **Keep Pro**.

Reactivation on `cf7e9fee` failed after successful password reauthentication. Vercel returned HTTP 500 because Stripe request `req_83iaFtD4bk29o3` received both `cancel_at_period_end` and `cancel_at`; Stripe rejected the request with `StripeInvalidRequestError` and supplied no `code` or `param`. A locally tested route correction now sends only `cancel_at: null` for this explicit-date state, but it still requires deployment and a fresh browser recheck before reactivation can pass this gate.

The failed browser fixture was cleaned up under exact TEST-account, customer, subscription, user, metadata, and run-ID guards. Subscription `sub_1UCnbmEGJUB78L7nBviwSiZK` is canceled; deletion event `evt_1UCnn3EGJUB78L7naSvJ71Y0` processed once with a cleared lease and no error; the database and authenticated hosted profile are Free with `pro_access=false`; and the staging customer has zero nonterminal subscriptions. The pre-cleanup state is preserved mode `0600` at `.vercel/staging-settings-reactivate-failed-cf7e9fee.json`.
