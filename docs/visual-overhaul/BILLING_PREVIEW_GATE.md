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

The owner subsequently approved staging testing at $0.01344/hour (about $0.32/day). The current isolated branch is `fkqsjjiunvvclwtgjqyc`; its repaired replay records all 180 source migrations and the database is healthy. The provider's branch lifecycle still reports the earlier automatic replay failure, so that status is not being represented as green. No production users or payments were copied. Setup evidence and repair details are being recorded in `docs/runbooks/staging-setup-evidence.md`.

The additive migration `20260906120000_stripe_event_processing_state.sql` introduces fenced event-processing claims and once-only payment-failure increments. Hosted staging transaction checks pass. The staging audit found explicit `anon` and `authenticated` execution grants that survived revoking `PUBLIC`; staging now restricts these RPCs to `service_role`, and the additive repair `20260906130000_restrict_stripe_event_processing_rpc_access.sql` and transactional PostgreSQL regression pass (14 focused tests total). Preview environment isolation must be verified before registering a test webhook. Complete checkout/portal/entitlement journeys remain open. Production billing configuration and entitlements remain untouched by the preview test setup.

The staging-bound runtime now returns the correct synthetic user from `/api/profile` and verified test prices from `/api/billing/prices`. Missing dunning-status schema is repaired by `20260906140000_profiles_subscription_status.sql`. Checkout preflight exposed Stripe's automatic-tax requirement for persisting a collected address on the pre-created customer; candidate `2c1a0bd6` adds `customer_update.address=auto` only when a customer ID is supplied. The test endpoint is registered and disabled; no successful checkout or genuine delivery has yet passed. The candidate containing this fix, the endpoint secret, and isolated analytics configuration is awaiting hosted verification.

Hosted checkout API creation now passes on `2c1a0bd6`, including the configured test price, staging customer persistence, preview return URLs, and identical retry session. Genuine created, duplicate, delayed, and deleted Stripe events reached the enabled dedicated endpoint. The first lifecycle run found stale profile mirrors after regular cancellation and stopped; its test subscription is canceled. The forward handler repair also protects distinct newer Pro and Analytics subscriptions from old deletion events. It passes the production build and focused tests; the clean hosted cancellation rerun and browser checkout/portal checks remain required.
